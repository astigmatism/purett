# Graphics modernization requirements

| Field | Value |
|---|---|
| Status | Phase 0.9 application-bound lobby motion playbook, full-board authoring refinement, and restored-Modern first-paint handoff implemented; acceptance verification in progress; Phase 0.7 visual baseline rejected |
| Version | 1.6 |
| Last updated | 2026-07-25 |
| Scope | Active-match graphics roadmap plus Modern lobby-hand rendering, an application-bound lobby intro/exit playbook, Motion Studio authoring, renderer-neutral motion recipes, and bounded decorative card experiments |
| Modern renderer | Three.js `0.185.1` (`r185`) with `WebGLRenderer`, selected for Phase 0 and provisional for the playable renderer |

> **Implementation status — 2026-07-25:** Phase 0 established the runtime Graphics switch, safe Legacy fallback, and inert active-match Modern surface. Phase 0.5 rendered only the five lobby-hand cards beneath the Play, Shop, and Tutorials bar. Phase 0.6 added the calibrated flat-table Three.js card model and independent decorative double flips. Phase 0.7 deployed a deterministic `casual-drop-left` implementation with a pure planner, bounded lifecycle, table-clearance safeguards, and exact settlement. Its current visible motion does **not** convincingly resemble cards being dropped or scattered by a player: it reads primarily as flat cards sliding in from the left. It therefore failed the human visual acceptance requirement in `AC-P07-003` and is **not an approved visual baseline**. Its parameter values, named gestures, cadence, scale policy, and apparent motion must not be copied into the lobby, shop, active match, or another surface as an accepted design. Phase 0.8 introduced the isolated one-card Motion Studio and deterministic renderer-neutral recipes. Phase 0.9 now binds that authoring loop to a browser-local application playbook: five independently editable lobby-card intro targets land on runtime-owned fixed anchors, and one shared Gentle Wind exit compiles into five deterministic seeded variants with distinct lower-left offscreen endpoints. Its authoring refinement presents the entire 755 by 562 lobby board at true logical size, visually inherits the selected application scale, keeps every HTML control outside that stage, and can copy one intro card's shared motion character to selected or all other intro cards while preserving each destination's delay and travel placement. `Apply & Preview in Lobby` exercises the same production path used by normal lobby presentation and command exit while preserving the stored Legacy/Modern preference. Modern lobby commands wait for the exit or a fail-open watchdog; Tutorials Back replays the intro. A valid saved Modern choice is now read in the document head and masks only the retained Raphael lobby-card elements before first paint; the normal ready gate takes ownership after the first complete Three.js hand frame, while every failure path removes the startup mask and reveals Legacy. The active-match Modern renderer remains intentionally blank and follows the renderer-neutral roadmap later in this document.

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

This document defines the intended outcome, constraints, phased delivery plan, and acceptance criteria for modernizing the active-match graphics in Pure Triple Triad. It also defines the deliberately narrow Phase 0.5 lobby-hand preview, Phase 0.6 lobby-card double-flip spike, Phase 0.7 entrance experiment, Phase 0.8 one-card Motion Studio, and Phase 0.9 application-bound lobby intro/exit playbook used to author and exercise reusable 3D motion before any playable match surface is converted.

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

Raphael will remain loaded and usable. This project does not attempt to remove Raphael from the application as a whole. The cover, deck editor, shop, endgame screen, and the main-menu bar, commands, statistics, rules, and surrounding layout continue to depend on it. Phase 0.5 makes one explicit exception inside `gh.menu`: only the five decorative hand cards beneath the main command bar gain a parallel Three.js presentation.

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

The first implementation increment does **not** add functional Three.js card rendering. It adds a persisted graphics-mode preference and immediate runtime selection, preserves fully functional Legacy behavior, and supplies an intentionally inert Modern preview. The Modern bundle is isolated, pinned, self-hosted, and loaded only when Modern is requested.

Phase 0 uses a presentation/input gate rather than a renderer reconstruction boundary. The active-match Raphael papers remain mounted, live, and synchronized while Modern is effective, but they are opacity-hidden, marked `aria-hidden`, and blocked from pointer input. A blank, non-interactive Three.js WebGL surface occupies the same active-match region and renders no cards yet. Selecting Legacy removes that gate and reveals the identical current Raphael state immediately, without a reload or renderer rebuild. This temporary coexistence must not be mistaken for the final architecture.

Phase 0.5 is the first real-card rendering slice. When the main menu is visible and Modern is effective, a dedicated transparent Three.js surface renders up to five current `gh.data.hand` card faces at the established 755 by 562 lobby coordinates. The corresponding Raphael card images remain alive until the Modern texture set has rendered successfully, then only those five card elements are visually and accessibly gated. Switching to Legacy immediately reveals the original Raphael card images. The main-menu bar and commands are never hidden, replaced, or made pointer-inert by this hand-only gate.

Phase 0.6 is a renderer-only interaction spike on that same Modern lobby surface. A primary click on any settled Modern card may start one bounded animation for that card: lift, one smooth same-direction local-X turn from zero to `-2π` that presents the canonical back at its midpoint and the original front at its endpoint, and exact flat settlement. Different cards may animate concurrently; only re-entry on a card whose own animation is active is ignored until that card settles. The spike does not select a card, mutate the hand, start or resume a game, submit a request, or establish the interaction architecture for the active match. Legacy remains unchanged and may be selected immediately even while one or more decorative animations are running.

