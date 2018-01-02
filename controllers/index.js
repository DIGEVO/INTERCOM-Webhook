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

    createMessage: reqBody =>
        !['conversation.admin.replied', 'conversation.admin.closed'].some(s => s === reqBody.topic) ?
            Promise.resolve(undefined) :
            new Intercom.Client({ token: process.env.TOKEN }).users
                .find({ id: reqBody.data.item.user.id })
                .then(r => ({
                    paused: reqBody.topic === 'conversation.admin.replied',
                    userId: reqBody.data.item.user.user_id,
                    text: reqBody.data.item.conversation_parts.conversation_parts[0].body ?
                        reqBody.data.item.conversation_parts.conversation_parts[0].body.replace(/<p>/g, '').replace(/<\/p>/g, '').replace(/<br>/g, '\\n') :
                        null
                }))
                .catch(e => console.error(e))
};
