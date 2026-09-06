const authService = require('../services/authService');

async function listAvailableCharacters(req, res, next) {
  try {
    res.json(await authService.getAvailableCharacters());
  } catch (err) { next(err); }
}

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { listAvailableCharacters, register, login, me };