Phase 0.7 adds one destination-driven arrival batch to each main-menu presentation while Modern is effective. It deliberately recalls the Legacy lobby's randomized off-screen-left entrance while changing the visible story from a mechanical deal to cards casually released by a player seated beyond the left side of the table. A seeded planner chooses one art-directed two-burst phrase and correlated card gestures, the existing shared scheduler advances analytic flight and contact motion, and exact settlement restores the Phase 0.6 flat-card contract before click interactions become eligible.

Phase 0.7's engineering safeguards remain useful evidence, but the deployed choreography failed its required real-time human-motion review. Passing deterministic, clearance, timing, and settlement checks does not establish that motion looks physically or emotionally correct. The current five-card scatter is therefore an implementation under evaluation, not a source of approved artistic constants.

Phase 0.8 paused further guess-and-deploy tuning of the five-card entrance and provided a dedicated one-card authoring workbench inside the application. It exposed travel, height, perspective or authored scale, rotation, flip count, contact, skid, shadow, timing, and playback controls against the actual card model and lobby camera. At the Phase 0.8 boundary, exported versioned recipes were deliberately isolated drafts and could not change production choreography.

Phase 0.9 is the separately approved integration change anticipated by that boundary. The Studio selects a concrete application target instead of producing only an unbound recipe. The five left-to-right lobby intro slots own independent recipes while the application retains their exact runtime landing anchors. One shared Gentle Wind exit recipe is compiled for the current five cards using one explicit run seed, a shared gust, stable per-slot derivation, bounded variation, and five distinct fully offscreen lower-left endpoints. Applying a playbook persists it locally and previews the selected intro or exit through the actual lobby renderer. The same generic exit runs before Play, Shop, Tutorials, Replay, and Deck in Modern mode. These additions do not make lobby cards game-authoritative, do not change the stored Graphics preference, and do not convert the active-match surface.

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

### 4.3 Raphael outside the match and the lobby-hand exception

Raphael is also used by:

- `gh.cover`;
- `gh.menu`;
- `gh.deck`;
- `gh.shop`;
- `gh.endgame`.

Phase 0.5 brings one bounded part of `gh.menu` into scope: the five initially non-interactive card images displayed beneath the Play, Shop, and Tutorials command bar when the application first reaches the main-menu/lobby viewport. Phase 0.6 adds only the documented decorative click-to-double-flip behavior to their Modern projection, and Phase 0.7 adds only the seeded entrance tied to that menu presentation. The existing implementation uses one 755 by 562 Raphael paper for both the black command bar and those card images. It positions the card images at x coordinates 72, 197, 322, 447, and 572, with y 203 and a logical card size of 117 by 146.

The Modern implementation must therefore gate individual hand-card elements rather than the `gh.menu` Raphael paper. The bar, commands, statistics, next-rules content, and all menu navigation remain present and usable. `gh.cover`, `gh.deck`, `gh.shop`, `gh.endgame`, and every other part of `gh.menu` remain outside the Phase 0.5 through Phase 0.9 lobby-rendering slice. Phase 0.8 adds a separate authoring layer above that intact menu. Phase 0.9 adds only Modern lobby-hand intro/exit presentation and a short command-continuation wait; neither phase converts or takes rendering ownership of the surrounding Raphael surfaces.

Modern graphics mode must not unload, replace, delete, or globally disable `window.Raphael`.

### 4.4 Existing layout and protocol contracts

The following existing contracts remain authoritative unless a later requirements revision says otherwise:

