'use strict';

const Intercom = require('intercom-client');
require('dotenv').config();

const directline = require('../libs/directline');

const self = module.exports = {
    processMessageFromIntercom: (req, res) => {
        console.log(`constroller: ${JSON.stringify(req.body)}`);
        console.log('*******************************************************');
        directline
            .connectBot(self.createMessage(req.body))
            .then(() => { res.statusCode = 200; res.end(); })
            .catch(e => { console.error(e); res.statusCode = 200; res.end(); });
    },

    createMessage: reqBody =>
        !['conversation.admin.replied', 'conversation.admin.closed'].some(s => s === reqBody.topic) ?
            Promise.resolve(undefined) :
            new Intercom.Client({ token: process.env.TOKEN }).users
                .find({ id: reqBody.data.item.user.id })
                .then(r => ({
                    paused: reqBody.topic === 'conversation.admin.replied',
                    userId: reqBody.data.item.user.user_id,
                    conversationId: r.body.custom_attributes.conversationId,
                    text: reqBody.data.item.conversation_parts.conversation_parts[0].body
                }))
                .catch(e => console.error(e))
};
