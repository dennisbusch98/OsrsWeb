if (Api.isLoggedIn()) {
  window.location.href = '/home.html';
}

let ALL_CHARACTERS = [];

function showTab(which) {
  const isLogin = which === 'login';
  document.getElementById('loginPanel').classList.toggle('d-none', !isLogin);
  document.getElementById('registerPanel').classList.toggle('d-none', isLogin);
  document.getElementById('loginTabBtn').classList.toggle('active', isLogin);
  document.getElementById('registerTabBtn').classList.toggle('active', !isLogin);
  if (!isLogin && ALL_CHARACTERS.length === 0) loadCharacterList();
}

async function loadCharacterList() {
  try {
    ALL_CHARACTERS = await Api.get('/api/characters');
  } catch (err) {
    ALL_CHARACTERS = [];
  }
}

function checkCharacterName() {
  const msgEl = document.getElementById('characterCheckMsg');
  const typed = document.getElementById('registerCharacter').value.trim().toLowerCase();
  if (!typed) { msgEl.innerHTML = ''; return; }

  const match = ALL_CHARACTERS.find(c => c.id === typed || c.displayName.toLowerCase() === typed);
  if (!match) {
    msgEl.innerHTML = '<span class="text-danger">Finnes ikke i clanet. Sjekk stavemåten.</span>';
  } else if (match.claimed) {
    msgEl.innerHTML = '<span class="text-danger">Denne karakteren er allerede tatt av noen andre.</span>';
  } else {
    msgEl.innerHTML = `<span class="text-success">✔ ${match.displayName} er ledig!</span>`;
  }
}

document.getElementById('registerCharacter').addEventListener('input', () => {
  if (ALL_CHARACTERS.length === 0) {
    loadCharacterList().then(checkCharacterName);
  } else {
    checkCharacterName();
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('loginError');
  errorBox.classList.add('d-none');
  try {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const result = await Api.post('/api/auth/login', { username, password });
    Api.setSession(result.token, result.user);
    window.location.href = '/home.html';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('d-none');
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('registerError');
  const successBox = document.getElementById('registerSuccess');
  errorBox.classList.add('d-none');
  successBox.classList.add('d-none');
  try {
    const typed = document.getElementById('registerCharacter').value.trim().toLowerCase();
    const match = ALL_CHARACTERS.find(c => c.id === typed || c.displayName.toLowerCase() === typed);
    if (!match) throw new Error('Skriv inn navnet på en gyldig, ledig karakter først.');

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const result = await Api.post('/api/auth/register', { characterId: match.id, username, password });
    Api.setSession(result.token, result.user);
    successBox.textContent = 'Velkommen inn i clanet! Sender deg videre...';
    successBox.classList.remove('d-none');
    setTimeout(() => window.location.href = '/home.html', 900);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('d-none');
  }
});
