import _ from 'lodash';
import express from 'express';
import fs from 'fs';
import path from 'path';
import async from 'async';
import winston from 'winston';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import httpStatus from 'http-status';

import getHandler from './handlers/get';
import postHandler from './handlers/post';
import deleteHandler from './handlers/delete';
import putHandler from './handlers/put';

const allowQueryParams = [
  'search', 'page', 'perPage', 'sort', 'fields', 'flags'
];

const handlers = {
  get: getHandler,
  post: postHandler,
  delete: deleteHandler,
  put: putHandler
};

export default
class ResourceService {
  constructor(options = {}) {
    this.options = options;
    this.options.pluginsPath = this.options.pluginsPath || path.join(__dirname, '..', '..', 'plugins', 'resources');

    this.hooks = {};
    this.resources = {};
    this.events = new EventEmitter();
  }

  loadResources(cb) {
    const filesPath = this.options.pluginsPath;

    fs.readdir(filesPath, (err, files) => {
      if (err) {
        return cb(err);
      }

      return async.each(files, (fileName, next) => {
        if (path.extname(fileName) !== '.json') {
          return next();
        }
        const name = path.basename(fileName, '.json');
        winston.debug(`[ResourceService] loading resource "${name}"...`);

        const fullPath = path.join(filesPath, fileName);
        const content = fs.readFileSync(fullPath, 'utf8');
        let resource = null;
        try {
          resource = JSON.parse(content);
        } catch (e) {
          return next();
        }
        if (!resource) {
          return next();
        }
        this.resources[name] = resource;

        winston.debug(`[ResourceService] resource "${name}" loaded.`);
        return next();
      }, cb);
    });
  }

  loadHooks(cb) {
    const filesPath = path.join(this.options.pluginsPath, 'hooks');

    fs.readdir(filesPath, (err, files) => {
      if (err) {
        return cb(err);
      }

      return async.each(files, (fileName, next) => {
        if (path.extname(fileName) !== '.js') {
          return next();
        }
        this.registerHook(path.join(filesPath, fileName));
        return next();
      }, cb);
    });
  }

  registerHook(pluginFilename) {
    winston.debug('Loading resources hook from file "%s"', pluginFilename);

    const plugin = require(pluginFilename); // eslint-disable-line global-require

    Object.keys(plugin).forEach((taskName) => {
      const hookHandler = plugin[taskName];
      if (!this.hooks[taskName]) {
        this.hooks[taskName] = [];
      }
      this.hooks[taskName].push(hookHandler);
    });
  }

  runHook(hookName, req, body, cb) {
    if (!this.hooks[hookName]) {
      return cb();
    }
    return async.eachLimit(this.hooks[hookName], 1, (hook, next) => hook(this, req, body, next), cb);
  }

  getResource(name) {
    return this.resources[name];
  }

  /**
   * Get plain fields from mongoose schema
   *
   * @param schema Mongoose schema
   * @returns {string[]} Returns plain array of schema fields
   * @example
   * let schema = mongoose.Schema({
   *   x:String,
   *   y:{ a:String, z:String }
   * });
   * _getMongooseFields(schema);
   * // returns ['x', 'y.a', 'y.z']
   */
  static _getMongooseFields(mongooseSchema) {
    const props = [];
    schemaWalk(mongooseSchema, props, '', 0);
    return props;

    function schemaWalk(schema, array, prefix, level) {
      if (!schema) {
        return;
      }
      schema.eachPath((pathName, pathType) => {
        const thisName = (prefix ? `${prefix}.` : '') + pathName;
        if (_.isArray(pathType.options.type)) {
          schemaWalk(pathType.schema, array, thisName, level + 1);
        } else if (level === 0 || !pathType.options.auto) {
          array.push(thisName);
        }
      });
    }
  }

  getRouter() {
    const router = express.Router(); // eslint-disable-line new-cap
    const resourceRoute = this.middleware.bind(this);

    router.get('/:resource', resourceRoute);
    router.get('/:resource/:_id', resourceRoute);
    router.post('/:resource', resourceRoute);
    router.put('/:resource/:_id', resourceRoute);
    router.delete('/:resource/:_id', resourceRoute);

    return router;
  }

