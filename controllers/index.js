'use strict';

const Intercom = require('intercom-client');
require('dotenv').config();

const directline = require('../libs/directline');

const self = module.exports = {
    processMessageFromIntercom: (req, res) => {
        res.statusCode = 200;
        res.end();
        directline.connectBot(self.createMessage(req.body)).catch(e => console.error(e));
    },

    createMessage: reqBody => {
        const partType = reqBody.data.item.conversation_parts.conversation_parts[0].part_type;
	   
		console.log(JSON.stringify(reqBody.data));
		console.log('---------------------------------------------------------');

        if ((reqBody.topic === 'conversation.admin.replied' && partType === 'comment') || reqBody.topic === 'conversation.admin.closed') {
            const text = reqBody.data.item.conversation_parts.conversation_parts[0].body ?
                reqBody.data.item.conversation_parts.conversation_parts[0].body
                    .replace(/<p>/g, '')
                    .replace(/<\/p>/g, '')
                    .replace(/<br>/g, '\n') :
                null;

            return new Intercom.Client({ token: process.env.TOKEN }).users
                .find({ id: reqBody.data.item.user.id })
                .then(r => ({
                    paused: reqBody.topic === 'conversation.admin.replied',
                    userId: reqBody.data.item.user.user_id,
                    text: text
                }))
                .catch(e => console.error(e));
        }

        return Promise.resolve(undefined);
    }
};
