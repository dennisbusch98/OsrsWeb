const { Character, User, GearSlot } = require('../models');

async function getAllCharacters() {
  const characters = await Character.findAll({
    include: [{ model: User, as: 'owner', attributes: ['id'] }],
    order: [['displayName', 'ASC']]
  });
  return characters.map(sanitize);
}

async function getCharacter(id) {
  const character = await Character.findByPk(id.toLowerCase(), {
    include: [{ model: User, as: 'owner', attributes: ['id'] }]
  });
  if (!character) {
    const e = new Error('Fant ikke karakteren.');
    e.status = 404;
    throw e;
  }
  return sanitize(character);
}

function sanitize(character) {
  const plain = character.toJSON();
  const claimed = !!plain.owner;
  delete plain.owner;
  return { ...plain, claimed };
}

async function updateStats(id, hiscores) {
  const character = await Character.findByPk(id.toLowerCase());
  if (!character) {
    const e = new Error('Fant ikke karakteren.');
    e.status = 404;
    throw e;
  }
  character.stats = hiscores;
  character.bossCounts = hiscores.bossCounts;
  character.statsUpdatedAt = new Date();
  await character.save();
  return getCharacter(id);
}

async function setRsn(id, rsn) {
  await Character.update({ rsn }, { where: { id: id.toLowerCase() } });
}

module.exports = { getAllCharacters, getCharacter, updateStats, setRsn };
