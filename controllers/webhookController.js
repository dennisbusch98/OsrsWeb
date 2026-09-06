// Real RuneLite integration for auto-posting to a character's feed -
// loot AND achievements (level ups, quests, collection log, pets,
// personal bests). RuneLite has ONE global "Webhook" URL in its
// Notification settings, and every plugin's notifications get sent to
// that same URL - so this single endpoint receives all of it. You just
// enable "Notify" on whichever plugins you want (Loot Tracker, Level Up,
// Quest, Collection Log, Pet, Personal Best...) and they all show up here.
//
// RuneLite POSTs using Discord's webhook format: multipart/form-data with
// a "payload_json" text field (and optionally a "file" screenshot), or a
// plain JSON body with a "content" field, depending on plugin/version.
// This endpoint accepts both, plus a simple custom JSON body if you'd
// rather write your own small script. See README.md for exact steps.
//
//   POST /api/webhook/event/:characterId/:secret   (use this one)
//   POST /api/webhook/loot/:characterId/:secret    (old alias, still works)
//
// :secret must match WEBHOOK_SECRET from .env - stops a stranger from
// posting fake stuff to your feed if they guess the URL.

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const postService = require('../services/postService');
const { Character } = require('../models');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'loot');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${uuid()}${path.extname(file.originalname) || '.png'}`)
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const WIKI_IMG_BASE = 'https://oldschool.runescape.wiki/images/';

// Best-effort: turn "Twisted bow" into a real wiki icon URL, the same way
// the loot simulator / gear catalog already do it.
function guessWikiIconUrl(itemName) {
  if (!itemName) return null;
  const clean = itemName.trim().replace(/\s+/g, '_').replace(/'/g, '%27');
  return `${WIKI_IMG_BASE}${clean}.png`;
}

// Classifies the notification text so the feed can show a nice label/emoji.
function classify(content) {
  const c = content.toLowerCase();
  if (/collection log/.test(c)) return { type: 'loot', emoji: '📖', label: 'Collection log' };
  if (/\bpet\b|followed you home|you have a funny feeling/.test(c)) return { type: 'loot', emoji: '🐾', label: 'Pet' };
  if (/received a drop|valuable drop|loot/.test(c)) return { type: 'loot', emoji: '💰', label: 'Loot' };
  if (/level(led)? up|levelled up|is now level/.test(c)) return { type: 'achievement', emoji: '⬆️', label: 'Level up' };
  if (/quest complete|has completed a quest/.test(c)) return { type: 'achievement', emoji: '📜', label: 'Quest' };
  if (/personal best/.test(c)) return { type: 'achievement', emoji: '⏱️', label: 'Personal best' };
  if (/combat achievement/.test(c)) return { type: 'achievement', emoji: '🏆', label: 'Combat achievement' };
  return { type: 'post', emoji: '📢', label: 'RuneLite' };
}

function extractIconFromPayload(payload) {
  const embed = payload && payload.embeds && payload.embeds[0];
  if (!embed) return null;
  return (embed.thumbnail && embed.thumbnail.url) || (embed.image && embed.image.url) || null;
}

// Tries to pull an item/skill name out of common RuneLite notification
// phrasing so we can attach an icon even when the payload has no embed image.
function guessItemNameFromContent(content) {
  const patterns = [
    /received (?:a|an) (?:drop|item):?\s*([A-Za-z0-9' -]+?)(?:\s*\(|\.|$)/i,
    /valuable drop:?\s*([A-Za-z0-9' -]+?)(?:\s*\(|\.|$)/i,
    /received a rare drop:?\s*([A-Za-z0-9' -]+?)(?:\s*\(|\.|$)/i
  ];
  for (const re of patterns) {
    const m = content.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

const receiveWebhookEvent = [
  // If the request isn't multipart, multer just calls next() and leaves
  // req.body as whatever express.json() already parsed - both flows work.
  upload.any(),
  async (req, res, next) => {
    try {
      const { characterId, secret } = req.params;
      if (!secret || secret !== process.env.WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Ugyldig webhook secret.' });
      }

      const character = await Character.findByPk((characterId || '').toLowerCase());
      if (!character) return res.status(404).json({ error: 'Ukjent karakter.' });

      let content = null;
      let payloadIcon = null;

      // 1) RuneLite/Discord-style multipart with a payload_json field
      if (req.body && req.body.payload_json) {
        try {
          const payload = JSON.parse(req.body.payload_json);
          content = payload.content ||
            (payload.embeds && payload.embeds[0] && (payload.embeds[0].description || payload.embeds[0].title)) ||
            null;
          payloadIcon = extractIconFromPayload(payload);
        } catch (e) { /* malformed payload_json, fall through to other cases */ }
      }

      // 2) Plain Discord-compatible JSON body: { "content": "..." }
      if (!content && req.body && req.body.content) {
        content = req.body.content;
      }

      // 3) Our own simple custom format: { itemName, value } / { achievement }
      if (!content && req.body && req.body.itemName) {
        const valueText = req.body.value
          ? ` (verdt ca. ${Number(req.body.value).toLocaleString('no-NO')} gp)`
          : '';
        content = `🎉 ${character.displayName} fikk en drop: ${req.body.itemName}${valueText}!`;
      }
      if (!content && req.body && req.body.achievement) {
        content = `🏆 ${character.displayName}: ${req.body.achievement}`;
      }

      if (!content) {
        return res.status(400).json({
          error: 'Fant ingen "content", "payload_json", "itemName" eller "achievement" i forespørselen.'
        });
      }

      const classification = classify(content);
      const { emoji, label } = classification;

      // Icon priority: 1) screenshot RuneLite attached, 2) icon URL from the
      // Discord embed itself, 3) explicit imageUrl in a custom JSON body,
      // 4) best-effort guess from an item name mentioned in the text.
      const screenshot = (req.files || []).find(f => f.fieldname === 'file');
      let imageUrl = null;
      if (screenshot) {
        imageUrl = `/uploads/loot/${screenshot.filename}`;
      } else if (payloadIcon) {
        imageUrl = payloadIcon;
      } else if (req.body && req.body.imageUrl) {
        imageUrl = req.body.imageUrl;
      } else {
        const guessedName = (req.body && req.body.itemName) || guessItemNameFromContent(content);
        imageUrl = guessWikiIconUrl(guessedName);
      }

      const post = await postService.createPost({
        authorId: null,
        authorName: character.displayName,
        characterId: character.id,
        type: (classification.type === 'achievement' || classification.type === 'loot') ? classification.type : 'post',
        content: `${emoji} [${label}] ${content}`,
        imageUrl
      });

      res.status(201).json(post);
    } catch (err) { next(err); }
  }
];

module.exports = { receiveWebhookEvent };