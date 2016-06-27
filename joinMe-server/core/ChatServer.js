'use strict';

 var knex = require('../core/server_modules/bookshelf').knex;

 var configDefault = require('../config.js.default');
 //machine locale
 if (configDefault.environment === 'local') {
     var config = require('../config.js');
 }
 else {
     // sur les serveurs de dev : les fichiers de config sont dans le sous répertoir private + nom du server
     var config = require('../../../private/hubz-server/config.js');
 }

var ChatServer = function() {

    var that = this;

    var server = require('http').createServer();
    var io = require('socket.io')(server);
    var runner = require("child_process");

    var prefixedUserRoom = 'room';

    io.sockets.on('connection', function (socket) {
        socket.emit('authentification');

        socket.on('joinMyIdRoom', function(user_id) {
            socket.join(user_id);
        });

        socket.on('joinInvitationRoom', function(invitationId) {
            socket.join(invitationId);
        });
        socket.on('preventSenderInvited', function(tabUser, invitationId, sender_phoneNumber) {
            for (var user in tabUser) {
                socket.to(tabUser[user]).emit('preventInvitationAppInBackground', invitationId, sender_phoneNumber);
            }
        });
        socket.on('leaveRoom', function(invitationId) {
            socket.leave(invitationId);
        });

        socket.on('preventGuestInvitationClose', function(invitationId, senderPhoneNumber) {
            socket.leave(invitationId);
            var phpScriptPath = config.phpScriptPathPushNotification;
            var argsString = 'senderCloseInvitation ' + senderPhoneNumber + ' ' + invitationId + ' ';

            var userInvited = knex('user_has_invitation')
                .join('users', 'users.id_users', '=', 'user_has_invitation.user_id')
                .where('invitation_id', '=', invitationId)
            ;
            userInvited.bind({})
                .then(function(users){
                    for(var user in users) {
                        argsString = argsString + users[user].push_token + ' ';
                    }
                    runner.exec("php " + "server/" + phpScriptPath + " " +argsString, function(err, phpResponse, stderr) {
                        if(err) {
                            console.log(err);
                        }
                    });
                })
                .catch(function(err){
                    console.log(err);
                })
            ;
        });

        socket.on('preventSenderInvitationClose', function(invitationId, guestPhoneNumber) {
            socket.leave(invitationId);
            var phpScriptPath = config.phpScriptPathPushNotification;
            var argsString = 'guestCloseInvitation ' + guestPhoneNumber + ' ';

            var allUserInvited = knex('user_has_invitation')
                .where('invitation_id', '=', invitationId)
                .andWhere('is_finished', '=', 0)
            ;
            allUserInvited.bind({})
                .then(function(users){
                    var getSenderToken = knex('invitations')
                        .join('users', 'users.id_users', '=', 'invitations.sender_id')
                        .where('invitations.id_invitations', '=', invitationId)
                        .select('users.push_token')
                    ;
                    getSenderToken.bind({})
                        .then(function(sender){
                            argsString = argsString + users.length + ' ' + invitationId + ' ' + sender[0].push_token;
                            runner.exec("php " + "server/" + phpScriptPath + " " +argsString, function(err, phpResponse, stderr) {
                                if(err) {
                                    console.log(err);
                                }
                            });
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

        socket.on('giveGuessPosition', function(room, position, phone) {
            socket.to(room).emit('getGuessPosition', position, phone, room);
        });

        socket.on('joinPendingInvitationRoom', function(invitations) {
            for (var invitation in invitations) {
                socket.join(invitations[invitation].id_invitations);
            }
        });
        socket.on('guestArrived', function(invitationId, phone) {
            socket.to(invitationId).emit('preventSenderGuestArrived', phone);
        });

        // notifie le sender quand l'invité accepte l'invitation
        socket.on('guessIsComming', function(room, user_id, guestPhone) {

            var phpScriptPath = config.phpScriptPathPushNotification;
            // obtention du token de push du le sender via l'invitation_id
            var invitation = knex('invitations')
                .join('users', 'users.id_users', '=', 'invitations.sender_id')
                .where('invitations.id_invitations', '=', room)
                .select('users.push_token')
            ;
            invitation.bind({})
                .then(function(data){
                    var argsString = 'guestIsComming ' + guestPhone + ' ' + data[0].push_token;

                    // si lancé par gulp, mettre server/, sinon rien
                    runner.exec("php " + "server/" + phpScriptPath + " " +argsString, function(err, phpResponse, stderr) {
                        if(err) {
                            console.log(err);
                        }
                        //console.log( phpResponse );

                        // mentionne en bdd que l'invitation est acceptée par l'utilisateur invité
                        var invitationAccepted = knex('user_has_invitation')
                            .where('user_id', '=', user_id)
                            .andWhere('invitation_id', '=', room)
                            .update({
                                accepted : 1,
                            })
                        ;
                        invitationAccepted.bind({})
                            .then(function(data){
                            })
                            .catch(function(err){
                                console.log(err);
                            })
                        ;
                    });
                })
                .catch(function(err){
                    console.log(err);
                })

        });

    });
    this.server = server;
};

/**
 * Connect to database(s) and start rest server
 * @param  {function} onStart called when the databases are connected and the server is ready
 */
 ChatServer.prototype.start = function(onStart) {

    onStart = onStart || function() {};

    this.server.listen(config.chatServerPort, function() {
        console.log('Server listening on port ' + config.chatServerPort + '...');
        onStart();
    });
};

module.exports = ChatServer;
