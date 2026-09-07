let CHAR_LIST = [];
let GEAR_CATALOG = null;
let ACTIVE_CHAR = null;
let ACTIVE_GEAR = null;       // { melee: {...}, range: {...}, magic: {...} } - saved state
let PENDING_GEAR = {};         // working copy for the currently open style tab, edited by the picker
let ACTIVE_STYLE = 'melee';
let OPEN_SLOT = null;

const IMG_BASE = 'https://oldschool.runescape.wiki/images/';
const STYLE_LABELS = { melee: '⚔️ Melee', range: '🏹 Range', magic: '🔮 Magic' };
const SLOT_LABELS = {
  head: 'Hode', cape: 'Kappe', neck: 'Hals', ammo: 'Ammo', weapon: 'Våpen',
  shield: 'Skjold', body: 'Kropp', legs: 'Bein', hands: 'Hender', feet: 'Føtter', ring: 'Ring'
};

async function initCharactersPage() {
  try {
    [CHAR_LIST, GEAR_CATALOG] = await Promise.all([
      Api.get('/api/characters'),
      Api.get('/api/characters/gear-catalog')
    ]);
  } catch (err) {
    document.getElementById('charContent').innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    return;
  }

  renderTabButtons();
  const me = Api.getUser();
  const defaultChar = (me && CHAR_LIST.find(c => c.id === me.characterId)) || CHAR_LIST[0];
  selectCharacter(defaultChar.id);
}

function renderTabButtons() {
  const container = document.getElementById('charTabButtons');
  container.innerHTML = CHAR_LIST.map(c => `
    <div class="col-6" style="flex: 0 0 20%; max-width: 20%;">
      <button class="char-tab-btn w-100" id="tabbtn-${c.id}" onclick="selectCharacter('${c.id}')">
        <span class="claimed-dot ${c.claimed ? 'taken' : 'free'}"></span>${c.displayName}
      </button>
    </div>
  `).join('');
}

function markActiveTabButton(id) {
  CHAR_LIST.forEach(c => {
    const btn = document.getElementById(`tabbtn-${c.id}`);
    if (btn) btn.classList.toggle('active', c.id === id);
  });
}

async function selectCharacter(id) {
  markActiveTabButton(id);
  ACTIVE_STYLE = (CHAR_LIST.find(c => c.id === id) || {}).defaultStyle || 'melee';
  OPEN_SLOT = null;
  const content = document.getElementById('charContent');
  content.innerHTML = '<p class="text-secondary">Laster karakter...</p>';
  try {
    [ACTIVE_CHAR, ACTIVE_GEAR] = await Promise.all([
      Api.get(`/api/characters/${id}`),
      Api.get(`/api/characters/${id}/gear`)
    ]);
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    return;
  }
  PENDING_GEAR = { ...(ACTIVE_GEAR[ACTIVE_STYLE] || {}) };
  renderCharacterContent();

  // Auto-load fresh stats whenever ANYONE opens this character's tab -
  // not just when the owner is logged in and looking at their own page.
  // Skipped if we already have stats from the last 5 minutes, so several
  // clan members clicking around doesn't hammer Wise Old Man with repeat
  // requests for the same character.
  const STALE_AFTER_MS = 5 * 60 * 1000;
  const lastUpdated = ACTIVE_CHAR.statsUpdatedAt ? new Date(ACTIVE_CHAR.statsUpdatedAt).getTime() : 0;
  if (Date.now() - lastUpdated > STALE_AFTER_MS) {
    refreshStats(true);
  }
}

