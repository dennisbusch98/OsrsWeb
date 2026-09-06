// ===== State (declared first so nothing below can hit the TDZ bug) =====
let currentBoss = 'cox';
let accumulatedKC = 0;
let lootCounts = {};
let dt2GoldRingsProgress = 0;

function sanitizeId(name) { return 'luck_' + name.replace(/[^a-zA-Z0-9]/g, '_'); }

function initLootSim() {
  const select = document.getElementById('bossSelect');
  select.innerHTML = Object.keys(BOSS_DATA).map(key =>
    `<option value="${key}">${BOSS_DATA[key].name}</option>`
  ).join('');
  select.addEventListener('change', () => loadBoss(select.value));
  loadBoss('cox');
}

function loadBoss(key) {
  currentBoss = key;
  const boss = BOSS_DATA[key];
  document.getElementById('bossSelect').value = key;
  document.getElementById('bossTitle').innerText = boss.name;
  document.getElementById('killsLabel').innerText = `Antall ${boss.unitName} å simulere`;
  document.getElementById('kcLabelText').innerText = `Totalt ${boss.unitName}`;
  document.getElementById('targetItemName').innerText = boss.keyItem;
  document.getElementById('gearTip').innerHTML = `<b style="color:#ffb300;">Gear-tips:</b><br>${boss.gear}`;
  document.getElementById('coxPointsGroup').style.display = boss.type === 'cox' ? 'block' : 'none';
  document.getElementById('toaChanceGroup').style.display = boss.type === 'toa' ? 'block' : 'none';
  document.getElementById('dt2ProgressRow').style.display = boss.type === 'dt2' ? 'flex' : 'none';

  renderDropTable();
  renderLuckPanel();
  resetGrind();
}

function renderDropTable() {
  const boss = BOSS_DATA[currentBoss];
  const container = document.getElementById('dropTableList');
  container.innerHTML = boss.drops.map(drop => {
    let rateText;
    if (boss.type === 'cox' || boss.type === 'toa') {
      const totalWeight = boss.drops.reduce((a, b) => a + b.weight, 0);
      rateText = `${drop.weight}/${totalWeight} per lilla kiste`;
    } else if (boss.type === 'dt2' && drop.isVestige) {
      rateText = `1 av ${drop.rate.toLocaleString()} KC (syklisk mekanikk)`;
    } else if (boss.type === 'dt2' && drop.isGoldRing) {
      rateText = `1 av ${drop.rate.toLocaleString()} KC (usynlig rull)`;
    } else {
      rateText = `1 av ${drop.rate.toLocaleString()} ${boss.unitName.toLowerCase()}`;
    }
    return `<div class="ls-drop-row">
      <img src="${IMG_BASE}${drop.img}" onerror="this.style.opacity=0.15">
      <div class="nm">${drop.name}<div class="rt">${rateText}</div></div>
    </div>`;
  }).join('');
}

function renderLuckPanel() {
  const boss = BOSS_DATA[currentBoss];
  const container = document.getElementById('luckItemsList');
  document.getElementById('luckKC').value = accumulatedKC || '';
  document.getElementById('luckResults').innerHTML = '';
  container.innerHTML = boss.drops.filter(d => !d.isGoldRing).map(drop => `
    <div class="ls-luck-row">
      <img src="${IMG_BASE}${drop.img}" onerror="this.style.opacity=0.15">
      <div class="nm">${drop.name}</div>
      <input type="number" min="0" value="0" class="form-control form-control-sm" id="${sanitizeId(drop.name)}">
    </div>
  `).join('');
}

function resetLuckInputs() {
  const boss = BOSS_DATA[currentBoss];
  boss.drops.filter(d => !d.isGoldRing).forEach(drop => {
    const el = document.getElementById(sanitizeId(drop.name));
    if (el) el.value = 0;
  });
  document.getElementById('luckResults').innerHTML = '';
}

// ===== Simulation =====
function runSimulation() {
  const boss = BOSS_DATA[currentBoss];
  const manualInput = document.getElementById('manualKills').value;
  const killsToRoll = manualInput !== "" ? parseInt(manualInput) : 1;
  for (let i = 0; i < killsToRoll; i++) rollLoot(boss);
  updateUI();
}

