// Configuration Web Push avec VAPID keys
const webpush = require('web-push');

// Clés VAPID générées pour l'application
const vapidKeys = {
  publicKey: 'BEiBIFXDKRhBehlcNwczX8FfKjqgmBWNJ2MASY9gJ-3OEH1Oq8XmUakPI5Lbv8iKBreHuSk2q8tY9M8NLIuc3ow',
  privateKey: '8X4FzIOok4IiDXYAewUFOqg4YZBhL0iYWDc0-s9t_0w'
};

webpush.setVapidDetails(
  'mailto:admin@hopital-kyeshero.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

module.exports = {
  webpush,
  vapidKeys
};
