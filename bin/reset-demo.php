<?php

require dirname(__FILE__) . '/bootstrap.php';

// The browser smoke test is deliberately repeatable against the documented
// demo identity. Restore only that seeded fixture; never touch other accounts.
$database = new PureTripleTriad_Database();
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
    200
);

if (!$account || $account['username'] !== 'demo') {
    fwrite(STDERR, "The demo fixture could not be restored.\n");
    exit(1);
}

echo 'Demo fixture restored for local smoke testing.' . PHP_EOL;
