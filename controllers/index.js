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
		const botAdminId = reqBody.data.item.conversation_parts.conversation_parts[0].author.id;

		if ((reqBody.topic === 'conversation.admin.replied' && partType === 'comment' && botAdminId !== process.env.INTERCOM_BOT_ADMIN_ID) ||
			reqBody.topic === 'conversation.admin.closed') {
			const text = reqBody.data.item.conversation_parts.conversation_parts[0].body ?
				reqBody.data.item.conversation_parts.conversation_parts[0].body
				.replace(/<p>/g, '')
				.replace(/<\/p>/g, '')
				.replace(/<br>/g, '\n') :
				null;

			console.log(JSON.stringify(reqBody));
			console.log('----------------------------------------------------------');

			return new Intercom.Client({
					token: process.env.TOKEN
				}).users
				.find({
					id: reqBody.data.item.user.id
				})
				.then(r => ({
					paused: reqBody.topic === 'conversation.admin.replied',
					userId: reqBody.data.item.user.user_id,
					text: text
				}))
				.catch(e => console.error(e));
		}
		console.log(JSON.stringify(reqBody));
		console.log('**********************************************************');

		return Promise.resolve(undefined);
	}
};