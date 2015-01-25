<?php

function oldest($a, $b) {
    return filemtime($b) - filemtime($a);
}

$dir = glob("./*.js"); // put all files in an array
uasort($dir, "oldest"); // sort the array by calling newest()

header("Content-Type: application/json");
echo json_encode(array_values(array_map("basename", $dir)));

?>