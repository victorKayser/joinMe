starter.service('phoneFormatter', [function() {
  // https://regex101.com/r/eD5oI4/4
  var regex = /^(?:\+33|0033|0) ?(\d)[\.\- ]?([\d]{2})[\.\- ]?([\d]{2})[\.\- ]?([\d]{2})[\.\- ]?([\d]{2})[\.\- ]?$/;

  /**
   * Retourne vrai si la chaîne passée est un numéro de téléphone
   */
  this.isPhoneNumber = function(string) {
      return string.match(regex);
  };
  /**
   * Retourne le numéro passé en paramètre formaté.
   * Le format par défaut est 0$1$2$3$4$5
   * Quelques formats :
   * '0$1$2$3$4$5'     -> 0123456789
   * '0$1.$2.$3.$4.$5' -> 01.23.45.67.89
   * '+33$1$2$3$4$5'   -> +33123456789
   */
  this.format = function(string, format) {
      format = format || '0$1$2$3$4$5';
      return string.replace(regex, format);
  };
  /**
   * Teste si la chaîne passée est un numéro de téléphone et le formate si oui.
   * Return false, sinon.
   * Voir `format` pour plus d'informations sur le formattage.
   */
  this.validate = function(string, format) {
      if (this.isPhoneNumber(string)) {
          return this.format(string, format);
      }
      else {
          return false;
      }
  };
}]);