function rollLoot(boss) {
  accumulatedKC++;
  if (boss.type === 'cox') {
    const points = parseInt(document.getElementById('coxPoints').value) || 30000;
    if (Math.random() < points / 867500) rollWeightedDrop(boss.drops);
  } else if (boss.type === 'toa') {
    const chancePercent = parseFloat(document.getElementById('toaChance').value) || 4.0;
    if (Math.random() < chancePercent / 100) rollWeightedDrop(boss.drops);
  } else if (boss.type === 'dt2') {
    if (Math.random() < 1 / boss.rollRate) {
      if (dt2GoldRingsProgress < 2) {
        dt2GoldRingsProgress++;
        lootCounts["Gold ring"] = (lootCounts["Gold ring"] || 0) + 1;
      } else {
        lootCounts[boss.keyItem] = (lootCounts[boss.keyItem] || 0) + 1;
        dt2GoldRingsProgress = 0;
      }
    }
    boss.drops.forEach(drop => {
      if (!drop.isVestige && !drop.isGoldRing && Math.random() < 1 / drop.rate) {
        lootCounts[drop.name] = (lootCounts[drop.name] || 0) + 1;
      }
    });
  } else {
    boss.drops.forEach(drop => {
      if (Math.random() < 1 / drop.rate) lootCounts[drop.name] = (lootCounts[drop.name] || 0) + 1;
    });
  }
}

function rollWeightedDrop(drops) {
  const totalWeight = drops.reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * totalWeight;
  for (const drop of drops) {
    if (r < drop.weight) { lootCounts[drop.name] = (lootCounts[drop.name] || 0) + 1; break; }
    r -= drop.weight;
  }
}

function updateUI() {
  const boss = BOSS_DATA[currentBoss];
  document.getElementById('totalKC').innerText = accumulatedKC.toLocaleString();
  const targetCount = lootCounts[boss.keyItem] || 0;
  document.getElementById('targetDropCount').innerText = targetCount.toLocaleString();

  if (boss.type === 'dt2') {
    document.getElementById('dt2RollsCount').innerText = `${dt2GoldRingsProgress} / 2${dt2GoldRingsProgress === 2 ? ' (Neste er Vestige!)' : ''}`;
  }

  let prob = 0;
  if (boss.type === 'cox') {
    const points = parseInt(document.getElementById('coxPoints').value) || 30000;
    const baseRate = (points / 867500) * (2 / 69);
    prob = (1 - Math.pow(1 - baseRate, accumulatedKC)) * 100;
  } else if (boss.type === 'toa') {
    const chancePercent = parseFloat(document.getElementById('toaChance').value) || 4.0;
    const baseRate = (chancePercent / 100) * (1 / 24);
    prob = (1 - Math.pow(1 - baseRate, accumulatedKC)) * 100;
  } else if (boss.type === 'dt2') {
    const p = 1 / boss.rollRate;
    const p0 = Math.pow(1 - p, accumulatedKC);
    const p1 = accumulatedKC * p * Math.pow(1 - p, accumulatedKC - 1);
    const p2 = (accumulatedKC * (accumulatedKC - 1) / 2) * Math.pow(p, 2) * Math.pow(1 - p, accumulatedKC - 2);
    prob = Math.max(0, (1 - (p0 + p1 + p2)) * 100);
  } else {
    const keyDrop = boss.drops.find(d => d.name === boss.keyItem);
    prob = (1 - Math.pow(1 - 1 / keyDrop.rate, accumulatedKC)) * 100;
  }
  document.getElementById('percentile').innerText = `${prob.toFixed(2)}%`;

  const badge = document.getElementById('statusBadge');
  if (targetCount > 0) {
    badge.innerText = `SPOONED! Fikk ${targetCount}x ${boss.keyItem}!`;
    badge.className = 'alert py-1 px-2 mb-0 alert-success';
  } else {
    const extra = boss.type === 'dt2' ? ` [${dt2GoldRingsProgress}/2 gold rings]` : '';
    badge.innerText = `Ingen drops enda (${accumulatedKC.toLocaleString()} ${boss.unitName} dry${extra})`;
    badge.className = 'alert py-1 px-2 mb-0 alert-danger';
  }

  renderLootGrid();
  document.getElementById('luckKC').value = accumulatedKC || '';
}

function renderLootGrid() {
  const boss = BOSS_DATA[currentBoss];
  const grid = document.getElementById('lootGrid');
  let totalValue = 0;
  grid.innerHTML = boss.drops.map(drop => {
    const count = lootCounts[drop.name] || 0;
    if (!count) return '';
    totalValue += count * drop.value;
    return `<div class="col"><div class="ls-loot-slot">
      <span class="ls-loot-count">${formatNumber(count)}</span>
      <img src="${IMG_BASE}${drop.img}" title="${drop.name}: ${count}" onerror="this.style.opacity=0.15">
    </div></div>`;
  }).join('');
  document.getElementById('totalValue').innerText = `${formatNumber(totalValue)} GP`;
}

function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e4) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

