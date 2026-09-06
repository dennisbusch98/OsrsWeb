const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Character } = require('../models');

const SALT_ROUNDS = 10;

async function getAvailableCharacters() {
  const characters = await Character.findAll({
    include: [{ model: User, as: 'owner', required: false }],
    attributes: ['id', 'displayName', 'defaultStyle']
  });
  return characters
    .filter(c => !c.owner)
    .map(c => ({ id: c.id, displayName: c.displayName, combatStyle: c.defaultStyle }));
}

async function register({ username, password, characterId }) {
  if (!username || !password || !characterId) {
    const e = new Error('Brukernavn, passord og karakter er påkrevd.');
    e.status = 400;
    throw e;
  }
  if (password.length < 6) {
    const e = new Error('Passordet må være minst 6 tegn.');
    e.status = 400;
    throw e;
  }

  const normalizedUsername = username.toLowerCase().trim();
  const existingUser = await User.findOne({ where: { username: normalizedUsername } });
  if (existingUser) {
    const e = new Error('Det brukernavnet er allerede tatt.');
    e.status = 409;
    throw e;
  }

  const character = await Character.findByPk(characterId.toLowerCase(), {
    include: [{ model: User, as: 'owner' }]
  });
  if (!character) {
    const e = new Error('Ukjent karakter.');
    e.status = 404;
    throw e;
  }
  if (character.owner) {
    const e = new Error(`${character.displayName} er allerede tatt av en annen bruker.`);
    e.status = 409;
    throw e;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    username: normalizedUsername,
    passwordHash,
    characterId: character.id
  });

  return buildAuthResponse(user);
}

async function login({ username, password }) {
  const user = await User.findOne({ where: { username: (username || '').toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    const e = new Error('Feil brukernavn eller passord.');
    e.status = 401;
    throw e;
  }
  return buildAuthResponse(user);
}

function buildAuthResponse(user) {
  const token = jwt.sign(
    { userId: user.id, username: user.username, characterId: user.characterId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return {
    token,
    user: { id: user.id, username: user.username, characterId: user.characterId }
  };
}

module.exports = { getAvailableCharacters, register, login };
