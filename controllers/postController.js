const postService = require('../services/postService');
const { User } = require('../models');

async function getFeed(req, res, next) {
  try {
    res.json(await postService.getFeed(req.query.type));
  } catch (err) { next(err); }
}

async function createPost(req, res, next) {
  try {
    const user = await User.findByPk(req.user.userId);
    const post = await postService.createPost({
      authorId: req.user.userId,
      authorName: user ? user.username : req.user.username,
      characterId: req.body.postAsCharacter ? req.user.characterId : null,
      content: req.body.content,
      imageUrl: req.body.imageUrl,
      type: req.body.type === 'loot' ? 'loot' : 'post'
    });
    res.status(201).json(post);
  } catch (err) { next(err); }
}

async function deletePost(req, res, next) {
  try {
    res.json(await postService.deletePost(req.params.postId, req.user.userId));
  } catch (err) { next(err); }
}

async function getByTag(req, res, next) {
  try {
    res.json(await postService.findChatByTag(req.params.tag));
  } catch (err) { next(err); }
}

module.exports = { getFeed, createPost, deletePost, getByTag };