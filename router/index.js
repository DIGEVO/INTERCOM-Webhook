'use strict';

const self = module.exports = {

    subscribe: (method, url, controller) =>
        self.routerArr.push({ method: method, url: url, controller: controller }),

    route: (req, res) => {
        const { method, url } = req;
        const routeObj = self.routerArr.find(r => r.method === method && new RegExp(r.url).test(url));
        if (routeObj) {
            const body = [];
            req
                .on('error', console.error.bind(console))
                .on('data', body.push.bind(body))
                .on('end', () => {
                    console.log(Buffer.concat(body).toString() || '{}');
                    console.log('----------------------------------------------');

                    return routeObj.controller(Object.assign(req, { body: JSON.parse(Buffer.concat(body).toString() || '{}') }), res);
                });
        } else {
            res.statusCode = 200;
            res.end();
        }
    },

    routerArr: []
};
