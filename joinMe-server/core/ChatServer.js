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

    var prefixedUserRoom = 'room';

    io.sockets.on('connection', function (socket) {
        socket.emit('authentification');

        socket.on('joinInvitationRoom', function(invitationId) {
            socket.join(invitationId);
        });
        socket.on('giveGuessPosition', function(room, position, phone) {
            socket.to(room).emit('getGuessPosition', position, phone);
        });

        socket.on('joinPendingInvitationRoom', function(invitations) {
            for (var invitation in invitations) {
                socket.join(invitations[invitation].id_invitations);
            }
        });


        // notifie le sender quand l'invité accepte l'invitation
        socket.on('guessIsComming', function(room) {

            var phpScriptPath = config.phpScriptPathPushNotification;
            // obtention du token de push du le sender via l'invitation_id
            var invitation = knex('invitations')
                .join('users', 'users.id_users', '=', 'invitations.sender_id')
                .where('invitations.id_invitations', '=', room)
                .select('users.push_token')
            ;
            invitation.bind({}).then(function(data){
                var argsString = 'guestIsComming ' + data.push_token;

                // si lancé par gulp, mettre server/, sinon rien
                runner.exec("php " + "server/" + phpScriptPath + " " +argsString, function(err, phpResponse, stderr) {
                    if(err) {
                        console.log(err);
                    }
                    //console.log( phpResponse );
                });
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
