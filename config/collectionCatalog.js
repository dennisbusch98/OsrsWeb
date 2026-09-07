const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'collectionSets.json'), 'utf-8');
module.exports = JSON.parse(raw);
