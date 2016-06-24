'use strict';

/**
 * Serveur REST de l'appli Hubz.
 * Voir la documentatation dans `documentation/api.md` pour plus d'infos
 */

var configDefault = require('../config.js.default');
//machine locale
if (configDefault.environment === 'local') {
    var config = require('../config.js');
}
else {
    // sur les serveurs de dev : les fichiers de config sont dans le sous répertoir private + nom du server
    var config = require('../../../private/hubz-server/config.js');
}

var RestServer = require('../core/RestServer');
var ChatServer = require('../core/ChatServer');
var pause = require('connect-pause');
var AppErrors = require('./AppErrors');
var PhoneFormatter = require('./PhoneFormatter');
var SMS = require('./SMS');
var uuid = require('node-uuid');
var messages = require('./messages');
var format = require('format');
var path = require('path');
var moment = require('moment');
moment.locale('fr');
var express = require('../core/node_modules/express');
var knex = require('../core/server_modules/bookshelf').knex;
var crypto = require('crypto');

var server = new RestServer({
    useMysql: true,
});

var chatServer = new ChatServer();

var nodemailer = require('nodemailer');
var sendmailTransport = require('nodemailer-sendmail-transport');

var runner = require("child_process");


// Permet d'ajouter du délai aux requêtes pour les tests (config.addedDelayMs)
if (config.addedDelayMs) {
    server.app.use(pause(config.addedDelayMs));
}


/**
 * Fetch models based on the passed options.
 * If onlyOne is true, only one model will be returned.
 */
var fetchCollection = function (Model, queryOptions, fetchOptions) {

    queryOptions = queryOptions || {};
    fetchOptions = fetchOptions || {};

     var fetch = Model
        .forge()
        .query(queryOptions)
        .fetchAll(fetchOptions)
    ;

    return fetch;
};

/**
 * Envoie les données JSON retournées par la promise.
 * En cas d'erreur, une erreur 500 est envoyée.
 */
var sendJson = function (res, mysqlPromise, filterRows) {

    filterRows = filterRows || function (rows) { return rows; };

    mysqlPromise
        .then(function(rows) {
            res.json(filterRows(rows));
        })
        .catch(function(err) {
            res.sendStatus(500);
            console.error(err.message);
        })
    ;
};

