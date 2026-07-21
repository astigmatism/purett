SET NAMES utf8mb4;

-- Rule IDs are part of the legacy game protocol and must remain stable.
-- PHP game logs supply 12 descriptions; Open uses its exact archived MDF text.
INSERT INTO rules (idrules, name, description) VALUES
    (0, 'Closed', 'Players begin the game with their hands face down.'),
    (1, 'Open', 'All cards are face up.'),
    (2, 'Same', 'Captured if adjacent ranks are equal on 2 or more sides.'),
    (3, 'Plus', 'Captured if adjacent ranks sum up to the same value on 2 or more sides.'),
    (4, 'Combo', 'Cards captured by Same or Plus subsequently capture adjacent cards with the basic rule.'),
    (5, 'Same Wall', 'The edges of the board are counted as A ranks for the purposes of the Same rule.'),
    (6, 'Elemental', 'Elements are randomly placed on the board. If a played card matches the element, its ranks are increased by one. If not, they decrease by one.'),
    (7, 'Random', 'Both player''s start with a random selection of cards from their collections.'),
    (8, 'Sudden Death', 'In the case of a draw, the game begins again with each player using the cards they captured in the last round.'),
    (9, 'Take One', 'The winner selects one card from their opponent''s hand.'),
    (10, 'Take Direct', 'Player''s keep only the cards they''ve captured.'),
    (11, 'Take Difference', 'Subtract the losing score from the winning score; this is how many cards the winner will take from their opponent''s hand.'),
    (12, 'Take All', 'The winner takes all cards from their opponent''s hand.');

-- IDs and prices come from the legacy shop catalog. The additional grant fields
-- make fulfillment server-authoritative in the standalone implementation.
INSERT INTO shopitems (idshopitems, item_type, name, price, grant_amount, catalog_value, active) VALUES
    (1, 'color', 'Green Deck', 20, 0, 'green', 1),
    (2, 'color', 'Purple Deck', 20, 0, 'purple', 1),
    (3, 'color', 'Orange Deck', 20, 0, 'orange', 1),
    (4, 'color', 'Black Deck', 50, 0, 'black', 1),
    (5, 'color', 'White Deck', 50, 0, 'white', 1),
    (6, 'turn', '5 Turns', 1, 5, NULL, 1),
    (7, 'turn', '10 Turns', 2, 10, NULL, 1),
    (8, 'turn', '20 Turns', 4, 20, NULL, 1),
    (9, 'turn', '50 Turns', 8, 50, NULL, 1),
    (10, 'turn', '100 Turns', 15, 100, NULL, 1);

INSERT INTO options (idoptions, name) VALUES
    (1, 'color');
