const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { requireAuth } = require('../middleware/auth');

router.get('/', postController.getFeed);
router.get('/by-tag/:tag', postController.getByTag);
router.post('/', requireAuth, postController.createPost);
router.delete('/:postId', requireAuth, postController.deletePost);

module.exports = router;