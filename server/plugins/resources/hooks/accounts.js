/* eslint-disable no-param-reassign */
import pwd from 'pwd';
import async from 'async';
import crypto from 'crypto';

export default {
  'db.accounts.insert': beforeAccountCreate
};

function beforeAccountCreate(service, req, cb) {
  async.auto({
    activationToken: (next) => {
      crypto.randomBytes(24, (err, buffer) => {
        req.body.activationToken = buffer.toString('hex');
        next();
      });
    },
    salt: (next) => {
      pwd.hash(req.body.password, (err, salt, hash) => {
        if (err) { return cb(err); }
        req.body.password = hash;
        req.body.salt = salt;
        return next();
      });
    }
  }, cb);
}
