'use strict';

// 3rd Party Resources
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const AWS = require('aws-sdk');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const uuidv4 = require('uuid').v4;

// Event-Handlers
const {
  handleAddedToken,
  handleChange,
  handleClose,
  handleMove,
  setGlobals,
} = require('./Handlers/eventHandlers');

// AWS config
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Prepare the express app
const app = express();

// App Level MW
app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('this is the back end of Ptolemy'));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const connections = {};
const users = {};
const tokens = {};

// Set global variables for event handlers
setGlobals(connections, users, tokens);

wss.on('connection', (connection, req) => {
  const { username, role } = url.parse(req.url, true).query;
  const uuid = uuidv4();
  console.log(
    `A new client named ${username} with the role: ${role} and web-socket Id: ${uuid} has connected.`
  );
  connection.send(`Welcome to Ptolemy: ${username} you intrepid hero!`);

  connections[uuid] = connection;

  users[uuid] = {
    username,
    role: role || 'PC',
    state: [],
  };

  connection.on('message', (data) => {
    const message = JSON.parse(data);
    const { type, payload } = message;

    switch (type) {
      case 'addedToken':
        handleAddedToken(payload, uuid);
        break;
      case 'move':
        handleMove(payload, uuid);
        break;
      case 'change':
        handleChange(payload, uuid);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  });

  connection.on('error', console.error);

  connection.on('close', () => handleClose(uuid));
});

module.exports = {
  server,
  startUp: (port) => {
    server.listen(port, () => {
      console.log(`Server is up and running on ${port}`);
    });
  },
};
