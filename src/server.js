const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const socket = require('socket.io');

const app = express();

// Configure CORS for Express
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Development server
      'http://127.0.0.1:5173', // Another local development URL
      'https://ptolemyvtt.netlify.app/', // Production domain
    ],
    methods: ['GET', 'POST'],
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('This is the back end of Ptolemy'));

const server = http.createServer(app);

const io = new socket.Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://ptolemyvtt.netlify.app/',
    ],
    methods: ['GET', 'POST'],
    transports: ['websocket'],
  },
});

io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);
  
  socket.on('message', (data) => {
    console.log(data);
    io.emit('message', `${socket.id.substring(0, 5)} - ${data}`);
  });

  socket.on("update-token-position", (tokenData) => {
    console.log("new token position:", tokenData )
    // Broadcast the new position to all other clients
    socket.broadcast.emit("update-token-position-broadcast", tokenData);
  });
  
  socket.on("new-token", (tokenData) => {
    console.log("New token received from client:", tokenData);
    // This will broadcast the new token obj to all other clients expect the emitter client.
    socket.broadcast.emit("new-token-broadcast", tokenData);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

module.exports = {
  server,
  startUp: (port) => {
    server.listen(port, () => {
      console.log(`Server is up and running on ${port}`);
    });
  },
};
