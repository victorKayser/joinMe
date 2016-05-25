'use strict';

/**
 * Retourne une chaîne pseudo aléatoire de *length* caractères.
 * Les caractères ambigus sont volontairement évités (0 et O, I et 1, S et 5)
 */
module.exports = function (length) {
    length = length || 8;
    var text = '';
    var possible = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789';

    for (var i = 0; i < length + 1; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};
