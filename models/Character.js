const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Character = sequelize.define('Character', {
  id: {
    // slug, e.g. "cryqt" - used directly in URLs
    type: DataTypes.STRING(30),
    primaryKey: true
  },
  displayName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'display_name'
  },
  rsn: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  defaultStyle: {
    type: DataTypes.ENUM('melee', 'range', 'magic'),
    allowNull: false,
    defaultValue: 'melee',
    field: 'default_style'
  },
  stats: {
    // full parsed hiscores payload (skills/activities), refreshed on demand
    type: DataTypes.JSON,
    allowNull: true
  },
  bossCounts: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'boss_counts'
  },
  statsUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'stats_updated_at'
  }
}, {
  tableName: 'characters'
});

module.exports = Character;
