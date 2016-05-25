'use strict';

/**
 * A simple and easy to configure rest server.
 *
 * Server properties :
 *     this.config : loaded config
 *     this.router : express instance
 *
 * Server Options :
 *     useMongo (default : false) ; If true, mongoConnection and mongoose will be defined
 *         this.app.set('mongoose') : Mongoose instance
 *     useMysql (default : false) ; If true, mysqlConnection will be defined
 *         that.app.set('bookshelf') : bookshelf instance
 *         core/server_modules/bookshelf : bookshelf instance
 *
 */
var RestServer = function(options) {

    options = options || {};

    this.useMongo = options.useMongo || false;
    this.useMysql = options.useMysql || false;

    var configDefault = require('../config.js.default');
    //machine locale
    if (configDefault.environment === 'local') {
        this.config = require('../config.js');
    }
    else {
        // sur les serveurs de dev : les fichiers de config sont dans le sous répertoir private + nom du server
        this.config = require('../../../private/hubz-server/config.js');
    }

    // Load node modules
    var express = require('express');
    var bodyParser = require('body-parser');
    var cors = require('cors');

    var app = express();

    app.use(cors({
        origin: this.config.corsOrigin,
    }));
    //app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

    this.apicache = require('apicache').options({
        defaultDuration: this.config.cache && this.config.cache.duration || 1000 * 60 * 60,
        enabled: !(this.config.cache && this.config.cache.disable),
    }).middleware;

    this.app = app;
};

/**
 * Connect to database(s) and start rest server
 * @param  {function} onStart called when the databases are connected and the server is ready
 */
RestServer.prototype.start = function(onStart) {

    var that = this;

    onStart = onStart || function() {};

    // Add the GET /version route
    this.app.get('/version', function (req, res) {
        var fs = require('fs');

        fs.readFile(__dirname + '/../version.json', function (err, data) {
          if (err) {
              console.error(err);
              res.send(err.message);
          }
          else {
              res.send(JSON.parse(data).version);
          }
        });
    });

    var async = require('async');

    console.log('Database connection...');

    // Make a connection to the mongo database
    var connectMongo = function(done) {
        console.log('MongoDB connection...');

        var mongoose = require('mongoose/');
        var connection = mongoose.connection;
        mongoose.connect(that.config.db.mongo.auth);

        that.app.set('mongoose', mongoose);

        connection.on('error', function(err) {
            console.error('MongoDB error');
            throw err;
        });

        connection.once('open', function () {
            console.log('MongoDB connected !');
            done(null);
        });
    };

    // Make a connection to the mysql database
    var connectMysql = function(done) {
        console.log('MySQL connection...');

        var bookshelf = require('./server_modules/bookshelf');
        that.app.set('bookshelf', bookshelf);

        console.log('MySQL connected !');

        done(null);

    };

    var dbConnections = {};

    if (that.useMongo) {
        dbConnections.mongo = connectMongo;
    }
    if (that.useMysql) {
        dbConnections.mysql = connectMysql;
    }



    async.parallel(dbConnections, function(err) {

        if (err) {
            throw err;
        }

        that.app.listen(that.config.port, function() {
            console.log('Server listening on port ' + that.config.port + '...');
            onStart();
        });
    });

};

module.exports = RestServer;
