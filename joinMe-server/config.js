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
    serverURL: 'http://192.168.2.2:8183',
    chatServerPort: 5000,
    pathUploadedImages : 'http://192.168.1.17/joinMe/joinMe-server/upload/img/',
    phpScriptPathPushNotification : "pushNotification.php",

};

module.exports = config;
