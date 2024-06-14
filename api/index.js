const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const cors = require('cors');
const bcrypt = require('bcrypt');
const ws = require('ws');
const fs = require('fs');

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('connection successfuly !');
  })
  .catch((err) => {
    console.log('unsuccessfull connection');
  });
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(12);

const app = express();

app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject('no token');
    }
  });
}

app.get('/test', (req, res) => {
  res.json('test ok');
});

app.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId;
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get('/people', async (req, res) => {
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
});

app.get('/profile', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json('no token');
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
  try {
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });
    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie('token', token, { sameSite: 'none', secure: false })
          .status(201)
          .json({
            id: createdUser._id,
            username,
          });
      }
    );
  } catch (error) {
    if (error) res.status(500).json(error);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  console.log('first', foundUser);
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie('token', token).json({
            id: foundUser._id,
          });
        }
      );
    }
  }
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').json('ok');
});
if (process.env.API_PORT) {
  const server = app.listen(process.env.API_PORT, function (err) {
    if (err) console.log('Error in server setup');
    console.log('Server listening on Port', process.env.API_PORT);
  });
  const wss = new ws.WebSocketServer({ server });
  wss.on('connection', (connection, req) => {
    function notifyAboutOnlinePeople() {
      [...wss.clients].forEach((client) => {
        client.send(
          JSON.stringify({
            online: [...wss.clients].map((c) => ({
              userId: c.userId,
              username: c.username,
            })),
          })
        );
      });
    }
    connection.isAlive = true;

    // Send a ping to the client to check if the connection is alive
    connection.on('ping', () => {
      connection.isAlive = true;
      connection.pong();
    });

    // Set up a heartbeat mechanism
    const heartbeat = setInterval(() => {
      if (connection.isAlive === false) {
        clearInterval(heartbeat);
        connection.terminate(); // Terminate the connection
        notifyAboutOnlinePeople();
        console.log('Connection terminated (dead)');
        return;
      }

      connection.isAlive = false;
      connection.ping(); // Send a ping to the client
    }, 5000);

    // Handle 'pong' messages from the client
    connection.on('pong', () => {
      connection.isAlive = true;
    });

    // Handle connection close event
    connection.on('close', () => {
      clearInterval(heartbeat); // Clean up the heartbeat interval
      notifyAboutOnlinePeople();
      console.log('Connection closed');
    });

    //read username and id from the cookie for this connection
    const cookies = req.headers.cookie;

    if (cookies) {
      const tokenCookieString = cookies
        .split(';')
        .find((str) => str.startsWith('token='));

      if (tokenCookieString) {
        const token = tokenCookieString.split('=')[1];
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
      connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, text, file } = messageData;
        let filename = null;

        if (file) {
          const parts = file.name.split('.');
          const ext = parts[parts.length - 1];
          filename = Date.now() + '.' + ext;
          const path = __dirname + '/uploads/' + filename;
          const bufferData = Buffer.from(file.data.split(',')[1], 'base64');
          fs.writeFile(path, bufferData, () => {
            console.log('file saved:' + path);
          });
        }

        if (recipient && (text || file)) {
          const messageDoc = await Message.create({
            sender: connection.userId,
            recipient,
            text,
            file: file ? filename : null,
          });
          console.log('created file');
          [...wss.clients]
            .filter((client) => client.userId === recipient)
            .forEach((client) =>
              client.send(
                JSON.stringify({
                  text,
                  sender: connection.userId,
                  recipient,
                  file: file ? filename : null,
                  id: messageDoc._id,
                })
              )
            );
        }
        console.log();
      });
    }

    //notify everyone who connected online (when someone connects)
    notifyAboutOnlinePeople();
  });
}

module.exports = app;
