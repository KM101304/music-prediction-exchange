const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { config } = require('./config');
const authRoutes = require('./routes/auth');
const marketsRoutes = require('./routes/markets');
const meRoutes = require('./routes/me');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');
const { auditLogger } = require('./middleware/audit');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(auditLogger);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRoutes);
app.use('/markets', marketsRoutes);
app.use('/me', meRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
