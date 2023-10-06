const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
dotenv.config()
const jwt = require('jsonwebtoken')
const User = require('./models/User')
const cors = require('cors')
const bcrypt = require('bcrypt')

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('connection successfuly !')
  })
  .catch((err) => {
    console.log('unsuccessfull connection')
  })
const jwtSecret = process.env.JWT_SECRET
const bcryptSalt = bcrypt.genSaltSync(12)

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
)

app.get('/test', (req, res) => {
  res.json('test ok')
})

app.get('/profile', (req, res) => {
  const token = req.cookies?.token
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err
      res.json(userData)
    })
  } else {
    res.status(401).json('no token')
  }
})

app.post('/register', async (req, res) => {
  const { username, password } = req.body
  const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
  try {
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    })
    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err
        res
          .cookie('token', token, { sameSite: 'none', secure: false })
          .status(201)
          .json({
            id: createdUser._id,
            username,
          })
      }
    )
  } catch (error) {
    if (error) res.status(500).json(error)
  }
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const foundUser = await User.findOne({ username })

  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password)
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie('token', token).json({
            id: foundUser._id,
          })
        }
      )
    }
  }
})

app.listen(4000)
