import _ from 'lodash';
import async from 'async';
import winston from 'winston';
import httpStatus from 'http-status';
import { getJsonFields, deepPick, setAndUnsetQuery } from '../helpers';

export default
function putHandler(service, model, fields, schemaFields, req, res, cb) {
  res.set('x-service', 'resources');

  const eventName = `db.${req.params.resource}.update`;

  const zipFields = _.mapValues(_.zipObject(fields), _.constant(1));
  const bodyFields = getJsonFields(req.body);
  const updateFields = _.without(_.intersection(fields, bodyFields), '__v');

  let body = deepPick(req.body, updateFields);
  body._id = req.params._id;

  async.auto({
    resource: next => model.findById(req.params._id, zipFields, next),
    hooks: next => service.runHook(eventName, req, body, next),
    prepareModel: ['hooks', 'resource', ({ resource }, next) => {
      body = _.pickBy(body, item => item !== null);
      body = _.extend(body, { modifyDate: Date.now() });

      setAndUnsetQuery(resource, body);
      next(null, resource);
    }],
    validate: ['prepareModel', ({ prepareModel }, next) => {
      prepareModel.validate((err) => {
        if (!err) {
          return next();
        }
        const result = {};

        Object.keys(err.errors).forEach(path => (result[path] = err.errors[path].message));

        return res
          .status(httpStatus.UNPROCESSABLE_ENTITY)
          .json(result);
      });
    }],
    save: ['validate', 'prepareModel', ({ prepareModel }, next) => {
      prepareModel.save({ validateBeforeSave: false }, (err, savedItem) => {
        if (err) {
          return next(err);
        }
        return next(null, savedItem);
      });
    }]
  }, (err, { resource }) => {
    if (err) {
      return cb(err);
    }
    winston.info(`Resource "${req.params.resource}" changed.`, { resourceId: resource._id.toString(), collectionName: req.params.resource });

    service.events.emit('events', eventName, { _id: resource._id.toString() });

    return res.status(httpStatus.NO_CONTENT).end();
  });
}
