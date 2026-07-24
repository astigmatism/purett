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
let projectedOverflights = 0;
let minimumOverflightCenterSeparation = Number.POSITIVE_INFINITY;

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
  let maximumWorldZ = Number.NEGATIVE_INFINITY;
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
    maximumWorldZ = Math.max(maximumWorldZ, worldZ);
    maximumPerspectiveScale = Math.max(
      maximumPerspectiveScale,
      scale
    );
    return {
      x:
        cameraCenterX +
        ((worldCenterX - cameraCenterX + neutralized.x) * scale),
      y:
        cameraCenterY -
        ((worldCenterY - cameraCenterY + neutralized.y) * scale)
    };
  });

  function edgeLength(start, end) {
    return Math.hypot(end.x - start.x, end.y - start.y);
  }

  return {
    corners,
    minimumWorldZ,
    maximumWorldZ,
    maximumPerspectiveScale,
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

function distanceBetween(left, right) {
  return Math.hypot(left.screenX - right.screenX, left.screenY - right.screenY);
}

function velocityBetween(left, right, intervalMs) {
  return {
    x: (right.screenX - left.screenX) / intervalMs,
    y: (right.screenY - left.screenY) / intervalMs
  };
}

function verifyReferenceChoreography(batch) {
  const releaseSequence = batch.plans.slice(0).sort(
    (left, right) => left.releaseIndex - right.releaseIndex
  );
  const releaseGaps = batch.releaseTimes.slice(1).map(
    (release, index) => release - batch.releaseTimes[index]
  );
  const effectiveSpeeds = releaseSequence.map(
    (plan) => (
      Math.hypot(
        plan.contact.x - plan.start.x,
        plan.contact.y - plan.start.y
      ) / plan.flightDurationMs
    )
  );
  const spinTravel = releaseSequence.map(
    (plan) => plan.contact.rotationZ - plan.start.rotationZ
  );
  const contacts = releaseSequence.map((plan) => plan.contactAtMs);
  const startsX = releaseSequence.map((plan) => plan.start.x);
  const startsY = releaseSequence.map((plan) => plan.start.y);
  const bows = releaseSequence.map((plan) => plan.path.bow);
  const apexGaps = releaseSequence.map((plan) => plan.path.apexAirGap);
  const slideDistances = releaseSequence.map(
    (plan) => plan.path.slideDistance
  );

  assert(
    JSON.stringify(releaseSequence.map((plan) => plan.cardIndex)) ===
      JSON.stringify([4, 2, 3, 1, 0]),
    'the reference hand scatter lost its two-burst spatial phrasing'
  );
  assert(
    releaseGaps[0] >= 100 &&
      releaseGaps[0] <= 150 &&
      releaseGaps[1] >= 295 &&
      releaseGaps[1] <= 345 &&
      releaseGaps[2] < 100 &&
      releaseGaps[3] < 160,
    'the reference release cadence reads as a metronome instead of two human bursts'
  );
  assert(
    new Set(releaseSequence.map((plan) => plan.motionVariant)).size === 5,
    'the reference batch does not contain five correlated gesture variants'
  );
  assert(
    Math.max(...startsX) - Math.min(...startsX) <= 8.01 &&
      Math.max(...startsY) - Math.min(...startsY) >= 25 &&
      Math.max(...startsY) - Math.min(...startsY) <= 60,
    'the releases do not come from one recognizably hand-sized packet'
  );
  assert(
    Math.max(...effectiveSpeeds) / Math.min(...effectiveSpeeds) >= 1.2,
    'the reference cards still share one mechanical flight speed'
  );
  assert(
    spinTravel.some((value) => value < 0) &&
      spinTravel.some((value) => value > 0),
    'the reference cards all inherit the same wrist-roll direction'
  );
  assert(
    bows.some((value) => value < 0) &&
      bows.some((value) => value > 0) &&
      Math.max(...bows) - Math.min(...bows) >= 50,
    'the reference paths do not show opposing human release lanes'
  );
  assert(
    Math.max(...apexGaps) - Math.min(...apexGaps) >= 5,
    'the reference cards do not vary meaningfully in flight height'
  );
  assert(
    Math.max(...slideDistances) - Math.min(...slideDistances) >= 20,
    'impact energy does not produce visibly different skid lengths'
  );
  assert(
    Math.max(...contacts) - Math.min(...contacts) <= 400,
    'the cards no longer arrive as one compact scatter event'
  );

  let peakConcurrentFlights = 0;
  for (let elapsed = 0; elapsed <= batch.totalDurationMs; elapsed += 4) {
    peakConcurrentFlights = Math.max(
      peakConcurrentFlights,
      batch.plans.filter((plan) => {
        const pose = sampleCardArrival(plan, elapsed);
        return pose.phase === 'flight';
      }).length
    );
  }
  assert(
    peakConcurrentFlights >= 3,
    'the reference batch never reads as a shared multi-card scatter'
  );
}

function verifyDenseMotion(batch, seedLabel) {
  const previousByPlan = new Map();
  const previousPostContactStep = new Map();
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
    const metrics = batch.plans.map(
      (plan, index) => renderedFaceMetrics(plan, poses[index])
    );

    batch.plans.forEach((plan, index) => {
      const pose = poses[index];
      const previous = previousByPlan.get(plan);
      const face = metrics[index];
      const baseline = settledMetrics.get(plan);

      assert(
        face.minimumWorldZ >= -epsilon,
        `${seedLabel} card ${index} penetrates the visible table plane at ${elapsed}ms`
      );
      assert(
        face.maximumPerspectiveScale <= 1.09 + epsilon,
        `${seedLabel} card ${index} swells like a scale-in at ${elapsed}ms`
      );
      assert(
        face.edgeLengths.every((edgeLength, edgeIndex) => (
          edgeLength <=
            (baseline.edgeLengths[edgeIndex] * 1.09) + epsilon
        )),
        `${seedLabel} card ${index} has an oversized rendered edge at ${elapsed}ms`
      );
      assert(
        Math.abs(pose.nearestVertexDepth - face.maximumWorldZ) <= 0.00001 &&
          Math.abs(pose.farthestVertexDepth - face.minimumWorldZ) <= 0.00001,
        `${seedLabel} card ${index} reports the wrong transformed face depth`
      );
      assert(
        Math.abs(pose.rotationX) < (Math.PI / 2) &&
          Math.abs(pose.rotationY) < (Math.PI / 2),
        `${seedLabel} card ${index} flashes its back face`
      );

      if (previous && pose.phase === 'flight' &&
          previous.pose.phase === 'flight') {
        assert(
          pose.screenX + 0.5 >= previous.pose.screenX,
          `${seedLabel} card ${index} makes a conspicuous backward flight move`
        );
        assert(
          pose.rotationX * plan.start.rotationX >= -epsilon &&
            pose.rotationY * plan.start.rotationY >= -epsilon,
          `${seedLabel} card ${index} flutters through a rotation reversal`
        );
      }

      if (elapsed >= plan.contactAtMs && !pose.complete) {
        const distance = Math.hypot(
          pose.screenX - plan.destination.x,
          pose.screenY - plan.destination.y
        );
        const previousStep = previousPostContactStep.get(plan);
        if (previous && previous.afterContact) {
          const stepDistance = distanceBetween(previous.pose, pose);
          assert(
            distance <= previous.distance + epsilon,
            `${seedLabel} card ${index} rebounds after contact`
          );
          assert(
            pose.nearestVertexDepth <=
              previous.pose.nearestVertexDepth + epsilon,
            `${seedLabel} card ${index} rises after contact`
          );
          if (previousStep != null) {
            assert(
              stepDistance <= previousStep + epsilon,
              `${seedLabel} card ${index} accelerates after contact`
            );
          }
          previousPostContactStep.set(plan, stepDistance);
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
            `${seedLabel} card ${index} jiggles while making contact`
          );
        }
        previousByPlan.set(plan, {
          pose,
          afterContact: true,
          distance
        });
      } else {
        previousByPlan.set(plan, {
          pose,
          afterContact: false,
          distance: 0
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
          (!leftPose.complete || !rightPose.complete) &&
          polygonsOverlap(
            metrics[leftIndex].corners,
            metrics[rightIndex].corners
          )
        ) {
          const screenCenterDistance = distanceBetween(
            leftPose,
            rightPose
          );
          projectedOverflights += 1;
          const centerSeparation = Math.abs(leftPose.z - rightPose.z);
          if (screenCenterDistance < 80) {
            minimumOverflightCenterSeparation = Math.min(
              minimumOverflightCenterSeparation,
              centerSeparation
            );
          }
          assert(
            screenCenterDistance >= 80 || centerSeparation >= 1,
            `${seedLabel} cards ${leftIndex} and ${rightIndex} lose readable over/under depth at ${elapsed}ms (${centerSeparation.toFixed(3)} depth, ${screenCenterDistance.toFixed(3)} center distance)`
          );
        }
      }
    }
  }

  batch.plans.forEach((plan, index) => {
    const justBeforeContact = sampleCardArrival(
      plan,
      plan.contactAtMs - 0.1
    );
    const contact = sampleCardArrival(plan, plan.contactAtMs);
    const justAfterContact = sampleCardArrival(
      plan,
      plan.contactAtMs + 0.1
    );
    const flat = sampleCardArrival(plan, plan.flatAtMs);
    const justBeforeFlat = sampleCardArrival(
      plan,
      plan.flatAtMs - 0.1
    );
    const beforeSettlement = sampleCardArrival(
      plan,
      plan.settleAtMs - 16
    );
    const settled = sampleCardArrival(plan, plan.settleAtMs);
    const incomingVelocity = velocityBetween(
      justBeforeContact,
      contact,
      0.1
    );
    const outgoingVelocity = velocityBetween(
      contact,
      justAfterContact,
      0.1
    );

    assert(
      contact.phase === 'slap' &&
        Math.abs(
          renderedFaceMetrics(plan, contact).minimumWorldZ
        ) <= 0.00001 &&
        contact.tableClearance === 0,
      `${seedLabel} card ${index} does not make exact leading-edge contact`
    );
    assert(
      Math.hypot(
        justBeforeContact.screenX - contact.screenX,
        justBeforeContact.screenY - contact.screenY
      ) < 0.2 &&
        Math.hypot(
          incomingVelocity.x - outgoingVelocity.x,
          incomingVelocity.y - outgoingVelocity.y
        ) < 0.01,
      `${seedLabel} card ${index} stops or relaunches at contact (` +
        `${Math.hypot(
          incomingVelocity.x - outgoingVelocity.x,
          incomingVelocity.y - outgoingVelocity.y
        ).toFixed(4)} velocity delta)`
    );
    assert(
      flat.phase === 'slide' &&
        Math.hypot(
          justBeforeFlat.screenX - flat.screenX,
          justBeforeFlat.screenY - flat.screenY
        ) < 0.2 &&
        Math.abs(flat.screenX - plan.slideStart.x) <= epsilon &&
        Math.abs(flat.screenY - plan.slideStart.y) <= epsilon &&
        flat.rotationX === 0 &&
        flat.rotationY === 0,
      `${seedLabel} card ${index} is discontinuous at the flattening boundary`
    );
    assert(
      Math.hypot(
        plan.destination.x - beforeSettlement.screenX,
        plan.destination.y - beforeSettlement.screenY
      ) < 0.5 &&
        beforeSettlement.depth === 0 &&
        Math.abs(beforeSettlement.rotationZ) < 0.001,
      `${seedLabel} card ${index} visibly snaps into final alignment`
    );
    assert(
      settled.complete &&
        settled.screenX === plan.destination.x &&
        settled.screenY === plan.destination.y &&
        settled.depth === 0 &&
        settled.rotationX === 0 &&
        settled.rotationY === 0 &&
        settled.rotationZ === 0,
      `${seedLabel} card ${index} misses its exact persistent destination`
    );

    const ascentSample = sampleCardArrival(
      plan,
      plan.releaseAtMs +
        (plan.flightDurationMs * plan.path.apexAtProgress * 0.5)
    );
    const apexSample = sampleCardArrival(
      plan,
      plan.releaseAtMs +
        (plan.flightDurationMs * plan.path.apexAtProgress)
    );
    const descentSample = sampleCardArrival(
      plan,
      plan.releaseAtMs +
        (
          plan.flightDurationMs *
          (
            plan.path.apexAtProgress +
            ((1 - plan.path.apexAtProgress) * 0.65)
          )
        )
    );
    assert(
      apexSample.airGap >= ascentSample.airGap - epsilon &&
        apexSample.airGap > descentSample.airGap + 0.5,
      `${seedLabel} card ${index} does not visibly rise and fall under gravity`
    );
  });
}

try {
  const request = {
    id: 'lobby-presentation-17',
    trigger: 'command-bar-reveal',
    profile: 'casual-drop-left',
    seed: 'human-toss-reference'
  };
  const cards = fixtureCards();
  const first = createCardArrivalBatch(cards, request);
  const repeated = createCardArrivalBatch(cards, request);
  const changedSeed = createCardArrivalBatch(cards, {
    ...request,
    seed: 'human-toss-couplet'
  });
  const alternateDestinations = createCardArrivalBatch(
    fixtureCards(84),
    request
  );

  assert(
    CASUAL_DROP_LEFT_PROFILE.name === 'casual-drop-left' &&
      CARD_ARRIVAL_PROFILES['casual-drop-left'] ===
        CASUAL_DROP_LEFT_PROFILE,
    'the reusable casual-left profile is missing'
  );
  assert(
    JSON.stringify(first) === JSON.stringify(repeated),
    'identical input does not reproduce the same human scatter'
  );
  assert(
    first.originPolicy === 'compact-left-hand-packet' &&
      first.placementOrder === 'art-directed-human-scatter' &&
      first.collisionPolicy === 'depth-separated-natural-overflight',
    'the planner still describes an orderly traffic deal'
  );
  assert(
    first.releaseWindowMs <= 720 &&
      first.totalDurationMs <= 1500 &&
      first.totalDurationMs <= first.maxBatchDurationMs,
    'the human scatter exceeds its reveal-time motion budget'
  );
  assert(
    first.totalDurationMs === Math.max(
      ...first.plans.map((plan) => plan.totalDurationMs)
    ),
    'the batch duration does not bound every individual plan'
  );
  assert(
    first.plans.every((plan, index) => (
      plan.launchHalfExtent > (cards[index].width / 2) &&
      plan.start.x + plan.launchHalfExtent < 0
    )),
    'one or more cards peek onscreen before the player releases them'
  );
  assert(
    first.plans.some((plan, index) => (
      plan.start.y !== changedSeed.plans[index].start.y ||
      plan.path.bow !== changedSeed.plans[index].path.bow ||
      plan.start.rotationZ !== changedSeed.plans[index].start.rotationZ ||
      plan.delayMs !== changedSeed.plans[index].delayMs
    )),
    'changing the seed does not change transient human variation'
  );
  assert(
    first.plans.every((plan, index) => (
      plan.orderIndex === changedSeed.plans[index].orderIndex &&
      JSON.stringify(plan.destination) ===
        JSON.stringify(changedSeed.plans[index].destination)
    )),
    'seed variation changes the art-directed phrasing or an exact destination'
  );
  assert(
    alternateDestinations.plans.every((plan, index) => (
      plan.destination.y === cards[index].destination.y + 84
    )),
    'the reusable planner does not honor caller-supplied destinations'
  );

  verifyReferenceChoreography(first);

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
        waiting.tableClearance > 0,
      `card ${index} does not wait in the sampled hand pose`
    );
    assert(
      flight.phase === 'flight' &&
        flight.screenX > plan.start.x &&
        flight.tableClearance > 0,
      `card ${index} does not advance through an airborne ballistic flight`
    );
    assert(
      slap.phase === 'slap' &&
        Math.abs(slap.rotationX) < Math.abs(plan.contact.rotationX) &&
        Math.abs(slap.rotationY) < Math.abs(plan.contact.rotationY),
      `card ${index} does not flatten after one physical contact`
    );
    assert(
      slide.phase === 'slide' &&
        slide.depth === 0 &&
        slide.rotationX === 0 &&
        slide.rotationY === 0 &&
        Math.abs(slide.rotationZ) <
          Math.abs(plan.contact.rotationZ) + epsilon,
      `card ${index} does not retain and dissipate its remaining skid energy`
    );
    assert(
      settled.complete === true &&
        settled.phase === 'settled' &&
        JSON.stringify(remainsSettled) === JSON.stringify(settled),
      `card ${index} does not remain at its exact destination`
    );
  });

  for (let seed = 0; seed < 256; seed += 1) {
    const fuzzed = createCardArrivalBatch(cards, {
      ...request,
      id: `human-scatter-${seed}`,
      seed: `human-scatter-${seed}`
    });
    const gaps = fuzzed.releaseTimes.slice(1).map(
      (release, index) => release - fuzzed.releaseTimes[index]
    );
    assert(
      fuzzed.releaseWindowMs <= 720 &&
        fuzzed.totalDurationMs <= fuzzed.maxBatchDurationMs,
      `seed ${seed} exceeds the scatter deadline`
    );
    assert(
      gaps.some((gap) => gap < 100) &&
        gaps.some((gap) => gap > 290),
      `seed ${seed} collapses into a mechanical release cadence`
    );
    verifyDenseMotion(fuzzed, `seed ${seed}`);
  }

  assert(
    projectedOverflights > 0 &&
      minimumOverflightCenterSeparation >= 1,
    'the dense corpus never verifies readable natural card overflight'
  );
  assert(
    !source.includes('Math.random'),
    'arrival randomness is sampled from nondeterministic Math.random'
  );
  assert(
    !source.includes('landingCycles') &&
      !source.includes('depthBounce') &&
      !source.includes('rebound') &&
      !source.includes('spring'),
    'the human drop still contains oscillating landing logic'
  );
  assert(
    source.includes('motionVariant') &&
      source.includes('apexAtProgress') &&
      source.includes('gravity') &&
      source.includes('easeOutQuadratic'),
    'the planner is missing art-directed gestures or ballistic/friction motion'
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
    'the public planner silently accepts an unknown profile'
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
    `ok - human card-scatter arrival contract (${assertions} assertions, ` +
    `${projectedOverflights} depth-readable overflight samples)`
  );
} catch (error) {
  console.error(`not ok - ${error.message}`);
  process.exitCode = 1;
}