- The active-match logical region is 693 by 500.
- The containing board and frame are 755 by 562.
- The main-menu/lobby Raphael paper and the dedicated Modern lobby-hand host use a 755 by 562 logical region.
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
| **Modern preview** | The intentionally inert Phase 0 Modern mode. It proves lazy Three.js delivery, WebGL mounting, runtime selection, and presentation/input gating but does not render playable cards. |
| **Lobby/main-menu viewport** | The first application screen containing the Play, Shop, and Tutorials command bar, statistics/rules content, and the five-card hand preview. It is not an active match or game state. |
| **Lobby-hand preview** | The five current-hand card faces displayed below the main command bar. Phase 0.5 renders them as a non-interactive Three.js preview; Phase 0.6 adds a decorative click-to-double-flip spike; Phase 0.7 records the rejected seeded entrance; Phase 0.9 supplies application-bound intro and exit sequences while all surrounding menu UI remains unchanged. |
| **Lobby-hand host** | The dedicated, transparent 755 by 562 DOM mount used only for the Modern lobby-hand preview. It is pointer-inert in Phase 0.5; Phase 0.6 may accept pointer activation only over a settled Modern card without blocking the surrounding menu. |
| **Lobby card re-entry lock** | The Phase 0.6 lock owned independently by each lobby card while that card animates. It rejects and does not queue a repeated activation of the same active card until exact settlement, but it does not block another settled card from starting its own concurrent animation. It is not a game, turn, card-selection, or server-request lock. |
| **Lobby presentation token** | The one-use identifier and reveal timestamp created by each `gh.menu.show()` call and carried to the Modern surface so async readiness can present at most one caught-up matching arrival batch. |
| **Card arrival profile** | A reusable seeded planner and sampler that accepts plain card dimensions and destinations. Phase 0.7 defines `casual-drop-left`; the profile contains no lobby slot coordinates or game authority. |
| **Motion Studio** | The application-local workbench introduced in Phase 0.8 and bound to concrete lobby playbook targets in Phase 0.9. It previews one Three.js card, exposes motion controls and transport, applies or previews a complete local lobby playbook, and never changes authoritative game state or the stored Graphics preference. |
| **Motion recipe** | A versioned plain-data description of a card transition. It contains validated values and stable semantic names, but no DOM node, Raphael element, Three.js object, callback, wall-clock timestamp, or application state reference. |
| **Motion draft** | The mutable recipe currently being edited in the Motion Studio. Phase 0.8 drafts were unbound studies. In Phase 0.9 the draft belongs to one declared playbook target and may be applied to the browser-local Modern lobby playbook; it still cannot affect the shop, active match, account, server, or repository defaults. |
| **Lobby motion playbook** | The versioned browser-local plain-data document that owns five independent intro entries, one shared Gentle Wind exit entry, its seed-lock policy, and no resolved card coordinates. It is the Phase 0.9 production input for Modern lobby intro/exit presentation in that browser. |
| **Application-bound motion target** | A stable Studio selection whose semantic start or destination is owned by the application. Phase 0.9 defines `Lobby card 1–5 — Intro` and `Lobby hand — Gentle Wind Exit`. |
| **Runtime-owned anchor** | The current renderer-supplied center and table position for one of the five lobby slots. Anchors are resolved from the live card layout when a sequence is compiled and are never serialized into the playbook. |
| **Gentle Wind exit** | One shared outbound lobby sequence compiled into five deterministic per-slot variants. A shared gust keeps the cards coherent while bounded per-card variation gives each a distinct path, cadence, lift, rotation, speed, and fully offscreen lower-left endpoint. |
| **Lobby command continuation** | The exactly-once callback held while a Modern Gentle Wind exit runs before Play, Shop, Tutorials, Replay, or Deck. Additional command clicks are ignored until it completes or fails open through its watchdog. |
| **Approved visual baseline** | A named recipe and reference capture that passed real-time review at the actual application size in addition to deterministic, lifecycle, and geometry checks. Structural test success alone does not confer this status. |
| **Requested mode** | The value selected and persisted by the user. |
| **Effective mode** | The mode currently presented to the user and permitted to own active-match pointer input. During the temporary Phase 0 bridge, the hidden Legacy implementation may remain mounted and synchronized even while Modern is effective. |
| **Renderer host** | The positioned 693 by 500 DOM mount occupied by the effective renderer. |
| **Outer UI** | Menus, cover, dialogs, deck editor, shop, endgame, title, footer, and other application UI outside the active-match renderer. The five-card lobby preview is a narrow rendering exception; its surrounding menu remains Outer UI. |
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
| DEC-008 | Only one active-match renderer may own player input. After renderer extraction, only one active-match renderer may also own match animation. Phase 0 temporarily permits hidden Raphael animation/state synchronization behind an inert Modern surface. |
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
| DEC-019 | Phase 0 Modern mode is a temporary presentation/input gate: active-match Raphael remains mounted and synchronized but is opacity-hidden, `aria-hidden`, and pointer-blocked; the Three.js surface is blank and pointer-inert. |
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

## 7. Goals

### 7.1 Product goals

- Give the player an explicit, understandable choice between Modern and Legacy active-match graphics.
- Preserve the present game as a reliable escape hatch and historical experience.
- Provide an early, low-risk visual proof by rendering the familiar five-card lobby hand and exercising one bounded decorative 3D turn without treating it as match state.
- Make the Modern experience materially more expressive through controlled 3D card motion.
- Give the user direct, repeatable control over one-card motion authoring before another five-card lobby entrance is promoted.
- Let the user bind authored motion to visible lobby intro and exit consumers, evaluate it in finished application context, and retain the complete playbook locally.
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
- Compile application-owned lobby anchors and seeded five-card variance outside the stored recipes so layout and data remain authoritative.
- Centralize coordinate conversion and hit testing.
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
- Prevent event-listener, animation-frame, texture, material, geometry, and WebGL-context leaks.
- Maintain clear focus and keyboard semantics before Modern becomes the default.
- Permit precise normal-speed, slowed, frame-stepped, and scrubbed review of an authored motion without leaving an idle animation loop.

## 8. Non-goals

The following are outside this initiative unless separately approved:

- removing Raphael from the application;
- migrating the cover, main-menu bar or commands, statistics, next-rules content, deck editor, shop, or endgame UI to Three.js;
- making lobby-hand cards draggable, selectable, game-authoritative, or generally interactive; the Phase 0.6 click-to-double-flip renderer spike is the sole approved exception to Phase 0.5's no-interaction and no-animation boundary;
- treating the lobby-hand preview as an in-match player hand or using it to submit a move;
- changing the game rules, AI, scoring, rewards, economy, persistence, or move validation;
- changing opaque client/server protocol fields merely to make them easier to read;
- changing canonical card identities or image-key naming;
- redrawing the card catalog;
- redesigning the board frame in the initial parity work;
- adding physics simulation;
- treating the current Phase 0.7 lobby scatter, its five gesture constants, or its 1.09 perspective limit as an approved visual baseline;
- applying a Motion Studio draft beyond the explicitly approved Phase 0.9 lobby intro and Gentle Wind exit targets, including the shop or active match, without another approval and integration phase;
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

