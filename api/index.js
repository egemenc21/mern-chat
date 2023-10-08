const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
dotenv.config()
const jwt = require('jsonwebtoken')
const User = require('./models/User')
const Message = require('./models/Message')
const cors = require('cors')
const bcrypt = require('bcrypt')
const ws = require('ws')

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

const server = app.listen(4000)

const wss = new ws.WebSocketServer({ server })
wss.on('connection', (connection, req) => {
  //read username and id from the cookie for this connection
  const cookies = req.headers.cookie

  if (cookies) {
    const tokenCookieString = cookies
      .split(';')
      .find((str) => str.startsWith('token='))

    if (tokenCookieString) {
      const token = tokenCookieString.split('=')[1]
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err
        const { userId, username } = userData
        connection.userId = userId
        connection.username = username
      })
    }
    connection.on('message', async (message) => {
      const messageData = JSON.parse(message.toString())
      const { recipient, text } = messageData
      if (recipient && text) {
        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
        })
        ;[...wss.clients]
          .filter((client) => client.userId === recipient)
          .forEach((client) =>
            client.send(
              JSON.stringify({
                text,
                sender: connection.userId,
                recipient,
                id: messageDoc._id,
              })
            )
          )
      }
      console.log()
    })
  }

  //notify everyone who connected online (when someone connects)
  ;[...wss.clients].forEach((client) => {
    client.send(
      JSON.stringify({
        online: [...wss.clients].map((c) => ({
          userId: c.userId,
          username: c.username,
        })),
      })
    )
  })
})
