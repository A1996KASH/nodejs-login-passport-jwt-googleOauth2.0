const express = require('express')
const dotenv = require('dotenv')
const errorHandler = require('../middleware/error')
const mongoSanitize = require('express-mongo-sanitize')
const morgan = require('morgan')
const helmet = require('helmet')
const xss = require('xss-clean')
const cors = require('cors')
const hpp = require('hpp')
const fileUpload = require('express-fileupload')
const rateLimit = require('express-rate-limit')
const path = require('path')
// load env variables
dotenv.config({ debug: process.env.DEBUG })
// Import DB
const connectDB = require('../config/db')


// route files
const users = require('../api/users/')
const auth = require('../api/auth/')

// connect to DB
if (process.env.NODE_ENV !== 'test') {
  connectDB()
}

const app = express()

// Body Parser
app.use(express.json())

// sanitize Data
app.use(mongoSanitize())
// set security hearder
app.use(helmet({
  contentSecurityPolicy: false
}))

// xss-clean
app.use(xss())
// Rate Limit
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 10000 // limit each IP to 100 requests per windowMs
})

app.use(limiter)
// hpp
app.use(hpp())


if (process.env.NODE_ENV === 'development') {
  const corsOptions = {
    origin: 'http://localhost:4200'
  }
  // cors
  app.use(cors(corsOptions))
  app.options('*', cors(corsOptions))
}

if (process.env.NODE_ENV === 'production') {
  const corsOptions = {
    origin: process.env.computationalUrl
  }
  // cors
  app.use(cors(corsOptions))
  app.options('*', cors(corsOptions))
}

if (process.env.NODE_ENV === 'development') {
   app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))
}

// file Upload
app.use(fileUpload())

// set static folder
var options = {
  dotfiles: 'ignore',
  etag: true,
  extensions: ['htm', 'html'],
  maxAge: '1h',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}
app.use(express.static(path.join(__dirname, '../public'), options))
app.use(express.static(path.join(__dirname, '../public/client'), options))

// Use Routes
app.use('/api/v1/auth', auth)
// All other routes should redirect to the index.html
app.route('/*')
  .get((req, res) => {
    res.sendFile(path.resolve('public/client/index.html'))
  })
//
app.use(errorHandler)

module.exports = app
