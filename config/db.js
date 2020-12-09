const mongoose = require('mongoose')
const connectDB = async () => {
  let mongoUrl = process.env.MONGO_URI
  if (process.env.NODE_ENV === 'development') {
    mongoUrl = process.env.MONGO_TEST
  }
  const conn = await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  console.log(`MongoDB Connected to : ${conn.connection.host} and this Database is ${process.env.NODE_ENV} Database.`)
}

module.exports = connectDB
