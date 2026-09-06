const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  // FK is also declared via association in models/index.js, but keeping
  // the column explicit here makes the table self-documenting.
  characterId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true, // one user per character - enforced at the DB level too
    field: 'character_id'
  }
}, {
  tableName: 'users'
});

module.exports = User;
