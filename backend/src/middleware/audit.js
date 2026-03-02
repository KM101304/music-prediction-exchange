const { pool } = require('../db/pool');

function auditLogger(req, res, next) {
  const started = Date.now();

  res.on('finish', async () => {
    const userId = req.user?.userId ?? null;
    const actorType = req.adminAuth ? 'ADMIN_API_KEY' : userId ? 'USER' : 'ANONYMOUS';

    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, actor_type, method, path, status_code, ip_address, user_agent, request_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          userId,
          actorType,
          req.method,
          req.originalUrl,
          res.statusCode,
          req.ip,
          req.get('user-agent') || null,
          req.get('x-request-id') || `${Date.now()}-${Math.round(Math.random() * 100000)}`,
        ]
      );
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('audit logger failed', error.message, { durationMs: Date.now() - started });
      }
    }
  });

  next();
}

module.exports = { auditLogger };
