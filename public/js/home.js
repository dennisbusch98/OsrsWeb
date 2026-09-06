if (requireLoginOrRedirect()) {
  renderNavbar('home');
  loadFeed();
}

const COMMENTS_CACHE = {}; // postId -> comments array, loaded lazily on expand
const OPEN_COMMENTS = new Set(); // postIds currently expanded

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
    // Re-render any comment sections that were left open across a refresh
    OPEN_COMMENTS.forEach(postId => renderCommentsInto(postId));
  } catch (err) {
    feedEl.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderPost(p, me) {
  const isLoot = p.type === 'loot';
  const isAchievement = p.type === 'achievement';
  const isMine = me && p.authorId === me.id;
  const avatarEmoji = isLoot ? '💰' : isAchievement ? '🏆' : (p.type === 'system' ? '📢' : '📝');
  const heart = p.likedByMe ? '❤️' : '🤍';
  return `
    <div class="feed-post ${isLoot ? 'loot-post' : ''} ${isAchievement ? 'achievement-post' : ''}" id="post-${p.id}">
      <div class="d-flex justify-content-between">
        <div>
          <span class="post-author">${avatarEmoji} ${p.authorName}${p.characterId ? ` <span class="text-secondary">(${p.characterId})</span>` : ''}</span>
          <div class="post-meta">${timeAgo(p.createdAt)}</div>
        </div>
        ${isMine ? `<button class="btn btn-sm btn-outline-danger" onclick="deletePost('${p.id}')">Slett</button>` : ''}
      </div>
      <p class="mt-2 mb-1" style="white-space: pre-wrap;">${escapeHtml(p.content)}</p>
      ${p.imageUrl ? `<img src="${p.imageUrl}" class="img-fluid rounded mt-2" style="max-height:320px;" onerror="this.style.display='none'">` : ''}
      <div class="d-flex gap-3 mt-2 post-actions">
        <button class="btn btn-sm btn-link p-0 text-decoration-none" onclick="toggleLike('${p.id}')">
          ${heart} <span id="likeCount-${p.id}">${p.likeCount || 0}</span>
        </button>
        <button class="btn btn-sm btn-link p-0 text-decoration-none" onclick="toggleComments('${p.id}')">
          💬 <span id="commentCount-${p.id}">${p.commentCount || 0}</span>
        </button>
      </div>
      <div id="comments-${p.id}" class="mt-2" style="display:none;"></div>
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

// ===== Likes =====
async function toggleLike(postId) {
  try {
    const result = await Api.post(`/api/posts/${postId}/like`, {});
    document.getElementById(`likeCount-${postId}`).textContent = result.likeCount;
    const btn = document.querySelector(`#post-${postId} .post-actions button:first-child`);
    if (btn) btn.innerHTML = `${result.liked ? '❤️' : '🤍'} <span id="likeCount-${postId}">${result.likeCount}</span>`;
  } catch (err) {
    alert(err.message);
  }
}

// ===== Comments =====
function toggleComments(postId) {
  const box = document.getElementById(`comments-${postId}`);
  const isOpen = box.style.display !== 'none';
  if (isOpen) {
    box.style.display = 'none';
    OPEN_COMMENTS.delete(postId);
  } else {
    box.style.display = 'block';
    OPEN_COMMENTS.add(postId);
    renderCommentsInto(postId);
  }
}

async function renderCommentsInto(postId) {
  const box = document.getElementById(`comments-${postId}`);
  if (!box) return;
  box.innerHTML = '<p class="text-secondary" style="font-size:12px;">Laster kommentarer...</p>';
  try {
    const comments = await Api.get(`/api/posts/${postId}/comments`);
    const me = Api.getUser();
    box.innerHTML = `
      <div class="comment-list mb-2">
        ${comments.map(c => `
          <div class="comment-line">
            <b>${escapeHtml(c.authorName)}:</b> ${escapeHtml(c.content)}
            ${me && c.authorId === me.id ? `<button class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="deleteComment('${c.id}', '${postId}')">slett</button>` : ''}
          </div>
        `).join('') || '<p class="text-secondary" style="font-size:12px;">Ingen kommentarer enda.</p>'}
      </div>
      <div class="input-group input-group-sm">
        <input type="text" class="form-control" id="commentInput-${postId}" placeholder="Skriv en kommentar...">
        <button class="btn btn-noob" onclick="submitComment('${postId}')">Send</button>
      </div>
    `;
  } catch (err) {
    box.innerHTML = `<div class="alert alert-danger py-1 px-2" style="font-size:12px;">${err.message}</div>`;
  }
}

async function submitComment(postId) {
  const input = document.getElementById(`commentInput-${postId}`);
  const content = input.value.trim();
  if (!content) return;
  try {
    await Api.post(`/api/posts/${postId}/comments`, { content });
    input.value = '';
    await renderCommentsInto(postId);
    const countEl = document.getElementById(`commentCount-${postId}`);
    if (countEl) countEl.textContent = Number(countEl.textContent) + 1;
  } catch (err) {
    alert(err.message);
  }
}

async function deleteComment(commentId, postId) {
  try {
    await Api.del(`/api/posts/comments/${commentId}`);
    await renderCommentsInto(postId);
    const countEl = document.getElementById(`commentCount-${postId}`);
    if (countEl) countEl.textContent = Math.max(0, Number(countEl.textContent) - 1);
  } catch (err) {
    alert(err.message);
  }
}
