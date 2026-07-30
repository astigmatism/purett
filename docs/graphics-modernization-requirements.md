# Graphics modernization requirements

| Field | Value |
|---|---|
| Status | Phase 0.16 cover-settlement-triggered Modern match-hand stack and fan implemented with feature-deployment visual review pending; Phase 0.15 renderer-exclusive Modern hinged game-cover projection corrected; Phase 0.14 renderer-local active-match turn-indicator coin and Motion Studio profile implemented; Phase 0.13 placement preview preserved as the current card-interaction baseline; Phase 0.9 lobby playbook verification remains in progress; Phase 0.7 visual baseline rejected |
| Version | 1.15 |
| Last updated | 2026-07-30 |
| Scope | Active-match graphics roadmap plus renderer-local Modern player-card pickup/follow, invalid-return, valid-zone hover, one-placement-preview, turn-indicator-coin, and cover-triggered two-hand entrance studies, a parallel full-stage Modern hinged game-cover projection, Modern match-hand rendering, Modern lobby-hand rendering, an application-bound lobby intro/exit playbook, Motion Studio card and coin authoring, renderer-neutral motion recipes, and bounded decorative experiments |
| Modern renderer | Three.js `0.185.1` (`r185`) with `WebGLRenderer`, selected for Phase 0 and provisional for the playable renderer |

> **Implementation status — 2026-07-27:** Phase 0 established the runtime Graphics switch, safe Legacy fallback, and inert active-match Modern surface. Phase 0.5 rendered only the five lobby-hand cards beneath the Play, Shop, and Tutorials bar. Phase 0.6 added the calibrated flat-table Three.js card model and independent decorative double flips. Phase 0.7 deployed a deterministic `casual-drop-left` implementation with a pure planner, bounded lifecycle, table-clearance safeguards, and exact settlement. Its current visible motion does **not** convincingly resemble cards being dropped or scattered by a player: it reads primarily as flat cards sliding in from the left. It therefore failed the human visual acceptance requirement in `AC-P07-003` and is **not an approved visual baseline**. Its parameter values, named gestures, cadence, scale policy, and apparent motion must not be copied into the lobby, shop, active match, or another surface as an accepted design. Phase 0.8 introduced the isolated one-card Motion Studio and deterministic renderer-neutral recipes. Phase 0.9 binds that authoring loop to a browser-local application playbook: five independently editable lobby-card intro targets land on runtime-owned fixed anchors, and one shared Gentle Wind exit compiles into five deterministic seeded variants with distinct lower-left offscreen endpoints. Its authoring refinement presents the entire 755 by 562 lobby board at true logical size, visually inherits the selected application scale, keeps every HTML control outside that stage, and can copy one intro card's shared motion character to selected or all other intro cards while preserving each destination's delay and travel placement. `Apply & Preview in Lobby` exercises the same production path used by normal lobby presentation and command exit while preserving the stored Legacy/Modern preference. Modern lobby commands wait for the exit or a fail-open watchdog; Tutorials Back replays the intro. A valid saved Modern choice is read in the document head and masks only the retained Raphael lobby-card elements before first paint; the normal ready gate takes ownership after the first complete Three.js hand frame, while every failure path removes the startup mask and reveals Legacy. Phase 0.10 is the first active-match card projection: while Modern is effective, the current player and opponent hands are rendered as passive, flat, portrait Three.js cards at the exact Legacy stack coordinates. The bridge contains only plain visible presentation data, preserves Closed-hand secrecy, has no match input or animation loop, and falls back to the intact live Legacy surface on required texture or context failure. Phase 0.11 advanced only the player hand into a renderer-local pickup/follow motion study. A primary click on the visually topmost eligible player card lifts that one card to the Legacy-equivalent `1.075` projected scale, keeps the original grab offset while it follows the pointer through the scaled 693 by 500 host, and applies bounded velocity-driven local-X/local-Y tilt that trails movement and damps back to a stable lifted pose. Phase 0.11 deliberately ended with no second-click behavior. Phase 0.12 now supersedes only that historical no-drop boundary: after the 300-millisecond pickup has armed the hold, a second primary click always means an invalid renderer-local drop because no drop zones exist. The card returns to its original hand anchor over 300 milliseconds with the live Legacy `cubic-out` timing character and one clockwise screen-space turn, then normalizes exactly to its canonical position, projected scale, rotation, render order, and unlocked pickup state. Clicks before arming or during return are ignored, reduced motion settles immediately, and lifecycle generation guards make late frames inert. This return still owns no drop-zone test, legal target, gameplay intent, controller state, turn rule, game mutation, or network request. Board cards, slots, scores, turn state, rules, and effects remain intentionally unrendered. The current generated artifact and loader cache identity is `0.185.1-match-return.1`.

> **Phase 0.13 supersession — 2026-07-27:** The preceding implementation paragraph is retained as the complete historical Phase 0.12 record. Phase 0.13 supersedes only its zero-drop-zone and always-invalid-location boundary. The temporary game bridge now describes the nine Legacy board rectangles as plain presentation data. While a player card is carried, exactly one empty and currently valid rectangle may appear as the Legacy-equivalent black shadow at `0.3` opacity under the pointer. An armed second click over that rectangle begins one renderer-local placement preview: the carried card reverses the pickup pose over 300 milliseconds with `cubic-out` timing, lands at the exact slot center and table depth, and retains only one once-sampled screen-space residual roll in `[-2°, 2°]`. There is no position jitter. A click anywhere else still follows the unchanged Phase 0.12 invalid-return path. The preview does not call or mirror the Legacy drop routine, mutate game, hand, board, turn, or controller state, or submit a request. At most one preview placement is accepted for one unchanged hand/drop-zone snapshot; the placed card remains visible and inert until a revision or lifecycle boundary restores the canonical renderer projection. Reduced motion commits the same sampled endpoint immediately. The current generated artifact and loader cache identity is `0.185.1-match-placement.1`.

> **Phase 0.14 supersession — 2026-07-27:** The preceding paragraph is retained as the complete historical Phase 0.13 record. Phase 0.14 preserves every Phase 0.13 card-interaction behavior and supersedes only its absent-Modern-turn-indicator boundary and current delivery identity. The temporary bridge now adds one plain, monotonically sequenced description of the live Legacy turn marker. A newly mounted Modern surface snaps its first description to the described Legacy location without replaying history. Each later accepted sequence change animates one true 3D circular coin between the exact Legacy player and opponent targets through a deterministic arc, height, flip, tumble, spin, shadow, and settle profile. The current Legacy-selected 41 by 41 dime image is applied to both circular faces for this phase; a lit metallic cylindrical edge makes edge-on motion physically legible, but no new heads/tails outcome is invented. The coin is renderer-only presentation: it does not decide whose turn it is, delay or invoke the Legacy turn callback, gate card input, progress the match, or issue a request. Motion Studio adds one application target that previews the same coin geometry, active-match 693 by 500 coordinate space, endpoints, camera, planner, sampler, and profile used in production. Its normalized version-1 profile persists under the separate local key `purett.turnMarkerMotion.v1`, independent of the Graphics preference and lobby playbook. Reduced motion snaps each accepted transition to its latest endpoint, and lifecycle invalidation makes late frames inert. The current generated artifact and loader cache identity is `0.185.1-match-turn-coin.1`.

> **Phase 0.15 supersession — 2026-07-30:** Phase 0.15 preserves every Phase 0.14 active-match card and turn-coin behavior and supersedes only the earlier exclusion of `gh.cover` from Modern projection. Raphael remains loaded, `gh.cover` remains mounted and animated, and the existing Legacy `open()` and `close()` methods remain the sole owners of target state, callback invocation, callback timing, menu/game sequencing, and the full-stage pointer shield. While Modern is effective, one independent 755 by 562 Three.js surface may project the same two cover leaves as true outer-edge-hinged panels. The closed projection preserves the live `/images/left.png` and `/images/right.png` logical rectangles, including their one-pixel overlap and right-over-left seam order. Opening rotates both inner edges toward the camera and away from the center seam to a fixed 112-degree angle over 2,000 milliseconds with deterministic cubic-in timing; closing returns them to the exact closed pose over 2,000 milliseconds with deterministic cubic-out timing. Modern motion never calls, delays, replaces, or completes a Legacy continuation. Reduced motion snaps only the Modern visual projection and leaves Legacy timing and continuations unchanged. Any Modern cover initialization, texture, context, lifecycle, or projection failure leaves or restores the independently running Legacy cover atomically. The Phase 0.15 delivery identity is `0.185.1-game-cover-hinge.1`; `0.185.1-match-turn-coin.1` remains the historical Phase 0.14 identity.

> **Phase 0.15 renderer-exclusivity correction — 2026-07-30:** The first Phase 0.15 implementation attempted to identify the Raphael SVG paper with jQuery 1.7.1 `addClass()`. That API does not reliably mutate an SVG `class` attribute, so the ready selector could leave the Legacy panels painted beneath transparent parts of the Three.js projection. The Raphael root must receive its stable Legacy identity through the native SVG attribute API, and the cover-ready gate must directly maintain mutually exclusive renderer-active and visibility state on both children. The Legacy paper remains mounted and animated while hidden; selecting Legacy or any cover-local Modern failure reveals it before Modern suspension or disposal.

> **Phase 0.16 supersession — 2026-07-30:** Phase 0.16 preserves the complete Phase 0.15 cover projection and every Phase 0.13/0.14 active-match card and coin behavior. It supersedes only the earlier immediately-settled active-match hand presentation at match entry. While Modern is effective, each five-card hand initially occupies one pile at its existing fifth/bottom slot, and current hand index `4`—the card that will remain bottommost after expansion—paints above the other four. Only the actual Legacy left-panel opening completion, after the cover parent is hidden, publishes a plain observation event that may release both piles. Cards `3`, `2`, `1`, and `0` then fan upward in that order through one deterministic mirrored 3D lift over a 785-millisecond batch; card `4` remains fixed. Canonical hand descriptions, Legacy nodes, game/controller state, turn state, legal targets, and requests remain unchanged. The animation locks Modern card input until exact settlement, snaps under reduced motion, cancels safely at lifecycle boundaries, and intentionally settles without replay if the complete Modern presentation is not ready at the authoritative cover-open instant. The Phase 0.16 delivery identity is `0.185.1-match-hand-fan.1`; the Phase 0.15 cover component retains its own historical identity `0.185.1-game-cover-hinge.1`.

## Contents

- [1. Purpose of this document](#1-purpose-of-this-document)
- [2. Executive decision](#2-executive-decision)
- [3. Product vision](#3-product-vision)
- [4. Current-system baseline](#4-current-system-baseline)
- [5. Terminology](#5-terminology)
- [6. Recorded architectural and product decisions](#6-recorded-architectural-and-product-decisions)
- [7. Goals](#7-goals)
- [8. Non-goals](#8-non-goals)
- [9. Users and primary scenarios](#9-users-and-primary-scenarios)
- [10. System invariants](#10-system-invariants)
- [11. Functional requirements](#11-functional-requirements)
- [12. Phase 0: graphics preference and inert Modern preview](#12-phase-0-graphics-preference-and-inert-modern-preview)
  - [12.8 Phase 0.5: non-interactive Modern lobby hand](#128-phase-05-non-interactive-modern-lobby-hand)
  - [12.9 Phase 0.6: Modern lobby-card double-flip spike](#129-phase-06-modern-lobby-card-double-flip-spike)
  - [12.10 Phase 0.7: seeded lobby-card arrival choreography](#1210-phase-07-seeded-lobby-card-arrival-choreography)
  - [12.11 Phase 0.8: one-card Motion Studio authoring workbench](#1211-phase-08-one-card-motion-studio-authoring-workbench)
  - [12.12 Phase 0.9: application-bound lobby motion playbook](#1212-phase-09-application-bound-lobby-motion-playbook)
  - [12.13 Phase 0.10: passive active-match hand projection](#1213-phase-010-passive-active-match-hand-projection)
  - [12.14 Phase 0.11: renderer-local active-match pickup/follow study](#1214-phase-011-renderer-local-active-match-pickupfollow-study)
  - [12.15 Phase 0.12: renderer-local second-click invalid return](#1215-phase-012-renderer-local-second-click-invalid-return)
  - [12.16 Phase 0.13: renderer-local valid-zone hover and placement preview](#1216-phase-013-renderer-local-valid-zone-hover-and-placement-preview)
  - [12.17 Phase 0.14: renderer-local active-match turn-indicator coin](#1217-phase-014-renderer-local-active-match-turn-indicator-coin)
  - [12.18 Phase 0.15: parallel Modern hinged game-cover projection](#1218-phase-015-parallel-modern-hinged-game-cover-projection)
  - [12.19 Phase 0.16: cover-triggered active-match hand fan](#1219-phase-016-cover-triggered-active-match-hand-fan)
- [13. Target renderer contract](#13-target-renderer-contract)
- [14. Renderer-neutral view state](#14-renderer-neutral-view-state)
- [15. Three.js implementation constraints](#15-threejs-implementation-constraints)
- [16. Nonfunctional requirements](#16-nonfunctional-requirements)
- [17. Behavior and parity matrix](#17-behavior-and-parity-matrix)
- [18. Phased delivery plan](#18-phased-delivery-plan)
- [19. Test and evidence strategy](#19-test-and-evidence-strategy)
- [20. Rollout and preference precedence](#20-rollout-and-preference-precedence)
- [21. Principal risks and mitigations](#21-principal-risks-and-mitigations)
- [22. Open design questions](#22-open-design-questions)
- [23. Program completion criteria](#23-program-completion-criteria)
- [24. Change control](#24-change-control)
- [25. Repository references](#25-repository-references)
- [26. External technical references](#26-external-technical-references)

## 1. Purpose of this document

This document defines the intended outcome, constraints, phased delivery plan, and acceptance criteria for modernizing the active-match graphics in Pure Triple Triad. It also defines the deliberately narrow Phase 0.5 lobby-hand preview, Phase 0.6 lobby-card double-flip spike, Phase 0.7 entrance experiment, Phase 0.8 one-card Motion Studio, Phase 0.9 application-bound lobby intro/exit playbook, Phase 0.10 passive match-hand projection, Phase 0.11 renderer-local pickup/follow motion study, Phase 0.12 renderer-local second-click invalid return, Phase 0.13 renderer-local valid-zone hover and one-placement preview, Phase 0.14 renderer-local turn-indicator coin and Motion Studio profile, Phase 0.15 parallel full-stage hinged game-cover projection, and Phase 0.16 cover-triggered active-match hand fan used to establish renderer seams and physical-object language before any playable match surface is converted.

It is deliberately more detailed than an implementation ticket. The modernization will cross a legacy rendering implementation, animation-driven control flow, input handling, tests, build and dependency delivery, accessibility, and failure recovery. Once reviewed and accepted, this document is intended to be the stable product and engineering reference for that work.

The document is intended to:

- keep the original game fully playable throughout the modernization;
- distinguish the active-match renderer and the isolated lobby-hand preview from the application's other Raphael surfaces;
- prevent visual work from changing game rules or authoritative state;
- define the first preparatory increment precisely;
- provide measurable exit criteria for each later increment;
- record decisions so the implementation does not gradually drift from the intended outcome;
- make later scope changes explicit rather than accidental.

The requirements use **must**, **should**, and **may** in their conventional normative senses:

- **Must** identifies a required behavior or constraint.
- **Should** identifies a strong recommendation that may be changed only with a recorded reason.
- **May** identifies an allowed but optional behavior.

## 2. Executive decision

Pure Triple Triad should gain two selectable active-match graphics modes:

1. **Legacy** uses the existing Raphael implementation and preserves the game as it currently behaves.
2. **Modern** uses a new Three.js renderer in the same 693 by 500 logical active-match region.

Raphael will remain loaded and usable. This project does not attempt to remove Raphael from the application as a whole. The deck editor, shop, endgame screen, and the main-menu bar, commands, statistics, rules, and surrounding layout continue to depend on it. Phase 0.5 makes one explicit exception inside `gh.menu`: only the five decorative hand cards beneath the main command bar gain a parallel Three.js presentation. Phase 0.15 makes a second bounded exception for `gh.cover`: its existing Raphael instance remains live and authoritative while a separate full-stage Three.js surface may mirror its presentation in Modern mode.

The long-term design must place the match controller and authoritative client-side match state above a renderer-neutral boundary:

```text
Server-approved match state and events
                  |
            Match controller
                  |
        Active-match renderer contract
             /                 \
    Legacy Raphael          Modern Three.js
       renderer                renderer
```

After renderer extraction, exactly one active-match renderer must own the active-match mount, animation, and input at a time.

The first implementation increment did **not** add functional Three.js card rendering. It added a persisted graphics-mode preference and immediate runtime selection, preserved fully functional Legacy behavior, and supplied an intentionally inert Modern preview. Phase 0.10 added passive active-match hand projection. Phase 0.11 added one deliberately non-authoritative player-card pickup/follow study. Phase 0.12 added a renderer-local always-invalid second-click return. Phase 0.13 added one non-authoritative valid-zone hover and placement preview. Phase 0.14 adds the live turn-indicator projection and its local Motion Studio profile while still not adding playable Three.js match rendering. Phase 0.15 adds only a parallel Modern projection of the application game cover and preserves the Legacy cover as the sole lifecycle and continuation authority. Phase 0.16 observes that unchanged Legacy opening completion to release a renderer-local two-hand entrance without changing canonical hand or game state. The Modern bundle remains isolated, pinned, self-hosted, and loaded only when Modern is requested.

Phase 0 uses a presentation/input gate rather than a renderer reconstruction boundary. The active-match Raphael papers remain mounted, live, and synchronized while Modern is effective, but they are opacity-hidden, marked `aria-hidden`, and blocked from pointer input. Phase 0.10 evolves the initially blank, non-interactive Three.js surface to project only the two current hands. Phase 0.11 permits that Modern surface to own only card-bounded player-hand picking and pointer-follow presentation, with all resulting hold state confined to the renderer. Phase 0.12 permits the same renderer-local hold to consume one armed second click as an always-invalid return, without emitting a renderer-neutral or gameplay action. Selecting Legacy removes the gate and reveals the identical current Raphael state immediately, without a reload or renderer rebuild. This temporary coexistence must not be mistaken for the final architecture or a semantic gameplay-input boundary.

Phase 0.5 is the first real-card rendering slice. When the main menu is visible and Modern is effective, a dedicated transparent Three.js surface renders up to five current `gh.data.hand` card faces at the established 755 by 562 lobby coordinates. The corresponding Raphael card images remain alive until the Modern texture set has rendered successfully, then only those five card elements are visually and accessibly gated. Switching to Legacy immediately reveals the original Raphael card images. The main-menu bar and commands are never hidden, replaced, or made pointer-inert by this hand-only gate.

Phase 0.6 is a renderer-only interaction spike on that same Modern lobby surface. A primary click on any settled Modern card may start one bounded animation for that card: lift, one smooth same-direction local-X turn from zero to `-2π` that presents the canonical back at its midpoint and the original front at its endpoint, and exact flat settlement. Different cards may animate concurrently; only re-entry on a card whose own animation is active is ignored until that card settles. The spike does not select a card, mutate the hand, start or resume a game, submit a request, or establish the interaction architecture for the active match. Legacy remains unchanged and may be selected immediately even while one or more decorative animations are running.

Phase 0.7 adds one destination-driven arrival batch to each main-menu presentation while Modern is effective. It deliberately recalls the Legacy lobby's randomized off-screen-left entrance while changing the visible story from a mechanical deal to cards casually released by a player seated beyond the left side of the table. A seeded planner chooses one art-directed two-burst phrase and correlated card gestures, the existing shared scheduler advances analytic flight and contact motion, and exact settlement restores the Phase 0.6 flat-card contract before click interactions become eligible.

Phase 0.7's engineering safeguards remain useful evidence, but the deployed choreography failed its required real-time human-motion review. Passing deterministic, clearance, timing, and settlement checks does not establish that motion looks physically or emotionally correct. The current five-card scatter is therefore an implementation under evaluation, not a source of approved artistic constants.

Phase 0.8 paused further guess-and-deploy tuning of the five-card entrance and provided a dedicated one-card authoring workbench inside the application. It exposed travel, height, perspective or authored scale, rotation, flip count, contact, skid, shadow, timing, and playback controls against the actual card model and lobby camera. At the Phase 0.8 boundary, exported versioned recipes were deliberately isolated drafts and could not change production choreography.

Phase 0.9 is the separately approved integration change anticipated by that boundary. The Studio selects a concrete application target instead of producing only an unbound recipe. The five left-to-right lobby intro slots own independent recipes while the application retains their exact runtime landing anchors. One shared Gentle Wind exit recipe is compiled for the current five cards using one explicit run seed, a shared gust, stable per-slot derivation, bounded variation, and five distinct fully offscreen lower-left endpoints. Applying a playbook persists it locally and previews the selected intro or exit through the actual lobby renderer. The same generic exit runs before Play, Shop, Tutorials, Replay, and Deck in Modern mode. These additions do not make lobby cards game-authoritative, do not change the stored Graphics preference, and do not convert the active-match surface.

Phase 0.10 is the first active-match presentation slice. A temporary plain-data bridge describes the current player and opponent hand membership, resolved visible art, order, and exact Legacy coordinates without exposing Raphael handles. The active-match Three.js surface renders those cards only, using a head-on orthographic one-to-one mapping for this static parity step. It owns no match input, motion, raycasting, selection, drop zones, requests, or continuous frame loop. This provisional camera does not resolve the final active-match camera decision in `OQ-004`, and the compatibility bridge remains assigned to Phase 1 extraction.

Phase 0.11 is the first active-match physical-motion study. It replaces the Phase 0.10 orthographic camera only on the ready Modern active-match surface with a calibrated head-on perspective camera whose settled flat-table projection preserves the established hand anchors, dimensions, and position-neutral silhouette. A primary click may pick up only the visually topmost player-hand card. The renderer immediately owns one transient hold, raises that card in depth and ordering until its projected size is `1.075` of rest, preserves the click offset while following the pointer, and derives restrained local-X/local-Y tilt from logical pointer velocity so the card appears to resist travel. This hold never becomes `gh.game.dragging`, a controller selection, a legal-target computation, or a semantic action. No second click drops the card, no slot is pickable, no invalid return is animated, and no request can be emitted. Phase 0.11 therefore supplies motion and coordinate evidence without claiming the playable vertical slice assigned to later phases.

Phase 0.12 is a narrow superseding interaction study over that retained Phase 0.11 implementation. It supersedes the no-second-click and no-return clauses in `DEC-052`, `FR-MATCH-PICKUP-011`, `FR-MATCH-PICKUP-012`, `AC-P011-006`, and Section 12.14 only for the ready Phase 0.12 Modern active-match surface. The first accepted pickup must finish its 300-millisecond lift before its return is armed. Thereafter any second primary click, regardless of pointer location, is classified locally as an invalid drop because Phase 0.12 defines zero Modern drop zones. The card follows a 300-millisecond cubic-out return to the captured canonical hand pose while making one clockwise screen-space turn, then becomes pickable again only after exact normalized settlement. This presentation action never calls the Legacy grab/drop path, resolves no target, changes no match or controller state, and emits no request. A lifecycle boundary cancels and resets the transient pose immediately rather than replaying the visible return.

Phase 0.13 is a similarly narrow superseding study. It retains the complete Phase 0.12 invalid-return behavior for a second click outside a valid zone, but permits the Modern surface to consume plain descriptions of the nine currently live Legacy board rectangles and reveal one hover shadow for the carried card. This is not renderer-neutral legality or a playable move: the bridge supplies a fail-closed presentation validity bit, the surface accepts at most one local placement per unchanged snapshot, and no action crosses back into `gh.game`. A valid placement reverses the pickup pose to the exact Legacy slot center over 300 milliseconds with cubic-out timing and retains only a once-sampled `[-2°, 2°]` screen-space roll. Mode, view, visibility, hand/drop-zone revision, context, failure, replacement, and disposal boundaries discard the preview and restore the canonical renderer projection.

Phase 0.14 extends that unchanged renderer-local card study with one renderer-local turn-indicator projection. The bridge clones the current Legacy marker's sequence, side, rectangle, selected dime texture, and visibility. The first description received by a surface establishes the settled coin directly; only a later sequence and target change starts motion. The 41-pixel circular marker uses two textured circular face meshes and a three-unit cylindrical edge under the existing calibrated active-match perspective camera. A pure versioned profile controls its deterministic quadratic screen path, physical height, three-axis rotations, landing settle, and analytic shadow. The same profile and production planner/sampler are exposed in Motion Studio against an exact 693 by 500 active-match inset with locked Legacy endpoints and a reversible direction selector. The profile may be saved only to its dedicated browser-local key. None of this makes the turn marker authoritative, changes Phase 0.13 card behavior, calls the Legacy turn continuation, or advances gameplay.

Phase 0.15 adds one separate Outer UI projection rather than expanding the active-match renderer. The current `gh.cover` continues to construct and animate its two Raphael images, maintain `isopen`, shield the game while visible, and invoke every existing callback at the existing time. A new sibling 755 by 562 Modern cover surface observes only cloned presentation state and renders two physical leaves hinged at the outer vertical edges. The leaves reproduce the exact closed Legacy composition, then rotate their inner edges toward the camera and away from the center seam to 112 degrees using the same 2,000-millisecond cubic-in opening character and return with the same 2,000-millisecond cubic-out closing character. Because early exit and game over deactivate the active-match Modern surface before asking the cover to close, the cover surface has an independent lifecycle and failure boundary. It never becomes an application continuation, input handler, stored motion profile, or replacement for `gh.cover`.

Legacy remains the default until the Modern renderer reaches the documented playability, parity, reliability, and fallback gates.

## 3. Product vision

The Modern renderer should preserve the rules and recognizable table layout while making cards feel like physical objects in a controlled three-dimensional space.

The intended experience includes:

- perspective and depth;
- lift from the table or hand;
- tilt in response to focus or pointer position;
- translation between hand and board;
- rotation around all relevant axes;
- true front-to-back card turns;
- scale and focused inspection;
- restrained camera or table zoom;
- readable card faces and backs at supported display scales;
- clear legal-target, hover, selection, capture, and ownership feedback;
- polished but deterministic animation for Basic, Same, Plus, Combo, Elemental, Sudden Death, and replay sequences.

These effects are presentation. They must never determine card ownership, capture eligibility, capture order, score, turn state, server requests, or game completion.

The desired result is not a wholly new game. It is the same game with a replaceable active-match presentation layer and an enduring route back to its historical presentation.

## 4. Current-system baseline

### 4.1 The active-match surface

The current active match is not an HTML canvas. It is composed of two Raphael-generated SVG papers inside a CSS-rendered board:

```text
#game-wrapper
└── #board                         755 × 562 CSS board and frame
    ├── #svgBoard                  693 × 500 main Raphael paper
    ├── #svgRules                  693 × 500 Raphael rule-banner paper
    └── .overlay                   693 × 500 HTML dialog dimming layer
```

The main paper currently owns more than card images. It also owns:

- the player's hand;
- the opponent's hand;
- cards already on the board;
- invisible board-slot hit targets;
- scores;
- the turn marker;
- board elements;
- element bonus indicators;
- loading artwork;
- transient capture and placement effects.

The rule paper owns animated rule banners.

The CSS board image, HTML dialog overlay, application title, context menu, mute control, footer, and surrounding UI are not part of these two match papers.

Both active-match paper hosts and the HTML dimming overlay are positioned 30 pixels from the top and left of the 755 by 562 board. The current logical card size is 117 by 146, and board-element glyphs are 30 by 30. These values are parity baselines, not Three.js drawing-buffer dimensions.

### 4.2 Current coupling

The active game implementation combines several responsibilities in `gh.game`:

- construction of client-side match state;
- construction of Raphael objects;
- input routing;
- pointer-coordinate conversion;
- animation sequencing;
- turn locking;
- request submission;
- response handling;
- capture presentation;
- review and replay;
- Sudden Death reconstruction.

The hand and board arrays currently contain live Raphael handles. Some behavior also reads visual state back from Raphael, including image URLs, bounding boxes, pointer-event attributes, and paint order. Animation completion callbacks frequently advance game control flow.

This means the Modern renderer cannot safely be implemented as a direct library substitution. A renderer-neutral state and transition boundary must be introduced deliberately.

### 4.3 Raphael outside the match and the bounded projection exceptions

Raphael is also used by:

- `gh.cover`;
- `gh.menu`;
- `gh.deck`;
- `gh.shop`;
- `gh.endgame`.

Phase 0.5 brings one bounded part of `gh.menu` into scope: the five initially non-interactive card images displayed beneath the Play, Shop, and Tutorials command bar when the application first reaches the main-menu/lobby viewport. Phase 0.6 adds only the documented decorative click-to-double-flip behavior to their Modern projection, and Phase 0.7 adds only the seeded entrance tied to that menu presentation. The existing implementation uses one 755 by 562 Raphael paper for both the black command bar and those card images. It positions the card images at x coordinates 72, 197, 322, 447, and 572, with y 203 and a logical card size of 117 by 146.

The Modern implementation must therefore gate individual hand-card elements rather than the `gh.menu` Raphael paper. The bar, commands, statistics, next-rules content, and all menu navigation remain present and usable. `gh.cover`, `gh.deck`, `gh.shop`, `gh.endgame`, and every other part of `gh.menu` remain outside the Phase 0.5 through Phase 0.9 lobby-rendering slice. Phase 0.8 adds a separate authoring layer above that intact menu. Phase 0.9 adds only Modern lobby-hand intro/exit presentation and a short command-continuation wait; neither phase converts or takes rendering ownership of the surrounding Raphael surfaces.

Phase 0.15 narrowly supersedes only the preceding exclusion of `gh.cover`. It does not convert, unload, replace, stop, or take callback authority from the Raphael cover. The existing cover remains the application lifecycle owner and continues to animate behind a parallel Modern projection. No other surrounding Raphael surface enters scope.

Modern graphics mode must not unload, replace, delete, or globally disable `window.Raphael`.

### 4.4 Existing layout and protocol contracts

The following existing contracts remain authoritative unless a later requirements revision says otherwise:

- The active-match logical region is 693 by 500.
- The containing board and frame are 755 by 562.
- The main-menu/lobby Raphael paper and the dedicated Modern lobby-hand host use a 755 by 562 logical region.
- The game cover occupies the full 755 by 562 content stage above the game wrapper. Its live logical rectangles are `/images/left.png` at `(0, 0, 377, 562)` and `/images/right.png` at `(376, 0, 378, 562)`. The one-pixel overlap at x `376` and the right panel's later paint order are intentional compatibility facts.
- The main-menu/lobby hand preview contains at most five cards at the existing x positions 72, 197, 322, 447, and 572 and y position 203; it remains decorative even when Phase 0.6 accepts the approved card-bounded click effect independently on each settled card.
- Card art uses the current same-origin image paths and opaque image keys.
- The application-level scale choices are 1, 1.5, 2, and 3.
- Match creation, move submission, replay, claim, and game-completion protocols remain unchanged.
- The server authoritatively validates and persists moves and returns capture, score, and final-result data. The current client still owns local input/turn sequencing and duplicates some round-completion and Sudden Death decisions. Those responsibilities must remain above both renderers during extraction.
- The deterministic rules must not depend on visible animation order. See [Triple Triad rules](rules.md), especially the complete capture-resolution procedure.
- The application remains self-contained and must not depend on a runtime CDN or third-party hosted card assets.
- There is currently no production frontend package manifest or application bundler. The only existing JavaScript package workflow is browser-test infrastructure, so the Modern build boundary must be introduced explicitly rather than assumed.

## 5. Terminology

| Term | Meaning |
|---|---|
| **Active-match surface** | The visual and interactive region used while playing, reviewing, or replaying a match. |
| **Board frame** | The existing 755 by 562 CSS-backed `#board` element and its static background artwork. |
| **Legacy renderer** | The current active-match implementation backed by the two Raphael papers. |
| **Modern renderer** | The future active-match implementation backed by Three.js. |
| **Modern preview** | The non-playable Phase 0 Modern mode. It began as an inert delivery and gating proof, gained passive active-match hands in Phase 0.10, renderer-local player-card pickup/follow presentation in Phase 0.11, an always-invalid renderer-local second-click return in Phase 0.12, a renderer-local valid-zone hover plus one-placement preview in Phase 0.13, a renderer-local sequenced turn-indicator coin in Phase 0.14, a parallel full-stage game-cover projection in Phase 0.15, and a cover-triggered two-hand entrance in Phase 0.16. It still cannot emit a gameplay intent, mutate authoritative state, decide the turn, own an application continuation, or submit a move. |
| **Lobby/main-menu viewport** | The first application screen containing the Play, Shop, and Tutorials command bar, statistics/rules content, and the five-card hand preview. It is not an active match or game state. |
| **Lobby-hand preview** | The five current-hand card faces displayed below the main command bar. Phase 0.5 renders them as a non-interactive Three.js preview; Phase 0.6 adds a decorative click-to-double-flip spike; Phase 0.7 records the rejected seeded entrance; Phase 0.9 supplies application-bound intro and exit sequences while all surrounding menu UI remains unchanged. |
| **Lobby-hand host** | The dedicated, transparent 755 by 562 DOM mount used only for the Modern lobby-hand preview. It is pointer-inert in Phase 0.5; Phase 0.6 may accept pointer activation only over a settled Modern card without blocking the surrounding menu. |
| **Lobby card re-entry lock** | The Phase 0.6 lock owned independently by each lobby card while that card animates. It rejects and does not queue a repeated activation of the same active card until exact settlement, but it does not block another settled card from starting its own concurrent animation. It is not a game, turn, card-selection, or server-request lock. |
| **Lobby presentation token** | The one-use identifier and reveal timestamp created by each `gh.menu.show()` call and carried to the Modern surface so async readiness can present at most one caught-up matching arrival batch. |
| **Card arrival profile** | A reusable seeded planner and sampler that accepts plain card dimensions and destinations. Phase 0.7 defines `casual-drop-left`; the profile contains no lobby slot coordinates or game authority. |
| **Motion Studio** | The application-local workbench introduced in Phase 0.8 and bound to concrete lobby playbook targets in Phase 0.9. Phase 0.14 additionally provides one active-match turn-coin target that uses the production coin planner and a separate browser-local profile. The Studio previews one Three.js subject, exposes applicable motion controls and transport, applies only an explicitly authorized local target, and never changes authoritative game state or the stored Graphics preference. |
| **Motion recipe** | A versioned plain-data description of a card transition. It contains validated values and stable semantic names, but no DOM node, Raphael element, Three.js object, callback, wall-clock timestamp, or application state reference. |
| **Motion draft** | The mutable recipe currently being edited in the Motion Studio. Phase 0.8 drafts were unbound studies. In Phase 0.9 a card draft belongs to one declared lobby-playbook target. In Phase 0.14 a coin draft may belong only to the declared Modern match turn-coin transition and may update only its separate local profile. Neither kind can affect the shop, account, server, gameplay authority, or repository defaults. |
| **Lobby motion playbook** | The versioned browser-local plain-data document that owns five independent intro entries, one shared Gentle Wind exit entry, its seed-lock policy, and no resolved card coordinates. It is the Phase 0.9 production input for Modern lobby intro/exit presentation in that browser. |
| **Application-bound motion target** | A stable Studio selection whose semantic start or destination is owned by the application. Phase 0.9 defines `Lobby card 1–5 — Intro` and `Lobby hand — Gentle Wind Exit`; Phase 0.14 adds `Match turn coin — Transition` with locked Legacy endpoints and selectable preview direction. |
| **Runtime-owned anchor** | The current renderer-supplied center and table position for one of the five lobby slots. Anchors are resolved from the live card layout when a sequence is compiled and are never serialized into the playbook. |
| **Gentle Wind exit** | One shared outbound lobby sequence compiled into five deterministic per-slot variants. A shared gust keeps the cards coherent while bounded per-card variation gives each a distinct path, cadence, lift, rotation, speed, and fully offscreen lower-left endpoint. |
| **Lobby command continuation** | The exactly-once callback held while a Modern Gentle Wind exit runs before Play, Shop, Tutorials, Replay, or Deck. Additional command clicks are ignored until it completes or fails open through its watchdog. |
| **Active-match pickup/follow study** | The Phase 0.11 Modern-only presentation experiment in which one eligible player-hand card can be lifted and moved with the pointer. Its hold, grab offset, velocity, and pose are renderer-local and cannot become controller selection, game state, a legal-target decision, or a network action. |
| **Renderer-local hold** | The single transient Phase 0.11 record owned entirely by the active-match Three.js surface. It identifies the picked player card, original anchor, grab offset, current logical pointer, filtered velocity, lift phase, and rendered pose. It is discarded rather than reconciled whenever the owning surface or hand revision becomes invalid. |
| **Armed renderer-local hold** | The Phase 0.12 state reached only after the accepted pickup lift completes. Before arming, a second click is ignored so the pickup event cannot immediately become its own return. Arming permits exactly one later primary click to begin the always-invalid return. |
| **Always-invalid return** | The Phase 0.12 renderer-local presentation response to an armed second click. Because Modern defines zero drop zones in this phase, pointer location is not tested for validity: the held card returns to its captured canonical hand pose without a gameplay drop, semantic action, target result, controller mutation, or request. |
| **Return input lock** | The exclusive state held during the Phase 0.12 invalid-return animation. Pointer movement and additional clicks cannot retarget, restart, replace, or queue another pickup or return; exact settlement releases the lock. |
| **Modern drop-zone description** | A plain cloned Phase 0.13 presentation record for one Legacy board rectangle: slot index, logical top-left, width, height, corner radius, availability, and fail-closed current validity. It contains no Raphael element, Three.js object, callback, move payload, or authority to recompute game rules. |
| **Valid-zone hover shadow** | The single Phase 0.13 black rounded rectangle shown at `0.3` opacity only while a carried card's pointer is inside an empty, currently valid board rectangle. It is presentation feedback, not a semantic legal-target collection. |
| **Renderer-local placement preview** | The Phase 0.13 visual result of an armed second click over the currently hovered valid zone. It settles one carried card at the exact slot center with a once-sampled `[-2°, 2°]` screen-space roll, remains private to the Modern surface, and is discarded on snapshot or lifecycle reset without submitting a move. |
| **Placement preview lock** | The Phase 0.13 one-per-snapshot guard. Once one placement preview completes, that placed projection remains visible and inert and no additional preview pickup or placement may begin until hand/drop-zone presentation revision or another lifecycle boundary restores canonical projection. |
| **Turn-indicator descriptor** | The plain cloned Phase 0.14 presentation record containing monotonic sequence, side, logical rectangle, approved Legacy dime texture URL, and visibility. It reports what Legacy currently presents; it is not turn authority, an animation command callback, or controller state. |
| **Turn-coin motion profile** | The version-1 deterministic plain-data profile for the Modern 3D turn-indicator transition. It contains only profile identity plus path, rotation, landing, and shadow values; endpoints, direction, texture, current turn, and sequence remain application-owned. Its applied value persists separately under `purett.turnMarkerMotion.v1`. |
| **Turn-coin transition** | The renderer-local Phase 0.14 motion accepted only after an already initialized surface receives a later descriptor sequence at a different Legacy endpoint. It moves the same circular marker through authored screen-space path, height, local-X/local-Y/local-Z rotation, shadow, and exact flat settlement without changing the Legacy marker or match. |
| **Legacy game cover** | The existing page-lifetime `gh.cover` Raphael instance. It owns the live left and right images, `isopen` target state, current animation, full-stage input shielding, every public `open()` and `close()` callback, and all timing-dependent application continuation behavior. Phase 0.15 does not transfer any of that authority. |
| **Modern game-cover projection** | The independent Phase 0.15 Three.js surface that mirrors cloned Legacy cover presentation in a 755 by 562 full-stage host while Modern is effective. It is decorative, owns no callback or application state, and fails independently to the intact Legacy cover. |
| **Game-cover descriptor** | The monotonic cloned Phase 0.15 plain-data record containing `schemaVersion`, sequence, target, observation timestamp, duration, easing, exact frame, and two exact panel descriptions. It contains no Raphael element, Three.js object, DOM node, callback, timer handle, function, request, or game object. |
| **Cover leaf** | One physical Phase 0.15 Modern panel. The left leaf uses the live left image and pivots around x `0`; the right leaf uses the live right image and pivots around x `754`, the outside edge of its exact logical rectangle. Their inner edges rotate away from the center seam to the fixed 112-degree open pose. |
| **Application continuation authority** | Ownership of when and how an existing callback advances menu, game-wrapper, tutorial, replay, early-exit, or game-over flow. For Phase 0.15 this authority remains exclusively with Legacy `gh.cover`; Modern presentation completion has no continuation semantics. |
| **Authoritative cover-open settlement** | The Phase 0.16 observation emitted only from the current Legacy left-panel opening completion after `#game-cover` is hidden. It identifies the accepted cover presentation sequence and monotonic completion timestamp. It is not the synchronous public `open()` callback, a Modern-cover animation completion, a new continuation, or ownership of application flow. |
| **Match-hand entrance presentation** | A plain renderer-facing Phase 0.16 descriptor containing schema version, monotonic entrance sequence, state (`stacked`, `fanning`, or `settled`), cover sequence, and start timestamp. It contains no card authority, renderer object, Legacy object, callback, rule, target, or request. |
| **Match-hand stack** | One Phase 0.16 transient pile per side at that hand's existing fifth/bottom-slot center. Every current card shares that center and a neutral table pose; hand index `4`, which remains at that slot after expansion, has the highest normal hand render order and is therefore the visible top card. |
| **Match-hand fan** | The deterministic Phase 0.16 renderer-local expansion that leaves hand index `4` fixed and moves indices `3`, `2`, `1`, and `0` upward from beneath it into their unchanged canonical vertical positions with mirrored lateral arc, lift, pitch, yaw, and roll. It is presentation only and is unrelated to legal-card selection or gameplay hand mutation. |
| **Flat-table perspective calibration** | A constrained head-on perspective projection whose settled cards retain the established screen rectangles and centered, position-neutral silhouette. Outer cards must not fan, lean, shear, or appear to rest on a curved surface merely because they are away from camera center. |
| **Approved visual baseline** | A named recipe and reference capture that passed real-time review at the actual application size in addition to deterministic, lifecycle, and geometry checks. Structural test success alone does not confer this status. |
| **Requested mode** | The value selected and persisted by the user. |
| **Effective mode** | The mode currently presented to the user and permitted to own active-match pointer input. During the temporary Phase 0 bridge, the hidden Legacy implementation may remain mounted and synchronized even while Modern is effective. |
| **Renderer host** | The positioned 693 by 500 DOM mount occupied by the effective renderer. |
| **Outer UI** | Menus, cover, dialogs, deck editor, shop, endgame, title, footer, and other application UI outside the active-match renderer. The five-card lobby preview and Phase 0.15 game-cover projection are narrow rendering exceptions; their surrounding application UI remains Outer UI. |
| **Snapshot** | A renderer-neutral description of the current visible match state. |
| **Semantic action** | A renderer-emitted intent such as selecting a card or dropping it on a slot, expressed without a Raphael or Three.js object. |
| **Transition** | A renderer request such as lifting, moving, revealing, or flipping a card whose completion can be awaited. |
| **Parity** | Equivalent game information, interaction results, and control-flow completion. It does not require pixel identity where intentional 3D treatment is approved. |
| **Safe boundary** | A point at which a renderer can later be disposed, reconstructed, or given playable input without interrupting a drag, transition, request, dialog, review step, timer, or state mutation. Phase 0 does not reconstruct renderers when switching; it changes only presentation and pointer gating. |

The implementation should prefer **active-match renderer**, **board renderer**, or **card surface** over **canvas layer**. Raphael currently produces SVG while Three.js will produce a WebGL canvas; the abstraction should describe its responsibility rather than one implementation technology.

## 6. Recorded architectural and product decisions

These decisions are part of the baseline requirements.

| ID | Decision |
|---|---|
| DEC-001 | The long-term modernization applies to the active-match surface; Phase 0.5 additionally authorizes one bounded, non-playable lobby-hand preview as a lower-risk renderer validation slice. |
| DEC-002 | Raphael remains loaded and available to the rest of the application. |
| DEC-003 | Legacy graphics remain a supported user-selectable mode for the foreseeable future. Removal would require a separate, explicit decision and project. |
| DEC-004 | Three.js is the recommended and provisionally selected Modern rendering library, subject to the Phase 2 feasibility gate. |
| DEC-005 | The proposed initial production renderer is Three.js `WebGLRenderer` with WebGL 2. WebGPU is not a launch requirement. |
| DEC-006 | Modern dependencies are version-pinned, built ahead of time, and served from the same origin. Runtime CDN imports are prohibited. |
| DEC-007 | The server protocol, rules engine, AI, persistence, and authoritative validation do not branch by renderer. |
| DEC-008 | Only one active-match renderer may own player input. After renderer extraction, only one active-match renderer may also own match animation. Phase 0 temporarily permits hidden Raphael animation/state synchronization behind an input-inert Modern presentation surface. |
| DEC-009 | Phase 0 Modern mode is an explicitly labeled, non-playable preview. |
| DEC-010 | Legacy is the default until Modern passes the playable-parity and reliability gates. |
| DEC-011 | During Phase 0, the Graphics control changes effective presentation immediately at runtime. Legacy remains mounted and synchronized, so returning to Legacy reveals the identical current state without reload or reconstruction. This is not authorization for renderer disposal/reconstruction or playable-input hot swapping during in-flight work. |
| DEC-012 | Graphics preference is browser-local UI state, not authoritative account or game data. |
| DEC-013 | The Modern canvas cannot be the sole accessible representation of cards or actions. Semantic DOM support is required before Modern becomes the default. |
| DEC-014 | The Modern renderer should render on demand while idle rather than maintaining an unconditional animation loop. |
| DEC-015 | Card art is loaded only as required by the current match and cached under an explicit resource policy. The full card catalog is not uploaded to the GPU at startup. |
| DEC-016 | Animation completion may sequence presentation and controller work, but visible animation may never calculate game rules or become the source of final state. |
| DEC-017 | A local release/configuration kill switch must be able to force effective Legacy without erasing a stored Modern request. |
| DEC-018 | Phase 0 pins and self-hosts Three.js `0.185.1` (`r185`) in an isolated lazy-loaded bundle. Legacy startup must not request or evaluate that bundle. |
| DEC-019 | Phase 0 Modern mode is a temporary presentation/input gate: active-match Raphael remains mounted and synchronized but is opacity-hidden, `aria-hidden`, and pointer-blocked. The original Phase 0 Three.js surface was blank and pointer-inert; Phase 0.10 supersedes only that blank-frame clause with passive current-hand projection while preserving the same gate and zero gameplay input ownership. |
| DEC-020 | Phase 0.5 renders only the five non-interactive lobby/main-menu hand cards with Three.js. It does not render an in-match player hand and does not convert the lobby command bar or navigation. |
| DEC-021 | The Phase 0.5 Modern lobby-hand baseline used a dedicated 755 by 562 orthographic surface, existing same-origin card-face assets, the established five card positions, and no picking or interaction handlers. This remains the historical Phase 0.5 record rather than the Phase 0.6 camera or material decision. |
| DEC-022 | Each Legacy lobby card receives a hand-specific presentation class. The Modern-ready gate may hide only those card elements; it must never hide the shared `gh.menu` Raphael paper, its bar, or the DOM command controls. |
| DEC-023 | During an explicit same-page switch, the lobby hand remains Legacy-visible until all required Modern card textures have loaded and the first complete frame is ready. A restored valid Modern preference is the narrow startup exception: a pre-paint marker masks only the retained Raphael hand until the normal Modern-ready gate takes ownership. Any initialization, texture, or context failure removes either gate and restores effective Legacy without altering game or account data. |
| DEC-024 | Phase 0.6 supersedes DEC-021 only for the ready Modern lobby-hand surface. It uses five canonically flat settled cards, a constrained perspective camera calibrated to preserve the established pixel-space layout with 450/900 clip planes, a flat-table position-neutral projection, unlit sRGB face art with mipmapped anisotropic filtering, a side-only lit slab separated from each face by 0.2 logical units, independently controllable lift-only analytic contact shadows with shared geometry and texture and hardware shadow mapping disabled, and one decorative same-direction local-X turn from zero to `-2π` after each accepted primary card click. It does not authorize drag, selection, keyboard gameplay, match input, or interaction elsewhere in the application. |
| DEC-025 | The Phase 0.6 back is the existing canonical same-origin asset `/images/cards/cardBack.png`, shared by every lobby card. It has no user-color, opponent-color, ownership, or purchased-card variant. |
| DEC-026 | Each Modern lobby card owns an independent re-entry lock while its bounded animation is active. A repeated activation of that same card is ignored and cannot queue work until its exact settlement; any other settled card remains eligible, so up to five cards may animate concurrently. |
| DEC-027 | The lobby renderer uses one demand-driven scheduler with at most one pending `requestAnimationFrame` callback to advance every active card animation. Legacy selection, lobby hide, hand or surface replacement, disposal, and WebGL context loss atomically invalidate all active animations, release every per-card lock, stop the shared frame request, hide every analytic shadow, and restore deterministic settled state without waiting for motion to finish. |
| DEC-028 | The Phase 0.6 lobby is a flat table viewed head-on. Lift and settlement introduce exactly zero auxiliary pitch, yaw, and roll; only the approved continuous local-X turn changes card orientation. Because a single perspective camera otherwise gives rotated off-axis planes an opposite lateral lean at the left and right slots, each card uses a face-anchored projection neutralizer outside its rotation hierarchy. The neutralizer preserves perspective enlargement and centered foreshortening while translating the same normalized silhouette to every slot, and it resets to its canonical zero-lift state on settlement and every reusable cancellation path. |
| DEC-029 | Phase 0.7 owns one seeded `casual-drop-left` batch per menu presentation. The pure planner derives an art-directed human release phrase and samples a correlated motion variant, launch impulse, ballistic height, tilt, path, timing, contact, and skid once for each caller-supplied destination and stable seed; the sampler never owns lobby coordinates, Raphael nodes, or game state. |
| DEC-030 | Arrival and click effects share the lobby surface's sole demand-driven frame scheduler and per-card animation map, but keep separate diagnostics and completion counts. A presentation token is consumed once, reduced motion skips travel, and every lifecycle cancellation restores exact settled state. |
| DEC-031 | `casual-drop-left` uses one compact left-hand packet and an intentionally irregular two-burst cadence rather than a spatial sweep or equal release gaps. Cards may cross in screen projection when their 3D height produces an unambiguous over/under relationship; motion planning must not serialize them merely to keep every polygon disjoint. Every pose retains physical local-card perspective but applies the established flat-table off-axis neutralizer so camera-center lean cannot recreate the rejected radial/curved-surface appearance. Flight uses analytic gravity, and contact is a monotonic `flight` → `slap` → `slide` sequence whose translation follows one continuous constant-deceleration curve with no second kick, bounce, end oscillation, or overshoot. |
| DEC-032 | The currently deployed Phase 0.7 lobby scatter failed `AC-P07-003` because it reads as flat left-to-right sliding rather than cards dropped by a player. It is not an approved visual baseline, and none of its artistic constants may be treated as approved defaults for another surface. |
| DEC-033 | Phase 0.8 introduces a one-card Motion Studio before another five-card choreography iteration. The immediate goal is authoring and approval of one reusable motion function, not automatic multi-card randomization or production promotion. |
| DEC-034 | The Motion Studio owns an isolated Three.js study surface. Opening or closing it must not call the Graphics-mode setter, rewrite the stored requested mode, replace the effective renderer, or alter the current lobby hand. |
| DEC-035 | Studio recipes are deterministic, renderer-neutral, versioned plain data. Given the same recipe, seed, destination, and normalized time, the sampled pose must be identical regardless of frame cadence or authoring UI state. |
| DEC-036 | Studio draft persistence is browser-session-local and non-authoritative. Import and export are explicit user actions; no draft is sent to a server, attached to an account, or silently promoted into application defaults. |
| DEC-037 | The Studio uses the actual lobby card dimensions, face/back assets, thickness model, perspective camera, and flat-table coordinate convention by default so a promising study is not an artifact of an unrelated camera or mock card. |
| DEC-038 | A motion recipe becomes a shipped or source-controlled production baseline only after a normal-speed, actual-size reference review explicitly approves it. Numeric safety, deterministic sampling, automated tests, and Phase 0.9 browser-local application are necessary evidence but cannot substitute for that review. |
| DEC-039 | Phase 0.9 is the explicit integration phase that supersedes Phase 0.8's prohibition on applying a Studio draft to the lobby. Its authority is limited to the browser-local Modern lobby motion playbook and does not extend to the shop, active match, account, server, or source-controlled defaults. |
| DEC-040 | The playbook exposes five independently editable intro targets, numbered left to right. Each target lands exactly on its current application-owned lobby slot; resolved anchor coordinates, card identity, texture, and layout are not serialized in the playbook. |
| DEC-041 | The exit is one shared `Gentle Wind` application target rather than five unrelated authored exits or one identical trajectory copied five times. One sequence seed creates a shared gust and stable per-slot bounded variants with distinct lower-left fully offscreen endpoints. Randomness is sampled once when compiling the batch and never per frame. |
| DEC-042 | Play, Shop, Tutorials, Replay, and Deck use the same generic Modern lobby exit choreography. The command's destination does not change the card paths. The original command continuation runs exactly once after the batch completes or its fail-open watchdog expires. Additional lobby-command activations are ignored while that continuation is pending. |
| DEC-043 | Tutorials Back is a lobby re-entry rather than a full menu reconstruction, so it explicitly replays the current five-card intro through the production playbook path when Modern lobby rendering is available. |
| DEC-044 | `Apply & Preview in Lobby` persists the complete validated playbook, closes the Studio, and runs the selected intro or exit through the production lobby renderer. If Legacy is selected, the preview may activate Modern temporarily without writing or replacing the stored requested Graphics preference; afterward it restores the prior mode and reopens the Studio. |
| DEC-045 | The complete playbook uses guarded versioned `localStorage` and supports canonical whole-playbook import/export. Studio view state may remain session-local. Malformed, unsafe, or future-version playbooks fall back or fail atomically without affecting Graphics preference or application startup. |
| DEC-046 | Phase 0.9 intro and exit choreography is Modern-only. Legacy commands and Legacy lobby presentation retain their existing behavior and must never wait for, render, or depend on the Three.js playbook. |
| DEC-047 | A valid persisted Modern request is resolved in the document head before first paint. It does not skip Raphael construction, hide the shared menu paper, or claim Modern is effective early; it only prevents the five retained Legacy lobby cards from being visually or accessibly exposed during lazy Modern startup. The startup marker survives early active-surface initialization until the first complete lobby-hand frame and fails open synchronously through the existing Legacy fallback path. Once the lobby hand is presented, a six-second coordinator watchdog also fails open if a bundle or required texture request stalls without producing a load or error event; a late completion from that timed-out attempt cannot reactivate Modern without a newer explicit selection. |
| DEC-048 | Phase 0.11 supersedes Phase 0.10's active-match pointer-passive clause only for a card-bounded renderer-local pickup/follow study on the player hand. The hidden Legacy surface remains pointer-blocked, opponent cards and empty board space cannot be picked up, and Modern still emits no semantic match action. |
| DEC-049 | The Phase 0.11 active-match study uses a calibrated constrained perspective camera and flat-table projection. Every settled hand card must preserve its Phase 0.10 anchor, projected 117 by 146 dimensions, centered silhouette, zero local-X/local-Y/local-Z rotation, and deterministic overlap without a position-dependent fan or curved-surface appearance. This is motion-study evidence and does not settle the final playable-camera decision before Phase 2. |
| DEC-050 | One accepted primary click establishes at most one renderer-local hold. The card is brought to the front and raised until its settled-orientation projected scale is `1.075` relative to rest, matching the Legacy pickup enlargement. The original grab offset is preserved while the pointer moves; the card must not snap its center to the pointer. |
| DEC-051 | Phase 0.11 movement tilt is derived from logical pointer velocity, not absolute board position or random per-frame values. Horizontal and vertical travel produce bounded trailing local-Y and local-X tilt respectively, filtered motion cannot expose the card back, and both axes damp back to zero while the pointer is stationary. No idle card, hand anchor, or camera may inherit the held card's transient tilt. |
| DEC-052 | Phase 0.11 deliberately implements no click-to-drop, drop-zone picking, legal-target highlight, return-to-hand path, controller selection, `gh.game.dragging` mutation, turn gating, move request, or network authority. While one card is held, every further card or background activation is ignored and never queued. Lifecycle cancellation discards the transient pose and restores or disposes the renderer projection without a gameplay consequence. |
| DEC-053 | Reduced motion preserves the renderer-local study without inertial choreography: pickup becomes immediate, pointer-follow remains available, and velocity-driven tilt is suppressed. Mode change, match/lobby transition, hand revision, selected-card removal, visibility suspension, context loss, surface replacement, and disposal must clear the hold, listener ownership, and pending frame atomically. |
| DEC-054 | The Phase 0.11 generated Modern artifact retains Three.js `0.185.1` (`r185`) and uses the cache identity `0.185.1-match-pickup.2`. Source, generated bundle, loader URL, DOM dataset, diagnostics, and static contract must agree on that identity. |
| DEC-055 | Phase 0.11 visual review accepted the pickup and follow mechanics but found the original resistance cue too subtle because its velocity impulse expired before the rendered card approached the authored tilt. Normal motion therefore uses a visibly pronounced but bounded response: ordinary brisk travel can reach `10` degrees per local axis, the full-response velocity scale is `450` logical pixels per second, a sampled impulse remains current for `80` milliseconds, and the velocity/tilt filters respond at `18` with non-oscillating velocity decay at `12`. Position follow, lift, grab-point preservation, reduced-motion behavior, and the no-drop boundary remain unchanged. |
| DEC-056 | Phase 0.12 preserves Phase 0.11 as the historical pickup/follow baseline and supersedes only its no-second-click and no-return clauses. An armed second primary click always begins a renderer-local invalid return; it is not a valid drop, cancel intent, or semantic action. |
| DEC-057 | Phase 0.12 defines zero Modern drop zones. The second click does not raycast or classify the held card, player hand, opponent hand, board, future slot, or empty space. Every armed second click has the same invalid-return result, and no legal-target, hover, placement, or request path exists. |
| DEC-058 | The visible invalid return duplicates the live Legacy invalid-return timing character without inheriting its random residual angle: duration is 300 milliseconds, normalized progress uses cubic-out `1 - (1 - t)^3`, and the card performs one clockwise screen-space turn. In Three.js's world convention the turn is represented by `-2π` local-Z radians. Completion resets position, depth, projected scale, local-X/local-Y/local-Z rotation, shadow, render order, and pickup eligibility to the captured canonical hand pose exactly. |
| DEC-059 | Pickup must arm the second-click return only after its 300-millisecond lift reaches full held depth. Pointer-follow or resistance damping may still be converging, and delivery of the next animation-frame callback must not delay arming beyond the elapsed Legacy-equivalent lift interval. A second click before arming is ignored and never queued. Once return starts, pointer movement and later clicks are locked out until exact settlement; they cannot restart, retarget, replace, or queue work. |
| DEC-060 | Phase 0.12 return state and frames belong to the current monotonic hold generation. Mode or view change, hand revision, selected-card removal, visibility loss, context loss, suspension, replacement, fallback, or disposal invalidates that generation, cancels the sole pending frame, and resets or discards the transient pose atomically. A late callback cannot advance a newer hold. Lifecycle reset is immediate and does not replay the visible return. |
| DEC-061 | Reduced motion preserves the second-click outcome but removes continuous return travel and spin. An armed second click commits the exact canonical hand pose immediately, records one completed reduced-motion return, releases the lock, and owns no pending frame. |
| DEC-062 | Phase 0.12 continues to emit zero semantic actions, gameplay mutations, and requests. It cannot call or mirror `gh.game.grab`, `gh.game.drop`, `dragging`, `isDroppable`, turn state, board state, hand order, Legacy node attributes, dialog/review state, request payloads, or callbacks. |
| DEC-063 | The Phase 0.12 generated Modern artifact retains Three.js `0.185.1` (`r185`) and uses the current cache identity `0.185.1-match-return.1`. Source, generated bundle, loader URL, DOM dataset, diagnostics, browser/static contracts, and deployment artifact must agree. Phase 0.11's `0.185.1-match-pickup.2` remains its historical identity. |
| DEC-064 | Phase 0.13 preserves Phase 0.12 as the historical always-invalid baseline and supersedes only its zero-drop-zone/location-independence boundary. A second click outside a currently valid zone still uses the unchanged Phase 0.12 invalid return. A second click inside the carried card's currently valid zone may begin one renderer-local placement preview and is still not a semantic or authoritative drop. |
| DEC-065 | The temporary bridge may expose exactly nine plain board-rectangle descriptions in 693 by 500 logical coordinates. Their Legacy geometry is fixed at top-left x values `172`, `289`, and `406`; y values `35`, `181`, and `327`; width `117`; height `146`; and corner radius `10`, indexed left-to-right and top-to-bottom from `0` through `8`. A zone is fail-closed valid only when its slot is empty, the Legacy board input gate is enabled, it is the player's turn, and game-over or review state does not suppress play. The Modern surface must not derive or broaden legality from card values or rules. |
| DEC-066 | While one card is carried, at most one valid-zone hover shadow may be visible. It is the exact Legacy black rounded rectangle with no stroke and opacity `0.3`; every non-hovered, occupied, unavailable, invalid, or out-of-bounds zone is fully invisible. Hover may appear during the pickup lift, matching Legacy's drag-time feedback, but placement remains unarmed until the retained 300-millisecond pickup boundary. Half-open logical rectangle hit testing prevents two adjacent zones from winning one point. |
| DEC-067 | A valid placement reverses the current pickup presentation rather than reusing the Phase 0.12 full-turn invalid return. Over 300 milliseconds with cubic-out `1 - (1 - t)^3`, the current visible center moves to the exact slot center, projected scale moves to `1`, depth moves to table depth `0`, and local-X/local-Y tilt moves to `0`. There is no position jitter, overshoot, full spin, or camera movement. |
| DEC-068 | Human placement variance is exactly one screen-space residual Z roll sampled once at acceptance from the Legacy interval `[-2°, 2°]`. In the Three.js y-up convention, the local-Z sign is the inverse of the sampled Legacy screen angle. The sampled endpoint remains fixed for the full animation and settled preview; randomness is never sampled per frame. |
| DEC-069 | Phase 0.13 accepts at most one renderer-local placement preview for one unchanged hand/drop-zone presentation snapshot. Completion leaves that card visible, front-facing, inert, and settled above the slot at the exact center and sampled roll. Further pickup or placement input is ignored until a hand/drop-zone revision or lifecycle reset restores canonical hand projection. This constraint mirrors one card per turn without claiming or changing turn authority. |
| DEC-070 | Phase 0.13 placement, hover, counters, and random sample remain disposable Modern-surface state. Mode/view change, visibility loss, hand or drop-zone revision, selected-card removal, context loss, suspension, replacement, fallback, and disposal clear the hover and placement preview atomically and generation-guard late frames. Reduced motion commits the same exact center, scale, depth, tilt, and sampled-roll endpoint immediately. No path calls or mirrors Legacy `grab`/`drop`, mutates game, board, hand, turn, or controller state, emits a semantic action, or submits a request. |
| DEC-071 | The Phase 0.13 generated Modern artifact retains Three.js `0.185.1` (`r185`) and uses cache identity `0.185.1-match-placement.1`. Source, generated bundle, loader URL, DOM dataset, diagnostics, browser/static contracts, and deployment artifact must agree. Phase 0.12's `0.185.1-match-return.1` remains its historical identity. |
| DEC-072 | Phase 0.14 preserves the full Phase 0.13 card pickup, follow, invalid-return, hover, placement-preview, and zero-authority behavior. It supersedes only Phase 0.13's absent-Modern-turn-indicator statement and current cache identity by adding one renderer-local turn-marker projection. |
| DEC-073 | The turn-indicator bridge is an explicit plain descriptor `{sequence, side, x, y, width, height, textureUrl, visible}`. Legacy initializes sequence `0` at top-left `(327, 420)`, center `(347.5, 440.5)`, then targets player top-left `(33, 420)`, center `(53.5, 440.5)`, or opponent top-left `(621, 420)`, center `(641.5, 440.5)`. Every marker rectangle is exactly 41 by 41. |
| DEC-074 | Legacy chooses `/images/dime-heads.png` when the player initially owns the turn and `/images/dime-tails.png` otherwise, then moves that same chosen image between sides. Phase 0.14 accepts only those two existing same-origin 41 by 41 assets and applies the descriptor-selected image to both 3D coin faces. It does not alternate artwork during flips or infer a heads/tails result. |
| DEC-075 | A surface's first valid descriptor snaps directly to its described settled endpoint and never replays an earlier turn. A later transition requires a newer sequence and changed endpoint. Duplicate, stale, same-sequence, or same-target delivery cannot replay motion. A newer accepted sequence during motion supersedes from the currently rendered pose without a visual jump and makes the prior generation inert. |
| DEC-076 | The Phase 0.14 marker is a true 3D circular object: two 41-diameter, 64-segment face circles separated around a three-unit, 64-segment open cylindrical edge. Face art is unlit sRGB; the metallic edge alone is lit. Deterministic local-X tumble, local-Y flip, local-Z spin, physical height, perspective, and a height-responsive analytic shadow must expose the edge during flight and settle on the table without a position-dependent curved-surface skew. |
| DEC-077 | Turn-coin motion is produced by one versioned DOM-free and Three.js-free profile/planner/sampler. The profile contains exactly identity/label, path curve/apex/flight, flip/tumble/spin/contact tilt, settle duration, and shadow strength/spread. It contains no target coordinates, texture, direction, turn value, sequence, callback, renderer object, or gameplay authority. Planning is deterministic and horizontal direction is mirrored from application-owned endpoints; no random value is sampled. |
| DEC-078 | Phase 0.14 is presentation only. The descriptor copies the already-decided Legacy turn display; Modern must not inspect or set `isMyTurn`, `turns`, board enablement, hand playability, opponent scheduling, Legacy marker attributes, callback timing, scores, rules, game state, requests, or navigation. Coin completion cannot gate or invoke the existing Legacy turn continuation. |
| DEC-079 | Motion Studio adds only the application target `Match turn coin — Transition`. Its coin preview uses the exact active-match 693 by 500 logical viewport inset at `(30, 30)` within the 755 by 562 Studio stage, the same 40-degree perspective calibration, 41-by-41 coin, three-unit edge, approved face asset behavior, locked player/opponent centers, production profile normalization, planner, and sampler. The direction control may reverse preview travel but cannot edit or persist application endpoints. |
| DEC-080 | The normalized applied turn-coin profile persists in `localStorage` under `purett.turnMarkerMotion.v1`, separate from `purett.graphicsMode.v1` and `purett.lobbyMotionPlaybook.v1`. Invalid, unsafe, or future-schema data falls back atomically to the application default without changing either other key. Studio session draft/view state may remain under its existing session key. No coin profile is account-synchronized, submitted, or promoted to source defaults implicitly. |
| DEC-081 | Reduced motion snaps an accepted later sequence immediately to the same latest settled endpoint with no flight, rotation, or pending frame. Mode/view change, descriptor removal, visibility loss, context loss, suspension, replacement, fallback, and disposal cancel the current coin generation, settle or discard the latest descriptor as appropriate, detach ownership, and make every late callback inert. |
| DEC-082 | The Phase 0.14 generated Modern artifact retains Three.js `0.185.1` (`r185`) and uses cache identity `0.185.1-match-turn-coin.1`. Source, generated bundle, loader URL, DOM dataset, diagnostics, browser/static contracts, Motion Studio contracts, deployment artifact, and this document must agree. Phase 0.13's `0.185.1-match-placement.1` remains historical evidence. |
| DEC-083 | Phase 0.15 narrowly supersedes the earlier `gh.cover` exclusion by authorizing one parallel Modern projection. The existing Raphael cover remains constructed, mounted, animated, and authoritative in both graphics modes; Phase 0.15 does not replace or dispose it and does not authorize another Outer UI migration. |
| DEC-084 | The closed Modern cover reproduces the live Legacy geometry exactly: a 755 by 562 logical stage, `/images/left.png` at `(0, 0, 377, 562)`, and `/images/right.png` at `(376, 0, 378, 562)`. The one-pixel overlap and right-over-left seam order are preserved rather than normalized. |
| DEC-085 | The Modern representation is two true 3D leaves hinged on the outer vertical panel edges. The left pivot is x `0`, the right pivot is x `754`, and the leaves' inner edges rotate toward the camera and away from the center seam to a fixed 112-degree open angle. Translation-only, scale-only, CSS, billboard, backward-folding, center-seam-hinged, curved-surface, or single-lid substitutes do not satisfy this decision. |
| DEC-086 | Modern opening lasts exactly 2,000 milliseconds and uses deterministic cubic-in `t^3`; Modern closing lasts exactly 2,000 milliseconds and uses deterministic cubic-out `1 - (1 - t)^3`. Both are sampled from explicit source and destination poses, contain no randomness, and settle at exact endpoints with zero idle frame. |
| DEC-087 | Legacy remains the sole application continuation authority. Its current open callback remains synchronous after Legacy schedules opening; its normal close callback remains owned by the Legacy left-panel completion after the existing 2,000-millisecond close; already-targeted and interrupted Legacy calls retain their existing behavior. Modern never invokes, delays, awaits, replaces, suppresses, or duplicates any callback and never becomes a prerequisite for application flow. |
| DEC-088 | The Modern cover uses an independent full-stage surface and lifecycle rather than the 693 by 500 active-match surface. This is required because early exit and game over deactivate active-match Modern presentation before calling Legacy close. Mode, lobby, match, tutorial, replay, cover, and failure transitions may therefore update the cover projection without reconstructing or reactivating the match surface. |
| DEC-089 | The Legacy cover remains the visible fallback until both approved cover textures and one complete Modern cover frame are ready. A Modern initialization, texture, context, rendering, timeout, replacement, or disposal failure reveals or retains the intact independently running Legacy cover atomically; a late load or frame cannot reclaim presentation without a newer valid generation. |
| DEC-090 | Reduced motion snaps only the Modern cover projection to the latest target pose with no continuous rotation or pending frame. It does not shorten, complete, reschedule, or otherwise change the Legacy cover animation, callback timing, `isopen`, full-stage input shield, or application continuation. |
| DEC-091 | The Modern cover canvas is decorative and inaccessible: `aria-hidden`, absent from tab order, without a role, live announcement, keyboard action, or semantic pointer handler. The Legacy cover or an equivalent non-Modern layer remains the input shield for exactly the existing lifecycle interval. Full-stage ordering preserves game wrapper below cover and menus, dialogs, loading, endgame, deck, and shop above it as applicable. |
| DEC-092 | The Phase 0.15 cover component retains cache identity `0.185.1-game-cover-hinge.1` in its source registration, cover facade/ABI, cover DOM metadata, diagnostics, and component contracts. That value was also the composite generated-artifact, coordinator-URL, and deployment identity while Phase 0.15 was current. A later phase may supersede only those singular outer delivery identities while continuing to expose the cover component identity; Phase 0.16 does so with `0.185.1-match-hand-fan.1`. Three.js remains `0.185.1` (`r185`), and Phase 0.14's `0.185.1-match-turn-coin.1` remains historical evidence. |
| DEC-093 | Phase 0.16 preserves every canonical hand rectangle and all Phase 0.13 card behavior after entrance settlement. It adds only a renderer-local initial pile and expansion; it does not alter `describeMatchHands()`, hand ordering, card identity, secrecy, board state, or the Legacy hand. |
| DEC-094 | Each side's pile is anchored at its current last/fifth card center: player `(86.5, 311)` and opponent `(608.5, 311)` for the standard five-card fixture. Hand index `4` remains stationary and paints above indices `0` through `3`; no new random stack offset, curved-table skew, camera fan, or canonical-coordinate mutation is permitted. |
| DEC-095 | The release trigger is the actual current Legacy left-panel open completion after the parent has been hidden. The synchronous `gh.cover.open(callback)` continuation remains unchanged and cannot start the hand fan. Modern cover completion cannot start it. The settlement notification is a fresh plain observation and has no continuation authority. |
| DEC-096 | One renderer-neutral deterministic planner and sampler owns the fan. For a five-card hand, moving cards use 620-millisecond cubic-out travel, 55-millisecond reveal staggering, and a total batch duration of 785 milliseconds. Reveal order is `3`, `2`, `1`, `0`; both sides share vertical timing and mirror only bounded lateral, yaw, and roll signs. No random value or frame-to-frame integration is used. |
| DEC-097 | The Modern surface may accept a `stacked`, `fanning`, or `settled` descriptor. `stacked` shows the two piles and blocks input. `fanning` samples from the authoritative settlement timestamp, blocks input, and normalizes exactly at completion. `settled` takes the canonical pose without replay. Duplicate descriptors and completed entrance sequences cannot replay motion. |
| DEC-098 | The fan is released only when the complete active-match Modern presentation is ready at the authoritative cover-open settlement. If Legacy presentation is still exposed because the Modern hand, turn coin, surface, or bundle is not completely ready, Phase 0.16 selects `settled` rather than later replacing visible canonical Legacy hands with a delayed Modern pile or partial fan. Reduced motion uses the same direct terminal result. |
| DEC-099 | Mode/view change, hand replacement, visibility suspension, context loss, surface suspension, fallback, replacement, and disposal cancel the hand-entrance generation, clear its sole frame, settle or discard renderer-local transforms as appropriate, and make late callbacks inert. Pickup, follow, return, hover, placement, and related card input remain disabled for the entire blocking entrance. |
| DEC-100 | The Phase 0.16 generated Modern artifact retains Three.js `0.185.1` (`r185`) and uses cache identity `0.185.1-match-hand-fan.1`. Source, generated bundle, facade/ABI, coordinator URL, diagnostics, static/browser contracts, deployment artifact, and this document must agree. The independently delivered Phase 0.15 cover retains `0.185.1-game-cover-hinge.1` as its component identity. |

## 7. Goals

### 7.1 Product goals

- Give the player an explicit, understandable choice between Modern and Legacy active-match graphics.
- Preserve the present game as a reliable escape hatch and historical experience.
- Provide an early, low-risk visual proof by rendering the familiar five-card lobby hand and exercising one bounded decorative 3D turn without treating it as match state.
- Make the Modern experience materially more expressive through controlled 3D card motion.
- Establish a convincing active-match card pickup, pointer-follow, invalid-return, valid-zone feedback, and humanly imperfect placement language before adding playable rule authority.
- Establish a clear Legacy-character invalid-return motion, exact valid-zone geometry, and intentionally askew placement preview without conflating either outcome with a submitted move.
- Add a physically legible Modern turn-indicator coin that mirrors the already-decided Legacy endpoint without conflating presentation with turn authority.
- Add a physically legible two-leaf Modern game cover that preserves the exact Legacy closed composition and application sequencing without transferring cover lifecycle or callback authority.
- Give the user direct, repeatable control over one-card motion authoring before another five-card lobby entrance is promoted.
- Let the user bind authored motion to visible lobby intro and exit consumers, evaluate it in finished application context, and retain the complete playbook locally.
- Let the user tune the Modern turn-coin profile in the exact active-match coordinate space and apply it locally without altering the lobby playbook or Graphics preference.
- Make visual approval an explicit gate rather than inferring it from deterministic or collision-safety tests.
- Allow the renderer to evolve without rewriting the server-side game.
- Keep a match resumable when the selected renderer is unavailable or fails.
- Avoid trapping the player on a blank, broken, or non-interactive surface.

### 7.2 Engineering goals

- Separate renderer-neutral state and control flow from Raphael handles.
- Define one semantic contract implemented by both renderers.
- Make renderer lifecycle explicit: mount, synchronize, activate, suspend, resize, and dispose.
- Make all animation/transition completion deterministic and testable.
- Represent authored card motion as versioned renderer-neutral data that can be sampled independently of Three.js and the authoring UI.
- Represent authored turn-coin motion as a separate versioned deterministic profile/planner/sampler whose application endpoints and turn sequence remain outside the stored profile.
- Represent fixed game-cover hinge motion with one pure deterministic planner/sampler whose presentation state remains subordinate to Legacy `gh.cover`.
- Compile application-owned lobby anchors and seeded five-card variance outside the stored recipes so layout and data remain authoritative.
- Centralize coordinate conversion and hit testing.
- Validate that one player card can preserve its grab point through every supported application scale while depth lift and velocity-driven tilt remain renderer-local.
- Ensure only one renderer and one set of input handlers is active.
- Provide renderer-neutral diagnostics and test snapshots.
- Add Modern code without requiring a broad rewrite of the legacy application.
- Validate same-origin card-texture loading, the historical Phase 0.5 orthographic layout, the Phase 0.6 calibrated flat-table perspective replacement, position-invariant projected silhouettes, color and orientation handling, disposal, and runtime fallback through the isolated lobby-hand slice.
- Preserve the existing same-origin security and self-contained deployment model.

### 7.3 Quality goals

- Keep Legacy behavior and regression coverage intact at every phase.
- Establish measurable performance and resource budgets during the Three.js spike.
- Support reduced motion.
- Recover from Modern initialization and WebGL-context failures.
- Fail the Modern cover projection independently without delaying or disrupting the Legacy cover or its continuation.
- Prevent event-listener, animation-frame, texture, material, geometry, and WebGL-context leaks.
- Maintain clear focus and keyboard semantics before Modern becomes the default.
- Permit precise normal-speed, slowed, frame-stepped, and scrubbed review of an authored motion without leaving an idle animation loop.

## 8. Non-goals

The following are outside this initiative unless separately approved:

- removing Raphael from the application;
- migrating the main-menu bar or commands, statistics, next-rules content, deck editor, shop, or endgame UI to Three.js; Phase 0.15 authorizes only the parallel `gh.cover` projection defined in Sections 11.20 and 12.18;
- replacing, unloading, stopping, disposing, or transferring application continuation authority away from the Legacy Raphael cover;
- changing Legacy `gh.cover.open()` or `gh.cover.close()` callback timing, duplicate-call behavior, `isopen` semantics, menu/game sequencing, or input-shield lifetime merely to simplify the Modern projection;
- adding a stored or Motion Studio-editable game-cover profile, randomized Modern cover motion, a center-seam hinge, a single horizontal lid, or another cover topology beyond the fixed Phase 0.15 two-leaf outer-edge design;
- making lobby-hand cards draggable, selectable, game-authoritative, or generally interactive; the Phase 0.6 click-to-double-flip renderer spike is the sole approved exception to Phase 0.5's no-interaction and no-animation boundary;
- treating the lobby-hand preview as an in-match player hand or using it to submit a move;
- changing the game rules, AI, scoring, rewards, economy, persistence, or move validation;
- changing opaque client/server protocol fields merely to make them easier to read;
- changing canonical card identities or image-key naming;
- redrawing the card catalog;
- redesigning the board frame in the initial parity work;
- adding physics simulation;
- treating the current Phase 0.7 lobby scatter, its five gesture constants, or its 1.09 perspective limit as an approved visual baseline;
- applying a Motion Studio draft beyond the explicitly approved Phase 0.9 lobby intro and Gentle Wind exit targets and the Phase 0.14 Modern match turn-coin profile, including any shop, card-gameplay, score, rule, or other active-match consumer, without another approval and integration phase;
- treating the Phase 0.11 renderer-local hold as card selection, drag state, a legal move, or reusable game authority;
- adding click-to-drop, board-slot hit testing, legal-target highlighting, invalid-drop return, card placement, or move submission to Phase 0.11;
- treating the Phase 0.12 second click as a valid drop, cancellation intent, slot query, controller input, or placement; Phase 0.12 authorizes only the documented always-invalid renderer-local return;
- treating the Phase 0.13 hover or settled placement preview as a semantic legal-target result, committed board occupancy, turn change, controller action, replay event, or submitted move;
- adding position jitter to Phase 0.13 placement; its only human variance is the once-sampled `[-2°, 2°]` residual screen-space roll at the exact slot center;
- treating the Phase 0.14 turn-indicator descriptor, coin endpoint, transition, or completion as turn authority, board enablement, opponent scheduling, callback sequencing, or a gameplay action;
- generating a new coin design, swapping heads/tails during motion, or using different face textures in Phase 0.14; both faces use the one existing Legacy-selected descriptor texture;
- storing Studio drafts in account, server, database, game, deck, shop, replay, analytics, or economy state;
- allowing the Studio to rewrite the user's persisted Legacy/Modern Graphics preference;
- building a freely navigable 3D room;
- adding WebXR or virtual-reality support;
- making WebGPU mandatory;
- adopting a full game framework for scenes, state, audio, input, and physics;
- loading dependencies or assets from a public CDN at runtime;
- adding external analytics or telemetry without separate approval;
- making mobile-responsive layout or touch-only support a prerequisite for the first desktop parity release;
- guaranteeing pixel-for-pixel identity between intentional 3D effects and the two-dimensional Legacy renderer;
- disposing, reconstructing, or transferring playable renderer ownership in the middle of an active drag, transition, request, or replay step during the initial implementation; the Phase 0 presentation/input gate is not such a transfer because the same Legacy controller and objects continue running.

## 9. Users and primary scenarios

### 9.1 Returning player preserving the original presentation

The player selects Legacy, starts or resumes any match, and receives the present Raphael behavior without functional or visual regression.

### 9.2 Player opting into Modern graphics

The player selects Modern in the existing dropdown. The application persists the choice, lazily loads Three.js if necessary, and switches the active-match presentation to the inert Three.js surface on the same page. When the lobby/main-menu viewport is visible, the same effective setting renders its five-card hand preview with Three.js while the bar and commands continue using their existing technologies.

### 9.2.1 Player viewing the Phase 0.5 lobby hand

The player reaches the main menu and sees Play, Shop, and Tutorials exactly as before. Beneath those commands, the five current hand card faces are drawn by Three.js at approximately the existing positions. They do not respond to pointer, keyboard, or touch input. Selecting Legacy swaps those five images back to their original Raphael presentation without changing the hand, starting a game, navigating, or reloading.

### 9.2.2 Player trying the Phase 0.6 lobby flip

With Modern effective and the lobby hand fully ready, the player clicks one card. That card rises above its settled plane, turns to show the canonical card back, turns again to show its original front, and settles at its original transform. While it moves, the player may click any other settled card and its independent sequence starts immediately; clicking the already-active card again is ignored and not queued until that card has settled. The hand, account, game, and server state are identical before and after every effect. Selecting Legacy or leaving the lobby interrupts all active effects immediately and exposes the unchanged Legacy presentation.

The five cards are flat and unshadowed before activation. The clicked card uses one smooth same-direction end-over-end turn rather than reversing after the back: it advances from local X zero through the upright back at `-π` to the upright original front at `-2π`, then returns to the same normalized flat resting transform.

### 9.2.3 User authoring one-card motion

From the existing application menu, the user opens Motion Studio without changing the current Legacy or Modern selection. The lobby remains intact behind an isolated workbench. The user chooses one of five left-to-right intro targets, the shared Gentle Wind exit, or the Phase 0.14 Match turn coin transition. Card targets retain their established lobby workflow. The coin target locks the exact player and opponent endpoints, lets the user choose only the direction being previewed, and exposes only the applicable path, physical-height, flip, tumble, spin, contact, settle, and shadow profile controls in an exact active-match-space inset. `Apply & Preview in Lobby` still applies only the complete lobby playbook; `Apply to Match Coin` saves only the separate local turn-coin profile and replays it in Studio. The user may export or atomically import the applicable versioned document. No action promotes either document to the shop, account, server, gameplay authority, or repository defaults.

### 9.2.4 Player leaving and re-entering the Modern lobby

With Modern effective, the player selects Play, Shop, Tutorials, Replay, or Deck. The five cards lift and drift toward five distinct lower-left offscreen endpoints as one coherent Gentle Wind gesture. The selected command waits for the sequence, ignores additional command clicks while pending, and then continues exactly once; a renderer failure or bounded watchdog cannot trap navigation. Returning from the Tutorials submenu through Back replays the five current intro entries into their fixed lobby slots. With Legacy effective, these routes behave exactly as before and do not wait for the Modern playbook.

### 9.2.5 Player trying the active-match pickup/follow study

With Modern effective in an active match and both hands ready, the player primary-clicks the exposed portion of one player-hand card. The visually topmost eligible card comes forward, rises from the flat table until it appears `1.075` times its resting size, and retains the exact point beneath the pointer where it was clicked. Thereafter the card follows pointer movement without requiring the mouse button to remain pressed. It tilts slightly opposite its direction of travel, then returns to a stable level lifted pose when movement stops. The other nine hand cards retain their exact settled flat-table projections.

The study intentionally ends there. Clicking a slot, empty board space, the held card, another player card, or an opponent card neither drops nor replaces the held card. No target is highlighted, no card returns along an invalid path, no turn or selection state changes, and no request is issued. Selecting Legacy or leaving/replacing the active surface clears the transient Modern hold and immediately reveals the unchanged live Raphael match.

### 9.2.6 Player trying the Phase 0.12 second-click return

Phase 0.12 preserves the first-click pickup and pointer-follow behavior above. Once the lift finishes and the hold is armed, the player clicks again anywhere in the active-match host. No Modern drop zones exist, so the click is not tested against the held card, either hand, the board, or a future slot. It always begins the same renderer-local invalid return.

The card stops following the pointer, gives up its promoted input state, and travels back to its original hand anchor over 300 milliseconds with cubic-out timing while making one clockwise screen-space turn. At completion it has exactly its canonical hand center, depth, projected scale, local-X/local-Y/local-Z rotation, render order, shadow state, and pickup eligibility. Additional clicks and pointer movement during that interval are ignored rather than queued. A click before the pickup is armed is also ignored.

This visible return is presentation only. It does not call the Legacy drop function, create or inspect a target, change either hand, move a Raphael node, set `dragging` or `isDroppable`, alter the turn or board, emit a semantic action, or issue a request. With reduced motion enabled, the same armed second click commits the exact hand pose immediately without continuous travel or spin. Selecting Legacy or crossing another lifecycle boundary resets the transient card atomically and makes every late callback inert.

### 9.2.7 Player trying the Phase 0.13 valid placement preview

Phase 0.13 preserves the pickup, follow, and invalid-return behavior above. While carrying the card, the player moves the pointer over one of the nine board rectangles. Only an empty rectangle that the current Legacy presentation gate marks valid appears, as the familiar black rounded shadow at 30 percent opacity. Leaving the rectangle hides it immediately. An occupied or currently invalid rectangle never appears.

After the hold is armed, the player clicks the visible shadow. The card stops following the pointer and eases down over 300 milliseconds to that rectangle's exact center and table depth, returning to projected scale `1` and zero pitch/yaw. It settles with a small once-sampled `[-2°, 2°]` screen-space roll so it resembles a human placement without drifting away from the grid. The settled card remains visible but inert. Because this is a renderer-only study, a second card cannot be preview-placed until a new hand/drop-zone snapshot or lifecycle transition restores canonical presentation.

The hover and settlement do not call Legacy `drop`, occupy the actual board, end a turn, remove a card from the live hand, dispatch a semantic action, or issue a request. Clicking outside a valid shadow continues to run the Phase 0.12 invalid return. Reduced motion commits the same exact zone center and sampled roll immediately.

### 9.2.8 Player observing and tuning the Phase 0.14 turn coin

With Modern effective in an active match, the player sees one circular 41-pixel turn marker at the exact location already selected by the live Legacy game. A newly opened or reconstructed Modern surface shows the current marker immediately without replaying how the turn arrived there. When a later Legacy turn-marker sequence changes sides, the coin visibly leaves the table, follows a curved path, exposes its metallic edge while flipping, tumbling, and spinning in true 3D, then settles flat at the opposite exact Legacy center. Both visible faces use the same dime image that Legacy selected for this match, so the physical turn never invents or communicates another heads/tails result.

The user may open Motion Studio, choose `Match turn coin — Transition`, select Player → AI or AI → Player, and tune the transition against the exact 693 by 500 match coordinate space. Applying saves only the normalized local coin profile. Returning to the match uses that profile on the next described side change. The Studio and production motion do not change whose turn it is, invoke or delay the Legacy turn callback, enable a board, move a card, or issue a request. With reduced motion enabled, each accepted side change appears immediately at its latest target.

### 9.2.9 Player observing the Phase 0.15 hinged game cover

With Modern effective, the player begins at the same exact closed cover composition used by Legacy. When the existing application starts a normal game or tutorial, the two cover leaves appear to swing away from their outside edges in real three-dimensional space, reaching a fixed 112-degree open pose while the current Legacy cover independently executes its established transition and control flow. On early exit, game over, or tutorial completion, the leaves return to the exact one-pixel-overlapped closed seam while Legacy alone decides when the application continuation runs.

The Modern cover is not clickable, focusable, editable in Motion Studio, or authoritative. Selecting Legacy reveals the existing Raphael cover and its current state. If the Modern cover cannot initialize, load both textures, render, or retain its WebGL context, the player continues through the intact Legacy cover without a blocked menu, game, callback, or request. With reduced motion enabled, only the Modern leaves snap visually; the Legacy transition and application timing remain unchanged.

### 9.2.10 Player observing the Phase 0.16 match-hand entrance

With Modern effective, the covered active-match surface prepares the player and opponent cards as two compact piles at their existing bottom-hand positions. The card that will remain in the bottom position is visibly on top of each pile. When the game box has fully opened and the existing Legacy cover removes its board shield, both piles expand upward into the familiar five-card vertical hands. The bottom cards remain fixed while the other cards emerge sequentially from beneath them through a restrained mirrored 3D lift.

The player cannot pick up a waiting or moving card. When both hands settle exactly, the existing Modern pickup behavior becomes available. Switching to Legacy reveals the unchanged live Raphael hands; the animation never rearranges a real hand or submits a move. If the complete Modern match presentation is not ready when the cover actually finishes, the player sees the canonical final hands rather than a delayed pile or partial replay.

### 9.3 Player returning from the Phase 0 preview

During the original Phase 0, the player selected Modern during an active match and saw a blank inert preview. Phase 0.10 replaces that blank frame with projections of the current player and opponent hands. Phases 0.11 through 0.13 add only the documented renderer-local card studies. Phase 0.14 additionally projects the current sequenced turn marker, Phase 0.15 separately projects the full-stage cover, and Phase 0.16 adds only the initial two-pile hand entrance, but there is still no controller selection, authoritative drop, board occupancy, score/rule projection, turn decision, cover continuation authority, or move submission. The context menu and main-menu route remain usable. The player selects Legacy and immediately sees the same current Raphael match and cover state that continued to synchronize while hidden. No reload, match resume, or renderer rebuild is required.

### 9.4 Unsupported or failed Modern environment

Modern initialization, asset loading, or context recovery fails. The application removes partial Modern ownership, activates Legacy exactly once, explains the effective fallback, and preserves the requested preference for later diagnosis unless a repeated-failure policy is explicitly adopted. A cover-only failure may fall back only that parallel projection while leaving an otherwise ready Modern lobby or active-match surface effective; it must never delay the independently executing Legacy cover continuation.

### 9.5 Reduced-motion player

The player has `prefers-reduced-motion` enabled. The same game information and actions are available, but renderer-owned spatial animation is shortened, replaced, or completed immediately. Controller sequencing still completes exactly once. The Phase 0.15 Modern cover snaps visually without changing the current Legacy cover's 2,000-millisecond timing or callback behavior, and the Phase 0.16 hands appear directly at their canonical vertical positions.

### 9.6 Developer comparing renderers

A developer can load a known snapshot, force either renderer, perform the same semantic interactions, and compare final semantic state without depending on Raphael `.node` objects or Three.js meshes.

## 10. System invariants

The following invariants apply across every phase after the relevant seam exists:

1. The server and renderer-neutral match controller remain authoritative over the visual layer.
2. A renderer may cache objects, but its objects are projections of match state rather than match state themselves.
3. Three.js meshes, materials, textures, cameras, raycasters, and scenes must not escape the Modern renderer.
4. New controller or model structures must not store Raphael elements.
5. Final card zone, position, ownership color, face state, score, turn state, and rule state come from the current snapshot or server result.
6. Visible animation order cannot alter rule resolution.
7. At most one renderer owns active-match pointer input. While the Phase 0 through Phase 0.10 non-playable Modern preview is effective, neither surface owns gameplay pointer input; the Phase 0.10 hand meshes are display-only. In Phase 0.11, Modern alone may observe card-bounded player-hand clicks and pointer movement for its renderer-local study. Phase 0.12 may additionally consume one armed second click as an always-invalid renderer-local return. Phase 0.13 may classify that click against plain valid-zone presentation and run one local placement preview, but neither surface owns semantic gameplay input.
8. Exactly one renderer is effective for a match build.
9. Every started transition settles once, including when shortened, superseded, cancelled, disposed, or affected by reduced-motion settings.
10. A renderer failure cannot cause a duplicate move request.
11. A user-selected Legacy preference takes precedence over automatic Modern capability detection.
12. A missing preference uses the phase's configured default. An invalid value is treated as unset. Unavailable storage uses Legacy as the safety default.
13. Renderer selection does not modify authoritative game data.
14. Outer UI remains available when the active-match renderer is absent or inert.
15. Modern mode must not depend on Raphael being absent.
16. Legacy mode must not depend on Three.js being loaded.
17. Renderer disposal removes ownership before another renderer accepts input.
18. Renderer application state advances through monotonically increasing snapshot revisions; a stale animation result cannot overwrite a newer revision.
19. A release kill switch may force effective Legacy without changing the requested preference.
20. The lobby-hand preview is a projection of the current menu hand data and never becomes authoritative state.
21. The Legacy lobby-hand preview owns no pointer or keyboard input. Beginning in Phase 0.6, the Modern lobby-hand preview may own only card-bounded pointer activation for the decorative double flip; it may not emit a semantic game action or own keyboard gameplay input.
22. The hand-only lobby gate cannot hide, disable, or replace the shared Raphael menu bar or DOM commands.
23. The Modern lobby-hand surface may have at most one active animation and one corresponding re-entry lock per card, for no more than five concurrent animations. Each normal completion releases only that card's lock exactly once; every surface-wide cancellation path atomically invalidates all active animations, releases every held lock exactly once, and leaves no pending shared frame.
24. The Motion Studio cannot mutate game, account, hand, deck, shop, replay, economy, server, or protocol state and cannot emit a semantic game action.
25. Opening, editing, importing into, exporting from, or closing the Motion Studio cannot rewrite the stored Graphics preference or make a different requested or effective graphics mode authoritative. Phase 0.9 Apply & Preview may temporarily present Modern through its explicit non-persisting preview path, but it must restore the prior selection and can never override a newer user choice.
26. Studio pose sampling is a pure function of a validated recipe, seed, destination, and time; the rendered frame cannot become the source of recipe or application state.
27. A deployed or test-passing motion is not an approved visual baseline until the required actual-size, normal-speed review records explicit approval.
28. A Phase 0.9 intro must settle exactly at its current runtime-owned lobby anchor. A playbook import cannot move, replace, or serialize that anchor.
29. A Phase 0.9 exit must begin at the same exact settled anchor and complete with every card fully outside the application-defined lower-left exit region.
30. Given the same normalized playbook, live anchors, and sequence seed, planning and sampling must produce the same five plans and poses independent of frame rate, prior runs, card texture, and control order.
31. One Gentle Wind run may contain bounded per-card variation, but its five endpoints must be distinct and its shared gust must remain coherent. No random value may be sampled during frame rendering.
32. A pending Modern lobby command owns one exactly-once continuation. Additional command clicks cannot replace, queue, or duplicate it, and its fail-open watchdog must eventually release navigation.
33. Applying or previewing the lobby playbook may temporarily present Modern but cannot write or permanently change the stored requested Graphics preference.
34. Phase 0.11 may own at most one renderer-local held player card. The hold cannot escape the Modern surface, mutate authoritative or Legacy state, emit a semantic action, or survive a lifecycle/revision boundary.
35. Every settled Phase 0.11 hand card uses the same flat-table perspective calibration and exact Phase 0.10 anchor. Only the held card may depart from that canonical pose.
36. Phase 0.11 pointer follow preserves the accepted grab offset in logical board coordinates at every supported application scale. Velocity tilt is bounded, deterministic from the observed pointer history, and converges to zero without an idle frame loop.
37. Phase 0.12 defines no drop zones and therefore no second-click validity query. Every armed second click begins one always-invalid return with identical semantics regardless of pointer location.
38. A Phase 0.12 hold is unarmed until pickup completes, exclusively locked while returning, and released only by exact canonical settlement or an atomic lifecycle reset. No click or pointer event may be queued across either guard.
39. Every Phase 0.12 return belongs to one monotonic hold generation. A stale frame or event from an invalidated generation cannot mutate a replacement hold, hand, surface, renderer, or Legacy object.
40. Normal Phase 0.12 return uses the exact 300-millisecond cubic-out clockwise-turn contract. Reduced motion commits the same exact endpoint immediately. Both paths preserve zero semantic-action, game-mutation, and request counts.
41. Phase 0.13 may consume only nine plain, fail-closed Legacy drop-zone descriptions. A renderer cannot manufacture, broaden, or persist validity and cannot expose a renderer object through that bridge.
42. While a card is carried, no more than one valid-zone shadow is visible; every zone is invisible when no hold exists, the pointer is outside it, it is occupied, or its current validity bit is false.
43. A normal Phase 0.13 valid placement uses the exact 300-millisecond cubic-out reverse-pickup contract and ends at the exact slot center, projected scale `1`, table depth `0`, zero local-X/local-Y tilt, and one once-sampled `[-2°, 2°]` screen-space roll. Position jitter and per-frame randomness are prohibited.
44. Phase 0.13 accepts no more than one renderer-local placement preview per unchanged hand/drop-zone snapshot. The preview cannot mutate live occupancy or turn state and cannot survive a snapshot or lifecycle boundary.
45. Phase 0.13 hover, placement, and lifecycle paths preserve zero semantic actions, gameplay mutations, Legacy drop calls, and requests. Reduced motion commits the same sampled endpoint synchronously.
46. Phase 0.14 may consume only one plain turn-indicator descriptor containing sequence, side, rectangle, approved dime texture URL, and visibility. It cannot inspect or derive turn authority beyond that already-presented data.
47. The first valid turn-indicator description received by a Modern surface settles directly at the described endpoint. Only a later newer sequence with a changed target may begin motion; duplicate, stale, or same-target delivery cannot replay it.
48. Every Phase 0.14 transition uses the same deterministic versioned profile/planner/sampler in production and Studio. Its endpoints, direction, texture, sequence, and turn decision remain application-owned and are never persisted in the profile.
49. The Phase 0.14 coin remains a true circular two-face/one-edge 3D object throughout motion. Both faces use the one Legacy-selected descriptor texture for now; the renderer cannot switch art as a simulated coin-toss result.
50. Turn-coin presentation cannot call, delay, complete, or replace the Legacy turn callback; gate player input; mutate game, board, hand, score, rule, or turn state; emit a semantic action; or issue a request.
51. The applied turn-coin profile is browser-local under `purett.turnMarkerMotion.v1`, isolated from Graphics and lobby-playbook persistence. Reduced motion and every lifecycle boundary settle or discard only renderer-owned coin state and leave no pending frame or stale callback.
52. Phase 0.15 may consume only a cloned plain description of the current Legacy cover presentation. The description and Modern diagnostics cannot contain a Raphael element, Three.js object, DOM node, callback, timer handle, function, request, or game object.
53. The closed Modern cover always preserves the exact 755 by 562 Legacy composition, including left rectangle `(0, 0, 377, 562)`, right rectangle `(376, 0, 378, 562)`, one-pixel overlap, right-over-left seam order, and approved same-origin textures.
54. Each Modern cover leaf pivots only at its outer vertical edge, reaches exactly 112 degrees in the open pose, and returns to exactly zero degrees in the closed pose. Both leaves remain deterministic mirror counterparts and cannot fan, bow, translate, or imply a curved support surface.
55. Modern cover opening and closing use one pure deterministic planner/sampler with fixed 2,000-millisecond durations and cubic-in/cubic-out timing respectively. No random value or frame-integrated simulation may influence the Modern path.
56. Legacy `gh.cover` exclusively owns `isopen`, its Raphael animations, all public callbacks, callback timing, full-stage pointer shielding, and application sequencing. No Modern render, completion, cancellation, reduced-motion branch, failure, or fallback may invoke, delay, replace, suppress, or duplicate a Legacy continuation.
57. The Modern cover surface has a lifecycle independent of the active-match surface. Active-match deactivation cannot remove a required closing projection, and cover-specific failure cannot disable an otherwise healthy Modern lobby or match surface.
58. Legacy remains visible until the complete Modern cover frame is ready. Every failure or lifecycle boundary restores or retains Legacy cover presentation atomically, and stale frames or loads from an invalidated generation remain inert.
59. Reduced motion snaps only the Modern cover projection to the latest target with no pending frame. It cannot alter Legacy cover timing, callback behavior, target state, or input-shield lifetime.
60. The Modern cover is decorative, absent from the accessibility and tab trees, owns no semantic input, and requests no idle frame. The existing cover-layer stacking and underlying input barrier remain effective for the same application interval.
61. Phase 0.16 pile and fan poses exist only inside the Modern active-match renderer. Canonical hand descriptions and Legacy hands remain at their ordinary vertical coordinates.
62. Each side piles independently at its last current card destination, preserves normal hand render order, and keeps its last current card stationary and visually topmost until expansion completes.
63. Only the guarded Legacy left-panel open completion after the parent hide may release a Phase 0.16 entrance. The synchronous open callback and Modern-cover completion never do.
64. A Phase 0.16 entrance is deterministic, monotonic by sequence/state, input-blocking until exact settlement, and bounded to one demand-driven frame owner. Reduced motion and lifecycle cancellation cannot replay a terminal sequence.
65. Phase 0.16 changes no hand, board, rule, score, turn, controller, cover callback, navigation, storage, semantic action, or request state.

### 10.1 Phased applicability

The invariants above describe the target architecture. Phase 0 is intentionally smaller and may retain the existing `gh.game` coupling behind the unchanged Legacy route.

Phase 0.10 adds a deliberately shallow compatibility description and passive two-hand projection to that temporary bridge. Phase 0.11 adds one renderer-local pickup/follow study over the same plain presentation data. Phase 0.12 adds only a renderer-local always-invalid return over that hold. Phase 0.13 adds fail-closed drop-zone presentation and one renderer-local placement preview without move authority. Phase 0.14 adds only one plain sequenced turn-indicator description, one renderer-local 3D coin projection, and one separately persisted Studio profile. Phase 0.15 adds one independent full-stage cover description and parallel projection while leaving Legacy cover lifecycle and callback authority intact. Phase 0.16 adds only a plain cover-settlement observation and renderer-local initial hand fan while preserving canonical hand data. None expands the playable boundary, authorizes Modern semantic gameplay input, turn authority, or application continuation authority, or satisfies the complete renderer-neutral snapshot and renderer-extraction requirements deferred to Phase 1 and later.

In particular, Phase 0 does **not** require:

- extraction of a complete Legacy renderer;
- removal of Raphael handles from current hand and board arrays;
- a complete renderer-neutral snapshot;
- the revisioned renderer-application contract in Section 13;
- renderer-neutral replay or Sudden Death reconstruction;
- replacement of existing renderer-specific tests.

Phase 0 may use a shallow runtime presentation/input gate around the unchanged Legacy path and the inert Modern preview. Phase 0.5 may add a dedicated lobby-hand projection and a hand-element-only presentation gate without expanding the playable renderer boundary. Phase 0.6 may add only the documented decorative lobby-card click and bounded animation. Phase 0.7 may add only the documented seeded menu-presentation arrival. Phase 0.8 may add only the isolated one-card authoring workbench and renderer-neutral recipe facility. Phase 0.9 may bind those recipes only to the five Modern lobby intro slots and one shared Modern Gentle Wind exit, including the bounded command-continuation wait and Tutorials Back replay. Phase 0.10 may project the two current match hands. Phase 0.11 may add only the documented player-card pickup/follow motion study and may not treat its renderer-local hold as game input. Phase 0.12 may supersede only the Phase 0.11 no-second-click boundary with the documented always-invalid renderer-local return. Phase 0.13 may supersede only Phase 0.12's zero-zone boundary with nine plain presentation zones, one hover, and one renderer-local placement preview; it still may not create semantic game input. Phase 0.14 may supersede only the absent-turn-indicator boundary with the documented sequenced 3D coin and its isolated Motion Studio profile; it may not derive or control the turn. Phase 0.15 may supersede only the earlier `gh.cover` exclusion with the documented two-leaf outer-edge-hinged projection; it cannot replace Legacy cover state, timing, callbacks, pointer shielding, or flow authority. Phase 0.16 may supersede only the immediately settled match-entry hand presentation with the documented waiting piles and cover-triggered fan; it cannot change canonical or Legacy hands, cover continuation, or game authority. None of these decorative, authoring, presentation, or motion-study slices expands the playable active-match renderer boundary. Each phase must meet every requirement and acceptance criterion explicitly assigned to it.

Requirements become mandatory according to this table:

| Requirement group | Mandatory from |
|---|---|
| `FR-MODE-*` | Phase 0, except the Modern-default decision in `FR-MODE-011` |
| `FR-LIFE-001`, and `FR-LIFE-005` through `FR-LIFE-009` | Phase 0, interpreted through the temporary presentation/input gate |
| `FR-LIFE-002` through `FR-LIFE-004`, and `FR-LIFE-010` | Phase 1; Phase 0 does not claim that a complete renderer lifecycle or renderer-neutral reconstruction boundary exists |
| `FR-LEG-*` | Phase 0 for present behavior; renderer-contract conformance expands in Phase 1 |
| `FR-MOD-*` | Phase 2 for the spike and Phase 4 for complete parity |
| `FR-INT-*` | Phase 3 for the vertical slice and Phase 4/5 for complete input coverage |
| `FR-FX-*` | Phase 2 for feasibility and Phase 5 for production behavior |
| `FR-FLOW-*` | Phase 1 for decoupling and Phase 4 for complete parity |
| `FR-FAIL-001` through `FR-FAIL-004`, `FR-FAIL-007`, and `FR-FAIL-008` | Phase 0 |
| Remaining `FR-FAIL-*` | Phase 3 through Phase 5 |
| `FR-A11Y-001` and `FR-A11Y-002` | Phase 0 |
| `FR-A11Y-013` | Phase 2 architecture decision |
| `FR-A11Y-003` through `FR-A11Y-006`, `FR-A11Y-011`, and `FR-A11Y-012` | Phase 3 for the vertical slice and Phase 5 for complete coverage |
| Remaining `FR-A11Y-*` | Phase 5, before Modern becomes default |
| `FR-TEST-001` | Phase 0 |
| Remaining `FR-TEST-*` | Phase 1 onward |
| `FR-LOBBY-*` | Phase 0.5 |
| `FR-LOBBY-FLIP-*` | Phase 0.6 |
| `FR-LOBBY-ARRIVAL-*` | Phase 0.7 |
| `FR-MOTION-STUDIO-*` | Phase 0.8 |
| `FR-LOBBY-PLAYBOOK-*` | Phase 0.9 |
| `FR-MATCH-PICKUP-*` | Phase 0.11 |
| `FR-MATCH-RETURN-*` | Phase 0.12 |
| `FR-MATCH-PLACEMENT-PREVIEW-*` | Phase 0.13 |
| `FR-MATCH-TURN-COIN-*` | Phase 0.14 |
| `FR-GAME-COVER-*` | Phase 0.15 |
| `FR-MATCH-HAND-ENTRANCE-*` | Phase 0.16 |

## 11. Functional requirements

### 11.1 Graphics-mode preference

**FR-MODE-001** — The existing context menu must contain a clearly labeled Graphics control.

**FR-MODE-002** — The control must expose exactly two normal user choices: `Legacy` and `Modern`. During Phase 0 and any non-playable beta, adjacent status or explanatory copy must clearly identify Modern as a non-playable preview; the button label itself may remain `Modern`.

**FR-MODE-003** — The selected choice must be keyboard operable and expose programmatic state through native radio semantics, `aria-pressed`, or an equivalent accessible pattern.

**FR-MODE-004** — The application must distinguish the requested mode from the effective mode.

**FR-MODE-005** — In Phase 0, selecting `Legacy` or `Modern` must apply on the current page without reload. During an explicit same-page selection, Modern must not hide or pointer-block Legacy until the Modern bundle and WebGL surface have initialized successfully. Selecting Legacy must reveal the current live Raphael state immediately without reconstructing the match or its papers. In Phase 0.5 the same runtime readiness rule applies independently to the five lobby card elements; it never gates the shared menu paper. A valid persisted Modern request follows the pre-paint startup exception in `FR-LIFE-011`.

**FR-MODE-006** — When requested and effective modes differ, the UI must explain the actual reason:

- `modernEnabled` is false: Modern is disabled by configuration;
- Modern initialization failed: Legacy is active because initialization failed;
- a later failure-backoff marker is active: Legacy is temporarily active and the retry/reset action is available.

**FR-MODE-007** — The preference must use guarded `window.localStorage` under a versioned key such as `purett.graphicsMode.v1`. It must survive reloads, new tabs on the same origin, and browser restarts until storage is cleared. The preference is intentionally shared by accounts using the same browser profile and origin.

**FR-MODE-008** — Only the exact values `legacy` and `modern` are valid persisted preferences.

**FR-MODE-009** — Storage read or write failure must not prevent application startup or Legacy play. If storage cannot be read, requested and effective mode use Legacy for that page.

**FR-MODE-010** — The Phase 0 configured default must be Legacy.

**FR-MODE-011** — Modern may become the default only after the rollout gates in this document pass.

**FR-MODE-012** — A deterministic force-mode mechanism may be provided for automated testing and local diagnostics. It must not create a security-sensitive server behavior or alter game data.

**FR-MODE-013** — A release/configuration value named conceptually `modernEnabled` must be able to force effective Legacy for every user without clearing or rewriting a valid stored preference.

**FR-MODE-014** — The selection state must follow the precedence algorithm in Section 20 and must expose a fallback or forced-mode reason when requested and effective modes differ.

**FR-MODE-015** — The Graphics control is a presentation setting and must remain enabled when gameplay-specific menu actions are locked by an animation, dialog, review, or pending request. Every local user selection must apply immediately through the Phase 0 gate. A storage event from another browser context may update the requested choice without forcing an unsafe playable-renderer reconstruction; the local page must expose its actual effective state accurately.

### 11.2 Renderer selection and lifecycle

**FR-LIFE-001** — Initial requested and effective mode must be resolved during page initialization. A later same-page user selection must update effective presentation through the Phase 0 gate.

**FR-LIFE-002** — The renderer factory or registry must return one effective renderer for a build.

**FR-LIFE-003** — Each renderer must have an explicit host and lifecycle.

**FR-LIFE-004** — From Phase 1 onward, mounting a playable renderer must not leave another renderer's pointer handlers, SVG paper, WebGL canvas, animation frame, or observer active over the same host. Phase 0's documented hidden, pointer-blocked, synchronized Raphael bridge is the sole temporary exception.

**FR-LIFE-005** — Rebuilding a match in the same mode must not accumulate duplicate papers, canvases, listeners, timers, or animation loops.

**FR-LIFE-006** — Phase 0 switching must make the non-presented surface pointer-inert before changing effective mode. From Phase 1 onward, switching playable renderers at a safe boundary must dispose or make inert the previous active-match implementation before the new implementation accepts input.

**FR-LIFE-007** — The effective renderer must be observable through a stable renderer-neutral API or DOM marker.

**FR-LIFE-008** — The active-match Modern host must occupy the same 693 by 500 logical region as the two Legacy match papers, inset 30 pixels from the top and left of the 755 by 562 board. The distinct Phase 0.5 lobby-hand host follows `FR-LOBBY-003`.

**FR-LIFE-009** — Both renderers must coexist with the existing 755 by 562 CSS board frame and HTML dialog overlay.

**FR-LIFE-010** — A renderer must be able to reconstruct its complete settled visual state from a snapshot without reading objects created by the other renderer.

**FR-LIFE-011** — Before first paint, the standalone document must perform one guarded read of the versioned Graphics preference. Only the exact persisted value `modern` may establish a temporary startup marker. That marker may opacity-hide, pointer-block, and mark inaccessible only the five retained Legacy lobby-hand card elements; it must not suppress the shared menu paper, command bar, navigation, statistics, or board frame. Raphael must still be constructed and animated normally behind the marker. The marker must remain until the first complete Modern lobby-hand frame takes ownership or until explicit Legacy selection, leaving the initial lobby, configuration disablement, bundle failure, surface failure, required-texture failure, context loss, or a six-second watchdog measured from lobby-hand presentation removes it and reveals Legacy. A completion from a timed-out attempt must not reactivate Modern unless the user explicitly requests Modern again.

### 11.3 Legacy renderer

**FR-LEG-001** — Raphael must continue to load in the page.

**FR-LEG-002** — Legacy mode must continue to create the active-match board and rule papers in their current logical bounds.

**FR-LEG-003** — Legacy mode must preserve current match setup, card placement, drop behavior, capture presentation, scores, rule banners, Elemental behavior, turn locking, dialogs, Sudden Death, review, replay, and game completion.

**FR-LEG-004** — Legacy mode must preserve existing application-scale behavior at 1, 1.5, 2, and 3.

**FR-LEG-005** — Legacy mode must preserve the current server request and response protocols.

**FR-LEG-006** — Legacy must remain selectable after Modern becomes the default.

**FR-LEG-007** — Modern initialization failure must be able to activate Legacy without requiring Raphael to be fetched or initialized for the first time from an external source.

**FR-LEG-008** — The legacy conformance suite must remain a release gate for changes to the shared controller or renderer contract.

### 11.4 Modern rendering

**FR-MOD-001** — If the Phase 2 go decision confirms the provisional choice, the final Modern renderer must use Three.js and a transparent `WebGLRenderer` canvas inside the modern host. A no-go halts later Modern phases until this document is explicitly revised.

**FR-MOD-002** — The CSS board frame may remain beneath the transparent Three.js canvas during the initial Modern implementation.

**FR-MOD-003** — Each visible match card must have a stable semantic card ID independent of its mesh identity.

**FR-MOD-004** — Each card must support a distinct front and back.

**FR-MOD-005** — A complete turn must show the correct front, back, and edge orientation without mirrored or reversed artwork.

**FR-MOD-006** — The settled scene must represent:

- both hands;
- face-up and face-down states;
- all nine board slots;
- cards placed on the board;
- control color;
- legal and illegal targets;
- current selection;
- turn ownership;
- score;
- active rule messaging;
- board elements;
- element bonuses;
- busy or waiting state.

**FR-MOD-007** — Overlapping cards must have deterministic visual and picking order.

**FR-MOD-008** — Card faces and backs must remain readable at all supported application scales and device-pixel ratios.

**FR-MOD-009** — The renderer must handle image decode or texture failure without corrupting controller state and must follow the required-versus-optional, pre-input-versus-post-input policy in Section 15.4.

**FR-MOD-010** — The scene must be reproducible from a deterministic snapshot for tests.

**FR-MOD-011** — Modern-only decorative enhancements must not obscure ranks, ownership color, legal targets, scores, or rule messages.

### 11.5 Modern interaction

**FR-INT-001** — The Modern renderer must emit semantic card and slot actions rather than exposing mesh objects to the controller.

**FR-INT-002** — The initial parity interaction must preserve the existing click-to-lift, move, and click-to-place result unless a separately approved interaction redesign replaces it.

**FR-INT-003** — A selected card must be visually raised above its hand or board plane.

**FR-INT-004** — Pointer movement must map correctly through the application-scale transform, browser zoom, device-pixel ratio, renderer viewport, and camera.

**FR-INT-005** — Hit testing must select the visually topmost eligible object.

**FR-INT-006** — An invalid drop must return the card to the controller-defined hand position without submitting a move.

**FR-INT-007** — A valid drop may issue at most one move request.

**FR-INT-008** — Input must remain locked while the existing controller considers a move, response, transition, dialog, or review step non-interactive.

**FR-INT-009** — Losing pointer capture, leaving the surface, opening a dialog, backgrounding the page, or disposing the renderer must have a defined cancellation result.

**FR-INT-010** — From the first playable Modern phase onward, mode selection during an interaction must not tear down or reconstruct the active playable renderer until a safe boundary. Phase 0 may change its presentation gate immediately because the same Legacy controller and Raphael objects continue running and Modern owns no gameplay input.

**FR-INT-011** — Before the playable opt-in beta, keyboard interaction must pass the named `KB-PLAY-01` end-to-end flow below.

**FR-INT-012** — Touch and pen support may be delivered after desktop parity, but Pointer Events should be used so those inputs are not architecturally excluded.

### 11.6 Modern motion and 3D treatment

**FR-FX-001** — Modern cards must support translation, lift, scale, and rotation around relevant three-dimensional axes.

**FR-FX-002** — The renderer must support a true front-to-back flip.

**FR-FX-003** — Hover or focus may produce restrained tilt or lift without changing the logical card position.

**FR-FX-004** — The active card may scale or move toward the camera for inspection, provided its legal targets remain understandable.

**FR-FX-005** — Board or card zoom must have defined limits and a deterministic reset.

**FR-FX-006** — Camera movement must remain constrained. Arbitrary orbit around the board is out of scope.

**FR-FX-007** — Capture, Same, Plus, Combo, Elemental, Sudden Death, reveal, return, and replay motion must settle on state-derived transforms.

**FR-FX-008** — A transition interrupted by a newer snapshot must either complete, fast-forward, or cancel under an explicit policy and settle its completion exactly once.

**FR-FX-009** — Reduced-motion mode must shorten, replace, or immediately settle nonessential spatial motion while preserving information and sequencing.

**FR-FX-010** — Animation must not keep the GPU continuously active after the scene becomes idle, except for a deliberately approved bounded effect.

### 11.7 Rules, replay, and special flows

**FR-FLOW-001** — The renderer receives already resolved capture and ownership results. It must not calculate Basic, Same, Plus, Same Wall, Combo, or Elemental outcomes.

**FR-FLOW-002** — If several captures are presented in sequence, their visible order must not alter the final snapshot.

**FR-FLOW-003** — Closed-rule opponent cards must remain visually closed until the controller requests reveal.

**FR-FLOW-004** — Sudden Death must be reconstructible without moving renderer handles into controller hand arrays.

**FR-FLOW-005** — Review and replay must consume semantic events or snapshots and must not require Raphael node ownership.

**FR-FLOW-006** — Tutorials must use the same renderer-selection policy as normal and resumed games.

**FR-FLOW-007** — Rule banners may be rendered by the selected renderer or retained as a renderer-neutral DOM overlay, but their semantics and sequencing must be consistent.

**FR-FLOW-008** — Scores and the turn indicator may be rendered in Three.js or moved to a renderer-neutral DOM overlay. Their values must never be inferred from visible glyphs.

**FR-FLOW-009** — Match-end and claim flows remain outside the renderer's authority.

### 11.8 Failure and fallback

**FR-FAIL-001** — The application must distinguish requested and effective mode so a fallback can be represented accurately.

**FR-FAIL-002** — Failure before Modern owns input must remove or hide the partial Modern mount, restore the live Legacy presentation and input gate exactly once, and report effective Legacy for that attempt.

**FR-FAIL-003** — A failed Modern initialization must not create an alternating Modern/Legacy fallback loop.

**FR-FAIL-004** — In Phase 0, a WebGL context-loss event must restore effective Legacy and expose the reason because the Modern surface is non-playable and live Legacy is already synchronized. From the first playable Modern phase onward, context loss must suspend Modern input before the documented recovery policy runs.

**FR-FAIL-005** — Failure after Modern owns input must not promise an immediate live Legacy swap. The application must suspend input, preserve or obtain the latest authoritative controller state, make at most one bounded Modern recovery attempt, and then either rebuild Legacy at a proven snapshot-safe checkpoint or require a controlled reload into Legacy.

**FR-FAIL-006** — Recovery, fallback, or controlled reload must not duplicate, discard, or reissue a pending move request or replay step. If a request is pending, its result must be reconciled before new input is accepted.

**FR-FAIL-007** — The user must receive a concise explanation when effective Legacy differs from requested Modern because of failure.

**FR-FAIL-008** — A runtime fallback must not silently overwrite the user's Modern preference.

**FR-FAIL-009** — Before the playable opt-in beta, one Modern capability, initialization, required-asset, or context-loss failure must create a tab-scoped failure-backoff record. The record must include a classified reason, attempt count, and timestamp; force effective Legacy through reloads for at most 30 minutes or the remaining browser-tab session, whichever ends first; preserve requested Modern in `localStorage`; and expose a user-visible `Retry Modern` action that clears the record.

**FR-FAIL-010** — Legacy failure remains a normal application error; the fallback policy is not permitted to recurse indefinitely between implementations.

**FR-FAIL-011** — The Phase 2 spike must set and record the recovery timeout, reconstruction checkpoint, pending-request policy, and user-facing reload behavior before runtime Modern recovery is implemented.

**FR-FAIL-012** — `modernEnabled=false` takes precedence over retry/backoff state. Clearing or expiring failure backoff does not bypass the kill switch.

### 11.9 Accessibility

**FR-A11Y-001** — The Graphics control must be a semantic, keyboard-operable DOM control.

**FR-A11Y-002** — Menus, dialogs, notifications, and mode/fallback messages must remain in the DOM.

**FR-A11Y-003** — Before Modern becomes the default, every actionable card and slot must have a synchronized semantic DOM representation with defined name, role, value/state, focus order, activation, cancellation, and status announcement.

**FR-A11Y-004** — Accessible card information must include identity or name where permitted, owner/control state, face state where permitted by rules, location, selection, and available action.

**FR-A11Y-005** — Keyboard focus order must follow logical interaction order rather than mesh creation order.

**FR-A11Y-006** — Visible focus and selected state must remain distinguishable.

**FR-A11Y-007** — Focus must be restored sensibly after a mode change, dialog, fallback, or cancelled action.

**FR-A11Y-008** — Reduced-motion behavior is required before the Modern renderer becomes the default.

**FR-A11Y-009** — The WebGL canvas must not be presented as the sole accessible game control.

**FR-A11Y-010** — This initiative does not claim formal accessibility certification, but Modern mode must not knowingly make card actions canvas-only.

**FR-A11Y-011** — Canvas raycasting and semantic DOM controls must share one action dispatcher. A pointer or keyboard action may emit one semantic move intent at most once.

**FR-A11Y-012** — Closed or otherwise concealed opponent cards must not expose hidden names, image keys, ranks, or other secret information through DOM text, accessible names, attributes, diagnostics available to normal users, or announcements.

**FR-A11Y-013** — Phase 2 must decide the DOM structure, concealed-information redaction, focus model, and canvas-versus-DOM event ownership before the playable vertical slice is implemented.

#### KB-PLAY-01 — Complete keyboard card placement

Starting at a human turn in Modern mode, a keyboard-only player must be able to:

1. Enter the active-match controls and hear or inspect the current turn/status.
2. Discover each playable hand card in logical order without exposing concealed opponent information.
3. Select a playable card with Enter or Space and receive selected-state confirmation.
4. Discover the nine board slots in logical order, including occupied state and whether each available slot is a legal target.
5. Press Escape before placement, receive cancellation confirmation, and return focus to the originating card.
6. Select a card again, choose a legal slot, and place it with Enter or Space.
7. Emit exactly one semantic drop intent and receive waiting/result status without focus disappearing into the canvas.
8. Survive a dialog interruption under the documented cancellation or suspension policy and restore focus to the correct card, slot, or status control when the dialog closes.

Before beta, this flow requires automated accessible-tree and keyboard assertions in Chromium plus one recorded manual smoke test using Chromium with VoiceOver on macOS. If the declared primary assistive-technology pairing changes, this document and the tested matrix must be updated.

### 11.10 Diagnostics and testability

**FR-TEST-001** — Requested and effective mode must be queryable without inspecting a Raphael node or Three.js object.

**FR-TEST-002** — Each renderer must provide a renderer-neutral debug snapshot in test builds or through a stable test seam.

**FR-TEST-003** — Debug state must describe semantic card IDs, zones, slots, face state, ownership, interaction locks, selection, and settled transforms.

**FR-TEST-004** — Renderer conformance tests must be reusable across Legacy and Modern where the behaviors overlap.

**FR-TEST-005** — Tests must not make new dependencies on `.node`, SVG paint order, or mesh identity for semantic assertions.

**FR-TEST-006** — Visual-regression tests must use deterministic camera, time, scale, assets, and animation completion.

**FR-TEST-007** — Intentional visual differences must be recorded rather than hidden by increasingly broad screenshot tolerances.

**FR-TEST-008** — Renderer failures and fallback reasons should be diagnosable locally without transmitting match data to an external service.

### 11.11 Phase 0.5 lobby-hand preview

**FR-LOBBY-001** — The Phase 0.5 target is the five-card hand preview in the lobby/main-menu viewport beneath the Play, Shop, and Tutorials command bar. It is not the player hand inside an active match.

**FR-LOBBY-002** — `gh.menu` must expose plain rendering descriptions for at most five current cards, including semantic identifiers when available, same-origin texture URL, logical x and y, width, and height. Three.js must not read Raphael element state to construct the preview.

**FR-LOBBY-003** — The Modern lobby-hand renderer must have a dedicated host and factory distinct from the 693 by 500 active-match host. Its logical region must be 755 by 562.

**FR-LOBBY-004** — The settled Modern preview must use the existing five x positions 72, 197, 322, 447, and 572, y position 203, and card dimensions 117 by 146 unless a later visual review explicitly approves a change.

**FR-LOBBY-005** — The Phase 0.5 Modern lobby hand must render no more than five front-face card textures from the same URLs used by Legacy, with deterministic ordering and its historically allowed restrained static rotation. Phase 0.6 supersedes that rotation allowance: all five settled Modern lobby cards must use zero temporary X/Y rotation and zero static Z rotation. In Phase 0.5 the surface must not perform picking or attach card input handlers. Phase 0.6 may add only the picking and bounded decorative animation defined by `FR-LOBBY-FLIP-*`; Phase 0.7 may additionally add the bounded entrance defined by `FR-LOBBY-ARRIVAL-*`. No phase may submit actions or run an unconditional animation loop.

**FR-LOBBY-006** — The original Raphael lobby cards must remain mounted. Each must carry a hand-specific marker that can be gated independently from the shared Raphael paper. The bar and all surrounding menu presentation must remain visible throughout Modern initialization and use.

**FR-LOBBY-007** — During a same-page Modern selection, the legacy lobby cards may become visually hidden and `aria-hidden` only after all required Modern card textures load and a complete Modern frame is ready. Until then, Legacy remains presented to prevent a blank hand region. On a new page with a valid persisted Modern request, `FR-LIFE-011` instead masks only those retained card elements before first paint so they never flash ahead of the requested renderer.

**FR-LOBBY-008** — Selecting Legacy must synchronously reveal the existing Raphael lobby cards and hide the Modern lobby host. It must not recreate hand data, reload the page, navigate, start a match, or issue a server request.

**FR-LOBBY-009** — Entering or leaving the lobby must notify the graphics coordinator so the coordinator owns at most one current WebGL surface kind. Leaving the lobby must dispose or make idle the lobby surface before the active-match surface becomes current.

**FR-LOBBY-010** — A lobby texture-load, initialization, or context-loss failure must dispose the partial Modern surface, preserve or reveal the Raphael cards, report effective Legacy, and retain the requested Modern preference under the existing fallback policy.

**FR-LOBBY-011** — The Phase 0.5 Modern lobby surface must use its historical orthographic mapping to preserve the established pixel-space positions under application scale and capped device-pixel ratio. Phase 0.6 must instead use the calibrated perspective mapping in `FR-LOBBY-FLIP-013` while preserving the same settled screen rectangles. The canvas and host remain pointer-inert through Phase 0.5. Phase 0.6 may enable only the card-bounded pointer path defined by `FR-LOBBY-FLIP-*`, without shielding surrounding controls. The decorative canvas itself remains `aria-hidden`.

**FR-LOBBY-012** — Diagnostics must identify the surface as `lobby-hand` and report readiness, logical size, mesh count, texture count, and the five card screen rectangles without exposing Three.js mesh objects as application state.

### 11.12 Phase 0.6 Modern lobby-card double flip

**FR-LOBBY-FLIP-001** — The Phase 0.6 interaction is available only while Modern is effective, the main-menu/lobby viewport is visible, and the complete Modern lobby hand is ready. It applies only to the rendered card rectangles beneath the command bar.

**FR-LOBBY-FLIP-002** — A primary click on a settled card must animate this ordered presentation: lift the card away from its resting plane without changing its orientation; turn it end over end in one uninterrupted direction around its local X axis from normalized zero through `-π`, where its true back is upright and visible, to `-2π`, where its original front is upright and visible again; then return it to its exact settled position and depth, restore unit scale, and normalize temporary local-X rotation to zero. The normal-motion turn must not reverse direction, split into two counter-rotating turns, or pause at the back. Auxiliary pickup pitch, yaw, and roll must remain exactly zero throughout the normal sequence; only the continuous local-X turn may change orientation. The card must not be left edge-on, reversed, lifted, tilted, scaled, or numerically offset after settlement.

**FR-LOBBY-FLIP-003** — The back must use `/images/cards/cardBack.png`, the existing 117 by 146 same-origin canonical back. The renderer must not derive a back URL from `gh.data.color`, owner, capture state, or `purchased`, and must not add a `p` prefix. The front must remain the original current lobby face texture. The shared back must be loaded and decoded before Phase 0.6 card input becomes eligible; failure follows the existing pre-input Legacy fallback.

**FR-LOBBY-FLIP-004** — The effect is presentation-only. Accepting, advancing, completing, or cancelling it must not mutate `gh.data.hand`, a card description, a user-card identifier, deck composition, account state, match state, menu navigation, requested/effective graphics preference, or any server-authoritative value. It must issue no game, deck, account, shop, analytics, or other network request.

**FR-LOBBY-FLIP-005** — The lobby surface must use an independent re-entry lock for each card. An accepted click acquires only the hit card's lock before motion begins. A further activation of that same active card must be ignored rather than queued or coalesced until its exact settlement releases the lock once. Locks on other cards remain independent: any other settled card may start immediately, and up to all five cards may animate concurrently. Surface-wide cancellation must release every held card lock exactly once.

**FR-LOBBY-FLIP-006** — Pointer handling must not make the full 755 by 562 lobby host an opaque input shield. Hit testing may accept only a visually eligible settled card, using scale-aware canvas coordinates and deterministic nearest/topmost ordering. Empty space and the Play, Shop, Tutorials, Replay, Deck, statistics, rules, title, and context-menu controls must retain their established behavior.

**FR-LOBBY-FLIP-007** — Animation rendering must be demand-driven. Before Phase 0.7 the renderer may start its shared `requestAnimationFrame` scheduler only after accepting a card click; Phase 0.7 additionally permits the same scheduler to start for one current menu-presentation arrival batch. The surface must keep at most one animation-frame request outstanding and advance every currently active card from that callback. Each normal-motion flip must use the 2,450-millisecond nominal timeline in Section 12.9.3 and have its own hard completion deadline no greater than 3,000 milliseconds from its accepted click to its settled state. Completing one card must not stop the scheduler while another remains active; completing or cancelling the final active card must leave no frame pending and must not become an idle render loop.

**FR-LOBBY-FLIP-008** — Selecting Legacy, hiding the lobby, replacing the hand or lobby surface, disposing the lobby surface, and receiving WebGL context loss must synchronously invalidate every current animation token, cancel the shared pending frame request, release every held per-card lock, hide every analytic shadow, and prevent any late callback from rendering or re-gating the Modern hand. This surface-wide cancellation must settle all active cards atomically from the lifecycle caller's perspective. Legacy selection and lobby hide must not wait for any animation to finish. A context loss must continue through the established classified Legacy fallback.

**FR-LOBBY-FLIP-009** — Each animation must settle exactly once under normal completion or cancellation. If the Modern surface remains reusable, every active card must be reset to its own original front-facing settled transform before that card can accept another activation. If the surface is being disposed or its context is lost, cleanup may discard the card objects, but no animation callback, held card lock, visible shadow, listener, material, texture reference, or scheduler ownership may survive disposal.

**FR-LOBBY-FLIP-010** — With `prefers-reduced-motion: reduce`, each accepted interaction must omit lift and continuous 3D rotation. It must use a bounded two-step face proof—back presented for at least one rendered frame, then front restored—or settle immediately when rendering is being cancelled. The same per-card re-entry lock, independent-card concurrency, shared-scheduler, authority-isolation, cancellation, and exact-settlement rules apply, and no persistent frame loop is permitted.

**FR-LOBBY-FLIP-011** — The decorative canvas remains `aria-hidden` and the spike must not create a keyboard-focus stop, selected state, game-action announcement, or claim of keyboard gameplay support. The card faces remain represented by the existing non-authoritative lobby/menu semantics.

**FR-LOBBY-FLIP-012** — In addition to the established surface diagnostics, test diagnostics must expose renderer-neutral spike state: the active-animation count; sorted active and locked card indexes; per-card active/idle state and, for every active card, its phase (`lifting`, `showing-back`, `showing-front`, or `settling`), local flip axis and angle, zero-to-negative-two-pi rotation path, direction-reversal count, current lift depth, reduced-motion state, independently visible analytic-shadow state, and latest transition outcome; the `none` pickup-tilt policy; the flat-table-neutralized projection profile; projected face corners and lateral-shear evidence; whether the one shared animation frame is pending; and the most recently started or settled transition for compatibility. A single-card compatibility field may identify the active card only when exactly one animation is active; with several active cards it must not imply surface-wide ownership. Cancellation may return every reusable card immediately to phase `idle` while each last outcome remains `cancelled`. Diagnostics must not expose Three.js object references or become the source of production behavior.

**FR-LOBBY-FLIP-013** — Phase 0.6 must replace the historical Phase 0.5 orthographic lobby projection with a constrained, head-on perspective camera calibrated so the settled z=0 card-face plane preserves the established 755 by 562 logical layout and one logical unit maps to one settled screen pixel. The lobby camera must use 40-degree vertical field of view and 450/900 near/far clipping planes. Perspective compensation may move a lifted card along its camera ray to keep its presented center in its established lobby slot; manual group scaling must not substitute for depth. A single perspective camera ordinarily projects the changing local depth of an off-axis rotating card against its slot offset, producing opposite lateral shear at the outer-left and outer-right positions and the false appearance of a curved or spherical support. The renderer must cancel that position-dependent term with a face-anchored flat-table projection neutralizer outside the card's rotation hierarchy. The correction must make every slot use the centered card's perspective silhouette translated to that slot while preserving common perspective enlargement, symmetric depth foreshortening, and the physical edge. All five cards must remain canonically flat and front-facing at rest.

**FR-LOBBY-FLIP-014** — Each Phase 0.6 card must use a nominally three-logical-unit-thick slab whose lit side groups remain visible while its front and back cap groups do not compete with the distinct face planes. Each face plane must have 0.2 logical units of clearance beyond the corresponding body surface, use an unlit material, preserve the sRGB source art without light or tone-map darkening, and participate in deterministic depth testing. Required face and back textures must use mipmaps with trilinear minification and anisotropy capped at the lesser of four and the renderer capability.

**FR-LOBBY-FLIP-015** — Hardware shadow mapping must remain disabled for the Phase 0.6 lobby surface. The only Phase 0.6 shadow cues are analytic contact-shadow planes with no application-state meaning. Shadow geometry and generated gradient texture must be shared, but every lobby card must have its own mesh and independently controllable material so simultaneous lifts can render independent position, spread, and opacity without overwriting another card's shadow. Each shadow must be invisible while its card is settled, become visible only while that card has nonzero lift, track that card's original lobby slot with bounded offset, spread, and opacity, and be hidden and reset on that card's completion or on surface cancellation, suspension, disposal, or context loss. These shadows must not create a persistent render loop or affect card hit testing.

**FR-LOBBY-FLIP-016** — The flat-table projection neutralizer must be recomputed from the card's established slot, current screen lift, calibrated camera distance, and visible-face plane; it must not be approximated by per-position card rotation. It must be applied after the card's local turn in transform order so it cancels post-rotation depth shear, and it must be anchored so a flat front at local X zero or `-2π` does not jump. Normal completion, cancellation, suspension, reusable context recovery, and exact settlement must restore that card's canonical zero-lift neutralizer state and exact zero auxiliary pickup rotation before that card's next activation can be accepted.

### 11.13 Phase 0.7 seeded lobby-card arrival

**FR-LOBBY-ARRIVAL-001** — Every `gh.menu.show()` invocation must create a unique lobby-presentation token and monotonic reveal timestamp at the same causal point that begins the black command-bar reveal. `gh.menu.handshow()` must pass that token, the `command-bar-reveal` trigger, timestamp, and `casual-drop-left` profile through the graphics coordinator with the plain card descriptions. No timeout, DOM animation-end listener, or inferred opacity state may own the trigger.

**FR-LOBBY-ARRIVAL-002** — The Modern surface must consume a presentation token at most once. Async texture loading may retain the token until a complete surface is ready, but resize, resume, repeated rendering, mode toggles, or repeated delivery of the same token must not replay it. A later lobby show receives a new token and may run a new batch.

**FR-LOBBY-ARRIVAL-003** — Arrival planning must be a reusable, pure, destination-driven facility. A caller supplies card dimensions, semantic identity when available, viewport bounds, exact destination, projection distance when applicable, profile, and seed/request identity. The planner must reject unknown profiles and invalid geometry, must not hard-code lobby slot positions, and must produce plain plans that a later Three.js shop surface can reuse.

**FR-LOBBY-ARRIVAL-004** — The `casual-drop-left` planner must turn the caller-supplied destinations into one art-directed release phrase rather than a spatial fill algorithm. For the canonical five-card row, the release phrase is destination indexes `[4, 2, 3, 1, 0]`: a quick opening pair, a visible recovery pause, and a tighter three-card follow-through. It must use a deterministic seeded generator to sample one compact off-screen hand packet plus each card's correlated motion variant, release gap, launch velocity, ballistic impulse and gravity, pitch, yaw, roll, path curvature, contact attitude, skid direction, and friction duration exactly once before frame advancement. Seed variation may change the transient character but must not change that phrase or any exact destination, and the sampler must never call nondeterministic randomness per frame.

**FR-LOBBY-ARRIVAL-005** — Normal motion must present the hand as five cards casually scattered and dropped by one player seated beyond the left edge, not as cards dealt in slot order and not as flat translations, scale-ins, pinwheels, or bouncing sprites. Every front-up card begins in the same compact hand-sized packet and follows one of five correlated gestures—`long-skim`, `lofted-toss`, `quick-slip`, `loose-follower`, or `soft-drop`—with visibly different speed, lift, curvature, attitude, and residual skid. Each card must rise and fall under analytic gravity, retain front-preserving X/Y tilt and bounded Z roll, make one moving edge/corner contact short of its supplied destination, flatten during the start of one continuous friction movement, and quietly settle. Translation from contact through settlement must decelerate continuously; the slap/slide phase boundary may change orientation ownership but must not stop and relaunch the card. There must be no positional overshoot, post-contact rise, rebound, landing oscillation, end jiggle, or manual scale animation. Settlement restores the exact supplied x, y, and base depth with unit scale and zero temporary X, Y, and Z rotation.

**FR-LOBBY-ARRIVAL-006** — All five cards must settle no later than 2,000 milliseconds after the command-bar reveal timestamp; the current human-scatter profile must cap its generated timeline at 1,500 milliseconds. Release cadence and asynchronous renderer/texture readiness are part of that presentation deadline: a surface becoming ready after the trigger must begin at the corresponding sampled point, and a surface becoming ready after the complete timeline must commit the already-settled hand without replay. The batch and click flips must share the surface's one demand-driven animation-frame scheduler and per-card exclusion map; no per-card timer, second scheduler, or idle loop is permitted.

**FR-LOBBY-ARRIVAL-007** — Before the readiness gate reveals it, the Modern canvas must be committed at each plan's current reveal-relative sample—waiting, flight, slap, slide, or settled—preventing either a destination-frame flash followed by a jump off-screen or a late restart after loading. Card flip input must remain ineligible while any entrance card is active. After the final entrance settles, the Phase 0.6 independent click-flip behavior becomes eligible without rebuilding the hand.

**FR-LOBBY-ARRIVAL-008** — `prefers-reduced-motion: reduce` must skip off-screen travel, depth, translation, tilt, roll, rebound, and arrival frame scheduling. The complete hand must be committed directly at the canonical destinations before readiness is exposed.

**FR-LOBBY-ARRIVAL-009** — Legacy selection, lobby hide, hand replacement, surface replacement or disposal, context loss, and superseding presentation must cancel the current batch through the existing shared lifecycle path, remove its pending frame, settle reusable cards exactly, hide their shadows, release locks, and prevent stale async completion from reapplying the Modern gate.

**FR-LOBBY-ARRIVAL-010** — Diagnostics must report the current or last presentation request, trigger, profile, compact-origin policy, art-directed placement policy, depth-order guardrail, stable batch seed, irregular release times and window, bounded total duration, and each card's seed, release index, motion variant, release/contact/flat/settle milestones, phase durations, launch and impact velocity, gravity, vertical impulse, apex, bow, contact, slide distance, slide-start, current air gap and vertex-depth range, and exact destination. They must also expose active arrival count and kind, completion/cancellation outcome, and exact settlement evidence without exposing Three.js objects or becoming production state.

**FR-LOBBY-ARRIVAL-011** — Projected overlap is permitted when it visually reads as one airborne card passing above or below another; collision avoidance must remain an unobtrusive safety guardrail and must not impose release order, equal timing, or segregated screen lanes. Meaningful close overflight must retain unambiguous depth ordering, card geometry must not visibly interpenetrate, and no tilted face corner may pass below the table plane. The planner and sampler must account for card dimensions, perspective distance, tilt clearance, and depth at every sample. Dense deterministic sampling across the supported seed space and a real-time reference capture at the actual lobby size are both required; numerical clearance evidence cannot substitute for judging whether the motion looks human.

**FR-LOBBY-ARRIVAL-012** — Airborne cards must retain the perspective camera's physical local-card foreshortening so pitch and yaw read as motion in space, while the existing position-neutral flat-table projection must remain anchored at each moving screen position to remove only the camera-center-dependent lateral lean previously perceived as a curved support. It must not remove the card's own X/Y tilt, Z roll, edge foreshortening, or depth. No rendered front-face vertex perspective factor and no intrinsic projected face edge may exceed 1.09 times its settled baseline.

### 11.14 Phase 0.8 one-card Motion Studio

**FR-MOTION-STUDIO-001** — The existing application context menu must expose a clearly labeled `Motion Studio…` action. The action must open an authoring workbench within the application rather than navigating to a different product or requiring source-code editing. If Three.js or WebGL cannot initialize, the application must report that failure and leave the existing screen and Graphics selection usable.

**FR-MOTION-STUDIO-002** — The Studio must occupy the existing 755 by 562 logical `#content` region as a dedicated workbench while preserving the title, coin display, footer, and application scaling. It must provide an explicit `Back to Lobby` control and support Escape when focus is not inside a control that consumes Escape. It must not use the existing speech-bubble dialog layout, whose decorative button pane leaves insufficient space for a preview, inspector, and timeline.

**FR-MOTION-STUDIO-003** — Ordinary opening, one-card editing, and closing of the Studio must be isolated from Graphics preference. The Studio may lazy-load the pinned Modern bundle for its own study surface even when Legacy is selected, but it must not write the Graphics local-storage key, gate the Legacy lobby hand, or claim that Modern is effective merely because the authoring surface exists. Phase 0.9 `Apply & Preview in Lobby` is the sole explicit exception: its coordinator may temporarily present Modern through a non-persisting preview path, must restore the prior requested/effective mode and view on every outcome, and must yield to a newer explicit user selection.

**FR-MOTION-STUDIO-004** — The Studio must own a separate Three.js scene, camera, renderer, canvas, scheduler, listeners, and disposable resource boundary. It must not borrow the live lobby surface's card objects or animation map. Opening must suspend or visually cover the underlying lobby without invoking lobby navigation or hand-hide choreography. Closing, replacement, failure, and context loss must cancel the study, remove its frame request and listeners, and dispose every Studio-owned GPU and DOM resource without disposing the live lobby or active-match surface.

**FR-MOTION-STUDIO-005** — The initial Studio scope is exactly one card. The preview must use the production lobby's 117 by 146 logical card dimensions, canonical front and back assets, nominal thickness, face clearances, sRGB face treatment, flat-table coordinate convention, and calibrated 40-degree lobby perspective camera by default. A user may choose which available lobby face to study, but the card is a non-authoritative visual fixture.

**FR-MOTION-STUDIO-006** — A motion recipe must be a versioned, renderer-neutral plain-data value. It must include a schema version, stable semantic property names, finite numeric values, explicit units, and enough information to sample travel, elevation, scale, orientation, contact, and settlement. It must not include a DOM node, Raphael element, Three.js object, callback, function, wall-clock timestamp, user identity, or game-state reference.

**FR-MOTION-STUDIO-007** — Recipe planning and sampling must be deterministic. Given the same validated recipe, seed, start and destination, and elapsed or normalized time, repeated calls must produce identical poses independent of frame rate, display scale, UI control order, wall clock, and previous playback. Any variation must derive from an explicit seed and be sampled when constructing the plan, never through nondeterministic per-frame randomness.

**FR-MOTION-STUDIO-008** — The inspector must expose, at minimum: start and landing position; travel direction and distance; flight duration; signed path curvature; release height; apex height and timing; end-over-end X flips; side-over-side Y flips; table-plane Z spin; release and contact pitch, yaw, and roll; perspective-derived versus authored scale; card-size multiplier; slap duration; skid distance, direction, and duration; final rotation; shadow strength and spread; and visible card thickness. Every continuous control must provide both a slider and an editable numeric value with its unit.

**FR-MOTION-STUDIO-009** — Editing one representation of the path must keep its equivalents synchronized. Dragging start or landing anchors must update numeric coordinates, direction, and distance; changing direction or distance must update the start anchor relative to the landing anchor. Invalid, non-finite, camera-crossing, below-table, or out-of-schema values must be rejected or clamped visibly without corrupting the last valid draft.

**FR-MOTION-STUDIO-010** — The preview must provide optional authoring helpers: draggable start and landing anchors, a faint destination-card outline, trajectory curve, apex marker, contact marker, and analytic-shadow visualization. Helpers must be removable with one toggle so the card can be judged against a clean, flat tabletop. The preview must not use a persistent grid.

**FR-MOTION-STUDIO-011** — Playback must provide Replay, Play/Pause, frame-step backward and forward, Loop, and selectable 0.25×, 0.5×, 1×, and 2× rates. A scrub-able timeline must identify Release, Apex, Contact, Flat, and Settled milestones. Scrubbing pauses playback and renders the exact deterministic pose at the selected time; resuming continues from that playhead.

**FR-MOTION-STUDIO-012** — Edits must update the current sampled pose immediately. While a slider is actively dragged, the Studio must not continuously queue full restarts. When editing ends, an `Auto Replay` option may debounce and replay the draft once; Auto Replay must be independently switchable and on by default. No edit may create overlapping playback schedulers.

**FR-MOTION-STUDIO-013** — The Studio must include clearly distinct starting presets for at least `Gentle Drop`, `Casual Toss`, and `Energetic Scatter`, plus a representation of the current lobby implementation for comparison that is explicitly labeled `Unapproved current lobby`. Selecting a preset copies it into an editable draft; editing cannot mutate the built-in preset. Reset must restore the selected preset rather than an undocumented mixture of prior values.

**FR-MOTION-STUDIO-014** — The current draft, selected preset, seed, helper visibility, playback speed, loop choice, Auto Replay choice, and inspector expansion state must persist in guarded `window.sessionStorage` and restore when the Studio is reopened in the same tab. Missing, malformed, unsupported-version, or unavailable session storage must fall back to a documented default without affecting application startup or Graphics mode.

**FR-MOTION-STUDIO-015** — The Studio must export the current recipe as canonical JSON and import compatible JSON through explicit user actions. Export followed by import must preserve every semantic recipe value and reproduce the same sampled poses. Import must validate schema version, required fields, finite ranges, and prohibited values atomically; a failed import must explain the problem and retain the last valid draft. Import/export must issue no network request.

**FR-MOTION-STUDIO-016** — At the Phase 0.8 boundary, previewing, session-saving, naming, importing, or exporting an unbound draft must not make it the production lobby animation. Phase 0.9 is the separately recorded integration step that supersedes this restriction only for the declared browser-local lobby playbook targets. Promotion beyond those targets still requires a named reference recipe and capture, source-controlled integration, and the applicable choreography, lifecycle, reduced-motion, and Legacy regression review.

**FR-MOTION-STUDIO-017** — The workbench must be keyboard-operable with visible focus, programmatically associated labels, current numeric values, pressed/selected state, and a logical focus order. Space may control playback only when it will not type into or activate the focused form control. When `prefers-reduced-motion: reduce` is active, the Studio must begin without automatic spatial playback; the user may explicitly run the authoring preview after a concise disclosure, without changing the system preference or production reduced-motion policy.

**FR-MOTION-STUDIO-018** — Rendering must remain demand-driven. The Studio may request frames only while playback is active or while committing a discrete edited/scrubbed frame. Paused and settled observation must have no frame pending. At most one Studio animation-frame request may exist, and it must not share ownership with or keep alive the hidden lobby scheduler.

**FR-MOTION-STUDIO-019** — The Studio must not mutate `gh.data`, current hand order, card ownership, deck composition, account data, coins, game state, server-authoritative values, or the stored requested Graphics preference. Phase 0.9 may explicitly update the browser-local lobby motion playbook and invoke its preview coordinator; that narrow action is presentation state rather than game authority. The Studio must issue no game, deck, account, shop, feedback, analytics, or other application request.

**FR-MOTION-STUDIO-020** — Test diagnostics may expose the recipe schema version, validated draft, deterministic seed, duration, current playhead and rate, named phase, current renderer-neutral pose, milestone times, scheduler state, persistence outcome, and resource counts. Diagnostics must not expose Three.js objects, become application state, or include account/game information not already necessary for the non-authoritative card fixture.

### 11.15 Phase 0.9 application-bound lobby motion playbook

**FR-LOBBY-PLAYBOOK-001** — Motion Studio must expose exactly six Phase 0.9 application targets: `Lobby card 1 — Intro` through `Lobby card 5 — Intro`, numbered from the leftmost settled slot to the rightmost, and one sequence-level `Lobby hand — Gentle Wind Exit`. Selecting a target must load an independent editable draft without changing another target.

**FR-LOBBY-PLAYBOOK-002** — Each intro target must resolve its destination from the current live lobby-card slot supplied by the application. The playbook must not serialize absolute destination coordinates, card texture, user-card ID, card ID, Three.js object, Raphael object, or DOM node. Landing X/Y offset, final card size, and other application-owned anchor values must be constrained so an imported or edited recipe cannot move the settled slot.

**FR-LOBBY-PLAYBOOK-003** — Editing, resetting, importing, or applying one intro target must not mutate the recipes or delays of the other four intro targets. A complete intro batch must compile all available current cards against their corresponding left-to-right entries and settle each one exactly at its supplied anchor.

**FR-LOBBY-PLAYBOOK-004** — The Gentle Wind exit must be authored as one shared sequence-level recipe and cadence rather than five independently named exits. At runtime it must compile that shared entry into one plan per current lobby card, beginning each plan at that card's exact settled anchor.

**FR-LOBBY-PLAYBOOK-005** — Every exit batch must use one explicit sequence seed. It must derive one shared gust and one stable per-slot seed for each card, then sample bounded variation in heading, distance, endpoint, curve, lift, duration/speed, release orientation, turns, and delay while constructing the plans. No random value may be sampled during animation frames.

**FR-LOBBY-PLAYBOOK-006** — A Gentle Wind batch must read as one coherent force acting on five physical cards while retaining visible variance. All five cards must have distinct endpoints and paths; every endpoint must place the complete card beyond the lower-left application boundary with the declared clearance. Variation must remain inside the authoring, camera, perspective, table-clearance, duration, and finite-value envelopes.

**FR-LOBBY-PLAYBOOK-007** — The Studio must expose `Lock wind seed` and `New variation`. With the seed locked, repeated previews and production exits use the same explicit seed and therefore the same five derived plans. With it unlocked, each production exit chooses one new run seed before planning and uses it for the complete five-card batch. `New variation` changes only the playbook's candidate wind seed and cannot mutate motion recipes, anchors, hand data, or Graphics preference.

**FR-LOBBY-PLAYBOOK-008** — When Modern lobby rendering is effective and ready, selecting Play, Shop, Tutorials, Replay, or Deck must request the same generic Gentle Wind exit before invoking the command's existing continuation. The selected command name may identify diagnostics but must not choose a different exit recipe, seed policy, endpoint region, or choreography.

**FR-LOBBY-PLAYBOOK-009** — While one lobby command continuation is pending, additional lobby-command clicks must be ignored and must not queue, replace, or duplicate either animation or navigation. The original continuation must run exactly once after normal completion, reduced-motion completion, cancellation, surface failure, or watchdog expiry.

**FR-LOBBY-PLAYBOOK-010** — The command wait must be bounded by a fail-open watchdog derived from the compiled batch deadline and capped by an application maximum. If planning, rendering, texture readiness, WebGL, callback delivery, or cleanup fails, the selected command must continue without the animation. The playbook must never trap the user in the lobby or issue the command more than once.

**FR-LOBBY-PLAYBOOK-011** — When Legacy is effective, all lobby commands must follow their existing immediate behavior. They must not lazy-load Three.js solely to animate an exit, wait for a playbook, hide Legacy cards through the Modern gate, or depend on Modern readiness.

**FR-LOBBY-PLAYBOOK-012** — Returning from the Tutorials submenu through Back must rebuild the main command list and request the current five-entry intro through the same production planner and lobby surface used by initial presentation. If Modern is unavailable or Legacy is effective, Back must still restore the command list immediately without a motion dependency.

**FR-LOBBY-PLAYBOOK-013** — `Apply & Preview in Lobby` must validate and persist the complete playbook before preview. It must close the Studio, run the selected target's production sequence against the real lobby hand, hold the completed state only for a short bounded observation interval, restore the cards as needed, and reopen the Studio with the edited target and UI state intact.

**FR-LOBBY-PLAYBOOK-014** — A Studio lobby preview started while Legacy is requested may temporarily initialize and present Modern without writing the Graphics preference key or changing the user's stored request. Completion, failure, cancellation, or watchdog expiry must restore the prior requested/effective presentation and stable focus. A user-initiated Graphics choice made during that interval must remain authoritative.

**FR-LOBBY-PLAYBOOK-015** — The complete playbook must persist through guarded, versioned browser `localStorage` under a key distinct from Graphics preference and Studio session UI state. It must survive refresh, a new tab, browser restart, and compatible feature deployments on the same origin. Unavailable, malformed, unsupported-version, or unsafe storage must fall back to the built-in playbook without blocking application startup or changing Graphics mode.

**FR-LOBBY-PLAYBOOK-016** — `Export Playbook` and `Import Playbook` must operate on the complete playbook, including all five intro entries, the shared Gentle Wind exit entry, per-entry delays, and wind seed/lock policy. Serialization must be canonical and human-readable. Import must parse and validate the entire document into a temporary value and replace/persist the active playbook only after success; every failure must retain the last valid playbook and issue no network request.

**FR-LOBBY-PLAYBOOK-017** — Intro and exit animation must be Modern-only presentation. Neither sequence may mutate current hand order, card identity, deck, shop, tutorial state, replay identity, account, coins, game state, server values, command meaning, or protocol requests. Phase 0.9 does not make the lobby hand playable or expand the active-match Modern renderer.

**FR-LOBBY-PLAYBOOK-018** — Reduced motion must preserve exact sequence completion and command flow. Intro may present cards immediately at their anchors and exit may complete without continuous spatial travel, but the corresponding production callback, card visibility/reset, and pending-command release must occur exactly once.

**FR-LOBBY-PLAYBOOK-019** — Lifecycle cancellation caused by Legacy selection, lobby hide, hand replacement, surface replacement/disposal, context loss, or a newer sequence must invalidate the old batch, settle or hide cards according to the owning flow, release the sole pending frame, and complete any held command through its fail-open path without allowing a late frame or callback to affect the next view.

**FR-LOBBY-PLAYBOOK-020** — Diagnostics must expose normalized playbook version, playbook revision, sequence, trigger, request ID, requested and derived seeds, shared gust, per-card target, delay, endpoint, phase, outcome, total duration, deadline, pending command, and watchdog outcome as plain cloned data. Diagnostics must not expose renderer objects or become a second source of truth.

**FR-LOBBY-PLAYBOOK-021** — The rejected Phase 0.7 `casual-drop-left` constants and gesture names must not be silently promoted into Phase 0.9 defaults. Phase 0.7 remains negative visual evidence. Phase 0.9 recipes and captures require their own normal-speed review even when deterministic, lifecycle, and geometry tests pass.

### 11.16 Phase 0.11 renderer-local active-match pickup/follow study

**FR-MATCH-PICKUP-001** — Phase 0.11 may accept a primary pointer activation only on a currently rendered player-hand card while the Modern active-match surface is ready. Opponent cards, empty board space, the board frame, status copy, and retained hidden Legacy objects are ineligible.

**FR-MATCH-PICKUP-002** — Card picking must resolve the visually topmost eligible player card under the pointer according to deterministic depth and render ordering. Overlapped portions of a lower card must not win through a card visibly above them.

**FR-MATCH-PICKUP-003** — One accepted activation must establish exactly one renderer-local hold identified by plain player-card identity and current hand index. The hold must not store or expose a Raphael object, DOM node, Three.js object through the bridge, jQuery object, controller callback, or network primitive.

**FR-MATCH-PICKUP-004** — The renderer-local hold must not set or mirror Legacy `dragging`, `isDroppable`, grab-point, card-node pointer attributes, controller selection, turn ownership, legal targets, timers, or any other game state. It must emit no semantic select, move, drag, drop, or cancel intent and must issue no HTTP, navigation, analytics, or other application request.

**FR-MATCH-PICKUP-005** — The ready Phase 0.11 surface must use one constrained head-on perspective camera calibrated to the 693 by 500 logical active-match region. Before pickup, all ten possible hand cards must retain the exact Phase 0.10 logical screen rectangles, centered silhouettes, zero local-X/local-Y/local-Z rotation, deterministic overlap, and a shared visually flat table plane. Left, center, and right cards must not acquire opposite shear, radial fan, or curved-surface lean from camera position.

**FR-MATCH-PICKUP-006** — Pickup must bring the accepted card above every settled hand card in both depth and explicit render order. Its lift transition should use the Legacy nominal 300-millisecond pickup interval and must finish with the card's settled-orientation projected width and height equal to `1.075` times its resting projection. Perspective depth and authored scale must be calibrated as one result; they must not compound into a larger unintended enlargement.

**FR-MATCH-PICKUP-007** — The accepted logical grab point within the card rectangle, or an equivalent center-relative offset, must define the follow target throughout lift and movement. Pickup must not reinterpret that point as a center grab or snap the card center to the pointer. Client coordinates must be mapped through the actual active-host bounding rectangle into the 693 by 500 logical plane, so application scale `1`, `1.5`, `2`, and `3`, browser zoom, and device-pixel ratio do not alter the logical target.

**FR-MATCH-PICKUP-008** — After the first click, the card must follow pointer movement within the active-match host without requiring a mouse button to remain pressed. Pointer follow may lag through a bounded, frame-rate-independent smoothing response for physical character, but steady or stationary input must converge so the accepted local card point is within one logical pixel of its mapped target. Pointer departure from the host must stop accumulating travel velocity and level the card without creating a drop or cancellation.

**FR-MATCH-PICKUP-009** — Transient three-dimensional resistance must derive from filtered logical pointer velocity. Horizontal travel must produce a bounded trailing side tilt and vertical travel a bounded trailing pitch; each axis must oppose the apparent direction of travel, remain within `10` degrees of the calibrated flat pose, become plainly visible during ordinary brisk cardinal and diagonal movement, remain finite under irregular or zero-duration event intervals, and never turn far enough to expose or require a card back.

**FR-MATCH-PICKUP-010** — When pointer velocity approaches zero, transient pitch and side tilt must damp monotonically toward zero without oscillation, overshoot, random jitter, or residual rotation. The held card remains lifted and front-facing after tilt settles. Idle cards and the camera remain unchanged.

**FR-MATCH-PICKUP-011** — Phase 0.11 must not implement a second-click drop. An activation on the held card, another player card, an opponent card, a future board slot, or empty space while a hold exists must be ignored and not queued. It must not replace the held card or cause a return animation.

**FR-MATCH-PICKUP-012** — Phase 0.11 must create no board-slot pick mesh, legal or illegal target state, hover highlight, click-to-place path, invalid-drop result, return-to-hand trajectory, request token, or server move payload. The established hand origin remains available only as the renderer's cancellation reset pose.

**FR-MATCH-PICKUP-013** — Legacy selection, active-match deactivation, lobby presentation, selected-card removal, any hand-description revision, surface-kind replacement, explicit suspension, page visibility loss, WebGL context loss, initialization fallback, and disposal must invalidate the hold generation, detach its input ownership, cancel its pending frame, and restore or discard the transient card pose atomically. A late pointer event or animation callback from the invalid generation cannot affect the next surface.

**FR-MATCH-PICKUP-014** — With `prefers-reduced-motion: reduce`, an accepted pickup must enter its stable held pose immediately, preserve grab-offset pointer follow, suppress velocity-driven pitch and side tilt, and render only on accepted pointer updates or lifecycle changes. Reduced motion cannot convert the study into a drop, change authority, or prevent immediate Legacy restoration.

**FR-MATCH-PICKUP-015** — Normal motion must use at most one pending `requestAnimationFrame` callback for the active-match surface. A frame may be requested while lift, positional follow, or tilt damping has not converged. A stationary converged held card and every unheld settled hand must own zero pending frame; no unconditional idle loop is permitted.

**FR-MATCH-PICKUP-016** — Plain cloned diagnostics must expose camera calibration, settled flat-table policy, interaction label `pickup-only`, handler attachment, held-card identity limited to already permitted player data, phase, original anchor, logical grab offset, current pointer/target, filtered velocity, projected scale, lift, pitch, side tilt, render order, accepted/ignored activation counts, pending-frame state, reduced-motion state, and zero semantic-action/request counts. Diagnostics must not expose renderer objects or concealed opponent information.

**FR-MATCH-PICKUP-017** — User-facing Graphics status must continue to identify Modern as incomplete. It may say that pickup/follow is a motion study, but must not claim that card selection, board placement, score, turn state, rules, effects, or playable Modern behavior is implemented.

**FR-MATCH-PICKUP-018** — A failure before or during this renderer-local study must not attempt to reconcile a hold into Legacy. It must clear Modern input and animation ownership, dispose or hide the failed surface, reveal the intact live Legacy state once, preserve the requested/effective mode distinction and local diagnostic reason, and issue no gameplay request.

**FR-MATCH-PICKUP-019** — The Phase 0.11 source and generated bundle must continue to use Three.js `0.185.1` (`r185`) and must share the cache identity `0.185.1-match-pickup.2`. The loader URL, bundle registration, DOM metadata, diagnostics, static contract, and deployment artifact must not disagree.

**FR-MATCH-PICKUP-020** — This pointer-only motion study does not satisfy the semantic DOM, keyboard selection, cancellation, slot discovery, or placement obligations of `KB-PLAY-01`. It must not be advertised as accessible playable input, and it must not weaken the requirement that a future playable action flow use the shared semantic dispatcher.

### 11.17 Phase 0.12 renderer-local second-click invalid return

Phase 0.12 preserves the Phase 0.11 pickup/follow requirements as its starting state and explicitly supersedes only the historical no-second-click and no-return behavior in `FR-MATCH-PICKUP-011` and `FR-MATCH-PICKUP-012`. Those clauses remain accurate records of the Phase 0.11 boundary. The corresponding current-surface diagnostic label and cache identity in `FR-MATCH-PICKUP-016` and `FR-MATCH-PICKUP-019` also remain historical Phase 0.11 evidence; `FR-MATCH-RETURN-014` and `FR-MATCH-RETURN-016` define their Phase 0.12 replacements. The following requirements define the later Phase 0.12 behavior.

**FR-MATCH-RETURN-001** — A first accepted player-card click must continue to create exactly one Phase 0.11 renderer-local hold. That hold must begin unarmed. The return may become armed only after the 300-millisecond pickup lift reaches full held depth; pointer-follow or resistance damping may still be converging without postponing arming. If a second click arrives after that elapsed boundary but before the browser delivers the scheduled endpoint frame, the click path must synchronously advance the pickup to the same full-depth sample before starting return rather than reject the click or wait for a third click. Reduced-motion pickup may arm immediately because it commits the lifted endpoint synchronously.

**FR-MATCH-RETURN-002** — A primary click while an unarmed hold exists must be ignored and must not be queued, remembered, replayed, or converted into a later return. It must not cancel or restart pickup, replace the held card, or create another animation-frame request.

**FR-MATCH-RETURN-003** — A primary click while an armed, non-returning hold exists must begin exactly one renderer-local invalid return. Pointer location within the 693 by 500 active-match host has no effect on the result. The held card, another player card, an opponent card, empty play-surface space, and representative future-slot coordinates inside that host all produce the same always-invalid return because Phase 0.12 defines zero Modern drop zones. The surrounding CSS board frame remains outside this input surface.

**FR-MATCH-RETURN-004** — Phase 0.12 must create no slot pick mesh, drop-zone collection, legal-target query, invalid-target query, hover or placement highlight, placement result, target identifier, request token, move payload, callback continuation, or server interaction. “Invalid” is the declared renderer-local default outcome, not the result of consulting game rules or controller state.

**FR-MATCH-RETURN-005** — A normal-motion invalid return must use a 300-millisecond timeline anchored at the accepted second click. Normalized progress `t` must be clamped to `[0, 1]` and sampled with the live Legacy invalid-return timing character:

```text
cubicOut(t) = 1 - (1 - t)^3
```

The same eased progress must drive logical screen translation from the visible held center to the captured canonical hand center, projected scale from the current held projection to exactly `1`, local-X/local-Y tilt to zero, and one complete clockwise screen-space turn. Because the Three.js card uses a world-y-up convention, the clockwise turn is represented by `-2π` local-Z radians from the starting roll.

**FR-MATCH-RETURN-006** — The return must begin from the card's currently presented pose without a first-frame jump. It must target the canonical original hand pose captured by the current hand entry rather than a pointer-derived or newly inferred location. The returned center must be the original hand rectangle center, not the original click point.

**FR-MATCH-RETURN-007** — Completion must normalize rather than retain the unwrapped turn. Position, depth, projected scale, local-X/local-Y/local-Z rotation, render order, analytic-shadow visibility and opacity, phase, held flag, and pickup eligibility must equal the canonical pre-pickup hand state exactly. The implementation must not copy Legacy's random residual `[-2°, 2°]` angle because Phase 0.11 established exact zero-rotation canonical rest.

**FR-MATCH-RETURN-008** — The returning card must own an exclusive input lock. Pointer movement and later clicks must not retarget, restart, speed up, cancel, replace, or queue a pickup or return. The sole pending frame and accepted-return count must remain unchanged by ignored input. Exact normal or reduced-motion settlement releases the lock and makes a later card click eligible immediately.

**FR-MATCH-RETURN-009** — Return motion must reuse the active-match surface's one demand-driven scheduler. At most one animation-frame callback may be pending. Completion, cancellation, reduced motion, suspension, or disposal must leave zero pending return frames and no idle loop.

**FR-MATCH-RETURN-010** — Every hold and scheduled callback must carry the current monotonic hold generation. A callback must verify both its scheduled frame identity and hold generation before clearing scheduler state or advancing pickup/return motion. A callback cancelled by hand replacement, mode change, view change, failure, or disposal must remain inert if manually or asynchronously invoked after a newer hold exists.

**FR-MATCH-RETURN-011** — Legacy selection or automatic fallback, active-match deactivation, early exit, game over, lobby presentation, any hand-description revision, selected-card removal, surface-kind replacement, explicit suspension, page visibility loss, WebGL context loss, renderer failure, reconstruction, and disposal must invalidate return state atomically. A reusable mesh resets immediately to canonical rest; a disposed mesh is discarded. Lifecycle cancellation must not run or finish the visible 300-millisecond invalid return.

**FR-MATCH-RETURN-012** — With `prefers-reduced-motion: reduce`, an armed second click must commit the exact canonical hand pose immediately without continuous translation or roll, increment accepted and completed invalid-return counts once, record reduced-motion completion, release the return lock, and own no pending animation frame. The first-click direct-follow contract from `FR-MATCH-PICKUP-014` remains unchanged.

**FR-MATCH-RETURN-013** — The invalid return must remain entirely renderer-local. Beyond the already permitted plain hand-presentation entry and its canonical anchor, it must not read from, set, mirror, call, or emit Legacy `grab`, `drop`, `drawPlayerOneHand`, `dragging`, `isDroppable`, grab-point, turn, board, score, rule, dialog, review, replay, game ID, hand membership/order, node attribute, semantic-action, HTTP, navigation, analytics, or callback state. Before, during, and after return, diagnostics must continue to report zero semantic-action, gameplay-mutation, and request counts.

**FR-MATCH-RETURN-014** — Plain cloned diagnostics must identify interaction policy `pickup-invalid-return`, zero drop zones, valid placement as unimplemented, current hold generation, arming state, return phase, accepted/completed/ignored-unarmed/ignored-returning counters, and last-return outcome. While running, diagnostics must expose start, destination, current pose, raw/eased progress, 300-millisecond duration, `cubic-out`, clockwise direction, and reduced-motion state. Completion diagnostics must expose the normalized final pose. Diagnostics must contain no renderer object, DOM event, Raphael handle, hidden opponent value, network primitive, or authority-bearing callback.

**FR-MATCH-RETURN-015** — User-facing Graphics status may say that a second click returns the card to the hand, but it must continue to identify board placement as unavailable and Modern as non-playable. It must not describe the renderer-local return as a move, cancellation command, legal-target decision, or implemented drop zone.

**FR-MATCH-RETURN-016** — The Phase 0.12 source and generated bundle must retain Three.js `0.185.1` (`r185`) and share cache identity `0.185.1-match-return.1`. The loader URL, source registration, generated artifact, DOM metadata, runtime diagnostics, static contract, browser contract, deployment artifact, and requirements must not disagree. `0.185.1-match-pickup.2` remains the historical Phase 0.11 identity and is no longer the current active-match Modern URL.

### 11.18 Phase 0.13 renderer-local valid-zone hover and placement preview

Phase 0.13 retains all Phase 0.11 pickup/follow behavior and all Phase 0.12 invalid-return behavior. It supersedes only `FR-MATCH-RETURN-003`, `FR-MATCH-RETURN-004`, `FR-MATCH-RETURN-014`, `FR-MATCH-RETURN-015`, and the current cache identity in `FR-MATCH-RETURN-016` for the ready Phase 0.13 surface. Those requirements remain the accurate historical Phase 0.12 record.

**FR-MATCH-PLACEMENT-PREVIEW-001** — The temporary presentation bridge must describe exactly nine board rectangles as cloned plain data when the Legacy board model is complete. Slot indices `0` through `8` run left-to-right and top-to-bottom. Their logical top-left x coordinates are `172`, `289`, and `406`; y coordinates are `35`, `181`, and `327`; every width is `117`; every height is `146`; and every corner radius is `10`. An incomplete or malformed board description must fail closed with no valid Modern zone.

**FR-MATCH-PLACEMENT-PREVIEW-002** — Each description may contain only slot index, logical rectangle, corner radius, availability, and current validity. Availability means the live slot is empty. Current validity is true only when that availability is true, the Legacy board input gate is enabled, `isMyTurn` is true, and neither game-over nor review state suppresses play. The renderer must consume this bit without consulting card values, neighboring cards, rules, scores, or retained Raphael objects and must never turn false or absent validity into true.

**FR-MATCH-PLACEMENT-PREVIEW-003** — While one card is held and not returning or placing, pointer hit testing must map client coordinates through the active-host bounds into the 693 by 500 logical region. It must use half-open rectangles (`x <= pointerX < x + width`, `y <= pointerY < y + height`) and deterministic slot order. At most one zone can be hovered. Application scale, browser zoom, device-pixel ratio, and drawing-buffer ratio must not change the winning logical slot.

**FR-MATCH-PLACEMENT-PREVIEW-004** — Only the currently hovered available and valid zone may render a shadow. Its visual contract is one black 117 by 146 rounded rectangle, radius `10`, no stroke, and opacity `0.3`, aligned exactly to the Legacy rectangle. All other zones remain fully invisible. No shadow may be visible without a hold, after pointer leave, while returning or placing, after one preview placement, or when the zone becomes occupied or invalid.

**FR-MATCH-PLACEMENT-PREVIEW-005** — Hover may appear during the pickup lift as soon as pointer movement enters a valid rectangle, matching the Legacy drag-time cue. This does not arm placement early. A primary click before the retained 300-millisecond pickup arming boundary remains ignored and unqueued under `FR-MATCH-RETURN-001` and `FR-MATCH-RETURN-002`, even if the shadow is visible.

**FR-MATCH-PLACEMENT-PREVIEW-006** — Once the hold is armed, a primary click whose logical point is inside the currently valid rectangle must begin exactly one renderer-local placement preview for that slot. The implementation must capture the currently visible card pose, sample the residual roll once, enter an exclusive `placing` phase, hide the hover, freeze pointer-follow velocity, and reuse the active surface's sole scheduler. A click outside all current valid rectangles must run the unchanged Phase 0.12 invalid return.

**FR-MATCH-PLACEMENT-PREVIEW-007** — Normal placement must last 300 milliseconds from the accepted click and sample `cubicOut(t) = 1 - (1 - t)^3`. The same eased progress must interpolate the visible logical center from its current value to the exact zone center `(x + width/2, y + height/2)`, projected scale to exactly `1`, perspective depth to table depth `0`, and local-X/local-Y tilt to exactly `0`. The first sample must reproduce the current pose without a jump. There must be no overshoot, bounce, position jitter, full-turn spin, card-back presentation, camera motion, or compounded scale.

**FR-MATCH-PLACEMENT-PREVIEW-008** — Placement variance must consist only of one Legacy-equivalent screen-space Z roll sampled once at acceptance from `[-2°, 2°]`. The local-Z endpoint must use the inverse sign required by the Three.js y-up convention. The sample must remain constant through every frame and the settled preview. No random value may influence center, depth, scale, duration, easing, or per-frame motion.

**FR-MATCH-PLACEMENT-PREVIEW-009** — Completion must leave the card front-facing, visible, inert, and settled at the exact slot center, projected scale `1`, depth `0`, local-X/local-Y `0`, and the sampled local-Z roll. The card must have deterministic placed render order above the hover plane. It must not snap back to the hand, acquire another shadow, or become pickable before reset.

**FR-MATCH-PLACEMENT-PREVIEW-010** — Only one renderer-local placement preview may be accepted for one unchanged hand/drop-zone presentation snapshot. After completion, all first-click pickup and further placement attempts are ignored until a snapshot revision or lifecycle boundary restores the canonical hand projection. This one-preview guard must not read, set, or imply the authoritative turn.

**FR-MATCH-PLACEMENT-PREVIEW-011** — While `placing`, pointer movement and additional clicks must not retarget, restart, cancel, accelerate, replace, or queue pickup, invalid return, or placement. The accepted-placement count and sole pending frame must remain unchanged by ignored input. Normal completion, reduced-motion completion, or lifecycle cancellation releases the transient hold exactly once.

**FR-MATCH-PLACEMENT-PREVIEW-012** — With `prefers-reduced-motion: reduce`, an armed valid-zone click must synchronously sample the residual roll once and commit the same exact slot-center endpoint without continuous translation, scale, tilt, or roll interpolation. It must record one accepted and completed reduced-motion placement, leave the preview inert, and own no pending frame.

**FR-MATCH-PLACEMENT-PREVIEW-013** — Mode or view change, active-match deactivation, early exit, game over, lobby presentation, hand or drop-zone revision, selected-card removal, page visibility loss, context loss, suspension, replacement, initialization fallback, renderer failure, reconstruction, and disposal must clear hover and renderer-local placement atomically. A reusable entry returns to its canonical hand pose; a disposed entry is discarded. Hold-generation and frame-identity checks must make every late callback inert.

**FR-MATCH-PLACEMENT-PREVIEW-014** — Hover and placement are strictly non-authoritative. They must not call, mirror, or mutate Legacy `grab`, `drop`, `drawBoardDrops`, `drawPlayerOneHand`, `dragging`, `isDroppable`, `isMyTurn`, board input enablement, board occupancy, hand membership/order, scores, rules, review/replay/dialog state, callbacks, semantic actions, request payloads, HTTP, navigation, or analytics. The retained Raphael node collection and game-state snapshot must remain byte-for-byte or identity-equivalent before and after a preview.

**FR-MATCH-PLACEMENT-PREVIEW-015** — Plain cloned diagnostics must expose the nine normalized zone rectangles and current availability/validity, hovered slot or `null`, placement policy, one-per-snapshot guard, 300-millisecond cubic-out duration, `[-2°, 2°]` screen-roll range, current placing progress and pose, sampled endpoint, accepted/completed/ignored counters, last outcome, hold generation, pending-frame state, reduced-motion state, and zero semantic-action/gameplay-mutation/request counts. Diagnostics must expose no renderer object, Raphael handle, DOM event, concealed opponent value, random function, callback, or network primitive.

**FR-MATCH-PLACEMENT-PREVIEW-016** — User-facing Graphics status may explain that hovering an available board space and clicking previews placement visually. It must explicitly state that the move is not submitted and must continue to identify Modern as incomplete and non-playable.

**FR-MATCH-PLACEMENT-PREVIEW-017** — The Phase 0.13 source and generated bundle must retain Three.js `0.185.1` (`r185`) and share cache identity `0.185.1-match-placement.1`. The loader URL, source registration, generated artifact, DOM metadata, runtime diagnostics, static contract, browser contract, deployment artifact, and requirements must not disagree. `0.185.1-match-return.1` remains the historical Phase 0.12 identity.

### 11.19 Phase 0.14 renderer-local active-match turn-indicator coin

Phase 0.14 retains every Phase 0.13 requirement and acceptance criterion for cards, zones, invalid return, and placement preview. It supersedes only the statements that Modern renders no turn marker and the current cache identity in `FR-MATCH-PLACEMENT-PREVIEW-017`. The Phase 0.13 text remains its accurate historical record.

**FR-MATCH-TURN-COIN-001** — The temporary game bridge must expose at most one cloned plain turn-indicator descriptor with exactly the presentation fields `sequence`, `side`, `x`, `y`, `width`, `height`, `textureUrl`, and `visible`. It must contain no Raphael element, Three.js object, callback, timer, function, game object, or request primitive. `sequence` must be a nonnegative integer; `side` must be `initial`, `player`, or `opponent`; and `visible` must be boolean-equivalent presentation data.

**FR-MATCH-TURN-COIN-002** — Legacy marker geometry is normative. The initial rectangle is top-left `(327, 420)`, size 41 by 41, center `(347.5, 440.5)`. The player rectangle is top-left `(33, 420)`, center `(53.5, 440.5)`. The opponent rectangle is top-left `(621, 420)`, center `(641.5, 440.5)`. All coordinates are in the existing 693 by 500 logical active-match space and remain invariant under application scale, browser zoom, device-pixel ratio, and drawing-buffer ratio.

**FR-MATCH-TURN-COIN-003** — Legacy initializes `sequence` to `0` and increments it once before each described side transition. The descriptor must identify the already-decided destination; it must not ask Modern to choose a side. A newly created or reconstructed Modern surface must snap its first valid descriptor directly to that descriptor's center, table depth, flat orientation, and visibility without replaying a transition from `initial` or another earlier side.

**FR-MATCH-TURN-COIN-004** — After first-snapshot settlement, a transition may begin only when a valid descriptor carries both a sequence strictly greater than the accepted sequence and a changed target key. A duplicate, stale, same-sequence, same-target, or visibility-only notification must not replay a completed transition. If a newer valid sequence arrives while motion is active, the old generation must be cancelled and the new deterministic plan must begin from the exact currently rendered screen position, height, rotations, and shadow values without a first-frame jump.

**FR-MATCH-TURN-COIN-005** — The only accepted marker textures are the existing same-origin 41 by 41 assets `/images/dime-heads.png` and `/images/dime-tails.png`. Legacy selects heads when `isMyTurn` is true at marker construction and tails otherwise, then retains that selected image while moving the marker between sides. Modern must consume the descriptor-selected URL and must not recompute the choice from turn state.

**FR-MATCH-TURN-COIN-006** — Phase 0.14 must apply the same selected texture to separate front and back circular face meshes. The reverse face may be oriented so the image reads correctly when visible, but it must not substitute, synthesize, tint, mirror as a semantic result, or alternate to the other dime asset. Distinct face artwork, an actual randomized coin toss, and a face-dependent turn meaning require a later decision.

**FR-MATCH-TURN-COIN-007** — The production marker must be a true 3D circular object with logical diameter `41`, thickness `3`, two 64-segment face circles, and one 64-segment open cylindrical edge. The face planes must be separated sufficiently from the edge to prevent z-fighting without changing the 41-pixel settled silhouette. The edge must become visibly edge-on during authored pitch/yaw motion; a square plane, card rectangle, billboard-only pseudo-flip, CSS transform, or flat image translation does not satisfy this requirement.

**FR-MATCH-TURN-COIN-008** — Face materials must be unlit, white, tone-map-independent, and use sRGB texture handling so the approved dime art is not darkened by scene lighting. The cylindrical edge may use restrained lit metallic material to communicate thickness. Hardware shadow mapping remains disabled. A bounded analytic contact shadow may respond to height using the profile, but it must be owned by this marker, must not alter card materials, and must settle without shimmer, grid artifacts, or residual activity.

**FR-MATCH-TURN-COIN-009** — The renderer-neutral turn-coin profile schema version is `1`. Its canonical shape is:

```text
{
  schemaVersion,
  id,
  label,
  path: {curvePx, apexHeight, flightMs},
  rotation: {
    flipTurns,
    tumbleTurns,
    spinTurns,
    contactTiltDeg
  },
  landing: {settleMs},
  shadow: {strength, spread}
}
```

The profile must not contain source, destination, side, sequence, direction, texture URL, current turn, callback, timestamp, DOM node, renderer object, request, or game state. Normalization returns finite bounded plain data without mutating its source. Canonical serialization and strict parsing must be stable and reject unknown keys, non-finite values, and unsupported future schema versions atomically.

**FR-MATCH-TURN-COIN-010** — Profile values must remain within these safety limits:

| Field | Minimum | Maximum |
|---|---:|---:|
| `path.curvePx` | -240 | 240 |
| `path.apexHeight` | 0 | 300 |
| `path.flightMs` | 200 | 2,000 |
| `rotation.flipTurns` | -8 | 8 |
| `rotation.tumbleTurns` | -8 | 8 |
| `rotation.spinTurns` | -4 | 4 |
| `rotation.contactTiltDeg` | -45 | 45 |
| `landing.settleMs` | 0 | 600 |
| `shadow.strength` | 0 | 1 |
| `shadow.spread` | 0.25 | 4 |

The Phase 0.14 application default is `id: "turn-marker-toss"`, label `Turn Marker Toss`, curve `-54`, apex `92`, flight `650` milliseconds, `2.5` flip turns, `0.5` tumble turns, `0.125` spin turns, contact tilt `8` degrees, settle `110` milliseconds, shadow strength `0.34`, and shadow spread `1`. Its nominal motion duration is therefore 760 milliseconds.

An optional plan-instance `delayMs` is not part of the persisted profile. When the shared planner is invoked, it must default to `0`, accept only a finite value from `0` through `10,000` milliseconds, and reject an invalid value before returning a plan. Phase 0.14 production transitions and the Motion Studio coin target must both supply or resolve `0`; a nonzero live delay requires an explicit later requirement.

**FR-MATCH-TURN-COIN-011** — Planning and sampling must be pure, deterministic, DOM-free, and Three.js-free. The application supplies the source/destination centers and optional current interrupted pose. Horizontal travel determines a direction sign so the player-to-opponent and opponent-to-player plans are mirror counterparts. The screen path must be a quadratic Bézier whose control x is the endpoint midpoint and whose control y is the endpoint midpoint plus `curvePx`. The physical height during flight must follow:

```text
height =
  sourceHeight × (1 - flightProgress)
  + apexHeight × 4 × flightProgress × (1 - flightProgress)
```

No random value may be sampled during planning, animation, Studio replay, or production transition.

**FR-MATCH-TURN-COIN-012** — During flight, local-X tumble, local-Y flip, and local-Z spin must interpolate continuously from the captured source rotations toward their profile turn counts with the travel-direction sign; contact tilt is added only to local X with the same sign. Height must be real camera-relative depth, not scale-only simulation. Shadow opacity must decrease and shadow spread increase as height rises. The default profile must visibly expose the circular edge during both directions.

**FR-MATCH-TURN-COIN-013** — At flight contact, screen center must equal the exact described destination and height must equal `0`. During `settleMs`, screen position and height remain fixed while a bounded smooth-step settle moves local-X/local-Y to their nearest flat half-turn multiples and local-Z to its nearest full-turn multiple. The terminal pose must be finite, flat, stable, at authored scale `1`, and preserve the same selected texture. Later motion may retain equivalent unwrapped rotation history, but the rendered marker cannot wobble, drift, penetrate the table, or own an idle frame.

**FR-MATCH-TURN-COIN-014** — The marker must use a demand-driven scheduler with at most one pending turn-coin animation-frame callback. Its frame and motion generation must both match before a callback can mutate pose. Coin motion may coexist with the retained card-study scheduler without blocking pickup, return, placement, or Legacy control flow. Completion must cancel or consume its frame exactly once, record one completed transition, and return the coin pending-frame count to zero.

**FR-MATCH-TURN-COIN-015** — With `prefers-reduced-motion: reduce`, a later accepted sequence must synchronously commit the same exact destination center, table depth, flat orientation, selected texture, visibility, and stable shadow endpoint. It must record the accepted and completed transition as reduced motion without continuous path, height, flip, tumble, spin, or a pending frame.

**FR-MATCH-TURN-COIN-016** — Mode or view change, active-match deactivation, early exit, game over, lobby presentation, descriptor removal, page visibility loss, context loss, suspension, surface replacement, initialization fallback, renderer failure, reconstruction, and disposal must invalidate the active coin generation and release its frame atomically. A reusable surface may settle the latest valid descriptor directly; disposal must discard the coin and its texture/material ownership. A stale texture completion, event, or captured animation callback must not recreate or move a coin after invalidation.

**FR-MATCH-TURN-COIN-017** — The turn coin is strictly non-authoritative and non-blocking. Creation, first-snapshot settlement, transition, supersession, completion, cancellation, profile update, and Studio preview must not read to derive or write `isMyTurn`, `turns`, board enablement, `dragging`, `isDroppable`, hand playability, opponent scheduling, score, rules, review/replay/dialog state, game-over state, Legacy marker attributes, or a request payload. They must not call or delay the Legacy `drawTurnMarker` continuation, dispatch a semantic action, submit HTTP, navigate, or alter the Phase 0.13 card-interaction state.

**FR-MATCH-TURN-COIN-018** — The applied normalized profile must persist under the dedicated browser-origin key `purett.turnMarkerMotion.v1`. It must not be embedded in or overwrite `purett.graphicsMode.v1`, `purett.lobbyMotionPlaybook.v1`, authoritative match state, an account, or repository defaults. Storage unavailability or malformed, unsafe, or future-schema data must fall back atomically to the application default while leaving Graphics and lobby-playbook values unchanged. Profile reads and writes issue no network request.

**FR-MATCH-TURN-COIN-019** — Motion Studio must register the application target `match-turn-coin-transition`, labeled `Match turn coin — Transition`. Selecting it must retain the existing 755 by 562 Studio stage but render the coin through an exact 693 by 500 active-match viewport inset at stage offset `(30, 30)`. Its camera must use the production 40-degree field of view, logical center `(346.5, 250)`, and distance `(500 / 2) / tan(20°)`. The production and Studio coin must use the same diameter, thickness, face/edge structure, flat-table convention, normalized profile, planner, sampler, and safety validation.

**FR-MATCH-TURN-COIN-020** — Studio coin endpoints are application-locked to player center `(53.5, 440.5)` and opponent center `(641.5, 440.5)`. A visible direction selector may preview Player → AI or AI → Player, but direct manipulation, JSON import, or profile edits cannot move or persist those endpoints. The Studio may use `/images/dime-heads.png` as its representative preview texture, applied identically to both faces; production continues to use the current descriptor texture.

**FR-MATCH-TURN-COIN-021** — The Studio coin target must expose only shared transport plus applicable path curve, apex height, flight duration, flip turns, tumble turns, spin turns, contact tilt, settle duration, shadow strength, and shadow spread controls. Card-only scale, skid, contact, start-position, lobby preset, intro-copy, and wind tools must be hidden or disabled. Replay, pause, step, rate, loop, timeline, scrubbing, helper path, live phase/height/perspective/face readout, reset, canonical profile export, and atomic profile import remain available and use the same sampled plan shown in diagnostics.

**FR-MATCH-TURN-COIN-022** — `Apply to Match Coin` must normalize and persist only the applied profile, increment one local profile revision, update a live Modern surface's future profile safely, and replay the Studio study for confirmation. It must not manufacture a turn transition for an unchanged sequence, close or reopen match input, change the Graphics mode, write the lobby playbook, or advance the game. The Studio's unsaved coin draft, selected preview direction, and view controls may be retained separately in the existing guarded session document.

**FR-MATCH-TURN-COIN-023** — Plain cloned active-match diagnostics must expose the turn-indicator policy, exact endpoints, descriptor, texture-face policy, geometry/material policy, normalized profile, status, current pose, active plan, motion generation, sequence, from/to sides, progress, duration, reduced-motion flag, pending-frame state, accepted/completed/cancelled/ignored counters, last outcome, and `gameplayAuthority: false`. Coordinator diagnostics must expose the applied profile and its revision. Studio diagnostics must expose `subjectKind: "coin"`, active-match coordinate space and stage offset, descriptor, profile, plan, pose, resources, playback state, and pending-frame state. No diagnostic may expose a renderer object, texture object, Legacy handle, callback, concealed card value, event, or request primitive.

**FR-MATCH-TURN-COIN-024** — User-facing status may say that Modern now previews the live turn coin and its authored 3D transition. It must still state that Modern is incomplete/non-playable and that the coin mirrors, rather than decides, the turn. Legacy remains available immediately.

**FR-MATCH-TURN-COIN-025** — The Phase 0.14 source and generated bundle must retain Three.js `0.185.1` (`r185`) and share cache identity `0.185.1-match-turn-coin.1`. The loader URL, source registration, generated artifact, DOM metadata, active-match and Studio diagnostics, static contract, browser contract, deployment artifact, and requirements must not disagree. `0.185.1-match-placement.1` remains the historical Phase 0.13 identity.

### 11.20 Phase 0.15 parallel Modern hinged game-cover projection

Phase 0.15 retains every Phase 0.14 lobby, active-match, card-interaction, turn-coin, and Motion Studio requirement. It supersedes only the earlier exclusion of `gh.cover` from Modern projection and the current generated-bundle identity in `FR-MATCH-TURN-COIN-025`. The Legacy Raphael cover remains live and authoritative; the following requirements authorize one parallel decorative projection rather than a renderer replacement or expansion of playable Modern authority.

**FR-GAME-COVER-001** — `gh.cover` must expose a defensively cloned plain presentation descriptor with exactly these top-level fields: `schemaVersion`, `sequence`, `target`, `startedAtMs`, `durationMs`, `easing`, `frame`, and `panels`. Schema version must be `1`; sequence must be a nonnegative monotonic integer; target must be `open` or `closed`. The descriptor must contain no Raphael element, Three.js object, DOM node, jQuery object, callback, timer handle, function, event, game object, controller object, request, or network primitive.

**FR-GAME-COVER-002** — The initial descriptor must be sequence `0`, target `closed`, `startedAtMs: null`, `durationMs: 0`, and `easing: null`. Its frame must be exactly `{x: 0, y: 0, width: 755, height: 562}`. Its two ordered panel records must be:

```text
left
  textureUrl = /images/left.png
  rect       = (0, 0, 377, 562)
  hinge      = left
  rotationSign = -1

right
  textureUrl = /images/right.png
  rect       = (376, 0, 378, 562)
  hinge      = right
  rotationSign = +1
```

No alternative texture URL, natural image dimension, inferred crop, panel order, rectangle, hinge name, or rotation sign is valid in Phase 0.15.

**FR-GAME-COVER-003** — Only an actual Legacy `isopen` target change may increment sequence and publish a transition descriptor. An accepted opening publishes target `open`, the current monotonic observation timestamp, duration `2000`, and easing `cubic-in`. An accepted closing publishes target `closed`, the current monotonic observation timestamp, duration `2000`, and easing `cubic-out`. A call that finds Legacy already targeted to the requested state must publish no new descriptor. `startedAtMs` is a presentation observation clock compatible with the animation-frame clock; it is never an application continuation clock.

**FR-GAME-COVER-004** — The exact Legacy opening contract remains authoritative. When previously closed, `open()` sets `isopen = true`, publishes the new target without waiting for Modern, schedules the current two Raphael 2,000-millisecond `<` animations, invokes a supplied public callback synchronously after scheduling, and leaves the Legacy left-panel completion to hide `#game-cover`. When already targeted open, a supplied callback remains synchronous and no new descriptor is published.

**FR-GAME-COVER-005** — The exact Legacy closing contract remains authoritative. When previously open, `close()` sets `isopen = false`, shows `#game-cover` immediately, stops the left Raphael panel, publishes the closed target without waiting for Modern, starts the left 2,000-millisecond `>` return, then stops and starts the right 2,000-millisecond `>` return. A supplied public callback is invoked only from the Legacy left-panel completion. When already targeted closed, a supplied callback remains synchronous and no new descriptor is published.

**FR-GAME-COVER-006** — Phase 0.15 must preserve existing close-during-open, duplicate-during-flight, open-during-close, and stale Legacy callback behavior rather than silently repairing it in the Modern layer. Modern must never set `isopen`; start, stop, or inspect a Raphael animation; show or hide `#game-cover`; call, await, delay, replace, suppress, coalesce, or duplicate a public callback; or decide when menu, game wrapper, tutorial, replay, early exit, game over, or input flow advances. A Modern completion has zero application-continuation semantics.

**FR-GAME-COVER-007** — The Modern cover must be a parallel page-lifetime Outer UI surface, not a lobby or active-match `surfaceKind` and not part of the 693 by 500 active-match host. Its 755 by 562 host and canvas must be a child sibling of the Legacy Raphael canvas inside the unchanged `#game-cover` parent. It may coexist with the one effective lobby or active-match Modern surface. Match activation/deactivation, lobby handoff, tutorial/replay flow, early exit, and game over must not dispose, reconstruct, or reactivate it. Graphics-mode suspension pauses its presentation while retaining reusable ownership; only component failure or replacement, coordinator teardown, or page teardown may end ownership.

**FR-GAME-COVER-008** — The parent `#game-cover` remains the Legacy-owned visibility, z-order, and full-stage pointer barrier. Before Modern cover readiness, the Legacy Raphael canvas remains visible. Its SVG root must receive the stable `#legacyGameCover.legacy-game-cover-canvas` identity through native SVG attribute mutation rather than a jQuery class helper. Only after both approved textures decode, both leaves are built, the latest descriptor is applied, and one complete Modern frame renders may a cover-specific ready gate atomically hide the Legacy child and reveal the Modern child. The gate must directly set mutually exclusive renderer-active state and Legacy visibility in addition to its parent CSS class, so failure of either identity path cannot paint both renderers. The gate must never expose a partial one-panel state, blank cover, mixed Legacy/Modern seam, simultaneously painted children, or input path through the parent. Hiding the Legacy paper must not stop, dispose, or remove it.

**FR-GAME-COVER-009** — Closed Modern geometry must reproduce the exact Legacy composition at logical scale: a 755 by 562 stage, the left 377 by 562 leaf beginning at x `0`, and the right 378 by 562 leaf beginning at x `376`. The one-logical-pixel overlap at x `376` must remain, and the right front must paint above the left front at that seam. The right leaf's outside hinge is x `754`, not the nominal stage width. At closed completion both leaf rotations are exactly zero and no gap, crop, stretch drift, dark seam, shimmer, or z-fighting may appear.

**FR-GAME-COVER-010** — Each Modern leaf must be a true three-dimensional panel with logical thickness `10`. The left leaf pivots at x `0` with negative local-Y rotation; the right leaf pivots at x `754` with positive local-Y rotation. Their inner edges move toward the camera and away from the center seam until each reaches an absolute open angle of exactly `112` degrees. A translation, x-scale collapse, CSS transform, flat billboard, center-seam hinge, horizontal single lid, curved-surface fan, or camera orbit is not conforming.

**FR-GAME-COVER-011** — The cover camera must be position-neutral and stage-centered, with a 40-degree vertical field of view and distance `(562 / 2) / tan(20°)` from logical center `(377.5, 281)`. Front materials must be unlit white, tone-map-independent, and use the approved textures as sRGB data without tinting or darkening. Backs and ten-unit edges may use restrained lit wood treatment. Hardware shadow maps remain disabled. Lighting, filtering, anisotropy, face offsets, and paint order must not alter the exact closed source-art appearance or introduce seam artifacts.

**FR-GAME-COVER-012** — Planning and sampling must be implemented in one renderer-neutral deterministic module with no DOM, jQuery, Raphael, Three.js, storage, game-controller, network, clock, or random dependency. Its only motion inputs are finite `fromOpenness` and `toOpenness` values in `[0, 1]`. It must return immutable plain plan and pose data. Production and deterministic tests must import the same planner and sampler.

**FR-GAME-COVER-013** — Every non-settled opening plan must last exactly 2,000 milliseconds even when it begins after an interrupted close. With raw normalized progress `t = clamp(elapsedMs / 2000, 0, 1)`, eased progress must be `t^3`, openness must interpolate from captured source openness to `1`, left local-Y rotation must be `-112° × openness`, and right local-Y rotation must be `+112° × openness`. Completion must normalize exactly to openness `1` and the signed 112-degree endpoints.

**FR-GAME-COVER-014** — Every non-settled closing plan must last exactly 2,000 milliseconds even when it begins after an interrupted open. With the same raw normalized progress, eased progress must be `1 - (1 - t)^3`, openness must interpolate from captured source openness to `0`, and both leaf rotations must derive from that openness using the signs in `FR-GAME-COVER-013`. Completion must normalize exactly to openness `0`, zero rotations, and the exact closed seam.

**FR-GAME-COVER-015** — A first sequence-0 closed descriptor must snap directly to the exact closed pose. A first later transition descriptor received after construction or delayed texture readiness must begin from the canonical opposite target and catch up using `now - startedAtMs`; if the Legacy interval has already elapsed, it snaps directly to the terminal target. A newer valid sequence during motion must sample the outgoing plan at the incoming descriptor's `startedAtMs`, use that exact openness as elapsed-zero for the replacement, cancel the prior generation, anchor the new full-duration plan to that same timestamp, and then catch up once to delivery `now`. This prevents both a transition-time discontinuity and double advancement on delayed delivery. A duplicate or older sequence is ignored. Visibility suspension, delayed readiness, and return from Legacy mode catch up to the newest descriptor timestamp rather than restarting or replaying motion.

**FR-GAME-COVER-016** — The Modern cover must use one independent demand-driven scheduler with at most one pending cover animation-frame callback. Every callback must capture both frame identity and motion generation and verify both before clearing scheduler state or applying a pose. Supersession, completion, suspension, reduced motion, failure, replacement, and disposal must return the pending cover-frame count to zero. A settled, hidden, suspended, failed, Legacy-selected, or disposed cover owns no idle frame.

**FR-GAME-COVER-017** — Selecting Legacy must first remove the Modern-ready gate, mark Modern inactive, and reveal and mark active the live Raphael child, then suspend the Modern cover and cancel its pending frame without changing the latest descriptor. Selecting Modern again may reuse a healthy cover surface and must catch up to the newest descriptor without callback or replay, then atomically mark Legacy inactive and hidden as Modern becomes active. Cover descriptor publication and hidden Raphael animation may continue while Modern presentation is active or suspended. Neither mode switch may leave both children painted, change requested/effective mode beyond the user's existing Graphics selection rules, or affect the lobby/active surface lifecycle.

**FR-GAME-COVER-018** — Cover-specific synchronous construction, facade, host, initialization, malformed-descriptor, either-texture, partial-texture, timeout, render, context-loss, visibility-handler, replacement, or disposal failure must be component-local. It must atomically reveal or retain the Legacy cover child, remove the cover-ready gate, cancel Modern cover work, classify cover diagnostics, and leave requested/effective Modern mode plus any healthy lobby or active-match Modern surface unchanged. Only a shared bundle or capability failure that prevents Modern globally may use the global fallback policy.

**FR-GAME-COVER-019** — Graphics-mode suspension must reveal Legacy and cancel the pending cover frame while preserving the latest descriptor, current pose, and reusable surface resources for catch-up under `FR-GAME-COVER-017`. Cover component failure/replacement, coordinator/page teardown, and disposal must instead invalidate the cover generation and reveal Legacy before releasing resources. Destructive cleanup must be idempotent and cancel the sole frame, pending texture timeout/load ownership, and visibility/context listeners; dispose partial and complete textures, face/body materials, both leaf geometries, lights and targets, renderer, context, and canvas; and make captured old frames and late texture completions inert. Neither suspension nor destructive cleanup may dispose or mutate the Legacy `gh.cover` instance.

**FR-GAME-COVER-020** — With `prefers-reduced-motion: reduce`, each accepted Modern cover target must synchronously commit the same exact terminal pose, record one reduced-motion projection completion, and own no animation frame. The Legacy Raphael cover must continue its ordinary animation, `isopen`, parent show/hide, callback timing, wrapper visibility, and pointer-shield lifecycle unchanged. A snapped Modern visual remaining under a Legacy-owned blocker until the Legacy interval ends is intentional.

**FR-GAME-COVER-021** — The Modern host and canvas are decorative: both must be `aria-hidden="true"`; the canvas must use `tabindex="-1"` and `pointer-events: none`; neither may expose a role, accessible name, live announcement, semantic action, pointer listener, keyboard listener, focus target, raycast target, or focus restoration behavior. The unchanged parent barrier must continue to prevent underlying game input for the Legacy-defined interval. Cover projection must not move, trap, hide, or announce the current DOM focus.

**FR-GAME-COVER-022** — The full-stage logical geometry, seam, hinge pivots, camera, openness, angles, and timing must remain invariant at application scales `1`, `1.5`, `2`, and `3`, browser zoom, and supported device-pixel ratios. Scale is inherited from the existing content wrapper and must not be applied a second time. Drawing-buffer resolution may use the existing bounded pixel-ratio policy, capped at `3`, without changing CSS or logical coordinates. The cover remains above game wrapper z-index `1`, at its existing z-index `2`, and below snow, confetti, menu, endgame, deck, shop, loading, and dialog layers according to their existing application order.

**FR-GAME-COVER-023** — The projection is presentation only. Its sole permitted Legacy-parent mutation is adding or removing the allowlisted `graphics-modern-cover-ready` child-presentation class under the atomic readiness, mode, and fallback rules above. It must not change `#game-cover` display, z-index, pointer-shield lifetime, Raphael attributes or animation, `isopen`, `#game-wrapper`, or application state; create a storage key or Motion Studio target; mutate Graphics preference, game, account, match, hand, board, score, rule, turn, menu, tutorial, replay, early-exit, or game-over state; emit a semantic action; submit a request; navigate; or transmit diagnostics. Its only approved texture URLs are the same-origin `/images/left.png` and `/images/right.png`.

**FR-GAME-COVER-024** — Plain cloned diagnostics must expose cover policy, schema/cache identity, latest descriptor, readiness/fallback state, stage/camera/geometry/material policy, current openness and signed leaf poses, active plan, sequence, target, elapsed/raw/eased progress, motion generation, pending-frame state, reduced-motion and suspension state, accepted/completed/cancelled/ignored/failure counters, resource ownership, last outcome, `applicationContinuationAuthority: false`, and `gameplayAuthority: false`. They must expose no renderer, scene, camera, texture, material, geometry, Legacy handle, callback, timer, event, concealed data, or request object. User-facing status may say Modern projects a hinged 3D cover, but must continue to identify Legacy as available and Modern match play as incomplete.

**FR-GAME-COVER-025** — The cover source registration, cover facade/ABI, cover DOM/canvas metadata, runtime diagnostics, and cover contracts must retain component cache identity `0.185.1-game-cover-hinge.1` and Three.js `0.185.1` (`r185`). While Phase 0.15 was current, the composite generated artifact, coordinator URL, and deployment artifact shared that value. Beginning with Phase 0.16, those singular outer delivery identities are superseded by `0.185.1-match-hand-fan.1`; the embedded cover component must continue to report `0.185.1-game-cover-hinge.1`. `0.185.1-match-turn-coin.1` remains the historical Phase 0.14 identity.

### 11.21 Phase 0.16 cover-triggered active-match hand fan

**FR-MATCH-HAND-ENTRANCE-001** — Entering an active match while Modern is effective must create one monotonic schema-version-1 entrance presentation for the current match. Its only states are `stacked`, `fanning`, and `settled`. It must contain only entrance sequence, state, optional monotonic start timestamp, and optional cover sequence. It must contain no card object, Raphael element, Three.js object, DOM node, callback, game rule, legal target, controller state, request, or continuation.

**FR-MATCH-HAND-ENTRANCE-002** — Before the accepted cover-open settlement, every current card on a side must render at that side's last current card center with zero depth and zero local rotation. For the normal five-card layout those centers are player `(86.5, 311)` and opponent `(608.5, 311)`. Current hand index `4` must retain the highest normal hand face/body render order and therefore appear on top of each pile.

**FR-MATCH-HAND-ENTRANCE-003** — The transient pile must not mutate canonical hand data. The existing final card top-left rectangles remain player x `28`, opponent x `550`, y values `18`, `73`, `128`, `183`, and `238`, with width `117` and height `146`. Diagnostics must continue to expose those canonical rectangles independently of the current renderer-local entrance pose.

**FR-MATCH-HAND-ENTRANCE-004** — `gh.cover` may publish one fresh plain open-settlement observation only from the current Legacy left-panel opening completion and only after the existing `#game-cover` hide has executed. The observation contains exactly schema version, cover presentation sequence, target `open`, and monotonic completion timestamp. The synchronous public `open()` callback, Modern-cover completion, right-panel completion, duplicate open, stale opening completion, or close completion must not publish it.

**FR-MATCH-HAND-ENTRANCE-005** — The graphics coordinator must accept a settlement only when its schema, finite timestamp, positive integer sequence, target, and current open cover-presentation identity all match. It must reject malformed, duplicate, stale, closed, mismatched, inactive-match, or lobby-visible observations without starting or replaying hand motion. The observation remains decorative and cannot delay, invoke, suppress, or replace any Legacy continuation.

**FR-MATCH-HAND-ENTRANCE-006** — If the complete Modern active-match presentation is ready and effective at the accepted open settlement, the coordinator must transition the current entrance from `stacked` to `fanning` using the settlement timestamp. If Legacy is selected or still exposed because the Modern bundle, hand, coin, or surface is incomplete, the coordinator must select `settled`; it must not later replace visible canonical Legacy hands with a delayed pile or partial fan. Activating a match after the current open cover sequence already settled must also begin in `settled`.

**FR-MATCH-HAND-ENTRANCE-007** — Planning and sampling must be implemented in one renderer-neutral deterministic module with no DOM, jQuery, Raphael, Three.js, storage, game-controller, network, clock, frame scheduler, or random dependency. It accepts the current plain hand rectangles, derives one independent last-card anchor per side, and returns immutable plain plans and sampled poses. Production, facade consumers, and pure tests must use the same planner and sampler.

**FR-MATCH-HAND-ENTRANCE-008** — For each five-card side, index `4` remains stationary and indices `3`, `2`, `1`, and `0` begin after delays `0`, `55`, `110`, and `165` milliseconds. Each moving card lasts 620 milliseconds, so the complete batch lasts 785 milliseconds. Local progress uses cubic-out `1 - (1 - t)^3`; completion normalizes every position, depth, pitch, yaw, roll, scale, and render order exactly to its canonical hand pose.

**FR-MATCH-HAND-ENTRANCE-009** — Motion must read as two flat-table piles expanding vertically, not a radial or curved-surface fan. At a moving card's local midpoint, its path may reach at most 18 logical depth units, four logical lateral units, 4.5 degrees pitch, two degrees yaw, and 1.5 degrees roll. Player and opponent paths use identical vertical/depth timing and mirrored lateral, yaw, and roll signs. The camera remains position-neutral and does not orbit, pan, or introduce settled skew.

**FR-MATCH-HAND-ENTRANCE-010** — The active-match surface must own no more than one hand-entrance animation-frame callback. Plan creation occurs once per accepted entrance, not per frame. Sampling may allocate only bounded ephemeral plain pose data and must allocate no geometry, texture, material, renderer, raycaster, listener, or scheduler per frame. Completion, reduced motion, cancellation, suspension, failure, replacement, and disposal return the entrance pending-frame count to zero.

**FR-MATCH-HAND-ENTRANCE-011** — Modern card input must remain detached for every nonterminal `stacked` and `fanning` presentation. A click on either pile or a moving card cannot pick up, return, place, mutate, queue, or submit anything. Before entrance pose ownership begins, any renderer-local hold, hover, invalid return, or placement preview must be cancelled so no second scheduler can write the same card. Exact settlement may restore the unchanged Phase 0.13 input behavior.

**FR-MATCH-HAND-ENTRANCE-012** — Entrance sequences and state progression are monotonic. A lower sequence, backward same-sequence state, duplicate presentation, or same-sequence motion request after terminal completion is ignored. Every frame captures its motion generation and identity. Mode/view change, hidden document, hand replacement, context loss, fallback, surface suspension, replacement, and disposal must invalidate or settle the generation and make manually invoked late callbacks inert.

**FR-MATCH-HAND-ENTRANCE-013** — Suspending a still-stacked entrance before the cover settles may preserve the invisible pile so a return to Modern before settlement remains coherent. Cancelling a running fan must settle the current entrance sequence terminally. With reduced motion, or if a fanning presentation arrives while the surface is hidden or suspended, the surface commits the same exact canonical terminal pose synchronously with no pending frame or replay.

**FR-MATCH-HAND-ENTRANCE-014** — Phase 0.16 remains renderer-local presentation. It must not change hand arrays/order, Legacy card nodes or attributes, card visibility/secrecy, board occupancy, drop-zone validity, score, rules, turn indicator authority, opponent timing, cover state, cover callback timing, menu/game flow, semantic-action count, storage, navigation, request count, or payloads.

**FR-MATCH-HAND-ENTRANCE-015** — Cloned diagnostics must expose the entrance policy, current presentation, blocking state, completed sequence, active plan/progress, frame ownership, counters, current card poses, render orders, last outcome, `gameplayAuthority: false`, and inherited canonical hand rectangles. They must expose no live renderer, card, Legacy, callback, event, timer, request, or concealed opponent-face object.

**FR-MATCH-HAND-ENTRANCE-016** — The Phase 0.16 source and generated bundle must retain Three.js `0.185.1` (`r185`) and share cache identity `0.185.1-match-hand-fan.1`. Source registration, generated artifact, facade/ABI, coordinator URL, diagnostics, pure/static/browser contracts, deployment artifact, and this document must agree. The parallel cover component retains `0.185.1-game-cover-hinge.1` as its Phase 0.15 identity.

## 12. Phase 0: graphics preference and inert Modern preview

### 12.1 Objective

Phase 0 proves that the application can switch the active-match presentation and input gate at runtime without removing Raphael, rebuilding an in-progress match, or risking the reliable Legacy route.

It is a preparatory increment, not a playable Modern release.

### 12.2 Required deliverables

Phase 0 must deliver:

1. A Graphics section in the existing context menu.
2. `Legacy` and `Modern` choices with clear non-playable Preview status.
3. Guarded `window.localStorage` persistence.
4. Separate requested and effective mode state.
5. Legacy as the default.
6. Immediate same-page switching whenever the Graphics control is operable.
7. Unchanged, fully playable Legacy behavior.
8. A dedicated Modern host in the active-match position.
9. An isolated, exactly pinned, self-hosted Three.js `0.185.1` (`r185`) production bundle.
10. Lazy Modern-bundle loading, with no Modern resource request or evaluation on a Legacy-only page.
11. A real transparent Three.js `WebGLRenderer` canvas that is intentionally blank and pointer-inert.
12. A temporary presentation/input gate that keeps active-match Raphael mounted and synchronized while making the complete Legacy surface opacity-hidden, `aria-hidden`, and pointer-blocked during Modern.
13. Immediate return to the identical live Raphael state without reload, resume, paper reconstruction, or match reconstruction.
14. Reason-specific requested/effective mode messaging for loading, configuration disablement, and Modern initialization fallback.
15. Stable renderer-neutral diagnostics and mode-specific automated tests.

### 12.3 Exact Phase 0 runtime bridge

The Phase 0 bridge deliberately maintains both implementations in the DOM after Modern first initializes. Only one lobby or active-match surface is presented as effective and neither a Modern presentation surface nor a hidden Legacy surface may submit gameplay input. Beginning in Phase 0.10, the active-match Modern surface may project the two current hands. Through Phase 0.10 it remains pointer-inert; beginning in Phase 0.11 it may own the renderer-local player-card pickup/follow study, Phase 0.12 may add the always-invalid second-click return, Phase 0.13 may add only the documented valid-zone hover and one-placement preview over that hold, and Phase 0.14 may additionally mirror the plain sequenced turn indicator as a renderer-local 3D coin. Phase 0.15 separately permits one concurrent page-lifetime full-stage cover projection that owns no gameplay input, turn authority, or application continuation.

When Legacy is effective:

- The existing active-match board and rule Raphael papers are visible and interactive exactly as before.
- Legacy game construction, state, timers, dialogs, review, replay, opponent work, and animation sequencing remain unchanged.
- The Modern bundle is not requested unless Modern was requested earlier on the same page.
- Already mounted Modern lobby, active-match, and cover canvases may remain cached and hidden for later toggles, but they must be pointer-inert, `aria-hidden`, idle, and must not own an animation loop.
- Exactly one active-match board paper and one active-match rule paper exist.

While Modern is being requested or initialized:

- Requested mode may be Modern while effective mode remains Legacy.
- The current Legacy presentation and input remain available until the Modern bundle, renderer, context, host, and first surface render succeed. A partial card surface may then show its preparing message while required textures load atomically and must fail open to Legacy on error.
- Repeated Modern selections must coalesce into one bundle load and one surface initialization.
- A later Legacy selection must win even if an earlier asynchronous Modern load completes afterward.

When Modern preview is effective:

- `window.Raphael` remains present and callable.
- Surrounding Outer UI continues to create and use Raphael surfaces; Phase 0.5 may separately project only the lobby hand through Three.js, and Phase 0.15 may separately project only the unchanged `gh.cover` through its independent full-stage surface.
- The active-match board and rule Raphael papers remain mounted.
- The existing `gh.game` match state, Raphael objects, timers, callbacks, review/replay state, and server-response sequencing remain live and synchronized.
- The complete Legacy active-match presentation is opacity-hidden as one unit; selectively hiding card images is insufficient.
- The Legacy active-match hosts are marked `aria-hidden="true"` and block pointer input through `pointer-events: none` or an equivalent complete input gate.
- Hidden Legacy slot targets or delegated handlers cannot receive a pointer initiated over the active-match region.
- A Modern host occupies the same 693 by 500 logical bounds, inset 30 pixels from the top and left of the board frame.
- The Modern host contains one real Three.js WebGL canvas and may contain a renderer-neutral explanatory DOM message.
- In the Phase 0.10 through Phase 0.14 active-match exception, the Three.js scene renders the current player and opponent hand cards. Phase 0.13 may additionally render only the one hovered valid-zone shadow and one settled renderer-local preview card. Phase 0.14 may additionally render the one plain-described sequenced turn coin. It renders no authoritative board occupancy, scores, rules, elements, bonuses, capture effects, or gameplay authority.
- In the separate Phase 0.15 exception, a sibling Three.js cover canvas may mirror the full-stage Legacy cover while `gh.cover` remains mounted, animated, and authoritative over callbacks, parent visibility, and pointer shielding.
- Through Phase 0.10 the Modern cards and canvas are non-interactive. In Phase 0.11 the host may accept only card-bounded player pickup and pointer-follow presentation. Phase 0.12 may accept an armed second click as renderer-local invalid return. Phase 0.13 may instead preview placement when that click is inside a currently valid plain-described rectangle while continuing to shield the blocked retained surface; neither surface can submit a human move.
- The CSS board background and HTML dialog overlay retain their existing stacking roles.
- The title, context menu, and route back to the main menu remain usable.
- The Modern surface requests frames only when initialized, resized, updated, advancing bounded Phase 0.11 through Phase 0.13 card motion, or advancing one bounded Phase 0.14 turn-coin transition and has no unconditional animation loop.
- At most one active-match WebGL context is owned by the application.
- Phase 0.15 may additionally own one independent cover WebGL context and at most one cover frame only under the bounded rules in `NFR-PERF-020`.

When Legacy becomes effective again:

- The Modern host becomes hidden, `aria-hidden`, and pointer-inert before Legacy accepts pointer input.
- The Legacy hosts become visible, accessibility-exposed as appropriate, and pointer-enabled.
- The exact existing Raphael paper objects and live match state are revealed; neither paper is rebuilt.
- Any state change or animation that completed while Legacy was hidden is already reflected.
- The switch itself issues no game request, move request, resume request, or match-state mutation.

This bridge is an implementation tactic for Phase 0 only. Phase 1 and later must still extract renderer-neutral state and progress toward one active playable renderer with explicit lifecycle ownership. Hidden live Raphael must not become the permanent Modern rendering architecture.

### 12.4 Preview communication

Before match-hand data is ready, the partial board can look like a defect. Phase 0.10 should show a renderer-neutral DOM message such as:

> Modern match hands are preparing. Cards are display-only; select Legacy graphics to play.

After Phase 0.11 readiness, status may instead say:

> Modern pickup/follow motion study active. Placement and game state are not implemented; select Legacy graphics to play.

After Phase 0.12 readiness, status may instead say:

> Modern pickup/follow study active. Click again to return the card to the hand. Board placement and game state are not implemented; select Legacy graphics to play.

The exact copy may change, but it must:

- identify the mode as an intentional partial implementation;
- explain that it is not yet playable;
- explain that Legacy can be restored immediately;
- remain outside the future WebGL canvas;
- not cover or disable the context-menu route.

### 12.5 Activation timing

During Phase 0, the application resolves an initial requested mode during page initialization and then accepts same-page changes from the Graphics control.

When the user selects Modern:

1. Save requested Modern through guarded local storage.
2. Update the menu's requested selection and loading status.
3. Keep effective Legacy visible and interactive while the isolated Modern bundle loads.
4. Create or reuse one Modern WebGL surface.
5. Only after successful initialization, make Legacy opacity-hidden, `aria-hidden`, and pointer-blocked.
6. Present the Modern host and set effective mode to Modern.
7. Do not rebuild, pause, or dispose the Legacy match.

When the user selects Legacy:

1. Save requested Legacy through guarded local storage.
2. Cancel the authority of any pending Modern activation, without requiring the network request itself to be abortable.
3. Hide and pointer-block the Modern host.
4. Reveal and pointer-enable the existing Legacy papers.
5. Set effective mode to Legacy.
6. Do not reconstruct or resume the match.

Selecting a Graphics preference by itself:

- must not start or exit a match;
- must not issue `/index/game`;
- must not issue `/index/me`;
- must not alter the current match ID or authoritative game state.

If requested Modern is restored from storage on a new page, Legacy initializes normally behind the pre-paint hand-only startup gate while Modern loads. Effective mode remains Legacy until Modern initialization succeeds, and the shared menu paper, command bar, and surrounding lobby presentation remain visible. The startup marker transfers ownership to the normal Modern-ready gate only after the first complete lobby-hand frame. Any initialization failure removes the marker and reveals the intact Legacy hand. This masks the visible renderer transition without skipping Legacy construction in Phase 0.

The hidden Legacy controller may continue normal server-authoritative work that would have occurred without a graphics switch. The passive hand-only Modern host itself must never originate a move or add a second controller path.

If Modern bundle loading, WebGL creation, canvas mounting, context acquisition, first render, or the later Phase 0 context fails:

1. Keep or restore effective Legacy.
2. Remove or hide the partial Modern surface.
3. Keep requested Modern persisted unless the user selected Legacy.
4. Expose a concise classified reason.
5. Do not retry in a loop.
6. Permit a later explicit Modern selection to retry under the documented retry policy.

Phase 0 allows live presentation switching because it never reconstructs the match scene. It does not authorize disposing Legacy, reconstructing Modern from Raphael objects, transferring an active drag, or allowing Modern to own playable input.

### 12.6 Phase 0 acceptance criteria

#### AC-P0-001 — Fresh browser state

Given no saved graphics preference, when the application loads and a match is built:

- requested mode is Legacy;
- effective mode is Legacy;
- `window.Raphael` exists;
- exactly one active-match board paper exists;
- exactly one active-match rule paper exists;
- no Modern script, module, preload, or WebGL context is requested or created;
- a normal card can be placed successfully;
- existing Legacy smoke coverage passes.

#### AC-P0-002 — Preference selection and persistence

Given Legacy is effective, when the user selects Modern:

- the stored value becomes `modern`;
- effective mode remains Legacy only while Modern loads;
- effective mode becomes Modern on the same page after successful initialization;
- no full-page navigation or reload occurs;
- the existing Raphael papers and match objects remain intact;
- no card, animation, or request is interrupted;
- the control exposes requested and effective state accurately throughout loading;
- Modern remains requested after reload;
- Modern also remains requested in a new tab and after a browser restart using the same stored browser profile.
- on reload, no rendered frame visually or accessibly exposes a Legacy lobby card before the restored Modern hand is ready;
- Raphael still constructs all five lobby cards behind the startup mask, and an initialization failure reveals those same live elements.

#### AC-P0-003 — Modern dependency and surface

Given Modern initializes successfully:

- the Modern bundle is same-origin and lazy-loaded;
- the bundle identifies Three.js package version `0.185.1` and revision `185`;
- exactly one transparent Three.js WebGL canvas is mounted;
- the scene is intentionally blank and renders no card meshes;
- the canvas is pointer-inert;
- there is no continuous animation loop while idle;
- the preview produces no uncaught exception or unhandled rejection.

#### AC-P0-004 — Modern presentation and Legacy input gate

Given Modern becomes effective:

- the board retains its normal physical size and background;
- the Modern host exists in the correct position;
- both active-match Raphael papers still exist and retain object identity;
- the complete Legacy surface is opacity-hidden;
- the Legacy hosts are `aria-hidden`;
- the Legacy hosts and targets are pointer-blocked;
- the Modern surface contains no gameplay cards or controls;
- interacting with the inert board issues no move request;
- the explanatory preview message is visible;
- the context menu and main-menu escape remain usable;
- non-match Raphael surfaces still work.

#### AC-P0-005 — Immediate return to Legacy

Given Modern is effective during an active or reviewable match, when the user selects Legacy:

- effective mode becomes Legacy without reload;
- the Modern host becomes hidden, `aria-hidden`, and pointer-inert;
- the exact original board and rule paper DOM nodes remain mounted;
- the exact existing Raphael paper instances are revealed;
- no match-build, resume, or renderer-reconstruction operation occurs;
- match ID, card arrays, board arrays, score, turn state, review state, and pending server work retain identity and current values;
- state changes completed while hidden are visible immediately;
- exactly one set of Legacy input handlers remains;
- a valid next Legacy interaction completes normally.

#### AC-P0-006 — In-flight presentation-switch safety

Given a Legacy card is lifted, moving, returning, animating, displaying a dialog, running review, or waiting for a server response:

- the Graphics control remains a selectable presentation setting even when gameplay-specific menu actions are disabled;
- selecting either mode applies its presentation and pointer gate immediately;
- the same Raphael objects and callbacks continue to completion while hidden or visible;
- no second move request is sent;
- no renderer reconstruction or controller restart occurs;
- switching back reveals the actual latest state rather than a stale captured image;
- no hidden Legacy pointer target accepts a new user action while Modern is effective.

#### AC-P0-007 — Invalid or unavailable storage

Given normal-user behavior with no valid test/diagnostic override, and the preference is missing, malformed, an unknown value, or cannot be read:

- startup throws no error;
- requested mode resolves to Legacy;
- effective mode resolves to Legacy;
- the menu accurately shows Legacy;
- gameplay remains functional.

Given a preference write fails:

- the current surface remains functional;
- the in-memory requested state may update for the current page;
- the application does not claim durable persistence.

#### AC-P0-008 — Preview initialization failure

Given Modern script loading, WebGL creation, host mounting, first rendering, or the Phase 0 WebGL context is forced to fail:

- partial Modern DOM is removed or hidden;
- effective mode remains or becomes Legacy;
- the existing Legacy board paper and rule paper remain intact;
- gameplay remains functional;
- no Modern/Legacy retry loop occurs;
- requested Modern remains saved unless the user selects Legacy;
- the user is told why Legacy is effective.

#### AC-P0-009 — Raphael remains globally available

Given Modern preview is effective:

- the Raphael script remains loaded;
- `window.Raphael` remains callable;
- the cover, main menu, deck editor, shop, and endgame surfaces are not disabled by graphics-mode selection.

#### AC-P0-010 — Repeated runtime toggles

Given at least ten alternating same-page mode changes:

- the page does not reload;
- one board paper, one rule paper, one active-match Modern host, one lobby-hand Modern host, and at most one current lobby-or-active Three.js canvas/context exist; beginning in Phase 0.15, one independent cover canvas/context may coexist under its separate lifecycle and resource budget;
- input handlers do not multiply;
- the non-effective surface remains pointer-inert;
- delayed completion of an earlier Modern load cannot override a later Legacy request;
- no uncaught renderer error accumulates.

#### AC-P0-011 — Legacy regression gate

With Legacy forced, every existing spec configured by `tests/browser/playwright.config.js` must continue to pass, including the current smoke, scale-interaction, dialog-scale, and endgame-protection files.

Existing tests do not fully assert every renderer-sensitive behavior. Phase 0 must preserve existing assertions and add or strengthen focused regression coverage for:

- scaled pointer tracking;
- valid placement;
- invalid-drop return;
- duplicate-submission locking;
- capture animation;
- Sudden Death stacking and restored input;
- review and replay presentation, not only route/start behavior;
- dialogs under application scaling;
- main-menu and endgame flows.

#### AC-P0-012 — Preference selection has no game side effect

Given the user is on any outer-UI screen, when the Graphics preference changes:

- no `/index/game` request is issued;
- no `/index/me` request is issued;
- no match is started or exited;
- current authoritative match state and match ID are unchanged;
- only browser-local preference and related menu status change.

#### AC-P0-013 — Async load ordering

Given Modern loading is delayed, when the user selects Modern and then selects Legacy before loading completes:

- requested and effective modes remain Legacy;
- the completed script may register its factory but cannot activate the Modern surface;
- Legacy presentation and input remain uninterrupted;
- a later explicit Modern selection may reuse the loaded factory and create or reveal exactly one Modern surface.

#### AC-P0-014 — Modern-host geometry and stacking

Given Modern preview is effective at application scale 1 and at least one non-unit supported scale:

- the host preserves a 693 by 500 logical aspect and position inside the board;
- its unscaled top and left inset is 30 pixels;
- its displayed bounds scale with `#content-wrapper`;
- inactive Legacy containers are pointer-inert;
- the HTML dialog-dimming overlay remains above the renderer host;
- the renderer host does not intercept the context-menu controls;
- the preview message remains legible and the Legacy escape route remains usable.

#### AC-P0-015 — Phase 0 precedence and kill switch

Given requested Modern is stored:

- with `modernEnabled=true` and no valid override, Modern preview becomes effective on initialization or the next same-page selection;
- with `modernEnabled=false`, effective mode is Legacy, requested mode remains Modern, and the UI reports configuration disablement rather than telling the user that another reload will enable Modern;
- re-enabling Modern allows the stored Modern request to become effective on the next allowed initialization attempt without selecting it again;
- a valid test/diagnostic force-Legacy override does not rewrite the stored Modern request;
- a test-only force-Modern override may bypass the kill switch only when the test explicitly declares that intent;
- invalid overrides are ignored.

### 12.7 Phase 0 definition of done

Phase 0 is complete only when:

- every acceptance criterion above is automated where practical;
- no application code treats the Modern active-match surface as playable; the Phase 0.5 lobby hand remains decorative;
- Legacy remains the documented default;
- the preview is clearly labeled;
- the user can return to Legacy immediately without clearing storage or reloading;
- the pinned Three.js bundle is reproducibly built, license-recorded, and served from the same origin;
- the temporary hidden-live-Raphael bridge is identified in code and documentation as Phase 0 debt;
- no server, database, rules, or protocol change was needed;
- a code review confirms that Raphael usage outside the Phase 0.5 hand-card elements remains untouched.

### 12.8 Phase 0.5: non-interactive Modern lobby hand

#### 12.8.1 Objective and scope boundary

Phase 0.5 proves that the pinned Three.js delivery path can render real Pure Triple Triad card assets in the familiar application viewport without first taking on match rules, interaction, animation sequencing, opponent secrecy, or renderer-neutral match reconstruction.

The target is exactly the five-card decorative hand shown when the application is on its main menu. The identifying visual context is the command bar containing Play, Shop, and Tutorials, with the five cards directly beneath it. This surface is not a match, a resumable game scene, or the in-match player hand.

Phase 0.5 must not:

- render or gate any in-match hand card;
- convert the Play, Shop, Tutorials, Replay, Deck, statistics, or rules presentation;
- make a lobby card hoverable, selectable, draggable, focusable, or clickable;
- alter `gh.data.hand`, deck composition, account state, match state, or server protocol;
- weaken the Phase 0 guarantee that Legacy remains immediately available;
- imply that the active-match Modern renderer is playable.

#### 12.8.2 Runtime composition

The Phase 0.5 lobby composition is:

```text
#menu                                      755 × 562 lobby coordinate space
├── existing Raphael paper
│   ├── existing black command bar         remains visible in both modes
│   └── five Legacy card <image> elements  individually marked and gated
├── #modernLobbyHand                       dedicated pointer-inert host
│   └── one Three.js WebGL canvas          five textured planes in Modern
└── sibling DOM menu/stat/rule elements    remain unchanged and usable
```

`#modernLobbyHand` must not be used as the active-match host. The Modern facade must expose a dedicated lobby-hand factory in addition to the existing active-match surface factory. The application manager must pass the existing `gh.menu` instance into the graphics coordinator so menu visibility, card descriptions, effective mode, readiness, fallback, and cleanup have one owner. The Phase 0.5 artifact must be requested with the cache identity `/js/modern/purett-modern-graphics.min.js?v=0.185.1-lobby-hand.1`; a later artifact change must advance that identity.

When the lobby becomes visible:

1. `gh.menu` constructs its normal Raphael card images and a plain five-card rendering description.
2. If Legacy is effective, only the established Raphael result is visible.
3. If Modern is effective, the coordinator creates or selects the `lobby-hand` surface and supplies the plain descriptions.
4. The surface loads the required same-origin card textures, configures their color space and filtering, creates five non-interactive planes, and performs an on-demand render.
5. Only after the complete frame is ready does `gh.menu` apply the hand-only gate that hides the marked Raphael card images.
6. The Raphael command bar and DOM commands remain visible and usable at every step.

When the lobby is hidden or the application transitions to an active match, the coordinator must invalidate pending lobby texture completion, reset the hand-ready gate, and dispose or replace the current surface without leaving an extra canvas, WebGL context, material, geometry, or texture owner. Selecting Legacy must reset the gate immediately; consistent with Phase 0's cache policy, it may retain one hidden, idle lobby surface for a later same-page Modern retry, and its guarded completion must be unable to reapply the gate while Legacy is effective.

#### 12.8.3 Layout and rendering baseline

The first Modern lobby rendering deliberately approximates the established design. This is the historical Phase 0.5 baseline; Phase 0.6 explicitly supersedes its camera, material, card-body, light, shadow, motion, and interaction choices only for the Modern lobby-hand surface:

- logical viewport: 755 by 562;
- maximum card count: five;
- card dimensions: 117 by 146;
- x positions: 72, 197, 322, 447, and 572;
- y position: 203;
- camera: orthographic pixel-space mapping;
- material: unlit, art-preserving textured planes;
- card faces: the exact current same-origin Legacy image URLs, including purchased-card and user-color path rules;
- ordering: stable source hand order;
- rotation: small deterministic per-position variation is allowed;
- motion: none required;
- interaction and picking: prohibited;
- render scheduling: initialization, texture completion, content-scale change, or explicit state change only.

The renderer may cap the effective device-pixel ratio for resource control, but CSS bounds must continue to follow the application's existing scale transform. Card texture loading must be generation-guarded so a stale hand or a surface that has already been replaced cannot commit meshes or trigger a late mode change.

#### 12.8.4 Failure and fallback

During an explicit same-page Modern selection, the legacy hand must remain visible while Modern textures are pending. During restored-Modern startup, the pre-paint marker may keep only those card elements hidden while textures are pending. A required texture failure, renderer creation failure, invalid card description, or WebGL context loss must:

- prevent or remove the hand-only Modern-ready gate;
- dispose every resource owned by the partial lobby surface;
- make effective Legacy visible;
- report a classified fallback through the existing Graphics status;
- preserve the requested Modern preference;
- issue no game, account, deck, or match request;
- leave Play, Shop, Tutorials, and the rest of the lobby usable.

A later explicit Modern selection may retry under the same bounded failure policy used by Phase 0. Returning to Legacy is never contingent on a Modern texture request finishing.

#### 12.8.5 Acceptance criteria

**AC-P05-001 — Correct target**

Given the application is on the main-menu/lobby viewport:

- the preview is below the Play, Shop, and Tutorials bar;
- its input data comes from the lobby hand supplied to `gh.menu`;
- no active-match `gh.game.hand`, board card, slot, score, or rule-banner object is used to construct it.

**AC-P05-002 — Modern settled frame**

Given five valid current-hand entries and effective Modern:

- one dedicated lobby WebGL canvas exists;
- debug state identifies `surface: "lobby-hand"`;
- logical size is 755 by 562;
- exactly five visible meshes and the required texture set are reported after readiness;
- each debug screen rectangle matches its expected 117 by 146 legacy position;
- the canvas performs no picking and remains pointer-inert;
- no unconditional animation frame loop remains active after settlement.

**AC-P05-003 — Hand-only Legacy gate**

Given the Modern lobby frame is ready:

- only the five Raphael card image elements marked as lobby-hand cards are opacity-hidden and `aria-hidden`;
- the shared Raphael paper is still mounted;
- the black command bar remains visible;
- Play, Shop, Tutorials, and any conditionally present menu commands remain operable;
- no broad selector hides the menu paper or all of its SVG descendants.

**AC-P05-004 — Readiness and async ordering**

Given one or more card textures are delayed:

- after an explicit same-page Modern selection, the original Raphael cards remain visible until every required texture is ready;
- after a reload with Modern already persisted, the original Raphael cards remain mounted but never appear in a rendered frame before the complete Modern hand is ready;
- repeated lobby-show or card-update notifications cannot commit an older texture generation;
- selecting Legacy before texture completion prevents the delayed completion from reapplying the Modern-ready gate;
- no partially populated hand is presented as a successful Modern frame.

**AC-P05-005 — Runtime Legacy return**

Given a ready Modern lobby hand, when Legacy is selected:

- the existing Raphael card elements become visible immediately;
- the Modern host becomes hidden and pointer-inert;
- the hand data and Raphael element identities are unchanged;
- the page does not reload and no network request mutates game or account state.

**AC-P05-006 — Lobby lifecycle**

Given repeated navigation between the lobby and another application surface:

- at most one current lobby-or-active Modern surface kind and its one WebGL context remain; beginning in Phase 0.15, the independent page-lifetime cover surface may retain one additional context without becoming that surface kind;
- leaving the lobby clears its ready gate and cannot leave hidden Raphael cards behind;
- texture, material, geometry, canvas, and context resources are released when the lobby surface is disposed;
- returning to the lobby renders the current hand rather than a stale earlier hand.

**AC-P05-007 — Failure recovery**

Given a forced lobby texture failure or WebGL context loss:

- effective mode becomes Legacy exactly once;
- all five Raphael cards remain or become visible;
- the lobby commands remain usable;
- requested Modern remains persisted;
- partial Modern resources are removed;
- the UI reports a useful fallback reason.

**AC-P05-008 — Legacy isolation**

Given a fresh Legacy-only page:

- the Modern bundle is not requested or evaluated;
- the lobby uses its existing Raphael cards and animation;
- no Modern lobby canvas or WebGL context is created;
- the main-menu visual and navigation regression suite remains unchanged.

**AC-P05-009 — Restored-Modern first paint and fail-open**

Given a valid persisted Modern preference before navigation:

- the document establishes the Modern startup marker before any application script can construct the menu;
- a deliberately delayed Modern bundle or texture set produces zero rendered frames with a visible Legacy lobby card;
- all five Raphael card elements still exist and are `aria-hidden` while the startup marker owns the hand;
- a complete first Modern frame applies the normal `graphics-modern-hand` gate before removing the startup marker;
- a forced bundle, renderer, texture, or context failure removes the startup marker, reports effective Legacy, and reveals the intact Raphael cards;
- a bundle or required texture request that emits neither success nor failure reaches the same fail-open outcome within six seconds of lobby-hand presentation, and its late completion cannot reverse that outcome;
- a persisted Legacy preference establishes no startup mask and requests no Modern bundle.

#### 12.8.6 Definition of done

Phase 0.5 is complete only when:

- the dedicated lobby host, factory, coordinator bridge, and hand-specific gate have static contract coverage;
- browser evidence verifies a five-card Modern frame and immediate Legacy return;
- browser evidence verifies that the Play, Shop, and Tutorials bar remains visible and functional;
- forced texture and context failures preserve a complete Legacy lobby;
- the generated bundle remains isolated, license-recorded, reproducible, and unable to overwrite the legacy `window.THREE` used by the snow effect;
- the bundle URL carries the documented lobby-hand cache revision so existing clients do not reuse the earlier inert artifact;
- no server, database, game-rule, account, or protocol change is introduced;
- the active-match Modern surface remains non-playable and the Phase 1 through Phase 7 roadmap is unchanged.

### 12.9 Phase 0.6: Modern lobby-card double-flip spike

#### 12.9.1 Objective and scope boundary

Phase 0.6 validates the smallest useful Three.js motion experiment against real Pure Triple Triad cards: local three-dimensional lift, correct front/back texture orientation, scale-aware card hit testing, bounded shared frame scheduling, per-card re-entry exclusion, independent-card concurrency, and deterministic lifecycle cancellation. It builds only on the ready Phase 0.5 Modern lobby hand.

The target remains the five-card decorative hand beneath the Play, Shop, and Tutorials command bar. Phase 0.6 does not make that hand part of a match, make the Modern active-match surface playable, or establish a reusable game-action protocol.

Phase 0.6 must not:

- attach this effect to an in-match player hand, board card, opponent hand, deck-editor card, shop card, endgame card, or tutorial card;
- treat the clicked card as selected, equipped, played, inspected, dragged, or focused;
- change the order or contents of the lobby hand;
- issue a server request or invoke a menu command;
- add an animation or input handler to the Legacy Raphael cards;
- delay an explicit return to Legacy;
- create a general-purpose idle render loop;
- weaken any Phase 0 or Phase 0.5 fallback, resource-ownership, or hand-only gating guarantee.

#### 12.9.2 Required card representation

Each eligible Modern lobby card must have two distinct visible sides:

- the front uses the exact face texture already supplied by its current Phase 0.5 card description;
- the back uses the shared canonical `/images/cards/cardBack.png` asset;
- the back is not purchased-card art and has no player-color or owner-specific path;
- the front and back preserve their intended upright orientation when facing the camera;
- an edge-on frame may show the physical/thin edge or no face, but it must not show a mirrored face through the reverse side;
- after the complete same-direction turn, the same original front texture is visible with no texture substitution or hand-data refresh.

The card-back texture is a required Phase 0.6 lobby asset. It must be loaded and decoded, with the same color-space and bounded same-origin failure policy as the required face textures, before card interaction becomes eligible. The original Raphael hand remains visible until the complete Phase 0.6 texture set has produced a ready Modern frame. A card-back failure therefore follows the existing pre-input Legacy fallback rather than accepting a click and failing midway through motion.

The Phase 0.6 implementation must use a nominally three-logical-unit-thick card slab and two distinct textured face planes. Only the slab's four side groups are lit and visible; its front and back caps are suppressed so they cannot flicker through or darken the face art. Each textured face sits 0.2 logical units beyond its corresponding body surface, uses an unlit, non-tone-mapped material in the sRGB renderer pipeline, and retains deterministic depth testing. Card textures use generated mipmaps, trilinear minification, linear magnification, and anisotropy capped at the lesser of four and the renderer capability so the full turn does not produce minification shimmer. Geometry, the side material, the canonical back material, and other safely reusable resources should be shared; every shared and per-card resource must have one explicit disposable owner.

Hardware shadow mapping is disabled. Analytic contact-shadow planes provide the only shadow cue and have no semantic meaning. Their geometry and bounded generated-gradient texture are shared, while each card owns an independently controllable shadow mesh and material so several lifted cards can cast distinct contact cues concurrently. Every shadow is invisible for its canonically flat settled card, appears only while that card has nonzero lift, and is hidden and reset by that card's exact settlement and by every surface-wide cancellation or disposal path.

#### 12.9.3 Choreography and settlement

The Phase 0.6 perspective camera is head-on and centered on the 755 by 562 lobby region. Its nominal vertical field of view is 40 degrees and its distance from the settled z=0 face plane is calibrated as `(562 / 2) / tan(40° / 2)`, approximately 772.04 logical units. Its near and far planes are 450 and 900 so the complete bounded motion remains visible while depth precision keeps the separated face and slab surfaces stable. This calibration preserves one logical unit per settled screen pixel in both axes. A lifted card travels along its camera ray so perspective enlargement does not pull the outer lobby cards laterally away from their established presented centers.

Camera-ray center compensation alone is insufficient during a turn. Once local-X rotation gives the top and bottom vertices different depth, their perspective denominators also multiply the card's horizontal slot offset. The result is a position-dependent lateral lean: left and right cards fan in opposite directions even though they share one physical plane, while the centered card is least affected. Phase 0.6 therefore applies a face-anchored flat-table projection neutralizer outside the local turn. It removes only this off-axis slot/depth cross-term. It does not flatten the centered perspective result: every slot retains the same perspective enlargement, front/back depth, symmetric foreshortening, and visible edge that the centered card would have, translated to the slot's established presented center.

An accepted click starts this ordered sequence on the hit card:

1. **Lift — 350 milliseconds:** move the card 105 logical depth units toward the constrained perspective camera and 18 logical screen pixels upward without adding pitch, yaw, roll, or another orientation change. Pickup tilt is exactly zero around X, Y, and Z. Camera-ray compensation and the flat-table projection neutralizer must keep the card visually anchored to its established lobby slot while true perspective enlargement, the thin lit edge, and that card's analytic contact shadow communicate depth. Its shadow appears only as lift becomes nonzero.
2. **Continuous full turn — 1,650 milliseconds:** use one smooth ease-in/ease-out progression to rotate end over end in the same negative local-X direction from zero to `-2π`. The card passes its first thin edge at `-π/2`, presents the upright canonical back at `-π`, passes its second thin edge at `-3π/2`, and presents the original upright front at `-2π`. The turn has no reversal, separate second easing segment, or back hold. A bounded arc of up to approximately 12 additional depth units and 5 screen-up units may reinforce both edge passages.
3. **Settle — 450 milliseconds:** keep the completed `-2π` front orientation while lowering the card to its exact original position and depth, restore unit scale, then normalize temporary local-X rotation to zero. Auxiliary pickup X/Y/Z rotation remains exactly zero. The analytic shadow must disappear as lift reaches zero, and the projection neutralizer must return to its deterministic zero-lift coefficients. Every card begins and ends with zero static Z rotation and no residual X/Y tilt.

The nominal normal-motion timeline is therefore 2,450 milliseconds: 350 milliseconds of lift, 1,650 milliseconds of one-direction continuous turn, and 450 milliseconds of settlement. It must remain visually inspectable, finite, and complete no later than the 3,000-millisecond hard deadline. The implementation may tune only bounded arc magnitude and easing without changing those named phase durations, the monotonic local-X zero-to-`-2π` path, calibrated perspective mapping, analytic-shadow lifecycle, or deterministic flat final transform.

Each accepted clicked card moves independently on its own timeline. A Modern card that has not itself received an accepted activation remains at its established transform even while one or more other cards animate. The hidden Raphael hand cards, command bar, DOM commands, statistics, and rules remain at their existing transforms and states.

The settled transform captured when the click is accepted is the restoration source for that animation. Animation code must not accumulate incremental floating-point transforms or projection-neutralizer coefficients across clicks. Repeating the effect on a card must begin and end at the same transform and zero-lift projection state as the first run within the renderer's declared test tolerance.

#### 12.9.4 Input ownership and per-card re-entry locks

The Modern lobby surface may listen for the primary click needed by this spike only while it is visible, ready, and effective. Client coordinates must be converted through the actual canvas bounds and application scale before raycasting or equivalent card-rectangle testing.

An eligible hit must satisfy all of the following:

- Modern is still effective;
- the lobby is still visible;
- the current surface and hand generation match the ready generation;
- the hit resolves to one of the current five settled lobby cards;
- that card's own re-entry lock is free;
- no cancellation or context-loss path has begun.

The surface acquires only the hit card's lock before registering that animation with the shared scheduler. While that card's lock is held:

- another click on that same active card is ignored;
- the rejected repeat is not queued for later playback;
- a click on any other settled, unlocked card starts its own animation immediately;
- accepting another card adds work to the same surface scheduler rather than starting a second animation-frame chain;
- no card selection, game intent, audio request, or server action is emitted.

Normal settlement releases that card's lock exactly once without disturbing another active card. Surface-wide cancellation releases every held lock exactly once and settles all active cards as one lifecycle operation. Lock release must be idempotent so a context-loss callback followed by disposal, or a Legacy selection followed by lobby hide, cannot underflow state or complete the same transition twice.

The input strategy must preserve the lobby around the cards. If the WebGL canvas occupies the full logical region, its event handling and stacking must allow commands and other controls above or outside the five eligible rectangles to receive their established events. Phase 0.6 does not authorize a full-region click-capturing overlay.

#### 12.9.5 Bounded render scheduling

The settled lobby continues to render on demand. One or more accepted animations may temporarily use one shared scheduler, subject to all of these constraints:

- at most one `requestAnimationFrame` callback is pending for this surface;
- each callback confirms the current surface generation, effective mode, visibility, and context status, then validates each active card's independent animation token before applying that card's transform;
- one callback advances every active card and the scene is rendered once for that callback;
- the next frame is requested only while at least one finite animation remains active;
- normal settlement renders each card's exact final state and releases its lock independently; it leaves no animation frame pending only after the final active card settles;
- each animation's hard completion deadline settles that card and releases only its lock even if a timestamp or easing defect would otherwise leave it unfinished;
- surface-wide cancellation removes the one pending request immediately and invalidates every active token before any reusable state is reset;
- no timer or frame callback from an earlier animation may affect a later animation on the same card or any independently active card;
- texture loading, idle hover, cursor position, and an already-settled hand do not sustain frame requests.

The spike may use `performance.now()` or the `requestAnimationFrame` timestamp as its monotonic animation clock. It must derive transforms from bounded normalized progress rather than integrating unbounded per-frame deltas.

#### 12.9.6 Cancellation and fallback

All active animations must be cancelled when any of these events occurs:

- the user selects Legacy;
- the lobby begins to hide or navigation leaves the lobby;
- the lobby hand descriptions are replaced by a newer generation;
- the graphics coordinator replaces the current surface kind;
- the lobby surface is disposed;
- WebGL context loss is reported;
- a required renderer resource becomes invalid.

Surface-wide cancellation order is:

1. invalidate every active animation token so no late callback may commit;
2. detach or disable the Phase 0.6 card input path;
3. cancel the shared pending animation-frame request, if any;
4. release every held per-card re-entry lock exactly once;
5. if the Modern surface will remain reusable, restore every active card to its own captured front-facing settled transform and hide every card shadow, rendering that deterministic state once only if the surface remains visible and current;
6. if the surface is leaving service, dispose its owned listeners and graphics resources under the existing lifecycle;
7. reveal or retain the intact Legacy hand whenever the effective mode or fallback policy requires it.

Selecting Legacy and hiding the lobby are synchronous presentation decisions; neither waits for the visual sequence to reach a convenient keyframe. WebGL context loss follows the established classified fallback and must not attempt a final WebGL render on the lost context. Repeated cancellation signals are harmless and cannot re-show Modern, re-hide Legacy, or re-run completion.

#### 12.9.7 Reduced motion

When `prefers-reduced-motion: reduce` matches at click time:

- omit lift, perspective travel, and continuous three-dimensional rotation;
- acquire that card's same per-card re-entry lock;
- render the canonical back for at least one presented frame;
- restore and render the original front on the next bounded step;
- release that card's lock; leave no frame pending only when no other normal or reduced-motion animation remains active;
- honor all normal cancellation, authority-isolation, and exact-settlement requirements.

Different cards may perform their bounded reduced-motion proofs concurrently through the same scheduler, while a repeat on an already-active card remains ignored. If cancellation occurs before a back proof can be presented, immediate front settlement or disposal is correct. Reduced motion is not permission to leave a card on its back, skip cleanup, run an idle loop, or route the click through Legacy.

The media-query result may be evaluated for each accepted activation so a user who changes the operating-system setting receives the current preference on the next animation. A preference change need not rewrite an animation already in flight, but cancelling that animation must remain safe.

#### 12.9.8 Acceptance criteria

**AC-P06-001 — Modern-only eligible click**

Given the ready five-card lobby hand with Modern effective:

- a primary click inside each card's current visual bounds can start the effect for that card;
- while one card is active, a primary click inside any other settled card's bounds can start that card's effect immediately;
- a click in empty lobby space starts no effect;
- a click on Play, Shop, Tutorials, or another menu control preserves that control's established behavior;
- Legacy cards receive no new listener, class behavior, transform, or animation;
- no Phase 0.6 listener remains active when Modern is not effective or the lobby is hidden.

**AC-P06-002 — True back and complete double flip**

Given an accepted normal-motion click:

- the clicked card begins canonically flat, visibly leaves its resting plane with perspective size/shape change, introduces its lift-only analytic contact shadow, and exposes a visible thin side edge rather than a flat scale-only effect;
- its original front turns edge-on and the canonical back becomes upright and visible;
- its local-X rotation advances monotonically through `-π`, continues in the same direction through the second edge, and reaches `-2π` with the same original front visible;
- it has exactly one smooth 1,650-millisecond turn segment and records no direction reversal;
- it does not use auxiliary pickup X/Y/Z rotation, local-Y flip rotation, counter-rotation, a back hold, or manual scale as a substitute for perspective depth;
- it returns to its exact captured settled transform with all temporary rotations normalized to zero and its analytic shadow hidden;
- any other card that has not received its own accepted activation does not move.

**AC-P06-003 — Canonical back variants**

Across an ordinary face, a purchased face, and every supported player color:

- the front retains its existing Phase 0.5 URL;
- the back request is exactly `/images/cards/cardBack.png`;
- no request is made for `p<color>/cardBack.png`, `<color>/cardBack.png`, `red/cardBack.png`, or another synthesized variant;
- a forced card-back load failure leaves or restores the complete Legacy hand before any animation input is accepted.

**AC-P06-004 — Per-card re-entry locks and concurrent cards**

Given one card is animating:

- debug state reports one active animation and identifies that card as locked;
- repeated clicks on that same card start no additional animation and are not queued;
- clicking a different settled card starts its animation immediately, increases the active count, and reports both card indexes as independently locked;
- up to all five distinct cards can be active concurrently while at most one surface animation-frame request is pending;
- normal settlement releases only that card's lock once; it may be clicked again after settlement even if another card is still active.

**AC-P06-005 — Bounded scheduler and repeatability**

Given repeated and deliberately overlapping animations on every card:

- each normal sequence follows the 2,450-millisecond nominal timeline and settles within the documented 3,000-millisecond hard limit;
- each card's start timestamp and deadline are independent, and one card's settlement does not reset, accelerate, or cancel another;
- the one shared frame request remains only while at least one card is active and is absent after the last settlement;
- each card ends front-facing at the same screen rectangle, depth, and unit scale it had before its click, with zero static Z rotation, zero temporary X/Y rotation, and no analytic shadow;
- concurrent animation count does not change texture, shadow-mesh/material, shared shadow geometry/texture, card material, geometry, listener, or canvas ownership;
- an idle observation window records no continuous rendering caused by the spike.

**AC-P06-006 — Legacy and lifecycle cancellation**

For each interruption point during lift, the first edge, back display, the second edge, and settlement:

- selecting Legacy immediately reveals the unchanged Raphael cards and leaves no Phase 0.6 frame pending;
- hiding the lobby clears the ready gate, every held card lock, listener ownership, and the shared pending frame before another surface becomes current;
- replacing hand data prevents every old animation token from mutating the new hand;
- disposing the surface releases all locks, listeners, the shared frame, per-card shadow meshes/materials, card-side materials, shared shadow geometry/texture, other geometry ownership, and texture references under the established ownership policy;
- returning to Modern or to the lobby starts from the current front-facing hand with no continuation of any cancelled animation.

**AC-P06-007 — Context-loss cancellation**

Given forced WebGL context loss during every animation phase, including two or more cards in different phases:

- every current animation is invalidated and every held card lock is released exactly once;
- the renderer does not attempt to continue requesting or rendering frames on the lost context;
- effective Legacy and all five Raphael cards are restored under the existing fallback path;
- requested Modern remains persisted;
- no game, deck, account, or match request is issued;
- a late animation callback for any cancelled card cannot hide Legacy again.

**AC-P06-008 — Reduced motion**

Given `prefers-reduced-motion: reduce`:

- the card does not lift or perform continuous 3D rotation;
- the canonical back is presented for at least one frame and the original front is restored on a bounded next step;
- each active card's re-entry lock blocks only another activation of that card, while different cards may perform concurrent bounded back/front proofs through the shared scheduler;
- cancellation is immediate and deterministic;
- no frame remains pending after the final active card settles or after surface-wide cancellation.

**AC-P06-009 — Authority and navigation isolation**

Given successful, repeated, cancelled, and reduced-motion animations:

- serialized `gh.data.hand`, card descriptions, menu state, account state, and match state are unchanged;
- no navigation occurs unless the player separately activates an existing menu command;
- no network request is attributable to a lobby-card click;
- the effect emits no semantic select, play, drop, purchase, deck, or match intent;
- the active-match Modern surface remains blank and non-playable.

**AC-P06-010 — Legacy isolation**

Given a fresh page with Legacy requested or forced:

- the Modern bundle, card-back texture, lobby canvas, raycaster, click listener, and animation scheduler are not requested or created for Phase 0.6;
- the original Raphael lobby hand retains its existing rendering and behavior;
- selecting, using, and returning from Play, Shop, Tutorials, Replay, or Deck behaves as before;
- no Phase 0.6 failure can make the Legacy route contingent on Three.js.

**AC-P06-011 — Canonical resting row and artifact-free presentation**

Given the ready Modern lobby hand before activation and after every active sequence in a normal or cancelled run has settled:

- all five cards are front-facing at their established rectangles with zero static Z rotation, zero temporary X/Y rotation, unit scale, and no visible analytic shadow;
- the face art retains the source sRGB appearance and is not darkened or tinted by the slab lights;
- diagnostics report 40-degree perspective with 450/900 clipping, a three-unit slab with hidden face caps and 0.2 face/body clearance, unlit faces, generated mipmaps, anisotropy no greater than four, per-card analytic-contact shadow meshes/materials with shared geometry/texture, and hardware shadow mapping disabled;
- during the complete same-direction turn, the face art remains stable through oblique minification and the slab does not flash through either face;
- browser evidence shows no grid, moiré, depth-fighting, hardware-shadow sampling, or persistent-shadow artifact attributable to this Phase 0.6 surface.

**AC-P06-012 — Flat-table, position-invariant perspective**

Given deterministic normal-motion runs for the outer-left card at x 72, center card at x 322, and outer-right card at x 572, sampled at the same lift and turn progress:

- lift and settlement report pickup pitch, yaw, and roll exactly zero; during the turn, local Y rotation and static Z rotation remain exactly zero so local X is the only orientation change;
- for each projected face, define normalized lateral shear as the absolute horizontal distance between the top-edge midpoint and bottom-edge midpoint divided by the greater projected face width, with a one-pixel denominator floor; this value must not exceed `0.005` for the outer-left, center, or outer-right card at any non-reduced-motion sample;
- for each four-corner projected silhouette, subtract its centroid and divide both axes by its greater bounding-box dimension, with a one-pixel denominator floor; the maximum corresponding-corner distance from outer-left to center and from outer-right to center must not exceed `0.005`;
- common perspective enlargement, changing projected height, and a common top-to-bottom width ratio caused by the centered local-X foreshortening are allowed; they must be equivalent across the three positions after the translation and normalization above;
- no sampled outer card may lean inward or outward, fan around the center card, or imply a curved, spherical, or hand-held support;
- normal completion and every reusable cancellation path restore the exact zero-lift neutralizer state, zero pickup X/Y/Z rotation, zero temporary local-X/Y rotation, zero static Z rotation, and the established settled rectangle.

#### 12.9.9 Definition of done

Phase 0.6 is complete only when:

- the production Three.js bundle uses the existing front assets and canonical card back without creating color or purchased back variants;
- browser evidence verifies five canonically flat settled cards, unlit sRGB art fidelity, stable mipmapped/anisotropic face textures, 0.2 face/body clearance, calibrated perspective lift, exact zero auxiliary pickup tilt, position-invariant flat-table silhouettes at the outer-left, center, and outer-right slots, side-only lit card depth, independently controlled lift-only analytic shadows, two same-direction local-X edge passages, true back at `-π`, original front at `-2π`, no direction reversal, and exact flat settlement for all five lobby positions;
- deterministic or clock-controlled coverage verifies per-card re-entry locks, same-card repeat rejection without queuing, concurrent different-card motion, independent 2,450-millisecond nominal timelines and 3,000-millisecond deadlines, one shared pending frame at most, and zero idle frame ownership after the last active card settles;
- browser evidence interrupts every animation phase, including overlapping different-card phases, with Legacy selection, lobby hide, hand or surface replacement/disposal, and forced context loss and verifies atomic settlement of all active cards;
- reduced-motion evidence verifies concurrent bounded back/front proofs without lift or continuous rotation and the same per-card re-entry rule;
- request interception or an equivalent test proves the animation issues no state-changing or analytics request;
- Legacy startup and lobby regression evidence remain unchanged;
- all newly owned listeners, shared frames, per-card shadow meshes/materials, card materials, shared geometry/texture references, and card objects are accounted for on disposal;
- the served bundle cache identity advances from the Phase 0.5 artifact and is recorded with the implementation;
- no server, database, rule, AI, account, economy, deck, or protocol change is introduced;
- the active-match Modern renderer remains blank, non-playable, and outside this spike.

### 12.10 Phase 0.7: seeded lobby-card arrival choreography

#### 12.10.1 Objective and reuse boundary

Phase 0.7 makes the five-card Modern lobby hand enter as part of the main-menu reveal. Its reference is the original Raphael lobby animation: the black bar and randomized off-screen-left cards begin together, then the commands appear. The Modern version preserves that casual direction and timing relationship while replacing raw `Math.random`, duplicated position math, extreme spin, and approximate final transforms with a reusable seeded recipe.

The standardized recipe is named `casual-drop-left`. It accepts plain card descriptors and exact destinations and returns plain, inspectable animation plans. Lobby integration is the only Phase 0.7 consumer, but the recipe must not know the five lobby x positions or y=203; a later Three.js shop renderer can supply its own destinations to the same planner and sampler.

#### 12.10.2 Presentation lifecycle

At the start of each `gh.menu.show()` call, before the Raphael bar animation begins, the menu creates one monotonically increasing presentation token with trigger `command-bar-reveal`, profile `casual-drop-left`, and a monotonic reveal timestamp. `handshow()` supplies that presentation and the current five plain card descriptions to the graphics coordinator in the same JavaScript turn. The coordinator retains it while the lazily loaded Three.js surface and textures become ready.

The surface performs this atomic sequence:

1. normalize and load the required front and back textures under the existing fallback policy;
2. create card objects at their ordinary destination-backed base transforms;
3. generate one deterministic batch and sample it at elapsed time since the reveal timestamp;
4. render those caught-up poses, or the exact settled hand if readiness missed the complete timeline;
5. expose readiness so the hand-only gate reveals the Modern canvas;
6. begin the one shared scheduler on the next frame only when at least one caught-up plan remains active;
7. settle every card exactly and return the scheduler to idle.

The coordinator marks the token delivered before any later surface recreation can replay it, and the receiving surface also marks it consumed before frame advancement. Repeated `setCards`, readiness callbacks, scale changes, Legacy-to-Modern toggles, renderer recreation, or resumes during the same menu presentation cannot restart it.

#### 12.10.3 Seeded motion profile

Each card receives a stable per-card seed derived from the batch seed, semantic card identity when available, and slot index. Seeded variation changes the physical nuance of a stable, art-directed phrase rather than arranging traffic. For a five-card row ordered left-to-right, release indexes address destinations `[4, 2, 3, 1, 0]`. The five cards leave one compact off-screen-left hand packet in two uneven bursts. The sampled release gaps are 105–145 milliseconds, 300–340 milliseconds, 55–82 milliseconds, and 105–140 milliseconds, creating an opening pair, a recovery beat, and a quicker follow-through rather than a metronome. Release positions vary by only ±4 logical pixels in x and ±8 logical pixels in y around that packet before each gesture's intentional y offset is applied.

Release indexes map to these correlated gestures:

1. `long-skim`: fast and shallow, with the greatest 39–47 logical-pixel skid.
2. `lofted-toss`: slower and higher, with the broadest 38–56 logical-pixel path bow.
3. `quick-slip`: a low, fast restart after the recovery beat.
4. `loose-follower`: a higher, later card with a shorter 21–28 logical-pixel skid.
5. `soft-drop`: the least vertical impulse and shortest 14–20 logical-pixel skid.

A plan includes:

- a launch center far enough left that the conservative rotated and perspective-scaled footprint is outside the viewport;
- a launch point inside the compact packet, with front-preserving X/Y tilt, alternating Z-spin direction, and initial air gap;
- a gesture-specific launch direction, effective speed, cubic screen-space route, signed path bow, vertical impulse, and analytic gravity;
- a computed apex and a contact point 14–47 logical pixels short of the exact destination;
- one 60–118 millisecond flattening interval embedded within a single 145–250 millisecond post-contact friction movement;
- exact launch and impact velocity records, with the cubic flight's terminal screen velocity matched to the friction curve's initial screen velocity;
- the exact destination and a deadline that includes its release time.

Normal sampling has four renderer-neutral phases:

1. **Waiting:** retain the sampled off-screen packet pose until that card's choreographed release time.
2. **Flight:** follow the gesture-specific cubic x/y route while air gap rises and falls under analytic gravity; bounded pitch, yaw, roll, local-card perspective, the moving flat-table neutralizer, and an independently controlled shadow make the card read as a free object above one flat surface.
3. **Slap:** begin at exact moving edge/corner contact, flatten X and Y once while translation continues along the shared constant-deceleration contact-to-destination curve, and begin dissipating the remaining Z roll.
4. **Slide:** remain flat in X/Y while the same friction curve and Z-roll dissipation continue to the exact destination without a velocity restart at the phase boundary.

No phase contains sine/cosine landing cycles, bounce, rebound, overshoot, or per-frame randomness. Natural projected overflight is allowed when depth ordering makes the relationship legible; exact transformed-face clearance keeps every visible corner at or above the table, and the perspective factor of every rendered vertex and intrinsic edge remains at or below 1.09. All plans in the implementation batch complete within 1,500 milliseconds from the command-bar reveal timestamp, leaving 500 milliseconds of margin inside the product's 2,000-millisecond requirement. Exact settlement, rather than the last floating-point sample, restores destination x/y/base-z, unit scale, zero temporary X/Y/Z rotation, the canonical flat-table projection neutralizer, front visibility, ordinary render order, and no shadow.

The Phase 0.7 safety and motion proof is intentionally scoped to the five-card lobby row. The planner and sampler remain destination-driven and reusable, but a later shop or grid consumer must supply its own dimensions and destinations, define an appropriate human gesture phrase for that layout, and pass its own real-time motion and clearance review before claiming equivalent behavior.

#### 12.10.4 Scheduling, input, and cancellation

Arrival records use the same `activeAnimations` ownership map and sole `requestAnimationFrame` callback as Phase 0.6 flips, with a discriminating `kind`. Flip completion counts and history remain independent from entrance completion counts and history. No click is accepted while the entrance batch remains active; after its final settlement, the existing independent per-card flip rules apply unchanged.

Every Phase 0.6 surface-wide cancellation path also cancels arrivals. Cancellation clears the sole pending frame, restores all active cards synchronously, hides every analytic shadow, and records the batch outcome without treating cancelled arrivals as completed flips. A texture completion that arrives while the surface is suspended may consume the pending presentation directly into a settled cancelled state, but it cannot reveal Modern or schedule motion.

Reduced motion commits the cards at their final destinations before the first revealed frame and records the presentation as skipped without starting the scheduler.

#### 12.10.5 Acceptance criteria

**AC-P07-001 — Causal trigger and one-use token**

Given the lobby begins a new presentation, the bar reveal and Modern presentation token originate in the same `menu.show()` call, one batch consumes the token, and repeated render/resume/mode operations do not replay it. A later lobby presentation receives a different token.

**AC-P07-002 — Deterministic human-scatter phrase**

Given identical descriptors, destinations, request identity, and seed, two planner calls produce identical plans. The canonical five-card row uses destination release phrase `[4, 2, 3, 1, 0]`, all five named motion variants, at least one quick gap of no more than 82 milliseconds, and one recovery pause of at least 300 milliseconds. The plans have deterministic seeded packet position, launch and impact velocities, gravity, apex, tilt, opposing bow and spin directions, contact, and skid values; every complete card begins left of the viewport and every declared total duration is at most 1,500 milliseconds. Changing the seed changes at least one transient value but never the phrase, gesture assignment, or a destination.

**AC-P07-003 — Visible physical arrival**

With normal motion, prompt renderer readiness, and a controlled clock derived from the reveal timestamp, the revealed first frame contains no card at its destination. At actual lobby size and normal playback speed, the batch must first read as one player casually scattering five cards from one compact left-side hand packet: an opening pair, a recovery beat, and a varied follow-through, with no perceptible slot-filling sweep or cloned motion. Flight samples show concurrent routes with visibly different speed, height, curvature, and angular attitude, flat-table-neutralized local perspective, and analytic rise followed by descent; the first slap sample has exact moving edge/corner table contact; slap and slide positions follow one non-increasing-velocity curve while orientation flattens once; and the complete batch leaves all five cards at the exact Phase 0.6 baseline transforms with no visible shadow or pending frame. Delayed readiness catches up rather than restarting the clock.

**AC-P07-004 — Reduced motion**

With reduced motion, the first revealed Modern frame contains all five cards at their exact destinations with zero depth and rotation, no arrival frame is requested, and subsequent reduced-motion click behavior remains the Phase 0.6 bounded back/front proof.

**AC-P07-005 — Lifecycle and Legacy safety**

When Legacy, hide, replacement, disposal, or context loss interrupts any entrance phase, the existing Raphael hand is immediately available, all reusable Modern cards settle, the scheduler and shadows become idle, and invoking any retained stale callback cannot move cards or restore the Modern gate.

**AC-P07-006 — Reusable facility**

Static and pure-function evidence verifies that the planner and sampler live outside lobby orchestration, accept caller-supplied destinations, expose the `casual-drop-left` profile through the Modern facade, use no per-frame randomness, and require no Raphael node.

**AC-P07-007 — Table, depth-order, and dissipation safety**

Across at least 256 deterministic seeds sampled at no more than four-millisecond intervals with the exact renderer transform order, face offset, moving projection neutralizer, and camera projection, every visible face corner stays at or above the table; every rendered-vertex and intrinsic-edge perspective factor stays at or below 1.09; air gap rises to the declared apex and falls to zero under the declared gravity; contact clearance is zero; screen velocity remains continuous at contact; post-contact displacement per equal interval never increases; signed destination error and rotation do not cross zero; the slide remains flat in X/Y; the final pre-settlement sample is within snap tolerance; and settlement persists exactly. Projected card overlap is not a failure by itself: a meaningful close overflight must retain distinguishable center-depth ordering, and the reference batch must contain at least one visible overflight so this is exercised rather than avoided.

#### 12.10.6 Definition of done

Phase 0.7 is complete only when the menu/coordinator/surface presentation token is covered; pure deterministic planner evidence covers the compact packet, art-directed phrase, cadence and gesture diversity, ballistic rise/fall, perspective bounds, table clearance, depth-readable overflight, contact continuity, frictional dissipation, and exact destinations across the required seed sample; controlled browser or harness evidence covers the human first impression at normal speed plus initial, flight, contact, slap, slide, settlement, reduced motion, and cancellation; the generated bundle is served under cache identity `/js/modern/purett-modern-graphics.min.js?v=0.185.1-lobby-card-arrival.3`; all Phase 0.6 flip and Legacy tests remain green; and no server, database, game-rule, shop, economy, or protocol behavior changes.

The engineering portions of this gate were implemented, but the required human first-impression review did not pass. The current Phase 0.7 implementation remains useful negative and lifecycle evidence, but it is not an approved visual baseline and does not authorize reuse of its motion values.

### 12.11 Phase 0.8: one-card Motion Studio authoring workbench

#### 12.11.1 Objective and approval boundary

Phase 0.8 replaces repeated five-card guess-and-deploy iteration with a direct one-card authoring loop. The user must be able to construct, replay, slow, scrub, inspect, save for the current browser session, import, and export a card transition while looking at the real Three.js card model in the actual lobby camera.

The immediate deliverable is a reusable one-card motion recipe and an application-local workbench for authoring it. Phase 0.8 does not:

- declare any built-in preset visually approved;
- rewrite the production `casual-drop-left` entrance;
- automatically distribute one recipe across five cards;
- define multi-card release cadence, overlap, or variation;
- convert the shop or active match;
- add a gameplay action;
- rewrite the saved Legacy/Modern preference;
- save a draft to the server or an account.

The currently deployed Phase 0.7 lobby entrance must appear in the Studio, if offered for comparison, under the explicit label `Unapproved current lobby`. It must never be labeled `Default`, `Approved`, `Human Scatter`, or another term that implies its visible behavior met the product goal.

#### 12.11.2 Application composition and isolation

The Studio uses the existing application frame:

```text
#content-scale-stage
└── #content-wrapper                         existing scale owner
    ├── title and status                     remain visible
    ├── #content                             755 × 562 logical region
    │   ├── existing lobby/menu              remains intact underneath
    │   └── Motion Studio                    isolated authoring layer
    │       ├── workbench header
    │       ├── isolated Three.js preview
    │       ├── scrolling inspector
    │       └── transport and timeline
    └── footer                               remains visible
```

The existing moogle context menu adds `Motion Studio…` immediately beneath the Graphics section. Activating it closes that menu, records the current application view and focus target, and mounts the workbench above the lobby. It must not call `gh.menu.hide()`, run the Legacy hand-hide animation, navigate, start or resume a game, or use `gh.graphics.setMode()`.

The authoring renderer has its own scene and lifecycle. It may reuse pure geometry/material construction helpers and the already loaded Three.js module, but it must not reuse the live lobby scene, renderer, card entries, animation map, scheduler, or presentation token. The Studio may open while Legacy is requested and effective; loading Three.js for the Studio does not make Modern requested or effective and does not apply the Modern lobby gate.

`Back to Lobby` and eligible Escape activation must:

1. stop and invalidate Studio playback;
2. cancel the Studio frame request;
3. detach workbench listeners;
4. dispose Studio-owned canvas, renderer, textures, materials, and geometry under their declared ownership policy;
5. remove the authoring layer;
6. reveal the unchanged underlying screen;
7. restore the same requested/effective Graphics state;
8. return focus to the menu action or another stable originating control.

#### 12.11.3 Workbench layout and visual treatment

At logical scale 1 the 755 by 562 region should be divided approximately as follows:

- a 44-logical-pixel black workbench header containing `Back`, `Motion Studio`, preset selection, and Reset;
- a 432-logical-pixel body containing an approximately 495-pixel preview and a 260-pixel scrolling inspector;
- an 86-logical-pixel dark transport/timeline strip.

Exact pixel allocation may move slightly for legibility, but the card preview must remain materially larger than the inspector and no horizontal application scroll may be required at supported content scales.

The Studio should reuse the established visual language: Spinnaker typography, black command-bar treatment, parchment inspector groups, dark-brown text, dark-brown selected controls, muted-gold focus accents, and compact rounded buttons comparable to the existing Graphics and Game Size controls. It should not use the speech-bubble dialog's moogle/tail button pane and should not introduce an unrelated generic developer-console theme.

The stage represents one flat tabletop. It must not add a perspective grid, radial stage, curved horizon, or decorative surface distortion. Authoring helpers may show a path, destination outline, apex, contact point, start and landing handles, and shadow, but one `Helpers` control must remove them all for clean visual judgment.

#### 12.11.4 Control contract

Each continuous setting has a slider, numeric value, and visible unit. The ranges below define the initial safe authoring envelope. They are not approved production motion values.

| Group | Control | Initial range | `Casual Toss` starting value |
|---|---|---:|---:|
| Travel | Direction | −180° to 180° | −8° |
| Travel | Distance | 0–1,000 px | 500 px |
| Travel | Landing center X | 0–755 px | 378 px |
| Travel | Landing center Y | 0–562 px | 276 px |
| Travel | Flight time | 200–2,500 ms | 900 ms |
| Travel | Signed path curve | −300–300 px | 45 px |
| Elevation | Release height | 0–300 logical units | 150 |
| Elevation | Apex height | 0–350 logical units | 220 |
| Elevation | Apex position | 10–90% of flight | 45% |
| Rotation | End-over-end flips, local X | −3 to 3 turns, 0.25 step | 1 turn |
| Rotation | Side-over-side flips, local Y | −3 to 3 turns, 0.25 step | 0 turns |
| Rotation | Table-plane spin, local Z | −2 to 2 turns, 0.05 step | 0.18 turn |
| Rotation | Release pitch and yaw | −75° to 75° each | 25° / −8° |
| Rotation | Release roll | −180° to 180° | −12° |
| Rotation | Contact pitch and yaw | −30° to 30° each | 10° / 4° |
| Scale | Card-size multiplier | 0.75× to 1.5× | 1× |
| Authored scale | Start, apex, and landing | 0.5× to 2× each | derived by perspective |
| Contact | Slap duration | 0–400 ms | 110 ms |
| Contact | Skid distance | 0–200 px | 38 px |
| Contact | Skid direction offset | −180° to 180° | 4° |
| Contact | Skid duration | 0–1,000 ms | 260 ms |
| Contact | Final table rotation | −30° to 30° | 0° |
| Appearance | Analytic-shadow strength | 0–1 | 0.32 |
| Appearance | Analytic-shadow spread | 0.5× to 2× | 1× |
| Appearance | Visible card thickness | 0–8 logical units | 3 |

`Perspective` is the default scale mode. In this mode apparent size is derived from the production lobby camera and recipe height rather than a manual two-dimensional tween. The inspector should display the derived release, apex, and landing factors read-only. With the nominal approximately 772-logical-unit camera distance, the table landing remains 1× while the suggested release and apex heights visibly enlarge the card; this is intentional evidence of movement toward the camera.

`Authored` scale mode unlocks explicit start, apex, and landing factors for artistic studies. These factors must remain recipe data rather than CSS scale applied outside the renderer. The UI must clearly identify this as an authored override so it is not confused with physical perspective.

Changing direction or distance recomputes the start relative to the landing point. Dragging either stage handle recomputes start, landing, direction, and distance in one atomic draft update. Controls must not form competing independent sources of truth.

The first implementation may omit bounce. If bounce is later added, it must be an explicit advanced control that defaults to off; it must not be hidden randomness in a built-in preset.

#### 12.11.5 Preview, transport, and editing behavior

The preview renders one selected real card face, its canonical back, visible edge, and analytic shadow. It offers:

- draggable `Start` and `Land` handles;
- a faint landing outline;
- optional trajectory, apex, and contact markers;
- front/back inspection without modifying the recipe;
- clean-view helper suppression;
- actual-size and fit-stage view choices that do not modify recipe scale.

The transport contains Replay, Play/Pause, one-frame backward and forward steps, Loop, and 0.25×, 0.5×, 1×, and 2× playback. The scrubber spans the complete recipe duration and marks Release, Apex, Contact, Flat, and Settled. Named milestones come from the sampled recipe plan, not hard-coded percentages in the UI.

Scrubbing pauses playback and renders the exact selected pose. Frame-step uses the Studio's declared review-frame interval and must not depend on the monitor refresh rate. Replay begins from the deterministic initial pose. Changing playback speed affects only wall-clock review, not the recipe, milestones, or sampled path.

During a pointer drag on a slider or stage handle, the renderer updates the current playhead pose without scheduling a growing queue of restarts. On edit completion, `Auto Replay` may begin one replay after a short debounce of approximately 120 milliseconds. Auto Replay defaults on under ordinary motion preferences and can be turned off independently from Loop. With reduced motion requested, Auto Replay defaults off; a user may explicitly start full authoring playback after the Studio explains that this preview-only action does not change the application's reduced-motion behavior.

Paused, settled, or merely open Studio state must have no animation frame pending. A discrete control edit or scrub may render once without becoming an idle loop.

#### 12.11.6 Recipe, preset, persistence, and interchange contract

The recipe is plain JSON-compatible data. A representative shape is:

```json
{
  "schemaVersion": 1,
  "name": "Casual Toss",
  "seed": "motion-study-1",
  "path": {
    "landingX": 378,
    "landingY": 276,
    "angleDeg": -8,
    "distancePx": 500,
    "flightMs": 900,
    "releaseHeight": 150,
    "apexHeight": 220,
    "apexAt": 0.45,
    "curvePx": 45
  },
  "rotation": {
    "pitchTurns": 1,
    "yawTurns": 0,
    "rollTurns": 0.18,
    "releasePitchDeg": 25,
    "releaseYawDeg": -8,
    "releaseRollDeg": -12,
    "contactPitchDeg": 10,
    "contactYawDeg": 4,
    "finalRotationDeg": 0
  },
  "scale": {
    "mode": "perspective",
    "cardScale": 1
  },
  "contact": {
    "slapMs": 110,
    "skidPx": 38,
    "skidAngleDeg": 4,
    "skidMs": 260
  },
  "appearance": {
    "shadowStrength": 0.32,
    "shadowSpread": 1,
    "thickness": 3
  }
}
```

The exact nesting may change before implementation, but schema version, semantic units, deterministic sampling, canonical serialization, and atomic validation are required. The recipe must not contain five-card release order, lobby presentation tokens, current card ownership, or the Studio's playback state.

Built-in presets initially include:

1. `Gentle Drop` — longer flight, modest lateral energy, limited rotation, short skid.
2. `Casual Toss` — elevated, clearly perspective-scaled flight with one visible turn and a moderate contact/skid.
3. `Energetic Scatter` — faster travel, greater height, rotation, and residual skid while remaining inside the safe envelope.
4. `Unapproved current lobby` — a faithful comparison path for the deployed Phase 0.7 implementation, visually marked as rejected and never selected as the new default merely because it exists.

These presets are starting points, not approvals. Selecting one deep-copies it into the current draft. Reset restores that source preset. A user-named copy may be retained in session state; naming does not promote it.

Guarded `sessionStorage` retains the current draft and Studio UI state for the lifetime of the tab. The Graphics preference continues to use its independent existing storage and is never included in Studio state. If session storage is unavailable or invalid, the Studio opens with a documented preset and the application remains functional.

`Copy JSON` or equivalent export must produce canonical, human-readable recipe data. Import must parse into a temporary value, validate the entire value, and replace the draft only after success. An unsupported version, missing field, unknown enum, non-finite number, unsafe camera crossing, table penetration, or value outside the authoring envelope must leave the previous draft unchanged and produce a concise field-specific message. Import and export remain entirely local.

#### 12.11.7 Acceptance criteria

**AC-P08-001 — Entry, exit, and Graphics-mode isolation**

Given either Legacy or Modern is requested and effective in the lobby, opening the Studio mounts one workbench and one isolated study surface without writing the Graphics key, calling the Graphics setter, changing requested/effective mode, hiding the underlying Legacy hand through the Modern gate, navigating, or issuing a request. Closing through Back and Escape restores the exact prior view and Graphics states, returns stable focus, and leaves no Studio canvas, context, listener, or frame request.

**AC-P08-002 — Production-faithful one-card study**

The Studio renders exactly one non-authoritative card using the actual face/back assets, 117 by 146 dimensions, visible thickness, sRGB face treatment, analytic shadow, flat-table convention, and calibrated lobby perspective camera. At the `Casual Toss` starting values, normal-speed and slowed evidence visibly show height-derived perspective enlargement, a three-axis card attitude, front/back orientation, edge thickness, accelerating descent, contact, flattening, and skid rather than a flat CSS translation.

**AC-P08-003 — Complete synchronized controls**

Every control required by `FR-MOTION-STUDIO-008` is keyboard and pointer operable, exposes its value and unit, remains inside its documented range, and updates the renderer-neutral draft. Directly dragging start or landing updates coordinates, direction, and distance consistently. Invalid input never introduces a non-finite pose or replaces the last valid draft.

**AC-P08-004 — Deterministic renderer-neutral recipe**

Given one recipe, seed, start/destination, and at least the initial, quarter, apex, pre-contact, contact, flat, pre-settlement, and settlement times, two independent samplers produce equal renderer-neutral poses within declared numerical tolerance. Repeating under 0.25×, 1×, 2×, irregular frame cadence, scrub order, page scale, and reopen-from-session yields the same recipe and poses. The recipe and diagnostics contain no Raphael or Three.js object.

**AC-P08-005 — Transport, timeline, and idle scheduling**

Replay, Play/Pause, frame-step, Loop, all four rates, and scrubbing operate from one playhead and one scheduler. Milestone markers correspond to plan times. Scrubbing pauses at the exact pose; speed changes do not alter recipe time; editing with Auto Replay schedules at most one debounced replay; and paused or settled observation leaves no frame pending.

**AC-P08-006 — Presets, reset, and session restoration**

The three creative presets are visibly distinct, `Unapproved current lobby` is visibly identified as rejected, selecting a preset creates an independent draft, Reset restores it, and modifying one draft cannot mutate a built-in. Closing and reopening in the same tab restores the guarded draft and Studio UI state without changing Graphics mode. Missing or corrupt session state falls back safely.

**AC-P08-007 — Import/export round trip and failure atomicity**

Exporting a valid recipe, resetting the Studio, and importing that export restores a semantically equal canonical recipe and identical sampled poses. Unknown schema versions, malformed JSON, prohibited fields, non-finite numbers, invalid enums, and unsafe values are rejected with a useful message; every failure retains the previous valid draft and sends no request.

**AC-P08-008 — Authority, lifecycle, and resource isolation**

Opening, editing, replaying, importing, exporting, and closing the Studio leaves `gh.data`, hand order, card IDs, account, coins, deck, shop, match, replay, navigation, requested/effective mode, and server-request counts unchanged. Fifty open/edit/play/close cycles return Studio DOM, listener, animation-frame, renderer, context, texture, material, and geometry ownership to baseline without changing the live lobby surface.

**AC-P08-009 — Accessibility and reduced motion**

Every workbench control has an accessible name, value/state, visible focus, and logical keyboard order; no canvas-only action is required to set a recipe. With reduced motion requested, the Studio opens paused with Auto Replay off, explains explicit preview playback, and permits scrubbed inspection. Explicit authoring playback does not rewrite the system preference or production reduced-motion setting.

**AC-P08-010 — Visual approval gate**

At least one candidate recipe must be reviewed at actual lobby size and 1× speed, with 0.25× evidence available for diagnosis. Approval records the exact exported recipe, seed, front/back asset, reference capture, reviewer decision, and intended future consumer. Until that record exists, every Studio preset and the deployed Phase 0.7 lobby scatter remain unapproved experiments and must not be described as the target player-drop/scatter motion.

#### 12.11.8 Definition of done

Phase 0.8 is complete only when:

- the Studio opens and closes inside the application with exact Graphics-mode and lobby-state isolation;
- one production-faithful card can be authored through every required control and direct-manipulation path;
- the deterministic renderer-neutral planner and sampler pass canonical-time and irregular-cadence evidence;
- the complete transport, timeline, scrub, Auto Replay, and idle-scheduler contract passes;
- presets, Reset, guarded session persistence, canonical export, atomic import, and invalid-data fallback pass;
- accessibility, explicit reduced-motion preview, context-loss, and repeated lifecycle/resource evidence pass;
- all Legacy, Graphics mode, Phase 0.5, Phase 0.6, and applicable lobby lifecycle regressions remain green;
- the document and UI identify the deployed Phase 0.7 scatter as unapproved;
- no game, account, server, protocol, production preference, or production recipe state changes;
- a candidate may be exported for review, but production promotion remains a separately approved integration step.

The final two bullets describe the Phase 0.8 delivery boundary. Phase 0.9 below is the separately approved integration step: it authorizes a browser-local production playbook for the declared Modern lobby targets while preserving every prohibition on game authority, server state, account state, Graphics preference, shop motion, and active-match motion.

### 12.12 Phase 0.9: application-bound lobby motion playbook

#### 12.12.1 Objective, scope, and supersession

Phase 0.9 turns Motion Studio from an isolated recipe laboratory into an application-bound authoring and evaluation tool for the two easiest finished-state consumers:

1. the five-card Modern lobby intro; and
2. the five-card Modern lobby exit.

It is the explicit integration phase anticipated by `FR-MOTION-STUDIO-016`. It supersedes the Phase 0.8 statement that a Studio draft cannot be applied to production choreography, but only inside the following narrow boundary:

- five independently editable left-to-right lobby intro targets;
- one shared Gentle Wind lobby exit target compiled into five instances;
- browser-local persistence and preview;
- Modern lobby presentation only.

Phase 0.9 does **not** authorize Studio recipes for the shop, deck editor, active match, endgame screen, cover, account, server, or source-controlled defaults. It does not make the lobby hand game-authoritative or convert the surrounding command bar and menu presentation from their existing technologies.

The rejected Phase 0.7 `casual-drop-left` implementation remains historical negative evidence. Phase 0.9 does not rename it, bless it, or inherit its artistic constants merely because both implementations have deterministic planners.

#### 12.12.2 Application target and playbook model

The Studio's primary selector is `Application animation`, with these targets:

```text
Lobby intros
├── Lobby card 1 — Intro        leftmost runtime slot
├── Lobby card 2 — Intro
├── Lobby card 3 — Intro
├── Lobby card 4 — Intro
└── Lobby card 5 — Intro        rightmost runtime slot

Lobby exits
└── Lobby hand — Gentle Wind Exit
```

The five intro entries own independent recipe snapshots and start delays. Changing card 1 must not change cards 2–5. The exit entry owns one base recipe and one base cadence for the sequence; it is not five independently authored exits.

The Studio may explicitly copy **shared intro motion** from the currently selected intro to one or all other intro targets. This is a draft-only, allowlisted operation. It copies flight time, release and apex height, rotation, contact and skid behavior, scale mode and authored scale curve, and shadow treatment. It preserves every destination target's start delay, travel heading, travel distance, path curve, stable identity, locked landing offsets, application card scale, and final settled scale. Gentle Wind is never a source or destination. Future recipe fields do not begin propagating merely because the card-motion schema grows; adding a shared field requires a reviewed allowlist change and contract update.

A representative playbook envelope is:

```json
{
  "schemaVersion": 1,
  "id": "lobby-card-motion",
  "label": "Lobby card motion",
  "targets": {
    "lobby-card-1-intro": {
      "targetId": "lobby-card-1-intro",
      "delayMs": 0,
      "preset": {"schemaVersion": 1}
    },
    "lobby-card-2-intro": {
      "targetId": "lobby-card-2-intro",
      "delayMs": 80,
      "preset": {"schemaVersion": 1}
    },
    "lobby-card-3-intro": {
      "targetId": "lobby-card-3-intro",
      "delayMs": 160,
      "preset": {"schemaVersion": 1}
    },
    "lobby-card-4-intro": {
      "targetId": "lobby-card-4-intro",
      "delayMs": 240,
      "preset": {"schemaVersion": 1}
    },
    "lobby-card-5-intro": {
      "targetId": "lobby-card-5-intro",
      "delayMs": 320,
      "preset": {"schemaVersion": 1}
    },
    "lobby-hand-gentle-wind-exit": {
      "targetId": "lobby-hand-gentle-wind-exit",
      "delayMs": 95,
      "preset": {"schemaVersion": 1}
    }
  },
  "wind": {
    "locked": false,
    "seed": "gentle-wind-preview-1"
  }
}
```

The abbreviated `preset` objects above represent complete validated card-motion recipes. Absolute slot coordinates are intentionally absent. At compilation time the lobby renderer resolves the current card centers, logical dimensions, flat-table Z value, and resting rotation. This keeps the application—not imported JSON—authoritative over where the five cards rest.

For an intro, the live anchor is the immutable destination. Direction and distance determine the release point relative to that destination. Landing offsets and application-owned resting scale are constrained. For an exit, the same live anchor is the immutable origin. The outbound sampler begins from the exact settled pose and follows the compiled Gentle Wind path until the complete card is outside the lower-left viewport boundary.

#### 12.12.3 Deterministic Gentle Wind compilation

One exit run has one explicit sequence seed. Planning occurs in two levels:

1. A shared derivation samples the gust's small heading delta, strength, lift, curvature bias, and cadence factor.
2. A stable derivation keyed by the same run seed and lobby slot samples bounded per-card heading, distance, endpoint lane, curve, lift, speed, release attitude, turn count, and delay differences.

The result must feel like one gentle force moving five cards rather than five unrelated throws. Coherence must not collapse into identical paths: each card requires a distinct lower-left offscreen endpoint and visibly distinguishable timing or attitude. Stable slot keys make the result independent of texture, card ID, array traversal history, and the presence of a previous run.

`Lock wind seed` makes both Studio previews and normal Modern command exits reproduce the playbook seed. `New variation` creates another explicit candidate seed. When the seed is unlocked, each production command exit creates one new seed before compilation and keeps that seed for all five cards. Frame sampling consumes no random source.

#### 12.12.4 Motion Studio application workflow

The authoring stage is the complete 755 by 562 lobby board coordinate space, not a scaled-down panel or crop. Its transparent Three.js surface, helper SVG, and board backdrop share the exact logical bounds used by the production lobby. The entire Studio shell visually inherits the application's selected `1×`, `1.5×`, `2×`, or `3×` game scale while its camera, helper coordinates, anchors, and playbook values remain in the unchanged logical coordinate system. Header, target selectors, copy tools, inspector controls, advanced JSON editor, readout, and playback transport remain outside that rectangle in a viewport-level Studio shell. The stage is never distorted to make controls fit; narrow viewports scroll or stack the control dock outside the stage.

The application-bound authoring workflow is:

1. Open `Motion Studio…` from either Legacy or Modern.
2. Choose one of the six application targets.
3. Edit the selected target's recipe and start delay. The locked application start/destination is visible but cannot be dragged or imported to a different location.
4. For an intro, optionally copy its shared motion character to one selected intro or all other intros. Destination-specific delay and travel placement remain unchanged.
5. For Gentle Wind, optionally lock the current seed or request a new variation.
6. Use the one-card study transport for detailed tuning.
7. Select `Apply & Preview in Lobby`.
8. Validate and persist the entire playbook atomically.
9. Close the Studio and run the corresponding complete production sequence:
   - an intro target previews all current intro entries in context; or
   - the Gentle Wind target previews all five seeded exit instances.
10. Hold the completed lobby state briefly for observation, restore the hand where required, restore the prior Graphics selection, and reopen the Studio on the same target.

The production preview is not a duplicate approximation implemented inside the Studio. It must call the same playbook compiler, same lobby surface, same pose sampler, same scheduler, same fixed anchors, and same completion path used by ordinary Modern lobby intro or exit.

When this workflow begins in Legacy, temporary Modern presentation is preview infrastructure only. The Graphics local-storage value remains Legacy, `requested` is restored, Legacy remains the user's preference, and a user selection made while the preview is active takes precedence over the earlier restoration target.

The Advanced section operates on the complete playbook. `Export Playbook` copies canonical whole-playbook JSON. `Import Playbook` validates and replaces all six entries and wind policy atomically. Neither action sends a request.

#### 12.12.5 Production intro, command exit, and Tutorials Back

Initial Modern lobby presentation compiles all five intro entries against the current hand anchors. Each entry retains its own recipe and delay. Async texture or renderer readiness may catch up against the current presentation token, but it must not change destinations or create a second intro for the same token.

The following main lobby commands participate in the generic exit:

| Command | Exit behavior | Continuation |
|---|---|---|
| Play / Resume Game | Gentle Wind | Existing game-start callback |
| Shop | Gentle Wind | Existing shop callback |
| Tutorials | Gentle Wind | Existing tutorial-menu callback |
| Replay | Gentle Wind | Existing replay navigation |
| Deck | Gentle Wind | Existing deck callback |

The command name is diagnostic context only; all five use the same exit entry and run-seed policy. The first eligible click holds one continuation. Until it settles, subsequent command clicks are ignored without audio, queueing, seed creation, or callback replacement. Completion invokes the held continuation exactly once.

The renderer and continuation boundary is fail-open. Planning failure, unavailable Modern surface, texture failure, context loss, cancellation, missing completion, and watchdog expiry all release the original continuation rather than trap the user. The watchdog is based on the batch deadline, includes bounded cleanup margin, and is capped independently of recipe import.

Tutorials Back is not one of the five exits. It restores the main command list in place and then requests the current intro batch so the five cards visibly re-enter their locked slots. Failure to animate cannot prevent the command list from returning.

Legacy does not participate in these waits. Its commands and Tutorials Back retain their immediate historical behavior and do not load Three.js solely for choreography.

#### 12.12.6 Persistence, lifecycle, and reduced motion

The complete normalized playbook uses a dedicated guarded `localStorage` key. The Studio's selected target, helper visibility, timeline options, and inspector state may continue using a distinct versioned `sessionStorage` key. Graphics preference remains in its existing independent key. No storage envelope may embed or overwrite another.

Storage behavior must be:

- last-valid and atomic;
- schema-versioned;
- canonical on export;
- tolerant of storage unavailability;
- safe against malformed and future-version content;
- free of resolved anchors and renderer objects;
- local to the current origin and browser profile;
- unrelated to account, database, or server persistence.

Intro or exit cancellation must leave the lobby in one declared terminal state. Intro cancellation restores the exact flat anchors. A completed exit may keep cards outside only until its command continuation or bounded preview hold advances the view; reusable preview cleanup restores the hand before reopening the Studio. Every path cancels the sole pending frame, invalidates stale callbacks, hides analytic shadows, releases card locks, and prevents late poses from affecting a replacement hand or view.

With reduced motion requested, the renderer may commit an intro directly to its five anchors and an exit directly to its completed state. It must still settle the batch and release a held command exactly once. Reduced motion changes presentation duration, not application flow or seed determinism.

#### 12.12.7 Acceptance criteria

**AC-P09-001 — Six application targets and independent intros**

The Studio lists exactly five left-to-right intro entries and one shared Gentle Wind exit. Editing, resetting, applying, exporting, or importing card 1 does not mutate cards 2–5. An intro batch resolves five live anchors without serializing them and settles every available card exactly at its slot with application-owned size and table orientation.

**AC-P09-002 — Deterministic coherent Gentle Wind**

Given one normalized playbook, five anchors, and a locked seed, two independent compilations produce equal shared-gust values, per-slot seeds, delays, effective recipes, endpoints, durations, and sampled poses. The five complete cards finish beyond five distinct lower-left offscreen endpoints. Changing only the seed changes at least one bounded per-card value while preserving the endpoint region, anchor origins, authoring limits, camera safety, table clearance, and coherent shared direction.

**AC-P09-003 — Seed controls**

Locked-seed Studio previews and command exits repeat exactly. `New variation` changes the candidate seed without mutating a recipe or anchor. Unlocked production exits generate one new seed per command and use stable per-slot derivation for the entire batch. No sampled frame calls a nondeterministic random source.

**AC-P09-004 — Apply and preview uses production path**

From each of the six targets, `Apply & Preview in Lobby` persists the complete playbook, closes the Studio, and invokes the real lobby batch path. Intro preview shows all five authored intros in context; exit preview shows all five derived wind variants. The bounded hold/reset completes, the Studio reopens on the same target, and the observed plans match direct production compilation.

**AC-P09-005 — Graphics preference isolation**

Starting Apply & Preview with Legacy stored, requested, and effective may temporarily present Modern, but it does not write the Graphics key. Normal completion, forced planner failure, initialization failure, context loss, cancellation, and preview-watchdog expiry restore Legacy and stable focus. Starting from Modern restores Modern. A deliberate Graphics selection during preview remains authoritative.

**AC-P09-006 — Generic command exit and click suppression**

Play, Shop, Tutorials, Replay, and Deck each invoke the same Gentle Wind target before their existing continuation when Modern is ready. For every command, normal exit completes before the continuation and the continuation runs once. Repeated or different command clicks while one is pending produce no queued exit and no second continuation.

**AC-P09-007 — Fail-open command lifecycle**

For unavailable Modern, planning exception, animation cancellation, surface disposal, context loss, missing callback, and forced watchdog expiry, the original command continuation runs exactly once within the declared maximum. Pending-command and watchdog state return to null, the scheduler returns idle, and no late completion invokes navigation again.

**AC-P09-008 — Tutorials Back intro replay**

After Tutorials replaces the main command list, Back restores the normal commands and requests one current intro batch in Modern. The five cards use their current independent intro entries and exact anchors. In Legacy or on Modern failure, the commands still return immediately and no extra navigation or request occurs.

**AC-P09-009 — Whole-playbook persistence and interchange**

Applying or importing a valid playbook persists all six entries and wind policy across refresh, new tab, and browser restart on the same origin. Export/import is canonically equal and reproduces the same locked-seed batch. Malformed JSON, missing or additional required structure, unsupported schema, invalid target, non-finite value, unsafe recipe, or prohibited anchor data is rejected atomically and retains the last valid playbook.

**AC-P09-010 — Modern-only authority and Legacy regression**

All Phase 0.9 actions leave `gh.data`, current hand order and IDs, deck, shop, tutorials, replay ID, account, coins, game state, requests, protocols, and active-match rendering unchanged. Legacy lobby visuals and commands remain independent of the playbook. Switching to Legacy during any Phase 0.9 motion cancels Modern presentation safely and leaves Legacy usable.

**AC-P09-011 — Reduced motion and cleanup**

Reduced-motion intro and exit reach their correct terminal states and continuations exactly once without continuous travel. Fifty cycles spanning intro, exit, locked and unlocked seeds, Apply & Preview from both Graphics modes, all five commands, Tutorials Back, import/export, cancellation, context loss, and watchdog expiry return frame, listener, timer, callback, card-lock, shadow, canvas, texture, material, geometry, and WebGL ownership to baseline.

**AC-P09-012 — Human review remains explicit**

Normal-speed actual-size review judges the five-entry intro as a complete phrase and the Gentle Wind exit as a coherent gust with natural variance. Passing deterministic and lifecycle tests does not by itself approve the artistic values. Phase 0.7 remains labeled rejected and is not used as the approval reference.

**AC-P09-013 — Full-board one-to-one authoring stage**

Motion Studio's preview, Three.js canvas, and helper coordinate layer are exactly 755 by 562 logical pixels and share the production lobby camera and anchor coordinates. Their visual bounds, the separate control dock, and the renderer backing resolution follow the current application game scale without multiplying motion coordinates or playbook values. No visible HTML button, selector, field, editor, readout, or transport overlaps the board rectangle. The obsolete scaled-panel crop control is absent. At narrower viewport widths the control dock may stack or scroll outside the board, but the board stage itself remains undistorted and every scaled edge remains reachable.

**AC-P09-014 — Selective shared intro copying**

From any intro target, the author may copy shared motion to one selected intro or all other intros. The operation is atomic, immutable, draft-only, and session-persistent. Every destination receives the declared shared-field allowlist while retaining its delay, heading, distance, curve, target identity, and application-owned landing and scale locks. The source, unselected intros, and Gentle Wind remain unchanged. Copy controls are unavailable while Gentle Wind is selected, and no local production playbook changes until Import or Apply & Preview.

#### 12.12.8 Required tests and evidence

Phase 0.9 requires:

- a DOM/Three-free static playbook contract covering schema, strict normalization, canonical serialization, deep immutability, fixed target registry, omitted anchors, independent intro edits, seed stability, order independence, distinct offscreen endpoints, bounds, timing, camera safety, and sampled terminal poses;
- browser coverage for the six-target selector, locked-anchor presentation, start-delay control, wind lock/new-variation controls, target Reset, whole-playbook import/export, local persistence, Apply & Preview, Studio reopen, and Graphics restoration;
- controlled-clock lobby-surface coverage for intro and exit batches, one shared scheduler, all five concurrent cards, exact anchors, exit visibility, completion, cancellation, reduced motion, and stale-token rejection;
- one browser case for each of Play, Shop, Tutorials, Replay, and Deck proving exit-before-continuation and exact-once continuation;
- repeated-click tests proving a pending command ignores both same-command and different-command activations;
- forced planner, surface, callback, and watchdog failures proving fail-open navigation;
- Tutorials Back coverage proving the command list returns before or independently of intro replay;
- Legacy-only startup and command regression proving no playbook animation or new Modern dependency load;
- storage failure, malformed/future import, and canonical whole-playbook round-trip coverage;
- a pure shared-motion-copy contract covering the explicit field allowlist, protected destination timing/travel values, identity and anchor locks, immutability, atomic rejection, and Gentle Wind exclusion;
- browser geometry evidence that the 755 by 562 logical board, canvas, and helpers coincide while every visible HTML control remains outside, that the complete Studio follows persisted and live application scale changes with reachable overflow, plus copy-to-one/copy-to-all draft and session behavior;
- actual-size 1× normal-speed and slowed captures for human intro and exit review.

#### 12.12.9 Status summary and definition of done

The Phase 0.9 implementation is present in the current feature branch:

- the pure playbook owns five intro targets, one shared Gentle Wind exit, fixed-anchor compilation, deterministic shared/per-slot seed derivation, bounded variation, whole-playbook normalization, and sampling;
- the Modern lobby surface consumes intro and exit batches through its shared demand-driven scheduler;
- the graphics coordinator owns local playbook persistence, production preview, temporary Modern restoration, generic command exit, exact-once continuation, and fail-open watchdog;
- the menu routes Play, Shop, Tutorials, Replay, and Deck through that coordinator and replays intro on Tutorials Back;
- Motion Studio edits application targets on a full-size lobby board stage, copies shared motion across selected intro drafts without flattening per-card delay or travel, locks landing anchors, controls the wind seed, imports/exports the whole playbook, and applies it to the real lobby path.

Phase 0.9 is complete only when all `AC-P09-*` criteria and required static/browser evidence pass, the generated Modern bundle matches its source, applicable Phase 0 through Phase 0.8 and Legacy regressions remain green, and a normal-speed human review records the current intro and Gentle Wind visual decision. This status does not revise Phase 0.7's rejection or authorize any shop or active-match consumer.

### 12.13 Phase 0.10: passive active-match hand projection

#### 12.13.1 Intent and boundary

Phase 0.10 begins active-match rendering with the smallest visually meaningful state slice: the two current hands. Modern renders zero to five player cards in the established left stack and zero to five opponent cards in the established right stack. A fresh game normally presents five in each hand, while resume, review, replay, and ordinary play may legitimately present fewer. Either side may therefore be empty in a valid snapshot; a simultaneous zero-plus-zero compatibility payload is reserved as the pre-match/not-ready sentinel and keeps the preparing gate visible until constructed match state arrives.

This phase remains a presentation/input gate over the live Legacy controller. It does not claim the complete renderer-neutral boundary required by Phase 1, and it does not make Modern playable. Raphael remains loaded, mounted, synchronized, and immediately recoverable. Modern does not render or own board cards, nine drop slots, score glyphs, turn marker, rule labels, element icons, bonuses, capture effects, dialogs, review controls, or game-over presentation.

#### 12.13.2 Renderer-neutral compatibility description

`gh.game` must expose a temporary plain-data description of both current hands. Each description must contain only values needed by a passive renderer: side, hand index, stable match-local game-card ID, current permitted visible art, explicit face state, resolved same-origin texture URL, exact logical rectangle, zero rotation, and deterministic order. It may contain other plain identifiers already present in client state, but it must not contain or inspect a Raphael element, DOM node, jQuery object, bounding box, SVG attribute, paint-order primitive, animation handle, or event handler.

The visible art value must be maintained explicitly as game presentation state. It must initialize from the server-provided visible art and remain correct when a Closed opponent card is revealed, a board card changes control color, Sudden Death returns cards to hands, or review reconstructs an earlier hand. A concealed opponent description may expose only `cardBack`; it must not derive or retain a hidden face, catalog identity, rank, or color-specific face URL in Modern diagnostics.

The compatibility description is refreshed after initial hand construction and after established Legacy hand-reflow/reconstruction seams. It is a temporary extraction aid and must be replaced or absorbed by the complete versioned snapshot in Phase 1.

#### 12.13.3 Exact settled geometry

The Phase 0.10 surface uses the existing 693 by 500 active-match logical region. Cards are portrait-oriented 117 by 146 rectangles with no static X, Y, or Z rotation and no perspective skew.

The player stack uses:

- `x = 28`;
- `y = 18, 73, 128, 183, 238`.

The opponent stack uses:

- `x = 550`;
- `y = 18, 73, 128, 183, 238`.

Each successive card therefore advances 55 logical pixels and overlaps the prior card by 91 logical pixels. Array index zero is backmost and the last current index is frontmost. The Three.js depth/order policy must reproduce that overlap deterministically without z-fighting or visible shimmer.

A head-on orthographic camera maps these logical coordinates one-to-one for this static slice. This is a provisional parity implementation, not the final decision for lifted, turned, zoomed, or playable active-match cards.

#### 12.13.4 Rendering and resource policy

The active surface uses one shared plane geometry, unlit white `MeshBasicMaterial` faces, sRGB texture and output color spaces, mipmaps, linear filtering, bounded anisotropy, and a transparent WebGL canvas over the existing CSS board. It creates no card slab, back plane, light, shadow, raycaster, drop target, semantic input control, or animation scheduler in this phase.

Texture URLs must remain under `/images/cards/` on the same origin. The surface canonicalizes each candidate URL before accepting it and rejects encoded traversal, backslashes, query strings, fragments, or a normalized path outside that directory. One update deduplicates identical visible URLs, loads every required texture under a generation token and bounded six-second deadline, and commits a complete set only after all required textures succeed. A timeout is a required-texture failure. A stale completion after replacement, timeout, or disposal releases its resources and cannot repopulate the scene. A required texture failure or WebGL context loss before Modern owns input disposes the incomplete surface and restores effective Legacy while retaining the user's requested Modern preference and diagnostic reason.

The ready hand frame hides the preparing message and reveals the unchanged board background through the transparent host. Selecting Legacy reveals the exact existing Raphael nodes and current match state; it does not rebuild either paper, issue a request, or alter a card.

#### 12.13.5 Input and lifecycle

The Modern match-hand canvas is display-only. It has no click, pointer, keyboard, focus, drag, drop, selection, hover, raycast, move-intent, or request path. The hidden Legacy papers remain comprehensively pointer-blocked while Modern is effective so a pointer cannot tunnel through the transparent canvas to a retained Legacy target.

The coordinator uses an explicit active-match lifecycle state. It must not infer an active match merely because the lobby is hidden: Shop, Deck, tutorial selection, loading, and other non-lobby application views do not create, populate, diagnose, or fail over an active-match surface. Match construction activates the state; early exit, game over, and return to the lobby clear it. The current lobby surface takes precedence while the lobby is visible.

The surface renders only on construction, scale change, complete hand update, or explicit diagnostic render. At rest it owns no request-animation-frame callback. Repeated Graphics toggles may retain one complete idle Modern surface, but must not duplicate a canvas, geometry set, material set, texture set, listener, or WebGL context.

#### 12.13.6 Acceptance criteria

**AC-P010-001 — Exact two-hand projection**

A deterministic fresh-game fixture produces five player and five opponent meshes. Every screen rectangle exactly matches the coordinates and dimensions in Section 12.13.3, all rotations are zero, and later hand indexes are deterministically above earlier indexes.

**AC-P010-002 — Visible-art fidelity and secrecy**

Every Modern texture URL equals the current Legacy-permitted visible art for that card. A Closed opponent hand requests, describes, and diagnoses only the canonical card back; no concealed face identifier or URL appears in Modern state or resource requests.

**AC-P010-003 — Passive authority**

Clicking, pressing, dragging, or moving a pointer over either Modern hand changes no card state, selection, turn state, timer, request count, or Legacy object. Diagnostics report `interactive: false`, no input handlers, and no active frame loop.

**AC-P010-004 — Readiness and fail-open**

The preparing message remains until one complete required texture set is committed. Success presents both hands atomically. Any required texture failure, six-second load timeout, initialization failure, or context loss produces no partial hand and restores usable Legacy with the requested/effective distinction and failure reason intact. A late texture completion after timeout cannot reclaim the surface.

**AC-P010-005 — Runtime Legacy restoration**

Modern-to-Legacy reveals the same board paper, rule paper, ten initial card nodes, controller arrays, and match identifiers that existed before the toggle. Repeated Modern/Legacy toggles create no duplicate surface and issue no gameplay request.

**AC-P010-006 — Current membership and order**

Initial construction, ordinary player/opponent hand shrink, Sudden Death reconstruction, and review reconstruction refresh the passive description at a settled compatibility seam. The surface accepts zero through five cards per side, never addresses a sixth slot, and preserves current array order. A simultaneous empty pair is the documented pre-match/not-ready sentinel rather than a committed ready frame.

**AC-P010-007 — Scale and resource stability**

Application scales 1, 1.5, 2, and 3 preserve all logical rectangles while the renderer's backing resolution follows the existing bounded pixel-ratio policy. Repeated updates, kind changes, toggles, context replacement, and disposal release stale textures and materials and return idle frame activity to zero.

**AC-P010-008 — Deliberate partial-scene communication**

The Graphics status identifies that Modern match hands are active and display-only and directs the user to Legacy for play. No copy or diagnostic claims that the active board, rules, score, effects, or interaction are implemented.

#### 12.13.7 Required evidence and definition of done

Phase 0.10 requires:

- a static build/runtime contract for the plain-data bridge, explicit active-match lifecycle, exact geometry, five-card bounds, active-surface factory, canonical texture-path guard, bounded texture deadline, orthographic mapping, atomic texture generation guard, passive diagnostics, transparent ready gate, and cache identity;
- browser or controlled-harness evidence for five-plus-five placement, visible textures including a Closed hand, deterministic overlap, no input/request path, readiness, ordinary failure and stalled-load fallback, non-match hidden-lobby isolation, repeated toggle identity, application scales, and zero idle frame activity;
- existing Graphics persistence, lobby hand, lobby flip, lobby playbook, Motion Studio, and Legacy regressions;
- a current generated Modern bundle matching its reviewed source and the pinned Three.js dependency.

Phase 0.10 is complete only when those requirements pass and the implementation remains within the passive two-hand boundary. It does not authorize board rendering, card interaction, reuse of rejected lobby arrival motion, or promotion of Modern as a playable mode.

### 12.14 Phase 0.11: renderer-local active-match pickup/follow study

#### 12.14.1 Intent, supersession, and boundary

Phase 0.11 answers one narrow physical-interaction question before board state, scoring, turn state, legal targets, and move authority are migrated: can one Modern player-hand card feel convincingly lifted from a flat table and carried around the existing game region?

This phase supersedes only three Phase 0.10 implementation clauses on the ready Modern active-match surface:

- the head-on orthographic camera becomes a calibrated head-on perspective camera;
- the player-hand meshes become card-bounded pointer-picking targets;
- the surface may own one bounded pickup/follow scheduler and one renderer-local held-card record.

Every other Phase 0.10 boundary remains in force. The opponent hand remains display-only. The board, nine slots, scores, turn marker, rules, elements, bonuses, effects, requests, and move result remain unrendered or unowned. Raphael remains mounted, live, synchronized, and immediately recoverable. The temporary compatibility description remains presentation-only and the study does not satisfy the renderer-neutral controller extraction required by Phase 1 or the playable vertical slice required later.

#### 12.14.2 Calibrated perspective and canonical flat-table rest

The active-match scene continues to occupy the exact 693 by 500 logical host. It must use one constrained perspective camera facing the table head-on. Camera distance, field of view, and the shared resting plane must be calibrated together so a settled 117 by 146 card at every Phase 0.10 hand anchor projects to the same logical screen rectangle established in Section 12.13.3.

Canonical resting state means:

- every card center resolves from its application-owned top-left hand rectangle rather than a camera-relative fan;
- every card has zero local-X, local-Y, and local-Z rotation;
- all settled cards share one table-depth convention except for the small deterministic overlap depth needed to prevent z-fighting;
- outer-left, center, and outer-right card corner silhouettes remain rectangular, centered, parallel, and equal in scale;
- no slot-dependent neutralizer introduces a visible lean, bow, lateral shear, or curved-surface appearance;
- later hand indexes remain visibly above earlier indexes without changing their resting size or orientation.

The perspective calibration is part of the Phase 0.11 study and must be queryable in diagnostics and reproducible in tests. It is evidence for `OQ-004`, not a final Phase 2 camera decision.

#### 12.14.3 Picking and the renderer-local hold

The surface may listen for primary pointer activation and pointer movement only while it is the current ready Modern active-match surface. Picking must use the rendered card geometry or an exactly coincident card-bounded target. It may consider only current player-hand cards and must resolve overlap to the visibly topmost eligible card. Opponent cards, empty host space, future board areas, the outer board frame, and hidden Raphael objects are never eligible.

An accepted click immediately creates one hold generation containing plain renderer-internal values:

- stable already-permitted player-card identity and current hand index;
- the canonical original hand anchor and settled pose;
- the clicked local card point or equivalent logical grab offset;
- the latest logical pointer and follow target;
- filtered logical pointer velocity;
- lift and tilt phase;
- the current renderer pose and frame-scheduling state.

The renderer may associate that record with its private mesh, but no mesh or event object may cross the surface boundary. No second hold can exist. While a hold exists, every later activation is ignored and never queued, regardless of whether it lands on the held card, another player card, an opponent card, a future slot, or empty space.

#### 12.14.4 Pickup, follow, and resistant-motion treatment

The accepted card must be promoted above both hands immediately through deterministic depth and render order. Its nominal lift uses the Legacy pickup's 300-millisecond interval. The card moves toward the camera until its front-facing, zero-tilt projected silhouette is exactly `1.075` times its settled width and height. If perspective depth alone produces that result, no additional `1.075` object scale may be compounded; if an authored scale participates, the combined projection must still equal the single `1.075` target.

The local point accepted by the click defines the follow target during lift and movement. The rendered card may approach that target through the bounded response in `FR-MATCH-PICKUP-008`; it must not replace it with a card-center target. The mapping is:

```text
client pointer
  → current Modern-host bounding rectangle
  → 693 × 500 logical screen point
  → calibrated held-card plane
  → held-card center preserving the accepted local point
```

Application scale and device-pixel ratio may change backing resolution but never this logical mapping. After the first click, pointer motion carries the card without a pressed mouse button. Movement is confined to presentation; it does not need a controller drag token.

The physical resistance treatment uses only local-X and local-Y card tilt derived from filtered logical pointer velocity. The tilt must visually trail motion: the card leans against horizontal and vertical travel rather than leading or turning toward it. Each tilt axis is clamped within 10 degrees of flat, reaches a visibly readable response during ordinary brisk movement, remains front-facing, and is insensitive to absolute screen position. Its full-response velocity scale is 450 logical pixels per second; a sampled velocity remains current for 80 milliseconds; velocity and tilt use response coefficients of 18; and stale velocity decays monotonically with a coefficient of 12. No randomness is sampled during pointer events or frames. When travel slows or stops, the tilt approaches zero through a non-oscillating damped response. Once position and tilt converge, the card remains lifted and stable without a pending animation frame.

No pointer movement may rotate, scale, or move an idle card or the camera. The study may omit a physical shadow, slab, or back; if any optional lift cue is added, it must be renderer-local, artifact-free, resource-bounded, invisible at canonical rest, and subject to the same cancellation and reduced-motion rules.

#### 12.14.5 Explicit absence of placement and game authority

Phase 0.11 stops with one held card. It has no command for setting the card down. Specifically:

- a second click does not drop, cancel, replace, or return the hold;
- there are no board-slot meshes or DOM targets owned by Modern;
- no legal or illegal target is calculated, highlighted, or announced;
- no `gh.game.dragging`, `isDroppable`, grab point, card origin, turn, review, dialog, or board state is changed;
- no semantic selection, drag, move, drop, cancellation, or placement action is emitted;
- no Legacy card is moved or brought to front behind the gate;
- no invalid-return or valid-placement animation begins;
- no request payload, request token, callback continuation, or server call is created.

The visible held pose is disposable renderer state. It is never evidence that the card left the player's hand and cannot be consulted by rules, tests of game outcome, replay, review, Sudden Death, or fallback.

#### 12.14.6 Lifecycle, failure, and reduced motion

Every hold and frame belongs to the current surface and hand generation. The generation is invalidated by:

- explicit Legacy selection or automatic Legacy fallback;
- active-match deactivation, early exit, game over, or lobby presentation;
- any replacement of the current hand description, including a reflow that still contains the same card;
- selected-card removal;
- surface-kind replacement, suspension, disposal, or reconstruction;
- page visibility loss;
- initialization, required-texture, renderer, or WebGL context failure.

Cancellation clears input handlers or their active ownership, releases the held record, cancels the sole pending frame, and restores the Modern mesh to its canonical anchor before reuse or discards it during disposal. It is an atomic reset, not the deferred invalid-drop return animation. The coordinator reveals the unchanged Legacy match once when fallback is required. Late events and animation callbacks from the invalidated generation are inert.

Under `prefers-reduced-motion: reduce`, pickup immediately commits the stable `1.075` held projection without a lift transition. Pointer-follow remains usable because it is the subject of the study, but velocity-driven local-X/local-Y tilt is suppressed. Each accepted pointer update may render once; stationary observation owns no frame.

#### 12.14.7 Diagnostics, delivery identity, and communication

The active-match debug snapshot must remain plain cloned data and must identify:

- surface and Three.js identity;
- `interaction: "pickup-only"`;
- calibrated perspective camera and flat-table policy;
- player/opponent card rectangles and deterministic order;
- whether input handlers are attached and eligible;
- whether one renderer-local hold exists;
- held player-card identity, hand index, phase, original anchor, logical grab offset, pointer and follow target;
- filtered velocity, lift, projected scale, local-X/local-Y/local-Z rotation, and promoted render order;
- accepted, ignored, opponent, and empty activation counts;
- scheduler state and pending frame count;
- reduced-motion state;
- zero semantic action, game mutation, and request counts.

Diagnostics must not expose a Three.js object, pointer event, Raphael handle, hidden opponent value, or value not already permitted by Phase 0.10 secrecy requirements.

The served Modern script remains the pinned Three.js `0.185.1` (`r185`) bundle and must use the cache identity:

```text
0.185.1-match-pickup.2
```

The source registration, generated artifact, coordinator URL, DOM dataset, runtime diagnostic, and static contract must agree. Phase 0.10's `0.185.1-match-hands.1` remains its historical delivery identity and must not be described as the current Phase 0.11 artifact.

The Graphics status must identify pickup/follow as a motion study and state that placement remains unavailable. It must continue to offer immediate Legacy use for the actual game and must not call Modern playable.

#### 12.14.8 Acceptance criteria

**AC-P011-001 — Exact calibrated flat-table rest**

A deterministic five-plus-five fixture produces the same player and opponent screen rectangles and overlap order as `AC-P010-001` under the perspective camera. Corner-projection evidence for outer-left, center, and outer-right cards shows equal settled size, parallel edges, zero local rotation, and no position-dependent fan, shear, or curved-surface appearance.

**AC-P011-002 — Eligible topmost pickup**

A primary click on each exposed player-card region picks the expected visually topmost card exactly once. Clicks on overlapped hidden portions resolve to the visible upper card. Opponent-card and empty-space clicks create no hold. Diagnostics distinguish accepted, opponent, empty, and ignored activations without exposing opponent secrets.

**AC-P011-003 — Legacy-equivalent lift**

Under a controlled clock, accepted pickup promotes only that card, preserves its selected local point under the pointer, and reaches a front-facing zero-tilt projected width and height of `1.075 ± 0.002` times rest at the nominal 300-millisecond lift endpoint. No second scale factor is compounded and all unheld card poses remain bit-for-bit or tolerance-equivalent to their canonical rest.

**AC-P011-004 — Scale-correct pointer follow**

At application scales 1, 1.5, 2, and 3, deterministic pointer traces to the center, edges, and corners of the 693 by 500 host produce the same logical held-card target and preserve the accepted local point within one logical pixel after convergence. Follow requires no pressed mouse button, and pointer departure creates neither a drop nor continuing velocity.

**AC-P011-005 — Bounded resistant tilt and settlement**

Controlled right, left, up, down, and diagonal pointer traces produce finite trailing local-X/local-Y tilt with the expected directional sign. The canonical brisk diagonal trace reaches at least 4 degrees on both axes so the resistance is visually readable, no axis exceeds 10 degrees, no card back is exposed, and no local-Z or camera motion occurs. Stopping the trace causes non-oscillating convergence to zero tilt. The scheduler returns to zero pending frames while the card remains stably lifted.

**AC-P011-006 — Single hold and absent drop**

After one accepted pickup, clicks on every other player card, opponent card, held card, empty board region, and representative future slot coordinates neither replace nor clear the hold and never queue work. There are no Modern slot pick objects, target highlights, placement results, or return animations.

**AC-P011-007 — Zero gameplay and network authority**

Before, during, and after pickup/follow, player and opponent hand arrays, Legacy Raphael object identity and attributes, `dragging`, `isDroppable`, turn state, score, board state, dialog/review state, game identifiers, request count, and request payloads remain unchanged. No semantic match action is emitted.

**AC-P011-008 — Atomic lifecycle reset and Legacy restoration**

Each lifecycle cause in Section 12.14.6, exercised during lift and during follow, clears the held generation and pending frame exactly once. Legacy selection reveals the same live Raphael nodes and match state without a snap, duplicate input owner, delayed callback, renderer reconstruction, or request. Late events from the cancelled generation cannot move a replacement card.

**AC-P011-009 — Reduced-motion behavior**

With reduced motion active, pickup immediately establishes the stable `1.075` held projection, pointer updates preserve the grab point without velocity tilt or smoothing, and stationary observation owns no frame. Game and network isolation remains identical to normal motion.

**AC-P011-010 — Diagnostics, failure, and cache identity**

Diagnostics expose every plain field required by Section 12.14.7, report no renderer object or concealed opponent data, and show zero semantic action/request counts. Forced initialization, required-texture, and context failure restore Legacy under the Phase 0.10 fail-open policy. The Phase 0.11 active-match Modern loader identity is `0.185.1-match-pickup.2`, and the generated Phase 0.11 bundle matches its reviewed source. Phase 0.12 later supersedes that current-delivery identity without altering the Phase 0.11 historical record.

#### 12.14.9 Required evidence and definition of done

Phase 0.11 requires:

- a static source and generated-bundle contract covering the perspective camera, canonical anchors, card-bounded player picking, one-hold lock, projected-scale target, pointer mapping, velocity tilt bounds, no-drop/no-request boundary, lifecycle generation guard, reduced-motion policy, diagnostics, and cache identity;
- controlled-clock unit evidence for lift interpolation, logical pointer mapping, filtered-velocity direction, visible 4-degree diagonal response, 10-degree clamps, damped zero-tilt convergence, and zero idle frame activity;
- browser or controlled-harness evidence at every application scale for exact settled geometry, topmost player-only picking, grab-offset preservation, mouse-button-free follow, one-hold behavior, opponent/empty rejection, absent slots/drop/return, and unchanged Legacy/controller/request state;
- lifecycle evidence during both lift and follow for mode switch, hand revision, selected-card removal, view transition, visibility loss, context loss, replacement, and disposal;
- normal and reduced-motion visual captures at actual application size, including outer and center cards, horizontal, vertical, and diagonal travel;
- current Graphics persistence, Phase 0.10 secrecy/fallback, lobby, Motion Studio, and applicable Legacy regression results;
- a generated Modern artifact matching reviewed source and pinned Three.js `0.185.1` with cache identity `0.185.1-match-pickup.2`.

Phase 0.11 is complete only when all `AC-P011-*` criteria and required evidence pass and a normal-speed review accepts that the selected card reads as lifted from a flat surface and resisting pointer travel. Completion does not authorize click-to-drop, drop zones, invalid return, placement, controller selection, game-state authority, network requests, board rendering, scores, turns, rules, or promotion of Modern as playable.

### 12.15 Phase 0.12: renderer-local second-click invalid return

#### 12.15.1 Intent, historical boundary, and supersession

Phase 0.12 answers the next narrow presentation question: when there are no Modern drop zones, can a second click put the carried card back into the hand with the recognizable Legacy invalid-return character while preserving the renderer-local, zero-authority boundary?

Phase 0.11 remains the historical pickup/follow baseline. Its explicit absence of second-click drop and return in `DEC-052`, `FR-MATCH-PICKUP-011`, `FR-MATCH-PICKUP-012`, `AC-P011-006`, and Section 12.14 was correct for that completed phase. Phase 0.12 supersedes only that behavior on the ready current Modern active-match surface. Its current diagnostic label and cache identity replace the Phase 0.11 values without rewriting the historical evidence. It does not retroactively redefine Phase 0.11, authorize a valid drop, or advance the playable renderer boundary.

All retained Phase 0.11 behavior remains in force:

- only the visually topmost eligible player-hand card can establish a hold;
- one hold exists at most;
- pickup reaches one `1.075` projected scale and preserves the accepted grab point;
- pointer follow and bounded velocity tilt remain renderer-local;
- opponent cards and empty space cannot establish a first-click hold;
- both hands retain their exact canonical resting geometry;
- the board, slots, scores, turns, rules, effects, and gameplay authority remain absent;
- Legacy objects remain mounted, live, synchronized, and recoverable.

#### 12.15.2 Arming and second-click interpretation

An accepted pickup begins unarmed. Its originating click and any rapid follow-up click during the 300-millisecond lift cannot also trigger a return. When normal lift reaches full held depth, the same hold becomes armed even if pointer-follow or resistance damping is still converging. Reduced-motion pickup commits that lifted endpoint and arms synchronously.

Once armed, the next primary click anywhere in the active-match host is consumed by the renderer-local study as an invalid drop. Phase 0.12 defines exactly zero Modern drop zones, so the renderer does not raycast or otherwise inspect the click location for a held-card hit, hand hit, slot hit, board hit, or legal result. This rule intentionally makes held-card, other-card, opponent-card, empty-space, and future-slot coordinates within the host equivalent. The surrounding CSS board frame remains outside the host and outside this input contract.

The accepted second click:

- changes the current hold phase to `returning`;
- disarms the hold;
- freezes follow velocity and target velocity;
- records the card's currently presented pose and its existing canonical hand destination;
- restores settled hand render ordering for the returning layer;
- releases the grabbing cursor;
- starts at most one demand-driven frame request;
- increments one accepted-invalid-return count;
- emits no semantic action, target result, game mutation, or request.

Additional clicks while returning increment only an ignored-returning diagnostic and are never queued. Pointer movement is inert until settlement. Exact completion releases the hold; a later click may establish a new pickup normally.

#### 12.15.3 Legacy-equivalent return motion and exact settlement

The production Legacy invalid return animates the card to its saved hand coordinates and scale `1` over 300 milliseconds using Raphael easing `">"`, while making one positive 360-degree SVG turn. The loaded Raphael 1.5.2 implementation defines that easing as cubic-out. SVG's y-down positive rotation is clockwise on screen; the equivalent Three.js y-up screen-space turn is negative local Z.

Phase 0.12 therefore fixes the normal-motion contract as:

```text
durationMs = 300
rawProgress = clamp((now - acceptedSecondClickTime) / durationMs, 0, 1)
easedProgress = 1 - (1 - rawProgress)^3
screenRotationZ = startRotationZ - 2π × easedProgress
```

The same eased progress interpolates:

- the visible card center from its current logical screen center to the original hand rectangle center;
- projected scale from the current perspective scale to exactly `1`;
- local-X and local-Y resistance tilt to exactly `0`;
- unwrapped local-Z rotation through exactly one clockwise turn.

Perspective depth must be resolved from the eased projected scale so scale returns monotonically without compounding another object-scale factor. At `150` milliseconds, raw progress is `0.5` and eased progress is exactly `0.875`; position, projected scale, tilt, and unwrapped roll must agree with that value under a controlled clock.

The first return sample at elapsed time zero must reproduce the recorded presented pose without a jump. The terminal sample must call the canonical reset rather than leave an approximately settled transform. Final state is exactly:

- original hand rectangle and center;
- depth `0`;
- projected scale `1`;
- local-X, local-Y, and normalized local-Z rotation `0`;
- original deterministic hand render order;
- no visible analytic shadow and zero shadow opacity;
- no held or returning record;
- no pending frame;
- pickable player-card eligibility restored.

The Legacy implementation's random residual angle is deliberately not copied. It conflicts with the established exact flat-table rest and would make settlement nondeterministic.

#### 12.15.4 Explicit absence of drop zones and authority

The name “invalid return” describes visible legacy parity, not a newly implemented gameplay decision. Phase 0.12 does not:

- build or inspect any Modern drop zone;
- determine whether a position is legal or illegal;
- inspect `isMyTurn`, a slot record, a rule, or the board;
- dispatch select, drag, drop, cancel, return, place, or move intent;
- call `gh.game.grab`, `gh.game.drop`, or `drawPlayerOneHand`;
- set `dragging`, `isDroppable`, a Legacy grab point, or card-node pointer attributes;
- reorder either hand array or move a retained Raphael card;
- alter turn, score, board, game ID, review, replay, dialog, timer, or callback state;
- construct a request token or payload;
- issue HTTP, navigation, analytics, or any other application request.

The compatibility bridge continues to carry only permitted hand presentation data. Return state remains private disposable surface state and cannot be consulted by rules, replay, Sudden Death, game-over handling, or server-response sequencing.

#### 12.15.5 Scheduler, lifecycle generation guard, and reduced motion

Pickup, follow, damping, and return share one active-match scheduler with at most one pending callback. Each hold has a monotonically increasing generation. A scheduled callback captures both its frame identity and hold generation and may advance state only if both still match. This protects a replacement hold from a cancelled callback that the browser, a test harness, or re-entrant application code invokes late.

Every Phase 0.11 lifecycle invalidation also invalidates an unarmed, armed, or returning Phase 0.12 hold:

- explicit Legacy selection or automatic Legacy fallback;
- active-match deactivation, early exit, game over, or lobby presentation;
- any replacement of the current hand description, including reflow of the same card;
- selected-card removal;
- surface-kind replacement, suspension, disposal, or reconstruction;
- page visibility loss;
- initialization, required-texture, renderer, or WebGL context failure.

Cancellation stops the pending frame, increments the generation, releases the hold and input lock, and resets a reusable card directly to canonical rest or discards it during disposal. It records the interrupted return as cancelled when applicable. It does not finish or replay the visible invalid-return timeline. A late pointer event or callback is inert even if a newer hold has since been created.

Under `prefers-reduced-motion: reduce`, the first click retains the Phase 0.11 direct held pose and direct pointer follow. An armed second click skips continuous return translation and roll, commits canonical rest synchronously, records one reduced-motion completion, releases the hold and input lock, and leaves zero pending frames. Authority isolation is identical to normal motion.

#### 12.15.6 Diagnostics, delivery identity, and communication

The active-match plain diagnostic snapshot must expose:

- `interaction: "pickup-invalid-return"`;
- second-click policy `second-click-always-invalid`;
- `dropZoneCount: 0`;
- valid placement as not implemented;
- the 300-millisecond `cubic-out`, clockwise `-2π` invalid-return policy and exact-settlement flag;
- monotonic hold generation;
- held-card arming and return phase;
- return start, canonical destination, current pose, raw progress, eased progress, projected scale, and rotations;
- accepted pickup, ignored-held, accepted invalid-return, completed invalid-return, ignored-unarmed, and ignored-returning counts;
- last-return running, completed, reduced-motion, or cancelled outcome and normalized final pose where applicable;
- scheduler and pending-frame state;
- reduced-motion state;
- zero semantic-action and request counts.

It must not expose a Three.js object, DOM event, Raphael handle, concealed opponent value, controller callback, request primitive, or other authority-bearing reference.

The served script remains pinned to Three.js `0.185.1` (`r185`). The current Phase 0.12 cache identity is:

```text
0.185.1-match-return.1
```

Source registration, generated artifact, coordinator URL, DOM dataset, runtime diagnostic, static contract, browser contract, and deployment artifact must agree. Phase 0.11's `0.185.1-match-pickup.2` remains its historical identity.

User-facing status may explain “click again to return it to the hand,” but must also say that board placement is not enabled and must not call Modern playable.

#### 12.15.7 Acceptance criteria

**AC-P012-001 — Armed second-click boundary**

Under a controlled clock, pickup begins with `dropArmed: false`. A second click during lift increments the ignored-unarmed count, changes neither hold nor scheduler ownership, and is never replayed. At the exact 300-millisecond elapsed lift endpoint the hold becomes armed. If that click arrives before the pending endpoint callback, it synchronously advances to full lift and begins the return without an extra queued pickup frame or a third click. One later primary click begins exactly one return.

**AC-P012-002 — Always-invalid location independence**

Separate deterministic cycles second-click the held card, another player card, an opponent card, empty play-surface space, and representative future-slot coordinates within the active-match host. Every armed second click begins the same invalid return without creating a drop-zone object, target ID, highlight, placement state, semantic action, or request.

**AC-P012-003 — Legacy cubic-out clockwise return**

A controlled frame at return elapsed time zero shows no pose jump. At 150 milliseconds, diagnostics report raw progress `0.5` and eased progress `0.875`; logical center, projected scale, local-X/local-Y tilt, and local-Z rotation match the cubic-out sample. Local-Z motion is clockwise on screen and reaches one unwrapped `-2π` turn relative to its starting roll without requiring a back texture.

**AC-P012-004 — Exact canonical settlement**

At 300 milliseconds, the returned card's center, depth, projected scale, local-X/local-Y/local-Z rotation, render order, shadow visibility/opacity, held flag, phase, and pickup eligibility equal its captured pre-pickup canonical state exactly. The other nine card poses are unchanged. The hold and input lock are gone, no frame remains, and a later first click is immediately accepted.

**AC-P012-005 — Return input lock**

During return, pointer movement and repeated clicks cannot change the recorded path or current pose except through controlled time advancement, cannot restart or replace the return, cannot establish another hold, cannot increment accepted-return count, and cannot create more than one pending frame. Ignored-returning diagnostics advance without queued work.

**AC-P012-006 — Scale-correct return**

At application scales `1`, `1.5`, `2`, and `3`, the same logical held pose and second click return to the identical logical canonical hand anchor, scale, and rotation. CSS scale, device-pixel ratio, drawing-buffer ratio, and pointer location do not alter duration, easing, turn count, endpoint, or lock release.

**AC-P012-007 — Zero gameplay, Legacy, and network mutation**

Before, during, and after return, player and opponent hand arrays and object identity, retained Raphael node identity and attributes, `dragging`, `isDroppable`, turn state, scores, board state, game ID, dialog/review/replay state, callbacks, request count, and request payloads remain unchanged. Diagnostics report zero semantic actions and requests, and no Legacy grab/drop method is called.

**AC-P012-008 — Reduced-motion exact completion**

With reduced motion active, pickup arms from its synchronous held pose and the next primary click immediately restores the exact canonical hand pose without continuous translation, tilt, or local-Z turn. Accepted and completed return counts advance once, completion is identified as reduced motion, the lock is released, no frame is pending, and a later pickup succeeds.

**AC-P012-009 — Atomic lifecycle cancellation and stale-frame rejection**

Each lifecycle cause in Section 12.15.5, exercised while unarmed, armed, and returning, releases the hold and sole pending frame exactly once and resets or disposes the card without playing the visible return. A captured cancelled callback manually invoked after replacement or a newer pickup changes no pose, count, generation, scheduler state, Legacy object, or request state.

**AC-P012-010 — Diagnostics, bundle, and current cache identity**

Diagnostics expose every permitted plain field in Section 12.15.6 and no renderer or concealed value. Static and generated-bundle contracts prove the duration, easing, clockwise `-2π` turn, zero drop zones, exact reset, arming guards, returning lock, generation check, reduced-motion path, and authority isolation. The source, generated artifact, loader, runtime registration, diagnostics, tests, and deployment use `0.185.1-match-return.1`; `0.185.1-match-pickup.2` appears only as historical Phase 0.11 evidence.

#### 12.15.8 Required evidence and definition of done

Phase 0.12 requires:

- a static source and generated-bundle contract covering the supersession boundary, zero drop zones, arming, input lock, 300-millisecond cubic-out turn, exact settlement, one scheduler, generation guard, reduced motion, diagnostics, zero authority, and cache identity;
- controlled-clock browser evidence at elapsed `0`, `150`, and `300` milliseconds, including the exact `0.875` midpoint sample, clockwise turn sign, scale interpolation, normalized endpoint, and zero-frame completion;
- browser evidence for unarmed clicks, clicks during return, immediate repick after completion, pointer lock, every supported application scale, unchanged Legacy/controller state, and zero requests;
- lifecycle evidence during unarmed pickup and active return for mode switch, hand revision, selected-card removal, view transition, visibility loss, context loss, replacement, and disposal, including manual stale-callback rejection;
- normal and reduced-motion actual-size captures showing return from at least one near-hand and one far-board carried pose;
- current Graphics persistence, Phase 0.10 secrecy/fallback, Phase 0.11 pickup/follow, lobby, Motion Studio, and applicable Legacy regression results;
- a generated Modern artifact matching reviewed source and pinned Three.js `0.185.1` with cache identity `0.185.1-match-return.1`.

Phase 0.12 is complete only when all `AC-P012-*` criteria and required evidence pass and a normal-speed review accepts that the card reads as making the familiar invalid return while settling cleanly into the hand. Completion does not authorize drop zones, valid placement, controller selection, renderer-neutral input, game-state authority, network requests, board rendering, scores, turns, rules, effects, or promotion of Modern as playable.

### 12.16 Phase 0.13: renderer-local valid-zone hover and placement preview

#### 12.16.1 Intent, historical boundary, and supersession

Phase 0.13 asks whether the Modern motion study can reproduce the Legacy board-space cue and the physical character of a human card placement without pretending that a move occurred.

Phase 0.12 remains the historical always-invalid-return baseline. Its zero-zone, location-independent second click was correct for that completed phase. Phase 0.13 supersedes that boundary only on the ready current Modern surface: an armed second click over a currently valid described zone previews placement, while every other armed second click continues to use Phase 0.12's unchanged invalid return. The new branch is still renderer-local. It neither satisfies the Phase 3 semantic input contract nor makes Modern playable.

All retained behavior remains in force:

- the first click can pick up only the visually topmost eligible player-hand card;
- pickup reaches projected scale `1.075`, preserves the accepted grab point, and arms only at its 300-millisecond endpoint;
- pointer follow and bounded resistance tilt remain renderer-local;
- Phase 0.12 invalid return remains the fallback outside a valid zone;
- the retained live Legacy match remains the immediate fallback and source of current presentation validity;
- scores, turn indicators, rules, elements, effects, semantic input, and move submission remain unimplemented in Modern.

#### 12.16.2 Exact Legacy board geometry and fail-closed validity

The live Legacy board uses nine 117 by 146 card rectangles in a three-by-three grid:

| Slot | Top-left x | Top-left y | Center x | Center y |
|---:|---:|---:|---:|---:|
| 0 | 172 | 35 | 230.5 | 108 |
| 1 | 289 | 35 | 347.5 | 108 |
| 2 | 406 | 35 | 464.5 | 108 |
| 3 | 172 | 181 | 230.5 | 254 |
| 4 | 289 | 181 | 347.5 | 254 |
| 5 | 406 | 181 | 464.5 | 254 |
| 6 | 172 | 327 | 230.5 | 400 |
| 7 | 289 | 327 | 347.5 | 400 |
| 8 | 406 | 327 | 464.5 | 400 |

Every rectangle has corner radius `10`. Slot order is left-to-right, then top-to-bottom. These are logical coordinates inside the existing 693 by 500 active-match host; CSS application scale and drawing-buffer resolution do not alter them.

The temporary game bridge emits a plain clone and fails closed unless all nine descriptions can be formed. A slot is available only when its live board record is empty. It is currently valid for this preview only when all of the following are true:

```text
available
&& boardInputEnabled
&& isMyTurn
&& !gameOver
&& !underReview
```

This validity bit mirrors the current Legacy presentation/input gate; it is not a new rules engine. The Modern surface may narrow false or absent data to no target but may not broaden it. Card values, adjacency, Same, Plus, Combo, Elemental, score, or AI state are irrelevant to this preview and must not be consulted.

#### 12.16.3 Hover-only shadow feedback

Pointer coordinates are mapped through the real host bounds into logical board coordinates. Hit testing uses half-open bounds so a shared edge cannot select two slots:

```text
zone.x <= pointer.x < zone.x + zone.width
zone.y <= pointer.y < zone.y + zone.height
```

While a card is carried, the one currently hit, available, valid zone is drawn as the same cue used by Legacy:

```text
fill = black
opacity = 0.3
stroke = none
width = 117
height = 146
cornerRadius = 10
```

No grid is persistently displayed. Every non-hovered rectangle has opacity `0`; occupied or invalid rectangles never appear. Pointer leave, invalidity, return, placement, completion, snapshot reset, and lifecycle reset hide the cue immediately. Hover may become visible during the lift because Legacy reveals its cue as soon as dragging exists, but the visible cue does not bypass the 300-millisecond arming rule.

#### 12.16.4 Valid placement motion and human variance

An armed click inside the currently valid rectangle captures the card's presented pose, hides the cue, freezes pointer-follow motion, and enters the exclusive `placing` phase. It samples one residual Legacy screen-space angle and never samples again:

```text
screenRollDegrees = randomUniform(-2, 2)
threeLocalZRadians = -screenRollDegrees * π / 180
```

The card then reverses the pickup presentation over 300 milliseconds:

```text
rawProgress = clamp((now - acceptedValidClickTime) / 300, 0, 1)
easedProgress = 1 - (1 - rawProgress)^3
```

The same eased progress drives:

- current visible logical center to the exact slot center;
- current projected scale to exactly `1`;
- current perspective depth to table depth `0`;
- current local-X and local-Y resistance tilt to exactly `0`;
- current local-Z roll to the once-sampled endpoint.

Unlike the invalid return, valid placement performs no full turn. Unlike a physics scatter, it has no positional randomness, bounce, overshoot, end wobble, per-frame noise, or camera motion. The intentional imperfection is solely the small final roll. The first sample reproduces the captured visible pose so changing from follow to placement cannot jump.

Completion leaves the card front-facing, visible, and inert at the exact slot center. It receives deterministic placed render order above the zone-shadow plane, has no visible analytic lift shadow, and retains the sampled roll. Because neither hand nor board is authoritative in this renderer-local study, the projection does not remove the live hand card or occupy the live board record.

#### 12.16.5 One-preview guard, lifecycle, and reduced motion

Only one placement preview may complete for one unchanged pair of hand and drop-zone descriptions. Afterward the placed projection remains visible but is not pickable, no hover is shown, and additional pickup or placement attempts are ignored. This bounded rule approximates one card per turn visually while refusing to claim turn progression. A later plain-data revision or lifecycle reset reconstructs canonical projection from live presentation data.

The existing monotonic hold generation and sole demand-driven scheduler also own placement. Pointer movement and clicks during `placing` are inert. A frame verifies both frame identity and generation before it can mutate state.

Each of the following clears hover and placement state atomically:

- explicit Legacy selection or automatic fallback;
- active-match deactivation, early exit, game over, or lobby presentation;
- any hand or drop-zone presentation revision;
- selected-card removal;
- visibility loss;
- surface suspension, replacement, reconstruction, or disposal;
- initialization, required-texture, renderer, or WebGL context failure.

A reusable card returns directly to its canonical hand projection; a disposed card is discarded. Reset never calls the Legacy drop path, does not animate a move backward out of the preview, and makes late callbacks inert.

With reduced motion, the accepted valid click samples the same bounded roll once and commits the exact center, table depth, projected scale, zero tilt, placed ordering, and inert one-preview state synchronously. It creates no continuous animation and leaves no pending frame.

#### 12.16.6 Authority boundary and diagnostics

The plain drop-zone description is presentation data only. Phase 0.13 must not:

- call or mirror `gh.game.grab`, `gh.game.drop`, or the Legacy placement callback;
- set `dragging`, `isDroppable`, `isMyTurn`, or board-input enablement;
- remove or reorder a live hand entry;
- write board occupancy or a card's authoritative slot;
- advance a turn, score, rule, timer, replay, review, dialog, or game-over state;
- dispatch a select, drag, place, drop, cancel, or move semantic action;
- construct a move token or payload;
- issue HTTP, navigation, analytics, or another application request.

Diagnostics expose only cloned presentation and study data: nine rectangles and their availability/validity, hovered slot, phase, current and target poses, sampled roll, raw/eased progress, one-preview guard, counters, last outcome, generation, scheduler state, reduced-motion state, and zero authority counts. Renderer objects, Legacy handles, DOM events, concealed opponent values, callbacks, and request primitives are forbidden.

The current status copy must communicate both facts: a valid board-space click can preview visual placement, and no move is submitted.

The served script remains pinned to Three.js `0.185.1` (`r185`). The current Phase 0.13 cache identity is:

```text
0.185.1-match-placement.1
```

Phase 0.12's `0.185.1-match-return.1` remains historical evidence.

#### 12.16.7 Acceptance criteria

**AC-P013-001 — Exact nine-zone geometry**

Diagnostics and rendered hit targets contain exactly nine normalized rectangles with the coordinates, dimensions, centers, radius, and slot order in Section 12.16.2. Controlled probes just inside and just outside every edge prove half-open hit testing. The same logical probes win the same slot at application scales `1`, `1.5`, `2`, and `3`.

**AC-P013-002 — Fail-closed current validity**

For each slot, the empty, board-enabled, player-turn, non-game-over, non-review fixture reports valid. Changing any one gate to false hides and rejects the zone. Occupied, missing, partial, malformed, or stale descriptions never render a valid shadow. The Modern surface does not inspect card values or compute rule legality.

**AC-P013-003 — Hover-only Legacy shadow**

With one card carried, moving into each valid rectangle reveals exactly one black, stroke-free, radius-10 shadow at opacity `0.3` and exact 117 by 146 alignment. Moving between rectangles transfers the single cue without overlap; moving outside or leaving the host hides it. Invalid and occupied rectangles remain invisible. No grid or shadow is visible before pickup, during return/placement, or after preview completion.

**AC-P013-004 — Arming boundary and invalid fallback**

A valid-zone shadow may be visible during lift, but a click before 300 milliseconds is ignored and never queued. At the exact armed boundary, a click inside the valid rectangle begins placement. An armed click one logical pixel outside, over an invalid/occupied rectangle, or after validity turns false begins the unchanged Phase 0.12 invalid return.

**AC-P013-005 — Reverse-pickup cubic-out placement**

With controlled time and randomness, elapsed placement samples at `0`, `150`, and `300` milliseconds report raw progress `0`, `0.5`, and `1` and eased progress `0`, `0.875`, and `1`. Center, projected scale, depth, tilt, and roll agree with the same eased sample. The first frame has no jump; the final frame is at exact table settlement. No full turn, back face, bounce, overshoot, positional jitter, or camera movement occurs.

**AC-P013-006 — Exact center and bounded askew endpoint**

For controlled random samples at the minimum, midpoint, and maximum, the placed card center equals the selected rectangle center exactly, projected scale is `1`, depth is `0`, local-X/local-Y are `0`, and screen-space roll is respectively `-2°`, `0°`, and `2°` within numeric tolerance. Three.js local-Z uses the corresponding inverse sign. Repeating frames cannot change the sampled endpoint.

**AC-P013-007 — Exclusive placement lock and one-preview guard**

During placement, pointer movement and repeated clicks cannot retarget, replace, cancel, restart, or queue work and no second frame is pending. Completion removes the hold, leaves the placed card visible and inert, hides all zones, and rejects every further card pickup or placement for the unchanged snapshot. A revision resets canonical hand projection and permits one new preview.

**AC-P013-008 — Renderer-local zero-authority behavior**

Before, during, and after hover and placement, live hand/board arrays and object identities, Raphael nodes and attributes, `dragging`, `isDroppable`, `isMyTurn`, board enablement, scores, rules, review/replay/dialog state, callbacks, semantic-action counts, request counts, and payloads remain unchanged. No Legacy grab/drop method is invoked.

**AC-P013-009 — Reduced-motion exact completion**

With reduced motion active, an armed click over a valid zone samples the roll once and synchronously commits the same exact center, scale, depth, tilt, roll, render order, inert card, and one-preview guard. Accepted and completed counts advance once and no animation frame is created.

**AC-P013-010 — Lifecycle reset and stale-frame rejection**

Every lifecycle cause in Section 12.16.5, exercised while hovered, placing, and placed, hides the cue, invalidates the generation, releases the sole frame, and resets or disposes the projection once without a Legacy or network effect. A captured cancelled callback invoked after replacement or a newer hold changes no pose, count, zone, scheduler state, Legacy object, or request state.

**AC-P013-011 — Diagnostics, bundle, and communication**

Diagnostics contain every permitted plain field in Section 12.16.6 and no renderer or concealed value. Status copy says placement is visual-only and not submitted. Static and generated-bundle contracts prove exact geometry, hover opacity, fail-closed validity, 300-millisecond cubic-out placement, exact center, bounded sampled roll, one-preview lock, reduced motion, lifecycle guards, and zero authority. Source, generated artifact, loader, runtime registration, diagnostics, tests, and deployment agree on `0.185.1-match-placement.1`.

#### 12.16.8 Required evidence and definition of done

Phase 0.13 requires:

- static source and generated-bundle contracts for the exact nine-zone geometry, validity gates, hover-only shadow, placement/fallback branch, duration/easing, sampled roll, one-preview guard, lifecycle reset, zero authority, and cache identity;
- controlled-clock and controlled-random evidence at elapsed `0`, `150`, and `300` milliseconds and at roll samples `-2°`, `0°`, and `2°`;
- browser evidence for all nine zone bounds, occupied/invalid rejection, hover transfer and leave, early-click rejection, valid placement, invalid fallback, placement input lock, one-preview behavior, and every supported application scale;
- unchanged Legacy/controller/hand/board/turn/request snapshots before and after hover, placement, invalid fallback, and reset;
- reduced-motion and lifecycle/stale-generation evidence;
- actual-size normal-speed captures showing pickup, visible valid shadow, reverse-pickup settlement, and the bounded imperfect alignment;
- current Graphics persistence, Phase 0.10 secrecy/fallback, Phase 0.11 pickup/follow, Phase 0.12 invalid return, lobby, Motion Studio, and applicable Legacy regressions;
- a generated Modern artifact matching reviewed source and pinned Three.js `0.185.1` with cache identity `0.185.1-match-placement.1`.

Phase 0.13 is complete only when all `AC-P013-*` criteria and required evidence pass and a normal-speed review accepts both the Legacy-equivalent target cue and the physical placement character. Completion does not authorize semantic target discovery, move submission, board-state ownership, turn progression, capture rules, scores, rule banners, effects, keyboard play, or promotion of Modern as playable.

### 12.17 Phase 0.14: renderer-local active-match turn-indicator coin

#### 12.17.1 Intent, historical boundary, and supersession

Phase 0.14 asks whether Modern can project one familiar piece of live match information—the current turn marker—and use Three.js to give its side-to-side transition convincing circular thickness, lift, and three-axis motion without taking ownership of turn sequencing.

Phase 0.13 remains the complete historical card-interaction baseline. Its statement that scores, turn indicators, rules, elements, and effects were unrendered was correct for that completed phase. Phase 0.14 supersedes only the turn-indicator part of that absence and the current bundle identity. Every Phase 0.13 card requirement remains unchanged:

- pickup, grab-offset follow, velocity resistance, arming, invalid return, zone hover, placement preview, and one-preview guard retain their existing behavior;
- the nine zones remain fail-closed presentation data;
- scores, rule banners, elements, bonuses, board cards, capture effects, and playable authority remain unimplemented;
- the live Legacy match remains mounted, synchronized, and immediately recoverable;
- no Modern action or visual result is a submitted move.

The coin is not input. It is a renderer-local projection and motion study driven by a plain description of what the existing game already chose.

#### 12.17.2 Exact Legacy source, targets, assets, and sequence descriptor

The Legacy marker is one Raphael image created by `buildTurnMarker()` and moved by `drawTurnMarker()`. Its exact logical geometry is:

| Descriptor side | Top-left x | Top-left y | Width | Height | Center x | Center y |
|---|---:|---:|---:|---:|---:|---:|
| `initial` | 327 | 420 | 41 | 41 | 347.5 | 440.5 |
| `player` | 33 | 420 | 41 | 41 | 53.5 | 440.5 |
| `opponent` | 621 | 420 | 41 | 41 | 641.5 | 440.5 |

The y position does not change between targets. These values are measured in the same 693 by 500 logical coordinate system used by the active-match camera and card study.

Legacy chooses its one marker image at construction:

```text
isMyTurn at marker construction
  ? /images/dime-heads.png
  : /images/dime-tails.png
```

Both source files are existing same-origin 41 by 41 RGBA PNGs. Legacy does not exchange the image when the marker crosses the table. Phase 0.14 preserves that behavior: the descriptor carries the currently selected URL, and both Three.js faces use that same URL. A visible reverse face is therefore the reverse side of the same approved design, not a newly selected tails/heads outcome. The Modern implementation may not infer image selection from `isMyTurn`, randomize it, or alternate it during motion.

The bridge record is explicitly:

```ts
interface Phase014TurnIndicatorDescriptor {
  sequence: number; // nonnegative integer
  side: "initial" | "player" | "opponent";
  x: number;        // Legacy logical top-left
  y: number;
  width: 41;
  height: 41;
  textureUrl:
    | "/images/dime-heads.png"
    | "/images/dime-tails.png";
  visible: boolean;
}
```

`sequence` begins at `0`. Legacy increments it before each side-change notification. The descriptor contains no callback and does not ask Modern to decide the turn. A Modern surface accepts only the normalized center, texture, visibility, and sequence for presentation.

First-snapshot behavior is intentionally different from later updates. The first descriptor received by a newly mounted, resumed, or reconstructed surface is snapped directly to the described flat endpoint. It never replays movement from the center or from a side remembered by another surface. Once initialized:

```text
newer sequence && changed target key
  → transition from the currently rendered pose

duplicate, stale, same sequence, or same target
  → no replay
```

A newer sequence that arrives during motion supersedes the old plan from the exact current visible pose. The prior generation is cancelled and cannot complete later.

#### 12.17.3 Circular Three.js representation and material policy

The Phase 0.14 marker is not a square image plane. It consists of:

- one front `CircleGeometry` with diameter `41` and 64 radial segments;
- one back `CircleGeometry` with the same dimensions and segmentation;
- one open `CylinderGeometry` edge with radius `20.5`, thickness `3`, and 64 radial segments;
- face offsets just beyond the cylindrical side to prevent coplanar artifacts;
- one bounded analytic shadow mesh below the coin;
- one orientation hierarchy that applies local-X tumble, local-Y flip, and local-Z spin as actual 3D rotations.

The face material is unlit sRGB white and tone-map-independent. Texture filtering must remain stable during foreshortening. Both face meshes use the descriptor's same texture. The reverse face is oriented to remain visible from the reverse normal. The edge uses restrained metallic lighting to make thickness readable, especially near edge-on rotation, without darkening the face art. Hardware shadow maps remain off.

The same head-on 40-degree active-match perspective camera and flat-table position neutralization used by the Phase 0.11 through Phase 0.13 card study apply. At rest, the coin center and circular 41-pixel silhouette match the descriptor. During motion, height changes real perspective depth. The off-axis endpoints must not create a radial lean or imply that the table is curved.

#### 12.17.4 Deterministic profile, plan, and sampled motion

The source of truth is the version-1 turn-coin profile in `FR-MATCH-TURN-COIN-009`. Its application default is:

```json
{
  "schemaVersion": 1,
  "id": "turn-marker-toss",
  "label": "Turn Marker Toss",
  "path": {
    "curvePx": -54,
    "apexHeight": 92,
    "flightMs": 650
  },
  "rotation": {
    "flipTurns": 2.5,
    "tumbleTurns": 0.5,
    "spinTurns": 0.125,
    "contactTiltDeg": 8
  },
  "landing": {
    "settleMs": 110
  },
  "shadow": {
    "strength": 0.34,
    "spread": 1
  }
}
```

The profile is normalized and frozen plain data. The application provides the source, destination, optional delay, and optional current source pose only when constructing a plan. The plan resolves:

- nominal source and destination centers;
- horizontal direction sign;
- quadratic screen-space control point;
- physical apex;
- flight, settle, motion, and total durations;
- source, contact, and terminal rotations;
- source and authored shadow values.

For ordinary endpoint-to-endpoint motion, reversing direction must mirror screen x and rotation signs while preserving screen y, height, duration, and shadow samples. Screen translation is a quadratic Bézier. Height is the analytic parabola in `FR-MATCH-TURN-COIN-011`. Rotation advances continuously throughout flight; the viewer must see the real circular edge rather than a flat x-scale collapse. Shadow opacity falls and spread rises with height. There is no randomness, frame-dependent integration, physics-engine dependency, or application-state lookup in the sampler.

At contact, the coin reaches the exact destination center and height `0`. During the 110-millisecond default settle it remains at that center while smooth-step interpolation removes the eight-degree contact lean and resolves pitch/yaw to the nearest flat half-turn multiples and roll to the nearest full turn. A complete pose is stable at authored scale `1`, with finite values and a profile-authored contact shadow. The object may be geometrically reversed by half-turn parity, which is visually harmless in this phase because both faces deliberately share the same image.

#### 12.17.5 Scheduler, supersession, lifecycle, failure, and reduced motion

Turn-coin motion owns one demand-driven scheduler distinct from, and non-blocking to, the existing card-study scheduler. It may own at most one pending coin frame. Every callback captures its frame identity and monotonic coin-motion generation. Both must still match before sampling or rendering.

Normal completion:

- samples the canonical terminal pose exactly;
- clears the active motion;
- records one accepted and one completed transition;
- leaves no pending coin frame;
- does not call an application continuation;
- leaves card interaction and Legacy objects unchanged.

The following events cancel coin motion and invalidate its generation:

- explicit Legacy selection or automatic Legacy fallback;
- active-match deactivation, early exit, game over, or lobby presentation;
- descriptor removal, an invalid descriptor, or a non-transition replacement that does not qualify as a valid newer target sequence;
- page visibility loss;
- surface suspension, replacement, reconstruction, or disposal;
- initialization, required-texture, renderer, or WebGL context failure.

When a reusable current surface is merely suspended or hidden, it may snap to the latest valid descriptor before later presentation. When it is disposed, it releases face texture, face material, edge, geometry, light target, shadow, listener, frame, and context ownership under the existing surface lifecycle. A late texture result or frame from an invalidated generation is inert. A required live marker texture failure before readiness follows the existing active-match fail-open path to intact Legacy. Failure to read or write the optional local profile instead uses the validated application default and does not make the match unavailable.

A valid newer target sequence delivered during motion is not a lifecycle replacement under the cancellation rule above. It follows the exact-pose supersession contract in Sections 12.17.2 and 12.17.4 and leaves only the superseded generation inert.

With reduced motion, every accepted later sequence snaps to the same latest endpoint and flat stable pose immediately. It changes no path or endpoint semantics, records the transition exactly once, and owns no animation frame.

#### 12.17.6 Motion Studio application target and isolated persistence

Motion Studio adds one target:

```text
id    = match-turn-coin-transition
label = Match turn coin — Transition
kind  = coin
domain = active-match
```

When selected, the 755 by 562 Studio stage contains one exact 693 by 500 active-match viewport at offset `(30, 30)`. The coin uses:

- logical camera center `(346.5, 250)`;
- field of view `40°`;
- camera distance `(500 / 2) / tan(20°)`;
- player center `(53.5, 440.5)`;
- opponent center `(641.5, 440.5)`;
- the same 41-diameter, three-thick circular representation;
- the same face/edge material policy and flat-table projection;
- the same profile normalizer, planner, sampler, safety limits, and deterministic poses as production.

The visible preview direction selects Player → AI or AI → Player. It is Studio view state, not a profile field or a turn command. Both endpoint helpers are locked. The user cannot drag them, place them in JSON, or persist alternative match coordinates. `/images/dime-heads.png` is the representative Studio art; it appears on both faces just as one production descriptor asset appears on both faces.

Only coin-relevant controls are shown: curve, apex, flight, flip, tumble, spin, contact tilt, settle, shadow strength, and shadow spread, plus common transport/readout controls. Card-specific scale, skid, contact, intro copy, wind, lobby starting-preset, and draggable-start controls are hidden or disabled.

The applied profile is canonical versioned JSON stored under:

```text
purett.turnMarkerMotion.v1
```

This key is separate from:

```text
purett.graphicsMode.v1
purett.lobbyMotionPlaybook.v1
```

`Apply to Match Coin` validates and writes only the coin profile, increments its local coordinator revision, updates the current renderer's profile for a future accepted sequence, and replays the Studio preview. It does not fabricate a new sequence or move an unchanged live coin. Export returns only canonical coin-profile JSON; strict import applies atomically to the Studio draft. The existing guarded Motion Studio session document may separately retain the unsaved draft, selected preview direction, target, and UI state. Neither persistence route changes Graphics selection, lobby choreography, account data, or the repository default.

#### 12.17.7 Non-authoritative boundary, diagnostics, communication, and delivery

The descriptor and coin must not:

- decide or infer who plays next;
- read turn state except as already-redacted descriptor presentation;
- enable or disable the board or either hand;
- call, wrap, defer, replace, or await the Legacy `drawTurnMarker()` callback;
- alter the live Raphael marker, its attributes, or its z-order;
- change score, rule, review, replay, dialog, opponent delay, game-over, or timer state;
- create a semantic action, move result, placement, request token, or payload;
- submit HTTP, navigate, log external telemetry, or write account state.

Active-match diagnostics expose the normalized descriptor and policy, geometry, materials, endpoints, applied profile, current pose, active plan, sequence transition, generation, progress, duration, outcome, reduced-motion state, pending-frame state, and accepted/completed/cancelled/ignored counts. Coordinator diagnostics expose the applied normalized profile and local profile revision. Studio diagnostics expose coin subject, active-match coordinate-space inset, descriptor, profile, plan, pose, playback, resources, and scheduler state. All are cloned plain data and carry `gameplayAuthority: false`; none may expose live renderer or Legacy objects.

User-facing status must say that Modern now mirrors the turn marker and previews its 3D transition while remaining incomplete and non-playable. It cannot imply that the coin controls the turn.

The generated artifact remains pinned to Three.js `0.185.1` (`r185`) and uses:

```text
0.185.1-match-turn-coin.1
```

Source registration, generated bundle, coordinator URL, canvas/DOM metadata, diagnostics, static and browser contracts, deployment artifact, and this requirement must agree. Phase 0.13's `0.185.1-match-placement.1` remains historical evidence.

#### 12.17.8 Acceptance criteria

**AC-P014-001 — Exact Legacy descriptor, targets, and asset behavior**

A controlled Legacy fixture produces sequence `0`, the exact initial/player/opponent rectangles and centers in Section 12.17.2, and only the two approved texture URLs. A player-start fixture selects heads; an opponent-start fixture selects tails. Later side changes retain the originally selected URL. The cloned descriptor contains no function, Raphael object, game object, or request primitive.

**AC-P014-002 — First-snapshot snap and replay guard**

Mounting a new Modern surface independently while the descriptor is `initial`, `player`, and `opponent` produces one immediate exact flat settled marker at that descriptor with zero accepted motion and no pending frame. Repeating the descriptor, changing only visibility, sending the same sequence, or sending a same-target later sequence cannot replay flight. A later sequence with the opposite target begins exactly one transition.

**AC-P014-003 — True 3D circular representation and color**

Static and runtime evidence shows two 64-segment 41-diameter circles, one 64-segment three-unit open cylindrical edge, and distinct face/edge material treatment. Both faces reference the descriptor-selected texture. Actual-size captures in both directions visibly expose the lit edge during pitch/yaw while face art retains the source asset's expected sRGB brightness. No square silhouette, alternate face art, z-fighting, grid flash, darkened face, curved-table skew, or hardware shadow pass appears.

**AC-P014-004 — Deterministic default plan and mirror symmetry**

The default profile normalizes to every exact value in Section 12.17.4 and yields 650 milliseconds of flight, 110 milliseconds of settle, and 760 milliseconds total. At no fewer than 121 controlled flight samples, forward and reverse x positions sum to `695`, while y, height, progress, duration, and shadow samples match and X/Y/Z rotations carry the expected mirrored signs. Repeated plans and irregular frame schedules produce identical poses. No source contains or invokes random sampling.

**AC-P014-005 — Physical flight, edge passage, shadow, and settlement**

Controlled samples prove positive height during flight, an apex consistent with profile height, strong edge exposure under the default flip, height-responsive lower-opacity/wider shadow, exact destination and height `0` at contact, and a non-oscillating flat terminal pose. The completed marker is centered at exactly `(53.5, 440.5)` or `(641.5, 440.5)`, uses authored scale `1`, retains its selected texture, and owns zero idle frames.

**AC-P014-006 — Mid-flight supersession and lifecycle rejection**

When a newer sequence arrives at representative early, apex, contact, and settle samples, the replacement plan's elapsed-zero pose exactly equals the prior rendered position, height, rotations, and shadow. Only the latest sequence completes. Every lifecycle cause in Section 12.17.5 cancels the generation, releases the coin frame, and settles or disposes once. Manually invoking captured old frames and late texture completions after replacement cannot change the latest pose, counters, card state, Legacy marker, or requests.

**AC-P014-007 — Reduced motion and scheduler bounds**

Normal motion owns at most one pending coin frame, including when a Phase 0.13 card motion is active concurrently, and returns to zero after completion, cancellation, or failure. Reduced motion accepts the same later sequence and commits the exact latest endpoint synchronously with no flight or pending frame while recording one reduced-motion completion.

**AC-P014-008 — Zero authority and unchanged Phase 0.13 behavior**

Before, during, and after initial settlement, normal transition, supersession, reduced motion, Studio apply, and lifecycle reset, `isMyTurn`, `turns`, board enablement, hand arrays, card hold/placement state, scores, rules, opponent scheduling, callback invocation count/timing, Raphael marker identity/attributes, semantic-action count, request count, payloads, and navigation remain unchanged except for Legacy's independently executing existing flow. The complete Phase 0.13 card regression suite produces the same results.

**AC-P014-009 — Isolated profile persistence and strict interchange**

Applying a valid Studio profile writes canonical schema-version-1 JSON only to `purett.turnMarkerMotion.v1`, increments one profile revision, and leaves Graphics and lobby-playbook storage byte-for-byte unchanged. Reload restores the normalized profile. Storage denial, malformed JSON, unknown keys, non-finite values, out-of-range normalization cases, and a future schema fall back or fail atomically as specified without affecting match readiness or another key. Export/import round-trips without sampled-pose drift and emits no network request.

**AC-P014-010 — Exact Motion Studio production parity**

Studio diagnostics report `subjectKind: "coin"`, a 693 by 500 active-match coordinate space inset at `(30, 30)`, the production 40-degree camera, exact locked centers, production coin geometry, and the same normalized profile and plan. Player → AI and AI → Player preview samples equal direct production planner/sampler results at start, quarter, apex/midpoint, three-quarter, contact, and completion within numeric tolerance. Coin controls are visible; prohibited card/lobby controls and endpoint dragging are unavailable. `Apply to Match Coin` does not fabricate live motion for an unchanged sequence.

**AC-P014-011 — Diagnostics, failure, communication, and cache identity**

Active surface, coordinator, and Studio diagnostics contain every permitted plain field in Section 12.17.7, show bounded scheduler state and `gameplayAuthority: false`, and expose no renderer, Legacy, concealed card, callback, or request object. Status copy says the turn coin mirrors rather than controls the turn and Modern remains non-playable. Forced required-texture, initialization, and context failures restore intact Legacy once. Source, bundle, loader, registration, diagnostics, static/browser contracts, and deployment agree on `0.185.1-match-turn-coin.1`.

#### 12.17.9 Required evidence and definition of done

Phase 0.14 requires:

- static contracts for the explicit Legacy descriptor and increment-before-animation ordering, exact target geometry, approved texture allowlist, no renderer object in the bridge, first-snapshot snap, duplicate guard, zero authority, separate storage key, Studio registry, and cache identity;
- pure unit coverage for schema normalization, bounds, deep immutability, strict canonical import/export, default profile, plan totals, both direction signs, mirror symmetry, interrupted source poses, non-finite rejection, and deterministic sampled path/height/rotation/shadow/settlement;
- generated-bundle evidence for the two circular faces, real cylindrical edge, same texture on both faces, sRGB face policy, lit edge, analytic shadow, scheduler/generation guards, diagnostics, and absence of a runtime random dependency;
- browser or controlled-harness evidence for each first-snapshot side, later sequence transitions in both directions, duplicate/stale/same-target delivery, visibility, mid-flight supersession, normal and reduced motion, simultaneous card/coin motion, texture failure, context loss, Legacy switching, active-match/lobby transitions, reconstruction, and disposal;
- unchanged Legacy marker, callback timing, controller, card-study, hand, board, score, rule, turn, semantic-action, and request snapshots;
- Motion Studio coverage for target selection, exact match inset/camera/endpoints, direction selection, applicable-control visibility, transport/scrub/readout, profile reset, session draft, apply, reload, storage isolation, import/export, invalid import, reduced motion, context loss, and cleanup;
- actual-size normal-speed and slowed captures in both directions proving circular silhouette, real edge exposure, lift, three-axis motion, shadow response, exact landing, and no face darkening or curved-table appearance;
- fifty-cycle resource evidence for coin transitions and Studio coin sessions;
- current Graphics persistence, Phase 0.10 secrecy/fallback, Phases 0.11 through 0.13 card studies, lobby, existing Motion Studio card targets, and applicable Legacy regressions;
- a generated Modern artifact matching reviewed source and pinned Three.js `0.185.1` with cache identity `0.185.1-match-turn-coin.1`.

Phase 0.14 is complete only when all `AC-P014-*` criteria and required evidence pass and a normal-speed actual-size review accepts that the marker reads as a circular coin leaving a flat table, exposing real thickness, and settling cleanly at the exact opposite Legacy target. Completion does not authorize turn authority, callback sequencing, score/rule rendering, board occupancy, capture effects, semantic match input, network requests, distinct face art, randomized coin outcomes, or promotion of Modern as playable.

### 12.18 Phase 0.15: parallel Modern hinged game-cover projection

#### 12.18.1 Objective, scope, and supersession

Phase 0.15 gives Modern mode a physically legible game-cover opening and closing treatment without transferring any lifecycle or application-flow authority away from the existing Raphael cover. It is the narrow explicit exception to the cover exclusions recorded in Sections 4.3, 8, and 12.12. It preserves every earlier lobby, active-match, Motion Studio, fallback, and Legacy behavior.

The delivered structure is deliberately parallel:

```text
Legacy gh.cover
  owns isopen, Raphael motion, parent visibility,
  pointer shielding, callbacks, and application flow
                |
                | cloned presentation descriptor
                v
Modern game-cover surface
  owns only a decorative 755 × 562 Three.js projection,
  one bounded scheduler, and disposable GPU resources
```

The projection is not a new active-match renderer, lobby `surfaceKind`, semantic transition, Motion Studio target, or continuation promise. It may coexist with the current lobby or active-match Modern surface. The reason is structural as well as conservative: early exit and game over deactivate the active-match presentation before the application asks `gh.cover` to close. A cover tied to that active-match lifecycle would disappear at exactly the point it is needed.

Phase 0.15 supersedes:

- the statement that `gh.cover` has no Modern projection;
- the current generated-bundle identity from Phase 0.14;
- only the cover-specific part of the general Outer UI migration exclusion.

It does not supersede:

- Raphael remaining loaded;
- the page-lifetime `gh.cover` instance;
- the existing `isopen` and Raphael animation behavior;
- any callback timing, duplicate-call behavior, interruption behavior, or application continuation;
- the existing parent show/hide and input-shield lifecycle;
- the one-effective-lobby-or-active-surface rule;
- the non-playable and zero-authority Phase 0 boundary;
- exclusions for menu commands, statistics, rules, deck, shop, endgame, dialogs, or another Outer UI surface.

#### 12.18.2 Exact Legacy source, descriptor, and continuation boundary

The current cover uses one 755 by 562 Raphael paper and two opaque source images. Their live logical rectangles are normative:

| Panel | Texture | Logical rectangle | Closed paint order |
|---|---|---:|---:|
| Left | `/images/left.png` | `(0, 0, 377, 562)` | 1 |
| Right | `/images/right.png` | `(376, 0, 378, 562)` | 2 |

The rectangles overlap by one logical pixel at x `376`. The right image was created second and therefore wins the seam. The source files' natural dimensions do not redefine these rectangles; Phase 0.15 must not replace them with archival variants, infer a different crop, divide the stage into two equal mathematical halves, or “correct” the apparent final coordinate.

The initial cloned descriptor is:

```json
{
  "schemaVersion": 1,
  "sequence": 0,
  "target": "closed",
  "startedAtMs": null,
  "durationMs": 0,
  "easing": null,
  "frame": {
    "x": 0,
    "y": 0,
    "width": 755,
    "height": 562
  },
  "panels": [
    {
      "id": "left",
      "textureUrl": "/images/left.png",
      "rect": {
        "x": 0,
        "y": 0,
        "width": 377,
        "height": 562
      },
      "hinge": "left",
      "rotationSign": -1
    },
    {
      "id": "right",
      "textureUrl": "/images/right.png",
      "rect": {
        "x": 376,
        "y": 0,
        "width": 378,
        "height": 562
      },
      "hinge": "right",
      "rotationSign": 1
    }
  ]
}
```

An actual target change increments sequence once, uses the same frame and panel records, and supplies the transition observation timestamp, 2,000-millisecond duration, and target-specific easing. A duplicate target call does not publish. Consumers reject malformed, same-sequence, and older delivery without attempting to infer intent from DOM or Raphael state.

The public Legacy behavior remains the definitive control-flow trace:

| Call state | Legacy action | Public callback | Modern authority |
|---|---|---|---|
| `open()` while closed | set `isopen=true`; publish; schedule both 2,000 ms `<` animations; hide parent on left completion | synchronous after scheduling | observe only |
| `open()` while already targeted open | no new Legacy target or descriptor | synchronous | none |
| `close()` while open | set `isopen=false`; show parent; stop left; publish; start left 2,000 ms `>` return; stop and start right 2,000 ms `>` return | Legacy left completion | observe only |
| `close()` while already targeted closed | no new Legacy target or descriptor | synchronous | none |

Close-during-open, duplicate calls during flight, and open-during-close retain all existing Legacy effects, including current stale Legacy completion behavior. Phase 0.15 does not use Modern to regularize those application semantics. The new descriptor gives Modern enough information to supersede its own projection safely; it does not become an abstraction that owns or “fixes” Legacy callbacks.

#### 12.18.3 Full-stage Three.js representation

The host hierarchy is:

```text
#game-cover                         existing 755 × 562 parent and barrier
├── #legacyGameCover.legacy-game-cover-canvas
│                                   existing Raphael child
└── #modernGameCover               new decorative sibling host
    └── canvas.modern-game-cover-canvas
```

The parent retains its existing positioning and z-index. The Modern child never replaces the parent, never controls its display property, and never becomes an input barrier by itself. The ready gate switches only the two children after the Modern frame is complete. Both children expose diagnostic renderer identity and mutually exclusive renderer-active state. The native Legacy SVG identity and direct visibility assignment make exclusivity independent of jQuery's historical SVG class handling; the parent ready class remains the declarative CSS gate.

The physical model contains two independent pivot groups:

- left pivot at logical `(0, 281, 0)`;
- right pivot at logical `(754, 281, 0)`;
- left panel center offset `+188.5` from its pivot;
- right panel center offset `-189` from its pivot;
- each panel has logical height `562` and thickness `10`;
- the front plane is separated slightly from the body to prevent coplanar artifacts;
- the right front retains higher render order at the closed overlap.

At openness `0`, both local-Y rotations are exactly zero and the projected fronts reproduce the Legacy rectangles. At openness `1`, the left rotation is exactly `-112°` and the right rotation is exactly `+112°`. Those signs move both inner edges toward the camera while swinging them away from the center seam. Positive physical inner-edge depth and visible backs/edges make the motion unmistakably three-dimensional. The fixed angle intentionally carries both inner edges beyond perpendicular rather than stopping at an ambiguous edge-on disappearance.

The stage-centered camera uses:

```text
logical center = (377.5, 281)
vertical FOV   = 40°
distance       = (562 / 2) / tan(20°)
```

The camera does not orbit, pan, or vary by leaf position. This prevents a fanned or curved-surface reading and preserves exact closed alignment. Front faces use unlit, untinted, tone-map-independent sRGB texture presentation. The body and back may use one restrained, rough, nonmetallic wood material with bounded hemisphere and directional light. Hardware shadow mapping is disabled. No lighting may darken the source fronts.

#### 12.18.4 Deterministic plan, sampling, catch-up, and reversal

The renderer-neutral motion coordinate is scalar `openness`:

```text
closed = 0
open   = 1
```

For a plan from source openness `a` to target openness `b`, raw progress and interpolation are:

```text
t = clamp(elapsedMs / 2000, 0, 1)

opening:
  e = t^3

closing:
  e = 1 - (1 - t)^3

openness = a + ((b - a) × e)
leftY    = -112° × openness
rightY   = +112° × openness
```

Every non-settled plan lasts the full 2,000 milliseconds, including a reversal from a partial pose. Distance changes angular speed but does not shorten the observed Legacy-character interval. A settled source and identical target create a zero-duration settled plan.

Canonical endpoint-to-endpoint samples are:

| Elapsed | Raw `t` | Opening eased/openness | Opening angle magnitude | Closing eased progress | Closing openness | Closing angle magnitude |
|---:|---:|---:|---:|---:|---:|---:|
| 0 ms | 0 | 0 | 0° | 0 | 1 | 112° |
| 500 ms | 0.25 | 0.015625 | 1.75° | 0.578125 | 0.421875 | 47.25° |
| 1,000 ms | 0.5 | 0.125 | 14° | 0.875 | 0.125 | 14° |
| 1,500 ms | 0.75 | 0.421875 | 47.25° | 0.984375 | 0.015625 | 1.75° |
| 2,000 ms | 1 | 1 | 112° | 1 | 0 | 0° |

Sampling depends only on the frozen plan and elapsed time. An irregular frame schedule and a dense fixed schedule produce the same pose at the same elapsed time. No random value, wall-clock integration, velocity accumulator, physics engine, DOM measurement, previous rendered matrix, or frame count enters the formula.

When a new sequence arrives during motion, the surface first samples the old plan at the new descriptor's observation timestamp, captures that exact openness, invalidates the old generation, and constructs the full-duration replacement plan from the captured pose. Elapsed zero of the replacement must equal the last visible old pose.

When textures or the renderer become ready after a transition began, or when a hidden/suspended surface resumes, the surface samples against `now - startedAtMs`. It does not restart the interval. If the timestamp is at least 2,000 milliseconds old, it commits the target immediately. A sequence-0 initial descriptor snaps closed without inventing opening history.

#### 12.18.5 Scheduler, mode, lifecycle, failure, and reduced motion

The Modern cover owns no unconditional render loop. One accepted moving target may own one cover-specific animation-frame callback. A frame is valid only when both its captured callback identity and its motion generation still match. Normal completion samples the exact endpoint, clears motion, records completion, and returns the pending count to zero.

Mode and readiness rules are:

1. Legacy is visible while the Modern bundle, facade, cover factory, host, context, textures, geometry, descriptor, or first frame is not ready.
2. A complete first Modern frame atomically applies the cover-ready child gate, directly hides and marks inactive the Raphael child, and reveals and marks active the Modern child.
3. Selecting Legacy marks Modern inactive and reveals and marks active the Raphael child before suspending Modern work.
4. Selecting Modern may resume a healthy surface and catch up to the latest descriptor without replay.
5. Lobby-to-match, match-to-lobby, tutorial/replay, early-exit, and game-over transitions do not dispose the page-lifetime cover surface.
6. Active-match deactivation does not cancel a closing cover merely because the match surface is no longer effective.

Cover failure is component-local. Synchronous construction failure, absent host/factory, malformed descriptor, either texture rejecting, one texture succeeding while the other rejects or times out, a late partial completion, rendering error, WebGL context loss, visibility race, replacement, or disposal must:

- reveal or retain the complete Legacy child;
- remove the Modern cover-ready gate;
- cancel the cover frame and invalidate the generation;
- dispose every partial and complete Modern cover resource;
- make old frames and late loads inert;
- preserve Legacy cover identity, animation, callback, parent visibility, and pointer shielding;
- preserve the requested/effective Modern selection and a healthy Modern lobby or active-match surface.

Only a shared capability or bundle failure that prevents Modern as a whole may invoke the global Modern-to-Legacy fallback. Conversely, a lobby or active-match surface failure does not corrupt the cover descriptor or Legacy cover.

Reduced motion is intentionally asymmetric because authority remains Legacy-owned. The Modern projection immediately samples its target endpoint and owns no frame. The Legacy cover continues its existing 2,000-millisecond Raphael animation and continuation timing. The parent may therefore continue to block input even though the decorative Modern leaves have visually snapped. This preserves flow correctness and is not a reason to accelerate the callback.

Disposal and replacement reveal Legacy first and then release frame, timeout, pending-load, listener, texture, material, geometry, light, renderer, context, and canvas ownership idempotently. Fifty repeated lifecycle cycles must return each count to its documented baseline. The Legacy `gh.cover` instance and Raphael objects are never part of Modern cleanup.

#### 12.18.6 Accessibility, stacking, diagnostics, and delivery

The Modern cover is decorative duplication of an existing visual transition:

- host and canvas are `aria-hidden`;
- canvas is excluded from tab order;
- canvas receives no role or accessible name;
- canvas and host install no semantic pointer or keyboard input;
- canvas uses `pointer-events: none`;
- no cover event moves or restores focus;
- no cover state is announced through a live region.

The existing `#game-cover` remains above `#game-wrapper` and below the application's higher menus, loading UI, dialogs, endgame, deck, and shop layers. Snow and confetti retain their established relative order. The title and footer remain outside the covered stage. Application scale is inherited once from the existing content wrapper; logical coordinates, camera, hinge angle, and timing do not change at scales `1`, `1.5`, `2`, or `3`, browser zoom, or device-pixel ratio.

Diagnostics are cloned plain data. They include descriptor, cache identity, policy, ready/fallback/suspension state, current openness, signed angles, projected inner-edge positions and depth, plan, raw/eased progress, generation, pending-frame state, counters, resource summary, reduced-motion state, and last outcome. They explicitly report:

```text
applicationContinuationAuthority = false
gameplayAuthority = false
```

They contain no object that could invoke Legacy, retain the renderer, reveal hidden match information, or issue a request. No cover profile is persisted; no Motion Studio target is added.

The cover component remains on Three.js `0.185.1` (`r185`) and uses:

```text
0.185.1-game-cover-hinge.1
```

Cover source, pure planner, surface, facade/ABI, DOM metadata, diagnostics, component contracts, and this document must agree on that component identity. This was also the composite loader/generated-artifact/deployment identity while Phase 0.15 was current. Phase 0.16 supersedes only those outer delivery identities with `0.185.1-match-hand-fan.1`.

#### 12.18.7 Acceptance criteria

**AC-P015-001 — Exact Legacy source and closed composition**

A fresh cover produces the exact schema-version-1 sequence-0 descriptor in Section 12.18.2. Static and browser evidence using the shipped jQuery 1.7.1 and Raphael 1.5.2 stack proves one 755 by 562 stage, native `#legacyGameCover.legacy-game-cover-canvas` identity, mutually exclusive Legacy/Modern active flags and computed visibility, only the two approved texture URLs, exact rectangles `(0, 0, 377, 562)` and `(376, 0, 378, 562)`, one-pixel overlap, right-over-left seam order, hinge coordinates `0` and `754`, and zero closed rotations. Actual-size closed captures at every application scale show the same source brightness and composition with no gap, crop drift, mixed or simultaneously painted child state, seam shimmer, or darkening. Returning to Legacy restores the same Raphael root before Modern suspension.

**AC-P015-002 — True outer-edge-hinged 3D representation**

Runtime and generated-artifact evidence proves two independent pivot groups, ten-unit physical thickness, position-neutral stage-centered perspective, left negative and right positive local-Y rotation, positive camera-facing inner-edge depth, and exact signed 112-degree open endpoints. Mid-motion and open captures visibly expose restrained wood edges/backs while the fronts retain unlit sRGB source color. Translation-only, scale-only, CSS, billboard, center-seam, backward-folding, single-lid, radial-fan, and curved-table implementations fail.

**AC-P015-003 — Deterministic canonical and irregular-clock samples**

Pure tests verify the exact values in Section 12.18.4 at 0, 500, 1,000, 1,500, and 2,000 milliseconds and at no fewer than 1,000 dense samples. Opening and closing are monotonic, left/right magnitudes match with opposite signs, inner-edge positions and depths are finite, endpoints normalize exactly, and repeated or irregular schedules yield identical poses. Invalid, non-finite, and out-of-range inputs are rejected. The planner/sampler and generated motion path contain no random dependency.

**AC-P015-004 — Unchanged Legacy callbacks and continuation authority**

Controlled real-`gh.cover` traces prove accepted opening sets target and schedules Legacy work before invoking its callback synchronously; accepted closing shows the parent and invokes its callback only through the Legacy left completion after the existing 2,000-millisecond path; already-targeted calls retain synchronous callbacks and publish no sequence. Play, early exit, game over, tutorial/replay, and duplicate/interrupted calls produce the same Legacy callback counts, ordering, wrapper/menu state, request counts, and `isopen` behavior with Modern enabled, disabled, reduced, failed, and absent. Modern diagnostics always report zero continuation authority.

**AC-P015-005 — Reversal, catch-up, and stale-generation rejection**

At representative early, quarter, midpoint, late, and completion observation timestamps, a newer opposite target samples the outgoing plan exactly at the incoming `startedAtMs`; replacement elapsed zero equals that sampled openness and the new plan runs one full 2,000-millisecond interval. Delivery at the same time produces no first-frame jump. Delayed delivery samples the replacement once at `now - startedAtMs` rather than advancing the outgoing and replacement plans across the same interval. Delayed readiness, hidden-tab resume, and mode return catch up from the descriptor timestamp and do not replay elapsed motion. Duplicate and stale descriptors change no pose or accepted count. Manually invoked cancelled frames and late texture completions cannot change a newer pose, child gate, counters, Legacy state, or application flow.

**AC-P015-006 — Reduced motion, accessibility, and input shielding**

Reduced motion snaps the Modern projection synchronously to the exact latest target with zero pending frame while the ordinary Legacy animation, callback clock, parent visibility, wrapper state, and input shield continue unchanged. Accessibility inspection shows the host/canvas absent from the accessible and tab trees, no role/live announcement/action handler, no focus movement, and `pointer-events: none`. Pointer probing cannot reach the underlying game while the Legacy parent barrier is shown and cannot be blocked by the Modern canvas after Legacy exposes the game.

**AC-P015-007 — Scale, device-pixel ratio, stacking, and real flows**

At application scales `1`, `1.5`, `2`, and `3`, representative browser zoom, and supported device-pixel ratios, logical rectangles, seam, hinge coordinates, projected openness, signed angles, camera framing, and timing are invariant while backing resolution remains bounded. The cover remains above the game wrapper and below higher application UI. Real Play, normal game open, early exit, game over, tutorial/replay open and close, mode switching, lobby/match handoff, and parent show/hide flows complete without losing, duplicating, or prematurely exposing UI.

**AC-P015-008 — Component-local fail-open and zero authority**

Forced synchronous factory/host/renderer failure; malformed descriptor; left failure; right failure; one-success/one-reject; one-success/other-timeout; partial late completion; render exception; context loss; visibility race; replacement; and disposal each reveal or retain the intact Legacy cover exactly once and dispose partial Modern resources. Requested/effective Modern mode and healthy lobby/active surface identity remain unchanged. Game, controller, hand, board, score, rule, turn, menu, cover callback, semantic-action, navigation, storage, and request snapshots remain unchanged except for independently executing Legacy flow.

**AC-P015-009 — Diagnostics, cache identity, scheduler, and resource cleanup**

Diagnostics expose every permitted plain field in Section 12.18.6, bounded counters, no live object, and both authority flags false. Normal, reduced, suspended, settled, failed, and disposed states own at most one cover frame while moving and zero otherwise. Fifty cycles spanning open, close, duplicate calls, both reversal directions, delayed readiness, mode switch, visibility, scale, reduced motion, partial texture failure, context loss, replacement, and disposal return frames, timers, loads, listeners, textures, materials, geometries, lights, canvases, and cover WebGL contexts to baseline; captured stale work remains inert. Cover source, facade/ABI, DOM metadata, diagnostics, tests, and requirements report component identity `0.185.1-game-cover-hinge.1`. The current composite generated bundle, loader URL, and deployment report the latest phase identity—`0.185.1-match-hand-fan.1` beginning with Phase 0.16—without changing the embedded cover identity.

#### 12.18.8 Required evidence and definition of done

Phase 0.15 requires:

- static characterization of `gh.cover` construction, initial state, exact assets/rectangles, target changes, descriptor sequencing, parent show/hide, left-owned completions, public callbacks, interruption behavior, and unchanged application call sites;
- pure planner/sampler tests for schema identity, immutability, bounds, exact defaults, 1,000-sample monotonic opening/closing, mirrored signs, positive depth, canonical timestamps, irregular cadence, exact endpoints, interrupted-source continuity, and invalid input;
- source and generated-artifact checks for full-stage factory/ABI registration, independent lifecycle, exact hinges, 112-degree endpoints, ten-unit thickness, stage-centered camera, sRGB unlit fronts, lit wood body, no hardware shadow, ready gate, scheduler/generation guards, local fallback, authority flags, and cache identity;
- controlled browser-clock traces at canonical samples and representative irregular times for ordinary opening, ordinary closing, partial reversal in both directions, duplicate and stale descriptors, first-snapshot closed state, delayed ready catch-up, hidden-tab catch-up, and mode resume;
- real Legacy callback/order traces for Play, early exit, game over, tutorial/replay, duplicate open/close, close-during-open, and open-during-close, with Modern ordinary, reduced, failed, and absent;
- component-local failure injection for synchronous factory/host/renderer construction, each texture independently, one fulfilled texture followed by sibling rejection or timeout, late partial loads, malformed descriptor, rendering exception, context loss, replacement, and disposal;
- proof that partial-load failure disposes the texture that already succeeded and that stale loads or frames cannot reapply the Modern child gate;
- accessibility, focus, tab-order, pointer-shield, z-order, application-scale, browser-zoom, device-pixel-ratio, and bounded-backing-resolution evidence;
- actual-size normal-speed and slowed captures at exact closed, representative mid-open, exact 112-degree open, representative mid-close, and exact reclosed poses, proving true forward hinge depth and clean art;
- unchanged requested/effective Graphics state, active lobby/match surface identity, Legacy cover/callback identity, controller, hand, board, score, rule, turn, semantic-action, storage, navigation, and request evidence;
- fifty-cycle cleanup evidence with manually invoked stale frames and late texture completions;
- current Phase 0.9 lobby, Phase 0.10 hand secrecy/fallback, Phases 0.11 through 0.13 card studies, Phase 0.14 coin/Studio, Graphics persistence, scaling, dialogs, smoke flows, and applicable Legacy regressions;
- historical Phase 0.15 delivery evidence for a generated Modern artifact matching reviewed source and pinned Three.js `0.185.1` with outer cache identity `0.185.1-game-cover-hinge.1`, plus current evidence that the embedded cover facade and diagnostics retain that component identity after a later phase supersedes the composite artifact identity.

Phase 0.15 is complete only when all `AC-P015-*` criteria and required evidence pass and normal-speed actual-size review accepts that the familiar cover remains exact when closed, both leaves visibly hinge toward the camera from their outside edges, the fixed 112-degree opening reads as physical rather than flat, and closing restores the seam cleanly. Completion does not authorize replacement or removal of the Legacy cover, callback or application continuation authority, a cover interaction, Motion Studio cover target, stored cover profile, another Outer UI migration, playable Modern match status, or any game/network behavior.

### 12.19 Phase 0.16: cover-triggered active-match hand fan

#### 12.19.1 Objective and boundary

Phase 0.16 gives the already-rendered player and opponent hands a deliberate entrance synchronized to the physical opening of the game box. It does not add or change a game mechanic. The intended visible sequence is:

1. The Modern active-match surface prepares one compact pile on each side while the game cover still blocks the board.
2. The card that will occupy the fifth/bottom position after expansion is visibly on top of each pile.
3. The existing Legacy cover completes its real opening animation and hides the full-stage blocker.
4. Both piles expand upward into the exact vertical hand positions already accepted in Phase 0.10.
5. Modern card input becomes available only after exact entrance settlement.

The trigger belongs to the Legacy animation boundary because Legacy still owns `#game-cover`, `isopen`, callback timing, and application continuation. Phase 0.16 observes that boundary; it does not move it. The synchronous public `open()` callback is intentionally too early and the independent Modern cover's visual completion is intentionally non-authoritative.

The entrance is local to the active-match Three.js surface. The plain canonical output of `gh.game.describeMatchHands()` remains unchanged throughout. A runtime switch to Legacy therefore reveals the same live Raphael cards at their ordinary vertical locations; Legacy never adopts, reproduces, or waits for the temporary Modern pile.

#### 12.19.2 Exact stack, order, and final geometry

For a normal five-card hand, the retained canonical centers are:

| Side | Index 0 | Index 1 | Index 2 | Index 3 | Index 4 / pile anchor |
|---|---:|---:|---:|---:|---:|
| Player x | 86.5 | 86.5 | 86.5 | 86.5 | 86.5 |
| Opponent x | 608.5 | 608.5 | 608.5 | 608.5 | 608.5 |
| y | 91 | 146 | 201 | 256 | 311 |

The waiting pile uses the last current card's center rather than a hard-coded five-card assumption. A three-card side therefore piles at its third current destination; a one-card side is already terminal; an empty side contributes no plan. Player and opponent counts are independent.

Every waiting card has:

```text
screen center = that side's last current destination
depth         = 0
rotation X/Y/Z = 0
projected scale = 1
```

Normal existing hand render order is preserved. Index `4` is highest for a five-card hand and consequently covers indices `0` through `3` in the pile. This is the user's requested “bottommost card on top”: it describes the card's eventual vertical destination and pile paint order, not a second invented card ordering or a spatially top-anchored pile.

At terminal settlement, the exact Phase 0.10 rectangles, neutral rotations, table depth, scale, and normal render order are restored. The entrance never writes its pile center or transient rotations into the canonical hand description.

#### 12.19.3 Release bridge and readiness rule

Each accepted active-match activation arms one entrance sequence in `stacked` state unless the coordinator already observed settlement for the current open cover sequence, in which case it begins `settled`. The cover adapter publishes:

```text
{
  schemaVersion: 1,
  sequence: <current positive cover sequence>,
  target: "open",
  completedAtMs: <monotonic observation time>
}
```

The publication occurs after the existing Legacy `#game-cover` hide in the current left-panel completion. It is wrapped so a Modern exception cannot interrupt Legacy flow. The coordinator validates that the observation still matches its cloned current open cover presentation before using it.

At that instant, one of two outcomes is selected:

- **Ready Modern presentation:** transition the current entrance to `fanning`, preserve the settlement timestamp as animation elapsed zero, and render through the Modern surface.
- **Modern not completely ready or not effective:** transition directly to `settled`. Do not replay later.

The second outcome is intentional atomic-fallback behavior. Before complete Modern readiness, the live canonical Legacy hands remain the visible fallback. Replacing those already-visible separated hands later with a Modern pile or partial fan would create a more disruptive discontinuity than omitting a decorative entrance. The ordinary path has the Modern bundle loaded from the lobby and a full two-second cover-opening interval in which to decode the current hand and coin textures.

`lastGameCoverSettlement` is retained as plain coordinator diagnostics and prevents an active match attached after an already-settled current open sequence from waiting forever in a pile. It does not become a callback, timer, or new cover owner.

#### 12.19.4 Deterministic motion model

Each side is planned independently from its current last-card source to its unchanged destinations. Index `4` remains stationary. Moving-card release order is the card immediately under the visible pile top through the eventual first/top destination:

```text
index 3 -> delay   0 ms
index 2 -> delay  55 ms
index 1 -> delay 110 ms
index 0 -> delay 165 ms
```

Each moving card lasts 620 milliseconds. A full five-card batch therefore lasts:

```text
165 ms final delay + 620 ms card motion = 785 ms
```

For card-local raw progress:

```text
t = clamp((elapsedMs - delayMs) / 620, 0, 1)
e = 1 - (1 - t)^3
a = sin(π × t) × travelRatio

screenY   = sourceY + ((destinationY - sourceY) × e)
screenX   = sourceX + ((destinationX - sourceX) × e)
            + (sideSign × 4 × a)
depth     = 18 × a
rotationX = -4.5° × a
rotationY = sideSign × 2° × a
rotationZ = sideSign × 1.5° × a
```

`travelRatio` is the card's source-to-destination distance divided by the maximum travel distance for that side. `sideSign` is `-1` for the player and `+1` for the opponent. The farthest-moving card reaches the complete bounded lift and angular values; nearer cards use proportionally smaller 3D motion. Both hands consequently expand with the same cadence while their lateral/yaw/roll cues mirror across the table. Pitch and depth match.

The small physical arc exists to separate cards visibly as they emerge from beneath the stationary top card. It must not alter settled silhouettes, rotate the camera, or make the two final hands appear to lie on a curved surface. Sampling depends only on the immutable plan and elapsed time; it contains no randomizer, velocity accumulator, prior-frame state, or frame-rate-dependent integration.

#### 12.19.5 Input, scheduling, lifecycle, and zero authority

`stacked` and `fanning` are input-blocking states. The surface detaches its click and pointer handlers before it takes entrance pose ownership. If a renderer-local pickup, return, hover, or placement preview exists because of a late/racing descriptor, it is cancelled before the entrance begins. This prevents the retained card scheduler and the entrance scheduler from writing the same Three.js card graph.

The entrance has one independent demand-driven animation-frame owner. Every scheduled callback captures both its exact frame identity and motion generation. A stale callback cannot clear or advance a newer frame. Terminal completion:

- samples the exact final pose;
- clears motion and pending-frame ownership;
- records the completed entrance sequence;
- restores card input only when the rest of the active-match presentation is ready;
- renders one exact terminal frame.

State progression is monotonic. A lower sequence, same-sequence backward transition, duplicate, or same-sequence motion request after terminal completion is ignored. Suspending a still-covered `stacked` surface may retain its pile because it is invisible and may return before cover settlement. Cancelling an already-running fan is terminal for that entrance sequence and restores canonical poses. Hidden-document delivery, reduced motion, context loss, hand replacement, mode/view change, fallback, replacement, and disposal cannot strand a non-null motion with zero frame or allow the same entrance sequence to restart.

The animation changes no authoritative or Legacy state. In particular, it does not call `grab`, `drop`, or a cover method; alter `dragging`, `isDroppable`, hand arrays, board slots, legal targets, turns, score, rules, or opponent scheduling; emit a semantic action; create storage; navigate; or send a request. Cover callback and application-flow timing remain exactly the Phase 0.15 Legacy contract.

#### 12.19.6 Acceptance criteria

**AC-P016-001 — Exact two-pile initial state**

Before cover settlement, a ready normal five-card Modern fixture shows all player centers at `(86.5, 311)` and all opponent centers at `(608.5, 311)`, with zero depth and rotation. Canonical diagnostic rectangles still report y centers `91`, `146`, `201`, `256`, and `311`. Index `4` has the highest ordinary face and body render order on both sides. No card input handler is attached and clicks produce no hold, placement, semantic action, or request.

**AC-P016-002 — Authoritative release ordering and guards**

Real `gh.cover` characterization proves the synchronous open callback produces no settlement; the current left completion first hides the parent and then publishes exactly one plain settlement; right completion, duplicate open, close, malformed data, mismatched current presentation, and manually invoked stale completion produce no accepted hand release. Existing Legacy callback counts, order, parent visibility, and application flow remain unchanged.

**AC-P016-003 — Exact deterministic plan and 3D samples**

Pure tests cover zero through five cards per side, asymmetric counts, independent anchors, immutability, input non-mutation, invalid values, exact delays and 785-millisecond full batch, and no fewer than one dense sample per millisecond. At global 475 milliseconds, the farthest index-0 cards are at their local midpoint and reach depth `18`, lateral offsets `-4`/`+4`, pitch `-4.5°`, yaw `-2°`/`+2°`, and roll `-1.5°`/`+1.5°`. Every sample is finite and bounded, vertical travel is monotonic, both sides mirror exactly, repeated sampling is history-independent, and final poses equal canonical anchors exactly.

**AC-P016-004 — Controlled-clock surface integration**

A controlled browser clock proves the ready surface remains in two piles until an accepted matching settlement, starts one 785-millisecond batch, keeps index `4` fixed, moves indices `3` through `0` in staggered order with nonzero 3D depth and rotation, owns at most one entrance frame, blocks input throughout, and ends with ten exact canonical poses, zero entrance frames, one completed sequence, and restored Phase 0.13 input.

**AC-P016-005 — Readiness, reduced motion, and lifecycle**

Cover settlement while Modern is incomplete takes the `settled` outcome and later complete readiness presents canonical hands without a pile or partial replay. Reduced motion and settlement delivered while hidden/suspended produce the same exact terminal result with zero pending frame. Stacked suspension before settlement remains coherent if Modern returns before the cover completes. Mid-fan mode switch, deactivation, hand replacement, visibility loss, context loss, fallback, replacement, and disposal settle or discard exactly once. Manually invoked cancelled callbacks cannot change a terminal or newer sequence.

**AC-P016-006 — Input arbitration and zero authority**

Clicks on the waiting piles and moving cards leave hold, accepted-pickup, hover, placement, and request counts unchanged. A forced late entrance while a renderer-local card study exists cancels that study before applying entrance poses; two schedulers never own the same card. After ordinary settlement, the existing pickup/follow, invalid return, valid-zone hover, placement preview, and coin behaviors pass unchanged. Legacy hand nodes, controller state, game state, callback timing, storage, navigation, semantic actions, and network traces are identical.

**AC-P016-007 — Diagnostics and delivery identity**

Coordinator and surface diagnostics contain the permitted presentation, plan, pose, render-order, scheduler, counter, completion, and authority fields and no live object. Source, generated bundle, facade/ABI, loader URL, tests, deployment, and requirements agree on Three.js `0.185.1` and cache identity `0.185.1-match-hand-fan.1`; the independent cover component continues to report its Phase 0.15 identity.

#### 12.19.7 Required evidence and definition of done

Phase 0.16 requires:

- pure planner/sampler coverage for exact five-card and partial/asymmetric hands, deep immutability, source non-mutation, bounds, symmetry, dense monotonic sampling, exact extrema, deterministic repetition, and terminal normalization;
- real Legacy cover bridge characterization proving hide-before-notification, no synchronous callback release, exact plain settlement shape, current-sequence guard, stale rejection, and unchanged callbacks/animations;
- source and generated-artifact checks for facade/ABI, cache identity, stack/fan state routing, input arbitration, scheduler identity/generation guards, diagnostics, and absence of renderer/game/runtime dependencies in the planner;
- controlled browser-clock coverage for waiting piles, exact order and midpoint 3D pose, stationary index `4`, input lock, one pending frame, exact terminal hands, and zero request;
- lifecycle coverage for delayed readiness, already-settled activation, mode switch before and during release, hidden settlement, reduced motion, hand replacement, deactivation, context loss, disposal, and manual stale-frame invocation;
- actual-size normal-speed review proving that both sides begin as compact piles, the eventual bottom card visibly remains at the pile anchor, the other four cards emerge from beneath it, the motion reads on one flat table rather than a curved surface, and the final layout is the accepted Phase 0.10 layout;
- current Phase 0.13 card-interaction, Phase 0.14 coin, Phase 0.15 cover, graphics persistence, scale, fallback, and applicable Legacy regressions;
- a generated Modern artifact matching reviewed source and pinned Three.js `0.185.1` with cache identity `0.185.1-match-hand-fan.1`.

Phase 0.16 is complete only when all `AC-P016-*` criteria and required evidence pass and the feature-deployment review accepts the motion at actual application size. Completion does not authorize a gameplay hand mutation, opponent-card reveal, deal algorithm, random hand order, card-selection authority, move submission, cover callback ownership, Motion Studio target, stored entrance profile, or removal of the Legacy hand or cover.

## 13. Target renderer contract

This is a target-state contract beginning in Phase 1. It is not a Phase 0 deliverable; the first increment may use the documented shallow runtime presentation/input gate, Phase 0.10 hand description, Phase 0.11 renderer-local pickup/follow exception, Phase 0.12 always-invalid renderer-local return, Phase 0.13 renderer-local valid-zone/placement preview, and Phase 0.14 renderer-local turn-indicator coin without claiming this semantic contract. Phase 0.15's parallel Outer UI cover projection is governed separately by `FR-GAME-COVER-*`; it neither implements nor becomes part of the future active-match `apply()` contract, and its render completion cannot be treated as an application continuation.

The exact syntax may change to match the legacy JavaScript environment, but the responsibility boundary should be semantic and comparable to:

```ts
interface ActiveMatchRenderer {
  mount(
    host: HTMLElement,
    services: ActiveMatchRendererServices
  ): Promise<void>;

  apply(update: RenderUpdate): Promise<RenderApplyResult>;
  resize(viewport: MatchViewport): void;
  setOperationalState(
    state: "active" | "suspended",
    reason?: string
  ): void;
  debugSnapshot(): RendererDebugSnapshot;
  dispose(): Promise<void>;
}

interface RenderUpdate {
  transitionId: string;
  baseRevision: number | null;
  snapshot: MatchViewSnapshot;
  animationPlan: AnimationPlan | null;
  signal: AbortSignal;
}

interface RenderApplyResult {
  transitionId: string;
  status:
    | "applied"
    | "superseded"
    | "cancelled"
    | "needsReset"
    | "failed";
  acceptedRevision: number | null;
  settledRevision: number | null;
  failureCode?: string;
}
```

`apply()` is the single authoritative scene-application operation. `reset()`, `sync()`, `resume()`, and state-changing animation commands must not become competing ways to mutate the scene.

Every update must obey these rules:

- Snapshot revisions increase monotonically.
- `snapshot.revision` is the only target revision.
- `baseRevision: null` requests an unconditional full reconstruction. It clears renderer-owned scene objects for the prior snapshot and may jump to any newer revision.
- A non-null `baseRevision` must equal the renderer's accepted revision. A mismatch causes `needsReset` without partial mutation; the controller then submits the latest complete snapshot with a null base.
- Revision gaps are valid because every snapshot is complete. An animation plan may span a gap only when it explicitly describes that base-to-target change; otherwise the renderer settles directly on the target snapshot.
- A target revision at or below the already accepted revision resolves as `superseded` and cannot mutate settled state.
- The target snapshot is authoritative; the animation plan only describes how to present the change.
- A stale update or stale completion cannot overwrite a newer applied revision.
- A superseding update aborts, fast-forwards, or replaces older visual work under a documented policy.
- Every application settles within a bounded time, even if animation, assets, or context fail.
- The settled scene must equal the newest accepted snapshot.
- Disposal aborts outstanding work and settles callers exactly once.
- `apply()` resolves only after the target revision has visually settled, fast-forwarded, been superseded, or reached another terminal status.
- Expected abort, supersession, base mismatch, and classified recoverable renderer failures resolve with the corresponding status. An unexpected programming or contract-invariant failure rejects after input is suspended and cleanup begins.
- Debug state exposes accepted and settled revision separately.

Renderer lifecycle is:

```text
unmounted → mounted/suspended → mounted/active
                         ↕
                    suspended
                         ↓
                      disposed
```

`mount()` begins suspended. The controller performs an initial full `apply()`, then sets the renderer active. Suspended state rejects user input and stops nonessential animation while retaining enough state for diagnosis or a full reconstruction. `disposed` is terminal; a disposed renderer cannot become active again.

The renderer should emit semantic intents rather than gain direct access to controller internals:

```ts
type MatchIntent =
  | { type: "selectCard"; cardId: string }
  | { type: "dropCard"; cardId: string; slotIndex: number | null }
  | { type: "cancelCard"; cardId: string; reason: string }
  | { type: "focusCard"; cardId: string | null }
  | { type: "focusSlot"; slotIndex: number | null };
```

Pointer position, raycasting, drag interpolation, camera/world coordinates, and hover smoothing are renderer-internal. The controller receives stable card IDs, slot indexes, and meaningful actions. Canvas and semantic DOM controls must route through the same intent dispatcher so one user action cannot emit duplicate intents.

Animation plans should also be semantic rather than Raphael-shaped:

```ts
type AnimationCue =
  | { type: "liftCard"; cardId: string }
  | { type: "moveCard"; cardId: string; zone: string; slotIndex?: number }
  | { type: "returnCard"; cardId: string; handIndex: number }
  | { type: "revealCard"; cardId: string }
  | { type: "captureFlip"; cardId: string; controlledBy: string }
  | { type: "reorderHand"; playerId: string }
  | { type: "showRule"; ruleId: string }
  | { type: "suddenDeathRedeal" };
```

Score, turn, busy, element bonus, ownership, and other settled values come from the target snapshot. An animation cue may visually emphasize a change, but it cannot provide a second logical value.

The permanent contract must not imitate Raphael's `image`, `rect`, `attr`, `animate`, `getBBox`, `toFront`, `toBack`, or `.node` APIs. A temporary compatibility adapter may be used during extraction, but renderer-specific primitives must not become the final boundary.

## 14. Renderer-neutral view state

The complete renderer-neutral snapshot becomes mandatory in Phase 1 and expands as later parity work exposes additional state. Phase 0.10 adds one deliberately shallow compatibility description containing only current hand presentation data. Phase 0.11 consumes that same description and adds no hold, pointer, selection, or motion field to it; all pickup/follow state remains disposable inside the Modern surface. Phase 0.12 keeps arming, invalid-return motion, counters, and generation state equally private. Phase 0.13 permits nine cloned drop-zone presentation rectangles and validity bits while keeping hover, random roll, placement, and counters private. Phase 0.14 permits one cloned sequenced turn-indicator presentation descriptor while keeping the coin mesh, pose, plan, scheduler, counters, and local profile revision private. Phase 0.15 separately permits one cloned Outer UI game-cover descriptor that is not match view state and cannot enter `MatchViewSnapshot`; Modern cover pose, resources, counters, and readiness remain component-local. None satisfies the complete snapshot contract below, and neither turn-marker `side` nor cover `target` can replace future authoritative match or application lifecycle state.

A renderer-neutral snapshot should be plain data and should contain enough information to rebuild a settled scene:

```ts
interface MatchViewSnapshot {
  schemaVersion: number;
  revision: number;
  matchId: string;
  cards: Array<{
    id: string; // stable match-local gameCardId
    visibleArtKey: string; // only art this player is permitted to see
    faceUp: boolean;
    owner: string;
    controlledBy: string;
    zone: "playerHand" | "opponentHand" | "board";
    handIndex: number | null;
    slotIndex: number | null;
    elementBonus: number;
    playable: boolean;
    selected: boolean;
  }>;
  slots: Array<{
    index: number;
    occupiedBy: string | null;
    elementId: string | null;
    legalTarget: boolean;
    highlighted: boolean;
  }>;
  scores: Record<string, number>;
  activePlayerId: string | null;
  displayedRuleId: string | null;
  interactionLocked: boolean;
  busy: boolean;
  review: {
    active: boolean;
    step: number | null;
  };
}
```

This is illustrative rather than a mandated field-for-field schema. The implemented schema must satisfy these constraints:

- It is versioned.
- It carries a monotonically increasing applied-state revision distinct from the schema version.
- It contains no DOM, Raphael, Three.js, jQuery, texture, mesh, or animation objects.
- Stable match-local card IDs identify cards.
- A visible-art key is a presentation asset variant, not canonical card identity. For a concealed card it may identify only `cardBack`; it must not reveal the hidden face, catalog identity, or ranks.
- Board slots use stable indexes 0 through 8.
- Face state is explicit rather than inferred from an image URL.
- Logical zone and order are explicit rather than inferred from a bounding box.
- Ownership and control color are explicit.
- Interaction state is explicit rather than inferred from `pointer-events`.
- Z-order is derived from semantic zone, order, selection, and transition state.
- The snapshot can reconstruct normal play, resume, review, replay, and Sudden Death.

## 15. Three.js implementation constraints

### 15.1 Dependency and build delivery

- Phase 0 pins Three.js to package version `0.185.1`, whose runtime revision is `185` (`r185`). A later upgrade must follow `NFR-MAINT-005` and this document's change-control process.
- The Modern renderer must have a small isolated production frontend manifest rather than reusing the browser-test package or adding an application-wide framework migration.
- The manifest location, pinned Node/toolchain version, committed lockfile, and clean-checkout install/build procedure must be documented.
- A reproducible `make` target or equivalent repository validation command must build and verify the Modern artifact.
- The generated-artifact policy must choose one explicit delivery model:
  - commit the built artifact under a non-excluded path in `public/`; or
  - add a reproducible frontend build stage before the current Docker image copies `public/`.
- The current PHP Dockerfile does not run Node, and `.dockerignore` excludes the historical `public/optimized` path. The implementation must not assume either path is already a production build pipeline.
- The production artifact must be served under `public/`.
- No runtime import may depend on a public CDN.
- The bundle must comply with the existing Content Security Policy.
- The build must not require `unsafe-eval`.
- The exact ABI between legacy global JavaScript and the compiled Modern module must be documented and kept narrow, such as a single renderer-factory registration.
- Modern code must be lazy-loaded or otherwise excluded from the forced-Legacy startup path.
- A fresh page load with Legacy forced must issue no Modern resource request, import, or preload and must evaluate zero Modern bytes. Switching back to Legacy after Modern was explicitly loaded on that page may retain the idle cached surface.
- Phase 0 originally rendered one blank transparent frame with the pinned Three.js `WebGLRenderer`, without card geometry, texture assets, picking targets, or a continuous animation loop.
- Phase 0.5 adds the first pre-Phase-2 exception to that blank-frame rule: the dedicated lobby-hand factory may create shared 117 by 146 card geometry, up to five card objects, and only the current lobby hand's same-origin face textures. Phase 0.6 additionally permits the shared canonical card-back texture, a side-only lit shared card slab, unlit mipmapped/anisotropic face materials, a calibrated perspective lobby camera, shared analytic-shadow geometry/texture with one independently controlled mesh/material per lobby card, hardware shadow mapping disabled, card-bounded hit testing, and one re-entry lock per active card. Phase 0.7 permits the same bounded shared animation-frame scheduler while at least one entrance or double flip is active, plus the pure seeded destination-driven arrival planner and sampler; its current entrance is implemented but not visually approved. Phase 0.8 permits a separate one-card study factory, deterministic renderer-neutral recipe planner/sampler, and one isolated demand-driven Studio scheduler. Phase 0.9 permits a pure application playbook compiler, five destination-locked intro entries, one origin-locked Gentle Wind exit compiled into five deterministic variants, and reuse of the lobby surface's existing sole scheduler. Phase 0.10 permits the active-match factory to create one shared plane geometry, zero to ten passive current-hand meshes, current visible same-origin hand textures, and a demand-rendered orthographic projection, with no active-match picking target, input listener, or motion scheduler. Phase 0.11 supersedes that last camera/input clause only: it permits a calibrated active-match perspective camera, player-card-bounded picking, one renderer-local hold, pointer-follow state, and one demand-driven frame request while lift/follow settling is active. Phase 0.12 permits arming state, one renderer-local always-invalid return, a local-Z turn, return diagnostics, and generation checks while reusing that same sole pending card frame. Phase 0.13 permits nine plain slot descriptions, one hover-shadow mesh, and one local placement preview. Phase 0.14 additionally permits two circular coin faces, one cylindrical edge, one approved current marker texture, restrained edge lights, one analytic coin shadow, one independent bounded coin frame, one pure turn-coin profile/planner/sampler, and the corresponding exact-space Studio subject. Phase 0.15 additionally permits one concurrent page-lifetime full-stage cover factory, two ten-unit-thick outer-hinged leaves, two approved cover textures, restrained cover-body lights, and one independent bounded cover frame. This is the explicit exception allowing one additional cover WebGL context alongside the mutually exclusive lobby or active-match context. It still permits no opponent pickup, semantic action, gameplay request, turn authority, cover continuation authority, or unconditional animation loop.
- Lazy-load failure before input ownership must follow the initialization-fallback policy.
- Source-map publication, generated-file review, and third-party license-notice policy must be explicit.
- A lockfile, upgrade procedure, and license record must accompany the dependency.

### 15.2 Renderer selection

- The first supported backend is `WebGLRenderer`.
- WebGL 2 capability must be checked separately from the legacy `Modernizr.canvas` gate.
- Experimental WebGPU work requires a separate decision.
- `WebGPURenderer` must not become a silent launch requirement.

### 15.3 Initial scene strategy

The playable active-match scene beginning in Phase 2 should favor clarity and simplicity:

- one constrained camera;
- one scene;
- one shared card geometry where practical;
- distinct front and back materials or a thin geometry with correct face orientation;
- cached current-match textures;
- simple lighting or unlit materials sufficient to preserve card-art color;
- restrained shadows, potentially using a simple receiver or contact-shadow treatment;
- deterministic depth offsets to avoid z-fighting;
- raycasting for picking;
- render invalidation rather than an unconditional idle loop.

The Phase 2 spike must record decisions and visual fixtures for:

- sRGB texture color space and renderer output color space;
- tone mapping, including an explicit no-tone-mapping choice if selected;
- front/back culling and edge treatment;
- alpha and premultiplied-alpha behavior;
- transparent-canvas compositing over the existing board image;
- minification, mipmap, and anisotropy policy;
- antialiasing;
- shadow and light color impact on card art;
- `preserveDrawingBuffer: false` unless a measured requirement justifies otherwise.

Instancing, atlases, complex post-processing, particles, physics, and advanced shadows should be added only after profiling demonstrates a need or a product requirement justifies them.

The Phase 0.5 lobby-hand scene intentionally used an orthographic camera and unlit planes so its screen-space result approximated the established two-dimensional menu layout. Phase 0.6 supersedes that historical lobby baseline with five canonically flat cards; a head-on constrained perspective camera calibrated to preserve the settled layout with 450/900 clip planes; a face-anchored flat-table projection neutralizer that gives every slot the centered perspective silhouette without auxiliary pickup tilt or position-dependent fan; unlit sRGB face materials; mipmapped, anisotropic card textures; side-only lit slabs with 0.2 logical units of face clearance; and independently controllable lift-only analytic contact shadows whose geometry and texture are shared while hardware shadow mapping remains disabled. Phase 0.7 temporarily uses the same transform hierarchy for bounded seeded arrival pitch, yaw, and roll, then restores the exact Phase 0.6 canonical transform before input. Phase 0.8 reproduces that card/camera convention on an isolated one-card study surface so authored motion is evaluated against the production projection rather than an unrelated mock camera. Phase 0.9 compiles the same recipes against the live production anchors and camera for actual lobby intro and exit; it does not serialize or replace those renderer-owned anchors. These lobby decisions remain bounded visual experiments.

Phase 0.11 separately calibrates a constrained perspective camera for the 693 by 500 active-match host. It must reproduce the Phase 0.10 settled hand rectangles on one flat table plane, then use camera-relative lift and bounded local-X/local-Y resistance tilt for one held card only. It must not copy the rejected Phase 0.7 choreography, create slot-dependent resting tilt, move the camera during follow, or silently resolve the final playable camera, card thickness, lighting, shadow, texture, or full choreography decisions assigned to Phase 2.

Phase 0.12 reuses that camera and transform hierarchy. Its return interpolates the visible logical center, inverse-projects the authored projected scale into depth, damps local-X/local-Y tilt, and applies only the approved clockwise local-Z turn before canonical normalization. It must not move the camera, add a card back, introduce a slot raycast, retain a residual roll, or perturb another card.

Phase 0.13 reuses the same flat-table calibration for the hover plane and placement endpoint. Phase 0.14 adds a separate circular coin hierarchy under that exact active-match camera. Its two face circles and cylindrical edge rotate physically around local X, Y, and Z while analytic height supplies perspective depth. A face-anchored off-axis neutralizer may preserve the same position-neutral flat table, but it must not erase the coin's own foreshortening, edge exposure, or shadow response. The Studio coin inset must use the same active-match camera and coordinate mapping rather than the lobby camera.

Phase 0.15 uses a distinct full-stage scene centered on `(377.5, 281)` with the fixed 40-degree perspective and distance in Section 12.18. It contains only two outer-edge pivot groups and their front/body meshes. Its camera and pivots do not inherit the active-match or lobby camera, and its lifecycle does not replace either scene. At zero openness the result must be a position-neutral exact Legacy composition; at positive openness the fixed signed local-Y rotations must move both inner edges toward the camera.

### 15.4 Texture policy

- Only textures needed by the current lobby hand or current match, its card backs, board elements, and immediate effects should be loaded.
- The Phase 0.6 lobby card back is exactly `/images/cards/cardBack.png`. It is shared by all five lobby cards and has no player-color, opponent-color, ownership, captured-state, or purchased-card path variant.
- The Phase 0.14 turn-coin texture is exactly the current descriptor-selected `/images/dime-heads.png` or `/images/dime-tails.png`. The same one texture is used on both coin faces. The renderer must not request a catalog, ownership, player-color, or generated reverse-face variant.
- The Phase 0.15 cover textures are exactly `/images/left.png` and `/images/right.png`. They use their explicit logical rectangles rather than natural image dimensions, are loaded atomically, and remain cover-local. One fulfilled load followed by sibling rejection or timeout must dispose the fulfilled texture before component-local fallback.
- Texture color-space handling must preserve card-art appearance.
- Phase 0.6 front and back orientation must be tested at both same-direction local-X edge passages, at the `-π` upright-back milestone, at the `-2π` upright-front endpoint, and after exact normalization to zero.
- Phase 0.6 lobby card textures must generate mipmaps, use trilinear minification and linear magnification, and set anisotropy to the lesser of four and the renderer capability.
- Texture cache ownership must be explicit.
- Shared textures must use reference counting or equivalent ownership if several meshes use them.
- Disposal must release textures no longer retained by the renderer.
- Texture-load failures must not hang renderer-application promises.
- A required card face, card back, or core renderer asset that fails before input ownership must receive at most one bounded same-origin retry and then trigger Legacy initialization fallback. Phase 0.15 cover assets instead follow their component-local fallback contract and must not demote a healthy lobby or active-match Modern surface.
- An optional decorative asset may be omitted after failure without making the scene unplayable.
- A required asset failure after input ownership must suspend affected input, settle outstanding renderer applications, attempt at most one bounded retry, and then use the controlled-reload/fallback policy.

### 15.5 Coordinate policy

One canonical mapping must cover:

```text
viewport client coordinates
  → application CSS scale
  → 693 × 500 logical renderer coordinates
  → camera projection / ray
  → board plane or card object
```

The mapping must be tested at:

- every supported application scale;
- browser zoom levels selected for compatibility testing;
- device-pixel ratios 1, 2, and a capped higher value;
- pointer positions at all four edges and all nine slots;
- overlapping hand cards;
- a lifted card above the board plane.

For Phase 0.11, the same matrix must additionally test at least one exposed point on every player-hand card, one overlapped topmost-card boundary, the accepted local grab point, the lifted-card plane, pointer departure and re-entry, and stationary convergence. Device-pixel ratio and drawing-buffer scale must not be applied a second time to logical pointer coordinates.

For Phase 0.12, the matrix must additionally carry an armed card from at least one near-hand and one far-board pose back to its exact anchor at application scales `1`, `1.5`, `2`, and `3`. Second-click pointer location must not change the result because no drop-zone mapping occurs. Controlled samples at return elapsed `0`, `150`, and `300` milliseconds must remain identical in logical space across scale and device-pixel-ratio changes.

For Phase 0.13, the matrix must additionally probe just inside and outside all nine half-open slot rectangles and verify exact center settlement at every supported scale.

For Phase 0.14, the matrix must additionally project the initial, player, and opponent coin centers; sample both mirrored endpoint directions; and compare production with the Studio's 693 by 500 inset at application scales `1`, `1.5`, `2`, and `3`. CSS stage offset `(30, 30)`, device-pixel ratio, drawing-buffer ratio, and Studio application scale must not alter logical endpoints, path samples, height, rotations, or settlement.

For Phase 0.15, a separate full-stage matrix must project the exact 755 by 562 frame, both panel rectangles, hinges x `0` and x `754`, the one-pixel seam, and the fixed signed 112-degree endpoints at application scales `1`, `1.5`, `2`, and `3`. Browser zoom, device-pixel ratio, drawing-buffer ratio, child gating, and parent visibility must not alter logical geometry, openness, angle, timing, or layer order. The cover has no pointer-coordinate mapping because it accepts no input.

The logical coordinate space remains 693 by 500 regardless of CSS application scale. `#content-wrapper` remains the owner of the application scale.

The provisional drawing-buffer ratio is:

```text
effectiveBufferRatio = min(devicePixelRatio × applicationScale, 3)
```

At the provisional cap, the drawing buffer may not exceed 2079 by 1500, or 3,118,500 pixels, without a documented Phase 2 budget change. Browser zoom affects the browser-reported pixel ratio and must not be multiplied a second time. The spike must compare sharpness at scale 3 against GPU cost and may revise the ratio or cap through this document's change-control process.

The Phase 0.15 full-stage cover uses the same ratio formula and cap value but a distinct 755 by 562 logical size. Its maximum drawing buffer is therefore 2265 by 1686, or 3,818,790 pixels. This bounded additional buffer and context are permitted only for the parallel cover projection and must be idle or suspended whenever no cover motion requires a frame.

## 16. Nonfunctional requirements

### 16.1 Performance

Performance evidence must use two named deterministic fixtures:

- **GM-P100** is the worst representative real match: all ten match cards represented, nine slots, maximum relevant overlap, scores, rule messaging, elements/bonuses, and the most expensive approved simultaneous transition.
- **GM-P200** is a synthetic resilience scene with twice the normal card-object count. It does not expand supported game rules; it detects fragile rendering and picking behavior.

**NFR-PERF-001** — The Three.js spike must record reference hardware, browser version, viewport, device-pixel ratio, scene state, and measurement method.

**NFR-PERF-002** — On the agreed reference profile, GM-P100 must have a presented-frame time at or below 16.7 ms at the 95th percentile and 33.3 ms at the 99th percentile during the named transition. On the agreed modest profile, its 95th percentile must be at or below 33.3 ms.

**NFR-PERF-003** — Pointer event timestamp to first renderer-presented visual response must be at most 50 ms at the 95th percentile on the reference profile. The spike must document the browser instrumentation used to identify that presented response.

**NFR-PERF-004** — Once all visible transitions and approved ambient effects settle, the Modern renderer must stop requesting continuous frames.

**NFR-PERF-005** — Active-match drawing-buffer ratio and dimensions must obey the provisional formula and 3,118,500-pixel maximum in Section 15.5 unless Phase 2 approves and records a replacement budget. Separately authorized full-stage surfaces use the same ratio cap with their documented logical dimensions; the Phase 0.15 cover maximum is governed by `NFR-PERF-020`.

**NFR-PERF-006** — Only one active WebGL context may be owned by the active-match renderer.

**NFR-PERF-007** — The Modern incremental JavaScript budget is provisionally 200 KB under `gzip -9`, measured over the exact served production JavaScript needed to construct the renderer, including mandatory retained license comments. Separately served and unfetched source maps or notices, and card art, are excluded. The spike must replace or approve this provisional budget.

**NFR-PERF-008** — On a fresh page load with Legacy forced and no earlier Modern selection in that page lifetime, there must be zero Modern resource requests, module imports, preload hints, and evaluated Modern bytes. A cached request with zero transferred bytes does not satisfy this requirement.

**NFR-PERF-009** — A typical match must not load the full catalog of card textures.

**NFR-PERF-010** — Performance optimization must not obscure card information or create divergent game behavior.

**NFR-PERF-011** — Provisional GM-P100 scene readiness is 500 ms with decoded required textures already cached and 1,500 ms from a cold same-origin texture load on the reference profile, measured from accepted snapshot to first complete settled frame. Phase 2 must approve or revise these values.

**NFR-PERF-012** — GM-P200 must preserve correct picking and input at a presented-frame 95th percentile of at most 33.3 ms on the reference profile.

**NFR-PERF-013** — During the Phase 0.6 lobby spike, each accepted normal-motion click has its own 2,450-millisecond nominal timeline and must settle within its 3,000-millisecond hard deadline. Up to five cards may animate concurrently, but the lobby surface may own no more than one pending animation-frame request; that shared callback must batch all active cards and the renderer must return to zero pending requests after the final active card settles. The lobby renderer must perform no hardware shadow-map pass and may render at most one analytic contact-shadow mesh per lifted card, sharing their geometry and texture. Idle lobby observation before and after all effects must show no scheduler or shadow activity attributable to the flip.

**NFR-PERF-014** — A Phase 0.7 entrance batch must settle all five cards within 2,000 milliseconds of its command-bar reveal timestamp, catch up across renderer/texture readiness rather than restarting, share the existing sole pending animation-frame request, perform no hardware shadow-map pass, and return to zero frame and shadow activity after settlement. Seed generation and plan creation occur once per presentation rather than during frame sampling.

**NFR-PERF-015** — The Phase 0.8 Studio may own at most one pending animation-frame request. Playback, scrubbing, and editing may render on demand; paused, settled, covered, and closed states must own no pending frame. Playback-rate selection changes review timing only and must not resample recipe randomness or alter the recipe duration.

**NFR-PERF-016** — A Phase 0.9 intro or exit batch must plan its shared and per-card seeded values once, advance every active card through the lobby surface's one pending animation-frame request, and return to zero frame and shadow activity after its terminal state. A command exit must not extend navigation beyond the lesser of its validated batch deadline plus cleanup margin and the configured fail-open cap. Studio production preview may add only its documented bounded observation hold.

**NFR-PERF-017** — Phase 0.11 may own at most one active-match animation-frame request while pickup, positional follow, or tilt damping is unconverged. Pointer input must not allocate card geometry, material, texture, raycaster, listener, or another frame scheduler per event. A converged held pose must return to zero pending frames, and the 95th-percentile pointer-event-to-presented-response measurement should remain within `NFR-PERF-003`.

**NFR-PERF-018** — Phase 0.12 invalid return must reuse the Phase 0.11 active-match scheduler and own at most one pending callback during its fixed 300-millisecond interval. It must allocate no geometry, material, texture, raycaster, listener, drop target, or scheduler per second click or frame. Normal completion, reduced-motion completion, ignored input, cancellation, failure, and disposal must return pending-frame count to zero.

**NFR-PERF-019** — Phase 0.14 turn-coin motion may own at most one pending coin animation-frame callback in addition to the retained bounded card scheduler. It must allocate no geometry, material, texture, light, shadow, listener, or planner per sampled frame. The default transition lasts 760 milliseconds; every normalized profile is bounded to 2,600 milliseconds before any separately validated instance delay. Normal completion, reduced-motion completion, duplicate rejection, supersession, cancellation, failure, suspension, and disposal must return the coin pending-frame count to zero. Paused or settled Studio coin preview and a settled production marker must own no frame.

**NFR-PERF-020** — Phase 0.15 may own exactly one additional full-stage cover canvas and WebGL context concurrently with the mutually exclusive lobby or active-match Modern context. Cover motion may own at most one independent pending animation-frame callback and must allocate no GPU resource, geometry, material, texture, light, listener, scheduler, or plan per sampled frame and retain no unbounded per-frame allocation. The bounded ephemeral immutable plain pose returned by the shared pure sampler is permitted. Every non-settled transition lasts exactly 2,000 milliseconds; required cover texture readiness must use one bounded timeout no longer than 6,000 milliseconds. Normal completion, reduced-motion completion, duplicate/stale rejection, supersession, Graphics-mode suspension, visibility suspension, component-local failure, replacement, and disposal must return the cover pending-frame count to zero. Settled, parent-hidden, Legacy-selected, suspended, failed, and disposed covers own no idle frame. The cover drawing buffer obeys the ratio cap in Section 15.5 and may not exceed 2265 by 1686 pixels without an explicit budget revision.

**NFR-PERF-021** — Phase 0.16 hand entrance may own at most one hand-entrance animation-frame callback in addition to the retained bounded card and coin schedulers. It must plan once per accepted entrance, allocate no GPU resource, geometry, material, texture, raycaster, listener, or scheduler per frame, and retain no unbounded sample history. Bounded ephemeral plain pose objects from the shared sampler are permitted. The default five-card batch lasts exactly 785 milliseconds. Waiting, completed, reduced, cancelled, hidden, suspended, failed, replaced, and disposed entrances own no frame.

### 16.2 Reliability and cleanup

**NFR-REL-001** — No renderer exception may terminate the match controller without a controlled error or fallback path.

**NFR-REL-002** — Fifty repeated mount/dispose cycles must not produce duplicate semantic actions.

**NFR-REL-003** — After 50 mount/dispose cycles and a five-second settle window, application-owned canvases, active animation-frame requests, registered listeners/observers, renderer registry references, and emitted semantic actions must return to their baseline counts. WebGL-context and retained-heap evidence must use a documented Chromium/CDP diagnostic profile with warmed runs, forced garbage collection, and `forceContextLoss()` on disposal when the extension is available. Browser-managed context destruction is diagnostic rather than a cross-browser exact-count gate. Phase 2 must set a numerical retained-growth tolerance before beta.

**NFR-REL-004** — Renderer-application promises must settle exactly once under normal completion, reduced motion, cancellation, supersession, disposal, texture failure, and context loss.

**NFR-REL-005** — A fallback must preserve the server-authoritative match and must not submit a move.

**NFR-REL-006** — Background/foreground and visibility changes must not leave the renderer accepting input against stale state.

**NFR-REL-007** — A P0 renderer defect is one that corrupts authoritative game state, duplicates a move, exposes concealed game information, traps the application without a Legacy recovery route, or makes both modes unusable. A P1 renderer defect breaks a complete declared match flow, renderer fallback, required input method, or required accessibility flow without corrupting authoritative state.

**NFR-REL-008** — GM-P100, GM-P200, teardown, and fallback tests must declare their timeout and settle conditions rather than rely on arbitrary sleeps.

**NFR-REL-009** — Fifty Phase 0.6 lobby animations, including overlapping animations on different cards, rejected repeat activations on the same active card, and surface-wide cancellation while cards occupy different named phases, must leave the lobby at its baseline listener, frame-request, per-card-lock, card-object, per-card-shadow-mesh/material, shared-shadow-geometry/texture-reference, other material/geometry, canvas, and WebGL-context ownership counts.

**NFR-REL-010** — Fifty Phase 0.7 lobby presentations spanning normal completion, reduced motion, cancellation, repeated same-token delivery, and new-token replay must leave no stale pending presentation, animation, frame request, card lock, visible shadow, late readiness gate, listener, canvas, texture, material, geometry, or WebGL-context owner.

**NFR-REL-011** — Fifty Phase 0.8 Studio cycles spanning open, parameter editing, drag, scrub, play, loop, reset, valid import, invalid import, session restore, context loss, and close must return Studio DOM, listeners, animation frames, playback tokens, renderer references, WebGL contexts, textures, materials, and geometry to their baseline counts. The same evidence must show unchanged Graphics local storage, requested/effective mode, live lobby resource identity, application request count, and authoritative state.

**NFR-REL-012** — Fifty Phase 0.9 cycles spanning intro, Gentle Wind exit, locked and unlocked seeds, every participating command, repeated ignored clicks, Tutorials Back, Apply & Preview from Legacy and Modern, valid and invalid whole-playbook import, reduced motion, cancellation, context loss, and forced watchdog expiry must return pending-command tokens, continuations, watchdog timers, preview restoration state, animation frames, card locks, shadows, listeners, renderer resources, and WebGL contexts to baseline. Every accepted command continuation must be observed exactly once and the stored Graphics preference must remain unchanged by preview.

**NFR-REL-013** — Fifty Phase 0.11 cycles spanning every player-card index, overlapping hits, empty/opponent rejection, ordinary and reduced motion, all supported application scales, stationary holds, repeated ignored clicks, pointer departure, hand revision, selected-card removal, visibility loss, Legacy toggles, context loss, surface replacement, and disposal must return held records, generation tokens, input handlers, raycasting targets, pending frames, transient transforms, canvases, textures, materials, geometry, and WebGL-context ownership to baseline. The same evidence must show zero gameplay intents and requests and unchanged Legacy/card/controller identity.

**NFR-REL-014** — Fifty Phase 0.12 cycles spanning unarmed second clicks, every armed second-click location class, repeated input during return, ordinary and reduced motion, all supported application scales, exact completion, immediate repick, hand revision, selected-card removal, visibility loss, Legacy toggles, context loss, surface replacement, and disposal must return hold generations, return records, input locks, pending frames, transient transforms, shadows, render order, canvases, textures, materials, geometry, and WebGL-context ownership to baseline. At least one cycle must manually invoke a cancelled callback after a newer hold exists and prove it inert. Every cycle must show zero drop zones, semantic actions, gameplay/Legacy mutations, and requests.

**NFR-REL-015** — Fifty Phase 0.14 cycles spanning first snapshots at all three descriptor sides, both transition directions, duplicates, stale/same-target notifications, normal and reduced motion, mid-flight supersession, simultaneous card/coin motion, visibility loss, Legacy toggles, descriptor removal, texture failure, context loss, surface replacement, Studio open/edit/apply/import/export/reset/close, storage denial, and disposal must return coin plans, generations, frames, textures, face/edge/shadow materials, geometry references, Studio subject state, listeners, canvases, and WebGL-context ownership to baseline. At least one cycle must invoke a cancelled frame and late texture completion after a newer sequence and prove both inert. Every cycle must show unchanged Phase 0.13 card behavior, Graphics/lobby storage identity, Legacy marker/callback behavior, game state, semantic-action count, and request count.

**NFR-REL-016** — Fifty Phase 0.15 cycles spanning initial closed state, opening, closing, already-targeted duplicate calls, close-during-open, open-during-close, both mid-motion reversal directions, delayed descriptor delivery, delayed readiness, hidden-tab catch-up, Legacy/Modern toggles, every application scale, normal and reduced motion, synchronous construction failure, malformed descriptor, each texture failing independently, one texture succeeding before the other rejects or times out, late partial completion, rendering error, context loss, component replacement, coordinator teardown, and disposal must return cover plans, generations, frames, timeouts, pending loads, visibility/context listeners, partial and complete textures, face/body materials, both leaf geometries, lights and targets, canvases, and cover WebGL-context ownership to baseline. Fulfilled partial textures must be disposed when their sibling fails. At least one cycle must manually invoke a cancelled frame and late texture completion after a newer sequence and prove both inert. Every cycle must preserve Legacy cover identity, callback counts/timing/order, parent show/hide and pointer shielding, requested/effective Graphics state, healthy lobby/active surface identity, game state, navigation, semantic-action count, storage, and request count.

**NFR-REL-017** — Fifty Phase 0.16 cycles spanning zero-to-five-card and asymmetric hands, waiting piles, ordinary completion, delayed readiness, already-settled activation, Legacy/Modern changes before and during release, hidden settlement, reduced motion, hand replacement, deactivation, context loss, fallback, reconstruction, and disposal must return entrance plans, generations, frames, input locks, transient transforms, shadows, render order, card-study ownership, canvases, textures, materials, geometry, and WebGL-context ownership to baseline. At least one cycle must invoke a cancelled callback after terminal completion and prove it cannot restart the same sequence or change pose. Every cycle must preserve Legacy hand/cover identity and callbacks, canonical hand data, controller/game/turn state, semantic actions, storage, navigation, and requests.

### 16.3 Security and privacy

**NFR-SEC-001** — Modern assets and scripts must be same-origin.

**NFR-SEC-002** — The implementation must preserve the application's Content Security Policy and document any proposed policy change before it is made.

**NFR-SEC-003** — No new `eval`, `new Function`, dynamic remote script, or equivalent code path may be introduced.

**NFR-SEC-004** — Client rendering remains untrusted presentation. Existing server-side request validation must remain unchanged.

**NFR-SEC-005** — Renderer diagnostics must not transmit card or match data externally.

**NFR-SEC-006** — External telemetry requires a separate privacy and product decision.

**NFR-SEC-007** — The turn-indicator descriptor and local profile must remain same-origin presentation data. The applied profile and Studio draft must not be transmitted, attached to an account, or used to expose turn, card, or match information beyond what the current user can already see.

**NFR-SEC-008** — The Phase 0.15 descriptor, textures, diagnostics, and failure information must remain same-origin presentation data. Only `/images/left.png` and `/images/right.png` are approved cover texture URLs. No cover profile, descriptor, pose, callback, timing record, failure record, or diagnostic may be sent to a server, attached to an account or match, stored under a new browser key, used as a navigation or request payload, or expose information beyond the already visible Legacy cover.

### 16.4 Compatibility

**NFR-COMP-001** — Modern Chromium is the initial browser target, consistent with the current browser-test target.

**NFR-COMP-002** — A tested Modern-default browser/OS/GPU matrix must be written before Modern becomes the default. This is a local archival/test compatibility statement, not a new public support commitment.

**NFR-COMP-003** — Unsupported WebGL 2 configurations must remain able to use Legacy.

**NFR-COMP-004** — Modern must work with application scale 1, 1.5, 2, and 3.

**NFR-COMP-005** — Browser zoom and high-DPI behavior must be documented and tested.

**NFR-COMP-006** — Mobile layout and touch-only support remain outside the initial parity gate, consistent with the current [known limitations](../KNOWN-LIMITATIONS.md), but the renderer contract must not prevent later support.

### 16.5 Maintainability

**NFR-MAINT-001** — Renderer-specific objects must remain inside their renderer implementations.

**NFR-MAINT-002** — No new game-rule branch may depend on `legacy` or `modern`.

**NFR-MAINT-003** — Shared conformance tests must exercise both renderers.

**NFR-MAINT-004** — Public renderer methods, semantic actions, snapshots, and transition completion rules must be documented.

**NFR-MAINT-005** — Dependency upgrades require the same conformance, visual, performance, and fallback evidence as an initial release.

**NFR-MAINT-006** — Temporary Raphael-compatibility shims must be identified and assigned a removal phase.

**NFR-MAINT-007** — The Phase 0.14 turn-coin profile, planner, and sampler must remain in a renderer-neutral module with no DOM, jQuery, Raphael, Three.js, storage, game-controller, or network dependency. Production and Studio must import the same API rather than duplicate motion math.

**NFR-MAINT-008** — The Phase 0.15 game-cover planner and sampler must remain in one renderer-neutral module with no DOM, jQuery, Raphael, Three.js, storage, clock, random, game-controller, continuation, or network dependency. Production and pure tests must import the same API. The `gh.cover` descriptor adapter, graphics coordinator, cover surface, and generated facade must remain separate owners so renderer objects cannot enter Legacy state and Modern cannot acquire callback authority.

**NFR-MAINT-009** — The Phase 0.16 hand-entrance planner and sampler must remain in one renderer-neutral module with no DOM, jQuery, Raphael, Three.js, storage, clock, frame scheduler, random, game-controller, cover-callback, or network dependency. Production and pure tests must import the same API. The Legacy settlement adapter, graphics coordinator, active-match surface, and generated facade remain separate owners.

## 17. Behavior and parity matrix

In the Phase 0 through Phase 0.16 column, “not rendered” or “disabled” means not rendered or operable by Three.js on the active-match surface except for the explicitly identified Phase 0.11 renderer-local pickup/follow study, Phase 0.12 always-invalid renderer-local return, Phase 0.13 valid-zone/placement preview, Phase 0.14 turn-indicator projection, and Phase 0.16 renderer-local entrance fan. The corresponding Legacy match objects remain live and synchronized behind the opacity and pointer gate so they can be revealed immediately. Lobby motion remains decorative rather than playable input. Phase 0.13 may describe and hover the nine empty/currently valid rectangles and place one local projection; Phase 0.14 may mirror one already-decided turn-marker sequence as a local 3D coin. Phase 0.15 separately mirrors the Legacy game cover as a full-stage decorative projection while Legacy retains continuation authority. Phase 0.16 may transiently pile and expand the two Modern hands only after observing that Legacy cover's actual open settlement. Modern still has no semantic selection, committed board state, turn authority, application continuation authority, turn progression, or move submission.

| Capability | Legacy requirement | Phase 0 through 0.16 Modern preview | Playable Modern requirement |
|---|---|---|---|
| Lobby/main-menu hand | Five non-interactive Raphael card faces beneath the command bar; commands remain immediate | Phase 0.5 renders up to five Three.js card faces; Phase 0.6 permits per-card lift/back/front/settle effects; Phase 0.7's entrance remains rejected; Phase 0.9 provides five fixed-anchor intros, one seeded five-instance Gentle Wind exit, command waits with fail-open continuation, and Tutorials Back intro replay | Remains a separate decorative menu projection |
| Motion Studio | Not present; Legacy state remains unchanged beneath it | Phase 0.8 provides one isolated, non-authoritative authoring surface; Phase 0.9 binds six lobby targets to one local playbook; Phase 0.14 adds one exact-match-space turn-coin target backed by a separate local profile, without changing stored Graphics preference; Phase 0.15 adds no cover target or profile | May remain an internal authoring tool; it is not match input |
| Game cover | Two page-lifetime Raphael image panels own parent visibility, pointer shielding, `isopen`, animation, callbacks, and application flow | Phase 0.15 adds an independent full-stage two-leaf Three.js projection with exact closed art, outer-edge hinges, fixed 112-degree open pose, and deterministic 2,000-millisecond cubic-in/out motion; Legacy remains mounted, animated, and solely authoritative | May remain a parallel Outer UI projection; it is not part of the active-match renderer contract |
| Board frame | Unchanged | Visible | Preserved or deliberately redesigned later |
| Player hand | Fully functional | Phase 0.10 renders the current zero-to-five-card hand at exact Legacy coordinates; Phase 0.11 permits one renderer-local player card to lift and follow the pointer; Phase 0.12 can return it; Phase 0.13 can leave one inert local projection over a valid slot until reset; Phase 0.16 initially piles and fans it after cover settlement with input locked until exact canonical settlement | Rendered and interactive |
| Opponent hand | Fully functional | Phase 0.10 renders the current zero-to-five-card hand at exact Legacy coordinates and preserves the server-resolved Open/Closed art; Phase 0.16 initially piles and fans it after cover settlement without adding input or revealing concealed art | Correct open/closed state |
| Existing board cards | Fully functional | Not rendered | Rendered from snapshot |
| Nine board slots | Fully functional | Phase 0.13 consumes exact plain rectangle descriptions and shows only one currently hovered valid slot as a 30-percent black shadow; it renders no persistent grid or authoritative occupancy | Correct layout and hit testing |
| Scores | Fully functional | Not rendered | Semantically identical values |
| Turn marker | Fully functional | Phase 0.14 mirrors the explicit Legacy sequence, target, visibility, and selected 41-pixel dime asset as one renderer-local circular 3D coin; first snapshot snaps, later target sequences animate, and no result controls the turn | Clear active-player state from renderer-neutral authority |
| Rule banner | Fully functional | Not rendered | Equivalent information and sequencing |
| Element icons/bonus | Fully functional | Not rendered | Equivalent state and readable feedback |
| Card selection | Fully functional | No semantic selection; Phases 0.11 through 0.13 use only disposable renderer-local hold, return, hover, and placement-preview state | Semantic input and lift |
| Movement | Fully functional | Phase 0.11 supports grab-offset pointer follow and lift; Phase 0.12 adds invalid return; Phase 0.13 adds a 300-millisecond cubic-out reverse-pickup placement preview | Scale-correct world mapping |
| Valid drop | Fully functional | Phase 0.13 provides one renderer-local visual placement at the exact slot center with bounded residual roll; no semantic drop, board mutation, turn change, or request | One request and correct placement |
| Invalid drop | Fully functional | Phase 0.12 return remains the Phase 0.13 fallback outside a currently valid zone; it is still renderer-local and request-free | No request and deterministic return |
| Basic capture | Fully functional | Disabled | Correct result presentation |
| Same / Same Wall | Fully functional | Disabled | Correct result presentation |
| Plus | Fully functional | Disabled | Correct result presentation |
| Combo | Fully functional | Disabled | Correct resolved sequence |
| Closed reveal | Fully functional | Disabled | True front/back reveal |
| Sudden Death | Fully functional | Disabled | Snapshot-based redeal and restored input |
| Review/replay | Fully functional | Modern is non-playable; hidden Legacy state may continue synchronizing | Renderer-neutral reconstruction |
| Tutorials | Fully functional | Modern is non-playable; hidden Legacy state may continue synchronizing | Same selection and parity contract |
| Dialog dimming | Fully functional | Remains DOM-owned | Remains DOM-owned |
| Application scaling | Fully functional | Host remains aligned; pickup/follow, invalid return, Phase 0.13 slot hit testing and exact placement, and Phase 0.14 coin endpoints/path use the same logical coordinates at scales 1, 1.5, 2, and 3; Studio coin preview uses the exact match inset; Phase 0.15 inherits scale once while preserving full-stage cover geometry and hinges | Full interaction and visual parity |
| Reduced motion | No new regression | Phase 0.6 uses a bounded back/front proof with no lift or continuous rotation; Phase 0.7 commits arrivals directly at their destinations; Phase 0.8 opens paused and requires explicit full-motion preview; Phase 0.9 commits intro/exit terminal states and releases command flow exactly once; Phase 0.11 immediately enters the held pose and follows without velocity tilt; Phase 0.12 commits return immediately; Phase 0.13 commits the exact sampled placement endpoint immediately; Phase 0.14 snaps an accepted turn sequence to its latest exact endpoint; Phase 0.15 snaps only the Modern cover visual while Legacy timing and callbacks remain unchanged; Phase 0.16 snaps both hands to their exact canonical vertical poses with no fan frame | Required before default |
| Context loss | Not applicable | Lobby/active loss follows the existing effective-Legacy policy; Phase 0.15 cover-only loss reveals its Legacy child locally without demoting a healthy Modern lobby or match surface | Recover or fall back |
| Main-menu escape | Fully functional | Must remain available | Must remain available |

## 18. Phased delivery plan

### Phase 0 — Preference, selection seam, and inert preview

Deliver the exact scope and acceptance criteria in Section 12.

Exit gate:

- Legacy remains fully playable and is the default.
- Modern lazily mounts one empty, inert Three.js `0.185.1` (`r185`) surface while the live Legacy papers remain safely gated behind it.
- The user can return to the identical current Legacy state immediately without reload or reconstruction.
- Existing Legacy browser tests pass.

### Phase 0.5 — Non-interactive lobby-hand rendering

Deliver the exact scope and acceptance criteria in Section 12.8.

Exit gate:

- Modern renders the current five-card lobby hand in the 755 by 562 main-menu coordinate space with the pinned Three.js bundle.
- The cards are static, decorative, pointer-inert, and sourced from plain menu card descriptions rather than active-match or Raphael state.
- Only individually marked Raphael hand-card elements are hidden after the complete Modern frame is ready.
- The Raphael command bar and the Play, Shop, and Tutorials controls remain visible and usable.
- Runtime Legacy return and initialization, texture, and context-loss fallback reveal the intact original lobby hand.
- The active-match Modern surface remains blank and non-playable.

### Phase 0.6 — Modern lobby-card double-flip spike

Deliver the exact scope and acceptance criteria in Section 12.9.

Exit gate:

- Clicking one ready Modern lobby card produces the ordered lift, canonical back, original front, and exact settlement sequence.
- Clicking another settled card while one or more cards are active starts that card immediately, while clicking an already-active card is ignored without queuing until its own settlement.
- The canonical `/images/cards/cardBack.png` texture is ready before interaction and is shared without color or purchased variants.
- A calibrated flat-table perspective projection preserves five canonically flat settled cards and gives the outer-left, center, and outer-right slots the same centered normalized silhouette without pickup tilt or position-dependent fan, while unlit sRGB faces, stable mipmapped/anisotropic texture filtering, a side-only lit slab, and independent per-card analytic contact shadows make each same-direction local-X full turn visibly three-dimensional without darkening or motion artifacts.
- Per-card re-entry locks prevent only same-card overlap or queuing; independent cards may animate concurrently.
- Every animation follows its own 2,450-millisecond nominal timeline and 3,000-millisecond hard deadline through one shared bounded frame scheduler, which leaves no idle frame pending after the final active card settles.
- Legacy selection, lobby hide, hand replacement, surface replacement/disposal, and context loss atomically cancel and settle every active animation and cannot be reversed by a late callback.
- Reduced motion presents a bounded back/front proof without lift or continuous rotation.
- The effect changes no authoritative or menu state, emits no game intent, and issues no network request.
- The complete Legacy lobby route remains untouched, and the active-match Modern surface remains blank and non-playable.

### Phase 0.7 — Seeded lobby-card arrival choreography

Deliver the exact scope and acceptance criteria in Section 12.10.

Current status: the deterministic planner, lifecycle, and safety work was deployed, but the actual-size normal-speed review rejected the result as predominantly flat sliding from the left. The visual exit gate below is unmet. Phase 0.7 must not be reported as an approved human-scatter baseline.

Exit gate:

- The menu-show event that begins the black bar reveal creates one presentation token and supplies it with the plain lobby destinations.
- The reusable `casual-drop-left` planner produces deterministic per-card variation without hard-coded lobby slots or per-frame randomness.
- Reveal-relative poses are rendered before the Modern hand is revealed; prompt readiness shows one compact left-hand packet released as an irregular two-burst human scatter with five distinct gestures, while delayed readiness catches up without exceeding the 1,500-millisecond implementation deadline.
- Real-time review at actual lobby size confirms that the first impression is a player casually dropping and scattering cards, not a spatial fill order, UI scale-in, metronomic deal, or collision-avoidance pattern.
- Dense seeded regression sampling keeps projected overflight depth-readable and prevents table penetration without forcing cards into separate screen lanes.
- Post-contact translation is one continuously decelerating curve across slap and slide: there is no stop/relaunch, bounce, oscillation, overshoot, end jiggle, or rendered vertex/edge perspective factor above 1.09.
- Every completion and cancellation restores the exact Phase 0.6 flat destination, ordinary render order, hidden shadow, and idle scheduler.
- Reduced motion skips entrance travel and returns an immediately settled, clickable hand.
- Repeated same-token delivery cannot replay the entrance, while a later menu presentation can.
- The Legacy lobby and blank active-match Modern surface remain unchanged.

### Phase 0.8 — One-card Motion Studio authoring workbench

Deliver the exact scope and acceptance criteria in Section 12.11.

Exit gate:

- `Motion Studio…` opens inside the existing application frame and returns to the exact prior lobby view.
- Opening and closing from both Legacy and Modern leaves the stored Graphics preference and requested/effective modes unchanged.
- One isolated Three.js surface renders the production-faithful lobby card model and owns no lobby or match objects.
- The complete travel, elevation, perspective/authored scale, flip, three-axis rotation, contact, skid, shadow, thickness, and timing control set edits one renderer-neutral draft.
- Start and landing direct manipulation remains synchronized with numeric coordinates, direction, and distance.
- Replay, pause, frame steps, four playback speeds, looping, milestone timeline, exact scrubbing, and debounced Auto Replay use one bounded scheduler and leave no idle frame.
- Gentle Drop, Casual Toss, and Energetic Scatter provide distinct editable starting points; the deployed comparison is labeled `Unapproved current lobby`.
- Guarded same-tab session persistence restores the draft and workbench state without touching Graphics storage.
- Canonical JSON export/import round-trips without semantic or sampled-pose drift; invalid import is atomic and local.
- Reduced-motion entry, keyboard operation, focus restoration, initialization/context-loss failure, and 50-cycle resource cleanup pass.
- The Studio changes no game, account, server, protocol, hand, navigation, production preference, or production animation state.
- At the Phase 0.8 boundary, a candidate recipe can leave the phase only as an explicitly reviewable artifact. Phase 0.9 is the later recorded five-card lobby integration approval; consumers beyond its declared lobby targets remain prohibited.

### Phase 0.9 — Application-bound lobby motion playbook

Deliver the exact scope and acceptance criteria in Section 12.12.

Exit gate:

- Motion Studio exposes five independent fixed-anchor intro targets and one shared Gentle Wind exit target.
- The complete versioned playbook persists locally and round-trips through canonical whole-playbook export/import.
- Intro compilation resolves runtime-owned anchors and cannot serialize or alter their final positions.
- One exit seed produces a shared gust plus five stable bounded variants with distinct fully offscreen lower-left endpoints.
- Apply & Preview invokes the real lobby production path and restores the prior Graphics preference from both Legacy and Modern.
- Play, Shop, Tutorials, Replay, and Deck wait for the same generic Modern exit, ignore extra clicks while pending, and continue exactly once.
- Planning, rendering, callback, context, and watchdog failures fail open to the original command.
- Tutorials Back restores the main commands and replays the current intro in Modern without making animation a navigation dependency.
- Reduced motion, cancellation, persistence failure, context loss, and repeated lifecycle cleanup pass.
- Legacy startup, lobby presentation, commands, and Graphics persistence remain unchanged.
- Human actual-size normal-speed review records the visual decision for both the five-card intro and Gentle Wind exit; Phase 0.7 remains rejected.

### Phase 0.10 — Passive active-match hand projection

Deliver the exact scope and acceptance criteria in Section 12.13.

Exit gate:

- A plain compatibility description projects the current player and opponent hands without carrying or reading Raphael objects.
- Modern renders zero to five current cards per side at the exact 693 by 500 Legacy logical coordinates and deterministic stack order.
- Current server-permitted visible art is used without revealing a Closed opponent face.
- The active surface is transparent, demand-rendered, pointer-passive, raycast-free, and idle without a frame loop.
- Required texture or context failure restores the intact live Legacy match without a partial Modern hand or gameplay request.
- Repeated runtime toggles reveal the same Legacy objects and create no duplicate Modern canvas or resources.
- Board cards, slots, scores, turn marker, rules, elements, bonuses, effects, and gameplay interaction remain unimplemented and clearly communicated.
- Static, browser or controlled-harness, generated-bundle, Graphics persistence, lobby, and applicable Legacy regressions pass.

### Phase 0.11 — Renderer-local active-match pickup/follow study

Deliver the exact scope and acceptance criteria in Section 12.14.

Exit gate:

- The active-match perspective camera reproduces every Phase 0.10 settled hand rectangle on one visually flat, position-neutral table plane.
- A primary click picks only the visually topmost eligible player card and establishes exactly one renderer-local hold.
- Pickup brings that card above both hands and reaches the single Legacy-equivalent `1.075` projected scale without compounded enlargement.
- Pointer follow preserves the accepted local grab point at application scales 1, 1.5, 2, and 3 without requiring a pressed mouse button.
- Filtered logical pointer velocity produces a plainly visible trailing local-X/local-Y response of at least 4 degrees per axis on the canonical brisk diagonal trace, remains within 10 degrees per axis, and damps to zero without jitter, overshoot, residual rotation, or an idle frame.
- Opponent, empty, held-card, other-card, and future-slot clicks cannot replace or drop the held card and never queue work.
- Modern creates no drop zones, legal-target state, return path, semantic action, game mutation, Legacy mutation, or network request.
- Reduced motion immediately establishes the stable held pose and preserves direct pointer follow without velocity tilt.
- Every lifecycle, revision, visibility, failure, switch, and disposal boundary clears the hold and pending frame atomically and restores the intact live Legacy route where applicable.
- Diagnostics expose only permitted plain study state, show zero gameplay/request authority, and agree with the generated bundle and loader cache identity `0.185.1-match-pickup.2`.
- Static, controlled-clock, browser or controlled-harness, actual-size visual, lifecycle, generated-bundle, Phase 0.10 secrecy/fallback, Graphics persistence, lobby, and applicable Legacy regressions pass.

### Phase 0.12 — Renderer-local second-click invalid return

Deliver the exact scope and acceptance criteria in Section 12.15.

Exit gate:

- Phase 0.11 pickup, follow, grab-offset, resistance, flat-table, secrecy, and zero-authority contracts remain intact.
- Pickup begins unarmed; an early second click is ignored and never queued; the hold arms only at full depth after the 300-millisecond lift interval, or synchronously under reduced motion, without waiting for independent pointer-follow damping to converge.
- Every armed second primary click begins the same always-invalid renderer-local return regardless of pointer location, with zero Modern drop zones and no target query.
- Normal return lasts 300 milliseconds, samples cubic-out `1 - (1 - t)^3`, makes one clockwise screen-space `-2π` local-Z turn, and has no first-frame jump.
- Completion restores exact canonical position, depth, projected scale, local-X/local-Y/local-Z rotation, render order, shadow, held flag, and pickup eligibility, then releases the lock with zero pending frames.
- Pointer movement and repeated clicks during return cannot retarget, restart, replace, or queue work.
- Reduced motion commits the same canonical endpoint immediately without continuous travel or roll.
- Each scheduled frame is guarded by frame identity and monotonic hold generation; lifecycle cancellation resets or disposes immediately, and a late cancelled callback cannot affect a newer hold.
- Player/opponent hands, retained Raphael identity and attributes, `dragging`, `isDroppable`, turn, board, scores, game ID, dialog/review/replay state, callbacks, semantic actions, and requests remain unchanged.
- Diagnostics expose only permitted plain arming/return state and agree with source, generated bundle, loader, static/browser contracts, and cache identity `0.185.1-match-return.1`.
- Static, controlled-clock, browser, all-scale, reduced-motion, lifecycle/stale-frame, generated-bundle, Phase 0.11, Graphics persistence, lobby, and applicable Legacy regressions pass.

### Phase 0.13 — Renderer-local valid-zone hover and placement preview

Deliver the exact scope and acceptance criteria in Section 12.16.

Exit gate:

- The temporary bridge exposes exactly nine plain, fail-closed Legacy board rectangles at the documented 117 by 146 logical geometry and no Raphael or authority-bearing object.
- While a player card is carried, only the one currently hovered empty and valid slot appears, using the exact black, no-stroke, radius-10, opacity-`0.3` Legacy shadow; invalid, occupied, non-hovered, and post-placement slots remain invisible.
- The retained 300-millisecond pickup arming boundary remains authoritative for this study even when hover appears earlier.
- An armed click over a valid zone runs one 300-millisecond cubic-out reverse-pickup placement to the exact slot center, projected scale `1`, table depth `0`, zero local-X/local-Y tilt, and one once-sampled `[-2°, 2°]` residual screen-space roll.
- Placement has no position jitter, full turn, per-frame randomness, overshoot, bounce, or camera movement. Clicking outside a current valid zone preserves the Phase 0.12 invalid return.
- The placed preview remains visible and inert, and no second preview is accepted for the unchanged hand/drop-zone snapshot.
- Reduced motion commits the same sampled endpoint immediately.
- Lifecycle or snapshot reset hides hover, cancels placement, restores canonical projection, and rejects stale frames atomically.
- Legacy `grab`/`drop`, live hand/board occupancy, board enablement, turn, scores, rules, controller state, semantic actions, callbacks, and requests remain unchanged.
- Diagnostics, status communication, source, generated bundle, loader, static/browser contracts, and deployment agree on `0.185.1-match-placement.1`.
- Static, controlled-clock/randomness, exact-geometry, all-scale, reduced-motion, lifecycle/stale-frame, actual-size visual, Phase 0.12 fallback, Graphics persistence, lobby, and applicable Legacy regressions pass.

### Phase 0.14 — Renderer-local active-match turn-indicator coin

Deliver the exact scope and acceptance criteria in Section 12.17.

Exit gate:

- The temporary bridge emits one plain explicit `{sequence, side, x, y, width, height, textureUrl, visible}` marker descriptor with the exact Legacy center/player/opponent geometry, approved heads/tails allowlist, and no authority-bearing reference.
- A newly mounted or reconstructed surface snaps its first descriptor directly to the current target. Only a later newer sequence at a changed target begins motion; duplicate, stale, same-target, and visibility-only delivery cannot replay it.
- Modern renders a true 41-diameter, three-unit-thick 3D circular coin with two 64-segment faces, one 64-segment cylindrical edge, unlit sRGB face art, restrained lit metallic thickness, one analytic shadow, and the same descriptor texture on both faces.
- The version-1 pure deterministic profile/planner/sampler produces the documented quadratic path, physical height, flip, tumble, spin, contact tilt, shadow response, and exact flat settlement in both mirrored directions with no randomness or idle loop.
- Coin motion owns at most one pending frame, supersedes from the current visible pose without a jump, rejects stale generations, and may coexist with the unchanged Phase 0.13 card scheduler.
- Reduced motion snaps each accepted later sequence to the same exact latest endpoint with no continuous motion or pending frame.
- The coin mirrors but never decides the turn, calls or delays no Legacy continuation, changes no board/hand/card/score/rule/controller state, emits no semantic action, and issues no request.
- Motion Studio exposes `Match turn coin — Transition` through the exact 693 by 500 active-match inset, locked Legacy endpoints, both preview directions, production coin/camera/profile/planner/sampler, coin-only controls, deterministic transport, canonical strict import/export, and representative same-face dime art.
- `Apply to Match Coin` persists only `purett.turnMarkerMotion.v1`, leaves Graphics and lobby-playbook values unchanged, and cannot fabricate a live transition for an unchanged sequence.
- Lifecycle, descriptor, texture, context, visibility, mode, view, replacement, and disposal boundaries settle or discard renderer-owned coin state atomically and make late frames/loads inert.
- Diagnostics, status communication, source, generated bundle, loader, active-match and Studio contracts, and deployment agree on `0.185.1-match-turn-coin.1`.
- Pure unit, static, browser/harness, storage-isolation, Studio parity, all-scale, reduced-motion, supersession, lifecycle/resource, actual-size visual, Phase 0.13, Graphics persistence, lobby, and Legacy regressions pass.

### Phase 0.15 — Parallel Modern hinged game-cover projection

Deliver the exact scope and acceptance criteria in Section 12.18.

Exit gate:

- `gh.cover` publishes only the exact cloned schema-version-1 descriptor and remains the sole owner of `isopen`, Raphael motion, parent visibility, input shielding, callbacks, and application continuation timing.
- The Modern cover is one independent page-lifetime 755 by 562 Outer UI surface inside unchanged `#game-cover`, may coexist with the current lobby or active-match Modern surface, and survives lobby/match/tutorial/replay/early-exit/game-over handoffs without coupling to active-match lifecycle.
- Closed Modern composition uses only `/images/left.png` at `(0, 0, 377, 562)` and `/images/right.png` at `(376, 0, 378, 562)`, preserving the one-pixel overlap and right-over-left seam exactly.
- Two ten-unit-thick physical leaves pivot toward the camera around outside x coordinates `0` and `754`, with mirrored signed local-Y rotations and exact 112-degree open endpoints under the fixed stage-centered camera.
- One pure deterministic planner/sampler produces full 2,000-millisecond cubic-in opening and cubic-out closing, exact endpoints, timestamp catch-up, and interruption continuity without randomness or idle work.
- Ordinary, duplicate, interrupted, and already-targeted Legacy calls retain existing callback counts, ordering, timing, parent visibility, wrapper/menu state, and stale-callback behavior. Modern completion owns no continuation.
- Legacy remains visible until both textures and one complete Modern frame are ready. Every cover-specific construction, descriptor, partial texture, timeout, render, context, replacement, or disposal failure reveals Legacy locally without changing requested/effective Modern mode or a healthy lobby/active surface.
- Reduced motion snaps only the Modern projection and leaves all Legacy motion, callback timing, parent visibility, and pointer-shield lifecycle unchanged.
- Cover host/canvas remain decorative, inaccessible, unfocusable, pointer-inert, correctly stacked, and scale/DPR invariant.
- Scheduler, generation, partial-load cleanup, stale-work rejection, and fifty-cycle resource evidence pass with at most one cover frame and one explicitly permitted additional cover WebGL context.
- Cover source, facade/ABI, DOM metadata, diagnostics, and component contracts agree on component identity `0.185.1-game-cover-hinge.1`; historical Phase 0.15 evidence records the same outer artifact/loader/deployment identity, while a later phase may supersede only those outer identities.
- Phase 0.14 coin/Studio, Phase 0.13 card behavior, lobby playbook, Graphics persistence, scale, dialog, smoke, and applicable Legacy regressions pass unchanged.

### Phase 0.16 — Cover-triggered active-match hand fan

Deliver the exact scope and acceptance criteria in Section 12.19.

Exit gate:

- Active-match activation arms one plain monotonic entrance without changing canonical hand descriptions.
- Before release, each current side forms one exact flat pile at its own last-card destination and the eventual bottom card paints on top.
- Only the current Legacy left-panel open completion, after the parent hide, may publish the plain settlement observation that releases the piles; the synchronous open callback and Modern-cover completion remain non-authoritative.
- A ready effective Modern surface fans both sides through the shared deterministic 620-millisecond-per-card, 55-millisecond-stagger, 785-millisecond-total planner and sampler.
- Index `4` remains stationary; indices `3`, `2`, `1`, and `0` emerge in order with bounded mirrored lateral/yaw/roll motion and shared depth/pitch timing, then normalize exactly to the accepted vertical layout.
- Input is detached throughout waiting and motion, any racing renderer-local card study is cancelled before entrance pose ownership, and the unchanged Phase 0.13 input path returns only after terminal settlement.
- Incomplete Modern readiness at cover settlement, already-settled activation, reduced motion, hidden delivery, mode/view change, hand replacement, context loss, fallback, reconstruction, and disposal cannot cause a late pile, partial replay, stranded motion, second scheduler, or stale-frame mutation.
- Pure, static, controlled-clock, actual-size visual, lifecycle/resource, Phase 0.13 card, Phase 0.14 coin, Phase 0.15 cover, Graphics persistence, and applicable Legacy regressions pass.
- Diagnostics, source, generated bundle, facade/ABI, loader, tests, deployment, and requirements agree on `0.185.1-match-hand-fan.1`.

### Phase 1 — Characterization and Legacy renderer boundary

Deliverables:

- characterize every current visual state, input path, transition, z-order dependency, and callback-driven control-flow edge;
- capture stable fixtures and interaction traces;
- introduce renderer-neutral IDs and view state;
- extract or wrap a `LegacyActiveMatchRenderer`;
- add explicit lifecycle, cancellation, and cleanup for Raphael callbacks, timers, animations, and input;
- move visual-state reads out of the controller;
- replace renderer-specific test assertions with semantic assertions where possible;
- preserve current Legacy appearance and behavior.

Exit gate:

- Existing Legacy tests pass.
- Captured action traces are unchanged.
- Controller and model structures contain no renderer objects.
- Legacy owns its own semantic-card-ID to Raphael-element map.
- No controller read of image URL, `getBBox()`, pointer attributes, or SVG paint order remains.
- Renderer lifecycle can be mounted and disposed repeatedly without duplicate actions.
- The controller can describe a complete settled scene as plain data.
- Every temporary compatibility shim has an assigned removal phase.

### Phase 2 — Three.js feasibility spike and static snapshot

Deliverables:

- extend and validate the isolated, pinned, same-origin Three.js build introduced in Phase 0 and exercised with real lobby textures in Phase 0.5;
- review the existing production manifest, pinned toolchain declaration, lockfile, reproducible build/validation command, generated-artifact policy, module ABI, and license/source-map policy;
- evolve the passive two-hand active-match WebGL renderer already mounted in the Modern host into a representative static snapshot; do not treat the separate lobby-hand scene as an active-match snapshot;
- render a representative board snapshot;
- implement card front, back, edge, perspective, lift, turn, and scale;
- prove raycast picking and coordinate mapping;
- validate application scale 1, 1.5, 2, and 3;
- test texture loading and disposal;
- measure bundle size, scene readiness, frame time, pointer response, GPU/CPU idle behavior, and memory;
- test forced initialization and context loss;
- record camera, geometry, material, color-space, compositing, antialiasing, shadow, and texture decisions;
- decide the semantic DOM structure, hidden-information redaction, focus model, and single action-dispatch ownership;
- keep the Three.js spike behind a developer/test override rather than presenting it as a generally playable mode.

Exit gate:

- No CSP or deployment blocker remains.
- Front/back orientation is correct through a complete turn.
- Overlap picking is deterministic.
- The performance and bundle budgets are measured and approved.
- The scene becomes idle without a permanent render loop.
- A go/no-go review confirms Three.js remains the selected implementation.

If the result is no-go:

- Phase 0, Legacy, and its recovery route remain intact;
- Phases 3 through 7 do not begin;
- another graphics library is not substituted informally;
- evaluation of another renderer requires an explicit requirements/decision-record revision with new build, performance, accessibility, fallback, and parity evidence.

### Phase 3 — Developer-only playable vertical slice

Deliverables:

- render both hands and the board from a real match snapshot;
- select and lift one human card;
- move it under all supported application scales;
- highlight a legal slot;
- submit one valid placement exactly once;
- return from an invalid placement;
- present one opponent move;
- present one reveal;
- present one basic capture flip;
- lock and restore input correctly;
- fall back before input if Modern initialization fails;
- implement semantic DOM controls, focus, and concealed-information redaction for the cards and slots in the slice;
- route canvas and semantic DOM actions through one dispatcher.

Exit gate:

- A controlled real match can complete the vertical-slice sequence without Raphael active-match objects.
- The same server protocol is used.
- No duplicate move can be submitted.
- Final semantic state matches Legacy for the covered sequence.
- The user can still select Legacy and resume.
- The partial slice remains labeled Preview and is not promoted as a complete user beta.

### Phase 4 — Complete functional parity

Deliverables:

- all hand and board states;
- scores and turn indication;
- Open and Closed behavior;
- Basic, Same, Same Wall, Plus, Combo, and Elemental presentation;
- loading and waiting states;
- all invalid-drop and cancellation paths;
- game completion;
- Sudden Death;
- review and replay;
- tutorials;
- dialog and overlay integration;
- all supported application scales;
- semantic state parity for all actionable cards and slots.

Exit gate:

- The shared conformance suite passes for both renderers.
- Every parity-matrix capability has evidence.
- No rule result depends on animation.
- No P0 or P1 functional defect remains.

### Phase 5 — Modern motion, accessibility, and resilience

Deliverables:

- final lift, tilt, turn, scale, rotation, and zoom treatment;
- interruption and fast-forward policies;
- reduced-motion behavior;
- complete semantic DOM card and slot controls;
- keyboard interaction and focus restoration;
- context-loss recovery or fallback;
- bounded asset failure handling;
- classified tab-scoped failure backoff with expiry and `Retry Modern`;
- repeated mount/dispose and leak testing;
- performance tuning based on measurements;
- visual-difference manifest.

Exit gate:

- Motion always settles on snapshot-derived state.
- Reduced-motion coverage passes.
- Keyboard-only play passes `KB-PLAY-01`, including automated accessible-tree assertions and the declared manual assistive-technology smoke test.
- Context loss either reconstructs Modern at the latest revision or reaches the controlled Legacy-reload path without duplicate action.
- Performance and resource budgets pass.
- No P0 or P1 accessibility, reliability, or input defect remains.

### Phase 6 — Opt-in beta and Modern-default decision

Deliverables:

- expose Modern as a playable opt-in;
- retain Legacy as default initially;
- complete at least one automated full-match fixture for each distinct rule mechanism and at least 25 manual complete matches distributed across the tested browser/OS/GPU matrix;
- finalize rollback and support notes;
- prove the `modernEnabled` kill switch without clearing stored preferences;
- prove failure-backoff persistence, expiry, reason messaging, and explicit retry without clearing the stored Modern request;
- resolve all known high-severity parity gaps.

Modern-default gate:

- Modern is playable across the complete conformance matrix.
- Pre-input Legacy fallback and post-input controlled recovery/reload are proven.
- Explicit Legacy preference always wins.
- Performance, accessibility, resource, and reliability budgets pass.
- There is no open P0 or P1 renderer defect.
- The default can be reverted for every user through the isolated `modernEnabled` kill switch.
- The Modern-default decision is recorded explicitly.

### Phase 7 — Modern default and ongoing stewardship

Deliverables:

- set Modern as the configured default for environments that pass the runtime eligibility predicate, with the tested matrix serving as release evidence;
- continue honoring explicit Legacy preference;
- maintain conformance coverage for both renderers;
- document Three.js upgrades and compatibility changes;
- retain a rollback route.

Ongoing gate:

- Legacy remains functional.
- Renderer-contract changes run both suites.
- A future proposal to remove Legacy requires separate user approval, migration analysis, and archival consideration.

## 19. Test and evidence strategy

### 19.1 Required test dimensions

| Dimension | Required cases |
|---|---|
| Renderer | Legacy, Modern, forced Modern initialization failure, forced context loss |
| Surface | lobby-hand preview, active-match preview, transition between those surface kinds, independent full-stage Modern cover coexisting with each |
| Preference | unset, Legacy, Modern, invalid value, unavailable storage, kill switch, active/expired failure backoff, explicit retry |
| Lobby hand | zero through five cards, purchased and standard image paths, delayed texture, failed texture, hand replacement while loading, repeated show/hide |
| Motion Studio | open from Legacy and Modern, every built-in card preset plus `match-turn-coin-transition`, exact match-space inset/camera/locked endpoints in both coin directions, target-applicable controls, synchronized drag/numeric edits, play/pause/rate/loop/frame-step/scrub, Auto Replay, strict valid/invalid import, export round trip, isolated Apply behavior, session restore, reduced-motion entry, close and context loss |
| Motion recipe | fixed seed and canonical times, irregular frame cadence, every supported schema version, prohibited renderer objects, invalid/non-finite values, deterministic export/import equality |
| Match state | initial hand, resumed match, occupied board, Open, Closed, Elemental, final turn |
| Match pickup study | every player-card index, exposed and overlapped hit, opponent/empty rejection, lift midpoint/endpoint, horizontal/vertical/diagonal follow, stationary convergence, repeated ignored click, pointer departure/re-entry, hand revision, selected-card removal |
| Match turn coin | exact initial/player/opponent descriptors and approved assets, first-snapshot snap, duplicate/stale/same-target suppression, controlled canonical samples in both mirrored directions, visible circular edge and same-face art, mid-flight supersession, exact settlement, reduced motion, profile normalization/import/export, storage isolation, descriptor removal, view/mode/context/disposal cancellation, zero authority/callback/request effects |
| Game cover | exact schema/sequence/targets/assets/frame/panels, initial closed snap, one-pixel overlap and paint order, outer hinges x 0/754, signed 112-degree endpoints, canonical and dense deterministic samples, delayed-delivery catch-up, duplicate/stale suppression, both reversal directions, real Legacy callbacks/order, normal/reduced motion, ready child gate, local partial-texture/context failure, mode/visibility/scale/DPR/stacking, disposal, zero continuation/game/request authority |
| Capture | Basic, Same, Same Wall, Plus, Combo, multiple simultaneous captures |
| Flow | normal play, invalid drop, request pending, dialog, endgame, Sudden Death, review, replay, tutorial |
| Scale | 1, 1.5, 2, 3 |
| Pixel density | DPR 1, 2, and capped higher DPR |
| Input | mouse; `KB-PLAY-01` keyboard and accessible-tree coverage before beta; Chromium/VoiceOver manual smoke; touch/pen when declared supported |
| Motion | normal, reduced motion, interrupted, fast-forwarded, disposed |
| Lifecycle | first mount, rebuild, repeated toggle/build, background restore, resize, independent page-lifetime cover suspension/replacement, cleanup |
| Failure | missing texture, renderer init error, context loss, storage error, cover-only synchronous construction failure, either/partial/late cover texture failure, cover render failure, proof that cover fallback does not demote a healthy Modern lobby or match |

### 19.2 Renderer-neutral assertions

Tests should assert:

- effective renderer identity;
- card semantic ID and zone;
- board slot occupancy;
- face state;
- control owner;
- legal targets;
- selection and lock state;
- move-request count and payload;
- renderer-application settlement;
- Legacy cover callback count, callback order, parent visibility, pointer-shield state, and Modern continuation-authority flag;
- final score and turn state;
- cleanup and input ownership.

SVG node order and Three.js mesh identity may be inspected in renderer-specific unit tests, but they must not be the only evidence for game semantics.

### 19.3 Required evidence by major release

- automated conformance results;
- Legacy regression results;
- Modern visual-regression report;
- approved intentional-difference manifest;
- performance and bundle report;
- lifecycle/resource report;
- fallback and context-loss report;
- reduced-motion and keyboard checklist;
- exported candidate motion recipe, seed, actual-size 1× capture, slowed diagnostic capture, and explicit visual approval or rejection record;
- canonical lobby playbook export plus deterministic intro/exit batch evidence, command-continuation/watchdog traces, and Graphics-preference restoration evidence;
- Phase 0.11 calibrated-camera snapshot, controlled pickup/follow traces, actual-size normal/reduced-motion captures, zero-authority/request evidence, lifecycle cleanup report, and `0.185.1-match-pickup.2` source/bundle/cache-identity proof;
- Phase 0.12 controlled invalid-return samples at elapsed 0/150/300 milliseconds, arming and return-lock traces, all-scale exact-settlement evidence, reduced-motion and stale-generation lifecycle proof, unchanged Legacy/controller/request snapshots, actual-size captures, and `0.185.1-match-return.1` source/bundle/cache-identity proof;
- Phase 0.13 exact nine-zone geometry and validity-gate fixtures, hover-only shadow captures, controlled 0/150/300-millisecond and `-2°`/`0°`/`2°` placement samples, all-scale hit-test evidence, one-preview and invalid-fallback traces, reduced-motion/lifecycle proof, unchanged Legacy/controller/hand/board/turn/request snapshots, actual-size captures, and `0.185.1-match-placement.1` source/bundle/cache-identity proof;
- Phase 0.14 exact descriptor/sequence/target/asset fixtures; pure profile normalization, limit, deterministic-sampling, terminal-settlement, and bidirectional mirror tests; first-snapshot, duplicate-suppression, controlled-clock, mid-flight-supersession, reduced-motion, and stale-generation traces; true-circle/edge/same-face/sRGB actual-size captures; exact Motion Studio match-space/camera/endpoint parity and strict import/export evidence; `purett.turnMarkerMotion.v1` storage-isolation and malformed/future-schema fallback proof; repeated lifecycle/resource cleanup; unchanged Legacy callback/controller/hand/board/turn/request snapshots; and `0.185.1-match-turn-coin.1` source/bundle/loader/diagnostic/deployment identity proof;
- Phase 0.15 exact descriptor/sequence/target/frame/panel fixtures; one-pixel seam and paint-order evidence; pure 1,000-sample cubic-in/out, mirror-sign, positive-depth, endpoint, irregular-clock, catch-up, and reversal tests; true outer-hinge/ten-unit-thickness/unlit-sRGB-front actual-size captures; real Legacy open/close/duplicate/interruption callback and parent-visibility traces; component-local synchronous/partial-texture/timeout/render/context failure proof; reduced-motion/accessibility/input-shield/stacking/all-scale evidence; repeated lifecycle/resource cleanup with fulfilled-partial-texture disposal and stale-work rejection; unchanged Graphics/lobby/active/Legacy/controller/request snapshots; historical `0.185.1-game-cover-hinge.1` outer delivery proof and continuing cover source/facade/DOM/diagnostic component-identity proof;
- Phase 0.16 exact pile anchors/order/final rectangles; real Legacy hide-before-settlement and callback-order proof; pure asymmetric/dense/extrema/mirror/determinism tests; controlled-clock waiting/midpoint/final/input-lock traces; delayed-readiness, already-settled, reduced-motion, hidden, mode/view, hand-replacement, stale-frame, context, reconstruction, and disposal evidence; actual-size two-pile and fan captures; unchanged Legacy hand/cover callback, controller/game/turn/storage/navigation/request snapshots; and `0.185.1-match-hand-fan.1` source/bundle/facade/loader/diagnostic/deployment identity proof;
- tested Modern-default environment matrix;
- current known limitations.

### 19.4 Requirements-to-phase traceability

Phase 0 through Phase 0.16 requirements and acceptance criteria are the authorized engineering baseline as of 2026-07-30. Phase 0.7's deployed implementation has not passed its visual acceptance gate and is not an approved motion baseline. Phase 0.8 established the authoring workbench; Phase 0.9 established the authorized application-bound lobby integration; Phase 0.10 established passive active-match hand projection; Phase 0.11 remains the historical renderer-local player-card pickup/follow study; Phase 0.12 remains the historical always-invalid second-click baseline; and Phase 0.13 remains the preserved renderer-local valid-zone hover and one-placement-preview baseline. Phase 0.14 remains the authorized renderer-local active-match turn-indicator coin and exact Motion Studio profile target. Phase 0.15 remains the authorized parallel Modern game-cover projection and keeps Legacy cover callbacks and timing authoritative. Phase 0.16 is the current authorized renderer-local hand-entrance projection; it adds only the two waiting piles and cover-settlement-triggered fan, and does not expand Modern game, hand, turn, move, cover, or application-continuation authority. Later requirements describe the intended target and gates; each later phase must begin with a short entry review that resolves its open questions, confirms its fixtures, and converts any remaining provisional numerical budget into an accepted measurement contract.

| Requirement family | First owning phase | Primary owner | Required evidence | Blocks Modern default |
|---|---|---|---|---|
| `FR-MODE-*` | Phase 0 | Manager/settings and context-menu UI | Persistence, same-page toggle, async ordering, precedence, kill-switch, and mode-marker tests | Yes |
| `FR-LIFE-*` | Phase 0/1 | Renderer registry and match controller | Mount/dispose ownership tests and resource counts | Yes |
| `FR-LEG-*` | Phase 0/1 | Legacy renderer adapter | Existing suite plus Legacy conformance traces | Yes |
| `FR-MOD-*` | Phase 2 | Modern renderer | Static fixtures, visual report, texture/failure evidence | Yes |
| `FR-INT-*` | Phase 3 | Match controller, renderer, intent dispatcher | Shared action traces and duplicate-action tests | Yes |
| `FR-FX-*` | Phase 2/5 | Modern renderer | Deterministic animation, interruption, and reduced-motion report | Yes |
| `FR-FLOW-*` | Phase 1/4 | Match controller | Full-match rule, replay, and Sudden Death fixtures | Yes |
| `FR-FAIL-*` | Phase 0/3/5 | Renderer registry and recovery coordinator | Forced init, asset, context-loss, and controlled-reload tests | Yes |
| `FR-A11Y-*` | Phase 0/2/3/5 | DOM semantic layer and intent dispatcher | Name/role/state, redaction, focus, keyboard, and announcement checklist | Yes |
| `FR-TEST-*` | Phase 0/1 | Browser and renderer test harness | Semantic snapshots, deterministic visual fixtures, cross-renderer suite | Evidence enabler |
| `FR-LOBBY-*` | Phase 0.5 | Menu and graphics coordinator | Five-card visual fixture, hand-only gate, async readiness, lifecycle, and fallback tests | Yes |
| `FR-LOBBY-FLIP-*` | Phase 0.6 | Modern lobby surface and graphics coordinator | Choreography, canonical-back, per-card re-entry locks, independent-card concurrency, one bounded shared frame scheduler, per-card shadows, atomic lifecycle cancellation, reduced-motion, request-isolation, and Legacy-regression tests | Yes |
| `FR-LOBBY-ARRIVAL-*` | Phase 0.7 | Menu, graphics coordinator, and reusable Modern card-animation module | One-use trigger, deterministic planner/sampler, controlled clock, table/depth sampling, exact settlement, reduced motion, cancellation, Legacy regression, and a still-unmet normal-speed human-motion approval | Yes |
| `FR-MOTION-STUDIO-*` | Phase 0.8 | Motion Studio UI and renderer-neutral card-motion module | Mode-isolation, control synchronization, deterministic pose, playback/scrub, session persistence, import/export, accessibility, lifecycle/resource, no-side-effect, and visual-review evidence | Evidence enabler |
| `FR-LOBBY-PLAYBOOK-*` | Phase 0.9 | Playbook module, Motion Studio, Modern lobby surface, graphics coordinator, and menu command bridge | Fixed-anchor and seed determinism contracts, distinct endpoint evidence, whole-playbook persistence/import/export, production-preview parity, all-command exact-once/fail-open traces, Tutorials Back replay, reduced-motion/lifecycle cleanup, Legacy regression, and normal-speed review | Yes |
| `AC-P010-*` / Section 12.13 | Phase 0.10 | Modern active-match surface, graphics coordinator, and temporary game compatibility bridge | Exact two-hand geometry and order, Closed-art secrecy, passive-input diagnostics, demand rendering, texture/context fallback, runtime toggle, generated-bundle, and applicable Legacy regression evidence | Yes |
| `FR-MATCH-PICKUP-*` / `AC-P011-*` | Phase 0.11 | Modern active-match surface and graphics coordinator; temporary game bridge remains presentation-only | Calibrated perspective flat-table geometry, topmost player-only picking, one renderer-local hold, `1.075` projected lift, scale-correct grab-offset follow, bounded velocity tilt and zero-idle settlement, absent drop/game/network authority, reduced motion, lifecycle reset, Legacy identity, diagnostics, visual review, and `0.185.1-match-pickup.2` bundle evidence | Yes |
| `FR-MATCH-RETURN-*` / `AC-P012-*` | Phase 0.12 | Modern active-match surface and graphics coordinator; temporary game bridge remains presentation-only | Arming and early-click rejection, location-independent always-invalid return with zero drop zones, controlled 300-millisecond cubic-out clockwise-turn samples, exact canonical settlement, input lock, all-scale mapping, reduced motion, lifecycle generation/stale-frame rejection, unchanged Legacy/controller/request state, diagnostics, visual review, and `0.185.1-match-return.1` bundle evidence | Yes |
| `FR-MATCH-PLACEMENT-PREVIEW-*` / `AC-P013-*` | Phase 0.13 | Modern active-match surface and graphics coordinator; temporary game bridge remains presentation-only | Exact nine-zone geometry, fail-closed validity, hover-only 30-percent Legacy shadow, armed valid/invalid branching, controlled 300-millisecond cubic-out reverse-pickup samples, exact slot-center settlement, once-sampled `[-2°, 2°]` roll, one-preview guard, reduced motion, lifecycle/stale-frame rejection, unchanged Legacy/controller/hand/board/turn/request state, diagnostics, visual review, and `0.185.1-match-placement.1` bundle evidence | Yes |
| `FR-MATCH-TURN-COIN-*` / `AC-P014-*` | Phase 0.14 | Modern active-match surface, renderer-neutral turn-coin motion module, graphics coordinator, and Motion Studio; temporary game bridge remains presentation-only | Exact descriptor/sequence/Legacy targets and selected asset, first-snapshot snap and replay guards, true circular same-face 3D geometry, deterministic profile/planner/sampler and mirrored paths, exact settlement and bounded scheduler, mid-flight supersession, reduced motion, lifecycle/resource cleanup, storage isolation, exact Studio-production coordinate/camera/endpoint parity, unchanged Legacy callback/controller/turn/request state, diagnostics, actual-size visual review, and `0.185.1-match-turn-coin.1` identity proof | Yes |
| `FR-GAME-COVER-*` / `AC-P015-*` | Phase 0.15 | Legacy `gh.cover` descriptor adapter, graphics coordinator, independent Modern full-stage cover surface, and renderer-neutral cover-motion module; Legacy remains continuation authority | Exact descriptor/assets/rectangles/one-pixel seam, full-stage child gate, true ten-unit outer hinges at x 0/754, fixed signed 112-degree endpoints, deterministic 2,000-millisecond cubic-in/out sampling, timestamp catch-up and reversal, unchanged Legacy callbacks/timing/input shield, reduced motion, accessibility, all-scale/stacking, component-local fallback, lifecycle/resource cleanup, diagnostics, visual review, historical Phase 0.15 outer delivery proof, and continuing `0.185.1-game-cover-hinge.1` cover component identity proof | Yes |
| `FR-MATCH-HAND-ENTRANCE-*` / `AC-P016-*` | Phase 0.16 | Legacy cover-settlement adapter, graphics coordinator, renderer-neutral hand-entrance module, and Modern active-match surface; Legacy remains cover/continuation authority | Exact independent last-card pile anchors, bottom-card top paint order, hide-before-plain-settlement trigger, guarded ready/settled routing, deterministic 620/55/785 timing and mirrored bounded 3D samples, stationary index 4, canonical settlement, input arbitration, reduced motion, lifecycle/stale-frame rejection, zero gameplay/continuation authority, diagnostics, actual-size visual review, and `0.185.1-match-hand-fan.1` identity proof | Yes |
| `NFR-PERF-019` | Phase 0.14 | Modern active-match and Motion Studio surfaces | Default/max-duration, no-per-frame-allocation, one-coin-frame, coexistence, reduced-motion, cancellation, failure, and zero-idle-frame evidence | Yes |
| `NFR-PERF-020` | Phase 0.15 | Independent Modern cover surface and build owners | One additional bounded context/canvas, one cover frame, no per-frame GPU allocation, readiness timeout, backing-buffer cap, component-local failure, and zero-idle-frame evidence | Yes |
| `NFR-PERF-021` | Phase 0.16 | Modern active-match surface and renderer-neutral hand-entrance module | One entrance frame, one plan per sequence, bounded ephemeral poses, no per-frame GPU/listener/scheduler allocation, exact 785-millisecond default, and zero idle-frame evidence | Yes |
| Remaining `NFR-PERF-*` | Phase 2 | Modern build and renderer | GM-P100/GM-P200 performance and bundle report | Yes |
| `NFR-REL-015` | Phase 0.14 | Modern active-match surface, Motion Studio, and graphics coordinator | Fifty-cycle coin/Studio lifecycle, stale-frame/load rejection, resource-baseline, storage-isolation, and zero-authority report | Yes |
| `NFR-REL-016` | Phase 0.15 | Legacy cover adapter, graphics coordinator, and Modern cover surface | Fifty-cycle open/close/duplicate/reversal/mode/visibility/failure/replacement/dispose lifecycle, fulfilled-partial-texture disposal, stale-work rejection, resource baseline, unchanged Legacy callbacks, and component-isolation report | Yes |
| `NFR-REL-017` | Phase 0.16 | Legacy settlement adapter, graphics coordinator, and Modern active-match surface | Fifty-cycle pile/fan/readiness/mode/visibility/hand/context/replacement/dispose lifecycle, terminal-sequence and stale-frame rejection, resource/input baseline, and unchanged Legacy/controller/request report | Yes |
| Remaining `NFR-REL-*` | Phase 1/5 | Both renderers and controller | Repeated lifecycle, heap/resource, stale-revision, and severity report | Yes |
| `NFR-SEC-007` | Phase 0.14 | Graphics coordinator and same-origin storage boundary | Same-origin descriptor/profile, no-account/no-network, and visible-information-only audit | Yes |
| `NFR-SEC-008` | Phase 0.15 | Legacy cover adapter, graphics coordinator, and cover asset boundary | Exact same-origin asset allowlist, plain descriptor, no new storage/account/network payload, and visible-information-only audit | Yes |
| Remaining `NFR-SEC-*` | Phase 2 | Build/deployment boundary | CSP, same-origin, dependency, and network audit | Yes |
| `NFR-COMP-*` | Phase 2/6 | Browser test matrix | Tested Modern-default matrix | Yes |
| `NFR-MAINT-007` | Phase 0.14 | Renderer-neutral turn-coin motion module owners | Dependency-boundary audit and identical production/Studio planner-sampler contract | Yes |
| `NFR-MAINT-008` | Phase 0.15 | Renderer-neutral cover-motion module and adapter/facade owners | Pure dependency-boundary audit, shared production/test planner-sampler contract, and separation of Legacy continuation from Modern objects | Yes |
| `NFR-MAINT-009` | Phase 0.16 | Renderer-neutral hand-entrance module and adapter/facade owners | Pure dependency-boundary audit, shared production/test planner-sampler contract, and separation of Legacy cover settlement from renderer objects | Yes |
| Remaining `NFR-MAINT-*` | Phase 1 | Renderer contract owners | Boundary review, upgrade procedure, shared tests | Yes |

## 20. Rollout and preference precedence

The normal selection state machine is:

```text
if localStorage cannot be read:
    requested = legacy
    requestReason = storage-unavailable
else if stored value is legacy or modern:
    requested = stored value
    requestReason = explicit-preference
else:
    clear an invalid stored value if possible
    requested = configuredDefault
    requestReason = configured-default

if modernEnabled is false:
    effective = legacy
    effectiveReason = modern-disabled
else if requested is legacy:
    effective = legacy
    effectiveReason = requested-legacy
else if a non-expired Modern failure-backoff record exists:
    effective = legacy
    effectiveReason = temporary-failure-backoff
else if this phase requires Modern capability and initialization checks,
        and either check fails:
    effective = legacy
    effectiveReason = capability-or-initialization-fallback
else:
    effective = modern
    effectiveReason = requested-modern
```

A valid force-mode override may replace `requested` only in an automated test or explicit local diagnostic context. It must be visible in diagnostics and must not write `localStorage`. Tests may bypass `modernEnabled` only when deliberately testing disabled Modern code; normal users may not.

Motion Studio is outside this selection state machine. It may load the Modern dependency and own a temporary isolated study context, but it never writes the Graphics preference and never satisfies a capability check on behalf of the production Modern renderer. Phase 0.9 Apply & Preview may temporarily request effective Modern through a non-persisting preview path, records the prior selection as a restoration target, and restores it on every completion or failure unless the user explicitly chooses another mode during preview. Studio session storage and lobby-playbook local storage use distinct keys and lifetimes from Graphics preference.

The Phase 0.15 cover projection is also outside the selection decision itself. It follows the selected mode after Modern is otherwise available, but a cover-only failure removes only the cover child gate and reveals Legacy cover presentation. It must not change requested mode, effective mode, failure-backoff state, or the identity of a healthy lobby/active Modern surface. Selecting Legacy suspends the reusable cover projection under `FR-GAME-COVER-017`; it does not create a failure record.

The selection state machine must preserve these properties:

- Explicit Legacy always wins over capability detection.
- The configured default applies only when no valid preference exists.
- An invalid value behaves as unset rather than permanently forcing Legacy.
- Unavailable storage uses Legacy as a safety policy.
- The `modernEnabled` kill switch forces effective Legacy without erasing requested Modern.
- A non-expired failure-backoff record forces Legacy only for requested Modern and exposes `Retry Modern`.
- A requested-Modern/effective-Legacy state retains and exposes its reason.
- Capability or initialization failure cannot change authoritative match data.

During Phase 0, this state machine is reevaluated for an explicit same-page Graphics selection. A Modern request remains pending while its lazy bundle and surface initialize; effective Legacy remains presented until success. A Legacy selection applies synchronously and invalidates any pending Modern activation token so a late load completion cannot reverse the user's latest choice. These runtime transitions do not reconstruct the match.

The tested browser/OS/GPU matrix is release evidence, not a runtime GPU allowlist. Modern default eligibility must be based on a documented predicate that the browser can actually evaluate:

- `modernEnabled` is true;
- requested/configured mode is Modern;
- no failure-backoff record is active;
- a WebGL 2 context can be created;
- required renderer limits and features pass the Phase 2 capability probe;
- Modern bundle and required initial assets initialize successfully.

Any environment that passes this predicate may receive the configured Modern default. The tested matrix demonstrates expected behavior on declared examples but does not pretend to identify every GPU model at runtime.

Recommended defaults by phase:

| Phase | Default | Modern presentation |
|---|---|---|
| 0 | Legacy | `Modern` choice with adjacent Preview status |
| 1 | Legacy | `Modern` choice with adjacent Preview status, or hidden |
| 2 | Legacy | Developer-only spike |
| 3–5 | Legacy | `Modern` choice with adjacent Preview/Beta status |
| 6 | Legacy | `Modern` choice with adjacent Beta status |
| 7 | Modern for runtime-eligible environments | Modern |

The preference should survive browser restarts. It is intentionally browser/origin-local rather than account-synchronized in the initial implementation.

## 21. Principal risks and mitigations

| Risk | Consequence | Required mitigation |
|---|---|---|
| Animation callbacks currently advance control flow | A missing callback can stall or corrupt a match | Revisioned renderer-application contract that settles exactly once, plus fast-forward/cancel tests |
| Modern cover completion is mistaken for the Legacy continuation | Play, early exit, game over, tutorial, or replay advances twice, too early, or not at all | Keep every callback inside `gh.cover`; publish cloned presentation only; report `applicationContinuationAuthority: false`; verify exact Legacy counts/order/timing across normal, duplicate, interruption, reduced-motion, failure, and absent-Modern traces |
| The cover is attached to active-match lifecycle | Early exit or game over disposes the Modern cover before its closing projection, or lobby/match handoff reconstructs an unnecessary context | Use one independent page-lifetime 755 by 562 Outer UI surface that coexists with the active lobby/match surface and is suspended only by mode or cover-specific lifecycle |
| A partial Modern cover becomes visible or its failure demotes all Modern presentation | One leaf, a blank seam, or mixed renderers flash; a decorative failure removes an otherwise healthy Modern match | Gate children only after both textures and a complete first frame; make construction/texture/render/context fallback component-local; dispose a texture whose sibling failed; retain requested/effective mode and lobby/active identity |
| The hinged cover folds backward, normalizes the seam, or darkens the source art | The motion reads as a flat or incorrect lid and closed state no longer matches the archival game | Fix pivots at x 0/754, signs at left negative/right positive, inner-edge depth toward the camera, 112-degree endpoints, one-pixel right-over-left seam, unlit sRGB fronts, ten-unit body, and actual-size closed/mid/open/reclosed review |
| Visual state is read as model state | Modern cannot reproduce or recover correctly | Explicit snapshot fields for face, zone, position, ownership, lock, and order |
| Z-order is functional | Wrong card is selected or capture/hand overlap is incorrect | Canonical semantic depth and deterministic raycast sorting |
| Phase 0 suppresses the complete Legacy match presentation | Scores, rules, targets, and authoritative turn state remain intentionally absent even after hands and the renderer-local studies appear; Phase 0.14's coin and Phase 0.15's cover are only mirrors of Legacy presentation | Keep Raphael live and synchronized behind complete presentation and pointer gates; label Modern non-playable, identify the coin and cover as non-authoritative, preserve cover continuation ownership, and provide immediate Legacy return |
| Two renderers remain supported | Behavior can drift and maintenance cost can grow | One conformance suite, one snapshot/action contract, documented ownership |
| CSS application scaling conflicts with camera picking | Pointer and cards diverge | One tested client-to-world coordinate pipeline |
| Texture orientation, color, or minification is wrong | Mirrored backs, darkened art, seams, or motion shimmer | Use unlit sRGB faces, mipmaps, trilinear minification, bounded anisotropy, and both same-direction edge-on tests |
| Transparent sorting or z-fighting | Flicker and incorrect overlap | Suppress slab face caps, keep 0.2 logical face/body clearance, use 450/900 lobby clip planes, preserve explicit depth policy, and run representative stress scenes |
| WebGL/browser variability | Blank board or unusable input | WebGL 2 capability probe, buffer cap, pre-input Legacy fallback, and controlled post-input recovery/reload |
| Repeatable Modern failure retries every reload | User is trapped in a failure/reload loop | Classified tab-scoped backoff, Legacy suppression window, expiry, and explicit retry |
| Context or resource leaks | Performance degrades across matches | Central ownership and repeated lifecycle tests |
| Modern bundle delays Legacy | Regression for users who prefer the original | Isolated lazy-loaded Modern bundle |
| Canvas-only interaction | Accessibility regression | Synchronized semantic DOM controls before Modern default |
| Excessive motion | Discomfort and reduced clarity | Restrained effects and `prefers-reduced-motion` behavior |
| Replay and Sudden Death reuse render handles | Highest-risk parity paths | Snapshot-based reconstruction and dedicated fixtures |
| Empty preview appears broken | User confusion | Clear Preview label and DOM explanation |
| Phase 0 runtime gate accidentally becomes a renderer hot swap | Lost input, duplicate request, stale scene, or hidden targets accepting input | Do not dispose, rebuild, or transfer controller/game state in Phase 0; keep one live Legacy controller, gate both surfaces atomically, confine Phase 0.11 pickup and Phase 0.12 return input to a disposable renderer-local study, and test node/state identity across toggles |
| Lobby hand is mistaken for the in-match hand | Scope expands into game state, input, and rule sequencing before the renderer boundary exists | Keep a dedicated `lobby-hand` factory, host, card description, diagnostics identity, and acceptance suite |
| Lobby gate hides the shared Raphael menu paper | Play, Shop, Tutorials, or the command bar disappears with the cards | Mark and gate only individual Legacy lobby-hand card elements; reject broad SVG or paper selectors |
| A stale lobby texture load completes after navigation or Legacy selection | Old cards reappear, Legacy cards remain hidden, or an extra context survives | Generation-guard texture work, confirm current surface/mode/readiness before gating, and dispose on surface-kind transitions |
| Phase 0.6 click handling shields the lobby | Play, Shop, Tutorials, or other established controls stop receiving input | Accept hits only on eligible Modern card bounds and verify command behavior with the full-size canvas present |
| Concurrent lobby-card clicks race or same-card re-entry queues duplicate work | A card receives overlapping transforms, independent shadows overwrite each other, locks stick, callbacks race, or frames run indefinitely | One re-entry lock and transition record per card; ignore and never queue only repeats on that active card; allow other settled cards through one shared bounded scheduler; give each card an independent shadow mesh/material over shared geometry/texture; and test exact-once individual settlement plus atomic surface-wide cancellation |
| Flip uses a synthesized or mirrored back, reverses direction, or leaves a residual transform | Purchased/color variants 404 or the physical turn looks incorrect | Load only `/images/cards/cardBack.png` before enabling input; test monotonic local-X milestones at `-π/2`, `-π`, `-3π/2`, and `-2π`; then require exact flat zero-normalized settlement |
| Off-axis perspective makes the rotating outer lobby cards lean in opposite directions | The row appears fanned across a curved or spherical surface even though every resting card is flat | Keep pickup X/Y/Z tilt exactly zero; apply the face-anchored flat-table projection neutralizer outside local rotation; compare projected lateral shear and normalized four-corner silhouettes for the outer-left, center, and outer-right cards at deterministic animation samples; reset zero-lift coefficients on every settlement and reusable cancellation |
| Hardware or persistent shadows reintroduce grid artifacts, cross-card state leakage, or distort the resting row | Flashing motion, darkened art, a hand that appears curved before interaction, or one animation moves/fades another card's shadow | Keep hardware shadow mapping disabled; share only analytic-shadow geometry/texture; give every card its own mesh/material; show each shadow only while its card has nonzero lift; and hide/reset all affected shadows on individual settlement and every surface cancellation path |
| Lobby animations survive mode or lifecycle changes | A late frame re-hides Legacy, mutates a new hand, leaves one card locked, or leaks GPU activity | Atomically generation-token-cancel every active card on Legacy, hide, hand replacement, surface replacement/disposal, and context loss; release all per-card locks and assert zero pending frames and visible shadows afterward |
| The deployed Phase 0.7 motion is mistaken for an approved baseline | Its flat leftward slide is copied into the shop, match, or later five-card work and visual failure becomes entrenched | Label it `Unapproved current lobby` in documentation and Studio UI; require an exported recipe, actual-size 1× capture, and explicit review decision before promotion |
| Motion Studio accidentally participates in Graphics selection | Opening a tool rewrites the user's preference, hides the Legacy hand, or makes later fallback state ambiguous | Keep ordinary Studio lifecycle isolated; permit only the explicit non-persisting Phase 0.9 production-preview path to present Modern temporarily; assert Graphics storage identity and exact restoration across every preview outcome |
| Studio controls directly mutate Three.js objects as their source of truth | Export, scrub, replay, and later consumers diverge from what was authored | Make a validated renderer-neutral recipe the sole draft, sample poses deterministically from it, and treat scene objects as disposable projections |
| Invalid or future recipe import partially applies | The preview crosses the camera or table, becomes non-finite, or leaves a corrupted draft | Parse and validate into a temporary value, reject atomically with field-specific feedback, and retain the last valid draft |
| Imported playbook moves or embeds lobby slots | Authored data becomes an alternate layout authority and cards settle unpredictably after a layout change | Serialize only stable target IDs and recipes; resolve current anchors inside the lobby renderer; force locked landing offsets and test exports for prohibited coordinates |
| Five exit cards use one identical trajectory or five unrelated random trajectories | The exit looks like a mechanical stack or five disconnected throws rather than one wind gesture | Derive one shared gust from the run seed, then stable bounded per-slot variation and distinct lower-left offscreen endpoints |
| A pending lobby command receives another click | Two exits, seeds, navigations, requests, or stale callbacks compete | Hold one exact command continuation, ignore all additional command activations, and prove exact-once release through completion and fail-open watchdog |
| Exit animation failure traps navigation | A renderer or callback fault makes Play, Shop, Tutorials, Replay, or Deck unusable | Derive a bounded watchdog from the batch deadline, cap it, and invoke the original continuation exactly once on every failure or timeout |
| Studio production preview overwrites Legacy preference | A temporary visual review silently opts the user into Modern | Use a non-persisting temporary Modern path, preserve the restoration target, honor a newer explicit user choice, and assert the Graphics key before and after every preview outcome |
| Browser-local playbook becomes confused with repository or account defaults | One browser's experiment is treated as a shipped design or appears on another account unexpectedly | Label persistence as local, export the complete versioned document for review, issue no network request, and require separate source-control promotion for global defaults |
| Perspective calibration makes outer active-match cards look fanned or curved | The study repeats the rejected curved-surface appearance and pickup movement cannot be judged against a credible flat table | Calibrate every settled anchor on one constant-depth plane, assert equal projected corner silhouettes at left/center/right positions, keep local rotation zero at rest, and prohibit camera or slot-dependent tilt |
| Pointer coordinates are scaled twice or projected onto the wrong depth plane | The card drifts away from the pointer at application scale, browser zoom, or during lift | Convert through the current host rectangle into 693 by 500 logical space once, preserve the accepted local card point on the held plane, and test scales 1, 1.5, 2, and 3 plus DPR/zoom cases |
| Velocity tilt becomes jittery, inverted, or permanent | The card appears unstable, leads rather than resists motion, or leaves residual skew | Filter logical velocity with finite-delta guards, require a readable canonical diagonal response, clamp both tilt axes to 10 degrees, test directional sign, use non-oscillating damping, and stop the scheduler after zero-tilt convergence |
| Renderer-local hold leaks into game authority | A visual study changes `dragging`, turn state, target state, requests, replay, or fallback identity | Keep the hold inside the Modern surface, expose diagnostics only as cloned data, omit semantic dispatch and slot objects, and assert controller/Legacy/request identity before and after every trace |
| A held card survives mode, hand, view, or context replacement | A stale event moves the wrong card, a hidden scheduler leaks, or Legacy appears to inherit a Modern drag | Generation-token every hold and frame; cancel on every documented lifecycle/revision boundary; detach ownership before reveal/disposal; prove late events inert |
| The Phase 0.12 always-invalid return is mistaken for drop-zone or gameplay input | Scope expands into target legality, placement, controller mutation, or move authority before the controller seam exists | Keep the drop-zone count exactly zero; perform no slot raycast or validity query; emit no semantic action; and assert unchanged controller, game, Legacy, turn, request, and network state across the return |
| A pre-arm or returning click, stale frame, or lifecycle callback escapes the hold generation lock | The card returns twice, settles at a noncanonical pose, unlocks early, or mutates a replacement surface | Ignore and never queue clicks before arming or during return; keep one scheduler; validate both frame identity and hold generation on every callback; cancel on every documented lifecycle boundary; and require exact canonical settlement before pickup unlock |
| Turn-indicator descriptors replay, arrive stale, or supersede an in-flight generation incorrectly | The coin visibly tosses on mount, repeats an old turn, jumps on interruption, or settles on the wrong side | Snap the first valid descriptor; require a newer sequence and changed target thereafter; ignore duplicate/stale/same-target delivery; capture the exact current pose for supersession; guard every frame by identity and generation; and assert the three exact Legacy targets |
| The Modern marker becomes a flat square, a darkened texture, or a semantic heads/tails invention | Edge-on motion collapses, the dime art no longer matches Legacy, or presentation falsely implies a new turn result | Use two unlit sRGB 64-segment circular faces, one visibly lit open cylindrical edge, the descriptor-selected approved asset on both faces, disabled hardware shadows, and actual-size front/edge/back visual evidence in both directions |
| Turn-coin presentation leaks into Legacy callback or game authority | Motion delays turn progression, changes input eligibility, fabricates a turn, or issues a duplicate request | Notify Modern with a cloned descriptor only; never pass or invoke the Legacy continuation; keep `isMyTurn`, board/hand/card/controller state, semantic actions, and requests outside the coin module; and compare authority snapshots before, during, and after motion |
| Motion Studio and production coin behavior drift or their storage collides | An approved profile moves differently in the match, locked endpoints change, or applying a coin profile overwrites Graphics/lobby settings | Share one renderer-neutral normalizer, planner, and sampler; use the exact production 693 by 500 inset, camera, geometry, and endpoints; persist only `purett.turnMarkerMotion.v1`; and test all relevant storage keys byte-for-byte around Apply/import/fallback |
| Turn-coin frames, textures, or resources survive lifecycle invalidation | A hidden or replaced surface moves later, recreates the coin, leaks a frame, or corrupts a newer scene | Invalidate frame and motion generations atomically on every documented boundary; make late frames and texture completions inert; dispose owned coin resources; and require zero pending coin frames after completion, cancellation, replacement, context loss, and repeated lifecycle cycles |
| Remote dependency delivery violates self-contained design | Startup, CSP, and archival failure | Pin, bundle, and serve all Modern code locally |

## 22. Open design questions

These questions do not block Phase 0 unless noted, but each must be resolved in the identified phase.

| ID | Question | Recommendation | Resolve by |
|---|---|---|---|
| OQ-001 | Exact user-facing control copy | Resolved: `Graphics` with `Legacy` and `Modern`; adjacent status identifies the non-playable Preview | Phase 0 |
| OQ-002 | Blank preview or explanatory message | Require the explanatory DOM message | Phase 0 |
| OQ-003 | Runtime application after mode selection | Resolved: apply immediately through the Phase 0 presentation/input gate; never require or force a reload | Phase 0 |
| OQ-004 | Perspective or orthographic primary active-match camera | Phase 0.10 used a provisional head-on orthographic camera for exact static hand parity. Phase 0.11 deliberately replaces it on the Modern study surface with a calibrated head-on perspective camera that preserves the same settled rectangles and flat-table silhouette while enabling depth lift and local-X/local-Y tilt. Treat its geometry, interaction, and visual results as Phase 2 evidence; it does not by itself select the final playable camera. | Phase 2 |
| OQ-005 | Thin box or paired planes for an active-match card | Phase 0.6 resolves only the lobby experiment as a three-unit side-only lit slab, hidden slab caps, distinct unlit face planes, and 0.2 units of clearance. Decide the active-match representation through edge, orientation, depth-stability, and draw-cost measurements. | Phase 2 |
| OQ-006 | Per-card textures or atlas | Phase 0.5 uses per-card current-lobby-hand textures; begin the active match with cached current-match textures and add an atlas only if profiling justifies it | Phase 2 |
| OQ-007 | Exact active-match shadows and lighting | Phase 0.6 lights only the lobby slab sides, keeps face art unlit, disables hardware shadow maps, and uses one independently controlled lift-only analytic contact shadow per card over shared geometry/texture. Treat that artifact-free concurrent result as evidence; select the active-match treatment in Phase 2. | Phase 2 |
| OQ-008 | Score/rule/turn UI in WebGL or DOM | Phase 0.14 resolves only the provisional moving turn-indicator coin as renderer-local WebGL presentation so its 3D motion can be studied. It does not resolve score/rule rendering or the final accessible/semantic turn UI; prefer DOM for those Phase 3 surfaces where it improves accessibility and reduces texture/glyph work. | Phase 3 |
| OQ-009 | Playable-renderer switching after full decoupling | Phase 0's non-playable presentation gate does not decide this; keep later renderer reconstruction at safe boundaries unless a clear user need justifies playable hot swap | Phase 6 or later |
| OQ-010 | Touch and pen support window | Design with Pointer Events, schedule after desktop parity | Phase 5+ |
| OQ-011 | Exact reference hardware and performance budgets | Record representative current and modest hardware during the spike | Phase 2 |
| OQ-012 | Modern-default eligibility policy | Require all Phase 6 gates and an explicit decision | Phase 6 |
| OQ-013 | Runtime recovery timeout and snapshot-safe fallback checkpoint | Decide through the Phase 2 context-loss experiment; do not promise a live swap beforehand | Phase 2 |
| OQ-014 | Retained-heap diagnostic tolerance | Set it from warmed Chromium/CDP lifecycle baselines | Phase 2 |
| OQ-015 | How authored motion is distributed across five lobby cards | Resolved for Phase 0.9: intros have five independent left-to-right entries and runtime-owned destinations; the exit has one shared Gentle Wind entry compiled from one explicit seed into a shared gust plus stable bounded per-slot variants and distinct lower-left offscreen endpoints. This does not decide shop or active-match distribution. | Phase 0.9 |

## 23. Program completion criteria

The graphics-modernization initiative is complete when:

1. Modern is the configured default for environments that pass the documented runtime eligibility predicate.
2. Legacy remains explicitly selectable and fully functional.
3. Both renderers consume the same renderer-neutral state and emit the same semantic actions.
4. No game rule, server request, score, ownership result, or completion decision depends on renderer behavior.
5. Complete play, resume, Sudden Death, review, replay, and tutorial conformance passes.
6. Modern lift, turn, translation, scale, rotation, and zoom treatment is approved.
7. Reduced motion and keyboard play meet the documented requirements.
8. Modern initialization failure and context loss reach the documented recovery or controlled Legacy-reload outcome without losing the match or duplicating a move.
9. Performance, bundle, and resource budgets pass across the tested Modern-default matrix.
10. No open P0 or P1 renderer defect remains at the Modern-default decision.
11. The Modern default can be reverted without a server, database, or protocol migration.
12. Three.js ownership, upgrade procedure, and ongoing two-renderer test responsibilities are documented.
13. The parallel Modern cover, if retained, preserves exact Legacy continuation authority, component-local fallback, decorative accessibility, and repeated-lifecycle resource bounds.

## 24. Change control

Changes to any of the following require an explicit update to this document or a linked decision record:

- removal of Legacy mode;
- removal or global disabling of Raphael;
- changing the Modern renderer away from Three.js;
- requiring WebGPU;
- changing game rules or client/server protocols for rendering convenience;
- making Modern the default before its gates pass;
- enabling playable-renderer disposal, reconstruction, state transfer, or input hot swapping beyond the Phase 0 presentation/input gate;
- weakening same-origin or Content Security Policy requirements;
- adding external telemetry;
- making the WebGL canvas the sole accessible interaction surface;
- expanding the initiative to application Raphael surfaces beyond the explicitly approved lobby-hand projection, Phase 0.14 renderer-only turn-indicator projection, and Phase 0.15 parallel `gh.cover` projection;
- promoting a Motion Studio draft or playbook beyond the five Phase 0.9 lobby intro targets, shared Gentle Wind exit, and exact Phase 0.14 `match-turn-coin-transition` target, including into the shop or any other active-match subject;
- changing the Motion Studio recipe, lobby-playbook, or turn-coin profile schema; changing the six lobby-target entries plus one locked coin-target entry; serializing application anchors; or moving persistence from browser-local state to account/server state;
- expanding the historical Phase 0.11 scope beyond one renderer-local player-card hold, except for the explicit second-click supersession defined by Phase 0.12;
- changing the Phase 0.11 projected lift target, velocity-tilt bound, perspective flat-table calibration, or historical cache identity without corresponding visual, coordinate, lifecycle, and bundle evidence;
- expanding the historical Phase 0.12 scope beyond one renderer-local, always-invalid second-click return, except for the explicit valid-zone/placement-preview supersession defined by Phase 0.13; Phase 0.12 itself contains no drop zone, pointer-location validity query, valid placement, opponent interaction, semantic action dispatch, controller/game/Legacy/turn-state mutation, or network request;
- changing the Phase 0.12 300-millisecond duration, `cubic-out` curve, one clockwise `-2π` turn, exact canonical endpoint, arming/input-lock rules, reduced-motion settlement, generation guard, diagnostics, or `0.185.1-match-return.1` cache identity without corresponding visual, timing, authority, lifecycle, and bundle evidence;
- expanding Phase 0.13 beyond the documented nine plain Legacy rectangle descriptions, one hover shadow, one renderer-local placement preview per unchanged snapshot, and Phase 0.12 invalid fallback, including semantic target discovery, committed board occupancy, turn progression, capture resolution, controller dispatch, or move submission;
- changing Phase 0.13's exact slot geometry, black opacity-`0.3` hover-only cue, fail-closed validity gates, 300-millisecond cubic-out reverse-pickup motion, exact-center/no-position-jitter endpoint, once-sampled `[-2°, 2°]` screen-roll range, one-preview guard, lifecycle reset, reduced-motion endpoint, authority boundary, diagnostics, or `0.185.1-match-placement.1` cache identity without corresponding visual, geometry, timing, authority, lifecycle, and bundle evidence;
- expanding Phase 0.14 beyond one renderer-local active-match turn-indicator coin and one exact Motion Studio coin target, including deciding whose turn it is, delaying or invoking the Legacy continuation, gating card input, progressing the match, mutating score/rule/controller state, emitting a semantic action, issuing a request, selecting a random coin outcome, or introducing distinct semantic face art;
- changing Phase 0.14's descriptor fields or sequence semantics; exact initial/player/opponent targets; approved 41 by 41 asset behavior; same-texture-on-both-faces policy; diameter, thickness, segment counts, material/color policy, flat-table camera convention, profile schema/defaults/limits, deterministic planner/sampler equations, first-snapshot/replay/supersession rules, settle/reduced-motion/lifecycle behavior, exact Studio viewport/camera/endpoints, `purett.turnMarkerMotion.v1` isolation, diagnostics, or `0.185.1-match-turn-coin.1` cache identity without corresponding geometry, timing, visual, authority, storage, lifecycle, Studio-parity, and bundle evidence;
- expanding Phase 0.15 beyond one parallel decorative two-leaf `gh.cover` projection, including replacing, stopping, disposing, or bypassing the Legacy Raphael cover; moving `isopen`, parent visibility, pointer shielding, callback timing, callback invocation, menu/game/tutorial/replay/early-exit/game-over sequencing, navigation, semantic action, game state, storage, or request authority into Modern; adding a cover interaction, Motion Studio target, stored cover profile, or another Outer UI migration;
- changing Phase 0.15's schema-version-1 descriptor fields or sequencing; exact 755 by 562 frame; `/images/left.png` and `/images/right.png` allowlist; `(0, 0, 377, 562)` and `(376, 0, 378, 562)` rectangles; one-pixel right-over-left seam; x `0`/`754` outer hinges; left-negative/right-positive camera-facing rotation; ten-unit thickness; 40-degree stage-centered camera; unlit sRGB fronts; fixed 112-degree open pose; full 2,000-millisecond cubic-in/out plans; timestamp catch-up/reversal semantics; child readiness gate; component-local fallback; reduced-motion projection-only rule; accessibility/input/stacking/lifecycle/diagnostics contract; or the `0.185.1-game-cover-hinge.1` cover component identity without corresponding geometry, timing, visual, authority, failure-isolation, accessibility, lifecycle, resource, and component-identity evidence;
- expanding Phase 0.16 beyond one renderer-local initial hand pile/fan, including changing canonical hand data or ordering; mutating or delaying Legacy hand/cover/controller flow; adding gameplay selection, legal-target, turn, move, navigation, storage, callback, semantic-action, or request authority; revealing concealed opponent art; adding a Motion Studio target or stored entrance profile; or making fan completion a prerequisite for Legacy application continuation;
- changing Phase 0.16's plain entrance or settlement schemas, current-cover-sequence guard, hide-before-notification trigger, last-current-card pile anchor, index-4 top/stationary rule, reveal order, 620-millisecond card duration, 55-millisecond stagger, 785-millisecond batch, cubic-out progression, bounded lift/lateral/rotation values, mirrored-sign policy, exact canonical endpoint, input lock/arbitration, readiness fail-to-settled rule, monotonic terminal sequence, reduced-motion/lifecycle/stale-frame behavior, diagnostics, or `0.185.1-match-hand-fan.1` cache identity without corresponding geometry, timing, visual, authority, lifecycle, and bundle evidence;

Each revision should record:

- the decision changed;
- the reason;
- user-visible impact;
- compatibility and rollback impact;
- affected requirements and acceptance criteria;
- new evidence required.

## 25. Repository references

- [Standalone architecture](../ARCHITECTURE-STANDALONE.md)
- [Known limitations](../KNOWN-LIMITATIONS.md)
- [Migration from Facebook](../MIGRATION-FROM-FACEBOOK.md)
- [Security notes](../SECURITY-NOTES.md)
- [Standalone setup and tests](../README-STANDALONE.md)
- [Triple Triad rules](rules.md)
- Active-match implementation: `public/js/plugins/gh.game.js`
- Legacy game-cover implementation and Phase 0.15 descriptor adapter: `public/js/plugins/gh.cover.js`
- Lobby/main-menu implementation and five-card hand projection: `public/js/plugins/gh.menu.js`
- Graphics-mode and surface-kind coordinator: `public/js/plugins/gh.graphics.js`
- Modern active-match and lobby-hand source: `frontend/src/modern-graphics.js`
- Renderer-neutral Motion Studio recipe/planner source: `frontend/src/card-motion.js`
- Renderer-neutral application lobby playbook, seeded batch compiler, and sampler: `frontend/src/lobby-motion-playbook.js`
- Renderer-neutral active-match turn-coin profile, planner, and sampler: `frontend/src/turn-marker-motion.js`
- Renderer-neutral game-cover planner and sampler: `frontend/src/game-box-cover-motion.js`
- Renderer-neutral active-match hand-entrance planner and sampler: `frontend/src/match-hand-entrance.js`
- Independent Modern full-stage game-cover surface: `frontend/src/game-box-cover-surface.js`
- Isolated Motion Studio Three.js surface source: `frontend/src/motion-studio-surface.js`
- Legacy-shell Motion Studio coordinator/UI: `public/js/plugins/gh.motionstudio.js`
- Application manager and scaling: `public/js/default/index.js`
- Context-menu markup: `application/views/partials/overlays.phtml`
- Active-board styles: `public/css/default/index.css`
- Script delivery: `application/views/layouts/standalone.phtml`
- Browser security policy: `public/.htaccess`
- Container asset delivery: `docker/php56-apache.Dockerfile` and `.dockerignore`
- Browser-suite configuration: `tests/browser/playwright.config.js`
- Modern build/runtime static contract: `tests/static/modern-graphics-contract.js`
- Modern active-match hand, pickup, invalid-return, valid-zone hover, renderer-local placement-preview, and turn-indicator-coin browser coverage: `tests/browser/active-match-modern-hands.spec.js`
- Motion and application-playbook static contracts: `tests/static/card-motion-contract.mjs` and the Phase 0.9 lobby-playbook contract
- Active-match turn-coin profile/planner/sampler static contract: `tests/static/turn-marker-motion-contract.mjs`
- Game-cover motion and generated/runtime static contracts: `tests/static/game-box-cover-motion-contract.mjs` and `tests/static/modern-graphics-contract.js`
- Modern game-cover browser coverage: `tests/browser/game-box-cover.spec.js`
- Modern lobby and Motion Studio browser coverage: `tests/browser/lobby-modern-hand.spec.js` and `tests/browser/motion-studio.spec.js`
- Legacy browser coverage: `tests/browser/smoke.spec.js`, `tests/browser/scale-interactions.spec.js`, `tests/browser/dialog-scale.spec.js`, and `tests/browser/endgame-protection.spec.js`

## 26. External technical references

- [Three.js package and published version](https://www.npmjs.com/package/three)
- [Three.js installation](https://threejs.org/manual/en/installation.html)
- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js PerspectiveCamera](https://threejs.org/docs/pages/PerspectiveCamera.html)
- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html)
- [Three.js rendering on demand](https://threejs.org/manual/en/rendering-on-demand.html)
