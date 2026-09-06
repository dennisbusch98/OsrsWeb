let EVENTS = [];

function showEventForm() {
  document.getElementById('addEventToggle').classList.add('d-none');
  document.getElementById('eventFormPanel').classList.remove('d-none');
  document.getElementById('eventTitle').focus();
}

function hideEventForm() {
  document.getElementById('eventFormPanel').classList.add('d-none');
  document.getElementById('addEventToggle').classList.remove('d-none');
  document.getElementById('eventForm').reset();
  document.getElementById('eventError').classList.add('d-none');
}

async function loadEvents() {
  const list = document.getElementById('eventsList');
  list.innerHTML = '<p class="text-secondary">Laster events...</p>';
  try {
    EVENTS = await Api.get('/api/events');
    renderEvents();
  } catch (err) {
    list.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderEvents() {
  const list = document.getElementById('eventsList');
  const me = Api.getUser();

  if (EVENTS.length === 0) {
    list.innerHTML = '<p class="text-secondary">Ingen events planlagt enda. Trykk "Legg til nytt event" over!</p>';
    return;
  }

  list.innerHTML = EVENTS.map(ev => {
    const isMine = me && ev.createdBy === me.id;
    return `
      <div class="panel event-card p-3 mb-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">${escapeHtmlEv(ev.title)}</h5>
            <div class="text-secondary" style="font-size:13px;">${new Date(ev.datetime).toLocaleString('no-NO')}</div>
          </div>
          ${isMine ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteEvent('${ev.id}')">Slett</button>` : ''}
        </div>
        ${ev.description ? `<p class="mt-2 mb-2" style="white-space:pre-wrap;">${escapeHtmlEv(ev.description)}</p>` : ''}
        <div class="countdown" data-target="${ev.datetime}">--:--:--</div>
      </div>
    `;
  }).join('');

  tickCountdowns();
}

function tickCountdowns() {
  document.querySelectorAll('.countdown').forEach(el => {
    const target = new Date(el.dataset.target).getTime();
    const now = Date.now();
    let diff = target - now;

    if (diff <= 0) {
      el.textContent = '🔥 Eventet har startet (eller er over)!';
      el.style.color = '#4caf50';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);
    const secs = Math.floor(diff / 1000);

    el.textContent = `⏳ ${days}d ${pad(hours)}t ${pad(mins)}m ${pad(secs)}s`;
  });
}

function pad(n) { return String(n).padStart(2, '0'); }

function escapeHtmlEv(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

document.getElementById('eventForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('eventError');
  errorBox.classList.add('d-none');
  try {
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const datetime = document.getElementById('eventDatetime').value;
    await Api.post('/api/events', { title, description, datetime });
    hideEventForm();
    loadEvents();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('d-none');
  }
});

async function deleteEvent(id) {
  if (!confirm('Slette dette eventet?')) return;
  try {
    await Api.del(`/api/events/${id}`);
    loadEvents();
  } catch (err) {
    alert(err.message);
  }
}

if (requireLoginOrRedirect()) {
  renderNavbar('events');
  loadEvents();
  setInterval(tickCountdowns, 1000);
}
