SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE schema_migrations (
    version VARCHAR(32) NOT NULL PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
    idusers BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    joined DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(254) NULL,
    wins INT UNSIGNED NOT NULL DEFAULT 0,
    losses INT UNSIGNED NOT NULL DEFAULT 0,
    draws INT UNSIGNED NOT NULL DEFAULT 0,
    deleted_at DATETIME NULL,
    PRIMARY KEY (idusers),
    KEY idx_users_leaderboard (wins, losses, draws)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE local_accounts (
    userid BIGINT UNSIGNED NOT NULL,
    username VARCHAR(64) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    disabled TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (userid),
    UNIQUE KEY uq_local_accounts_username (username),
    CONSTRAINT fk_local_accounts_user FOREIGN KEY (userid) REFERENCES users (idusers) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wallets (
    userid BIGINT UNSIGNED NOT NULL,
    balance INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userid),
    CONSTRAINT fk_wallets_user FOREIGN KEY (userid) REFERENCES users (idusers) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coin_transactions (
    idcointransactions BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    userid BIGINT UNSIGNED NOT NULL,
    amount INT NOT NULL,
    balance_after INT UNSIGNED NOT NULL,
    transaction_type VARCHAR(32) NOT NULL,
    reference_key VARCHAR(96) NOT NULL,
    details VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idcointransactions),
    UNIQUE KEY uq_coin_transactions_reference (userid, reference_key),
    KEY idx_coin_transactions_user_date (userid, created_at),
    CONSTRAINT fk_coin_transactions_user FOREIGN KEY (userid) REFERENCES users (idusers) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cards (
    idcards SMALLINT UNSIGNED NOT NULL,
    level TINYINT UNSIGNED NOT NULL,
    n TINYINT UNSIGNED NOT NULL,
    e TINYINT UNSIGNED NOT NULL,
    s TINYINT UNSIGNED NOT NULL,
    w TINYINT UNSIGNED NOT NULL,
    element TINYINT NULL,
    image VARCHAR(80) NOT NULL,
    name VARCHAR(100) NOT NULL,
    iddeck INT UNSIGNED NOT NULL DEFAULT 0,
    strength TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (idcards),
    UNIQUE KEY uq_cards_image (image),
    KEY idx_cards_level (level),
    KEY idx_cards_strength (strength)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE options (
    idoptions SMALLINT UNSIGNED NOT NULL,
    name VARCHAR(64) NOT NULL,
    PRIMARY KEY (idoptions),
    UNIQUE KEY uq_options_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE useroptions (
    iduseroptions BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    userid BIGINT UNSIGNED NOT NULL,
    optionid SMALLINT UNSIGNED NOT NULL,
    value VARCHAR(64) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (iduseroptions),
    UNIQUE KEY uq_useroptions_value (userid, optionid, value),
    KEY idx_useroptions_active (userid, optionid, active),
    CONSTRAINT fk_useroptions_user FOREIGN KEY (userid) REFERENCES users (idusers) ON DELETE CASCADE,
    CONSTRAINT fk_useroptions_option FOREIGN KEY (optionid) REFERENCES options (idoptions) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usercards (
    idusercards BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    userid BIGINT UNSIGNED NOT NULL,
    cardid SMALLINT UNSIGNED NOT NULL,
    obtained DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255) NULL,
    inhand TINYINT(1) NOT NULL DEFAULT 0,
    strengthrank TINYINT UNSIGNED NOT NULL,
    purchased TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (idusercards),
    KEY idx_usercards_user_hand (userid, inhand),
    KEY idx_usercards_card (cardid),
    CONSTRAINT fk_usercards_user FOREIGN KEY (userid) REFERENCES users (idusers) ON DELETE CASCADE,
    CONSTRAINT fk_usercards_card FOREIGN KEY (cardid) REFERENCES cards (idcards)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE games (
    idgames BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    p1 BIGINT UNSIGNED NOT NULL,
    p1score TINYINT UNSIGNED NOT NULL DEFAULT 5,
    p2 BIGINT UNSIGNED NOT NULL DEFAULT 1,
    p2score TINYINT UNSIGNED NOT NULL DEFAULT 5,
    elements VARCHAR(32) NOT NULL DEFAULT '-1,-1,-1,-1,-1,-1,-1,-1,-1',
    elementbonus TINYINT NOT NULL DEFAULT 1,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    victoryclaim TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `key` VARCHAR(128) NOT NULL,
    insuddendeath TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (idgames),
    UNIQUE KEY uq_games_active_player (p1),
    CONSTRAINT fk_games_player FOREIGN KEY (p1) REFERENCES users (idusers) ON DELETE CASCADE,
    CONSTRAINT fk_games_computer FOREIGN KEY (p2) REFERENCES users (idusers)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rules (
    idrules TINYINT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,
    description VARCHAR(500) NOT NULL,
    PRIMARY KEY (idrules),
    UNIQUE KEY uq_rules_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gamerules (
    idgamerules BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ruleid TINYINT UNSIGNED NOT NULL,
    gameid BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (idgamerules),
    UNIQUE KEY uq_gamerules_game_rule (gameid, ruleid),
    CONSTRAINT fk_gamerules_rule FOREIGN KEY (ruleid) REFERENCES rules (idrules),
    CONSTRAINT fk_gamerules_game FOREIGN KEY (gameid) REFERENCES games (idgames) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gamecards (
    idgamecards BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cardid SMALLINT UNSIGNED NOT NULL,
    gameid BIGINT UNSIGNED NOT NULL,
    usercardid BIGINT UNSIGNED NOT NULL DEFAULT 0,
    userid BIGINT UNSIGNED NOT NULL,
    captured BIGINT UNSIGNED NOT NULL,
    position SMALLINT NOT NULL,
    PRIMARY KEY (idgamecards),
    KEY idx_gamecards_game_position (gameid, position),
    CONSTRAINT fk_gamecards_card FOREIGN KEY (cardid) REFERENCES cards (idcards),
    CONSTRAINT fk_gamecards_game FOREIGN KEY (gameid) REFERENCES games (idgames) ON DELETE CASCADE,
    CONSTRAINT fk_gamecards_user FOREIGN KEY (userid) REFERENCES users (idusers) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gamehistory (
    idgamehistory BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    gameid BIGINT UNSIGNED NOT NULL,
    userid BIGINT UNSIGNED NOT NULL,
    completed DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    p1score TINYINT UNSIGNED NOT NULL,
    p2score TINYINT UNSIGNED NOT NULL,
    log_path VARCHAR(180) NOT NULL,
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    tutorial_slug VARCHAR(64) NULL,
    PRIMARY KEY (idgamehistory),
    UNIQUE KEY uq_gamehistory_game (gameid),
    KEY idx_gamehistory_user_date (userid, completed),
    KEY idx_gamehistory_recent (completed),
    CONSTRAINT fk_gamehistory_user FOREIGN KEY (userid) REFERENCES users (idusers) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shopitems (
    idshopitems SMALLINT UNSIGNED NOT NULL,
    item_type VARCHAR(16) NOT NULL,
    name VARCHAR(80) NOT NULL,
    price INT UNSIGNED NOT NULL,
    catalog_value VARCHAR(64) NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (idshopitems),
    KEY idx_shopitems_type_active (item_type, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchases (
    orderid VARCHAR(96) NOT NULL,
    userid BIGINT UNSIGNED NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(16) NOT NULL,
    itemid SMALLINT UNSIGNED NOT NULL,
    price INT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL,
    result_json TEXT NULL,
    PRIMARY KEY (orderid),
    KEY idx_purchases_user_date (userid, date),
    CONSTRAINT fk_purchases_user FOREIGN KEY (userid) REFERENCES users (idusers) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feedback_reports (
    idfeedback BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    userid BIGINT UNSIGNED NOT NULL,
    gameid BIGINT UNSIGNED NULL,
    report_type VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idfeedback),
    KEY idx_feedback_user_date (userid, created_at),
    CONSTRAINT fk_feedback_user FOREIGN KEY (userid) REFERENCES users (idusers) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (version) VALUES ('2026.07.21-turnless-2');
