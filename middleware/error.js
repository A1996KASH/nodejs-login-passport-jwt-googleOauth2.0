const ErrorResponse = require('../utils/errorResponse')
const errorHandler = (err, req, res, next) => {
  console.log(err)
  let error = { ...err }
  error.message = err.message
  // Log to Console for developer
  // Mongoose bad ObjectId

  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = new ErrorResponse(message, 404)
  }

  if (err.code === 11000) {
    const message = 'Requested data already exists!'
    error = new ErrorResponse(message, 400)
  }

  if (err.name === 'ValidationError' && error.errors.dataCenterId.path !== 'dataCenterId') { // and condition used to send custom message for review
    const message = Object.values(err.errors).map(val => val.message)
    error = new ErrorResponse(message, 400)
  }

  if (!err.message) {
    if (error.errors.dataCenterId.path === 'dataCenterId') { // condition used to send custom message for review
      const message = 'You have already reviewed this DataCenter!'
      error = new ErrorResponse(message, 400)
    } else {
      error = new ErrorResponse(err, 400)
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  })
}

module.exports = errorHandler