From the existing application menu, the user opens Motion Studio without changing the current Legacy or Modern selection. The lobby remains intact behind an isolated workbench. The user chooses one of five left-to-right intro targets or the shared Gentle Wind exit, adjusts the editable motion values while its application anchor remains locked, and reviews the deterministic one-card study at several speeds. `Apply & Preview in Lobby` validates and locally persists the complete playbook, closes the Studio, and runs the selected production intro or exit in the actual five-card lobby before restoring the prior Graphics preference and reopening the Studio. The user may export or atomically import the whole playbook. No action promotes the playbook to the shop, active match, account, server, or repository defaults.

### 9.2.4 Player leaving and re-entering the Modern lobby

With Modern effective, the player selects Play, Shop, Tutorials, Replay, or Deck. The five cards lift and drift toward five distinct lower-left offscreen endpoints as one coherent Gentle Wind gesture. The selected command waits for the sequence, ignores additional command clicks while pending, and then continues exactly once; a renderer failure or bounded watchdog cannot trap navigation. Returning from the Tutorials submenu through Back replays the five current intro entries into their fixed lobby slots. With Legacy effective, these routes behave exactly as before and do not wait for the Modern playbook.

### 9.3 Player returning from the Phase 0 preview

During Phase 0, the player selects Modern during an active match and sees an inert preview rather than playable match cards. The context menu and main-menu route remain usable. The Phase 0.5 lobby cards do not change this active-match limitation. The player selects Legacy and immediately sees the same current Raphael match state that continued to synchronize while hidden. No reload, match resume, or renderer rebuild is required.

### 9.4 Unsupported or failed Modern environment

Modern initialization, asset loading, or context recovery fails. The application removes partial Modern ownership, activates Legacy exactly once, explains the effective fallback, and preserves the requested preference for later diagnosis unless a repeated-failure policy is explicitly adopted.

### 9.5 Reduced-motion player

The player has `prefers-reduced-motion` enabled. The same game information and actions are available, but spatial animation is shortened, replaced, or completed immediately. Controller sequencing still completes exactly once.

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
7. At most one renderer owns active-match pointer input. While the Phase 0 blank Modern surface is effective, neither surface owns gameplay pointer input.
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

### 10.1 Phased applicability

The invariants above describe the target architecture. Phase 0 is intentionally smaller and may retain the existing `gh.game` coupling behind the unchanged Legacy route.

In particular, Phase 0 does **not** require:

- extraction of a complete Legacy renderer;
- removal of Raphael handles from current hand and board arrays;
- a complete renderer-neutral snapshot;
- the revisioned renderer-application contract in Section 13;
- renderer-neutral replay or Sudden Death reconstruction;
- replacement of existing renderer-specific tests.

Phase 0 may use a shallow runtime presentation/input gate around the unchanged Legacy path and the inert Modern preview. Phase 0.5 may add a dedicated lobby-hand projection and a hand-element-only presentation gate without expanding the playable renderer boundary. Phase 0.6 may add only the documented decorative lobby-card click and bounded animation. Phase 0.7 may add only the documented seeded menu-presentation arrival. Phase 0.8 may add only the isolated one-card authoring workbench and renderer-neutral recipe facility. Phase 0.9 may bind those recipes only to the five Modern lobby intro slots and one shared Modern Gentle Wind exit, including the bounded command-continuation wait and Tutorials Back replay. None of these decorative or authoring slices expands the playable active-match renderer boundary. Each phase must meet every requirement and acceptance criterion explicitly assigned to it.

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

The Phase 0 bridge deliberately maintains both implementations in the DOM after Modern first initializes. Only one is presented as effective and neither the blank Modern surface nor a hidden Legacy surface may submit gameplay input.

When Legacy is effective:

- The existing active-match board and rule Raphael papers are visible and interactive exactly as before.
- Legacy game construction, state, timers, dialogs, review, replay, opponent work, and animation sequencing remain unchanged.
- The Modern bundle is not requested unless Modern was requested earlier on the same page.
- An already mounted Modern canvas may remain cached and hidden for later toggles, but it must be pointer-inert, `aria-hidden`, idle, and must not own an animation loop.
- Exactly one active-match board paper and one active-match rule paper exist.

While Modern is being requested or initialized:

- Requested mode may be Modern while effective mode remains Legacy.
- The current Legacy presentation and input remain available until the Modern bundle, renderer, context, host, and first blank render succeed.
- Repeated Modern selections must coalesce into one bundle load and one surface initialization.
- A later Legacy selection must win even if an earlier asynchronous Modern load completes afterward.

When Modern preview is effective:

