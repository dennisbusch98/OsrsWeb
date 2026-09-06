const { GearSlot, Character } = require('../models');

const VALID_STYLES = ['melee', 'range', 'magic'];
const VALID_SLOTS = [
  'head', 'cape', 'neck', 'ammo', 'weapon',
  'shield', 'body', 'legs', 'hands', 'feet', 'ring'
];

// Returns { melee: {head: 'Torva full helm', ...}, range: {...}, magic: {...} }
async function getGearForCharacter(characterId) {
  const rows = await GearSlot.findAll({ where: { characterId: characterId.toLowerCase() } });
  const result = { melee: {}, range: {}, magic: {} };
  rows.forEach(row => {
    if (row.itemName) result[row.style][row.slot] = row.itemName;
  });
  return result;
}

async function setGearForStyle(characterId, style, gear) {
  if (!VALID_STYLES.includes(style)) {
    const e = new Error('Ugyldig stil. Må være melee, range eller magic.');
    e.status = 400;
    throw e;
  }

  const character = await Character.findByPk(characterId.toLowerCase());
  if (!character) {
    const e = new Error('Fant ikke karakteren.');
    e.status = 404;
    throw e;
  }

  const upserts = VALID_SLOTS
    .filter(slot => Object.prototype.hasOwnProperty.call(gear || {}, slot))
    .map(slot => {
      const itemName = gear[slot] ? String(gear[slot]).slice(0, 120) : null;
      return GearSlot.upsert({
        characterId: character.id,
        style,
        slot,
        itemName
      });
    });

  await Promise.all(upserts);
  return getGearForCharacter(character.id);
}

module.exports = { getGearForCharacter, setGearForStyle, VALID_STYLES, VALID_SLOTS };
