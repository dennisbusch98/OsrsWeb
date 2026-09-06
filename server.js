// Loads .env.local first (for local development against your own MySQL),
// falling back to .env (what you'll use in production, e.g. on Render).
const fs = require('fs');
const path = require('path');
const envLocalPath = path.join(__dirname, '.env.local');
require('dotenv').config({ path: fs.existsSync(envLocalPath) ? envLocalPath : path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { sequelize } = require('./models');
const { runSeed } = require('./seed/seed');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET er ikke satt - kopier .env.example til .env (eller .env.local) og sett en hemmelig verdi!');
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// ----- API -----
app.use('/api', apiRoutes);

// ----- Static frontend + uploaded loot screenshots -----
app.use(express.static(path.join(__dirname, 'public')));

// Anything not matched by a static file or the API falls back to the login page.
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use('/api', notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('🛢️  Koblet til MySQL.');

    // For a small clan app, sync({ alter: true }) is fine - it keeps the
    // tables in step with the models automatically. If this ever grows
    // into something bigger, swap this for real sequelize-cli migrations.
    await sequelize.sync({ alter: true });
    console.log('📐 Databasetabeller synkronisert.');

    await runSeed();

    app.listen(PORT, () => {
      console.log(`⚔️  Stuck of Amascut server kjører på http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Klarte ikke å starte serveren:', err.message);
    console.error('   Sjekk at MySQL kjører og at DB_HOST/DB_USER/DB_PASSWORD/DB_NAME i .env(.local) stemmer.');
    process.exit(1);
  }
}

start();
