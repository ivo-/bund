const api = require('./api');
const redux = require('./redux');
const connect = require('./react');

module.exports = { ...api, ...redux, connect: api.autocurry(connect) };
