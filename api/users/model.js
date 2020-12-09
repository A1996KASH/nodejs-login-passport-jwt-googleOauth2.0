/* eslint-disable no-useless-escape */
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please add valid email address.']
  },
  password: {
    type: String,
    required: [true, 'Password can not be blank'],
    select: false,
    minlength: 6
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true
  },
  billingDate: {
    type: Date,
    default: Date.now
  },
  roleId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Role',
    required: true
  },
  organisationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Organisation'
  },
  isActive: {
    type: Boolean,
    required: true,
    default: false
  },
  licenseAccepted: {
    type: Boolean,
    required: true,
    default: false
  },
  emailActivationToken: String,
  emailActivationTokenExpire: String,
  resetPasswordToken: String,
  resetPasswordTokenExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date
  },
  allowedNotebooks: {
    type: Number,
    default: 1
  },
  isBetaUser: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

userSchema.pre('remove', async function (next) {
  await this.model('SpawnedImage').deleteMany({ userId: this._id })
  next()
})
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  this.billingDate.setDate(this.billingDate.getDate() + 30)
})

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}
userSchema.methods.getFreshDeskJwtSignedIn = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

userSchema.methods.matchPassword = async function (enteredPassword) {
  // eslint-disable-next-line no-return-await
  return await bcrypt.compare(enteredPassword, this.password)
}


// Generate and Hash password Token
userSchema.methods.getEmailActivationToken = function () {
  const emailActivationToken = crypto.randomBytes(20).toString('hex')

  // hash token and set to reset password token field
  this.emailActivationToken = crypto.createHash('sha256').update(emailActivationToken).digest('hex')
  // set expires token
  this.emailActivationTokenExpire = Date.now() + 10 * 60 * 1000
  return emailActivationToken
}

userSchema.methods.getPasswordResetToken = function () {
  const passwordResetToken = crypto.randomBytes(20).toString('hex')

  // hash token and set to reset password token field
  this.resetPasswordToken = crypto.createHash('sha256').update(passwordResetToken).digest('hex')
  // set expires token
  this.resetPasswordTokenExpire = Date.now() + 10 * 60 * 1000
  return passwordResetToken
}

module.exports = mongoose.model('User', userSchema)
