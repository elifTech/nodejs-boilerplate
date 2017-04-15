import winston from 'winston';
import httpStatus from 'http-status';

export default
function deleteHandler(service, model, fields, schemaFields, req, res, cb) {
  res.set('x-service', 'resources');

  const eventName = `db.${req.params.resource}.delete`;

  model.findOne({ _id: req.params._id, removed: { $exists: false } }, (err, data) => {
    if (err) {
      return cb(err);
    }
    if (!data) {
      return res.status(httpStatus.NOT_FOUND).end();
    }
    return data.update({ removed: Date.now() }, (error) => {
      if (error) {
        return cb(error);
      }

      winston.debug(`Resource "${req.params.resource}" deleted.`, { resourceId: data._id.toString(), collectionName: req.params.resource });

      service.events.emit('events', eventName, { _id: req.params._id });

      return res.status(httpStatus.NO_CONTENT).end();
    });
  });
}
