if (requireLoginOrRedirect()) {
  renderNavbar('home');
  loadFeed();
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'akkurat nå';
  if (mins < 60) return `${mins} min siden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} t siden`;
  const days = Math.floor(hours / 24);
  return `${days} d siden`;
}

async function loadFeed() {
  const feedEl = document.getElementById('feed');
  feedEl.innerHTML = '<p class="text-secondary">Laster feed...</p>';
  try {
    const allPosts = await Api.get('/api/posts');
    // Clan chat has its own dedicated page - keep the home feed for
    // posts/loot/achievements only, so it doesn't get flooded with chat spam.
    const posts = allPosts.filter(p => p.type !== 'chat');
    const me = Api.getUser();
    if (posts.length === 0) {
      feedEl.innerHTML = '<p class="text-secondary">Ingen innlegg enda. Bli den første til å poste noe!</p>';
      return;
    }
    feedEl.innerHTML = posts.map(p => renderPost(p, me)).join('');
  } catch (err) {
    feedEl.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderPost(p, me) {
  const isLoot = p.type === 'loot';
  const isAchievement = p.type === 'achievement';
  const isMine = me && p.authorId === me.id;
  const avatarEmoji = isLoot ? '💰' : isAchievement ? '🏆' : (p.type === 'system' ? '📢' : '📝');
  return `
    <div class="feed-post ${isLoot ? 'loot-post' : ''} ${isAchievement ? 'achievement-post' : ''}">
      <div class="d-flex justify-content-between">
        <div>
          <span class="post-author">${avatarEmoji} ${p.authorName}${p.characterId ? ` <span class="text-secondary">(${p.characterId})</span>` : ''}</span>
          <div class="post-meta">${timeAgo(p.createdAt)}</div>
        </div>
        ${isMine ? `<button class="btn btn-sm btn-outline-danger" onclick="deletePost('${p.id}')">Slett</button>` : ''}
      </div>
      <p class="mt-2 mb-1" style="white-space: pre-wrap;">${escapeHtml(p.content)}</p>
      ${p.imageUrl ? `<img src="${p.imageUrl}" class="img-fluid rounded mt-2" style="max-height:320px;" onerror="this.style.display='none'">` : ''}
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('postError');
  errorBox.classList.add('d-none');
  const content = document.getElementById('postContent').value;
  const imageUrl = document.getElementById('postImageUrl').value;
  const postAsCharacter = document.getElementById('postAsCharacter').checked;
  try {
    await Api.post('/api/posts', { content, imageUrl, postAsCharacter });
    document.getElementById('postContent').value = '';
    document.getElementById('postImageUrl').value = '';
    loadFeed();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('d-none');
  }
});

async function deletePost(id) {
  if (!confirm('Slette dette innlegget?')) return;
  try {
    await Api.del(`/api/posts/${id}`);
    loadFeed();
  } catch (err) {
    alert(err.message);
  }
}
