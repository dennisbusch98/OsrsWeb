const eventService = require('../services/eventService');

async function getEvents(req, res, next) {
  try {
    res.json(await eventService.getEvents());
  } catch (err) { next(err); }
}

async function createEvent(req, res, next) {
  try {
    const event = await eventService.createEvent({
      title: req.body.title,
      description: req.body.description,
      datetime: req.body.datetime,
      createdBy: req.user.userId,
      tag: req.body.tag
    });
    res.status(201).json(event);
  } catch (err) { next(err); }
}

async function deleteEvent(req, res, next) {
  try {
    res.json(await eventService.deleteEvent(req.params.eventId, req.user.userId));
  } catch (err) { next(err); }
}

module.exports = { getEvents, createEvent, deleteEvent };