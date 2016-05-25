<?php
move_uploaded_file($_FILES["file"]["tmp_name"],  '../upload/img/'.$_FILES["file"]["name"].'.jpeg');
