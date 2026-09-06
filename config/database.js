// Real MySQL connection via Sequelize. All connection info comes from
// environment variables so the exact same code runs locally (.env.local)
// and on Render (env vars set in the dashboard) - only the values differ.

const { Sequelize } = require('sequelize');

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_NAME = 'osrs',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_SSL = 'false'
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: false,
  dialectOptions: DB_SSL === 'true'
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  define: {
    // sensible defaults for every model
    timestamps: true,
    underscored: true
  }
});

module.exports = sequelize;
