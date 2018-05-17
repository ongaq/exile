'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const firebase = require('firebase');
const functions = require('firebase-functions');
const moment = require('moment');
const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();

const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');

const CONFIG_CLIENT_ID = functions.config().googleapi.client_id;
const CONFIG_CLIENT_SECRET = functions.config().googleapi.client_secret;
const CONFIG_SHEET_ID = functions.config().googleapi.sheet_id;
const CONFIG_FUNCTIONS_REDIRECT = functions.config().googleapi.redirect_url;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const functionsOauthClient = new OAuth2Client(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET, CONFIG_FUNCTIONS_REDIRECT);
const DB_TOKEN_PATH = 'api_tokens';
const sheets = google.sheets('v4');
const firestoreDoc = '/users/{userId}/{date}/{bodyScaleCollectionId}';
let oauthTokens = null;

exports.authgoogleapi = functions.https.onRequest((req, res) => {
	res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
	res.redirect(functionsOauthClient.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
		prompt: 'consent'
	}));
});

exports.oauthcallback = functions.https.onRequest((req, res) => {
	res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
	const code = req.query.code;
	functionsOauthClient.getToken(code, (err, tokens) => {
		if (err) {
			return res.status(400).send(err);
		}
		return firestore.collection(DB_TOKEN_PATH).add(tokens).then(() => {
			return res.status(200).send('App successfully configured with new Credentials. You can now close this page.');
		}).catch(error => {
			return res.status(400).send('Error adding document: ' + error);
		});
	});
});

exports.appendrecordtospreadsheet = functions.firestore.document(firestoreDoc).onWrite((() => {
	var _ref = _asyncToGenerator(function* (change, context) {
		const newValue = change.after.data();
		console.log('userId: ' + context.params.userId);
		console.log('date: ' + context.params.date);
		console.log(newValue);

		const startPoint = 29; // AC2
		const specifyDate = moment(context.params.date).format('M/D');
		const userName = yield sheetFunc.convertIntoKanji(context.params.userId);
		const dateArray = yield sheetFunc.createDateList();
		const columnNumber = yield sheetFunc.getTodayColumnPosition(dateArray, specifyDate);
		const column = yield sheetFunc.convertToLetter(startPoint + columnNumber - 1);

		return appendPromise({
			spreadsheetId: CONFIG_SHEET_ID,
			resource: {
				valueInputOption: 'USER_ENTERED',
				data: [{
					range: `${userName}${column}4:${column}5`,
					values: [[newValue.weight], [newValue.fat]]
				}]
			}
		});
	});

	return function (_x, _x2) {
		return _ref.apply(this, arguments);
	};
})());

const sheetFunc = {
	// 数値->アルファベット
	convertToLetter(iCol) {
		let str = '';
		let iAlpha = 0;
		let iRemainder = 0;

		iAlpha = parseInt(iCol / 26, 10);
		iRemainder = iCol - iAlpha * 26;
		if (iAlpha > 0) {
			str = String.fromCharCode(iAlpha + 64);
		}
		if (iRemainder >= 0) {
			str = str + String.fromCharCode(iRemainder + 65);
		}
		return str;
	},
	// 3/26から7/3までの日付を入力した配列を作る
	createDateList() {
		const array = [];
		for (let i = 0; i < 100; i++) {
			array[i] = moment('2018-03-26').add(i, 'days').format('M/D');
		}
		return array;
	},
	// 今日の日付の列位置を取得する
	getTodayColumnPosition(array, date) {
		let columnNumber = 0;

		array.forEach((key, pos) => {
			if (key === date) columnNumber = pos;
		});

		return columnNumber;
	},
	// 引数を漢字に
	convertIntoKanji(sheetName) {
		let name = '';

		switch (sheetName) {
			case 'yoshida':
				name = '吉田!';break;
			case 'hirata':
				name = '平田!';break;
			case 'maruyama':
				name = '丸山!';break;
			default:
				break;
		}

		return name;
	}
};

function appendPromise(requestWithoutAuth) {
	return new Promise((resolve, reject) => {
		return getAuthorizedClient().then(client => {
			const request = requestWithoutAuth;
			request.auth = client;

			return sheets.spreadsheets.values.batchUpdate(request, (err, response) => {
				if (err) {
					console.log(`The API returned an error: ${err}`);
					return reject(err);
				}
				return resolve(response.data);
			});
		});
	});
}

function getAuthorizedClient() {
	if (oauthTokens) {
		return Promise.resolve(functionsOauthClient);
	}

	return firestore.collection(DB_TOKEN_PATH).get().then(querySnapshot => {
		querySnapshot.forEach(doc => {
			oauthTokens = doc.data();
		});
		functionsOauthClient.setCredentials(oauthTokens);
		return Promise.resolve(functionsOauthClient);
	}).catch(error => console.error(`Error getting document: ${error}`));
}