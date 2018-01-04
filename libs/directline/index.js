'use strict';

const Swagger = require('swagger-client');
const rp = require('request-promise-native');
const Q = require('q');

require('dotenv').config();

const self = module.exports = {
    watermark: null,

    errorHandler: (msg, error) => {
        console.error(`1--> ${msg}: ${error.message}`);
        throw new Error(`${msg}: ${error.message}`)
    },

    getSwaggerClient: spec =>
        new Swagger({ spec: JSON.parse(spec.trim()), usePromise: true })
    ,

    addAuthorization: client => {
        client.clientAuthorizations.add(
            'AuthorizationBotConnector',
            new Swagger.ApiKeyAuthorization('Authorization', 'Bearer ' + process.env.SECRET, 'header'));
        return client;
    },

    createClient: () =>
        rp(process.env.SPEC)
            .then(self.getSwaggerClient)
            .then(self.addAuthorization)
            .catch(error => errorHandler('Error initializing DirectLine client', error))
    ,

    getConversationId: client =>
        new Promise((resolve, reject) =>
            resolve(client.Conversations.Conversations_StartConversation()))
            .then(conversation => ({ client: client, conversationId: conversation.obj.conversationId }))
            .catch(error => self.errorHandler('Error starting conversation', error))
    ,

    postActivity: (conversationId, message) =>
        ({
            conversationId: conversationId,
            activity: {
                textFormat: 'plain',
                text: JSON.stringify(message),
                type: 'message',
                from: {
                    id: process.env.CLIENT,
                    name: process.env.CLIENT
                }
            }
        })
    ,

    getActivityText: activity => activity.text ? `${activity.text}\n` : ''
    ,

    sendMessage: (message, client, conversationId) =>
        client.Conversations
            .Conversations_PostActivity(self.postActivity(conversationId, message))
            .then(() => ({ client: client, conversationId: conversationId }))
            .catch(error => self.errorHandler('Error sending message', error))
    ,

    receiveMessage: (client, conversationId) => {
        const operation = () =>
            client.Conversations.Conversations_GetActivities({
                conversationId: conversationId,
                watermark: self.watermark
            });

        const test = res => res
            && res.obj.activities
            && res.obj.activities.length
            && res.obj.activities.some(m => m.from.id !== process.env.CLIENT);

        return self.retry(operation, test)
            .then(res => {
                const status = test(res) ?
                    res.obj.activities
                        .filter(m => m.from.id !== process.env.CLIENT)
                        .reduce((acc, a) => acc.concat(self.getActivityText(a)), '') :
                    'fall attempt!';

                console.log(status);

                return undefined;
            })
            .catch(error => self.errorHandler('Error receiving response from bot', error));
    },

    connectBot: message =>
        !message ?
            Promise.resolve(undefined) :
            message
                .then(r => self.createClient()
                    .then(self.getConversationId)
                    .then(obj => self.sendMessage(r, obj.client, obj.conversationId))
                    .then(obj => self.receiveMessage(obj.client, obj.conversationId))
                    .catch(e => console.error(e)))
                .catch(e => console.error(e))
    ,

    retry: (operation, test, delay = 1000, attempts = 10) => {
        return operation()
            .then(res => !test(res) && attempts ? Q.delay(delay).then(self.retry.bind(null, operation, test, delay, attempts - 1)) : res)
            .catch(error => self.errorHandler('Error getting response from bot', error));
    }
};
