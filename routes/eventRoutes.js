const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { requireAuth } = require('../middleware/auth');

router.get('/', eventController.getEvents);
router.post('/', requireAuth, eventController.createEvent);
router.delete('/:eventId', requireAuth, eventController.deleteEvent);

module.exports = router;
