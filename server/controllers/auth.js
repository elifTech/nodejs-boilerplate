import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

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
  Account.findOne({ username: req.body.username }).then((user) => {
    if (!user) {
      const err = new APIError('Authentication error', httpStatus.UNAUTHORIZED);
      return next(err);
    }

    const token = jwt.sign({
      _id: user._id
    }, config.jwtSecret);
    return res.json({
      token,
      username: user.username
    });
  });
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
