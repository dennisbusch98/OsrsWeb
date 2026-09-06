// Stats come from Wise Old Man (https://wiseoldman.net) instead of parsing
// Jagex's raw hiscores CSV by hand. WOM already gives every skill and every
// boss as a clean, named JSON object - this is what fixes the "boss counts
// are wrong" bug, since we're no longer guessing a fragile column order.
//
// POST /players/{username} both creates (tracks) the player on WOM the
// first time you look them up AND forces an immediate refresh against the
// live OSRS hiscores - exactly what we want for a manual/auto "refresh" action.

const axios = require('axios');

const WOM_BASE = 'https://api.wiseoldman.net/v2';

function prettifyKey(key) {
  // "kril_tsutsaroth" -> "K'ril Tsutsaroth" (best-effort; good enough for display)
  const SPECIAL = {
    kreearra: "Kree'Arra",
    kril_tsutsaroth: "K'ril Tsutsaroth",
    tztok_jad: 'TzTok-Jad',
    tzkal_zuk: 'TzKal-Zuk',
    theatre_of_blood: 'Theatre of Blood',
    theatre_of_blood_hard_mode: 'Theatre of Blood: Hard Mode',
    tombs_of_amascut: 'Tombs of Amascut',
    tombs_of_amascut_expert: 'Tombs of Amascut: Expert Mode',
    chambers_of_xeric: 'Chambers of Xeric',
    chambers_of_xeric_challenge_mode: 'Chambers of Xeric: Challenge Mode',
    vetion: "Vet'ion",
    calvarion: "Calvar'ion",
    callisto: 'Callisto',
    artio: 'Artio'
  };
  if (SPECIAL[key]) return SPECIAL[key];
  return key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function fetchHiscores(playerName) {
  let res;
  try {
    res = await axios.post(`${WOM_BASE}/players/${encodeURIComponent(playerName)}`, {}, { timeout: 10000 });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      const e = new Error(`Fant ingen spiller med navnet "${playerName}" (verken på Wise Old Man eller OSRS hiscores).`);
      e.status = 404;
      throw e;
    }
    const e = new Error('Klarte ikke å nå Wise Old Man akkurat nå. Prøv igjen om litt.');
    e.status = 502;
    throw e;
  }

  const snapshot = res.data && res.data.latestSnapshot && res.data.latestSnapshot.data;
  if (!snapshot) {
    const e = new Error('Wise Old Man returnerte ingen data for denne spilleren enda - prøv igjen om et minutt.');
    e.status = 502;
    throw e;
  }

  const skills = {};
  Object.entries(snapshot.skills || {}).forEach(([key, s]) => {
    skills[prettifyKey(key)] = { rank: s.rank > 0 ? s.rank : null, level: s.level >= 0 ? s.level : 0, xp: s.experience >= 0 ? s.experience : 0 };
  });

  const bossCounts = {};
  Object.entries(snapshot.bosses || {}).forEach(([key, b]) => {
    bossCounts[prettifyKey(key)] = b.kills > 0 ? b.kills : 0;
  });

  const activities = {};
  Object.entries(snapshot.activities || {}).forEach(([key, a]) => {
    activities[prettifyKey(key)] = { rank: a.rank > 0 ? a.rank : null, score: a.score > 0 ? a.score : 0 };
  });

  return {
    playerName,
    combatLevel: res.data.combatLevel || null,
    skills,
    activities,
    bossCounts,
    source: 'wiseoldman.net',
    fetchedAt: new Date().toISOString()
  };
}

module.exports = { fetchHiscores };