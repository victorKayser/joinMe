'use strict';

var ApiManager = require('./ApiManager');

// URL de l'api
var URL_API = "http://dev.moobee.fr/smsapi/";

// Sous-type possible d'un sms
var TYPE = "SMS";

// Sous-type possible d'un sms
var SUBTYPE = { 
    LOWCOST: "LOWCOST",
    STANDARD: "STANDARD",
    PREMIUM: "PREMIUM",
    CONCATENE: "CONCATENE",
    MONDE: "MONDE",
    STOP: "STOP"
};

/**
* Fonction qui permet l'envoi de SMS Lowcost
* @param string recipients Liste des numéro
* @param string content
* @param function done Callback appelé à la fin de l'appel Ajax
*/
function sendSMS(subtype, recipients, content, senderlabel, senddate, sendtime, appli_id, done) {
    ApiManager.post(
        URL_API+"sms/send",
        {
            type: TYPE,
            subtype: subtype,
            recipients: recipients,
            content: content,
            senderlabel: senderlabel,
            senddate: senddate,
            sendtime: sendtime,
            appli_id: appli_id
        },
        done
    );
}

/**
* Fonction qui permet l'envoi de SMS Lowcost
* @param string recipients Liste des numéro
* @param string content
* @param function done Callback appelé à la fin de l'appel Ajax
*/
function sendLowcostSMS(recipients, content, appli_id, done) {
    sendSMS(SUBTYPE.LOWCOST, recipients, content, null, null, null, appli_id, done);
}

/**
* Fonction qui permet l'envoi de SMS 
* @param string recipients
* @param string content
* @param string senderlabel
* @param function done Callback appelé à la fin de l'appel Ajax
*/
function sendPremiumSMS(recipients, content, senderlabel, appli_id, done) {
    sendSMS(SUBTYPE.PREMIUM, recipients, content, senderlabel, null, null, appli_id, done);
}

/**
* Fonction qui permet l'envoi de SMS premium
* @param string email
* @param string apikey
* @param function done Callback appelé à la fin de l'appel Ajax
*/
function checkCredits(done) {
    ApiManager.get(URL_API+"checkCredits", done);
}

module.exports = {
    sendSMS: sendSMS,
    sendLowcostSMS: sendLowcostSMS,
    sendPremiumSMS: sendPremiumSMS,
    checkCredits: checkCredits,
    subtype: SUBTYPE
};
