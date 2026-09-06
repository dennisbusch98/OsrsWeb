const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'monsters.json'), 'utf-8');
module.exports = JSON.parse(raw);
