const express = require('express');
const authRoutes = require('./routes/auth');
const marketsRoutes = require('./routes/markets');
const meRoutes = require('./routes/me');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();

app.use(express.json());

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
