// Configuration Web Push avec VAPID keys
const webpush = require('web-push');
require('dotenv').config();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const mailto = process.env.VAPID_MAILTO || 'mailto:admin@hopital-kyeshero.com';

if (!publicKey || !privateKey) {
  console.warn('[webpush] VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY non définis — les notifications push seront désactivées.');
} else {
  webpush.setVapidDetails(mailto, publicKey, privateKey);
}

module.exports = {
  webpush,
  vapidKeys: { publicKey, privateKey },
};
