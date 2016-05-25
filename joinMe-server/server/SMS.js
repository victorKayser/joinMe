'use strict';

var SmsApi = require('./SmsApi');

var configDefault = require('../config.js.default');
//machine locale
if (configDefault.environment === 'local') {
    var config = require('../config.js');
}
else {
    // sur les serveurs de dev : les fichiers de config sont dans le sous répertoir private + nom du server
    var config = require('../../../private/hubz-server/config.js');
}

var PhoneFormatter = require('./PhoneFormatter');

module.exports = {
    /**
     * Envoie un SMS et appelle le callback une fois l'envoi terminé.
     * Le callback est de la forme classique (err, res)
     */
    send: function(text, destinataire, done) {
        var formatedNumber = PhoneFormatter.format(destinataire, '+33$1$2$3$4$5');
        SmsApi.sendPremiumSMS(formatedNumber, text, config.senderlabel, config.appli_id, done);
    },
};
