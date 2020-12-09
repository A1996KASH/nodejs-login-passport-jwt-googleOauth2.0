const app = require('./server/server')
const PORT = process.env.PORT || 3000

const server = app.listen(3000, () => {
  console.log(`App listening on port ${PORT} in ${process.env.NODE_ENV} mode`)
})

// handle unhandled Promise Rejections
process.on('unhandledRejection', (error, promise) => {
  console.log(`Error: ${error.message}`)
  // close server and exit process
  server.close(() => {
    process.exit(1)
  })
})
