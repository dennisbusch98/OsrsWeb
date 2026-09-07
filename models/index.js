// Central place that wires up every model + their associations.
// Import { sequelize, User, Character, GearSlot, Post, Event, PostLike, Comment }
// from here everywhere else in the app instead of requiring the individual files.

const sequelize = require('../config/database');
const User = require('./User');
const Character = require('./Character');
const GearSlot = require('./GearSlot');
const Post = require('./Post');
const Event = require('./Event');
const PostLike = require('./PostLike');
const Comment = require('./Comment');
const BankItem = require('./BankItem');

// Character <-> User (one character has at most one owner/player)
Character.hasOne(User, { foreignKey: 'characterId', as: 'owner' });
User.belongsTo(Character, { foreignKey: 'characterId', as: 'character' });

// Character -> GearSlot (one character has many gear slot rows, 11 per style)
Character.hasMany(GearSlot, { foreignKey: 'characterId', as: 'gearSlots' });
GearSlot.belongsTo(Character, { foreignKey: 'characterId' });

// Character -> BankItem (manually maintained "I own this" list)
Character.hasMany(BankItem, { foreignKey: 'characterId', as: 'bankItems' });
BankItem.belongsTo(Character, { foreignKey: 'characterId' });

// Post -> author (User) and optionally the character it was posted as
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Character.hasMany(Post, { foreignKey: 'characterId', as: 'posts' });
Post.belongsTo(Character, { foreignKey: 'characterId' });

// Post <-> likes/comments
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });
PostLike.belongsTo(Post, { foreignKey: 'postId' });
User.hasMany(PostLike, { foreignKey: 'userId', as: 'postLikes' });
PostLike.belongsTo(User, { foreignKey: 'userId' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId' });
User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Event -> creator (User)
User.hasMany(Event, { foreignKey: 'createdBy', as: 'events' });
Event.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = { sequelize, User, Character, GearSlot, Post, Event, PostLike, Comment, BankItem };
