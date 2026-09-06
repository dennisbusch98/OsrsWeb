// Tiny fetch wrapper shared by every page. Keeps the JWT in localStorage
// and attaches it automatically to every request.

const Api = (() => {
  const TOKEN_KEY = 'soa_token';
  const USER_KEY = 'soa_user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
  }
  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  function isLoggedIn() { return !!getToken(); }

  async function request(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let data = null;
    try { data = await res.json(); } catch (e) { /* empty body */ }

    if (!res.ok) {
      const message = (data && data.error) || `Feil (${res.status})`;
      if (res.status === 401) {
        // token expired / invalid -> boot back to login
        clearSession();
      }
      throw new Error(message);
    }
    return data;
  }

  return {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body),
    put: (url, body) => request('PUT', url, body),
    del: (url) => request('DELETE', url),
    getToken, getUser, setSession, clearSession, isLoggedIn
  };
})();

// Guard for pages that require login. Call at top of a protected page's script.
function requireLoginOrRedirect() {
  if (!Api.isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}
