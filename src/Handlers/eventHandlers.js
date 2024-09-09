// In ./Handlers/eventHandlers.js

let connections = {}; // Maps UUID to WebSocket connection
let users = {};       // Maps UUID to user data
let tokens = {};      // Maps token IDs to token objects
let rooms = {};       // Maps room names to client connections

const setGlobals = (conns, usrs, tkns, rms) => {
  connections = conns;
  users = usrs;
  tokens = tkns;
  rooms = rms;
};

const broadcastToUsers = (roomName) => {
  if (rooms[roomName]) {
    rooms[roomName].forEach((client) => {
      const event = JSON.stringify(users);
      client.connection.send(event);
    });
  }
};

const handleAddedToken = (data, uuid) => {
  const { image, name, size, position } = data;
  const user = users[uuid];
  const newToken = new Token(image, name, size, position);
  user.state.push(newToken);
  tokens[newToken.tokenId] = newToken; // Store token globally
  // Broadcast token update to all users in the same room
  const roomName = Object.keys(rooms).find(name => rooms[name].some(client => client.uuid === uuid));
  broadcastToUsers(roomName);
};

const handleMove = (data, uuid) => {
  const { tokenId, position } = data;
  const user = users[uuid];

  const token = user.state.find(token => token.tokenId === tokenId);
  if (token) {
    token.position = position;
    tokens[tokenId].position = position; // Update global tokens
    // Broadcast move update to all users in the same room
    const roomName = Object.keys(rooms).find(name => rooms[name].some(client => client.uuid === uuid));
    broadcastToUsers(roomName);
  } else {
    console.log(`Token not found for user: ${uuid}`);
  }
};

const handleChange = (data, uuid) => {
  const { property, value, tokenId } = data;
  const user = users[uuid];

  if (user.role === 'GM') {
    Object.keys(users).forEach(userUuid => {
      const userTokens = users[userUuid].state;
      const token = userTokens.find(token => token.tokenId === tokenId);
      if (token && token.hasOwnProperty(property)) {
        token[property] = value;
        tokens[tokenId][property] = value; // Update global tokens
      }
    });
  } else if (user.role === 'PC') {
    const token = user.state.find(token => token.tokenId === tokenId);
    if (token && token.hasOwnProperty(property)) {
      token[property] = value;
      tokens[tokenId][property] = value; // Update global tokens
    } else {
      console.log(`Token not found or property not valid for user: ${uuid}`);
    }
  }

  // Broadcast change update to all users in the same room
  const roomName = Object.keys(rooms).find(name => rooms[name].some(client => client.uuid === uuid));
  broadcastToUsers(roomName);
};

const handleClose = (uuid) => {
  // Remove client from their room
  Object.keys(rooms).forEach(roomName => {
    rooms[roomName] = rooms[roomName].filter(client => client.uuid !== uuid);
    // If the room is empty, delete it
    if (rooms[roomName].length === 0) {
      delete rooms[roomName];
    }
  });

  delete connections[uuid];
  delete users[uuid];
  broadcastToUsers();
};

module.exports = { handleAddedToken, handleMove, handleChange, handleClose, setGlobals };