function renderCharacterContent() {
  const c = ACTIVE_CHAR;
  const me = Api.getUser();
  const isOwner = !!(me && me.characterId === c.id);

  const content = document.getElementById('charContent');
  content.innerHTML = `
    <div class="panel p-3 mb-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 class="font-rune mb-0" style="color:#ffb300;">${c.displayName}</h3>
          <span class="badge ${c.claimed ? 'bg-success' : 'bg-danger'}">${c.claimed ? 'Klaimet' : 'Ledig'}</span>
          ${c.rsn ? `<span class="badge bg-dark ms-1">RSN: ${c.rsn}</span>` : ''}
        </div>
        ${isOwner ? '<span class="badge" style="background:#ffb300; color:#14171c;">Dette er din karakter</span>' : ''}
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-7">
        <div class="panel p-3">
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h6 class="text-secondary mb-0">⚔️ Gear-oppsett ${isOwner ? '' : '(kun eier kan endre)'}</h6>
            <div class="btn-group btn-group-sm" id="styleTabs">
              ${['melee', 'range', 'magic'].map(s => `
                <button class="btn ${s === ACTIVE_STYLE ? 'btn-noob' : 'btn-outline-light'}" onclick="switchStyle('${s}')">${STYLE_LABELS[s]}</button>
              `).join('')}
            </div>
          </div>

          <div class="row">
            <div class="col-auto mx-auto">
              <div class="equip-screen" id="equipScreen"></div>
            </div>
          </div>

          <div id="pickerPanel" class="mt-3"></div>

          ${isOwner ? `
            <div id="gearSaveMsg" class="mt-2"></div>
            <button class="btn btn-noob btn-sm mt-2 w-100" onclick="saveGear()">Lagre ${STYLE_LABELS[ACTIVE_STYLE]} gear</button>
          ` : ''}
        </div>
      </div>

      <div class="col-lg-5">
        <div class="panel p-3 mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="text-secondary mb-0">📊 Stats <span class="text-secondary" style="font-size:10px;">(Wise Old Man)</span></h6>
          </div>
          ${isOwner ? `
            <!-- Hidden on purpose: stats auto-refresh silently in the background
                 every time you open your own character tab (see selectCharacter()).
                 The RSN is always the character's own name - there's never a
                 reason to type a different one, so no visible UI is needed. -->
            <div class="d-none">
              <div class="input-group input-group-sm mb-2">
                <input type="text" class="form-control" id="rsnInput" value="${c.rsn || c.displayName}">
                <button class="btn btn-noob" onclick="refreshStats()">Oppdater</button>
              </div>
              <div id="statsMsg"></div>
            </div>
          ` : ''}
          <div id="statsPanel"></div>
        </div>

        <div class="panel p-3">
          <h6 class="text-secondary mb-2">🐲 Boss Kill Count</h6>
          <div id="bossPanel"></div>
        </div>
      </div>

      <div class="col-12">
        <div class="panel p-3">
          <h6 class="text-secondary mb-2">📜 Achievements & Loot</h6>
          <div id="achievementsPanel" style="max-height: 320px; overflow-y:auto;"></div>
        </div>
      </div>

      <div class="col-12">
        <div class="panel p-3">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <div class="btn-group btn-group-sm" id="extraTabs">
              <button class="btn btn-noob" data-extra-tab="bank">🏦 Bank</button>
              <button class="btn btn-outline-light" data-extra-tab="collection">📖 Collection Log</button>
            </div>
            <div id="collectionSetTabs" class="btn-group btn-group-sm" style="display:none;"></div>
          </div>
          <div id="extraTabContent"></div>
        </div>
      </div>
    </div>
  `;

  renderEquipScreen(isOwner);
  renderStats();
  renderBossCounts();
  renderAchievements();
  initExtraTabs(isOwner);
}

let BANK_ITEMS = [];
let COLLECTION_CATALOG = null;
let ACTIVE_EXTRA_TAB = 'bank';
let ACTIVE_COLLECTION_SET = 'barrows';

function flatItemPool() {
  // Every item across every slot in the gear catalog, deduped by name -
  // used as the searchable "add to bank" list, since collection log items
  // are equipment pieces we already track there anyway.
  const seen = new Map();
  GEAR_CATALOG.slots.forEach(slot => {
    (GEAR_CATALOG.items[slot] || []).forEach(item => {
      if (item.name && !seen.has(item.name)) seen.set(item.name, item);
    });
  });
  return [...seen.values()];
}

let EXTRA_IS_OWNER = false;

