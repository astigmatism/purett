'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../..');
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const context = {
    console,
    JSON,
    Number,
    Error,
    window: {},
    document: {},
    gh: {}
  };
  vm.runInNewContext(
    fs.readFileSync(
      path.join(
        root,
        'public/js/plugins/gh.graphics.js'
      ),
      'utf8'
    ),
    context,
    {filename: 'gh.graphics.js'}
  );

  const graphics = Object.create(
    context.gh.graphics.prototype
  );
  let rendered = 0;
  let statusUpdates = 0;
  graphics.matchHandEntranceSequence = 0;
  graphics.matchHandEntrance = null;
  graphics.lastGameCoverSettlement = null;
  graphics.gameCoverPresentation = {
    sequence: 7,
    target: 'open'
  };
  graphics.activeMatchVisible = true;
  graphics.lobbyVisible = false;
  graphics.effectiveMode = 'modern';
  graphics.surfaceKind = 'active-match';
  graphics.studioOpen = false;
  graphics.surface = {
    getDebugState() {
      return {ready: true};
    }
  };
  graphics.renderCurrentSurface = () => {
    rendered += 1;
  };
  graphics.updateModernStatus = () => {
    statusUpdates += 1;
  };
  graphics.disposeSurface = () => {
    throw new Error(
      'valid settlement disposed the surface'
    );
  };
  graphics.activateLegacy = () => {
    throw new Error(
      'valid settlement activated Legacy'
    );
  };

  graphics.armMatchHandEntrance();
  assert(
    graphics.matchHandEntrance.sequence === 1 &&
      graphics.matchHandEntrance.state ===
        'stacked' &&
      graphics.matchHandEntrance
        .startedAtMs === null &&
      graphics.matchHandEntrance
        .coverSequence === null,
    'a new unsettled match did not arm one stack'
  );

  const accepted =
    graphics.handleGameCoverSettlement({
      schemaVersion: 1,
      sequence: 7,
      target: 'open',
      completedAtMs: 1200.5
    });
  assert(
    accepted === true &&
      graphics.matchHandEntrance.state ===
        'fanning' &&
      graphics.matchHandEntrance
        .startedAtMs === 1200.5 &&
      graphics.matchHandEntrance
        .coverSequence === 7 &&
      rendered === 1 &&
      statusUpdates === 1,
    'a ready Modern match did not accept one fan'
  );
  assert(
    graphics.handleGameCoverSettlement({
      schemaVersion: 1,
      sequence: 7,
      target: 'open',
      completedAtMs: 1201
    }) === false &&
      rendered === 1,
    'a duplicate cover settlement replayed the fan'
  );

  graphics.gameCoverPresentation = {
    sequence: 8,
    target: 'open'
  };
  graphics.surface = {
    getDebugState() {
      return {ready: false};
    }
  };
  graphics.armMatchHandEntrance();
  assert(
    graphics.matchHandEntrance.sequence === 2 &&
      graphics.matchHandEntrance.state ===
        'stacked',
    'a newer unsettled cover did not arm a fresh stack'
  );
  assert(
    graphics.handleGameCoverSettlement({
      schemaVersion: 1,
      sequence: 8,
      target: 'open',
      completedAtMs: 2200
    }) === true &&
      graphics.matchHandEntrance.state ===
        'settled' &&
      graphics.matchHandEntrance
        .startedAtMs === 2200,
    'an incomplete Modern presentation did not fail to canonical settlement'
  );

  graphics.armMatchHandEntrance();
  assert(
    graphics.matchHandEntrance.sequence === 3 &&
      graphics.matchHandEntrance.state ===
        'settled' &&
      graphics.matchHandEntrance
        .coverSequence === 8 &&
      graphics.matchHandEntrance
        .startedAtMs === 2200,
    'activation after the current cover settlement armed a permanent pile'
  );

  const beforeStale = JSON.stringify(
    graphics.matchHandEntrance
  );
  assert(
    graphics.handleGameCoverSettlement({
      schemaVersion: 1,
      sequence: 7,
      target: 'open',
      completedAtMs: 2300
    }) === false &&
      JSON.stringify(
        graphics.matchHandEntrance
      ) === beforeStale,
    'a stale cover sequence changed the current entrance'
  );

  const preservedHands = {
    player: [{handIndex: 0}],
    opponent: [{handIndex: 0}]
  };
  graphics.releaseStartupModernGate = () => {};
  graphics.lobbyVisible = true;
  graphics.lobbyCards = [{}];
  graphics.activeMatchVisible = true;
  graphics.matchHands = preservedHands;
  graphics.matchDropZones = [{slotIndex: 0}];
  graphics.matchTurnIndicator = {sequence: 1};
  graphics.cancelLobbyPreview = () => {};
  let matchReadyResets = 0;
  graphics.game = {
    setModernMatchReady() {
      matchReadyResets += 1;
    }
  };
  graphics.modernGraphics = null;
  graphics.hideLobbyHand();
  assert(
    graphics.lobbyVisible === false &&
      graphics.matchHands ===
        preservedHands &&
      graphics.matchHandEntrance.state ===
        'settled' &&
      graphics.matchDropZones.length === 1 &&
      graphics.matchTurnIndicator.sequence === 1 &&
      matchReadyResets === 1,
    'lobby teardown erased an already-active match entrance or presentation'
  );

  console.log(
    'match-hand entrance bridge contract passed ' +
    `(${assertions} assertions)`
  );
} catch (error) {
  console.error(
    'match-hand entrance bridge contract failed: ' +
    error.message
  );
  process.exitCode = 1;
}
