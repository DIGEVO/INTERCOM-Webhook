'use strict';

const http = require('http');
require('dotenv').config();

const router = require('./router');

//routes
router.subscribe('POST', /.*/, (req, res) => { 
    console.log(req.url);
    console.log(req.body);
    res.statusCode = 200;
    res.end();
});

const server = http.createServer();
server.on('request', router.route);
server.listen(process.env.PORT || 1338);
