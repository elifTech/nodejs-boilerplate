import jwt from 'jsonwebtoken';
import pwd from 'pwd';

import Account from '../models/accounts';

const config = require('../../config/env');

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function login(req, res, next) {
  const username = req.body.username || req.body.email;
  const password = req.body.password;
  const isAllowLoginWithEmail = req.fflip.has('loginWithEmail');

  if (!username) {
    return res.fieldsError({ username: isAllowLoginWithEmail ? 'Username or email is required' : 'Username is required' });
  }
  if (!password) {
    return res.fieldsError({ username: 'Password is required' });
  }

  const query = {};

  if (isAllowLoginWithEmail) {
    query.$or = [{ username }, { email: username }];
  } else {
    query.username = username;
  }

  return Account.findOne(query).then((account) => {
    if (!account) {
      return incorectUsernameOrPassword();
    }
    if (account.removed) {
      return res.summaryError('Account is locked');
    }
    if (!account.activated) {
      return res.summaryError('Account is not activated, check your email');
    }

    return pwd.hash(password, account.salt, (err, hash) => {
      if (err) { return next(err); }
      if (account.password !== hash) {
        return incorectUsernameOrPassword();
      }

      const token = jwt.sign({ _id: account._id }, config.jwtSecret);

      return account.update({ loginDate: Date.now() }, (error) => {
        if (error) { return next(error); }

        return res.json({
          token,
          username: account.username
        });
      });
    });
  });

  function incorectUsernameOrPassword() {
    res.fieldsError({ username: isAllowLoginWithEmail ? 'Incorrect username, email or password' : 'Incorrect username or password' });
  }
}

/**
 * This is a protected route. Will return random number only if jwt token is provided in header.
 * @param req
 * @param res
 * @returns {*}
 */
function getRandomNumber(req, res) {
  // req.user is assigned by jwt middleware if valid token is provided
  return res.json({
    user: req.user,
    num: Math.random() * 100
  });
}

export default { login, getRandomNumber };