async function initExtraTabs(isOwner) {
  EXTRA_IS_OWNER = isOwner;
  if (!COLLECTION_CATALOG) {
    COLLECTION_CATALOG = await Api.get('/api/characters/collection-catalog');
  }
  document.querySelectorAll('#extraTabs button').forEach(btn => {
    btn.addEventListener('click', () => switchExtraTab(btn.dataset.extraTab));
  });
  await loadBank();
  switchExtraTab(ACTIVE_EXTRA_TAB);
}

async function loadBank() {
  BANK_ITEMS = await Api.get(`/api/characters/${ACTIVE_CHAR.id}/bank`);
}

function switchExtraTab(tab) {
  ACTIVE_EXTRA_TAB = tab;
  document.querySelectorAll('#extraTabs button').forEach(b => {
    b.classList.toggle('btn-noob', b.dataset.extraTab === tab);
    b.classList.toggle('btn-outline-light', b.dataset.extraTab !== tab);
  });
  document.getElementById('collectionSetTabs').style.display = tab === 'collection' ? 'flex' : 'none';
  if (tab === 'bank') {
    renderBank(EXTRA_IS_OWNER);
  } else {
    renderCollectionSetDropdown();
    renderCollectionLog();
  }
}

// ===== Bank =====
function bankItemImg(name) {
  const item = flatItemPool().find(o => o.name === name);
  return item ? itemImgUrl(item.img) : '';
}

function renderBank(isOwner) {
  const content = document.getElementById('extraTabContent');
  content.innerHTML = `
    ${isOwner ? `
      <div class="mb-2">
        <div class="d-flex gap-2 mb-2">
          <input type="text" class="form-control form-control-sm" id="bankSearch" placeholder="Søk etter item å legge i banken...">
          <button class="btn btn-outline-light btn-sm" onclick="document.getElementById('clogImportFile').click()">📥 Importer collection log</button>
          <input type="file" id="clogImportFile" accept=".json" style="display:none;">
        </div>
        <div id="bankImportMsg" class="mb-1"></div>
        <div id="bankSearchResults" class="gear-item-picker" style="max-height:180px; display:none;"></div>
      </div>
    ` : ''}
    <div class="row row-cols-4 row-cols-md-6 g-2" id="bankGrid"></div>
  `;

  const grid = document.getElementById('bankGrid');
  if (BANK_ITEMS.length === 0) {
    grid.innerHTML = '<p class="text-secondary" style="font-size:12px;">Ingen items i banken enda.</p>';
  } else {
    grid.innerHTML = BANK_ITEMS.map(name => `
      <div class="col">
        <div class="bank-slot" title="${name}">
          <img src="${bankItemImg(name)}" onerror="this.style.opacity=0.2">
          ${isOwner ? `<button class="bank-remove" data-remove-item="${name}" title="Fjern">×</button>` : ''}
        </div>
      </div>
    `).join('');
    if (isOwner) {
      grid.querySelectorAll('[data-remove-item]').forEach(el => {
        el.addEventListener('click', () => removeBankItem(el.dataset.removeItem));
      });
    }
  }

  if (isOwner) {
    const searchInput = document.getElementById('bankSearch');
    const resultsBox = document.getElementById('bankSearchResults');
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase();
      if (!term) { resultsBox.style.display = 'none'; return; }
      const matches = flatItemPool().filter(o => o.name.toLowerCase().includes(term)).slice(0, 30);
      resultsBox.style.display = 'block';
      resultsBox.innerHTML = matches.map(o => `
        <div class="gear-item-option" data-add-item="${o.name}">
          <img src="${itemImgUrl(o.img)}" onerror="this.style.opacity=0.2">
          <span>${o.name}</span>
        </div>
      `).join('') || '<p class="text-secondary" style="font-size:12px;">Ingen treff.</p>';
      resultsBox.querySelectorAll('[data-add-item]').forEach(el => {
        el.addEventListener('click', () => addBankItem(el.dataset.addItem));
      });
    });

    document.getElementById('clogImportFile').addEventListener('change', handleClogImport);
  }
}

async function addBankItem(itemName) {
  try {
    BANK_ITEMS = await Api.post(`/api/characters/${ACTIVE_CHAR.id}/bank`, { itemName });
    document.getElementById('bankSearch').value = '';
    document.getElementById('bankSearchResults').style.display = 'none';
    renderBank(true);
  } catch (err) {
    alert(err.message);
  }
}

