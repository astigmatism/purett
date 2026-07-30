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

function fakeRaphaelElement(
  x,
  y,
  width,
  height
) {
  return {
    values: {
      x,
      y,
      width,
      height,
      rotation: 0
    },
    animations: [],
    stopCalls: 0,
    attr(name) {
      if (typeof name === 'string') {
        return this.values[name];
      }
      Object.assign(this.values, name);
      return this;
    },
    animate(
      attributes,
      duration,
      easing,
      callback
    ) {
      if (attributes.translation) {
        this.values.x +=
          attributes.translation[0];
        this.values.y +=
          attributes.translation[1];
      }
      if (
        typeof attributes.rotation !==
          'undefined'
      ) {
        this.values.rotation =
          attributes.rotation;
      }
      this.animations.push({
        attributes,
        duration,
        easing,
        callback
      });
      return this;
    },
    stop() {
      this.stopCalls += 1;
      return this;
    },
    finishLatest() {
      const animation =
        this.animations[
          this.animations.length - 1
        ];
      if (
        animation &&
        typeof animation.callback ===
          'function'
      ) {
        animation.callback.call(this);
      }
    }
  };
}

try {
  const presentations = [];
  const dom = {
    hidden: false,
    shown: true,
    modernReady: false,
    appended: []
  };
  const legacyCanvasNode = {
    attributes: {},
    style: {
      visibility: ''
    },
    getAttribute(name) {
      return Object.prototype
        .hasOwnProperty.call(
          this.attributes,
          name
        )
        ? this.attributes[name]
        : null;
    },
    setAttribute(name, value) {
      this.attributes[name] =
        String(value);
    }
  };
  const modernHostNode = {
    attributes: {},
    getAttribute:
      legacyCanvasNode.getAttribute,
    setAttribute:
      legacyCanvasNode.setAttribute
  };
  const documentObject = {
    getElementById(id) {
      return id === 'modernGameCover'
        ? modernHostNode
        : null;
    }
  };

  function jquery(target) {
    return {
      ready(callback) {
        callback();
        return this;
      },
      append(markup) {
        dom.appended.push(markup);
        return this;
      },
      addClass() {
        return this;
      },
      hide() {
        dom.hidden = true;
        dom.shown = false;
        return this;
      },
      show() {
        dom.hidden = false;
        dom.shown = true;
        return this;
      },
      toggleClass(
        className,
        enabled
      ) {
        if (
          className ===
            'graphics-modern-cover-ready'
        ) {
          dom.modernReady =
            enabled === true;
        }
        return this;
      }
    };
  }

  const canvas = {
    canvas: legacyCanvasNode,
    elements: [],
    image(
      textureUrl,
      x,
      y,
      width,
      height
    ) {
      const element =
        fakeRaphaelElement(
          x,
          y,
          width,
          height
        );
      element.textureUrl = textureUrl;
      this.elements.push(element);
      return element;
    }
  };
  function Raphael(
    target,
    width,
    height
  ) {
    assert(
      target === 'game-cover' &&
        width === 755 &&
        height === 562,
      'Legacy cover paper geometry changed'
    );
    return canvas;
  }

  const context = {
    console,
    document: documentObject,
    window: {
      performance: {
        now() {
          return 1234.5;
        }
      }
    },
    Math: Object.create(Math),
    Date,
    JSON,
    $: jquery,
    Raphael,
    gh: {
      defined(value, type) {
        return typeof value === type;
      }
    }
  };
  context.Math.random = () => 0.75;
  vm.runInNewContext(
    fs.readFileSync(
      path.join(
        root,
        'public/js/plugins/gh.cover.js'
      ),
      'utf8'
    ),
    context,
    {filename: 'gh.cover.js'}
  );

  const cover = new context.gh.cover({});
  cover.setGraphicsCoordinator({
    updateGameCover(presentation) {
      presentations.push(presentation);
    }
  });

  assert(
    dom.appended.some(markup =>
      markup.includes(
        'id="modernGameCover"'
      )
    ),
    'Modern cover host was not appended'
  );
  assert(
    canvas.elements.length === 2,
    'Legacy cover no longer owns exactly two Raphael images'
  );
  assert(
    legacyCanvasNode.getAttribute(
      'id'
    ) === 'legacyGameCover' &&
      legacyCanvasNode.getAttribute(
        'class'
      ) ===
        'legacy-game-cover-canvas' &&
      legacyCanvasNode.getAttribute(
        'data-cover-renderer'
      ) === 'legacy' &&
      legacyCanvasNode.getAttribute(
        'data-cover-renderer-active'
      ) === 'true' &&
      legacyCanvasNode.getAttribute(
        'aria-hidden'
      ) === 'false',
    'the Raphael root lacks its native Legacy renderer identity'
  );
  assert(
    canvas.elements[0].textureUrl ===
      '/images/left.png' &&
      canvas.elements[0].values.x === 0 &&
      canvas.elements[0].values.width ===
        377 &&
      canvas.elements[1].textureUrl ===
        '/images/right.png' &&
      canvas.elements[1].values.x === 376 &&
      canvas.elements[1].values.width ===
        378,
    'Legacy cover art or one-pixel overlap changed'
  );
  assert(
    presentations.length === 1 &&
      presentations[0].sequence === 0 &&
      presentations[0].target ===
        'closed' &&
      presentations[0].startedAtMs ===
        null,
    'initial closed presentation was not published'
  );
  assert(
    Object.keys(
      presentations[0]
    ).sort().join(',') ===
      [
        'durationMs',
        'easing',
        'frame',
        'panels',
        'schemaVersion',
        'sequence',
        'startedAtMs',
        'target'
      ].sort().join(',') &&
      presentations[0].panels.every(
        panel => (
          Object.keys(
            panel
          ).sort().join(',') ===
          [
            'hinge',
            'id',
            'rect',
            'rotationSign',
            'textureUrl'
          ].sort().join(',')
        )
      ),
    'cover descriptor shape is not exact plain presentation data'
  );

  let openCallbacks = 0;
  cover.open(() => {
    openCallbacks += 1;
  });
  assert(
    openCallbacks === 1,
    'open callback stopped being synchronous'
  );
  assert(
    cover.isopen === true &&
      presentations.length === 2 &&
      presentations[1].sequence === 1 &&
      presentations[1].target ===
        'open' &&
      presentations[1].durationMs ===
        2000 &&
      presentations[1].easing ===
        'cubic-in',
    'open target was not mirrored before motion'
  );
  assert(
    canvas.elements[0]
      .animations[0].duration === 2000 &&
      canvas.elements[0]
        .animations[0].easing === '<' &&
      canvas.elements[0]
        .animations[0].attributes
        .translation[0] === -450 &&
      canvas.elements[1]
        .animations[0].attributes
        .translation[0] === 450,
    'Legacy opening animation changed'
  );
  assert(
    JSON.stringify(
      presentations[1]
    ).indexOf('callback') === -1,
    'a callback crossed the presentation bridge'
  );

  canvas.elements[0].finishLatest();
  assert(
    dom.hidden === true,
    'Legacy left completion no longer hides the cover shell'
  );

  let closeCallbacks = 0;
  cover.close(() => {
    closeCallbacks += 1;
  });
  assert(
    closeCallbacks === 0,
    'close callback fired before Legacy settlement'
  );
  assert(
    cover.isopen === false &&
      presentations.length === 3 &&
      presentations[2].sequence === 2 &&
      presentations[2].target ===
        'closed' &&
      presentations[2].durationMs ===
        2000 &&
      presentations[2].easing ===
        'cubic-out',
    'close target was not mirrored before motion'
  );
  assert(
    canvas.elements[0].stopCalls === 1 &&
      canvas.elements[1].stopCalls ===
        1 &&
      canvas.elements[0]
        .animations[1].easing === '>' &&
      canvas.elements[0]
        .animations[1].duration ===
        2000,
    'Legacy close interruption and timing changed'
  );
  canvas.elements[0].finishLatest();
  assert(
    closeCallbacks === 1,
    'Legacy close completion did not own its callback'
  );

  cover.close(() => {
    closeCallbacks += 1;
  });
  assert(
    closeCallbacks === 2 &&
      presentations.length === 3,
    'duplicate close did not remain synchronous and inert'
  );

  cover.setModernCoverReady(true);
  assert(
    dom.modernReady === true &&
      legacyCanvasNode.style
        .visibility === 'hidden' &&
      legacyCanvasNode.getAttribute(
        'aria-hidden'
      ) === 'true' &&
      legacyCanvasNode.getAttribute(
        'data-cover-renderer-active'
      ) === 'false' &&
      modernHostNode.getAttribute(
        'data-cover-renderer-active'
      ) === 'true',
    'Modern-ready visual gate did not exclusively hide the Legacy paper'
  );
  cover.setModernCoverReady(false);
  assert(
    dom.modernReady === false &&
      legacyCanvasNode.style
        .visibility === '' &&
      legacyCanvasNode.getAttribute(
        'aria-hidden'
      ) === 'false' &&
      legacyCanvasNode.getAttribute(
        'data-cover-renderer-active'
      ) === 'true' &&
      modernHostNode.getAttribute(
        'data-cover-renderer-active'
      ) === 'false',
    'Legacy cover was not restored exclusively'
  );

  let isolatedFailures = 0;
  let isolatedOpenCallbacks = 0;
  cover.setGraphicsCoordinator({
    updateGameCover() {
      throw new Error(
        'simulated Modern cover failure'
      );
    },
    handleGameCoverFailure() {
      isolatedFailures += 1;
      throw new Error(
        'simulated fallback reporting failure'
      );
    }
  });
  cover.open(() => {
    isolatedOpenCallbacks += 1;
  });
  assert(
    cover.isopen === true &&
      isolatedOpenCallbacks === 1 &&
      isolatedFailures === 2,
    'a synchronous Modern bridge failure interrupted the Legacy open contract'
  );

  console.log(
    `game-box cover bridge contract passed (${assertions} assertions)`
  );
} catch (error) {
  console.error(
    `game-box cover bridge contract failed: ${error.message}`
  );
  process.exitCode = 1;
}
