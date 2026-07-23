# Graphics modernization requirements

| Field | Value |
|---|---|
| Status | Phase 0 implementation baseline |
| Version | 0.2 |
| Last updated | 2026-07-23 |
| Scope | Active-match graphics and interactions |
| Modern renderer | Three.js `0.185.1` (`r185`) with `WebGLRenderer`, selected for Phase 0 and provisional for the playable renderer |

> **Implementation status — 2026-07-23:** Phase 0 is authorized for implementation. Its runtime bridge keeps the existing active-match Raphael papers mounted and synchronized, gates their presentation and pointer input while Modern is selected, and lazily mounts an inert self-hosted Three.js `0.185.1` (`r185`) WebGL surface. This bridge is deliberately temporary; it does not replace the target renderer-neutral architecture described later in this document.

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

This document defines the intended outcome, constraints, phased delivery plan, and acceptance criteria for modernizing the active-match graphics in Pure Triple Triad.

It is deliberately more detailed than an implementation ticket. The modernization will cross a legacy rendering implementation, animation-driven control flow, input handling, tests, build and dependency delivery, accessibility, and failure recovery. Once reviewed and accepted, this document is intended to be the stable product and engineering reference for that work.

The document is intended to:

- keep the original game fully playable throughout the modernization;
- distinguish the active-match renderer from the application's other Raphael surfaces;
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

Raphael will remain loaded and usable. This project does not attempt to remove Raphael from the application as a whole. The cover, main menu, deck editor, shop, endgame screen, and other surrounding surfaces continue to depend on it.

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

### 4.3 Raphael outside the match

Raphael is also used by:

- `gh.cover`;
- `gh.menu`;
- `gh.deck`;
- `gh.shop`;
- `gh.endgame`.

Those surfaces are outside this project's initial scope. Modern graphics mode must not unload, replace, delete, or globally disable `window.Raphael`.

### 4.4 Existing layout and protocol contracts

The following existing contracts remain authoritative unless a later requirements revision says otherwise:

- The active-match logical region is 693 by 500.
- The containing board and frame are 755 by 562.
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
| **Requested mode** | The value selected and persisted by the user. |
| **Effective mode** | The mode currently presented to the user and permitted to own active-match pointer input. During the temporary Phase 0 bridge, the hidden Legacy implementation may remain mounted and synchronized even while Modern is effective. |
| **Renderer host** | The positioned 693 by 500 DOM mount occupied by the effective renderer. |
| **Outer UI** | Menus, cover, dialogs, deck editor, shop, endgame, title, footer, and other application UI outside the active-match renderer. |
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
| DEC-001 | The modernization applies first to the active-match surface only. |
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

## 7. Goals

### 7.1 Product goals

- Give the player an explicit, understandable choice between Modern and Legacy active-match graphics.
- Preserve the present game as a reliable escape hatch and historical experience.
- Make the Modern experience materially more expressive through controlled 3D card motion.
- Allow the renderer to evolve without rewriting the server-side game.
- Keep a match resumable when the selected renderer is unavailable or fails.
- Avoid trapping the player on a blank, broken, or non-interactive surface.

### 7.2 Engineering goals

- Separate renderer-neutral state and control flow from Raphael handles.
- Define one semantic contract implemented by both renderers.
- Make renderer lifecycle explicit: mount, synchronize, activate, suspend, resize, and dispose.
- Make all animation/transition completion deterministic and testable.
- Centralize coordinate conversion and hit testing.
- Ensure only one renderer and one set of input handlers is active.
- Provide renderer-neutral diagnostics and test snapshots.
- Add Modern code without requiring a broad rewrite of the legacy application.
- Preserve the existing same-origin security and self-contained deployment model.

### 7.3 Quality goals

- Keep Legacy behavior and regression coverage intact at every phase.
- Establish measurable performance and resource budgets during the Three.js spike.
- Support reduced motion.
- Recover from Modern initialization and WebGL-context failures.
- Prevent event-listener, animation-frame, texture, material, geometry, and WebGL-context leaks.
- Maintain clear focus and keyboard semantics before Modern becomes the default.

## 8. Non-goals

The following are outside this initiative unless separately approved:

