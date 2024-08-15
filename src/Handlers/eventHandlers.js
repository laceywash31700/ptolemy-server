'use strict';

const Token = require('../TokenClass');
let connections = {};
let users = {};
let tokens = {};

const setGlobals = (conns, usrs, tkns) => {
  connections = conns;
  users = usrs;
  tokens = tkns;
};

const broadcastToUsers = () => {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid];
    const event = JSON.stringify(users);
    connection.send(event);
  });
};

const handleAddedToken = (data, uuid) => {
  const { image, name, size, position } = data;
  const user = users[uuid];
  const newToken = new Token(image, name, size, position);
  user.state.push(newToken);
  tokens[newToken.tokenId] = newToken; // Store token globally
  broadcastToUsers();
};

const handleMove = (data, uuid) => {
  const { tokenId, position } = data;
  const user = users[uuid];

  const token = user.state.find(token => token.tokenId === tokenId);
  if (token) {
    token.position = position;
    tokens[tokenId].position = position; // Update global tokens
    broadcastToUsers();
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

  broadcastToUsers();
};

const handleClose = (uuid) => {
  delete connections[uuid];
  delete users[uuid];
  broadcastToUsers();
};

module.exports = { handleAddedToken, handleMove, handleChange, handleClose, setGlobals };
