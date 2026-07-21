<?php

require dirname(__FILE__) . '/bootstrap.php';

$result = array('database' => false, 'redis' => false, 'schema' => null, 'runtime' => false);
try {
    $database = new PureTripleTriad_Database();
    $result['database'] = $database->ping();
    $result['schema'] = $database->getSchemaVersion();
    $cache = new PureTripleTriad_Redis();
    $result['redis'] = $cache->ping();
    $result['runtime'] = is_writable(GAMEHISTORY_PATH) && is_writable(RUNTIME_PATH . '/log');
} catch (Exception $e) {
    fwrite(STDERR, "health check failed\n");
}

$ok = $result['database'] && $result['redis'] && $result['schema'] && $result['runtime'];
echo json_encode(array('status' => $ok ? 'ok' : 'error', 'checks' => $result)) . PHP_EOL;
exit($ok ? 0 : 1);
