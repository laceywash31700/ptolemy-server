'use strict';
// 3rd Party Resources
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const AWS = require('aws-sdk');
const http = require('http');
const WebSocket = require('ws');

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

app.get('/', (req,res) => res.send('this is the back end of Ptolemy'));

const server = http.createServer(app);


const wss = new WebSocket.Server({ server: server });

wss.on('connection', function connection(ws) {
  console.log('A new client has connected');
  ws.send('Welcome to Ptolemy intrepid hero!');

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});



module.exports = {
  server,
  startUp: (port) => {
    server.listen(port, () => {
      console.log(`Server is up and running on ${port}`);
    });
  },
};
