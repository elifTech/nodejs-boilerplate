import express from 'express';
import validate from 'express-validation';
import expressJwt from 'express-jwt';
import paramValidation from '../../config/param-validation';
import authCtrl from '../controllers/auth';
import config from '../../config/env';

const router = express.Router(); // eslint-disable-line new-cap

/**
 * @swagger
 * definition:
 *   AuthOutput:
 *     properties:
 *       token:
 *         type: string
 *       username:
 *         type: string
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     description: Returns token if correct username and password is provided
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: "For example: user"
 *         in: formData
 *         required: true
 *         type: string
 *       - name: password
 *         description: "For example: test"
 *         in: formData
 *         required: true
 *         type: string
 *         format: password
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     responses:
 *       200:
 *         schema:
 *           $ref: '#/definitions/AuthOutput'
 *         examples:
 *           application/json:
 *             token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.\
 *                    eyJ1c2VybmFtZSI6InVzZXIiLCJpYXQiOjE0ODUyOTE3NDN9.\
 *                    YWkEoGEt9oNZEuTHcZAN1kz_blUNAhUrqPqIDh-UKEg"
 *             username: "user"
 */
router.route('/login')
  .post(validate(paramValidation.login), authCtrl.login);

/**
 * @swagger
 * /auth/random-number:
 *   get:
 *     tags:
 *       - Auth
 *     description: Protected route
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: "Bearer {token}"
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         schema:
 *           type: integer
 */
router.route('/random-number')
  .get(expressJwt({ secret: config.jwtSecret }), authCtrl.getRandomNumber);

export default router;
