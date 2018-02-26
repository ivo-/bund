const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const jsdom = require('jsdom');

const doc = new jsdom.JSDOM('<!doctype html><html><body></body></html>');
global.window = doc.window;
global.document = doc.window.document;
global.navigator = { userAgent: 'node.js' };
Object.keys(window).forEach(k => global[k] || (global[k] = window[k]));

Enzyme.configure({ adapter: new Adapter() });

require('./01-persistence');
require('./02-react');
require('./03-time-travel');
require('./04-central-error-handling');
require('./05-async');
require('./06-state-replacement');
