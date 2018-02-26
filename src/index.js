const api = require('./api');
const connect = require('./react');


module.exports = { ...api, connect: api.autocurry(connect) };
