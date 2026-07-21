<?php

require dirname(__FILE__) . '/bootstrap.php';

// The browser smoke test is deliberately repeatable against the documented
// demo identity. Restore only that seeded fixture; never touch other accounts.
$database = new PureTripleTriad_Database();
$gameConfig = new Zend_Config_Ini(APPLICATION_PATH . '/configs/game.ini');
$account = $database->getLocalAccountByUsername('demo');

if ($account) {
    $user = new PureTripleTriad_User((string) $account['userid'], $account);
    $user->deleteUser();
}

$account = $database->createLocalAccount(
    'demo',
    'Demo Player',
    password_hash('TripleTriad!', PASSWORD_DEFAULT),
    'demo@example.invalid',
    (int) $gameConfig->startingCoins
);

if (!$account || $account['username'] !== 'demo') {
    fwrite(STDERR, "The demo fixture could not be restored.\n");
    exit(1);
}

echo 'Demo fixture restored for local smoke testing.' . PHP_EOL;