- removing Raphael from the application;
- migrating the cover, menu, deck editor, shop, or endgame UI to Three.js;
- changing the game rules, AI, scoring, rewards, economy, persistence, or move validation;
- changing opaque client/server protocol fields merely to make them easier to read;
- changing canonical card identities or image-key naming;
- redrawing the card catalog;
- redesigning the board frame in the initial parity work;
- adding physics simulation;
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

The player selects Modern in the existing dropdown. The application persists the choice, lazily loads Three.js if necessary, and switches the active-match presentation to the inert Three.js surface on the same page. The rest of the application continues using its existing UI technologies.

### 9.3 Player returning from the Phase 0 preview

During Phase 0, the player selects Modern and sees an inert preview rather than cards. The context menu and main-menu route remain usable. The player selects Legacy and immediately sees the same current Raphael match state that continued to synchronize while hidden. No reload, match resume, or renderer rebuild is required.

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

### 10.1 Phased applicability

The invariants above describe the target architecture. Phase 0 is intentionally smaller and may retain the existing `gh.game` coupling behind the unchanged Legacy route.

In particular, Phase 0 does **not** require:

- extraction of a complete Legacy renderer;
- removal of Raphael handles from current hand and board arrays;
- a complete renderer-neutral snapshot;
- the revisioned renderer-application contract in Section 13;
- renderer-neutral replay or Sudden Death reconstruction;
- replacement of existing renderer-specific tests.

Phase 0 may use a shallow runtime presentation/input gate around the unchanged Legacy path and the inert Modern preview. It must still meet every requirement and acceptance criterion explicitly assigned to Phase 0.

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

## 11. Functional requirements

### 11.1 Graphics-mode preference

**FR-MODE-001** — The existing context menu must contain a clearly labeled Graphics control.

**FR-MODE-002** — The control must expose exactly two normal user choices: `Legacy` and `Modern`. During Phase 0 and any non-playable beta, adjacent status or explanatory copy must clearly identify Modern as a non-playable preview; the button label itself may remain `Modern`.

**FR-MODE-003** — The selected choice must be keyboard operable and expose programmatic state through native radio semantics, `aria-pressed`, or an equivalent accessible pattern.

**FR-MODE-004** — The application must distinguish the requested mode from the effective mode.

**FR-MODE-005** — In Phase 0, selecting `Legacy` or `Modern` must apply on the current page without reload. Selecting Modern must not hide or pointer-block Legacy until the Modern bundle and WebGL surface have initialized successfully. Selecting Legacy must reveal the current live Raphael state immediately without reconstructing the match or its papers.

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

**FR-LIFE-008** — The modern host must occupy the same 693 by 500 logical region as the two Legacy papers, inset 30 pixels from the top and left of the 755 by 562 board.

**FR-LIFE-009** — Both renderers must coexist with the existing 755 by 562 CSS board frame and HTML dialog overlay.

**FR-LIFE-010** — A renderer must be able to reconstruct its complete settled visual state from a snapshot without reading objects created by the other renderer.

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
- Outer UI continues to create and use Raphael surfaces.
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

> Modern graphics preview — card rendering is not implemented yet. Select Legacy graphics to return to the current game.

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

If requested Modern is restored from storage on a new page, Legacy may initialize normally behind the gate while Modern loads. Effective mode remains Legacy until Modern initialization succeeds. If a visible startup transition is later considered undesirable, it may be masked by existing loading presentation; it must not be solved by skipping Legacy construction in Phase 0.

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
- one board paper, one rule paper, one Modern host, one Three.js canvas, and at most one WebGL context exist;
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
- no application code outside active-match selection treats Modern as playable;
- Legacy remains the documented default;
- the preview is clearly labeled;
- the user can return to Legacy immediately without clearing storage or reloading;
- the pinned Three.js bundle is reproducibly built, license-recorded, and served from the same origin;
- the temporary hidden-live-Raphael bridge is identified in code and documentation as Phase 0 debt;
- no server, database, rules, or protocol change was needed;
- a code review confirms that outer Raphael usage remains untouched.

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
- Lazy-load failure before input ownership must follow the initialization-fallback policy.
- Source-map publication, generated-file review, and third-party license-notice policy must be explicit.
- A lockfile, upgrade procedure, and license record must accompany the dependency.

