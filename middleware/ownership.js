// Blocks the request unless the logged-in user owns the :characterId
// route param. Prevents e.g. Cryqt's player from editing Guniit's gear.
function requireOwnCharacter(req, res, next) {
  const paramCharacter = (req.params.characterId || '').toLowerCase();
  if (!req.user || req.user.characterId !== paramCharacter) {
    return res.status(403).json({
      error: 'Du eier ikke denne karakteren, så du kan ikke endre den.'
    });
  }
  next();
}

module.exports = { requireOwnCharacter };
