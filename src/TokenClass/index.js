'Use Strict';
const uuidv4 = require('uuid').v4;

module.exports = class Token {
  constructor(image=null, name, size=null, position = { x: 0, y: 0 }) {
    this.tokenId = uuidv4();
    this.image = image;
    this.name = name;
    this.size = size;
    this.position = position;
    this.effects = [];
  }
};