- `window.Raphael` remains present and callable.
- Surrounding Outer UI continues to create and use Raphael surfaces; Phase 0.5 may separately project only the lobby hand through Three.js.
- The active-match board and rule Raphael papers remain mounted.
- The existing `gh.game` match state, Raphael objects, timers, callbacks, review/replay state, and server-response sequencing remain live and synchronized.
- The complete Legacy active-match presentation is opacity-hidden as one unit; selectively hiding card images is insufficient.
- The Legacy active-match hosts are marked `aria-hidden="true"` and block pointer input through `pointer-events: none` or an equivalent complete input gate.
- Hidden Legacy slot targets or delegated handlers cannot receive a pointer initiated over the active-match region.
- A Modern host occupies the same 693 by 500 logical bounds, inset 30 pixels from the top and left of the board frame.
- The Modern host contains one real Three.js WebGL canvas and may contain a renderer-neutral explanatory DOM message.
- The Three.js scene renders no cards, slots, scores, turn marker, rules, elements, bonuses, or gameplay effects in Phase 0.
- The Modern canvas and host are pointer-inert and cannot submit a human move.
- The CSS board background and HTML dialog overlay retain their existing stacking roles.
- The title, context menu, and route back to the main menu remain usable.
- The Modern surface requests frames only when initialized or resized and has no unconditional animation loop.
- At most one active-match WebGL context is owned by the application.

When Legacy becomes effective again:

- The Modern host becomes hidden, `aria-hidden`, and pointer-inert before Legacy accepts pointer input.
- The Legacy hosts become visible, accessibility-exposed as appropriate, and pointer-enabled.
- The exact existing Raphael paper objects and live match state are revealed; neither paper is rebuilt.
- Any state change or animation that completed while Legacy was hidden is already reflected.
- The switch itself issues no game request, move request, resume request, or match-state mutation.

This bridge is an implementation tactic for Phase 0 only. Phase 1 and later must still extract renderer-neutral state and progress toward one active playable renderer with explicit lifecycle ownership. Hidden live Raphael must not become the permanent Modern rendering architecture.

### 12.4 Preview communication

A completely blank board is technically acceptable for the seam, but it looks like a defect. Phase 0 should show a renderer-neutral DOM message such as:

> Modern match preview — playable card rendering is not implemented here yet. Select Legacy graphics to return to the current game.

The exact copy may change, but it must:

- identify the mode as an intentional preview;
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

The hidden Legacy controller may continue normal server-authoritative work that would have occurred without a graphics switch. The blank Modern host itself must never originate a move or add a second controller path.

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
- one board paper, one rule paper, one active-match Modern host, one lobby-hand Modern host, at most one current Three.js canvas, and at most one WebGL context exist;
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

- at most one current Modern surface kind and one application-owned WebGL context remain;
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

## 13. Target renderer contract

This is a target-state contract beginning in Phase 1. It is not a Phase 0 deliverable; the first increment may use the documented shallow runtime presentation/input gate and inert Modern host.

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

The renderer-neutral snapshot becomes mandatory in Phase 1 and expands as later parity work exposes additional state. Phase 0 is required to expose only requested mode, effective mode, active host, and recovery identifiers needed by its tests.

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
- Phase 0 must render one blank transparent frame with the pinned Three.js `WebGLRenderer`; it must not create card geometry, texture assets, picking targets, or a continuous animation loop.
- Phase 0.5 adds the first pre-Phase-2 exception to that blank-frame rule: the dedicated lobby-hand factory may create shared 117 by 146 card geometry, up to five card objects, and only the current lobby hand's same-origin face textures. Phase 0.6 additionally permits the shared canonical card-back texture, a side-only lit shared card slab, unlit mipmapped/anisotropic face materials, a calibrated perspective lobby camera, shared analytic-shadow geometry/texture with one independently controlled mesh/material per lobby card, hardware shadow mapping disabled, card-bounded hit testing, and one re-entry lock per active card. Phase 0.7 permits the same bounded shared animation-frame scheduler while at least one entrance or double flip is active, plus the pure seeded destination-driven arrival planner and sampler; its current entrance is implemented but not visually approved. Phase 0.8 permits a separate one-card study factory, deterministic renderer-neutral recipe planner/sampler, and one isolated demand-driven Studio scheduler. Phase 0.9 permits a pure application playbook compiler, five destination-locked intro entries, one origin-locked Gentle Wind exit compiled into five deterministic variants, and reuse of the lobby surface's existing sole scheduler. The active-match factory remains blank. No surface may create an unconditional animation loop.
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

The Phase 0.5 lobby-hand scene intentionally used an orthographic camera and unlit planes so its screen-space result approximated the established two-dimensional menu layout. Phase 0.6 supersedes that historical lobby baseline with five canonically flat cards; a head-on constrained perspective camera calibrated to preserve the settled layout with 450/900 clip planes; a face-anchored flat-table projection neutralizer that gives every slot the centered perspective silhouette without auxiliary pickup tilt or position-dependent fan; unlit sRGB face materials; mipmapped, anisotropic card textures; side-only lit slabs with 0.2 logical units of face clearance; and independently controllable lift-only analytic contact shadows whose geometry and texture are shared while hardware shadow mapping remains disabled. Phase 0.7 temporarily uses the same transform hierarchy for bounded seeded arrival pitch, yaw, and roll, then restores the exact Phase 0.6 canonical transform before input. Phase 0.8 reproduces that card/camera convention on an isolated one-card study surface so authored motion is evaluated against the production projection rather than an unrelated mock camera. Phase 0.9 compiles the same recipes against the live production anchors and camera for actual lobby intro and exit; it does not serialize or replace those renderer-owned anchors. These lobby decisions remain bounded visual experiments and do not select the later active-match camera, card geometry, lighting, texture-filtering, shadow, or choreography treatment.

