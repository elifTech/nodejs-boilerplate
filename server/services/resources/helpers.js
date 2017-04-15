import _ from 'lodash';

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
function getJsonFields(jsonObject) {
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

export
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

export
function setAndUnsetQuery(model, query) {
  query = { $set: query }; // eslint-disable-line no-param-reassign

  Object.keys(query.$set).forEach((key) => {
    const value = query.$set[key];
    if (value !== null) {
      _.set(model, key, value);
      return;
    }

    delete query.$set[key]; // eslint-disable-line no-param-reassign
    query.$unset = query.$unset || {}; // eslint-disable-line no-param-reassign
    query.$unset[key] = ''; // eslint-disable-line no-param-reassign
    _.set(model, key, null);
  });

  return query;
}
