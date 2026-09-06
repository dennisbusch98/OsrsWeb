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
    // Log the REAL underlying reason to the server console - "Klarte ikke å
    // nå Wise Old Man" alone hides whether this was a 404 (bad RSN), a 429
    // (rate limited), a 5xx from WOM itself, or a plain network/DNS failure
    // on this machine (e.g. no internet, firewall, corporate proxy).
    console.error('[hiscoreService] WOM request failed for', playerName, {
      status: err.response && err.response.status,
      statusText: err.response && err.response.statusText,
      data: err.response && err.response.data,
      code: err.code, // e.g. ENOTFOUND, ECONNREFUSED, ETIMEDOUT
      message: err.message
    });

    if (err.response && err.response.status === 404) {
      const e = new Error(`Fant ingen spiller med navnet "${playerName}" (verken på Wise Old Man eller OSRS hiscores).`);
      e.status = 404;
      throw e;
    }
    if (err.response && err.response.status === 429) {
      const e = new Error('Wise Old Man rate-limitet forespørselen (for mange oppdateringer på kort tid). Prøv igjen om et minutt.');
      e.status = 429;
      throw e;
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'EAI_AGAIN') {
      const e = new Error('Denne serveren har ikke nettverkstilgang til api.wiseoldman.net akkurat nå (DNS/tilkoblingsfeil). Sjekk internettforbindelsen eller brannmur/proxy.');
      e.status = 502;
      throw e;
    }
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      const e = new Error('Forespørselen til Wise Old Man tok for lang tid og ble avbrutt (timeout). Prøv igjen.');
      e.status = 504;
      throw e;
    }

    const detail = (err.response && err.response.status) ? ` (HTTP ${err.response.status})` : ` (${err.code || err.message})`;
    const e = new Error(`Klarte ikke å nå Wise Old Man akkurat nå${detail}. Se server-loggen for detaljer.`);
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
