'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../..');
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(message);
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function each(collection, callback) {
  if (!collection) return collection;
  if (typeof collection.length === 'number') {
    for (let index = 0; index < collection.length; index += 1) {
      callback.call(collection[index], index, collection[index]);
    }
  } else {
    for (const key of Object.keys(collection)) {
      callback.call(collection[key], key, collection[key]);
    }
  }
  return collection;
}

function jquery() {
  return {
    addClass() { return this; },
    click() { return this; },
    ready(callback) { callback(); return this; },
    removeClass() { return this; }
  };
}
jquery.cookie = () => false;
jquery.each = each;
jquery.inArray = (value, collection) => collection.indexOf(value);
jquery.merge = (first, second) => {
  for (const item of second) first.push(item);
  return first;
};

function loadAudioDefinition() {
  const source = read('public/js/plugins/gh.audio.js');
  const buzzLibraryMarker = source.indexOf('// ----------------------------------------------------------------------------');
  const context = {gh: {}, console};
  vm.runInNewContext(source.slice(0, buzzLibraryMarker), context, {filename: 'gh.audio.js'});
  return context;
}

function testAudioStartsOnce() {
  const context = loadAudioDefinition();
  const sounds = {};

  function FakeSound(source) {
    this.source = source;
    this.playCalls = 0;
    this.pauseCalls = 0;
    this.fadeTargets = [];
    sounds[source] = this;
  }
  FakeSound.prototype.load = function() { return this; };
  FakeSound.prototype.loop = function() { return this; };
  FakeSound.prototype.setVolume = function() { return this; };
  FakeSound.prototype.mute = function() { return this; };
  FakeSound.prototype.unmute = function() { return this; };
  FakeSound.prototype.bind = function() { return this; };
  FakeSound.prototype.unbind = function() { return this; };
  FakeSound.prototype.play = function() { this.playCalls += 1; return this; };
  FakeSound.prototype.pause = function() { this.pauseCalls += 1; return this; };
  FakeSound.prototype.fadeTo = function(target) {
    this.fadeTargets.push(target);
    return this.play();
  };
  FakeSound.prototype.fadeOut = function(duration, callback) {
    this.play();
    if (typeof callback === 'function') callback.call(this);
    return this;
  };

  context.document = {};
  context.$ = jquery;
  context.buzz = {
    sound: FakeSound,
    group: function() {
      return {mute() {}, unmute() {}};
    }
  };

  context.gh.audio.initialize();
  assert(sounds['/audio/main'].playCalls === 1, 'main-menu initialization started its track more than once');

  const outgoing = new FakeSound('outgoing');
  const incoming = new FakeSound('incoming');
  context.gh.audio.crossfade(outgoing, incoming);
  assert(incoming.playCalls === 1, 'crossfade started the incoming track more than once');
  assert(incoming.fadeTargets.length === 1 && incoming.fadeTargets[0] === 40, 'crossfade did not fade the incoming track to menu volume');
  assert(outgoing.pauseCalls === 1, 'crossfade did not pause the outgoing track');
}

function loadUiDefinitions() {
  const context = {
    $: jquery,
    console,
    gh: {
      data: {color: 'blue'},
      util: {
        hasProperty(object, property) {
          return Object.prototype.hasOwnProperty.call(object, property);
        }
      }
    },
    Math,
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {}
  };
  vm.runInNewContext(read('public/js/plugins/gh.game.js'), context, {filename: 'gh.game.js'});
  vm.runInNewContext(read('public/js/plugins/gh.endgame.js'), context, {filename: 'gh.endgame.js'});
  return context;
}

function testGameoverPassesProtectionOutcome(context) {
  const game = Object.create(context.gh.game.prototype);
  game.enableHand = function() {};
  game.enableBoard = function() {};
  game.p1 = 42;
  game.p2 = 1;
  game.gameid = 9001;
  game.scores = [{score: 4}, {score: 6}];
  game.p1h = [];
  for (let index = 0; index < 5; index += 1) {
    game.p1h.push({owner: 42, gameCardId: index + 1, purchased: 1});
  }
  game.p2h = [];
  game.pb = [];
  game.gameData = {};

  let result;
  game.onFinish = function(details) { result = details; };
  game.onGameover({
    claim: 0,
    taken: [],
    won: [],
    given: [],
    hand: [],
    deckcount: 0,
    nextrules: [],
    own: [],
    takeBlockedByProtection: true,
    coinsAwarded: 0,
    coins: 10
  });

  assert(result.takeBlockedByProtection === true, 'game-over bridge dropped the protected-take outcome');
  assert(result.victory === -1, 'protected-take fixture did not remain a loss');
  assert(result.p1h.length === 5, 'game-over bridge did not retain all five player cards');
}

function testProtectedTakeScreen(context) {
  const endgame = Object.create(context.gh.endgame.prototype);
  const titles = [];
  const imagePaths = [];
  let removedCards = 0;
  let completions = 0;

  function fakeCard() {
    return {
      node: {},
      attr() { return this; },
      animate(attributes, duration, easing, callback) {
        const done = typeof easing === 'function' ? easing : callback;
        if (typeof done === 'function') done.call(this);
        return this;
      },
      remove() { removedCards += 1; }
    };
  }

  endgame.canvas = {
    image(imagePath) {
      imagePaths.push(imagePath);
      return fakeCard();
    }
  };
  endgame.barset = function(title, callback) {
    titles.push(title);
    callback();
  };
  endgame.barclear = function(callback) { callback(); };

  const cards = [];
  for (let index = 0; index < 5; index += 1) {
    cards.push({gameCardId: index + 1, image: `pblue/card-${index + 1}`});
  }
  endgame.taken({
    taken: [],
    p1h: cards,
    takeBlockedByProtection: true
  }, function() {
    completions += 1;
  });

  assert(titles.length === 1, 'all-protected take was skipped instead of opening a result screen');
  assert(titles[0] === "YOUR OPPONENT CAN'T TAKE ANY CARDS - ALL FIVE ARE PROTECTED", 'protected-take message was incorrect');
  assert(imagePaths.length === 5, 'protected-take screen did not display all five cards');
  assert(imagePaths.every(imagePath => imagePath.indexOf('/images/cards/pblue/') === 0), 'protected-take screen did not use protected card art');
  assert(removedCards === 5, 'protected-take screen did not clear its five cards');
  assert(completions === 1, 'protected-take screen did not finish exactly once');

  endgame.taken({taken: [], p1h: cards, takeBlockedByProtection: false}, function() {
    completions += 1;
  });
  assert(titles.length === 1, 'ordinary empty take unexpectedly opened the protected result screen');
  assert(completions === 2, 'ordinary empty take did not finish exactly once');
}

try {
  testAudioStartsOnce();
  const context = loadUiDefinitions();
  testGameoverPassesProtectionOutcome(context);
  testProtectedTakeScreen(context);
  console.log(`ok - protected take and audio behavior (${assertions} assertions)`);
} catch (error) {
  console.error(`not ok - protected take and audio behavior: ${error.message}`);
  process.exitCode = 1;
}
