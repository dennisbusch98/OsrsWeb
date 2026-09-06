const { Event } = require('../models');

async function getEvents() {
  const events = await Event.findAll({ order: [['datetime', 'ASC']] });
  return events.map(e => e.toJSON());
}

async function createEvent({ title, description, datetime, createdBy }) {
  if (!title || !title.trim()) {
    const e = new Error('Eventet trenger en tittel.');
    e.status = 400;
    throw e;
  }
  if (!datetime || isNaN(Date.parse(datetime))) {
    const e = new Error('Ugyldig dato/tid for eventet.');
    e.status = 400;
    throw e;
  }
  const event = await Event.create({
    title: title.trim().slice(0, 150),
    description: (description || '').trim().slice(0, 1000),
    datetime: new Date(datetime),
    createdBy
  });
  return event.toJSON();
}

async function deleteEvent(eventId, userId) {
  const event = await Event.findByPk(eventId);
  if (!event) {
    const e = new Error('Fant ikke eventet.');
    e.status = 404;
    throw e;
  }
  if (event.createdBy !== userId) {
    const e = new Error('Du kan bare slette events du selv har laget.');
    e.status = 403;
    throw e;
  }
  await event.destroy();
  return { ok: true };
}

module.exports = { getEvents, createEvent, deleteEvent };
