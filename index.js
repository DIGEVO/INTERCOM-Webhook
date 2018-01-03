'use strict';

const http = require('http');
require('dotenv').config();

const router = require('./router');
const controllers = require('./controllers');

router.subscribe('POST', '/', controllers.processMessageFromIntercom);
router.subscribe('GET', '/.*', (req, res) => {
    res.statusCode = 200; res.end();
});

const server = http.createServer();
server.on('request', (req, res) => {
    console.log(req);
    router.route(req,res);
});
server.listen(process.env.PORT || 1338);

