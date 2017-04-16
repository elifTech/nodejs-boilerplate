/* eslint-disable no-param-reassign */
import pwd from 'pwd';
import async from 'async';
import crypto from 'crypto';

export default {
  'db.accounts.insert': beforeAccountCreate
};

function beforeAccountCreate(service, req, body, cb) {
  async.auto({
    activationToken: (next) => {
      crypto.randomBytes(24, (err, buffer) => {
        body.activationToken = buffer.toString('hex');
        next();
      });
    },
    salt: (next) => {
      pwd.hash(body.password, (err, salt, hash) => {
        if (err) { return cb(err); }
        body.password = hash;
        body.salt = salt;
        return next();
      });
    }
  }, cb);
}
