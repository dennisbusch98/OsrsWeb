// Creates the 5 fixed clan characters (and a welcome post) the first time
// the app boots against a fresh database. Safe to run on every startup -
// it only inserts rows that don't exist yet.

const { Character, Post } = require('../models');

const CHARACTERS = [
  { id: 'xenopixie',   displayName: 'Xenopixie',   defaultStyle: 'range' },
  { id: 'deviousrunt', displayName: 'Deviousrunt',  defaultStyle: 'melee' },
  { id: 'cryqt',       displayName: 'Cryqt',        defaultStyle: 'magic' },
  { id: 'guniit',      displayName: 'Guniit',       defaultStyle: 'melee' },
  { id: 'lilljiy',     displayName: 'Lilljiy',      defaultStyle: 'range' }
];

async function runSeed() {
  for (const c of CHARACTERS) {
    await Character.findOrCreate({ where: { id: c.id }, defaults: c });
  }

  const welcomeExists = await Post.findOne({ where: { authorName: 'Stuck of Amascut' } });
  if (!welcomeExists) {
    await Post.create({
      authorId: null,
      authorName: 'Stuck of Amascut',
      characterId: null,
      type: 'system',
      content: 'Velkommen til Stuck of Amascut sin hjemmeside! Registrer deg og velg din karakter for å komme i gang. GL på droppene noobs.'
    });
  }

  console.log('🌱 Seed sjekket/kjørt (5 karakterer + velkomstpost).');
}

module.exports = { runSeed, CHARACTERS };
