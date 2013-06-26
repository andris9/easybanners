<?php

header("Content-type: text/javascript; charset=utf-8");

$funcName = $_GET["jsonp"];

$response = array(
    "success" => true,
    "data" => true
);

echo $funcName . "(" . json_encode($response) . ")";