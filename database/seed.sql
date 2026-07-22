SET NAMES utf8mb4;

INSERT INTO users (idusers, joined, email, wins, losses, draws)
VALUES
    (1, UTC_TIMESTAMP(), NULL, 0, 0, 0),
    (2, UTC_TIMESTAMP(), 'demo@example.invalid', 0, 0, 0);

INSERT INTO local_accounts (userid, username, display_name, password_hash)
VALUES (2, 'demo', 'Demo Player', '$2y$10$OItwlyCiZHbrJmM6obtY3et6ooSeA.NvLvvtQdPDbCY/9zrv4KEny');

INSERT INTO wallets (userid, balance) VALUES (2, 10);
INSERT INTO coin_transactions (userid, amount, balance_after, transaction_type, reference_key, details)
VALUES (2, 10, 10, 'initial_grant', 'seed:demo', 'Standalone demo balance');

INSERT INTO usercards (userid, cardid, notes, inhand, strengthrank, purchased)
SELECT 2, idcards, 'Standalone starting hand.', 1, strength, 0
FROM cards
WHERE idcards IN (1, 4, 12, 17, 23)
ORDER BY idcards;

INSERT INTO gamehistory (gameid, userid, completed, p1score, p2score, log_path, is_public, tutorial_slug)
VALUES
    (1, 1, UTC_TIMESTAMP(), 5, 5, 'tutorials/1.jsonl', 1, 'basics'),
    (2, 1, UTC_TIMESTAMP(), 5, 5, 'tutorials/2.jsonl', 1, 'same'),
    (4, 1, UTC_TIMESTAMP(), 5, 5, 'tutorials/4.jsonl', 1, 'plus'),
    (5, 1, UTC_TIMESTAMP(), 5, 5, 'tutorials/5.jsonl', 1, 'elemental');

ALTER TABLE users AUTO_INCREMENT = 3;
