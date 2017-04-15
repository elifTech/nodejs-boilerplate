import _ from 'lodash';
import async from 'async';
import mongoose from 'mongoose';
import winston from 'winston';
import httpStatus from 'http-status';

export default
function postHandler(service, model, fields, schemaFields, req, res, cb) {
  res.set('x-service', 'resources');

  const bodyFields = getFields(req.body);
  const updateFields = _.without(_.intersection(fields, bodyFields), '__v');
  let body = deepPick(req.body, updateFields);

  const eventName = `db.${req.params.resource}.insert`;

  async.auto({
    hooks: next => service.runHook(eventName, req, body, next),
    prepareModel: ['hooks', ({ hooks }, next) => {
      body._id = mongoose.Types.ObjectId(); // eslint-disable-line new-cap
      body = _.pickBy(body, item => item !== null);

      next(null, new model(body)); // eslint-disable-line new-cap
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
    }],
    services: ['save', ({ save }, next) => {
      winston.debug(`Resource "${req.params.resource}" created.`, { resourceId: save._id.toString(), collectionName: req.params.resource });

      service.events.emit('events', eventName, { _id: save._id.toString() });
      next();
    }]
  }, (err, { save }) => {
    if (err) {
      return cb(err);
    }

    return res.status(httpStatus.CREATED).json({ _id: save._id });
  });
}

/**
 * Returns plain fields from json object
 *
 * @param {object} jsonObject Json object
 * @returns {string[]} Returns plain array of object fields
 * @example
 * let obj = {
 *   x:10,
 *   y:{ a:20, z:13 }
 * };
 * getFields(obj);
 * // returns ['x', 'y.a', 'y.z']
 */
export
function getFields(jsonObject) {
  const props = [];
  schemaWalk(props, '', 0, jsonObject);
  return _.uniq(props);

  function schemaWalk(array, prefix, level, json) {
    _.forOwn(json, (value, key) => {
      const thisName = (prefix ? `${prefix}.` : '') + key;
      const next = _.partial(schemaWalk, array, thisName, level + 1);
      if (_.isArray(value)) {
        _.each(value, next);
      } else if (_.isPlainObject(value)) {
        next(value);
      } else {
        array.push(thisName);
      }
    });
  }
}

function deepPick(source, fields) {
  const arrFields = _.isString(fields) ? fields.split(',') : fields;
  const result = {};
  _deepPick(result, [], source, [], arrFields);
  return result;

  function _deepPick(res, keyPref, obj, setKey, fieldsArr) {
    _.each(_.keys(obj), (key) => {
      const keyArr = keyPref.concat([key]);
      const setArr = setKey.concat([key]);
      const path = keyArr.join('.');
      const val = obj[key];
      const setPath = setArr.join('.');
      if (_.isArray(val)) {
        res[setPath] = []; // eslint-disable-line no-param-reassign
        _.each(val, (item) => {
          const x = {};
          res[setPath].push(x);
          _deepPick(x, keyArr, item, [], fieldsArr);
        });
      } else if (_.includes(fieldsArr, path)) {
        res[setPath] = val; // eslint-disable-line no-param-reassign
      } else if (_.isObject(val)) {
        _deepPick(res, keyArr, val, setArr, fieldsArr);
      }
    });
  }
}
