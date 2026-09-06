function renderNavbar(activePage) {
  const user = Api.getUser();
  const el = document.getElementById('navbarPlaceholder');
  if (!el) return;

  const link = (href, label, page) =>
    `<li class="nav-item"><a class="nav-link ${activePage === page ? 'active' : ''}" href="${href}">${label}</a></li>`;

  el.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-custom mb-4">
      <div class="container">
        <a class="navbar-brand font-rune d-flex align-items-center" href="/home.html" style="color:#ffb300;"><img src="/img/logo.jpg" class="navbar-brand-logo" alt="logo">Stuck of Amascut</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMain">
          <ul class="navbar-nav me-auto">
            ${link('/home.html', 'Hjem', 'home')}
            ${link('/characters.html', 'Karakterer', 'characters')}
            ${link('/events.html', 'Events', 'events')}
            ${link('/loot-simulator.html', 'Loot Simulator', 'lootsim')}
            ${link('/settings.html', '⚙️ Settings', 'settings')}
          </ul>
          <div class="d-flex align-items-center gap-2">
            ${user ? `<span class="text-secondary" style="font-size:13px;">Innlogget som <b style="color:#ffb300">${user.username}</b> (${user.characterId})</span>` : ''}
            <button class="btn btn-sm btn-outline-light" onclick="logout()">Logg ut</button>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function logout() {
  Api.clearSession();
  window.location.href = '/login.html';
}
