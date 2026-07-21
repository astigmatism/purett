<?php

require dirname(__FILE__) . '/../bin/bootstrap.php';
$database = new PureTripleTriad_Database();
$count = $database->regenerateAllTurns(500);
echo 'Regenerated turn accounts: ' . $count . PHP_EOL;
