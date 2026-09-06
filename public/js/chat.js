if (requireLoginOrRedirect()) {
  renderNavbar('chat');
  loadChat();
  setInterval(loadChat, 4000); // simple polling - good enough for a clan chat feed
}

function escapeHtmlChat(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

function timeAgoChat(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'nå';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}t`;
}

async function loadChat() {
  const log = document.getElementById('chatLog');
  try {
    const posts = await Api.get('/api/posts?type=chat');
    if (posts.length === 0) {
      log.innerHTML = '<p class="text-secondary">Ingen chat-meldinger enda. Sett opp webhooken i Settings.</p>';
      return;
    }
    // posts come back newest-first; flex column-reverse handles the visual order
    log.innerHTML = posts.map(p => `
      <div class="chat-line">
        <b>${escapeHtmlChat(p.authorName)}:</b> ${escapeHtmlChat(p.content)}
        <span class="chat-time">${timeAgoChat(p.createdAt)}</span>
      </div>
    `).join('');
  } catch (err) {
    log.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}
