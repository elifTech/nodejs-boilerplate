/**
 * @swagger
 * /accounts:
 *   get:
 *     tags:
 *       - Accounts
 *     description: Get list of accounts
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
 *       - Accounts
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
 *         required: false
 *         type: string
 *     responses:
 *       201:
 *         description: Success
 * /accounts/{userId}:
 *   get:
 *     tags:
 *       - Accounts
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
 *       - Accounts
 *     description: Update user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: userId
 *         description: User id (ObjectId)
 *         in: path
 *         required: true
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
 *       - Accounts
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
