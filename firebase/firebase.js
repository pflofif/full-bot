/* eslint-disable linebreak-style */

const {initializeApp, cert} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

const serviceAccount = require("../full-telegram-bot-firebase-adminsdk-5nylh-1261bf62b1.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
module.exports = {db};
