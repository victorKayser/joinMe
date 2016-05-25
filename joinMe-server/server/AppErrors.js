/**
 * Objet permettant de générer les erreurs de retours pour les routes.
 *
 * S'utilise de cette façon :
 *
 * var errors = new AppErrors();
 * errors.addError('key', 'Mon erreur');
 * puis :
 * res.json(errors);
 */
'use strict';

var AppErrors = function() {
    this.errors = {};
};

AppErrors.prototype = {
    constructor: AppErrors,
    /**
     * @chainable
     */
    add: function(key, value) {
        this.errors[key] = value;
        return this;
    },
    isEmpty: function() {
        return Object.keys(this.errors).length === 0;
    },
    toJSON: function() {
        return this.errors;
    },
};

module.exports = AppErrors;
