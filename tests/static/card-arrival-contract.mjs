import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  CARD_ARRIVAL_PROFILES,
  CASUAL_DROP_LEFT_PROFILE,
  createCardArrivalBatch,
  sampleCardArrival
} from '../../frontend/src/card-arrival-animations.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(
  directory,
  '../../frontend/src/card-arrival-animations.js'
);
const source = fs.readFileSync(sourcePath, 'utf8');
const logicalWidth = 755;
const logicalHeight = 562;
const cameraCenterX = logicalWidth / 2;
const cameraCenterY = logicalHeight / 2;
const cardFaceOffset = 1.7;
const lobbyCameraDistance =
  (logicalHeight / 2) / Math.tan((40 * Math.PI / 180) / 2);
const epsilon = 0.000001;
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function fixtureCards(yOffset = 0) {
  return [72, 197, 322, 447, 572].map((x, index) => ({
    index,
    userCardId: `user-card-${index}`,
    cardId: `card-${index}`,
    textureUrl: `/images/cards/blue/${index}.png`,
    width: 117,
    height: 146,
    viewportHeight: logicalHeight,
    perspectiveDistance: lobbyCameraDistance,
    destination: {
      x: x + (117 / 2),
      y: 286 + yOffset,
      z: -1.7
    }
  }));
}

function rotatePoint(point, pose) {
  const cosX = Math.cos(pose.rotationX);
  const sinX = Math.sin(pose.rotationX);
  const cosY = Math.cos(pose.rotationY);
  const sinY = Math.sin(pose.rotationY);
  const cosZ = Math.cos(pose.rotationZ);
  const sinZ = Math.sin(pose.rotationZ);
  // Three.js Euler XYZ composes Rx * Ry * Rz. pickupRoot has no local Z,
  // so a point is transformed through Y, then X; tiltRoot supplies the
  // outer Z rotation after that.
  const afterY = {
    x: (point.x * cosY) + (point.z * sinY),
    y: point.y,
    z: (-point.x * sinY) + (point.z * cosY)
  };
  const afterX = {
    x: afterY.x,
    y: (afterY.y * cosX) - (afterY.z * sinX),
    z: (afterY.y * sinX) + (afterY.z * cosX)
  };
  return {
    x: (afterX.x * cosZ) - (afterX.y * sinZ),
    y: (afterX.x * sinZ) + (afterX.y * cosZ),
    z: afterX.z
  };
}

function renderedFaceMetrics(plan, pose) {
  const halfWidth = plan.card.width / 2;
  const halfHeight = plan.card.height / 2;
  const worldCenterX =
    cameraCenterX +
    ((pose.screenX - cameraCenterX) *
      (lobbyCameraDistance - pose.depth) /
      lobbyCameraDistance);
  const worldCenterY =
    cameraCenterY +
    ((pose.screenY - cameraCenterY) *
      (lobbyCameraDistance - pose.depth) /
      lobbyCameraDistance);
  const shearX =
    -(pose.screenX - cameraCenterX) / lobbyCameraDistance;
  const shearY =
    -(pose.screenY - cameraCenterY) / lobbyCameraDistance;
  const localCorners = [
    {x: -halfWidth, y: -halfHeight, z: cardFaceOffset},
    {x: halfWidth, y: -halfHeight, z: cardFaceOffset},
    {x: halfWidth, y: halfHeight, z: cardFaceOffset},
    {x: -halfWidth, y: halfHeight, z: cardFaceOffset}
  ];
  let minimumWorldZ = Number.POSITIVE_INFINITY;
  let maximumPerspectiveScale = 1;
  const corners = localCorners.map((corner) => {
    const rotated = rotatePoint(corner, pose);
    const neutralized = {
      x:
        rotated.x +
        (shearX * rotated.z) -
        (shearX * cardFaceOffset),
      y:
        rotated.y +
        (shearY * rotated.z) -
        (shearY * cardFaceOffset)
    };
    const worldZ = plan.destination.z + pose.depth + rotated.z;
    const scale = lobbyCameraDistance / (
      lobbyCameraDistance - worldZ
    );
    minimumWorldZ = Math.min(minimumWorldZ, worldZ);
    maximumPerspectiveScale = Math.max(
      maximumPerspectiveScale,
      scale
    );
    return {
      x:
        cameraCenterX +
        ((worldCenterX - cameraCenterX + neutralized.x) * scale),
      y:
        cameraCenterY +
        -((worldCenterY - cameraCenterY + neutralized.y) * scale)
    };
  });

  function edgeLength(start, end) {
    return Math.hypot(end.x - start.x, end.y - start.y);
  }

  return {
    corners,
    minimumWorldZ,
    maximumPerspectiveScale,
    maximumWorldZ:
      plan.card.perspectiveDistance == null
        ? null
        : lobbyCameraDistance *
          (1 - (1 / maximumPerspectiveScale)),
    edgeLengths: [
      edgeLength(corners[0], corners[1]),
      edgeLength(corners[1], corners[2]),
      edgeLength(corners[2], corners[3]),
      edgeLength(corners[3], corners[0])
    ]
  };
}

