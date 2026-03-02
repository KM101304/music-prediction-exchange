function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(error, _req, res, _next) {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