### 15.2 Renderer selection

- The first supported backend is `WebGLRenderer`.
- WebGL 2 capability must be checked separately from the legacy `Modernizr.canvas` gate.
- Experimental WebGPU work requires a separate decision.
- `WebGPURenderer` must not become a silent launch requirement.

### 15.3 Initial scene strategy

The initial scene should favor clarity and simplicity:

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

### 15.4 Texture policy

- Only textures needed by the current match, its card backs, board elements, and immediate effects should be loaded.
- Texture color-space handling must preserve card-art appearance.
- Front and back orientation must be tested edge-on and through a complete turn.
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

### 16.2 Reliability and cleanup

**NFR-REL-001** — No renderer exception may terminate the match controller without a controlled error or fallback path.

**NFR-REL-002** — Fifty repeated mount/dispose cycles must not produce duplicate semantic actions.

**NFR-REL-003** — After 50 mount/dispose cycles and a five-second settle window, application-owned canvases, active animation-frame requests, registered listeners/observers, renderer registry references, and emitted semantic actions must return to their baseline counts. WebGL-context and retained-heap evidence must use a documented Chromium/CDP diagnostic profile with warmed runs, forced garbage collection, and `forceContextLoss()` on disposal when the extension is available. Browser-managed context destruction is diagnostic rather than a cross-browser exact-count gate. Phase 2 must set a numerical retained-growth tolerance before beta.

**NFR-REL-004** — Renderer-application promises must settle exactly once under normal completion, reduced motion, cancellation, supersession, disposal, texture failure, and context loss.

**NFR-REL-005** — A fallback must preserve the server-authoritative match and must not submit a move.

**NFR-REL-006** — Background/foreground and visibility changes must not leave the renderer accepting input against stale state.

**NFR-REL-007** — A P0 renderer defect is one that corrupts authoritative game state, duplicates a move, exposes concealed game information, traps the application without a Legacy recovery route, or makes both modes unusable. A P1 renderer defect breaks a complete declared match flow, renderer fallback, required input method, or required accessibility flow without corrupting authoritative state.

**NFR-REL-008** — GM-P100, GM-P200, teardown, and fallback tests must declare their timeout and settle conditions rather than rely on arbitrary sleeps.

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

In the Phase 0 column, “not rendered” or “disabled” means not rendered or operable by Three.js. The corresponding Legacy objects remain live and synchronized behind the opacity and pointer gate so they can be revealed immediately.

| Capability | Legacy requirement | Phase 0 Modern preview | Playable Modern requirement |
|---|---|---|---|
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
| Reduced motion | No new regression | Static | Required before default |
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

- extend and validate the isolated, pinned, same-origin Three.js build introduced in Phase 0;
- review the existing production manifest, pinned toolchain declaration, lockfile, reproducible build/validation command, generated-artifact policy, module ABI, and license/source-map policy;
- evolve the blank transparent WebGL renderer already mounted in the Modern host;
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
| Preference | unset, Legacy, Modern, invalid value, unavailable storage, kill switch, active/expired failure backoff, explicit retry |
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
- tested Modern-default environment matrix;
- current known limitations.

### 19.4 Requirements-to-phase traceability

Phase 0 requirements and acceptance criteria are the authorized implementation baseline as of 2026-07-23. Later requirements describe the intended target and gates; each later phase must begin with a short entry review that resolves its open questions, confirms its fixtures, and converts any remaining provisional numerical budget into an accepted measurement contract.

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
| Texture orientation or color is wrong | Mirrored backs, seams, or altered art | Spike front/back turns, color-space decisions, and edge-on tests |
| Transparent sorting or z-fighting | Flicker and incorrect overlap | Deliberate geometry separation, depth policy, and representative stress scenes |
| WebGL/browser variability | Blank board or unusable input | WebGL 2 capability probe, buffer cap, pre-input Legacy fallback, and controlled post-input recovery/reload |
| Repeatable Modern failure retries every reload | User is trapped in a failure/reload loop | Classified tab-scoped backoff, Legacy suppression window, expiry, and explicit retry |
| Context or resource leaks | Performance degrades across matches | Central ownership and repeated lifecycle tests |
| Modern bundle delays Legacy | Regression for users who prefer the original | Isolated lazy-loaded Modern bundle |
| Canvas-only interaction | Accessibility regression | Synchronized semantic DOM controls before Modern default |
| Excessive motion | Discomfort and reduced clarity | Restrained effects and `prefers-reduced-motion` behavior |
| Replay and Sudden Death reuse render handles | Highest-risk parity paths | Snapshot-based reconstruction and dedicated fixtures |
| Empty preview appears broken | User confusion | Clear Preview label and DOM explanation |
| Phase 0 runtime gate accidentally becomes a renderer hot swap | Lost input, duplicate request, stale scene, or hidden targets accepting input | Do not dispose, rebuild, or transfer state in Phase 0; keep one live Legacy controller, gate both surfaces atomically, make Modern pointer-inert, and test node/state identity across toggles |
| Remote dependency delivery violates self-contained design | Startup, CSP, and archival failure | Pin, bundle, and serve all Modern code locally |

