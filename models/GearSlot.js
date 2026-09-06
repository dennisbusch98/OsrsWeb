const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// One row per (character, combat style, equipment slot). This is what
// powers the 3 gear sub-tabs (Melee / Range / Magic) on each character page -
// every style has its own independent loadout, exactly like switching
// gear setups on the Wiki's DPS calculator.
const GearSlot = sequelize.define('GearSlot', {
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
  style: {
    type: DataTypes.ENUM('melee', 'range', 'magic'),
    allowNull: false
  },
  slot: {
    type: DataTypes.ENUM(
      'head', 'cape', 'neck', 'ammo', 'weapon',
      'shield', 'body', 'legs', 'hands', 'feet', 'ring'
    ),
    allowNull: false
  },
  itemName: {
    type: DataTypes.STRING(120),
    allowNull: true,
    field: 'item_name'
  }
}, {
  tableName: 'gear_slots',
  indexes: [
    { unique: true, fields: ['character_id', 'style', 'slot'] }
  ]
});

module.exports = GearSlot;
