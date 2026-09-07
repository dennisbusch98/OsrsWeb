const bankService = require('../services/bankService');

async function getBank(req, res, next) {
  try {
    res.json(await bankService.getBank(req.params.characterId));
  } catch (err) { next(err); }
}

async function addItem(req, res, next) {
  try {
    res.json(await bankService.addItem(req.params.characterId, req.body.itemName));
  } catch (err) { next(err); }
}

async function removeItem(req, res, next) {
  try {
    res.json(await bankService.removeItem(req.params.characterId, req.params.itemName));
  } catch (err) { next(err); }
}

async function bulkAdd(req, res, next) {
  try {
    res.json(await bankService.bulkAdd(req.params.characterId, req.body.itemNames));
  } catch (err) { next(err); }
}

module.exports = { getBank, addItem, removeItem, bulkAdd };