function resetGrind() {
  accumulatedKC = 0;
  dt2GoldRingsProgress = 0;
  lootCounts = {};
  document.getElementById('manualKills').value = '';
  updateUI();
}

// ===== Binomial math (log-space) for the luck checker =====
function lgamma(x) {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
}
function logBinomPMF(n, k, p) {
  if (k < 0 || k > n) return -Infinity;
  if (p <= 0) return k === 0 ? 0 : -Infinity;
  if (p >= 1) return k === n ? 0 : -Infinity;
  return logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
}
function binomPMF(n, k, p) { return Math.exp(logBinomPMF(n, k, p)); }
function binomCDF(n, k, p) {
  if (k < 0) return 0;
  if (k >= n) return 1;
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += binomPMF(n, i, p);
  return Math.min(1, sum);
}
function binomSF(n, k, p) { return Math.min(1, Math.max(0, 1 - binomCDF(n, k - 1, p))); }

function getItemProbability(boss, drop) {
  if (boss.type === 'cox') {
    const points = parseInt(document.getElementById('coxPoints').value) || 30000;
    const totalWeight = boss.drops.reduce((a, b) => a + b.weight, 0);
    return (points / 867500) * (drop.weight / totalWeight);
  } else if (boss.type === 'toa') {
    const chancePercent = parseFloat(document.getElementById('toaChance').value) || 4.0;
    const totalWeight = boss.drops.reduce((a, b) => a + b.weight, 0);
    return (chancePercent / 100) * (drop.weight / totalWeight);
  }
  return 1 / drop.rate;
}

function calcLuck() {
  const boss = BOSS_DATA[currentBoss];
  const kc = parseInt(document.getElementById('luckKC').value) || 0;
  const resultsDiv = document.getElementById('luckResults');
  if (kc <= 0) {
    resultsDiv.innerHTML = `<div class="alert alert-danger py-1 px-2" style="font-size:12px;">Skriv inn gyldig KC over 0.</div>`;
    return;
  }

  let html = '';
  let comboLogProb = 0;
  let nonZeroItems = 0;
  const relevantDrops = boss.drops.filter(d => !d.isGoldRing);

  relevantDrops.forEach(drop => {
    const inputEl = document.getElementById(sanitizeId(drop.name));
    const count = parseInt(inputEl.value) || 0;
    const p = getItemProbability(boss, drop);
    const expected = kc * p;
    const cdf = binomCDF(kc, count, p);
    const sf = binomSF(kc, count, p);
    const pmf = binomPMF(kc, count, p);

    if (count > 0) { nonZeroItems++; comboLogProb += Math.log(Math.max(pmf, 1e-300)); }

    let verdictText, verdictClass;
    if (count === 0) {
      verdictText = `${(cdf * 100).toFixed(2)}% sjanse for fortsatt 0 etter ${kc.toLocaleString()} kills (forventet: ${expected.toFixed(2)}x).`;
      verdictClass = expected >= 2 ? 'alert-danger' : 'alert-secondary';
    } else if (count >= expected) {
      verdictText = `Kun ${(sf * 100).toFixed(sf < 0.01 ? 4 : 2)}% ville fått ${count}+ ved samme KC. SPOONED! (forventet: ${expected.toFixed(2)}x)`;
      verdictClass = 'alert-success';
    } else {
      verdictText = `${(cdf * 100).toFixed(2)}% ville fått ${count} eller færre (forventet: ${expected.toFixed(2)}x). Litt dry.`;
      verdictClass = 'alert-warning';
    }

    html += `<div class="mb-2">
      <div class="d-flex justify-content-between" style="font-size:12.5px;">
        <b>${drop.name}</b><span class="text-secondary">1 av ${(1 / p).toFixed(1)}</span>
      </div>
      <div class="alert ${verdictClass} py-1 px-2 mb-0" style="font-size:11.5px;">${verdictText}</div>
    </div>`;
  });

  if (nonZeroItems >= 2) {
    const oneInY = Math.exp(-comboLogProb);
    const displayOdds = oneInY > 1e15 ? oneInY.toExponential(2) : Math.round(oneInY).toLocaleString();
    html += `<div class="alert py-2 px-2 text-center" style="background:rgba(255,179,0,0.12); border:1px solid #ffb300; color:#ffb300; font-weight:bold; font-size:12.5px;">
      🎲 Kombinert sjanse for akkurat denne kombinasjonen: ~1 av ${displayOdds}
    </div>`;
  }

  resultsDiv.innerHTML = html;
}

// ===== Boot (runs last, after every declaration above exists) =====
if (requireLoginOrRedirect()) {
  renderNavbar('lootsim');
  initLootSim();
}
