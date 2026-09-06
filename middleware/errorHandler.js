function notFound(req, res, next) {
  res.status(404).json({ error: `Fant ikke ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Noe gikk galt på serveren.'
  });
}

module.exports = { notFound, errorHandler };
