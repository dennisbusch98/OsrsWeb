const { Post, PostLike, Comment } = require('../models');
const { Op } = require('sequelize');

// options: { type, characterId, userId } - userId is the CURRENT viewer,
// used only to compute "likedByMe" per post, not to filter anything.
async function getFeed(options = {}) {
  const { type, characterId, userId } = options;
  const where = {};
  if (type) where.type = type;
  if (characterId) where.characterId = characterId;

  const posts = await Post.findAll({ where, order: [['createdAt', 'DESC']], limit: 200 });
  const postIds = posts.map(p => p.id);
  if (postIds.length === 0) return [];

  const [likeCounts, commentCounts, myLikes] = await Promise.all([
    PostLike.findAll({
      where: { postId: { [Op.in]: postIds } },
      attributes: ['postId', [Post.sequelize.fn('COUNT', '*'), 'count']],
      group: ['postId']
    }),
    Comment.findAll({
      where: { postId: { [Op.in]: postIds } },
      attributes: ['postId', [Post.sequelize.fn('COUNT', '*'), 'count']],
      group: ['postId']
    }),
    userId
      ? PostLike.findAll({ where: { postId: { [Op.in]: postIds }, userId } })
      : Promise.resolve([])
  ]);

  const likeCountMap = Object.fromEntries(likeCounts.map(r => [r.postId, Number(r.get('count'))]));
  const commentCountMap = Object.fromEntries(commentCounts.map(r => [r.postId, Number(r.get('count'))]));
  const likedSet = new Set(myLikes.map(l => l.postId));

  return posts.map(p => ({
    ...p.toJSON(),
    likeCount: likeCountMap[p.id] || 0,
    commentCount: commentCountMap[p.id] || 0,
    likedByMe: likedSet.has(p.id)
  }));
}

// Used by the chat webhook to avoid showing the same clan chat line
// multiple times when several members all have the plugin forwarding it.
async function findRecentDuplicate({ authorName, content, type, withinSeconds = 15 }) {
  const since = new Date(Date.now() - withinSeconds * 1000);
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
// for a tag of "toa". Case-insensitive substring match. Only messages sent
// AFTER the event was created are included (via "since") - otherwise old,
// unrelated chat history that happens to contain the same tag text would
// show up too, which is irrelevant noise.
async function findChatByTag(tag, since) {
  const pattern = `%-${tag.toLowerCase()}-%`;
  const where = {
    type: 'chat',
    content: { [Op.like]: pattern }
  };
  if (since && !isNaN(Date.parse(since))) {
    where.createdAt = { [Op.gte]: new Date(since) };
  }
  const posts = await Post.findAll({
    where,
    order: [['createdAt', 'ASC']],
    limit: 500
  });
  return posts.map(p => p.toJSON());
}

// ===== Likes =====
// Toggle: like it if not already liked, unlike if already liked. Returns
// the new state so the frontend can update without a second round trip.
async function toggleLike(postId, userId) {
  const post = await Post.findByPk(postId);
  if (!post) {
    const e = new Error('Fant ikke innlegget.');
    e.status = 404;
    throw e;
  }

  const existing = await PostLike.findOne({ where: { postId, userId } });
  if (existing) {
    await existing.destroy();
  } else {
    await PostLike.create({ postId, userId });
  }

  const likeCount = await PostLike.count({ where: { postId } });
  return { liked: !existing, likeCount };
}

// ===== Comments =====
async function getComments(postId) {
  const comments = await Comment.findAll({ where: { postId }, order: [['createdAt', 'ASC']] });
  return comments.map(c => c.toJSON());
}

async function addComment({ postId, authorId, authorName, content }) {
  if (!content || !content.trim()) {
    const e = new Error('Kommentaren kan ikke være tom.');
    e.status = 400;
    throw e;
  }
  const post = await Post.findByPk(postId);
  if (!post) {
    const e = new Error('Fant ikke innlegget.');
    e.status = 404;
    throw e;
  }
  const comment = await Comment.create({
    postId,
    authorId,
    authorName,
    content: content.trim().slice(0, 1000)
  });
  return comment.toJSON();
}

async function deleteComment(commentId, userId) {
  const comment = await Comment.findByPk(commentId);
  if (!comment) {
    const e = new Error('Fant ikke kommentaren.');
    e.status = 404;
    throw e;
  }
  if (comment.authorId !== userId) {
    const e = new Error('Du kan bare slette dine egne kommentarer.');
    e.status = 403;
    throw e;
  }
  await comment.destroy();
  return { ok: true };
}

module.exports = {
  getFeed, createPost, deletePost, findRecentDuplicate, findChatByTag,
  toggleLike, getComments, addComment, deleteComment
};