## 22. Open design questions

These questions do not block Phase 0 unless noted, but each must be resolved in the identified phase.

| ID | Question | Recommendation | Resolve by |
|---|---|---|---|
| OQ-001 | Exact user-facing control copy | Resolved: `Graphics` with `Legacy` and `Modern`; adjacent status identifies the non-playable Preview | Phase 0 |
| OQ-002 | Blank preview or explanatory message | Require the explanatory DOM message | Phase 0 |
| OQ-003 | Runtime application after mode selection | Resolved: apply immediately through the Phase 0 presentation/input gate; never require or force a reload | Phase 0 |
| OQ-004 | Perspective or orthographic primary camera | Use constrained perspective unless the spike shows unacceptable layout distortion | Phase 2 |
| OQ-005 | Thin box or paired planes for a card | Decide through edge, orientation, and draw-cost measurements | Phase 2 |
| OQ-006 | Per-card textures or atlas | Begin with cached current-match textures; add an atlas only if profiling justifies it | Phase 2 |
| OQ-007 | Exact shadows and lighting | Favor simple art-preserving materials and restrained contact/depth cues | Phase 2 |
| OQ-008 | Score/rule/turn UI in WebGL or DOM | Prefer DOM where it improves accessibility and reduces texture/glyph work | Phase 3 |
| OQ-009 | Playable-renderer switching after full decoupling | Phase 0's non-playable presentation gate does not decide this; keep later renderer reconstruction at safe boundaries unless a clear user need justifies playable hot swap | Phase 6 or later |
| OQ-010 | Touch and pen support window | Design with Pointer Events, schedule after desktop parity | Phase 5+ |
| OQ-011 | Exact reference hardware and performance budgets | Record representative current and modest hardware during the spike | Phase 2 |
| OQ-012 | Modern-default eligibility policy | Require all Phase 6 gates and an explicit decision | Phase 6 |
| OQ-013 | Runtime recovery timeout and snapshot-safe fallback checkpoint | Decide through the Phase 2 context-loss experiment; do not promise a live swap beforehand | Phase 2 |
| OQ-014 | Retained-heap diagnostic tolerance | Set it from warmed Chromium/CDP lifecycle baselines | Phase 2 |

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
- expanding the initiative to other application Raphael surfaces.

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
- Application manager and scaling: `public/js/default/index.js`
- Context-menu markup: `application/views/partials/overlays.phtml`
- Active-board styles: `public/css/default/index.css`
- Script delivery: `application/views/layouts/standalone.phtml`
- Browser security policy: `public/.htaccess`
- Container asset delivery: `docker/php56-apache.Dockerfile` and `.dockerignore`
- Browser-suite configuration: `tests/browser/playwright.config.js`
- Legacy browser coverage: `tests/browser/smoke.spec.js`, `tests/browser/scale-interactions.spec.js`, `tests/browser/dialog-scale.spec.js`, and `tests/browser/endgame-protection.spec.js`

## 26. External technical references

- [Three.js package and published version](https://www.npmjs.com/package/three)
- [Three.js installation](https://threejs.org/manual/en/installation.html)
- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js PerspectiveCamera](https://threejs.org/docs/pages/PerspectiveCamera.html)
- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html)
- [Three.js rendering on demand](https://threejs.org/manual/en/rendering-on-demand.html)