function polygonsOverlap(left, right) {
  for (const polygon of [left, right]) {
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const axis = {
        x: -(end.y - start.y),
        y: end.x - start.x
      };
      const leftProjection = left.map(
        (point) => (point.x * axis.x) + (point.y * axis.y)
      );
      const rightProjection = right.map(
        (point) => (point.x * axis.x) + (point.y * axis.y)
      );
      if (
        Math.max(...leftProjection) <= Math.min(...rightProjection) + 0.01 ||
        Math.max(...rightProjection) <= Math.min(...leftProjection) + 0.01
      ) {
        return false;
      }
    }
  }
  return true;
}

function verifyDenseMotion(batch, seedLabel) {
  const placementSequence = batch.plans.slice(0).sort(
    (left, right) => left.orderIndex - right.orderIndex
  );
  assert(
    placementSequence.every((plan, index) => (
      index === 0 ||
      (
        plan.contactAtMs >
          placementSequence[index - 1].contactAtMs &&
        plan.settleAtMs >
          placementSequence[index - 1].settleAtMs
      )
    )),
    `${seedLabel} cards overtake the declared contact/settlement order`
  );
  const previousByPlan = new Map();
  const settledMetrics = new Map(batch.plans.map((plan) => [
    plan,
    renderedFaceMetrics(
      plan,
      sampleCardArrival(plan, plan.settleAtMs)
    )
  ]));

  for (let elapsed = 0; elapsed <= batch.totalDurationMs; elapsed += 4) {
    const poses = batch.plans.map(
      (plan) => sampleCardArrival(plan, elapsed)
    );

    batch.plans.forEach((plan, index) => {
      const pose = poses[index];
      const previous = previousByPlan.get(plan);
      const metrics = renderedFaceMetrics(plan, pose);
      const baseline = settledMetrics.get(plan);

      assert(
        metrics.minimumWorldZ >= -epsilon,
        `${seedLabel} card ${index} penetrates the table at ${elapsed}ms`
      );
      assert(
        metrics.maximumPerspectiveScale <= 1.1 + epsilon,
        `${seedLabel} card ${index} has a scale-in-like vertex at ${elapsed}ms`
      );
      assert(
        metrics.edgeLengths.every((edgeLength, edgeIndex) => (
          edgeLength <=
            (baseline.edgeLengths[edgeIndex] * 1.1) + epsilon
        )),
        `${seedLabel} card ${index} has an oversized rendered edge at ${elapsed}ms`
      );
      assert(
        Math.abs(
          pose.nearestVertexDepth - metrics.maximumWorldZ
        ) <= 0.00001,
        `${seedLabel} card ${index} reports the wrong nearest vertex depth`
      );
      assert(
        pose.screenX <= plan.destination.x + epsilon,
        `${seedLabel} card ${index} overshoots its destination`
      );

      if (previous && pose.phase === 'flight' &&
          previous.pose.phase === 'flight') {
        assert(
          pose.screenX + epsilon >= previous.pose.screenX,
          `${seedLabel} card ${index} reverses during flight`
        );
      }

      if (elapsed >= plan.contactAtMs && !pose.complete) {
        const errorX = plan.destination.x - pose.screenX;
        const errorY = plan.destination.y - pose.screenY;
        const distance = Math.hypot(
          errorX,
          errorY
        );
        if (previous && previous.afterContact) {
          assert(
            distance <= previous.distance + epsilon,
            `${seedLabel} card ${index} rebounds after contact`
          );
          assert(
            errorX * previous.errorX >= -epsilon &&
              errorY * previous.errorY >= -epsilon,
            `${seedLabel} card ${index} crosses its destination axis`
          );
          assert(
            pose.nearestVertexDepth <=
              previous.pose.nearestVertexDepth + epsilon,
            `${seedLabel} card ${index} rises again after contact`
          );
        }
        if (pose.phase === 'slap' && previous &&
            previous.pose.phase === 'slap') {
          assert(
            Math.abs(pose.rotationX) <=
              Math.abs(previous.pose.rotationX) + epsilon &&
            Math.abs(pose.rotationY) <=
              Math.abs(previous.pose.rotationY) + epsilon &&
            Math.abs(pose.rotationZ) <=
              Math.abs(previous.pose.rotationZ) + epsilon,
            `${seedLabel} card ${index} jiggles while flattening`
          );
          assert(
            pose.rotationX * plan.contact.rotationX >= -epsilon &&
              pose.rotationY * plan.contact.rotationY >= -epsilon &&
              pose.rotationZ * plan.contact.rotationZ >= -epsilon,
            `${seedLabel} card ${index} reverses rotation while flattening`
          );
        }
        previousByPlan.set(plan, {
          pose,
          afterContact: true,
          distance,
          errorX,
          errorY
        });
      } else {
        previousByPlan.set(plan, {
          pose,
          afterContact: false,
          distance: 0,
          errorX: 0,
          errorY: 0
        });
      }
    });

    for (let leftIndex = 0; leftIndex < batch.plans.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < batch.plans.length;
        rightIndex += 1
      ) {
        const leftPlan = batch.plans[leftIndex];
        const rightPlan = batch.plans[rightIndex];
        const leftPose = poses[leftIndex];
        const rightPose = poses[rightIndex];
        const bothReleased =
          elapsed > leftPlan.releaseAtMs &&
          elapsed > rightPlan.releaseAtMs;
        if (
          bothReleased &&
          (!leftPose.complete || !rightPose.complete)
        ) {
          assert(
            !polygonsOverlap(
              renderedFaceMetrics(leftPlan, leftPose).corners,
              renderedFaceMetrics(rightPlan, rightPose).corners
            ),
            `${seedLabel} cards ${leftIndex} and ${rightIndex} clip at ${elapsed}ms`
          );
        }
      }
    }
  }

  batch.plans.forEach((plan, index) => {
    const contact = sampleCardArrival(plan, plan.contactAtMs);
    const flat = sampleCardArrival(plan, plan.flatAtMs);
    const beforeSettlement = sampleCardArrival(
      plan,
      plan.settleAtMs - 16
    );
    const settled = sampleCardArrival(plan, plan.settleAtMs);
    assert(
      contact.phase === 'slap' &&
        Math.abs(renderedFaceMetrics(plan, contact).minimumWorldZ) <=
          0.00001 &&
        contact.tableClearance === 0,
      `${seedLabel} card ${index} does not make exact leading-edge contact`
    );
    assert(
      flat.phase === 'slide' &&
        Math.abs(flat.screenX - plan.slideStart.x) <= epsilon &&
        Math.abs(flat.screenY - plan.slideStart.y) <= epsilon &&
        flat.rotationX === 0 &&
        flat.rotationY === 0 &&
        flat.rotationZ === 0,
      `${seedLabel} card ${index} is discontinuous at slap/slide`
    );
    assert(
      Math.hypot(
        plan.destination.x - beforeSettlement.screenX,
        plan.destination.y - beforeSettlement.screenY
      ) < 0.01 &&
        beforeSettlement.depth === 0 &&
        beforeSettlement.rotationX === 0 &&
        beforeSettlement.rotationY === 0 &&
        beforeSettlement.rotationZ === 0,
      `${seedLabel} card ${index} snaps on its settlement frame`
    );
    assert(
      settled.complete &&
        settled.screenX === plan.destination.x &&
        settled.screenY === plan.destination.y,
      `${seedLabel} card ${index} misses exact settlement`
    );

    let previousPose = contact;
    let previousStepDistance = Number.POSITIVE_INFINITY;
    for (
      let postContactElapsed = 4;
      postContactElapsed < plan.postContactDurationMs;
      postContactElapsed += 4
    ) {
      const pose = sampleCardArrival(
        plan,
        plan.contactAtMs + postContactElapsed
      );
      const stepDistance = Math.hypot(
        pose.screenX - previousPose.screenX,
        pose.screenY - previousPose.screenY
      );
      assert(
        stepDistance <= previousStepDistance + epsilon,
        `${seedLabel} card ${index} accelerates again after contact`
      );
      previousStepDistance = stepDistance;
      previousPose = pose;
    }
  });
}

