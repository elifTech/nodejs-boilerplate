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
  activationToken: String,
  activityDate: Date, // last user activity
  removed: Date,
  mobileNumber: {
    type: String,
    match: [/^[1-9][0-9]{9}$/, 'The value of path {PATH} ({VALUE}) is not a valid mobile number.']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
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
   * List acounts in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of accounts to be skipped.
   * @param {number} limit - Limit number of accounts to be returned.
   * @returns {Promise<Account[]>}
   */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
};

/**
 * @typedef Account
 */
export default mongoose.model(modelName, Schema);
