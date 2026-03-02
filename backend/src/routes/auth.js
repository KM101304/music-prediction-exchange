const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { config } = require('../config');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
  displayName: z.string().min(2).max(60),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(payload.password, 12);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertUser = await client.query(
        `INSERT INTO users (email, password_hash, display_name, role)
         VALUES ($1,$2,$3,'USER')
         RETURNING id, email, display_name, role`,
        [normalizedEmail, passwordHash, payload.displayName.trim()]
      );

      const user = insertUser.rows[0];
      const walletInsert = await client.query(
        `INSERT INTO wallets (user_id, credits_balance)
         VALUES ($1,$2)
         RETURNING credits_balance`,
        [user.id, config.startingCredits]
      );

      await client.query(
        `INSERT INTO ledger (user_id, market_id, entry_type, amount_credits, balance_after, metadata)
         VALUES ($1,NULL,'SIGNUP_CREDITS',$2,$2,$3::jsonb)`,
        [user.id, config.startingCredits, JSON.stringify({ reason: 'Initial credits' })]
      );

      await client.query('COMMIT');

      const token = signToken(user);
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          creditsBalance: Number(walletInsert.rows[0].credits_balance),
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request body', details: error.issues });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase().trim();

    const result = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.role, u.password_hash, w.credits_balance
       FROM users u
       JOIN wallets w ON w.user_id = u.id
       WHERE u.email = $1`,
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordOk = await bcrypt.compare(payload.password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        creditsBalance: Number(user.credits_balance),
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request body', details: error.issues });
    }
    return next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.role, w.credits_balance
       FROM users u
       JOIN wallets w ON w.user_id = u.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    return res.json({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      creditsBalance: Number(row.credits_balance),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
