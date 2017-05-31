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
 *             $ref: '#/definitions/Account'
 *   post:
 *     tags:
 *       - Accounts
 *     description: Create new account
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: Username
 *         in: formData
 *         required: true
 *         type: string
 *       - name: password
 *         description: Password
 *         in: formData
 *         required: true
 *         type: string
 *       - name: activated
 *         description: Is account activated
 *         in: formData
 *         required: false
 *         type: boolean
 *       - name: email
 *         description: Email
 *         in: formData
 *         required: false
 *         type: string
 *       - name: mobileNumber
 *         description: Phone
 *         in: formData
 *         required: false
 *         type: string
 *     responses:
 *       201:
 *         description: Success
 * /accounts/{accountId}:
 *   get:
 *     tags:
 *       - Accounts
 *     description: Get account
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: accountId
 *         description: Account id (ObjectId)
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         schema:
 *           $ref: '#/definitions/Account'
 *   put:
 *     tags:
 *       - Accounts
 *     description: Update account
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: accountId
 *         description: Account id (ObjectId)
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
 *     description: Delete account
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: accountId
 *         description: Account id (ObjectId)
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       204:
 *         description: Success
 */
