const postService = require('../services/postService');
const { User } = require('../models');

async function getFeed(req, res, next) {
  try {
    const options = { type: req.query.type, characterId: req.query.characterId };
    if (req.user) options.userId = req.user.userId;
    res.json(await postService.getFeed(options));
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
    res.json(await postService.findChatByTag(req.params.tag, req.query.since));
  } catch (err) { next(err); }
}

async function toggleLike(req, res, next) {
  try {
    res.json(await postService.toggleLike(req.params.postId, req.user.userId));
  } catch (err) { next(err); }
}

async function getComments(req, res, next) {
  try {
    res.json(await postService.getComments(req.params.postId));
  } catch (err) { next(err); }
}

async function addComment(req, res, next) {
  try {
    const user = await User.findByPk(req.user.userId);
    const comment = await postService.addComment({
      postId: req.params.postId,
      authorId: req.user.userId,
      authorName: user ? user.username : req.user.username,
      content: req.body.content
    });
    res.status(201).json(comment);
  } catch (err) { next(err); }
}

async function deleteComment(req, res, next) {
  try {
    res.json(await postService.deleteComment(req.params.commentId, req.user.userId));
  } catch (err) { next(err); }
}

module.exports = {
  getFeed, createPost, deletePost, getByTag,
  toggleLike, getComments, addComment, deleteComment
};