### 15.4 Texture policy

- Only textures needed by the current lobby hand or current match, its card backs, board elements, and immediate effects should be loaded.
- The Phase 0.6 lobby card back is exactly `/images/cards/cardBack.png`. It is shared by all five lobby cards and has no player-color, opponent-color, ownership, captured-state, or purchased-card path variant.
- Texture color-space handling must preserve card-art appearance.
- Phase 0.6 front and back orientation must be tested at both same-direction local-X edge passages, at the `-π` upright-back milestone, at the `-2π` upright-front endpoint, and after exact normalization to zero.
- Phase 0.6 lobby card textures must generate mipmaps, use trilinear minification and linear magnification, and set anisotropy to the lesser of four and the renderer capability.
- Texture cache ownership must be explicit.
- Shared textures must use reference counting or equivalent ownership if several meshes use them.
- Disposal must release textures no longer retained by the renderer.
- Texture-load failures must not hang renderer-application promises.
- A required card face, card back, or core renderer asset that fails before input ownership must receive at most one bounded same-origin retry and then trigger Legacy initialization fallback.
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

The logical coordinate space remains 693 by 500 regardless of CSS application scale. `#content-wrapper` remains the owner of the application scale.

The provisional drawing-buffer ratio is:

```text
effectiveBufferRatio = min(devicePixelRatio × applicationScale, 3)
```

At the provisional cap, the drawing buffer may not exceed 2079 by 1500, or 3,118,500 pixels, without a documented Phase 2 budget change. Browser zoom affects the browser-reported pixel ratio and must not be multiplied a second time. The spike must compare sharpness at scale 3 against GPU cost and may revise the ratio or cap through this document's change-control process.

## 16. Nonfunctional requirements

### 16.1 Performance

Performance evidence must use two named deterministic fixtures:

- **GM-P100** is the worst representative real match: all ten match cards represented, nine slots, maximum relevant overlap, scores, rule messaging, elements/bonuses, and the most expensive approved simultaneous transition.
- **GM-P200** is a synthetic resilience scene with twice the normal card-object count. It does not expand supported game rules; it detects fragile rendering and picking behavior.

**NFR-PERF-001** — The Three.js spike must record reference hardware, browser version, viewport, device-pixel ratio, scene state, and measurement method.

**NFR-PERF-002** — On the agreed reference profile, GM-P100 must have a presented-frame time at or below 16.7 ms at the 95th percentile and 33.3 ms at the 99th percentile during the named transition. On the agreed modest profile, its 95th percentile must be at or below 33.3 ms.

**NFR-PERF-003** — Pointer event timestamp to first renderer-presented visual response must be at most 50 ms at the 95th percentile on the reference profile. The spike must document the browser instrumentation used to identify that presented response.

**NFR-PERF-004** — Once all visible transitions and approved ambient effects settle, the Modern renderer must stop requesting continuous frames.

**NFR-PERF-005** — Drawing-buffer ratio and dimensions must obey the provisional formula and 3,118,500-pixel maximum in Section 15.5 unless Phase 2 approves and records a replacement budget.

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

### 16.3 Security and privacy

**NFR-SEC-001** — Modern assets and scripts must be same-origin.

**NFR-SEC-002** — The implementation must preserve the application's Content Security Policy and document any proposed policy change before it is made.

**NFR-SEC-003** — No new `eval`, `new Function`, dynamic remote script, or equivalent code path may be introduced.

**NFR-SEC-004** — Client rendering remains untrusted presentation. Existing server-side request validation must remain unchanged.

**NFR-SEC-005** — Renderer diagnostics must not transmit card or match data externally.

**NFR-SEC-006** — External telemetry requires a separate privacy and product decision.

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

## 17. Behavior and parity matrix

In the Phase 0/0.5/0.6/0.7/0.8/0.9 column, “not rendered” or “disabled” means not rendered or operable by Three.js on the active-match surface. The corresponding Legacy match objects remain live and synchronized behind the opacity and pointer gate so they can be revealed immediately. The lobby-hand row is the sole pre-Phase-1 card-rendering exception; its Phase 0.6 double flip, rejected Phase 0.7 entrance, and Phase 0.9 playbook motion are decorative rather than playable input. Phase 0.8 adds the isolated authoring tool, and Phase 0.9 binds it only to Modern lobby presentation.

