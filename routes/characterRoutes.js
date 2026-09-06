const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const { requireAuth } = require('../middleware/auth');
const { requireOwnCharacter } = require('../middleware/ownership');
const gearCatalog = require('../config/gearCatalog');
const monsterCatalog = require('../config/monsterCatalog');

router.get('/gear-catalog', (req, res) => res.json(gearCatalog));
router.get('/monster-catalog', (req, res) => res.json(monsterCatalog));
router.get('/', characterController.listCharacters);
router.get('/:characterId', characterController.getCharacter);
router.get('/:characterId/gear', characterController.getGear);

// Only the owning, logged-in player may change their own gear or pull new stats.
// :style is one of melee | range | magic - each character has 3 independent loadouts.
router.put('/:characterId/gear/:style', requireAuth, requireOwnCharacter, characterController.updateGear);
router.post('/:characterId/stats/refresh', requireAuth, requireOwnCharacter, characterController.refreshStats);

module.exports = router;
