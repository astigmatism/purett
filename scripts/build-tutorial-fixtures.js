#!/usr/bin/env node
'use strict';

// Development-only exporter. It reads the four designated archival tutorial
// logs and emits identity-free fixtures. The standalone runtime uses only the
// generated files under database/tutorials and never reads historical logs.

var fs = require('fs');
var path = require('path');
var root = path.resolve(__dirname, '..');
var sourceRoot = path.join(root, 'data', 'logs', 'gamehistory', '2');
var outputRoot = path.join(root, 'database', 'tutorials');
var tutorialIds = [1, 2, 4, 5];

var fields = {
    gameId: 'oiuwqnlaskjodwksjdlappw',
    playerId: 'bdjiauhjhduqijshckjhaii',
    playerHand: 'mnzbxcnbmncbzmxnbcmnbzxmnb',
    opponentHand: 'kjhsadjhkaskjhdkjhasjhdasd',
    board: 'uyeiqowiutoiqyweiuyqwoiyro',
    turnToken: 'iiiooioooiooioioiiiiioioioooi',
    gameCardId: 'jjkaooijslakjdiwjkalsjkkk',
    userCardId: 'yoiasdknqowkjndlansihjwsd',
    owner: 'ffjklaksjidlkmjaiwnnmnalk',
    captured: 'llkjasdoiuqwoiquweiiwiuie'
};

function parseLines(filename) {
    return fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean).map(function (line) {
        var json = line.replace(/^.*INFO\s+\(6\):\s+/i, '');
        return JSON.parse(json);
    });
}

function localOwner(value) {
    return String(value) === '1' ? 1 : 2;
}

function sanitizeTree(value, archivalPlayerId, gameCardMap, userCardMap) {
    if (Array.isArray(value)) {
        return value.map(function (item) {
            return sanitizeTree(item, archivalPlayerId, gameCardMap, userCardMap);
        });
    }
    if (!value || typeof value !== 'object') {
        return value;
    }

    Object.keys(value).forEach(function (key) {
        if (key === fields.gameCardId || key === 'x') {
            if (Object.prototype.hasOwnProperty.call(gameCardMap, String(value[key]))) {
                value[key] = gameCardMap[String(value[key])];
            }
        } else if (key === fields.userCardId) {
            value[key] = Object.prototype.hasOwnProperty.call(userCardMap, String(value[key]))
                ? userCardMap[String(value[key])]
                : 0;
        } else if (key === fields.owner || key === fields.captured || key === 'u') {
            value[key] = localOwner(value[key]);
        } else {
            value[key] = sanitizeTree(value[key], archivalPlayerId, gameCardMap, userCardMap);
        }
    });
    return value;
}

function collectArchivalIdentityValues(value, output) {
    if (Array.isArray(value)) {
        value.forEach(function (item) { collectArchivalIdentityValues(item, output); });
        return;
    }
    if (!value || typeof value !== 'object') {
        return;
    }
    Object.keys(value).forEach(function (key) {
        if (key === fields.owner || key === fields.captured || key === 'u') {
            if (String(value[key]) !== '1') {
                output.push(value[key]);
            }
        } else {
            collectArchivalIdentityValues(value[key], output);
        }
    });
}

function validateIdentityFields(value, tutorialId) {
    if (Array.isArray(value)) {
        value.forEach(function (item) { validateIdentityFields(item, tutorialId); });
        return;
    }
    if (!value || typeof value !== 'object') {
        return;
    }
    Object.keys(value).forEach(function (key) {
        var current = value[key];
        if (key === fields.owner || key === fields.captured || key === 'u') {
            if (Number(current) !== 1 && Number(current) !== 2) {
                throw new Error('Unexpected owner identifier in tutorial ' + tutorialId + '.');
            }
        } else if (key === fields.gameCardId || key === 'x') {
            if (Number(current) < 1 || Number(current) > 10) {
                throw new Error('Unexpected game-card identifier in tutorial ' + tutorialId + '.');
            }
        } else if (key === fields.userCardId) {
            if (Number(current) < 0 || Number(current) > 5) {
                throw new Error('Unexpected user-card identifier in tutorial ' + tutorialId + '.');
            }
        } else {
            validateIdentityFields(current, tutorialId);
        }
    });
}

function buildTutorial(tutorialId) {
    var records = parseLines(path.join(sourceRoot, String(tutorialId) + '.txt'));
    if (!records.length) {
        throw new Error('Tutorial ' + tutorialId + ' has no source records.');
    }

    var setup = records[0];
    var archivalPlayerId = setup[fields.playerId];
    var removedValues = [setup[fields.gameId], archivalPlayerId, setup[fields.turnToken]];
    collectArchivalIdentityValues(records, removedValues);
    var gameCardMap = {};
    var userCardMap = {};
    var nextGameCard = 1;
    var nextUserCard = 1;

    [setup[fields.playerHand] || [], setup[fields.opponentHand] || []].forEach(function (hand, handIndex) {
        hand.forEach(function (card) {
            var oldGameCard = String(card[fields.gameCardId]);
            var oldUserCard = String(card[fields.userCardId]);
            gameCardMap[oldGameCard] = nextGameCard++;
            removedValues.push(oldGameCard);
            if (handIndex === 0) {
                userCardMap[oldUserCard] = nextUserCard++;
            } else {
                userCardMap[oldUserCard] = 0;
            }
            removedValues.push(oldUserCard);
        });
    });

    delete setup[fields.turnToken];
    setup[fields.gameId] = String(tutorialId);
    setup[fields.playerId] = '2';
    delete setup.ppqowifoqneocmoqiiowuoieiw;
    records = sanitizeTree(records, archivalPlayerId, gameCardMap, userCardMap);
    validateIdentityFields(records, tutorialId);

    var output = records.map(function (record) { return JSON.stringify(record); }).join('\n') + '\n';
    removedValues.filter(function (value) {
        return value !== undefined && value !== null && String(value).length >= 6;
    }).forEach(function (value) {
        if (output.indexOf(String(value)) !== -1) {
            throw new Error('A removed archival identifier remains in tutorial ' + tutorialId + '.');
        }
    });
    fs.writeFileSync(path.join(outputRoot, String(tutorialId) + '.jsonl'), output, {mode: 420});
}

if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, {recursive: true});
}
tutorialIds.forEach(buildTutorial);
process.stdout.write('Built four sanitized tutorial fixtures.\n');
