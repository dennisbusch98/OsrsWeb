const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: true, // null for system posts
    field: 'author_id'
  },
  authorName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'author_name'
  },
  characterId: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'character_id'
  },
  type: {
    type: DataTypes.ENUM('post', 'loot', 'system'),
    allowNull: false,
    defaultValue: 'post'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    field: 'image_url'
  }
}, {
  tableName: 'posts'
});

module.exports = Post;
