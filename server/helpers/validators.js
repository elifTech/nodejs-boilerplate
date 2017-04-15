import winston from 'winston';

export // eslint-disable-line import/prefer-default-export
function uniqueValidationByModel(model, condition, cb) {
  model
    .findOne(condition)
    .then(data => cb(data === null), (err) => {
      winston.error(err);
      cb(false);
    });
}
