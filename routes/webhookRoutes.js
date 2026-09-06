const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Use this one in RuneLite's Webhook setting - handles loot AND achievements.
router.post('/event/:characterId/:secret', webhookController.receiveWebhookEvent);

// Old path kept working so any existing setup doesn't break.
router.post('/loot/:characterId/:secret', webhookController.receiveWebhookEvent);

module.exports = router;