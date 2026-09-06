const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// One row per (post, user) - existence of a row means "this user likes this post".
const PostLike = sequelize.define('PostLike', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'post_id'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  }
}, {
  tableName: 'post_likes',
  indexes: [
    { unique: true, fields: ['post_id', 'user_id'] }
  ]
});

module.exports = PostLike;
