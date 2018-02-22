import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import { uniqueValidationByModel } from '../helpers/validators';

const modelName = 'Account';

/**
 * Account
 *
 * @swagger
 * definition:
 *   Account:
 *     properties:
 *       username:
 *         type: string
 *       mobileNumber:
 *         type: string
 *       createdAt:
 *         type: string
 *         format: date
 */
const Schema = new mongoose.Schema({
  accountType: { type: String, default: 'system', enum: ['system', 'facebook', 'twitter', 'google', 'linkedin'] },

  // login fields
  username: {
    type: String,
    required: [true, 'Username field required'],
    validate: [{
      isAsync: true,
      validator: (value, cb) => uniqueValidationByModel(mongoose.model(modelName), { username: value }, cb),
      message: '{VALUE} with this {PATH} already exists'
    }, {
      validator: value => /^[a-z].*$/i.test(value),
      message: '{PATH} should start from letter [a-z]'
    }]
  },
  password: {
    type: String,
    required: [true, 'Password field required']
  },
  salt: String,

  // for external auth usage
  extUser: String,
  extToken: String,
  extTokenSecret: String,

  // activation
  activated: { type: Boolean, required: true, default: false },
  activationDate: Date,
  activationToken: String,

  // information
  email: String,
  mobileNumber: {
    type: String,
    match: [/^[1-9][0-9]{9}$/, 'The value of path {PATH} ({VALUE}) is not a valid mobile number.']
  },
  loginDate: Date, // last user login
  activityDate: Date, // last user activity

  // required by ResourceService
  removed: Date,
  createDate: { type: Date, required: true, default: Date.now },
  modifyDate: Date
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
Schema.method({
});

/**
 * Statics
 */
Schema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<Account, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List accounts in descending order of 'createDate' timestamp.
   * @param {number} skip - Number of accounts to be skipped.
   * @param {number} limit - Limit number of accounts to be returned.
   * @param {object} filter - Filter accounts by query.
   * @returns {Promise<Account[]>}
   */
  list({ skip = 0, limit = 50, filter = {} } = {}) {
    return this.find(filter)
      .sort({ createDate: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
};

Schema.index({ username: 1 }, { unique: true });

/**
 * @typedef Account
 */
export default mongoose.model(modelName, Schema);
