// ===== Simplified DPS calculator =====
// Honesty note (also shown in the UI): item/monster bonuses here are
// derived from a 1-10 "tier" ranking, NOT exact OSRS Wiki stat blocks.
// The accuracy/max-hit/DPS formulas themselves ARE the real OSRS combat
// formulas - only the input bonus numbers are approximated. Good for
// comparing loadouts against each other; not guaranteed to match the
// Wiki's own DPS calculator to the exact point.

let DPS_CATALOG = null;
let DPS_MONSTERS = null;
let DPS_STYLE = 'melee';
let DPS_GEAR = {};

async function initDpsCalc() {
  [DPS_CATALOG, DPS_MONSTERS] = await Promise.all([
    Api.get('/api/characters/gear-catalog'),
    Api.get('/api/characters/monster-catalog')
  ]);

  const monsterSelect = document.getElementById('dpsMonster');
  monsterSelect.innerHTML = DPS_MONSTERS.monsters.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  monsterSelect.value = 'wise_old_man'; // default target, like the Wiki calculator
  monsterSelect.addEventListener('change', renderDpsMonsterInfo);

  document.querySelectorAll('#dpsStyleTabs button').forEach(btn => {
    btn.addEventListener('click', () => switchDpsStyle(btn.dataset.style));
  });

  renderDpsGearGrid();
  renderDpsMonsterInfo();
  calcDps();
}

function switchDpsStyle(style) {
  DPS_STYLE = style;
  document.querySelectorAll('#dpsStyleTabs button').forEach(b => b.classList.toggle('btn-noob', b.dataset.style === style));
  document.querySelectorAll('#dpsStyleTabs button').forEach(b => b.classList.toggle('btn-outline-light', b.dataset.style !== style));
  DPS_GEAR = {};
  renderDpsGearGrid();
  calcDps();
}

function dpsCatalogForStyle(slot) {
  // Every item is shown for every slot now - mixing styles is allowed.
  return DPS_CATALOG.items[slot] || [];
}
const DPS_STYLE_TAG_LABEL = { melee: '⚔️', range: '🏹', magic: '🔮', all: '✨' };