async function removeBankItem(itemName) {
  try {
    BANK_ITEMS = await Api.del(`/api/characters/${ACTIVE_CHAR.id}/bank/${encodeURIComponent(itemName)}`);
    renderBank(true);
  } catch (err) {
    alert(err.message);
  }
}

// Best-effort parser: RuneLite collection log export plugins don't have a
// single documented/official JSON schema, so this walks the WHOLE file
// recursively and treats any object with a "name" (or "itemName") field
// plus an "obtained: true" (or a positive "quantity"/"count") as an
// obtained item. Works across several plugin variants without needing to
// hardcode one exact shape - but if your export looks very different,
// tell us what it looks like and we'll adjust this.
function extractObtainedItemNames(json) {
  const found = new Set();
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    const name = node.name || node.itemName;
    const obtainedFlag = node.obtained === true;
    const qty = Number(node.quantity ?? node.count ?? 0);
    if (typeof name === 'string' && (obtainedFlag || qty > 0)) {
      found.add(name.trim());
    }
    Object.values(node).forEach(walk);
  }
  walk(json);
  return [...found];
}

function handleClogImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const msg = document.getElementById('bankImportMsg');
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const json = JSON.parse(ev.target.result);
      const names = extractObtainedItemNames(json);
      if (names.length === 0) {
        msg.innerHTML = '<div class="alert alert-warning py-1 px-2" style="font-size:12px;">Fant ingen "obtained"-items i filen - formatet stemte trolig ikke med det vi forventet. Si ifra så justerer vi parseren.</div>';
        return;
      }
      msg.innerHTML = `<div class="alert alert-secondary py-1 px-2" style="font-size:12px;">Importerer ${names.length} items...</div>`;
      BANK_ITEMS = await Api.post(`/api/characters/${ACTIVE_CHAR.id}/bank/import`, { itemNames: names });
      msg.innerHTML = `<div class="alert alert-success py-1 px-2" style="font-size:12px;">Importerte ${names.length} items fra collection log-eksporten!</div>`;
      renderBank(true);
    } catch (err) {
      msg.innerHTML = `<div class="alert alert-danger py-1 px-2" style="font-size:12px;">Klarte ikke å lese filen: ${err.message}</div>`;
    }
  };
  reader.readAsText(file);
}

// ===== Collection Log =====
function renderCollectionSetDropdown() {
  const container = document.getElementById('collectionSetTabs');
  const sets = COLLECTION_CATALOG.sets;
  container.innerHTML = `
    <select class="form-select form-select-sm" id="collectionSetSelect" style="min-width:180px;">
      ${Object.keys(sets).map(key => `<option value="${key}" ${key === ACTIVE_COLLECTION_SET ? 'selected' : ''}>${sets[key].label}</option>`).join('')}
    </select>
  `;
  document.getElementById('collectionSetSelect').addEventListener('change', (e) => {
    ACTIVE_COLLECTION_SET = e.target.value;
    renderCollectionLog();
  });
}

function renderCollectionLog() {
  const content = document.getElementById('extraTabContent');
  const set = COLLECTION_CATALOG.sets[ACTIVE_COLLECTION_SET];
  if (!set) { content.innerHTML = ''; return; }

  const owned = set.items.filter(i => BANK_ITEMS.includes(i.name)).length;
  content.innerHTML = `
    <div class="text-secondary mb-2" style="font-size:12px;">
      ${owned} / ${set.items.length} skaffet
      ${EXTRA_IS_OWNER ? ' · klikk et item for å markere/fjerne det manuelt' : ''}
    </div>
    <div class="row row-cols-4 row-cols-md-6 g-2">
      ${set.items.map(i => {
        const has = BANK_ITEMS.includes(i.name);
        return `
          <div class="col">
            <div class="collog-slot ${has ? 'has-item' : 'missing-item'} ${EXTRA_IS_OWNER ? 'clickable' : ''}" title="${i.name}${has ? ' ✔' : ''}" data-clog-item="${i.name}">
              <img src="${IMG_BASE}${i.img}" onerror="this.style.opacity=0.3">
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  if (EXTRA_IS_OWNER) {
    content.querySelectorAll('[data-clog-item]').forEach(el => {
      el.addEventListener('click', () => toggleClogItem(el.dataset.clogItem));
    });
  }
}

