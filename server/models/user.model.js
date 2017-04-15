import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import { uniqueValidationByModel } from '../helpers/validators';

/**
 * User Schema
 *
 * @swagger
 * definition:
 *   User:
 *     properties:
 *       username:
 *         type: string
 *       mobileNumber:
 *         type: string
 *       createdAt:
 *         type: string
 *         format: date
 */
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username field required'],
    validate: [{
      isAsync: true,
      validator: (value, cb) => uniqueValidationByModel(mongoose.model('User'), { username: value }, cb),
      message: '{VALUE} with this {PATH} already exists'
    }, {
      validator: value => /[a-z]{1}.*/i.test(value),
      message: '{PATH} should start from letter [a-z]'
    }]
  },
  activationToken: String,
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
UserSchema.method({
});

/**
 * Statics
 */
UserSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
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
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
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
 * @typedef User
 */
export default mongoose.model('User', UserSchema);
