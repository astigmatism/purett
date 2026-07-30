import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  GAME_BOX_COVER_CACHE_IDENTITY,
  GAME_BOX_COVER_DOORS,
  GAME_BOX_COVER_MOTION_DEFAULTS,
  GAME_BOX_COVER_MOTION_SCHEMA_VERSION,
  GAME_BOX_COVER_STAGE,
  createGameBoxCoverMotionPlan,
  sampleGameBoxCoverMotion
} from '../../frontend/src/game-box-cover-motion.js';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function near(actual, expected, epsilon, message) {
  assert(
    Math.abs(actual - expected) <= epsilon,
    `${message}: expected ${expected}, received ${actual}`
  );
}

function expectThrow(callback, message) {
  let threw = false;
  try {
    callback();
  } catch (error) {
    threw = true;
  }
  assert(threw, message);
}

try {
  assert(
    GAME_BOX_COVER_MOTION_SCHEMA_VERSION === 1,
    'cover motion schema version changed'
  );
  assert(
    GAME_BOX_COVER_CACHE_IDENTITY ===
      '0.185.1-game-cover-hinge.1',
    'cover delivery cache identity changed'
  );
  assert(
    GAME_BOX_COVER_STAGE.width === 755 &&
      GAME_BOX_COVER_STAGE.height === 562,
    'cover stage no longer matches Legacy'
  );
  assert(
    GAME_BOX_COVER_DOORS.left.width === 377 &&
      GAME_BOX_COVER_DOORS.right.x === 376 &&
      GAME_BOX_COVER_DOORS.right.width === 378,
    'cover doors no longer retain the one-pixel Legacy overlap'
  );
  assert(
    GAME_BOX_COVER_DOORS.left.hingeX === 0 &&
      GAME_BOX_COVER_DOORS.right.hingeX === 754,
    'cover hinges are not fixed to the two outside edges'
  );
  assert(
    GAME_BOX_COVER_DOORS.left.textureUrl ===
      '/images/left.png' &&
      GAME_BOX_COVER_DOORS.right.textureUrl ===
        '/images/right.png',
    'cover texture allowlist changed'
  );
  assert(
    GAME_BOX_COVER_MOTION_DEFAULTS
      .openAngleDegrees === 112,
    'cover open angle changed from the approved 112 degrees'
  );

  const opening =
    createGameBoxCoverMotionPlan({
      fromOpenness: 0,
      toOpenness: 1
    });
  const closing =
    createGameBoxCoverMotionPlan({
      fromOpenness: 1,
      toOpenness: 0
    });
  assert(
    opening.direction === 'open' &&
      closing.direction === 'close',
    'motion directions were not classified'
  );
  assert(
    opening.durationMs ===
      GAME_BOX_COVER_MOTION_DEFAULTS
        .durationMs &&
      closing.durationMs === opening.durationMs,
    'full open and close durations disagree'
  );
  assert(
    opening.durationMs === 2000 &&
      opening.easing === 'cubic-in' &&
      closing.easing === 'cubic-out',
    'cover timing no longer mirrors the Legacy clock'
  );
  assert(
    Object.isFrozen(opening) &&
      Object.isFrozen(closing),
    'cover motion plans are mutable'
  );
  [
    {
      elapsedMs: 0,
      raw: 0,
      opening: 0,
      closing: 1
    },
    {
      elapsedMs: 500,
      raw: 0.25,
      opening: 0.015625,
      closing: 0.421875
    },
    {
      elapsedMs: 1000,
      raw: 0.5,
      opening: 0.125,
      closing: 0.125
    },
    {
      elapsedMs: 1500,
      raw: 0.75,
      opening: 0.421875,
      closing: 0.015625
    },
    {
      elapsedMs: 2000,
      raw: 1,
      opening: 1,
      closing: 0
    }
  ].forEach((sample) => {
    const openSample =
      sampleGameBoxCoverMotion(
        opening,
        sample.elapsedMs
      );
    const closeSample =
      sampleGameBoxCoverMotion(
        closing,
        sample.elapsedMs
      );
    near(
      openSample.progress,
      sample.raw,
      1e-12,
      `opening raw progress at ${sample.elapsedMs} ms`
    );
    near(
      openSample.openness,
      sample.opening,
      1e-12,
      `opening cubic-in sample at ${sample.elapsedMs} ms`
    );
    near(
      closeSample.openness,
      sample.closing,
      1e-12,
      `closing cubic-out sample at ${sample.elapsedMs} ms`
    );
  });

  const closed =
    sampleGameBoxCoverMotion(opening, 0);
  near(closed.openness, 0, 1e-12,
    'closed openness');
  near(closed.left.rotationY, 0, 1e-12,
    'closed left rotation');
  near(closed.right.rotationY, 0, 1e-12,
    'closed right rotation');
  near(
    closed.left.projectedInnerEdgeX,
    377,
    1e-12,
    'closed left seam'
  );
  near(
    closed.right.projectedInnerEdgeX,
    376,
    1e-12,
    'closed right seam'
  );

  const midpoint =
    sampleGameBoxCoverMotion(
      opening,
      opening.durationMs / 2
    );
  near(midpoint.progress, 0.5, 1e-12,
    'midpoint progress');
  near(midpoint.easedProgress, 0.125, 1e-12,
    'midpoint easing');
  near(midpoint.openness, 0.125, 1e-12,
    'midpoint openness');
  assert(
    midpoint.left.rotationY < 0 &&
      midpoint.right.rotationY > 0,
    'door rotations do not mirror around the outside hinges'
  );
  assert(
    midpoint.left.innerEdgeDepth > 80 &&
      midpoint.right.innerEdgeDepth > 80,
    'door inner edges do not travel visibly toward the camera'
  );

  const opened =
    sampleGameBoxCoverMotion(
      opening,
      opening.durationMs
    );
  assert(
    opened.complete &&
      opened.phase === 'complete' &&
      opened.openness === 1,
    'opening does not end at its exact endpoint'
  );
  assert(
    Object.isFrozen(opened) &&
      Object.isFrozen(opened.left) &&
      Object.isFrozen(opened.right),
    'sampled cover poses are mutable'
  );
  near(
    Math.abs(opened.left.rotationY),
    112 * (Math.PI / 180),
    1e-12,
    'left 112-degree endpoint'
  );
  assert(
    opened.left.projectedInnerEdgeX < 0 &&
      opened.right.projectedInnerEdgeX >
        GAME_BOX_COVER_STAGE.width,
    'open inner edges do not pass outside the viewport'
  );
  assert(
    opened.left.innerEdgeDepth > 0 &&
      opened.right.innerEdgeDepth > 0,
    'open doors did not travel forward'
  );

  const closedAgain =
    sampleGameBoxCoverMotion(
      closing,
      closing.durationMs
    );
  near(closedAgain.openness, 0, 1e-12,
    'close endpoint openness');
  near(closedAgain.left.rotationY, 0, 1e-12,
    'close endpoint left rotation');
  near(closedAgain.right.rotationY, 0, 1e-12,
    'close endpoint right rotation');

  let previousOpen = -1;
  let previousClose = 2;
  for (let index = 0; index <= 1000; index += 1) {
    const elapsed =
      (opening.durationMs * index) / 1000;
    const openPose =
      sampleGameBoxCoverMotion(
        opening,
        elapsed
      );
    const closePose =
      sampleGameBoxCoverMotion(
        closing,
        elapsed
      );
    assert(
      openPose.openness >= previousOpen,
      `opening regressed at sample ${index}`
    );
    assert(
      closePose.openness <= previousClose,
      `closing advanced at sample ${index}`
    );
    near(
      openPose.left.rotationY,
      -openPose.right.rotationY,
      1e-12,
      `rotation mirror ${index}`
    );
    assert(
      Number.isFinite(
        openPose.left.innerEdgeDepth
      ) &&
        Number.isFinite(
          openPose.right.innerEdgeDepth
        ),
      `non-finite depth at sample ${index}`
    );
    previousOpen = openPose.openness;
    previousClose = closePose.openness;
  }

  const interruptedSource =
    sampleGameBoxCoverMotion(
      opening,
      opening.durationMs * 0.37
    );
  const interruptedClose =
    createGameBoxCoverMotionPlan({
      fromOpenness:
        interruptedSource.openness,
      toOpenness: 0
    });
  const interruptedFirst =
    sampleGameBoxCoverMotion(
      interruptedClose,
      0
    );
  near(
    interruptedFirst.openness,
    interruptedSource.openness,
    1e-12,
    'interrupted reversal jumped'
  );
  assert(
    interruptedClose.durationMs ===
      closing.durationMs,
    'interrupted projection no longer follows the authoritative Legacy clock'
  );
  const delayedInterruptedPose =
    sampleGameBoxCoverMotion(
      interruptedClose,
      400
    );
  assert(
    delayedInterruptedPose.openness <
      interruptedFirst.openness &&
      delayedInterruptedPose.openness >
        0,
    'a delayed reversal did not continue from the exact interruption pose'
  );
  const closingInterruption =
    sampleGameBoxCoverMotion(
      closing,
      closing.durationMs * 0.37
    );
  const interruptedOpen =
    createGameBoxCoverMotionPlan({
      fromOpenness:
        closingInterruption.openness,
      toOpenness: 1
    });
  near(
    sampleGameBoxCoverMotion(
      interruptedOpen,
      0
    ).openness,
    closingInterruption.openness,
    1e-12,
    'close-to-open reversal jumped'
  );

  const settled =
    createGameBoxCoverMotionPlan({
      fromOpenness: 1,
      toOpenness: 1
    });
  assert(
    settled.direction === 'settled' &&
      settled.durationMs === 0,
    'settled plan owns an animation duration'
  );
  assert(
    sampleGameBoxCoverMotion(
      settled,
      0
    ).complete,
    'settled plan did not complete synchronously'
  );

  expectThrow(
    () => createGameBoxCoverMotionPlan({
      fromOpenness: -0.01,
      toOpenness: 1
    }),
    'negative openness was accepted'
  );
  expectThrow(
    () => createGameBoxCoverMotionPlan({
      fromOpenness: 0,
      toOpenness: 1.01
    }),
    'openness above one was accepted'
  );
  expectThrow(
    () => createGameBoxCoverMotionPlan({
      fromOpenness: Number.NaN,
      toOpenness: 1
    }),
    'non-finite openness was accepted'
  );
  expectThrow(
    () => sampleGameBoxCoverMotion(
      opening,
      -1
    ),
    'negative elapsed time was accepted'
  );
  expectThrow(
    () => sampleGameBoxCoverMotion(
      {},
      0
    ),
    'foreign plan was accepted'
  );

  const source = fs.readFileSync(
    path.join(
      root,
      'frontend/src/game-box-cover-motion.js'
    ),
    'utf8'
  );
  assert(
    !/\b(?:window|document|HTMLElement|WebGLRenderer|from ['"]three['"])\b/
      .test(source),
    'cover motion recipe depends on DOM or Three.js'
  );
  assert(
    !/Math\.random|Date\.now|performance\./
      .test(source),
    'cover motion recipe is nondeterministic'
  );

  console.log(
    `game-box cover motion contract passed (${assertions} assertions)`
  );
} catch (error) {
  console.error(
    `game-box cover motion contract failed: ${error.message}`
  );
  process.exitCode = 1;
}