var onStart = function() {

    var app = server.app;
    var cache = server.apicache;
    var cacheEnabled = !server.config.cache || !server.config.cache.disable;

    app.use('/img', express.static(__dirname + '/../upload/img', { maxAge: cacheEnabled ? '3 days' : '' }));

    /**
     * Inscrit un utilisateur (particulier). Envoie un SMS avec le mot de passe
     * généré au numéro fourni.
     */
    app.post('/register', function(req, res) {

        var errors = new AppErrors();

        var password = req.body.password;
        var phoneNumber;

        if (PhoneFormatter.isPhoneNumber(req.body.phoneNumber)) {
            phoneNumber = PhoneFormatter.format(req.body.phoneNumber);
        }
        else {
            errors.add('phoneNumber', 'not good number format');
            return res.status(400).json(errors);
        }

        var kPhoneNumber = knex('users')
            .where('phone_number', '=', phoneNumber)
        ;

        kPhoneNumber.bind({})
            // On vérifie que le numéro de téléphone n'existe pas déjà
            .then(function(rowsPhoneNumber) {

                // Si le numéro de téléphone existe, on ajoute une erreur.
                if (rowsPhoneNumber.length > 0) {
                    errors.add('phoneNumber', 'number already used');
                }
            })
            // On retourne 400 s'il y a une erreur, sinon on continue (création de l'user)
            .then(function() {
                // Si on a ajouté des erreurs, on s'arrête là
                if (!errors.isEmpty()) {
                    throw errors;
                }
                else {
                    // hashage du password
                    var passwordHash = crypto.createHash('sha256').update(password).digest('hex');
                    var insertNewUser = knex('users').insert({
                        phone_number : phoneNumber,
                        password : passwordHash,
                        date_subscribe : new Date(),
                    })
                    .bind({})
                    .then(function() {
                        return res.sendStatus(200);
                    })
                    .catch(function(err) {
                        throw err;
                    })
                }
            })
            .catch(function(err) {
                if (err instanceof AppErrors) {
                    return res.status(400).json(err);
                }
                else {
                    console.error(err);
                    return res.sendStatus(500);
                }
            })
        ;
    });

    app.post('/login', function(req, res) {
        if (!(req.body.phoneNumber && req.body.password)) {
            res.sendStatus(401);
            return;
        }

        var phoneNumber = req.body.phoneNumber;
        var password = req.body.password;

        var kSearchByUsernamePhoneNumber = knex('users')
            .where('phone_number', '=', phoneNumber)
            .andWhere('password', '=', crypto.createHash('sha256').update(password).digest('hex'))
        ;
        kSearchByUsernamePhoneNumber
            .then(function (rows) {
                // user found
                if (rows.length > 0) {
                    req.user = rows[0];
                    res.json(req.user);
                    return;
                }
                else {
                    // not found by number/password
                    res.sendStatus(401);
                    return;
                }
            })
            // user not found
            .catch(function(err) {
                // not found by number/password
                res.sendStatus(401);
                return;
            });
        ;
    });

    app.post('/setUserImage', function(req, res) {
        var phoneNumber = req.body.phoneNumber;
        var image = req.body.image_path;
        if (!(phoneNumber && image)) {
            res.sendStatus(401);
            return;
        }

        var users = knex('users')
            .where('phone_number', '=', phoneNumber)
            .update({
                image_path: image,
            })
        ;
        users
            .then(function () {
                res.sendStatus(200);
                return;
            })
            .catch(function(err) {
                res.sendStatus(401);
                return;
            })
        ;
    });

    app.post('/checkKnownUsers', function(req, res) {
        var contacts = req.body.contacts;
        if (!contacts) {
            res.sendStatus(401);
            return;
        }
        var inc = 0;
        var size = contacts.length;

        contacts.map(function(contact) {
            if ((contact.displayName !== '') && (contact.phoneNumbers !== null)) {
                var checkContact =knex('users')
                    .where('phone_number', '=', PhoneFormatter.format(contact.phoneNumbers[0].value))
                ;
                checkContact
                    .then(function (row) {
                        if (row.length >= 1) {
                            contact.isRegistered = true;
                            contact.image_path = config.pathUploadedImages + row[0].image_path;
                        }
                        else {
                            contact.isRegistered = false;
                        }
                        inc++;
                        if (inc === size) {
                            res.json(contacts);
                            return;
                        }

                    })
                    .catch(function(err) {
                        res.sendStatus(401);
                        return;
                    })
                ;
            }

        });
    });

    app.post('/setPushInfos', function(req, res) {
        var user_id = req.body.id;
        var token = req.body.token;
        var os = req.body.os;
        if (!(user_id && token && os)) {
            res.sendStatus(401);
            return;
        }
        var updateUser = knex('users')
            .update({
                push_token: token,
                OS: os
            })
            .where('id_users', '=', user_id)
        ;
        updateUser
            .then(function(){

                res.sendStatus(200);
                return;

            })
            .catch(function(err) {
                res.sendStatus(401);
                return;
            })
        ;
    });

    app.post('/sendInvitation', function(req, res) {
        var user_id = req.body.id;
        // objet comportant les numéro de téléphone des invités
        var invitationObject = req.body.invitationObject;
        var position = req.body.position;
        var emoji = req.body.emoji
        var sender_phoneNumber = req.body.sender_phoneNumber;
        if (!(user_id && invitationObject && position && emoji && sender_phoneNumber)) {
            res.sendStatus(401);
            return;
        }

        // crée l'invitation en bdd
        var newInvitation = knex('invitations').insert({
            sender_id : user_id,
            sender_position : position,
            date: new Date(),
            emoji_path : emoji,
            sender_phoneNumber : sender_phoneNumber,
        });
        newInvitation
            .then(function(id){
                var newUserHasInvitation = knex('user_has_invitation');
                var getTokenForNumber = knex('users');
                var invitationId = id[0];
                // prépare les arguments a donner à la commande php pour le fichier d'exéc du push
                // newInvitation est un intitulé qui servira a établir les messages sur la notif
                // suivi de l'invitationId
                var argsString = 'newInvitation ' + invitationId + ' ';

                // prépare la requete pour avoir uniquement les users dont les numéros matchent avec les personnes invitées
                invitationObject.map(function(contact, key) {
                    getTokenForNumber
                        .orWhere('phone_number', '=', contact.number)
                    ;
                });
                getTokenForNumber
                    // ici sont retournés les infos des users invités
                    .then(function(users){
                        var tabUserId = [];
                        users.map(function(user, key) {
                            argsString = argsString + user.push_token + ' ';
                            // insere dans la nouvelle invitation les personnes
                            newUserHasInvitation
                                .insert({
                                    user_id : user.id_users,
                                    invitation_id : invitationId
                                })
                            ;
                            tabUserId.push(user.id_users);
                        })
                        var phpScriptPath = config.phpScriptPathPushNotification;
                        // si lancé par gulp, mettre server/, sinon rien
                        runner.exec("php " + "server/" + phpScriptPath + " " +argsString, function(err, phpResponse, stderr) {
                            if(err) {
                                console.log(err);
                            }
                            //console.log( phpResponse );
                        });

                        // exécute la requête qui insère dans la table user_has_invitation les personnes invitées
                        newUserHasInvitation
                            .then(function(data){
                                var data = {
                                    invitationId : invitationId,
                                    tabUserId : tabUserId
                                };
                                res.json(data);
                                return;
                            })
                            .catch(function(err){
                                console.log(err);
                            })
                        ;
                    })
                ;
            })
            .catch(function(err){
                console.log(err);
            })
        ;
    })

    app.post('/getInvitationInfos', function(req, res) {
        var invitation_id = req.body.invitation_id;
        var user_id = req.body.user_id;

        if (!invitation_id) {
            res.sendStatus(401);
            return;
        }

        var invitation = knex('invitations')
            .join('user_has_invitation', 'user_has_invitation.invitation_id', '=', 'invitations.id_invitations')
            .where('invitations.id_invitations', '=', invitation_id)
            .andWhere('user_has_invitation.user_id', '=', user_id)
            .andWhere('user_has_invitation.is_finished', '=', 0)
        ;

        invitation
            .then(function(data){
                res.json(data);
                return;
            })
            .catch(function(err){
                console.log(err);
            })
        ;

    });

    app.post('/checkSenderPendingInvitation', function(req, res) {
        var user_id = req.body.user_id;
        if (!user_id) {
            res.sendStatus(401);
            return;
        }
        var invitations = knex('invitations')
            .join('user_has_invitation', 'invitations.id_invitations', '=', 'user_has_invitation.invitation_id')
            .where('invitations.sender_id', '=', user_id)
            .andWhere('user_has_invitation.is_finished', '=', 0)
            .andWhere('user_has_invitation.accepted', '=', 1)
        ;
        invitations.bind({})
            .then(function(data){
                var goodData = [];
                var now = moment().format('YYYY-MM-DD hh:mm:ss');
                data.map(function(invitation){
                    var date = moment(invitation.date);
                    var diff = moment(now).diff(date, 'hours');
                    if (diff <= config.minHourInvitationExpiration) {
                        goodData.push(invitation);
                    }
                });
                res.json(goodData);
            })
            .catch(function(err){
                console.log(err);
            })
        ;
    });

    app.post('/checkGuestPendingInvitation', function(req, res) {
        var user_id = req.body.user_id;
        if (!user_id) {
            res.sendStatus(401);
            return;
        }
        var invitations = knex('invitations')
            .join('user_has_invitation', 'invitations.id_invitations', '=', 'user_has_invitation.invitation_id')
            .where('user_has_invitation.user_id', '=', user_id)
            .andWhere('user_has_invitation.is_finished', '=', 0)
            .andWhere('user_has_invitation.accepted', '=', 1)
        ;
        invitations.bind({})
            .then(function(data){
                var goodData = [];
                var now = moment().format('YYYY-MM-DD hh:mm:ss');
                data.map(function(invitation){
                    var date = moment(invitation.date);
                    var diff = moment(now).diff(date, 'hours');
                    if (diff <= 1) {
                        goodData.push(invitation);
                    }
                })
                res.json(goodData);
            })
            .catch(function(err){
                console.log(err);
            })
        ;
    });

    app.post('/closeInvitation', function(req, res) {
        var user_id = req.body.user_id;
        var invitationId = req.body.invitation_id;
        if (!(user_id && invitationId)) {
            res.sendStatus(401);
            return;
        }
        // check si celui qui met fin a l'invit est un invité ou le sender
        var checkSenderStatus = knex('invitations')
            .where('sender_id', '=', user_id)
            .andWhere('id_invitations', '=', invitationId)
        ;
        checkSenderStatus.bind({})
            .then(function(result){

                var finishedInvitation = knex('user_has_invitation')
                    .update({
                        is_finished : 1,
                    })
                    .where('invitation_id', '=', invitationId)
                ;

                // si result c'est le sender qui met fin a l'invit, donc tous les users auront finished a 1
                // aucun result, c'est un invité qui souhaite mettre fin a l'invitation
                if (result.length === 0) {
                    // on met finished à 1 pour tout les invités
                    finishedInvitation
                        .andWhere('user_id', '=', user_id)
                    ;
                }

                finishedInvitation.bind({})
                    .then(function(result){
                        res.json(result);
                    })
                    .catch(function(err){
                        console.log(err);
                    })
                ;
            })
            .catch(function(err){
                console.log(err);
            })
        ;

    });



};

server.start(onStart);

chatServer.start();
