// Builds the personalised RuneLite webhook URL for the logged-in user's
// own character, so they never have to hand-construct it or ask an admin.
function getWebhookUrl(req, res) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'WEBHOOK_SECRET er ikke satt på serveren enda.' });
  }
  const base = `${req.protocol}://${req.get('host')}`;
  const url = `${base}/api/webhook/event/${req.user.characterId}/${secret}`;
  res.json({ url, characterId: req.user.characterId });
}

module.exports = { getWebhookUrl };
