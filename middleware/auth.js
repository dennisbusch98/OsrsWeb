const jwt = require('jsonwebtoken');

// Verifies the Authorization: Bearer <token> header and attaches
// { userId, username, characterId } to req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Mangler innloggingstoken.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Ugyldig eller utløpt token.' });
  }
}

// Optional auth: attaches req.user if a valid token is present, but
// never blocks the request. Useful for public GET endpoints that
// personalise the response a bit (e.g. "is this my post?").
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // ignore bad token on optional routes
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
