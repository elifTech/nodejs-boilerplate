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
 *       201:
 *         description: Success
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
 *       204:
 *         description: Success
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
 *       204:
 *         description: Success
 */
