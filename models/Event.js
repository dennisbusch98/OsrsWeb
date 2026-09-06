const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  datetime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by'
  },
  tag: {
    // Optional short tag (e.g. "toa") - chat messages containing "-toa-"
    // get linked to this event and shown in its chat modal.
    type: DataTypes.STRING(30),
    allowNull: true
  }
}, {
  tableName: 'events'
});

module.exports = Event;