function renderDpsGearGrid() {
  const screen = document.getElementById('dpsEquipScreen');
  screen.innerHTML = DPS_CATALOG.slots.map(slot => {
    const value = DPS_GEAR[slot];
    const item = value ? dpsCatalogForStyle(slot).find(o => o.name === value) : null;
    return `
      <div class="equip-slot ${item ? 'filled' : ''}" data-slot="${slot}" title="${value || slot}" onclick="openDpsPicker('${slot}')">
        ${item ? `<img src="${IMG_BASE}${item.img}" onerror="this.style.opacity=0.2">` : ''}
        <span class="slot-label">${slot}</span>
      </div>
    `;
  }).join('');
  document.getElementById('dpsPickerPanel').innerHTML = '';
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDpsPickerOptions(slot, searchTerm) {
  const options = dpsCatalogForStyle(slot).filter(o =>
    !searchTerm || o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentValue = DPS_GEAR[slot] || '';
  const list = document.getElementById('dpsPickerList');
  if (!list) return;

  list.innerHTML = options.map(o => `
    <div class="gear-item-option ${o.name === currentValue ? 'selected' : ''}" data-pick-slot="${escapeAttr(slot)}" data-pick-item="${escapeAttr(o.name)}">
      <img src="${IMG_BASE}${o.img}" onerror="this.style.opacity=0.2">
      <span>${o.name} <span class="text-secondary" style="font-size:10.5px;">${DPS_STYLE_TAG_LABEL[o.style] || ''} T${o.tier ?? '?'}</span></span>
    </div>
  `).join('') || '<p class="text-secondary" style="font-size:12px;">Ingen items matcher søket.</p>';

  list.querySelectorAll('[data-pick-item]').forEach(el => {
    el.addEventListener('click', () => pickDpsItem(el.dataset.pickSlot, el.dataset.pickItem));
  });
}

function openDpsPicker(slot) {
  const panel = document.getElementById('dpsPickerPanel');
  panel.innerHTML = `
    <div class="panel-2 p-2 rounded">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <b style="font-size:12.5px;">Velg ${slot} <span class="text-secondary">(alle stiler, miks fritt)</span></b>
        <button type="button" class="btn btn-sm btn-outline-light py-0" data-clear-slot="${escapeAttr(slot)}">Tøm</button>
      </div>
      <input type="text" class="form-control form-control-sm mb-2" id="dpsPickerSearch" placeholder="Søk etter item...">
      <div class="gear-item-picker" id="dpsPickerList"></div>
    </div>
  `;

  renderDpsPickerOptions(slot, '');
  document.getElementById('dpsPickerSearch').addEventListener('input', (e) => renderDpsPickerOptions(slot, e.target.value));
  document.getElementById('dpsPickerSearch').focus();
  panel.querySelectorAll('[data-clear-slot]').forEach(el => {
    el.addEventListener('click', () => clearDpsSlot(el.dataset.clearSlot));
  });
}

function pickDpsItem(slot, name) {
  DPS_GEAR[slot] = name;
  renderDpsGearGrid();
  calcDps();
}
function clearDpsSlot(slot) {
  delete DPS_GEAR[slot];
  renderDpsGearGrid();
  calcDps();
}

// Pull whichever gear the logged-in user has saved for their own character, for this style.
async function loadMyGearIntoCalc() {
  const me = Api.getUser();
  if (!me) { alert('Du må være logget inn for å laste inn ditt eget oppsett.'); return; }
  try {
    const gear = await Api.get(`/api/characters/${me.characterId}/gear`);
    DPS_GEAR = { ...(gear[DPS_STYLE] || {}) };
    renderDpsGearGrid();
    calcDps();
  } catch (err) {
    alert(err.message);
  }
}

function renderDpsMonsterInfo() {
  const monster = DPS_MONSTERS.monsters.find(m => m.id === document.getElementById('dpsMonster').value);
  const box = document.getElementById('dpsMonsterInfo');
  if (!monster) { box.innerHTML = ''; return; }
  box.innerHTML = `
    <img src="${IMG_BASE}${monster.img}" style="height:48px;" onerror="this.style.display='none'">
    <div>
      <div style="font-weight:bold; color:#ffb300;">${monster.name}</div>
      <div class="text-secondary" style="font-size:11px;">HP ${monster.hp} · Defence lvl ${monster.defenceLevel}</div>
      ${monster.note ? `<div class="text-secondary" style="font-size:10.5px; font-style:italic;">${monster.note}</div>` : ''}
    </div>
  `;
}

// ---- tier-derived bonuses (see honesty note at top of file) ----
function tierOf(slot) {
  const val = DPS_GEAR[slot];
  if (!val) return 0;
  const item = (DPS_CATALOG.items[slot] || []).find(o => o.name === val);
  return item ? (item.tier || 0) : 0;
}
function weaponItem() {
  const val = DPS_GEAR.weapon;
  if (!val) return null;
  return (DPS_CATALOG.items.weapon || []).find(o => o.name === val) || null;
}

function calcDps() {
  const weapon = weaponItem();
  const monster = DPS_MONSTERS.monsters.find(m => m.id === document.getElementById('dpsMonster').value);
  const resultBox = document.getElementById('dpsResult');
  if (!monster) return;

  const attackLevel = parseInt(document.getElementById('dpsAttackLvl').value) || 99;
  const strengthLevel = parseInt(document.getElementById('dpsStrengthLvl').value) || 99;
  const rangedLevel = parseInt(document.getElementById('dpsRangedLvl').value) || 99;
  const magicLevel = parseInt(document.getElementById('dpsMagicLvl').value) || 99;

  const otherTiersSum = DPS_CATALOG.slots
    .filter(s => s !== 'weapon')
    .reduce((sum, s) => sum + tierOf(s), 0);

  if (!weapon) {
    resultBox.innerHTML = `<div class="alert alert-warning py-2 px-2" style="font-size:12.5px;">Velg et våpen for å beregne DPS.</div>`;
    return;
  }

  const weaponTier = weapon.tier || 0;
  let effAttackLevel, attackBonus, effStrengthLevel, strengthBonus, maxHit, speed = weapon.speed || 4;
  let usedLevel;

  if (DPS_STYLE === 'melee') {
    attackBonus = weaponTier * 12 + 20;
    strengthBonus = weaponTier * 9 + 10 + otherTiersSum * 1.5;
    effAttackLevel = attackLevel + 8;
    effStrengthLevel = strengthLevel + 8;
    maxHit = Math.floor(0.5 + effStrengthLevel * (strengthBonus + 64) / 640);
    usedLevel = attackLevel;
  } else if (DPS_STYLE === 'range') {
    attackBonus = weaponTier * 12 + 20;
    strengthBonus = weaponTier * 9 + 10 + otherTiersSum * 1.5; // ranged strength
    effAttackLevel = rangedLevel + 8;
    effStrengthLevel = rangedLevel + 8;
    maxHit = Math.floor(0.5 + effStrengthLevel * (strengthBonus + 64) / 640);
    usedLevel = rangedLevel;
  } else {
    attackBonus = weaponTier * 10 + 15;
    const magicDmgPercent = weaponTier * 1.5 + otherTiersSum * 0.3;
    const baseMaxHit = weaponTier * 3 + 5;
    maxHit = Math.floor(baseMaxHit * (1 + magicDmgPercent / 100));
    effAttackLevel = magicLevel + 8;
    usedLevel = magicLevel;
  }

  const attackRoll = effAttackLevel * (attackBonus + 64);
  const defenceRoll = (monster.defenceLevel + 9) * (monster.defenceBonus + 64);

  let accuracy;
  if (attackRoll > defenceRoll) {
    accuracy = 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
  } else {
    accuracy = attackRoll / (2 * (defenceRoll + 1));
  }
  accuracy = Math.max(0, Math.min(1, accuracy));

  const avgDamagePerHit = accuracy * (maxHit / 2);
  const secondsPerHit = speed * 0.6;
  const dps = avgDamagePerHit / secondsPerHit;
  const ttk = dps > 0 ? monster.hp / dps : Infinity;

  resultBox.innerHTML = `
    <div class="row row-cols-2 g-2 mb-2">
      <div class="col"><div class="stat-pill"><span>Max hit</span><b>${maxHit}</b></div></div>
      <div class="col"><div class="stat-pill"><span>Nøyaktighet</span><b>${(accuracy * 100).toFixed(1)}%</b></div></div>
      <div class="col"><div class="stat-pill"><span>DPS</span><b>${dps.toFixed(2)}</b></div></div>
      <div class="col"><div class="stat-pill"><span>Tid til drept</span><b>${isFinite(ttk) ? ttk.toFixed(1) + 's' : '∞'}</b></div></div>
    </div>
    <div class="text-secondary" style="font-size:10.5px;">
      Angrepsstil: ${DPS_STYLE} · Speed: ${speed} ticks · Brukt nivå: ${usedLevel}<br>
      ⚠️ Bonuser er utledet fra item-tier (1-10), ikke eksakte Wiki-tall - bruk til å <b>sammenligne</b> oppsett, ikke som fasit.
    </div>
  `;
}

document.getElementById('dpsAttackLvl')?.addEventListener('input', calcDps);
document.getElementById('dpsStrengthLvl')?.addEventListener('input', calcDps);
document.getElementById('dpsRangedLvl')?.addEventListener('input', calcDps);
document.getElementById('dpsMagicLvl')?.addEventListener('input', calcDps);
