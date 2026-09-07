const { BankItem, Character } = require('../models');

async function getBank(characterId) {
  const rows = await BankItem.findAll({ where: { characterId: characterId.toLowerCase() } });
  return rows.map(r => r.itemName);
}

async function addItem(characterId, itemName) {
  const clean = String(itemName || '').trim().slice(0, 120);
  if (!clean) {
    const e = new Error('Item-navn kan ikke være tomt.');
    e.status = 400;
    throw e;
  }
  const character = await Character.findByPk(characterId.toLowerCase());
  if (!character) {
    const e = new Error('Fant ikke karakteren.');
    e.status = 404;
    throw e;
  }
  await BankItem.findOrCreate({ where: { characterId: character.id, itemName: clean } });
  return getBank(character.id);
}

// Bulk-add many items at once, e.g. from a parsed collection log export file.
async function bulkAdd(characterId, itemNames) {
  const character = await Character.findByPk(characterId.toLowerCase());
  if (!character) {
    const e = new Error('Fant ikke karakteren.');
    e.status = 404;
    throw e;
  }
  const clean = [...new Set((itemNames || []).map(n => String(n || '').trim().slice(0, 120)).filter(Boolean))];
  for (const name of clean) {
    await BankItem.findOrCreate({ where: { characterId: character.id, itemName: name } });
  }
  return getBank(character.id);
}

async function removeItem(characterId, itemName) {
  await BankItem.destroy({ where: { characterId: characterId.toLowerCase(), itemName } });
  return getBank(characterId);
}

module.exports = { getBank, addItem, removeItem, bulkAdd };