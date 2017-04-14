import _ from 'lodash';
import async from 'async';
import NotFoundError from '../NotFoundError';

function getDataOptions(req, next) {
  const opts = {};
  const resourceOptions = req.resource.options || {};
  const { page, perPage, sort } = req.query;

  if (resourceOptions.maxPerPage) {
    if (!(perPage && perPage <= resourceOptions.maxPerPage)) {
      return next(new req.app.errors.OperationError('Missing "perPage" query param'));
    }
    opts.limit = perPage;

    if (!page) {
      return next(new req.app.errors.OperationError('Missing "page" query param'));
    }
    opts.skip = page ? (page - 1) * opts.limit : 0;
  } else if (perPage) {
    opts.skip = page ? (page - 1) * perPage : 0;
    opts.limit = perPage;
  }

  // Parse request sorting parameters
  if (sort) {
    const sortArr = _.without(_.isArray(sort) ? sort : sort.replace(/ /g, '').split(','), '');
    if (sortArr.length > 0) {
      opts.sort = {};
      _.each(sortArr, (field) => {
        let direction = 1;
        let fieldName = field;
        if (fieldName.indexOf('-') === 0) {
          direction = -1;
          fieldName = fieldName.substring(1);
        }
        opts.sort[fieldName] = direction;
      });
    }
  }
  next(null, opts);
  return opts;
}

function getFilter(req, schemaFields, next) {
  const resourceOptions = req.resource.options || {};
  const query = req.query;

  const filter = {
    $and: [_.mapValues(_.pick(query, schemaFields), (val) => {
      if (_.isArray(val)) {
        return { $in: val };
      } else if (val === 'null') {
        return null;
      }
      return val;
    })]
  };
  if (_.indexOf(schemaFields, 'site._id') !== -1) {
    const site = {
      'site._id': req.site._id
    };
    filter.$and.push(site);
  }
  filter.$and.push({ removed: { $exists: false } });
  const search = query.search;
  if (search && resourceOptions.searchFields) {
    filter.$and.push({
      $or: _.map(resourceOptions.searchFields, (field) => {
        const o = {};
        o[field] = { $regex: search, $options: 'i' };
        return o;
      })
    });
  }
  next(null, filter);
  return filter;
}

export default
function getHandler(model, fields, schemaFields, req, res, cb) {
  res.set('x-service', 'resources');

  const zipFields = _.mapValues(_.zipObject(fields), _.constant(1));
  if (req.params._id || req.query.alias) {
    if (req.params._id) {
      req.query._id = req.params._id; // eslint-disable-line no-param-reassign
    }

    const parameter = getFilter(req, schemaFields, _.noop);
    model.findOne(parameter, zipFields, (err, data) => {
      if (err) {
        if (err.name === 'CastError') {
          return cb(new NotFoundError(`Resource "${req.params.resource} ${parameter}" not found.`));
        }
        return cb(err);
      }
      if (data) {
        if (model.schema.paths.viewsCount) {
          model.update(parameter, { $inc: { viewsCount: 1 } }, (error) => {
            if (error) {
              return req.log.error(error);
            }
            return null;
          });
        }
        return res.json(data);
      }
      return cb(new NotFoundError(`Resource "${req.params.resource} ${parameter}" not found.`));
    });
  } else {
    async.auto({
      count: ['filter', ({ filter }, next) => {
        if (req.query.flags && req.query.flags.indexOf('no-total-count') !== -1) {
          return next(null, -1);
        }
        return model.count(filter, next);
      }],
      filter: _.partial(getFilter, req, schemaFields),
      dataOptions: _.partial(getDataOptions, req),
      items: ['filter', 'dataOptions', ({ filter, dataOptions }, next) => {
        model.find(filter, zipFields, dataOptions, next);
      }]
    }, (err, data) => {
      if (err) {
        return cb(err);
      }
      if (data.count !== -1) {
        res.set('x-total-count', data.count);
      }
      return res.json(data.items);
    });
  }
}
