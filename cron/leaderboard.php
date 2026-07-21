<?php

require dirname(__FILE__) . '/../bin/bootstrap.php';
$database = new PureTripleTriad_Database();
$leaderboard = $database->cacheThreeDayLeaderboard();
echo 'Cached three-day leaderboard rows: ' . count($leaderboard) . PHP_EOL;
