/* eslint-disable no-param-reassign */
import crypto from 'crypto';

export default {
  'db.accounts.insert': beforeAccountCreate
};

function beforeAccountCreate(service, req, body, cb) {
  crypto.randomBytes(24, (err, buffer) => {
    body.activationToken = buffer.toString('hex');

    cb();
  });
}