async function toggleClogItem(itemName) {
  try {
    if (BANK_ITEMS.includes(itemName)) {
      BANK_ITEMS = await Api.del(`/api/characters/${ACTIVE_CHAR.id}/bank/${encodeURIComponent(itemName)}`);
    } else {
      BANK_ITEMS = await Api.post(`/api/characters/${ACTIVE_CHAR.id}/bank`, { itemName });
    }
    renderCollectionLog();
  } catch (err) {
    alert(err.message);
  }
}


function achTimeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'akkurat nå';
  if (mins < 60) return `${mins} min siden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} t siden`;
  const days = Math.floor(hours / 24);
  return `${days} d siden`;
}

function achEscapeHtml(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

async function renderAchievements() {
  const panel = document.getElementById('achievementsPanel');
  const c = ACTIVE_CHAR;
  panel.innerHTML = '<p class="text-secondary" style="font-size:12px;">Laster...</p>';
  try {
    const [loot, achievements] = await Promise.all([
      Api.get(`/api/posts?characterId=${c.id}&type=loot`),
      Api.get(`/api/posts?characterId=${c.id}&type=achievement`)
    ]);
    const combined = [...loot, ...achievements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (combined.length === 0) {
      panel.innerHTML = '<p class="text-secondary" style="font-size:12px;">Ingen loot eller achievements registrert enda - kobler til automatisk via RuneLite-webhooken (se Settings), eller flex manuelt i hjem-feeden.</p>';
      return;
    }

    panel.innerHTML = combined.map(p => `
      <div class="stat-pill mb-1" style="display:flex; align-items:center; gap:8px;">
        ${p.imageUrl ? `<img src="${p.imageUrl}" style="width:22px; height:22px; object-fit:contain;" onerror="this.style.display='none'">` : ''}
        <span style="flex:1; text-align:left;">${achEscapeHtml(p.content)}</span>
        <span class="text-secondary" style="font-size:10px;">${achTimeAgo(p.createdAt)}</span>
      </div>
    `).join('');
  } catch (err) {
    panel.innerHTML = `<div class="alert alert-danger py-1 px-2" style="font-size:12px;">${err.message}</div>`;
  }
}

function switchStyle(style) {
  ACTIVE_STYLE = style;
  OPEN_SLOT = null;
  PENDING_GEAR = { ...((ACTIVE_GEAR && ACTIVE_GEAR[style]) || {}) };
  renderCharacterContent();
}

function itemImgUrl(imgFile) {
  if (!imgFile) return '';
  return IMG_BASE + imgFile;
}

function catalogForStyle(slot) {
  // Every item is shown for every slot now - mixing melee/range/magic pieces
  // in one loadout is allowed. The style tag is just an informational label.
  return GEAR_CATALOG.items[slot] || [];
}
const STYLE_TAG_LABEL = { melee: '⚔️', range: '🏹', magic: '🔮', all: '✨' };

function renderEquipScreen(isOwner) {
  const screen = document.getElementById('equipScreen');
  screen.innerHTML = GEAR_CATALOG.slots.map(slot => {
    const value = PENDING_GEAR[slot] || '';
    const item = catalogForStyle(slot).find(o => o.name === value) ||
                 (GEAR_CATALOG.items[slot] || []).find(o => o.name === value);
    const filled = !!item;
    return `
      <div class="equip-slot ${filled ? 'filled' : ''}" data-slot="${slot}" title="${value || SLOT_LABELS[slot]}"
           onclick="${isOwner ? `openPicker('${slot}')` : ''}">
        ${filled ? `<img src="${itemImgUrl(item.img)}" onerror="this.style.opacity=0.2">` : ''}
        <span class="slot-label">${SLOT_LABELS[slot]}</span>
      </div>
    `;
  }).join('');
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPickerOptions(slot, searchTerm) {
  const options = catalogForStyle(slot).filter(o =>
    !searchTerm || o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentValue = PENDING_GEAR[slot] || '';
  const list = document.getElementById('pickerList');
  if (!list) return;

  list.innerHTML = options.map(o => `
    <div class="gear-item-option ${o.name === currentValue ? 'selected' : ''}" data-pick-slot="${escapeAttr(slot)}" data-pick-item="${escapeAttr(o.name)}">
      <img src="${itemImgUrl(o.img)}" onerror="this.style.opacity=0.2">
      <span>${o.name} <span class="text-secondary" style="font-size:10.5px;">${STYLE_TAG_LABEL[o.style] || ''}</span></span>
    </div>
  `).join('') || '<p class="text-secondary" style="font-size:12px;">Ingen items matcher søket.</p>';

  list.querySelectorAll('[data-pick-item]').forEach(el => {
    el.addEventListener('click', () => pickItem(el.dataset.pickSlot, el.dataset.pickItem));
  });
}

function openPicker(slot) {
  OPEN_SLOT = OPEN_SLOT === slot ? null : slot;
  const panel = document.getElementById('pickerPanel');
  if (!OPEN_SLOT) { panel.innerHTML = ''; return; }

  panel.innerHTML = `
    <div class="panel-2 p-2 rounded">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <b style="font-size:12.5px;">Velg ${SLOT_LABELS[slot].toLowerCase()} <span class="text-secondary">(alle stiler, miks fritt)</span></b>
        <button type="button" class="btn btn-sm btn-outline-light py-0" data-clear-slot="${escapeAttr(slot)}">Tøm</button>
      </div>
      <input type="text" class="form-control form-control-sm mb-2" id="pickerSearch" placeholder="Søk etter item...">
      <div class="gear-item-picker" id="pickerList"></div>
    </div>
  `;

  renderPickerOptions(slot, '');
  document.getElementById('pickerSearch').addEventListener('input', (e) => renderPickerOptions(slot, e.target.value));
  document.getElementById('pickerSearch').focus();
  panel.querySelectorAll('[data-clear-slot]').forEach(el => {
    el.addEventListener('click', () => clearSlot(el.dataset.clearSlot));
  });
}

function pickItem(slot, itemName) {
  PENDING_GEAR[slot] = itemName;
  OPEN_SLOT = null;
  document.getElementById('pickerPanel').innerHTML = '';
  renderEquipScreen(true);
}

function clearSlot(slot) {
  PENDING_GEAR[slot] = '';
  OPEN_SLOT = null;
  document.getElementById('pickerPanel').innerHTML = '';
  renderEquipScreen(true);
}

async function saveGear() {
  const msg = document.getElementById('gearSaveMsg');
  const gear = {};
  GEAR_CATALOG.slots.forEach(slot => { gear[slot] = PENDING_GEAR[slot] || ''; });
  try {
    ACTIVE_GEAR = await Api.put(`/api/characters/${ACTIVE_CHAR.id}/gear/${ACTIVE_STYLE}`, { gear });
    msg.innerHTML = `<div class="alert alert-success py-1 px-2" style="font-size:12px;">${STYLE_LABELS[ACTIVE_STYLE]} gear lagret!</div>`;
    setTimeout(() => { if (msg) msg.innerHTML = ''; }, 2500);
  } catch (err) {
    msg.innerHTML = `<div class="alert alert-danger py-1 px-2" style="font-size:12px;">${err.message}</div>`;
  }
}

async function refreshStats(silent) {
  const rsnInput = document.getElementById('rsnInput');
  const rsn = rsnInput ? rsnInput.value.trim() : (ACTIVE_CHAR.rsn || ACTIVE_CHAR.displayName);
  const msg = document.getElementById('statsMsg');
  if (msg && !silent) msg.innerHTML = '<span class="text-secondary" style="font-size:12px;">Henter fra Wise Old Man...</span>';
  try {
    ACTIVE_CHAR = await Api.post(`/api/characters/${ACTIVE_CHAR.id}/stats/refresh`, { rsn });
    if (msg) {
      msg.innerHTML = '<div class="alert alert-success py-1 px-2" style="font-size:12px;">Stats oppdatert!</div>';
      setTimeout(() => { if (msg) msg.innerHTML = ''; }, 2500);
    }
    renderStats();
    renderBossCounts();
  } catch (err) {
    if (msg) msg.innerHTML = `<div class="alert alert-danger py-1 px-2" style="font-size:12px;">${err.message}</div>`;
  }
}

// Full skill list in the classic hiscores order, each mapped to its real
// OSRS Wiki skill icon filename.
const ALL_SKILLS = [
  ['Overall', 'Stats_icon.png'],
  ['Attack', 'Attack_icon.png'],
  ['Defence', 'Defence_icon.png'],
  ['Strength', 'Strength_icon.png'],
  ['Hitpoints', 'Hitpoints_icon.png'],
  ['Ranged', 'Ranged_icon.png'],
  ['Prayer', 'Prayer_icon.png'],
  ['Magic', 'Magic_icon.png'],
  ['Cooking', 'Cooking_icon.png'],
  ['Woodcutting', 'Woodcutting_icon.png'],
  ['Fletching', 'Fletching_icon.png'],
  ['Fishing', 'Fishing_icon.png'],
  ['Firemaking', 'Firemaking_icon.png'],
  ['Crafting', 'Crafting_icon.png'],
  ['Smithing', 'Smithing_icon.png'],
  ['Mining', 'Mining_icon.png'],
  ['Herblore', 'Herblore_icon.png'],
  ['Agility', 'Agility_icon.png'],
  ['Thieving', 'Thieving_icon.png'],
  ['Slayer', 'Slayer_icon.png'],
  ['Farming', 'Farming_icon.png'],
  ['Runecraft', 'Runecraft_icon.png'],
  ['Hunter', 'Hunter_icon.png'],
  ['Construction', 'Construction_icon.png']
];

function renderStats() {
  const panel = document.getElementById('statsPanel');
  const c = ACTIVE_CHAR;
  if (!c.stats || !c.stats.skills) {
    panel.innerHTML = '<p class="text-secondary" style="font-size:13px;">Ingen stats hentet enda.</p>';
    return;
  }
  const updated = c.statsUpdatedAt ? new Date(c.statsUpdatedAt).toLocaleString('no-NO') : '';

  panel.innerHTML = `
    <div class="stats-grid mb-2">
      ${ALL_SKILLS.map(([name, icon]) => {
        const skill = c.stats.skills[name];
        const level = skill ? skill.level : 1;
        return `
          <div class="stats-cell" title="${name}">
            <img src="${IMG_BASE}${icon}" onerror="this.style.visibility='hidden'">
            <span>${level}</span>
          </div>
        `;
      }).join('')}
    </div>
    <div class="d-flex gap-2 mb-2">
      <div class="stats-cell wide" title="Combat level">
        <img src="${IMG_BASE}Combat_icon.png" onerror="this.style.visibility='hidden'">
        <span>${c.stats.combatLevel ?? '?'}</span>
      </div>
      <div class="stats-cell wide" title="Total level">
        <img src="${IMG_BASE}Stats_icon.png" onerror="this.style.visibility='hidden'">
        <span>${(c.stats.skills.Overall && c.stats.skills.Overall.level) ?? '?'}</span>
      </div>
    </div>
    <div class="text-secondary" style="font-size:11px;">Sist oppdatert: ${updated}</div>
  `;
}

function renderBossCounts() {
  const panel = document.getElementById('bossPanel');
  const c = ACTIVE_CHAR;
  const counts = (c.stats && c.stats.bossCounts) || c.bossCounts || {};
  const entries = Object.entries(counts).filter(([, kc]) => kc > 0).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    panel.innerHTML = '<p class="text-secondary" style="font-size:13px;">Ingen boss-KC registrert enda. Trykk "Oppdater" over for å hente fra Wise Old Man.</p>';
    return;
  }

  panel.innerHTML = `
    <div style="max-height: 280px; overflow-y:auto;">
      ${entries.map(([boss, kc]) => `
        <div class="stat-pill mb-1"><span>${boss}</span><b>${kc.toLocaleString()}</b></div>
      `).join('')}
    </div>
  `;
}

if (requireLoginOrRedirect()) {
  renderNavbar('characters');
  initCharactersPage();
}