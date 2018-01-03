'use strict';

const Intercom = require('intercom-client');
require('dotenv').config();

const directline = require('../libs/directline');
const Queue = require('../libs/queue');

const self = module.exports = {
    queue: new Queue(),

    processMessageFromIntercom: (req, res) => {

        //  console.log(`topic: ${req.body.topic} text: ${req.body.data.item.conversation_parts.conversation_parts[0].body}`);

        res.statusCode = 200;
        res.end();
        self.queue.add(() => directline.connectBot(self.createMessage(req.body)).catch(e => console.error(e)));
    },

    createMessage: reqBody => {

        // let text = null;

        // if (reqBody.topic === 'conversation.admin.replied') {
        //     text = reqBody.data.item.conversation_parts.conversation_parts[0].body ?
        //         reqBody.data.item.conversation_parts.conversation_parts[0].body
        //             .replace(/<p>/g, '')
        //             .replace(/<\/p>/g, '')
        //             .replace(/<br>/g, '\n') :
        //         null
        // }

        // return !['conversation.admin.replied', 'conversation.admin.closed'].some(s => s === reqBody.topic) ?
        //     Promise.resolve(undefined) :
        //     new Intercom.Client({ token: process.env.TOKEN }).users
        //         .find({ id: reqBody.data.item.user.id })
        //         .then(r => ({
        //             paused: reqBody.topic === 'conversation.admin.replied',
        //             userId: reqBody.data.item.user.user_id,
        //             text: text
        //         }))
        //         .catch(e => console.error(e));

        //
        const partType = reqBody.data.item.conversation_parts.conversation_parts[0].part_type;
        if (reqBody.topic === 'conversation.admin.replied' && partType === 'comment') {
            const text = text = reqBody.data.item.conversation_parts.conversation_parts[0].body ?
                reqBody.data.item.conversation_parts.conversation_parts[0].body
                    .replace(/<p>/g, '')
                    .replace(/<\/p>/g, '')
                    .replace(/<br>/g, '\n') :
                null;

            return new Intercom.Client({ token: process.env.TOKEN }).users
                .find({ id: reqBody.data.item.user.id })
                .then(r => ({
                    paused: true,
                    userId: reqBody.data.item.user.user_id,
                    text: text
                }))
                .catch(e => console.error(e));
        }

        if (reqBody.topic === 'conversation.admin.closed') {
            const text = text = reqBody.data.item.conversation_parts.conversation_parts[0].body ?
                reqBody.data.item.conversation_parts.conversation_parts[0].body
                    .replace(/<p>/g, '')
                    .replace(/<\/p>/g, '')
                    .replace(/<br>/g, '\n') :
                null;

            return new Intercom.Client({ token: process.env.TOKEN }).users
                .find({ id: reqBody.data.item.user.id })
                .then(r => ({
                    paused: false,
                    userId: reqBody.data.item.user.user_id,
                    text: text
                }))
                .catch(e => console.error(e));
        }

        return Promise.resolve(undefined);
    }
};
