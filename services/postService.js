const { Post } = require('../models');

async function getFeed(type) {
  const where = type ? { type } : {};
  const posts = await Post.findAll({ where, order: [['createdAt', 'DESC']], limit: 200 });
  return posts.map(p => p.toJSON());
}

// Used by the chat webhook to avoid showing the same clan chat line
// multiple times when several members all have the plugin forwarding it.
async function findRecentDuplicate({ authorName, content, type, withinSeconds = 15 }) {
  const since = new Date(Date.now() - withinSeconds * 1000);
  const { Op } = require('sequelize');
  return Post.findOne({
    where: {
      type,
      authorName,
      content,
      createdAt: { [Op.gte]: since }
    }
  });
}

async function createPost({ authorId, authorName, characterId, content, imageUrl, type }) {
  if (!content || !content.trim()) {
    const e = new Error('Innlegget kan ikke være tomt.');
    e.status = 400;
    throw e;
  }
  const post = await Post.create({
    authorId: authorId || null,
    authorName,
    characterId: characterId || null,
    type: type || 'post',
    content: content.trim().slice(0, 2000),
    imageUrl: imageUrl || null
  });
  return post.toJSON();
}

async function deletePost(postId, userId) {
  const post = await Post.findByPk(postId);
  if (!post) {
    const e = new Error('Fant ikke innlegget.');
    e.status = 404;
    throw e;
  }
  if (post.authorId !== userId) {
    const e = new Error('Du kan bare slette dine egne innlegg.');
    e.status = 403;
    throw e;
  }
  await post.destroy();
  return { ok: true };
}


// Chat messages tagged for a specific event, e.g. content containing "-toa-"
// for a tag of "toa". Case-insensitive substring match.
async function findChatByTag(tag) {
  const { Op } = require('sequelize');
  const pattern = `%-${tag.toLowerCase()}-%`;
  const posts = await Post.findAll({
    where: {
      type: 'chat',
      content: { [Op.like]: pattern }
    },
    order: [['createdAt', 'ASC']],
    limit: 500
  });
  return posts.map(p => p.toJSON());
}

module.exports = { getFeed, createPost, deletePost, findRecentDuplicate, findChatByTag };