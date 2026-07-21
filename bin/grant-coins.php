<?php

require dirname(__FILE__) . '/bootstrap.php';

if ($argc !== 3 || !preg_match('/^[a-z0-9][a-z0-9_.-]{2,31}$/', strtolower($argv[1])) || !ctype_digit($argv[2])) {
    fwrite(STDERR, "Usage: php bin/grant-coins.php USERNAME POSITIVE_AMOUNT\n");
    exit(2);
}

$database = new PureTripleTriad_Database();
$account = $database->getLocalAccountByUsername(strtolower($argv[1]));
$amount = (int) $argv[2];
if (!$account || $amount < 1 || $amount > 1000000) {
    fwrite(STDERR, "Account not found or amount outside 1..1000000.\n");
    exit(2);
}

$strong = false;
$random = openssl_random_pseudo_bytes(12, $strong);
if ($random === false || !$strong) {
    fwrite(STDERR, "Secure random generation is unavailable.\n");
    exit(1);
}
$reference = 'cli:' . bin2hex($random);
$balance = $database->grantCoins((int) $account['userid'], $amount, $reference);
echo 'New balance: ' . $balance . PHP_EOL;