| Capability | Legacy requirement | Phase 0/0.5/0.6/0.7/0.8/0.9 Modern preview | Playable Modern requirement |
|---|---|---|---|
| Lobby/main-menu hand | Five non-interactive Raphael card faces beneath the command bar; commands remain immediate | Phase 0.5 renders up to five Three.js card faces; Phase 0.6 permits per-card lift/back/front/settle effects; Phase 0.7's entrance remains rejected; Phase 0.9 provides five fixed-anchor intros, one seeded five-instance Gentle Wind exit, command waits with fail-open continuation, and Tutorials Back intro replay | Remains a separate decorative menu projection |
| Motion Studio | Not present; Legacy state remains unchanged beneath it | Phase 0.8 provides one isolated, non-authoritative card authoring surface; Phase 0.9 binds it to a local six-target lobby playbook and production preview without changing stored Graphics preference | May remain an internal authoring tool; it is not match input |
| Board frame | Unchanged | Visible | Preserved or deliberately redesigned later |
| Player hand | Fully functional | Not rendered | Rendered and interactive |
| Opponent hand | Fully functional | Not rendered | Correct open/closed state |
| Existing board cards | Fully functional | Not rendered | Rendered from snapshot |
| Nine board slots | Fully functional | Three.js renders none; hidden Legacy targets are pointer-blocked | Correct layout and hit testing |
| Scores | Fully functional | Not rendered | Semantically identical values |
| Turn marker | Fully functional | Not rendered | Clear active-player state |
| Rule banner | Fully functional | Not rendered | Equivalent information and sequencing |
| Element icons/bonus | Fully functional | Not rendered | Equivalent state and readable feedback |
| Card selection | Fully functional | Disabled | Semantic input and lift |
| Movement | Fully functional | Disabled | Scale-correct world mapping |
| Valid drop | Fully functional | Disabled | One request and correct placement |
| Invalid drop | Fully functional | Disabled | No request and deterministic return |
| Basic capture | Fully functional | Disabled | Correct result presentation |
| Same / Same Wall | Fully functional | Disabled | Correct result presentation |
| Plus | Fully functional | Disabled | Correct result presentation |
| Combo | Fully functional | Disabled | Correct resolved sequence |
| Closed reveal | Fully functional | Disabled | True front/back reveal |
| Sudden Death | Fully functional | Disabled | Snapshot-based redeal and restored input |
| Review/replay | Fully functional | Modern is non-playable; hidden Legacy state may continue synchronizing | Renderer-neutral reconstruction |
| Tutorials | Fully functional | Modern is non-playable; hidden Legacy state may continue synchronizing | Same selection and parity contract |
| Dialog dimming | Fully functional | Remains DOM-owned | Remains DOM-owned |
| Application scaling | Fully functional | Host remains aligned | Full interaction and visual parity |
| Reduced motion | No new regression | Phase 0.6 uses a bounded back/front proof with no lift or continuous rotation; Phase 0.7 commits arrivals directly at their destinations; Phase 0.8 opens paused and requires explicit full-motion preview; Phase 0.9 commits intro/exit terminal states and releases command flow exactly once | Required before default |
| Context loss | Not applicable | Restore effective Legacy and explain the reason | Recover or fall back |
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
- evolve the blank transparent active-match WebGL renderer already mounted in the Modern host; do not treat the separate lobby-hand scene as an active-match snapshot;
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
| Surface | lobby-hand preview, active-match preview, transition between those surface kinds |
| Preference | unset, Legacy, Modern, invalid value, unavailable storage, kill switch, active/expired failure backoff, explicit retry |
| Lobby hand | zero through five cards, purchased and standard image paths, delayed texture, failed texture, hand replacement while loading, repeated show/hide |
| Motion Studio | open from Legacy and Modern, every built-in preset, control endpoints, synchronized drag/numeric edits, play/pause/rate/loop/frame-step/scrub, Auto Replay, valid/invalid import, export round trip, session restore, reduced-motion entry, close and context loss |
| Motion recipe | fixed seed and canonical times, irregular frame cadence, every supported schema version, prohibited renderer objects, invalid/non-finite values, deterministic export/import equality |
| Match state | initial hand, resumed match, occupied board, Open, Closed, Elemental, final turn |
| Capture | Basic, Same, Same Wall, Plus, Combo, multiple simultaneous captures |
| Flow | normal play, invalid drop, request pending, dialog, endgame, Sudden Death, review, replay, tutorial |
| Scale | 1, 1.5, 2, 3 |
| Pixel density | DPR 1, 2, and capped higher DPR |
| Input | mouse; `KB-PLAY-01` keyboard and accessible-tree coverage before beta; Chromium/VoiceOver manual smoke; touch/pen when declared supported |
| Motion | normal, reduced motion, interrupted, fast-forwarded, disposed |
| Lifecycle | first mount, rebuild, repeated toggle/build, background restore, resize, cleanup |
| Failure | missing texture, renderer init error, context loss, storage error |

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
- tested Modern-default environment matrix;
- current known limitations.

### 19.4 Requirements-to-phase traceability

