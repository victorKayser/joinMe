starter.service('getUserInfosByPhone', function(phoneFormatter) {

  var myRegisteredContacts = JSON.parse(window.localStorage['registeredUser'] || '{}');

  this.getInfos = function(phoneNumber) {

    for (var contact in myRegisteredContacts) {
      if (phoneFormatter.validate(myRegisteredContacts[contact].phoneNumbers[0].value) === phoneFormatter.validate(phoneNumber)) {
        return myRegisteredContacts[contact];
      }
    }
  };
});
