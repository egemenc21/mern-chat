const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()
const jwt = require('jsonwebtoken')
const User = require('./models/User')
const cors = require('cors')

mongoose.connect(process.env.MONGO_URL)
const jwtSecret = process.env.JWT_SECRET

const app = express()
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
)

app.get('/test', (req, res) => {
  res.json('test ok')
})

app.post('/register', async (req, res) => {
  const { username, password } = req.body
  try {
    const createdUser = await User.create({ username, password })
    await jwt.sign(
      {
        userId: createdUser,
        _id,
      },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err
        res.cookie('token', token).status(201).json('ok')
      }
    )
  } catch (error) {}
})

app.listen(4000)
