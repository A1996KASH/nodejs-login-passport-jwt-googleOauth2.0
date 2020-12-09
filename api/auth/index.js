const express = require('express')
const { login } = require('./controller')
const router = express.Router()
const { password, googleAuth } = require('../../services/passport')
router.route('/login').post( password, login)
router.route('/google/').get(googleAuth)
router.route('/google/callback').get(googleAuth, login)
module.exports = router
