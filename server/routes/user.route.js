import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import userCtrl from '../controllers/user.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     description: Get list of users
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/User'
 */
  .get(userCtrl.list)

/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     description: Create new user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: Username
 *         in: formData
 *         required: true
 *         type: string
 *       - name: mobileNumber
 *         description: Phone
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/User'
 */
  .post(validate(paramValidation.createUser), userCtrl.create);

router.route('/:userId')
/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     description: Get user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: userId
 *         description: User id (ObjectId)
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         schema:
 *           $ref: '#/definitions/User'
 */
  .get(userCtrl.get)

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     tags:
 *       - Users
 *     description: Update user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: userId
 *         description: User id (ObjectId)
 *         in: path
 *         required: true
 *         type: string
 *       - name: username
 *         description: Username
 *         in: formData
 *         required: false
 *         type: string
 *       - name: mobileNumber
 *         description: Phone
 *         in: formData
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         schema:
 *           $ref: '#/definitions/User'
 */
  .put(validate(paramValidation.updateUser), userCtrl.update)

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     tags:
 *       - Users
 *     description: Delete user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: userId
 *         description: User id (ObjectId)
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         schema:
 *           $ref: '#/definitions/User'
 */
  .delete(userCtrl.remove);

/** Load user when API with userId route parameter is hit */
router.param('userId', userCtrl.load);

export default router;
