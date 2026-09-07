const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// One row per (character, item name) - existence of a row means "this
// character's bank/collection contains this item". Powers both the manual
// Bank tab and the auto-computed green/red Collection Log tabs.
const BankItem = sequelize.define('BankItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  characterId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'character_id'
  },
  itemName: {
    type: DataTypes.STRING(120),
    allowNull: false,
    field: 'item_name'
  }
}, {
  tableName: 'bank_items',
  indexes: [
    { unique: true, fields: ['character_id', 'item_name'] }
  ]
});

module.exports = BankItem;
