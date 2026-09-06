if (requireLoginOrRedirect()) {
  renderNavbar('settings');
  loadWebhookUrl();
}

async function loadWebhookUrl() {
  const msg = document.getElementById('webhookMsg');
  try {
    const result = await Api.get('/api/settings/webhook-url');
    document.getElementById('webhookUrlInput').value = result.url;
    document.getElementById('webhookCharName').textContent = result.characterId;
  } catch (err) {
    msg.innerHTML = `<div class="alert alert-danger py-1 px-2" style="font-size:12px;">${err.message}</div>`;
  }
}

function copyWebhookUrl() {
  const input = document.getElementById('webhookUrlInput');
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value).then(() => {
    const confirmEl = document.getElementById('copyConfirm');
    confirmEl.style.display = 'block';
    setTimeout(() => { confirmEl.style.display = 'none'; }, 1800);
  }).catch(() => {
    document.execCommand('copy');
  });
}
