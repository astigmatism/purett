<?php

require dirname(__FILE__) . '/TestHarness.php';

$projectRoot = getenv('PURETT_TEST_APP_ROOT');
if (!$projectRoot) {
    $projectRoot = realpath(dirname(__FILE__) . '/../..');
}

require $projectRoot . '/library/PureTripleTriad/Game.php';
require $projectRoot . '/library/PureTripleTriad/AI.php';
require dirname(__FILE__) . '/EngineFixtures.php';

$test = new PurettTestHarness();
$testFiles = glob(dirname(__FILE__) . '/unit/*Test.php');
sort($testFiles);

foreach ($testFiles as $testFile) {
    require $testFile;
}

exit($test->run());
