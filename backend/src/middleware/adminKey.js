const { config } = require('../config');

function requireAdminApiKey(req, res, next) {
  const key = req.header('ADMIN_API_KEY') || req.header('x-admin-api-key');
  if (!key || key !== config.adminApiKey) {
    return res.status(401).json({ error: 'Invalid ADMIN_API_KEY' });
  }

  req.adminAuth = true;
  return next();
}

module.exports = { requireAdminApiKey };
