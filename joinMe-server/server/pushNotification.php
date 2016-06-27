<?php
  // API access key from Google API's Console
  define( 'API_ACCESS_KEY', 'AIzaSyAVBJP2BHN1PoAzEqSuVNzODBXk23ix0ZI' );
  $registrationIds = array();

  if ($argv[1] === "newInvitation") {
    $title= "You have an invitation!";
    $message = "Click to open";

    // boucle sur les paramètres $argv
    // à partir du 3 car le 0 = le nom du fichier
    // 1 la raison du push (new invitation, etc)
    // 2 l'id de l'invitation
    // ceux a partir de 3 doivent correspondre à des tokens UNIQUEMENT
    // et les push dans un tableau de token
    foreach ($argv as $key => $value) {
      if ($key >3){
        array_push($registrationIds, $value);
      }
    }
    // prep the bundle
    $msg = array
    (
    	'message' 	=> $message,
    	'title'		=> $title,
    	'subtitle'	=> 'This is a subtitle. subtitle',
    	'tickerText'	=> 'Ticker text here...Ticker text here...Ticker text here',
    	'vibrate'	=> 1,
    	'sound'		=> 'default',
    	'image'	=> 'icon',
      'icon' => 'ic_stat_j',
      'ledColor' => [0, 0, 255, 0],
      'invitationId' => $argv[2],
      'sender_phoneNumber' => $argv[3]
    );
  }
  elseif($argv[1] === "guestIsComming") {
    $title= "A guest is comming !";
    $message = "Click to open";

    array_push($registrationIds, $argv[3]);
    // prep the bundle
    $msg = array
    (
    	'message' 	=> $message,
    	'title'		=> $title,
    	'subtitle'	=> 'This is a subtitle. subtitle',
    	'tickerText'	=> 'Ticker text here...Ticker text here...Ticker text here',
    	'vibrate'	=> 1,
    	'sound'		=> 'default',
    	'image'	=> 'icon',
      'icon' => 'ic_stat_j',
      'ledColor' => [0, 0, 255, 0],
      'guestIsComming' => true,
      'guestPhone' => $argv[2]
    );
  }
  elseif ($argv[1] === "senderCloseInvitation") {
    $title= "End of invitation";
    $message = "Click to open";

    foreach ($argv as $key => $value) {
      if ($key >3){
        array_push($registrationIds, $value);
      }
    }
    // prep the bundle
    $msg = array
    (
    	'message' 	=> $message,
    	'title'		=> $title,
    	'subtitle'	=> 'This is a subtitle. subtitle',
    	'tickerText'	=> 'Ticker text here...Ticker text here...Ticker text here',
    	'vibrate'	=> 1,
    	'sound'		=> 'default',
    	'image'	=> 'icon',
      'icon' => 'ic_stat_j',
      'ledColor' => [0, 0, 255, 0],
      'senderCloseInvitation' => true,
      'senderPhoneNumber' => $argv[2],
      'leavedInvitation' => $argv[3]
    );
  }
  elseif ($argv[1] === "guestCloseInvitation") {
    $title= "A guest is leaving the invitation";
    $message = "Click to open";

    array_push($registrationIds, $argv[5]);

    // prep the bundle
    $msg = array
    (
    	'message' 	=> $message,
    	'title'		=> $title,
    	'subtitle'	=> 'This is a subtitle. subtitle',
    	'tickerText'	=> 'Ticker text here...Ticker text here...Ticker text here',
    	'vibrate'	=> 1,
    	'sound'		=> 'default',
    	'image'	=> 'icon',
      'icon' => 'ic_stat_j',
      'ledColor' => [0, 0, 255, 0],
      'guestCloseInvitation' => true,
      'guestPhoneNumber' => $argv[2],
      'remainingGuestNumber' => $argv[3],
      'leavedInvitation' => $argv[4]
    );
  }

  $fields = array
  (
  	'registration_ids' 	=> $registrationIds,
  	'data'			=> $msg
  );

  $headers = array
  (
  	'Authorization: key=' . API_ACCESS_KEY,
  	'Content-Type: application/json'
  );

  $ch = curl_init();
  curl_setopt( $ch,CURLOPT_URL, 'https://android.googleapis.com/gcm/send' );
  curl_setopt( $ch,CURLOPT_POST, true );
  curl_setopt( $ch,CURLOPT_HTTPHEADER, $headers );
  curl_setopt( $ch,CURLOPT_RETURNTRANSFER, true );
  curl_setopt( $ch,CURLOPT_SSL_VERIFYPEER, false );
  curl_setopt( $ch,CURLOPT_POSTFIELDS, json_encode( $fields ) );
  $result = curl_exec($ch );
  curl_close( $ch );
  echo $result;
 ?>