Phase 0, Phase 0.5, Phase 0.6, Phase 0.7, Phase 0.8, and Phase 0.9 requirements and acceptance criteria are the authorized engineering baseline as of 2026-07-24. Phase 0.7's deployed implementation has not passed its visual acceptance gate and is not an approved motion baseline. Phase 0.8 established the authoring workbench; Phase 0.9 is the current authorized application-bound lobby integration. Later requirements describe the intended target and gates; each later phase must begin with a short entry review that resolves its open questions, confirms its fixtures, and converts any remaining provisional numerical budget into an accepted measurement contract.

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
| `NFR-PERF-*` | Phase 2 | Modern build and renderer | GM-P100/GM-P200 performance and bundle report | Yes |
| `NFR-REL-*` | Phase 1/5 | Both renderers and controller | Repeated lifecycle, heap/resource, stale-revision, and severity report | Yes |
| `NFR-SEC-*` | Phase 2 | Build/deployment boundary | CSP, same-origin, dependency, and network audit | Yes |
| `NFR-COMP-*` | Phase 2/6 | Browser test matrix | Tested Modern-default matrix | Yes |
| `NFR-MAINT-*` | Phase 1 | Renderer contract owners | Boundary review, upgrade procedure, shared tests | Yes |

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
| Visual state is read as model state | Modern cannot reproduce or recover correctly | Explicit snapshot fields for face, zone, position, ownership, lock, and order |
| Z-order is functional | Wrong card is selected or capture/hand overlap is incorrect | Canonical semantic depth and deterministic raycast sorting |
| Phase 0 suppresses the complete Legacy match presentation | Scores, rules, targets, and turn state are intentionally not visible in the blank preview | Keep Raphael live and synchronized behind a complete opacity, accessibility, and pointer gate; label Modern non-playable and provide immediate Legacy return |
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
| Phase 0 runtime gate accidentally becomes a renderer hot swap | Lost input, duplicate request, stale scene, or hidden targets accepting input | Do not dispose, rebuild, or transfer state in Phase 0; keep one live Legacy controller, gate both surfaces atomically, make Modern pointer-inert, and test node/state identity across toggles |
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
| Remote dependency delivery violates self-contained design | Startup, CSP, and archival failure | Pin, bundle, and serve all Modern code locally |

## 22. Open design questions

These questions do not block Phase 0 unless noted, but each must be resolved in the identified phase.

| ID | Question | Recommendation | Resolve by |
|---|---|---|---|
| OQ-001 | Exact user-facing control copy | Resolved: `Graphics` with `Legacy` and `Modern`; adjacent status identifies the non-playable Preview | Phase 0 |
| OQ-002 | Blank preview or explanatory message | Require the explanatory DOM message | Phase 0 |
| OQ-003 | Runtime application after mode selection | Resolved: apply immediately through the Phase 0 presentation/input gate; never require or force a reload | Phase 0 |
| OQ-004 | Perspective or orthographic primary active-match camera | Phase 0.5 remains recorded as the historical orthographic lobby baseline, while Phase 0.6 uses a calibrated constrained perspective camera for the lobby experiment. Use that evidence, without treating it as an automatic active-match decision, when Phase 2 selects the primary match camera. | Phase 2 |
| OQ-005 | Thin box or paired planes for an active-match card | Phase 0.6 resolves only the lobby experiment as a three-unit side-only lit slab, hidden slab caps, distinct unlit face planes, and 0.2 units of clearance. Decide the active-match representation through edge, orientation, depth-stability, and draw-cost measurements. | Phase 2 |
| OQ-006 | Per-card textures or atlas | Phase 0.5 uses per-card current-lobby-hand textures; begin the active match with cached current-match textures and add an atlas only if profiling justifies it | Phase 2 |
| OQ-007 | Exact active-match shadows and lighting | Phase 0.6 lights only the lobby slab sides, keeps face art unlit, disables hardware shadow maps, and uses one independently controlled lift-only analytic contact shadow per card over shared geometry/texture. Treat that artifact-free concurrent result as evidence; select the active-match treatment in Phase 2. | Phase 2 |
| OQ-008 | Score/rule/turn UI in WebGL or DOM | Prefer DOM where it improves accessibility and reduces texture/glyph work | Phase 3 |
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
- expanding the initiative to application Raphael surfaces beyond the explicitly approved lobby-hand exception;
- promoting a Motion Studio draft or playbook beyond the five Phase 0.9 lobby intro targets and shared Gentle Wind exit, including into the shop or active match;
- changing the Motion Studio recipe or lobby-playbook schema, changing the six-target registry, serializing application anchors, or moving persistence from browser-local state to account/server state;

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
- Lobby/main-menu implementation and five-card hand projection: `public/js/plugins/gh.menu.js`
- Graphics-mode and surface-kind coordinator: `public/js/plugins/gh.graphics.js`
- Modern active-match and lobby-hand source: `frontend/src/modern-graphics.js`
- Renderer-neutral Motion Studio recipe/planner source: `frontend/src/card-motion.js`
- Renderer-neutral application lobby playbook, seeded batch compiler, and sampler: `frontend/src/lobby-motion-playbook.js`
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
- Motion and application-playbook static contracts: `tests/static/card-motion-contract.mjs` and the Phase 0.9 lobby-playbook contract
- Modern lobby and Motion Studio browser coverage: `tests/browser/lobby-modern-hand.spec.js` and `tests/browser/motion-studio.spec.js`
- Legacy browser coverage: `tests/browser/smoke.spec.js`, `tests/browser/scale-interactions.spec.js`, `tests/browser/dialog-scale.spec.js`, and `tests/browser/endgame-protection.spec.js`

## 26. External technical references

- [Three.js package and published version](https://www.npmjs.com/package/three)
- [Three.js installation](https://threejs.org/manual/en/installation.html)
- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js PerspectiveCamera](https://threejs.org/docs/pages/PerspectiveCamera.html)
- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html)
- [Three.js rendering on demand](https://threejs.org/manual/en/rendering-on-demand.html)
