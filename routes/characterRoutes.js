const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const { requireAuth } = require('../middleware/auth');
const { requireOwnCharacter } = require('../middleware/ownership');
const gearCatalog = require('../config/gearCatalog');
const monsterCatalog = require('../config/monsterCatalog');
const collectionCatalog = require('../config/collectionCatalog');
const bankController = require('../controllers/bankController');

router.get('/gear-catalog', (req, res) => res.json(gearCatalog));
router.get('/monster-catalog', (req, res) => res.json(monsterCatalog));
router.get('/collection-catalog', (req, res) => res.json(collectionCatalog));
router.get('/', characterController.listCharacters);
router.get('/:characterId', characterController.getCharacter);
router.get('/:characterId/gear', characterController.getGear);

// Gear can only be changed by the owning player. Stats refresh, however, is
// opened up to any logged-in clan member - it's just re-pulling public
// hiscore data for display, so anyone viewing a character's tab should be
// able to trigger (or benefit from an auto-trigger of) a refresh, not just
// that character's own account holder.
// :style is one of melee | range | magic - each character has 3 independent loadouts.
router.put('/:characterId/gear/:style', requireAuth, requireOwnCharacter, characterController.updateGear);
router.post('/:characterId/stats/refresh', requireAuth, characterController.refreshStats);

// Bank - viewable by anyone, but only the owner can add/remove items.
router.get('/:characterId/bank', bankController.getBank);
router.post('/:characterId/bank', requireAuth, requireOwnCharacter, bankController.addItem);
router.post('/:characterId/bank/import', requireAuth, requireOwnCharacter, bankController.bulkAdd);
router.delete('/:characterId/bank/:itemName', requireAuth, requireOwnCharacter, bankController.removeItem);

module.exports = router;