/**
 * Permet de tester le format d'un numéro de téléphone et de le formater.
 */
(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.PhoneFormatter = factory();
    }
}(this, function () {
    'use strict';

    var PhoneFormatter = {

        // https://regex101.com/r/eD5oI4/4
        regex: /^(?:\+33|0033|0) ?(\d)[\.\- ]?([\d]{2})[\.\- ]?([\d]{2})[\.\- ]?([\d]{2})[\.\- ]?([\d]{2})[\.\- ]?$/,

        /**
         * Retourne vrai si la chaîne passée est un numéro de téléphone
         */
        isPhoneNumber: function(string) {
            return string.match(PhoneFormatter.regex);
        },

        /**
         * Retourne le numéro passé en paramètre formaté.
         * Le format par défaut est 0$1$2$3$4$5
         * Quelques formats :
         * '0$1$2$3$4$5'     -> 0123456789
         * '0$1.$2.$3.$4.$5' -> 01.23.45.67.89
         * '+33$1$2$3$4$5'   -> +33123456789
         */
        format: function(string, format) {
            format = format || '0$1$2$3$4$5';
            return string.replace(PhoneFormatter.regex, format);
        },

        /**
         * Teste si la chaîne passée est un numéro de téléphone et le formate si oui.
         * Return false, sinon.
         * Voir `format` pour plus d'informations sur le formattage.
         */
        validate: function(string, format) {
            if (PhoneFormatter.isPhoneNumber(string)) {
                return PhoneFormatter.format(string, format);
            }
            else {
                return false;
            }
        }
    };

    return PhoneFormatter;
}));