  middleware(req, res, next) {
    const resourceName = req.params && req.params.resource;
    if (!resourceName) {
      throw new Error('Missing resource name');
    }
    const resource = this.getResource(resourceName);
    if (!resource) {
      // throw new Error(`Unknown resource "${resourceName}"`);
      return next();
    }
    req.resource = resource; // eslint-disable-line no-param-reassign

    const modelName = resource.model || resourceName;
    const model = mongoose.model(modelName);

    const method = req.method.toLowerCase();
    const query = req.query || {};

    const paramFields = _.isArray(query.fields) ? query.fields : _.without((query.fields || '').split(','), '');
    const bodyFields = _.keys(req.body);
    const reqFieldsArr = _.union(paramFields, bodyFields);

    const schemaFields = ResourceService._getMongooseFields(model.schema);
    const params = _.keys(_.omit(query, allowQueryParams));
    if (req.params._id) {
      params.push('_id');
    }

    const features = {};
    if (req.fflip) {
      const ff = req.fflip._fflip.features;
      Object.keys(ff).forEach(featureKey =>
        (features[featureKey] = req.fflip.has(ff[featureKey].id))
      );
    }
    const { fields, hasAccess, deniedFields, reason } = ResourceService.checkAcl(resource.acl, schemaFields, method, params, reqFieldsArr, features);

    if (!hasAccess) {
      return res.json({
        message: reason || 'Forbidden',
        deniedFields
      }, httpStatus.FORBIDDEN);
    }

    if (handlers[method]) {
      return handlers[method](this, model, fields, schemaFields, req, res, next);
    }
    return next();
  }

  static checkFeatures(features, activeFeatures) {
    if (_.isString(features) && features === '*') {
      return true;
    }
    if (_.isBoolean(features) && features === false) {
      return false;
    }

    let isAllow = true;
    features.forEach((feature) => {
      if (!activeFeatures[feature]) {
        isAllow = false;
      }
    });
    return isAllow;
  }

  static compareRule(aclRules, method, params, activeFeatures) {
    if (_.isBoolean(aclRules) && aclRules === false) {
      return false;
    }

    const reqParams = _.isArray(params) ? params : [params];

    let isAllow = false;
    Object.keys(aclRules).forEach((aclMethod) => {
      const features = aclRules[aclMethod];
      let argMethod = aclMethod;
      let aclParams = [];
      if (argMethod.indexOf('?') !== -1) {
        const sp = argMethod.split('?');
        argMethod = sp[0];
        aclParams = [sp[1]];
        if (aclParams[0].indexOf('&') !== -1) {
          aclParams = aclParams[0].split('&');
        }
      }
      if (argMethod === method && aclParams.length === reqParams.length &&
        _.intersection(aclParams, reqParams).length === aclParams.length &&
        ResourceService.checkFeatures(features, activeFeatures)) {
        isAllow = true;
      }
    });
    return isAllow;
  }

  static checkAcl(aclRules, schemaFields, method, params, requestedFields, features) {
    const allowedFields = [];

    schemaFields.forEach((schemaField) => {
      let found = false;

      if (_.has(aclRules, schemaField)) {
        found = true;
        if (ResourceService.compareRule(aclRules[schemaField], method, params, features)) {
          allowedFields.push(schemaField);
        }
      } else if (schemaField.indexOf('.') !== -1) {
        const pathKeyParts = schemaField.split('.');
        for (let i = pathKeyParts.length - 1; i >= 0; i -= 1) {
          let part = _.first(pathKeyParts, i);

          part = _.isArray(part) ? part.join('.') : part;
          if (_.has(aclRules, part)) {
            found = true;
            if (ResourceService.compareRule(aclRules[part], method, params, features)) {
              allowedFields.push(schemaField);
            }
            break;
          }
        }
      }
      if (!found && _.has(aclRules, '*')) {
        if (ResourceService.compareRule(aclRules['*'], method, params, features)) {
          allowedFields.push(schemaField);
        }
      }
    });

    if (allowedFields.length === 0) {
      return { fields: [], hasAccess: false, deniedFields: [], reason: 'There is no allowed fields' };
    }

    /* if there are not fields in request.params, then return allowed fields */
    if (!requestedFields || requestedFields.length === 0) {
      return { fields: allowedFields, hasAccess: true, deniedFields: [] };
    }

    let hasAccess = true;

    /* if fields in request.params is not empty then get them from allowed fields */
    const reqFields = _.isArray(requestedFields) ? requestedFields : [requestedFields];

    const fields = [];
    const deniedFields = [];
    for (let n = reqFields.length - 1; n >= 0; n -= 1) {
      const reqField = reqFields[n];
      let foundInFields = false;
      for (let m = allowedFields.length - 1; m >= 0; m -= 1) {
        const allowedField = allowedFields[m];
        const dotIndex = allowedField.indexOf('.');
        if (allowedField === reqField || (dotIndex !== -1 && allowedField.substr(0, dotIndex) === reqField)) {
          fields.push(allowedField);
          foundInFields = true;
        }
      }
      if (!foundInFields) {
        hasAccess = false;
        deniedFields.push(reqField);
      }
    }

    if (!fields || fields.length === 0) {
      hasAccess = false;
    }

    if (deniedFields.length > 0) {
      hasAccess = false;
    }

    return { fields, hasAccess, deniedFields };
  }
}
