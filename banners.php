<?php

// demo ad server that always serves out the same data

header("Content-type: text/javascript; charset=utf-8");

$funcName = $_GET["jsonp"];

$banners = array(
    "header" => array(
        array("id"=>"001", "type"=>"image", "src"=>"http://mmm.neti.ee/reklaam/users/480f0f35cd842/775x120.gif", "width"=>775, "height"=>120),
        array("id"=>"002", "type"=>"image", "src"=>"http://mmm.neti.ee/reklaam/users/480f0f35cd842/728x90.gif", "width"=>728, "height"=>90),
        array("id"=>"002", "type"=>"image", "src"=>"http://mmm.neti.ee/reklaam/users/480f0f35cd842/600x60.gif", "width"=>600, "height"=>60),
        array("id"=>"002", "type"=>"image", "src"=>"http://mmm.neti.ee/reklaam/users/480f0f35cd842/200x600.gif", "width"=>200, "height"=>600),
        array("id"=>"002", "type"=>"image", "src"=>"http://mmm.neti.ee/reklaam/users/480f0f35cd842/600x300_asemel.gif", "width"=>600, "height"=>300)
        
    )
);

$areas = array();
foreach($_GET as $key => $val){
    $keyParts = explode("~", $key);
    if(count($keyParts) == 2 && $keyParts[0] == "area"){
        $areas[] = $keyParts[1];
    }
}

$data = array();
foreach($areas as $area){
    $count = intval($_GET["area~".$area]);
    if($banners[$area]){
        $arr = $banners[$area];
        shuffle($arr);
        $data[$area] = array_slice($arr, 0, $count);    
    }
}

$response = array(
    "success" => true,
    "data" => $data
);

echo $funcName . "(" . json_encode($response) . ")";
