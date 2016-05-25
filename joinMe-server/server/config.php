<?php

define('DB_HOST', 'localhost');
define('DB_NAME', 'hubz');
define('DB_USER', 'userbase');
define('DB_PASS', 'fadiese');

define('NB_DAYS_BEFORE_RAISE', 7); // avant la relance de notation
define('MIN_HUBZ_DURATION', 3); // jours d'ancienneté de hubz avant de notifier pour un jour avant expiration

define('URL_API_SEND_MAIL', 'http://192.168.2.8:8184/sendMail'); // cette route doit correspondre avec serverURL de config.js
define('NB_DAYS_BEFORE_RAISE_PROFIL', 2);
define('NB_DAYS_MAX_OLD_IMAGES', 50);

 ?>
