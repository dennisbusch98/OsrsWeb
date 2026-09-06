const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'gearItems.json'), 'utf-8');
const catalog = JSON.parse(raw);

module.exports = catalog;
