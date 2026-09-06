const characterService = require('../services/characterService');
const gearService = require('../services/gearService');
const hiscoreService = require('../services/hiscoreService');
const { Character } = require('../models');

async function listCharacters(req, res, next) {
  try {
    res.json(await characterService.getAllCharacters());
  } catch (err) { next(err); }
}

async function getCharacter(req, res, next) {
  try {
    res.json(await characterService.getCharacter(req.params.characterId));
  } catch (err) { next(err); }
}

async function getGear(req, res, next) {
  try {
    res.json(await gearService.getGearForCharacter(req.params.characterId));
  } catch (err) { next(err); }
}

async function updateGear(req, res, next) {
  try {
    const { style } = req.params;
    const updated = await gearService.setGearForStyle(req.params.characterId, style, req.body.gear || {});
    res.json(updated);
  } catch (err) { next(err); }
}

// Pulls a character's OSRS hiscores by RSN. Falls back to the character's
// display name as the RSN if none has been set/supplied yet.
async function refreshStats(req, res, next) {
  try {
    const character = await Character.findByPk(req.params.characterId.toLowerCase());
    if (!character) return res.status(404).json({ error: 'Fant ikke karakteren.' });

    const rsn = (req.body && req.body.rsn) || character.rsn || character.displayName;
    const hiscores = await hiscoreService.fetchHiscores(rsn);

    await characterService.setRsn(character.id, rsn);
    const updated = await characterService.updateStats(character.id, hiscores);
    res.json(updated);
  } catch (err) { next(err); }
}

module.exports = { listCharacters, getCharacter, getGear, updateGear, refreshStats };
