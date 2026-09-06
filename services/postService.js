const { Post } = require('../models');

async function getFeed() {
  const posts = await Post.findAll({ order: [['createdAt', 'DESC']], limit: 200 });
  return posts.map(p => p.toJSON());
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

module.exports = { getFeed, createPost, deletePost };