try {
  const request = {
    id: 'lobby-presentation-17',
    trigger: 'command-bar-reveal',
    profile: 'casual-drop-left',
    seed: 'repeatable-arrival-fixture'
  };
  const cards = fixtureCards();
  const first = createCardArrivalBatch(cards, request);
  const repeated = createCardArrivalBatch(cards, request);
  const changedSeed = createCardArrivalBatch(cards, {
    ...request,
    seed: 'a-different-arrival-fixture'
  });
  const alternateDestinations = createCardArrivalBatch(
    fixtureCards(84),
    request
  );

  assert(
    CASUAL_DROP_LEFT_PROFILE.name === 'casual-drop-left',
    'the reusable casual-left profile is missing'
  );
  assert(
    CARD_ARRIVAL_PROFILES['casual-drop-left'] ===
      CASUAL_DROP_LEFT_PROFILE,
    'the reusable profile registry does not resolve casual-drop-left'
  );
  assert(
    JSON.stringify(first) === JSON.stringify(repeated),
    'identical input does not reproduce the same arrival batch'
  );
  assert(
    first.placementOrder === 'farthest-first' &&
      first.collisionPolicy === 'spatial-order-and-release-separation',
    'the planner does not declare its non-crossing placement policy'
  );
  assert(
    first.totalDurationMs <= 1950 &&
      first.totalDurationMs <= first.maxBatchDurationMs,
    'the five-card arrival batch exceeds its bounded deadline'
  );
  assert(
    first.totalDurationMs === Math.max(
      ...first.plans.map((plan) => plan.totalDurationMs)
    ),
    'the batch duration does not bound every individual plan'
  );
  assert(
    JSON.stringify(first.plans.map((plan) => plan.orderIndex)) ===
      JSON.stringify([4, 3, 2, 1, 0]),
    'cards are not placed rightmost-to-leftmost'
  );
  assert(
    first.releaseTimes.every((release, index) => (
      index === 0 ||
      release - first.releaseTimes[index - 1] >= 275
    )),
    'release spacing is too short to keep projected cards separate'
  );
  assert(
    new Set(first.plans.map((plan) => plan.start.x)).size === 1 &&
      Math.max(...first.plans.map((plan) => plan.start.y)) -
        Math.min(...first.plans.map((plan) => plan.start.y)) <= 20,
    'cards do not leave one coherent off-screen hand position'
  );
  assert(
    first.plans.every((plan, index) => (
      plan.launchHalfExtent > (cards[index].width / 2) &&
      plan.start.x + plan.launchHalfExtent < 0
    )),
    'one or more transformed launch footprints are not off-screen left'
  );
  assert(
    first.plans.every((plan) => (
      Math.max(
        Math.abs(plan.start.rotationX),
        Math.abs(plan.start.rotationY)
      ) >= (11.99 * Math.PI / 180)
    )),
    'one or more cards leave the hand without a visible 3D edge'
  );
  assert(
    first.plans.some((plan, index) => (
      plan.start.y !== changedSeed.plans[index].start.y ||
      plan.path.bow !== changedSeed.plans[index].path.bow ||
      plan.start.rotationZ !== changedSeed.plans[index].start.rotationZ ||
      plan.delayMs !== changedSeed.plans[index].delayMs
    )),
    'changing the seed does not change transient choreography'
  );
  assert(
    first.plans.every((plan, index) => (
      plan.orderIndex === changedSeed.plans[index].orderIndex &&
      JSON.stringify(plan.destination) ===
        JSON.stringify(changedSeed.plans[index].destination)
    )),
    'changing the seed changes placement order or an exact destination'
  );
  assert(
    alternateDestinations.plans.every((plan, index) => (
      plan.destination.y === cards[index].destination.y + 84
    )),
    'the planner does not honor caller-supplied destinations'
  );

  first.plans.forEach((plan, index) => {
    const waiting = sampleCardArrival(plan, 0);
    const flight = sampleCardArrival(
      plan,
      plan.releaseAtMs + (plan.flightDurationMs * 0.5)
    );
    const slap = sampleCardArrival(
      plan,
      plan.contactAtMs + (plan.slapDurationMs * 0.5)
    );
    const slide = sampleCardArrival(
      plan,
      plan.flatAtMs + (plan.slideDurationMs * 0.5)
    );
    const settled = sampleCardArrival(plan, plan.settleAtMs);
    const remainsSettled = sampleCardArrival(plan, plan.settleAtMs + 500);

    assert(
      waiting.phase === 'waiting' &&
        waiting.screenX === plan.start.x &&
        waiting.depth === plan.start.depth,
      `card ${index} does not retain its sampled launch pose while waiting`
    );
    assert(
      flight.phase === 'flight' &&
        flight.screenX > plan.start.x &&
        flight.tableClearance > 0,
      `card ${index} does not advance through an airborne 3D flight`
    );
    assert(
      slap.phase === 'slap' &&
        Math.abs(slap.rotationX) < Math.abs(plan.contact.rotationX) &&
        Math.abs(slap.rotationY) < Math.abs(plan.contact.rotationY),
      `card ${index} does not make one clean leading-edge contact`
    );
    assert(
      slide.phase === 'slide' &&
        slide.depth === 0 &&
        slide.rotationX === 0 &&
        slide.rotationY === 0 &&
        slide.rotationZ === 0,
      `card ${index} is not flat during its friction slide`
    );
    assert(
      settled.complete === true &&
        settled.phase === 'settled' &&
        settled.screenX === plan.destination.x &&
        settled.screenY === plan.destination.y &&
        settled.depth === 0 &&
        settled.z === plan.destination.z &&
        settled.rotationX === 0 &&
        settled.rotationY === 0 &&
        settled.rotationZ === 0 &&
        JSON.stringify(remainsSettled) === JSON.stringify(settled),
      `card ${index} does not remain at its exact canonical destination`
    );
  });

  for (let seed = 0; seed < 256; seed += 1) {
    const fuzzed = createCardArrivalBatch(cards, {
      ...request,
      id: `collision-${seed}`,
      seed: `collision-${seed}`
    });
    assert(
      fuzzed.totalDurationMs <= fuzzed.maxBatchDurationMs,
      `seed ${seed} exceeds the arrival deadline`
    );
    verifyDenseMotion(fuzzed, `seed ${seed}`);
  }

  assert(
    !source.includes('Math.random'),
    'arrival randomness is sampled from nondeterministic Math.random'
  );
  assert(
    !source.includes('landingCycles') &&
      !source.includes('depthBounce') &&
      !source.includes('rebound'),
    'the replacement arrival still contains oscillating landing logic'
  );
  assert(
    (() => {
      try {
        createCardArrivalBatch(cards, {
          ...request,
          profile: 'not-a-real-profile'
        });
        return false;
      } catch (error) {
        return /Unknown card-arrival profile/.test(error.message);
      }
    })(),
    'the public planner silently accepts an unknown arrival profile'
  );
  assert(
    (() => {
      try {
        createCardArrivalBatch([
          {...cards[0], width: 0}
        ], request);
        return false;
      } catch (error) {
        return /invalid/.test(error.message);
      }
    })(),
    'the public planner does not fail fast on invalid card geometry'
  );

  console.log(
    `ok - collision-safe card-arrival contract (${assertions} assertions)`
  );
} catch (error) {
  console.error(
    `not ok - collision-safe card-arrival contract: ${error.message}`
  );
  process.exitCode = 1;
}
