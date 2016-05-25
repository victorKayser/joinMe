'use strict';

var configDefault = require('../../config.js.default');
//machine locale
if (configDefault.environment === 'local') {
    var config = require('../../config.js');
}
else {
    // sur les serveurs de dev : les fichiers de config sont dans le sous répertoir private + nom du server
    var config = require('../../../../private/hubz-server/config.js');
}

var knex = require('../node_modules/knex')({
    client: 'mysql',
    connection: {
        host : config.db.mysql.host,
        user : config.db.mysql.username,
        password : config.db.mysql.password,
        database : config.db.mysql.database,
        charset : 'utf8',
    }
});

var bookshelf = require('bookshelf')(knex);

bookshelf.plugin('registry');

module.exports = bookshelf;
