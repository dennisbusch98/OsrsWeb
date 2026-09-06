const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/characters', require('./characterRoutes'));
router.use('/posts', require('./postRoutes'));
router.use('/events', require('./eventRoutes'));
router.use('/webhook', require('./webhookRoutes'));

module.exports = router;
