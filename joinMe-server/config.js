'use strict';

var config = {
    port: 8181,
    db: {
        mysql: {
            host: 'localhost',
            username: 'root',
            password: 'ciberpunk88',
            database: 'joinme',
        },
    },
    corsOrigin: '*',
    cache: {
        disable: true, // enabled if not present
    },

    debugMailSender: 'v.kayser@gmail.com',
    chatServerPort: 5000,
    pathUploadedImages : 'http://192.168.0.11/joinMe/joinMe-server/upload/img/',
    phpScriptPathPushNotification : "pushNotification.php",
    minHourInvitationExpiration : 1,

};

module.exports = config;
