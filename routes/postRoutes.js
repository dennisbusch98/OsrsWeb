const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, postController.getFeed);
router.get('/by-tag/:tag', postController.getByTag);
router.post('/', requireAuth, postController.createPost);
router.delete('/:postId', requireAuth, postController.deletePost);

router.post('/:postId/like', requireAuth, postController.toggleLike);
router.get('/:postId/comments', postController.getComments);
router.post('/:postId/comments', requireAuth, postController.addComment);
router.delete('/comments/:commentId', requireAuth, postController.deleteComment);

module.exports = router;
