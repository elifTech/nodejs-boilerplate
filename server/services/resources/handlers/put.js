import _ from 'lodash';
import async from 'async';
import deepmerge from 'deepmerge';
import winston from 'winston';
import httpStatus from 'http-status';
import { getJsonFields, deepPick, setAndUnsetQuery } from '../helpers';

export default
function putHandler(service, model, fields, schemaFields, req, res, cb) {
  res.set('x-service', 'resources');

  const eventName = `db.${req.params.resource}.update`;

  req.body._id = req.params._id; // eslint-disable-line no-param-reassign

  const zipFields = _.mapValues(_.zipObject(fields), _.constant(1));
  async.auto({
    resource: next => model.findById(req.params._id, zipFields, next),
    hooks: next => service.runHook(eventName, req, next),
    prepareModel: ['hooks', 'resource', ({ resource }, next) => {
      const bodyFields = getJsonFields(req.body);
      const wildcardFields = _.map(_.filter(schemaFields, item => item.indexOf('.*') !== -1), item => item.replace('.*', ''));
      const mixedFields = _.filter(bodyFields, item => !!_.find(wildcardFields, field => item.indexOf(`${field}.`) === 0));
      const updateFields = _.without(_.intersection(schemaFields, bodyFields), '__v');

      let body = deepPick(req.body, updateFields);
      const mixedBody = deepPick(req.body, wildcardFields);
      _.each(mixedFields, field => resource.markModified(field));

      body = _.pickBy(body, item => item !== null);
      body = _.assign(body, { modifyDate: Date.now() });
      body = deepmerge(body, mixedBody);

      setAndUnsetQuery(resource, body);
      next(null, resource);
    }],
    validate: ['prepareModel', ({ prepareModel }, next) => {
      if (!prepareModel) {
        return next({ msg: 'Not found' });
      }
      return prepareModel.validate((err) => {
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
