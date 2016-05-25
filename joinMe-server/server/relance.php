<?php

require_once dirname(__FILE__) . '/config.php';

try {
    $db = connection();
    raiseNotation($db);
    raiseBeforeHubzExpiration($db);
    raiseProfilUncompleted($db);
    deleteTooOldImages($db);
	updateTrialPeriod($db);
}
catch (Exception $e) {
    echo $e->getMessage();

    // la valeur 1 de retour est alors testée losqu'il y a une erreur
    // à ce moment la on utilise le dump du script .sh
    exit(1);
}

function connection() {

    $db = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME, DB_USER, DB_PASS);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "db - ".DB_NAME." - connected\n";

    return $db;
}

function raiseNotation($db) {

	$now =  DateTime::createFromFormat("Y-m-d H:i:s", date("Y-m-d H:i:s"));
	$query = $db->query("SELECT * FROM user_linkings
                         INNER JOIN ads
                         ON ads.id = user_linkings.id_applicant
						 WHERE rating_to_notify = 0
						 AND rating_notified = 0
						 AND ads.date_start <= '" . date("Y-m-d H:i:s") . "'
						 AND ads.date_end >= '" . date("Y-m-d H:i:s") ."'"
	);
	while($row = $query->fetch(PDO::FETCH_ASSOC)) {

		$dateLinking = DateTime::createFromFormat("Y-m-d H:i:s", $row['date']);

		if (date_diff($now, $dateLinking)->days >= NB_DAYS_BEFORE_RAISE ) {

			$insert = $db->query("UPDATE user_linkings
								  SET user_linkings.rating_to_notify = 1
								  WHERE user_linkings.id = " . $row['id']

			);
		}
	}
}

function raiseBeforeHubzExpiration($db) {

	$now =  DateTime::createFromFormat("Y-m-d H:i:s", date("Y-m-d H:i:s"));

	$query = $db->query("SELECT * FROM ads
						 INNER JOIN users
						 ON ads.user_id = users.id
						 WHERE ads.date_end > '" . date("Y-m-d H:i:s") . "'"
	);

	while($row = $query->fetch(PDO::FETCH_ASSOC)) {


		$dateStart = DateTime::createFromFormat("Y-m-d H:i:s", $row['date_start']);
		$dateEnd = DateTime::createFromFormat("Y-m-d H:i:s", $row['date_end']);

		if (date_diff($dateEnd, $dateStart)->days >= MIN_HUBZ_DURATION ) { // si l'annonce a au moins 3j de durée


			if (date_diff($dateEnd, $now)->days === 10 || date_diff($dateEnd, $now)->days === 1 ) { // si l'annonce expire le lendemain

				$mail = array();
				$mail["receiver"] = $row['mail'];
                $mail["subject"] = "Hubz arrivant à expiration";
                $mail["message"] = "Votre Hubz expire demain, pensez à le mettre à jour!";

				// on envoi un mail a l'user pour lui dire que son annonce expire le lendemain
				$options = array(
		            'http' => array(
		                'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
		                'method'  => 'POST',
		                'content' => http_build_query($mail),
		            ),
		        );
		        $context  = stream_context_create($options);
		        $result = file_get_contents(URL_API_SEND_MAIL, false, $context);

			}

		}
		return;
	}
}

function raiseProfilUncompleted($db) {

	$now =  DateTime::createFromFormat("Y-m-d H:i:s", date("Y-m-d H:i:s"));

	$query = $db->query("SELECT * FROM users
						 WHERE image_path IS NULL
						 OR mail IS NULL
                         OR birth_date IS NULL
	");

	while($row = $query->fetch(PDO::FETCH_ASSOC)) {

		$dateSubscribe = DateTime::createFromFormat("Y-m-d H:i:s", $row['date_subscribe']);

		// si ça fait x jours d'inscription et que le profil n'est toujours pas complet
		if (date_diff($now, $dateSubscribe)->days >= NB_DAYS_BEFORE_RAISE_PROFIL ) {
			// on met le champs à 1 qui veut la notif
			$update = $db->query("UPDATE users
								  SET users.rating_to_notify = 1
								  WHERE users.id = " . $row['id']

			);
		}
	}
}


//supprime les images de hubz trop anciennes
function deleteTooOldImages($db) {

	// séléction des images des hubz
	$query = $db->query("SELECT * FROM ad_images
						 INNER JOIN ads
						 ON ads.id = ad_images.ad_id
						 WHERE ads.date_end < NOW()
	");

	$now =  DateTime::createFromFormat("Y-m-d H:i:s", date("Y-m-d H:i:s"));

	while($row = $query->fetch(PDO::FETCH_ASSOC)) {

		$dateCreation = DateTime::createFromFormat("Y-m-d H:i:s", $row['date_creation']);

		$dateEnd = DateTime::createFromFormat("Y-m-d H:i:s", $row['date_end']);

		// si l'image a 50 jours d'ancieneté
		if (date_diff($now, $dateCreation)->days >= NB_DAYS_MAX_OLD_IMAGES ) {
			// alors on la supprime
			$delete = "DELETE FROM ad_images
			    WHERE ad_id = {$row['ad_id']}
			";

			$db->query($delete);

		}
	}
}

function updateTrialPeriod($db) {
	// séléction des hubzer dont la date de pro vient de dépasser
	$query = $db->query("SELECT * FROM users
						 WHERE date_end_pro != '0000-00-00 00:00:00'
						 AND date_end_pro < NOW()
	");

	while($row = $query->fetch(PDO::FETCH_ASSOC)) {
		// on les repasse en non-pro (status 3)
		$update = $db->query("UPDATE users
							  SET users.user_statuses_id = 3
							  WHERE users.id = " . $row['id']

		);

		$db->query($update);

	}
}
