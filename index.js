'use strict';
require('dotenv').config();
const {startUp} = require('./src/server.js');
const Port = process.env.Port || 3002

startUp(Port);
