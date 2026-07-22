# Triple Triad: the complete evidence-backed vanilla rules

## *Final Fantasy VIII* (original 1999 PlayStation game)

**Scope.** This is a complete evidence-backed rules reference for Triple Triad in the original *Final Fantasy VIII*: the core match, all seven playable special rules, Combo, all four normal trade rules, observable edge cases, and the world-level system by which regional rules spread, disappear, and change. Given the card data, starting-hand and first-player random outcomes, chosen moves, active match rules, and an Elemental layout, the deterministic match resolver is fully specified. Several internal random/state details are not recoverable with equal confidence from the accessible sources—the Elemental-layout distribution, the all-seven abolition weighting, the Queen's interior direction split, and unexposed branches of the two-slot carried-region queue—and are explicitly labeled instead of guessed. This is not a redesign, a balanced tabletop adaptation, the 2019 remaster as a separate ruleset, *Final Fantasy XIV*'s version, Triple Triad Portal, or a fan expansion.

**Terminology.** This document uses the North American PlayStation names: **Random**, **Same Wall**, and **All**. The Japanese guide's English translation calls these **Random Hand**, **Wall Same**, and **Full**; they are the same rules. “Player” means Squall/the human-controlled side and “opponent” means the NPC, although almost every match rule is symmetric.

**Verification basis.** The highest-priority sources are a scan of the [original Squaresoft North American owner's manual](https://db.hfsplay.fr/files/2021/01/16/Final_Fantasy_VIII_-_1999_-_Square_Co._Ltd._mHbenLO.pdf) (with a [second scan mirror](https://www.gamesdatabase.org/Media/SYSTEM/Sony_Playstation/Manual/formated/Final_Fantasy_8_-_1999_-_Sony_Computer_Entertainment.pdf) and an [unofficial searchable transcription](https://manuals.plus/m/afd0d9ca9e5b068e62e54fa8f5d67eb9606e8bc23eb42b75fe6a9be31cd73093)) and Henry H. Jerng's contemporary fan [translation of Chapter 5 of the *Final Fantasy VIII Ultimania*](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/4902) (Studio BentStuff/DigiCube, ISBN 4-925075-49-7, pp. 154–185). The Japanese book—not Jerng's English translation—was published on March 31, 1999 and was completely supervised by Square. Details omitted, ambiguous, or mistranslated there were checked against a modern [PlayStation-focused Triple Triad guide](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525), [StrategyWiki's FFVIII card reference](https://strategywiki.org/wiki/Final_Fantasy_VIII/Cards), the [Final Fantasy Wiki's FFVIII-specific article](https://finalfantasy.fandom.com/wiki/Triple_Triad_%28Final_Fantasy_VIII%29), and reverse-engineered PS1 analyses. Source disagreements and corrections are identified rather than silently blended.

---

## Contents

1. [Rules at a glance](#1-rules-at-a-glance)
2. [Cards, board, ownership, and adjacency](#2-cards-board-ownership-and-adjacency)
3. [Starting a match](#3-starting-a-match)
4. [A turn and the basic capture rule](#4-a-turn-and-the-basic-capture-rule)
5. [Ending and scoring a round](#5-ending-and-scoring-a-round)
6. [The seven special rules](#6-the-seven-special-rules)
7. [Combo and complete capture resolution](#7-combo-and-complete-capture-resolution)
8. [Trade rules and card ownership after the match](#8-trade-rules-and-card-ownership-after-the-match)
9. [Regional rules: the starting world state](#9-regional-rules-the-starting-world-state)
10. [How special rules spread and are abolished](#10-how-special-rules-spread-and-are-abolished)
11. [How trade rules change](#11-how-trade-rules-change)
12. [Special NPC and endgame cases](#12-special-npc-and-endgame-cases)
13. [Worked examples and edge cases](#13-worked-examples-and-edge-cases)
14. [What is not in vanilla FFVIII Triple Triad](#14-what-is-not-in-vanilla-ffviii-triple-triad)
15. [Source audit and known documentation traps](#15-source-audit-and-known-documentation-traps)

---

## 1. Rules at a glance

- Two sides begin with **five cards each**.
- The board is an empty **3×3 grid**. Only orthogonally touching cards interact; diagonals never do.
- First player is chosen randomly. Players alternate placing one card into one empty space. There is no rotation, pass, move, or removal action.
- A card has four ranks—up, right, down, and left—each from **1** through **A**, where **A = 10**.
- Under the basic rule, the just-placed card captures each adjacent opponent card when its facing rank is **strictly greater** than that opponent's facing rank. Equality does nothing.
- The board fills after nine turns. The first player has placed all five cards; the second has placed four and retains one.
- The score counts all ten cards: the nine on the board plus the second player's unplayed card. The side controlling more cards wins; **5–5 is a draw**.
- A match may also use any subset of seven special rules: **Open, Random, Sudden Death, Same, Plus, Same Wall, and Elemental**. **Combo** is an automatic consequence of Same/Plus, not an eighth selectable rule.
- A separate normal trade rule—**One, Diff, Direct, or All**—determines which actual cards change permanent owners afterward. A one-time uninitialized no-trade state is possible through a Balamb-harbor bug.
- In the FFVIII campaign, every card-playing NPC belongs to one of eight rule regions. Regional special rules and trade rules can change over time.

The manual confirms the five-card hands, random first player, 3×3 board, alternating placement, card-as-point scoring, four ranks, and strictly-higher basic capture. Jerng's translation of the Square-supervised [Japanese Ultimania chapter](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/4902) supplies the complete special-, trade-, and regional-rule structure.

---

## 2. Cards, board, ownership, and adjacency

### 2.1 The card set

The game contains **110 card identities**, arranged as ten levels of eleven cards. The manual groups the artwork into four broad types:

- Levels 1–5: Monster cards
- Levels 6–7: Boss cards
- Levels 8–9: GF cards
- Level 10: Character cards

Those level/type labels organize the collection and NPC card pools; they do **not** impose a deck-construction limit. The original game has no star-rarity budget, no “one five-star card” restriction, and no prohibition on combining several high-level cards.

Each card identity has:

- one fixed rank for each direction—up, right, down, and left;
- a fixed illustration and level;
- either one of eight elements or no element.

The eight card elements are **Fire, Ice, Thunder, Earth, Poison, Wind, Water, and Holy**. Element has no effect unless the Elemental special rule is active.

The 110-row card catalogue is component data, not an additional rule, so it is not duplicated here. The [Ultimania translation](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/4902) tabulates the original ranks, elements, and acquisition data; the modern [PlayStation card list](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/card-list) is a convenient acquisition/Card Mod cross-reference, though its text does not itself reproduce every rank.

### 2.2 Ranks

Ranks have this order:

`1 < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < A`

**A means 10**. It is ordinarily the highest printed rank. There is no Fallen Ace rule in FFVIII, so a 1 never beats an A merely because it is a 1.

Cards are not rotated. The four printed directions remain fixed when a card is placed.

### 2.3 Board and adjacency

For reference, number the spaces:

```text
1 2 3
4 5 6
7 8 9
```

Two spaces are adjacent only when they share an edge. Thus space 5 is adjacent to 2, 4, 6, and 8. Space 1 is adjacent only to 2 and 4. Cards across a corner are not adjacent and never compare.

Only one card may occupy a space. Once placed, a card never moves, rotates, leaves the board, or returns to a hand during that round.

### 2.4 Control color versus permanent ownership

These are distinct concepts:

- **Permanent ownership** determines whose collection supplied the physical/digital card at the start of the match.
- **Control color** determines which side currently controls it for capture and scoring. In the North American game the human side is blue and the NPC side is red.

Capturing changes control color, not yet permanent ownership. Permanent ownership is settled only after the round or Sudden Death series, under the active trade rule.

---

## 3. Starting a match

### 3.1 Who can be challenged

Triple Triad in the original game is a **human-versus-NPC** minigame. Face a card-playing NPC and press **Square** to challenge them. Pressing the ordinary talk/confirm button is not the same action.

The player needs **at least five card copies in inventory** to form a hand. The English manual and the Ultimania translation both say “more than five,” but the game permits a five-card inventory; modern FFVIII-specific references consistently document the operational threshold as at least five. The early Garden NPC near the second-floor elevator gives seven starter cards, which normally keeps the localization wording from becoming visible to a new player.

### 3.2 Rules screen

Before card selection, the game displays the special rules and the trade rule applying to that match and offers **Play** or **Quit**. If the NPC proposes mixing regional rules, the displayed special-rule set is the temporary union used for this one match. The sole exception is the new-game Balamb-harbor initialization bug, which can reach a match with no displayed/active trade rule; see [§8.6](#86-the-hidden-no-trade-initialization-state).

This distinction matters to the world-rule system:

- refusing the NPC's invitation in field dialogue genuinely declines the challenge;
- accepting far enough to reach the Triple Triad rules screen, then choosing **Quit**, counts as an accepted game interaction for rule-transmission and trade-rule ecology even though no cards were placed.

### 3.3 Forming the hands

Each side receives a hand of exactly five card copies.

- Normally, the player chooses any five copies they own.
- If the player owns multiple copies of one identity, they may select that identity multiple times, consuming one owned copy per hand slot.
- There is no level, rarity, or uniqueness restriction on the five-card hand.
- The NPC's hand is generated from that NPC's programmed card-level pools and any rare-card allocation. NPC inventories are not depleted like the player's collection.
- With **Random**, the game performs selection instead; see [§6.2](#62-random).

### 3.4 First player

The game randomly selects which side goes first. The first player and second player then alternate without exception:

`first, second, first, second, first, second, first, second, first`

Consequently, the first player places five cards and takes the ninth/final turn. The second player places four and keeps one card unplayed.

---

## 4. A turn and the basic capture rule

On a turn, the active side must:

1. choose one card from its hand; and
2. place it, unrotated, in any empty board space.

There is no legal pass while a space and a card remain.

### 4.1 Compare every adjacent opponent card

Immediately after placement, compare the placed card with each orthogonally adjacent card controlled by the opponent:

- placed above neighbor: placed **down** versus neighbor **up**;
- placed to neighbor's right: placed **left** versus neighbor **right**;
- placed below neighbor: placed **up** versus neighbor **down**;
- placed to neighbor's left: placed **right** versus neighbor **left**.

For each comparison:

- if the placed rank is greater, capture that neighbor;
- if equal, do nothing;
- if lower, do nothing.

The comparison is independent on every side, so one placement can capture zero, one, two, three, or four cards.

### 4.2 Capture is attacker-only

The just-placed card attacks existing adjacent opponent cards. The reverse comparison does **not** happen. Therefore, placing a 3 beside an opponent's 8 does not cause the new 3 to be captured; it simply fails to capture the 8.

Likewise, cards already on the board do not spontaneously attack when the turn returns to their owner. The Ultimania translation explicitly warns that an already-placed card cannot make a later basic capture. The only exception is a **Combo**, where a card newly flipped by Same or Plus becomes a temporary chain attacker; see [§7](#7-combo-and-complete-capture-resolution).

### 4.3 What capture changes

Each captured card flips to the attacker's color. It immediately counts for that side's score and can be recaptured later. Capture never changes the card's ranks, element, board position, or identity.

---

## 5. Ending and scoring a round

### 5.1 When the round ends

The round ends after the ninth placement fills the 3×3 board. That is the first player's fifth turn. The second player's fifth card remains in hand.

### 5.2 Counting all ten cards

Each side begins notionally at five points, one per starting card. Every capture transfers one point from the former controller to the new controller. At the end, count:

- the control colors of all nine board cards; **plus**
- the second player's unplayed card, which remains that player's color and counts as a point.

The two scores always total ten. More than five wins; exactly 5–5 draws.

### 5.3 Possible decisive scores

The decisive score pairs are:

| Winner | Loser | Score margin |
|---:|---:|---:|
| 6 | 4 | 2 |
| 7 | 3 | 4 |
| 8 | 2 | 6 |
| 9 | 1 | 8 |

A 10–0 result is impossible. The second player's unplayed card cannot be captured, guaranteeing that side at least one point. The first player's ninth-turn card is placed after the opponent's final turn and cannot be captured on its own placement, guaranteeing the first side at least one point as well.

The practical Diff rewards are therefore 2, 4, 5, or 5 cards: a loser has only five starting cards available, so margins 6 and 8 are capped at all five.

### 5.4 Draw

Without Sudden Death, 5–5 ends the match as a draw. One, Diff, and All make no exchange after an ordinary draw. Direct is different: it distributes cards by final color even if the score is tied; see [§8.4](#84-direct).

With Sudden Death, the draw starts another round instead of settling the trade; see [§6.3](#63-sudden-death).

---

## 6. The seven special rules

The game stores seven selectable regional special rules. They can appear alone or in combination. Unless a rule says otherwise, the basic rules remain active alongside it.

### 6.1 Open

**Effect:** Both five-card hands are face-up and visible.

The player can always see their own hand. Without Open, the NPC's unused cards appear face-down; placed cards are of course visible. Open reveals all ten starting cards. It does not change legal card selection, placement, turn order, capture formulas, scoring, or rewards. The Ultimania account says the computer can use the exposed human hand when choosing a move; that is an AI-information consequence, not a change to legal play. Later player testing suggests the AI may sometimes behave as though it knows hidden hands as well, so that observation is not elevated into a separate rule here.

The original rule is simply called **Open**, even though later games use names such as “All Open” and “Three Open.” Those later distinctions do not exist here.

### 6.2 Random

**Effect:** The game randomly chooses the five cards in the player's hand from all card copies in the player's current inventory instead of allowing manual selection.

Selection is by owned copy, not merely by identity. If the collection contains multiple copies of the same identity, two or more of that identity can appear in the Random hand. The five selections do not create cards and cannot exceed the copies actually owned.

NPC hands were already computer-generated from NPC data; Random's player-facing consequence is the loss of manual deck choice. It does not randomize placement or force an order in which the five cards must be played.

### 6.3 Sudden Death

**Effect:** A 5–5 round does not end the match. The board resets and the sides play another round, repeating until one side wins.

For every continuation round:

1. Each side's new five-card hand is the five cards showing that side's color at the draw. This includes the second player's unplayed card.
2. Temporary control therefore determines the redistributed hands: a player may have to use cards originally brought by the opponent.
3. The first/second order switches. If blue went first in the drawn round, red goes first next; it switches again after another draw.
4. The same listed special rules and trade rule continue to apply. Player observation records the Elemental board being freshly randomized for a continuation round, but the official descriptions do not specify that reinitialization step; see the evidence note below rather than treating it as a published probability rule.
5. Another 5–5 repeats the process. Vanilla FFVIII imposes **no round limit**.

No trade occurs between drawn rounds. Once a decisive round occurs, the game restores every card to its **pre-series permanent owner**, then applies the active trade rule to the final result. Thus the temporary Sudden Death redistribution is not itself a trade and cannot permanently launder ownership. This restore-then-trade sequence is explicit in Jerng's translation of the Square-supervised [Japanese Ultimania chapter](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/4902).

**Elemental/Sudden Death evidence note.** One contemporary-style [FFVIII play log](https://coldrungaming.blogspot.com/2016/02/ffviii-part-51-gone-fishin.html) explicitly observes a new set of elemental marks after a draw. This is consistent with the game rebuilding the board between rounds, but no located official text, stable disassembly, or second reproducible PS1 test documents the exact re-roll algorithm. The observed behavior is included; its internal distribution remains undocumented.

### 6.4 Same

**Effect:** The placed card makes a Same capture when at least two of its occupied adjacent comparisons are equal.

For each occupied adjacent side, compare the placed card's facing **printed/base rank** with the neighboring card's facing printed/base rank. That side is a Same match if the two ranks are equal. If at least two sides match:

- flip every matching adjacent card currently controlled by the opponent;
- matching friendly cards help satisfy the two-side condition but do not flip;
- at least one matched participant must be an opponent card for the activation to capture anything;
- every opponent card flipped specifically through Same becomes a Combo seed.

The matched pairs need not share one common number. A top pair may be 4=4 while a left pair is 7=7; that is still Same because two facing comparisons are equal.

Basic capture still resolves on the same placement. An adjacent opponent card that does not participate in Same may nevertheless flip because the placed card's facing rank is greater.

### 6.5 Plus

**Effect:** The placed card makes a Plus capture when at least two occupied adjacent sides produce the same sum.

For every occupied adjacent side:

1. take the placed card's facing **printed/base rank**;
2. add the neighbor's facing printed/base rank;
3. treat A as 10.

If the same total occurs on two or more sides, all opponent cards in that equal-total group flip. Friendly adjacent cards may supply a matching total but do not flip. At least one participating card must be an opponent for a capture to occur. Every opponent card flipped specifically through Plus becomes a Combo seed.

The total may be anything from 2 through 20; it does not need to equal 10. With four neighbors, two distinct qualifying groups can exist simultaneously—for example totals 5, 5, 9, 9. In that case both groups qualify, and every opponent participant in either group flips.

As with Same, ordinary greater-than captures on other sides still occur.

### 6.6 Same Wall

**Effect:** Same may treat each board boundary beside the placed card as an imaginary **A (10)** witness.

Same Wall is not an independent capture formula. It augments Same:

- an A side of the placed card facing a boundary counts as one equal Same comparison;
- together with another matching occupied side—or another A-facing wall at a corner—it can satisfy Same's two-match requirement;
- walls never flip, never have a control color, never score, and never become Combo seeds;
- only matched opponent cards actually flip.

Example: a card at the top edge has A facing the top wall and A facing an adjacent opponent card whose facing side is A. The wall supplies one Same witness, the opponent supplies the other, and the opponent flips.

**Same must also be active.** A region may internally possess Same Wall while lacking Same; in that state Same Wall is carried and can spread but has no visible match effect. Esthar begins exactly this way. A famous sentence in the English Ultimania translation says Same Wall does not work “if Same is added”; this is a translation/sign error. The program, later guides, and Esthar behavior establish that it does not work **unless** Same is active.

Same Wall applies only to Same. A boundary is not a card for Plus, basic capture, scoring, or any “Plus Wall” calculation.

### 6.7 Elemental

**Effect:** The game randomly marks board spaces with elemental symbols. A card placed on a marked space receives a persistent ±1 modifier to all four ranks.

- If the card's element matches the space's element: **+1** to up, right, down, and left.
- If the card has a different element: **−1** to all four.
- If the card has no element: **−1** to all four when placed on any marked space.
- If the space is unmarked: no modifier, regardless of the card's element.

At most one elemental marker occupies a space. The marker affects only the card placed in that space; it does not affect adjacent cards and is not consumed. The modifier follows that card for the rest of the round even if its control color changes.

Mechanically, the modifier can produce 0 from a printed 1 or 11 from a printed A. The adjusted rank is used for:

- ordinary greater-than captures made by the placed card; and
- greater-than comparisons made during Combo.

It is **ignored** when testing Same, Same Wall, and Plus. Those rules always use the ranks printed on the cards, with A treated as 10. This separation is one of the most commonly omitted vanilla interactions and is confirmed by the [FFVIII-specific Final Fantasy Wiki rule table](https://finalfantasy.fandom.com/wiki/Triple_Triad_%28Final_Fantasy_VIII%29), the [modern PlayStation guide](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/rule-variations), and the Ultimania account.

The original sources specify a randomized subset/layout but do not publish a simple tabletop die table or uniform per-space probability. Any physical procedure that dictates an exact number of markers is therefore an adaptation, not part of the documented vanilla rules.

---

## 7. Combo and complete capture resolution

### 7.1 Combo is automatic, not selectable

**Combo** never appears as a regional rule on the pre-match screen. It is the chain reaction automatically attached to captures made by Same, Plus, or Same Wall-assisted Same.

After an opponent card flips because it participated in a successful Same or Plus:

1. Treat that newly flipped card as a chain attacker.
2. Compare each of its sides with every orthogonally adjacent card still controlled by the opponent.
3. Use the normal rule: strictly greater captures; equal or lower does not.
4. If it captures another card, that newly flipped card becomes another chain attacker.
5. Continue recursively until no new capture is possible.

Elemental-adjusted ranks apply to all Combo greater-than comparisons. Same and Plus are **not** tested again from chain cards. A Combo can therefore propagate across much of the board, but every link after the initial special capture is an ordinary greater-than comparison.

### 7.2 What starts—and does not start—a Combo

- A card captured through Same starts one.
- A card captured through Plus starts one.
- A Same capture that used a wall witness starts one from the captured card, not from the wall.
- A card captured only by the ordinary greater-than rule does **not** start one.
- If a card qualifies for Same/Plus and would also be captured normally, it is still a special-capture participant and therefore is a Combo seed.
- Friendly cards may witness Same or Plus, but because they do not flip they do not become new Combo seeds.

### 7.3 Full resolution procedure for one placement

The following procedure reproduces all vanilla interactions without relying on animation order:

1. **Place the card** and fix any Elemental modifier from that space.
2. **Inspect the pre-capture neighbors.** Only orthogonally adjacent occupied spaces are relevant.
3. **Find basic captures** using the placed card's adjusted ranks (base ranks if no Elemental modifier).
4. **Test Same** using printed ranks, including A-wall witnesses if both Same and Same Wall are active.
5. **Test Plus** using printed-rank sums.
6. **Take the union** of all opponent cards captured by those tests. A card meeting several tests flips only once and transfers only one point.
7. **Mark special seeds:** among the cards just flipped, mark those that belonged to a successful Same/Plus group.
8. **Resolve Combo recursively** from those seeds with adjusted greater-than comparisons.
9. When no new card flips, update the displayed score and pass the turn.

Normal, Same, and Plus may capture different neighbors on the same placement. Neither special rule suppresses the other or suppresses basic capture. Treating the initial flips as a union also explains why the visible animation order cannot invalidate a qualifying equality or sum.

---

## 8. Trade rules and card ownership after the match

Under normal initialization, every region has exactly one active **trade rule**, separate from its zero-to-seven special rules. The rule is displayed before the match. All eight regional save fields start a new game with **One**. A narrow, observable Balamb-harbor initialization bug can instead produce one match with no trade rule and no reward screen; it is documented in [§8.6](#86-the-hidden-no-trade-initialization-state) and [§12.1](#121-student-skipping-class).

Except under Direct, a winner chooses rewards from the **five cards the loser supplied at the beginning of the match/Sudden Death series**, not merely cards still showing the loser's color. If the NPC wins, the game performs the corresponding selection from the player's five.

### 8.1 One

The winner permanently takes **one card of their choice** from the loser's five starting cards.

On a draw, no card changes owner.

### 8.2 Diff

The winner permanently takes a number of the loser's starting cards equal to the final score margin, capped at the loser's full five-card hand.

| Final score | Mathematical margin | Cards taken |
|---:|---:|---:|
| 6–4 | 2 | 2 |
| 7–3 | 4 | 4 |
| 8–2 | 6 | 5 (all available) |
| 9–1 | 8 | 5 (all available) |

The winner chooses which cards. On a draw, no card changes owner.

### 8.3 All

The winner permanently takes **all five** cards the loser supplied.

Jerng's Ultimania translation uses “Full”; the North American game/manual uses “All.” On a draw, no card changes owner.

### 8.4 Direct

Each of the ten starting cards goes permanently to the side whose **control color** it has when the decisive round ends:

- every blue card goes to the human player's collection;
- every red card goes to the NPC;
- the second player's unplayed card was never captured and remains with that side.

Direct does not ask the winner to choose cards. It is a distribution of the entire ten-card pool, not a “winner takes captures” bonus. Both sides can gain and lose cards in one match.

Direct also applies on a **5–5 draw** when Sudden Death is absent. Even though neither side wins, final control still distributes the cards; a tied game can exchange several cards in both directions.

### 8.5 Trade after Sudden Death

Intermediate drawn rounds transfer no permanent ownership. After the decisive round:

1. undo the temporary hand redistribution for ownership purposes;
2. restore the original ten cards to the two pre-series owners;
3. apply One, Diff, All, or Direct using the decisive result.

For One/Diff/All, selections therefore come from the loser's original pre-series five. For Direct, the decisive round's final colors determine which original cards cross ownership, even if those cards reached that round through earlier Sudden Death redistribution.

### 8.6 The hidden no-trade initialization state

The four named rules above are the complete set of normal, regional trade rules. The executable also has an **uninitialized/no-trade state**, sometimes called **None** or **Null** in later technical references. It is not selectable, does not spread as a regional rule, and is not part of ordinary play.

It can nevertheless be seen once: at the very start of a new game, before any ordinary card opponent has initialized the current-match trade rule, play one of the bugged rule-loading opponents at Balamb harbor—reliably the Student Skipping Class, and less reliably the girl walking her dog. The match proceeds, but the game skips the reward screen and no card changes permanent owner. Once a normal opponent has initialized trade handling, the save's regional **One** rule is used and this no-trade opening is no longer available in the ordinary campaign. This rare case is documented by the [FF8.fr implementation account](https://www.ff8.fr/quetes/triple-triad/changement-de-regles) and independently listed as `Null` by a [Japanese FFVIII rules reference](https://game8.jp/ff8/280591).

---

## 9. Regional rules: the starting world state

Regional variation is not optional metagame added by later ports; it is part of the original FFVIII implementation and is introduced in the 1999 manual. An NPC's **regional affiliation**, not necessarily their physical location, determines the regional special and trade rules they offer.

### 9.1 The eight regions

| Region | Initial special rules | Initial trade rule |
|---|---|---|
| **Balamb** | Open | One |
| **Galbadia** | Same | One |
| **Dollet** | Random, Elemental | One |
| **Trabia** | Plus, Random | One |
| **Centra** | Same, Plus, Random | One |
| **FH** (Fishermans Horizon) | Sudden Death, Elemental | One |
| **Esthar** | Same Wall, Elemental | One |
| **Lunar/Space** | Open, Same, Plus, Random, Sudden Death, Same Wall, Elemental | One |

This table is independently reproduced in Jerng's translation of the Square-supervised [Japanese Ultimania chapter](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/4902), the modern [PlayStation guide](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/manipulating-special160rules), [StrategyWiki](https://strategywiki.org/wiki/Final_Fantasy_VIII/Cards), [Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_%28Final_Fantasy_VIII%29), and [FF8.fr](https://www.ff8.fr/quetes/triple-triad/changement-de-regles).

Esthar's Same Wall is initially **latent**: without Same, it has no match effect and may not be shown in the active-rule list, but the regional bit exists and can be carried to another region. If Same later reaches Esthar, Same Wall becomes operative there.

### 9.2 Region belongs to the opponent, not the map square

Most NPCs use the geographic region expected from their location, but exceptions deliberately demonstrate that people carry regional customs. Examples include the Trabia exchange student in Galbadia Garden and an FH traveler found outside FH. In the endgame, Card Club members on the Ragnarok retain different affiliations rather than all becoming one Ragnarok region.

For rule calculations, always use the affiliation represented by the rules the NPC announces, not a real-world geography assumption.

### 9.3 Regional rules are mutable save data

The table above is only the **new-game state**. Special rules can spread into or be abolished from a region. A region's trade rule can be replaced by the Queen of Cards, a dominant region, or degeneration. Saving preserves the mutated state; leaving and returning does not reset it.

---

## 10. How special rules spread and are abolished

### 10.1 “Carrying” rules

After interacting with players from a region, Squall can carry that region's special-rule set. When he challenges an NPC affiliated with a differently configured region, the NPC may say that Squall knows unfamiliar rules and propose **mixing** them.

Operationally:

- the proposed match uses the union of the carried set and the NPC region's set;
- the union is temporary for that match only;
- afterward, at most one lasting change—one spread or one abolition—can be made to the NPC region;
- the NPC announces an actual lasting change.

Carrying does not copy the rules immediately, and the player cannot choose a rule directly from a menu.

The original program internally tracks the **two most recently remembered region IDs and their rule sets**, initially Balamb/Balamb. Reverse-engineering reports a 1-in-4 pre-challenge history update: the newer record becomes the older one and the challenged affiliation becomes the newer record. When a remembered set differs from the challenged affiliation, a mix proposal then occurs on 255/256 checks. If that pre-challenge update did not occur, the history can be updated after the interaction; a successful spread or abolition replaces both memories with the challenged region. This is why repeatedly refusing a mix proposal can eventually make it disappear: the two-entry queue has forgotten the old region. See the implementation analysis at [FF8.fr](https://www.ff8.fr/quetes/triple-triad/changement-de-regles). That public account does not fully expose the tie-break/slot selection when both records differ or every no-change post-interaction branch, so this paragraph describes all validated player-visible behavior but is not claimed as a byte-exact queue emulator. At ordinary player level, “carry the last region's rules” is a useful shorthand, but it is not literally a permanent rules inventory.

### 10.2 What counts as accepting for a rule check

- Say **No** in the NPC's field dialogue: no match screen, so no after-game spread/abolish resolution.
- Say **Yes**, reach the rules screen, then choose **Quit**: this does invoke the after-game rule machinery.
- Play to a win, loss, or draw: likewise invokes it.

Thus one can alter regional rules without actually placing a card, but only after accepting far enough to enter the rules screen.

### 10.3 Normal spread/abolish algorithm

When a mixed-rules interaction is accepted and the challenged region does not already have all seven rules, the original rule-selection process is:

1. Draw one candidate special rule. **Open has 25% weight; each of the other six rules has 12.5% weight.**
2. If the candidate is present in the carried set but absent from the challenged region, it **spreads** there. Stop.
3. Otherwise draw again, up to **three candidate draws total**, stopping if a spread succeeds.
4. If all three fail to spread, inspect the third candidate. If it is currently present in the challenged region, it has a **50% chance to be abolished**.
5. Otherwise nothing changes.

Only one rule can change per accepted interaction. Because spread is tested three times before abolition and Open has double selection weight, spreading—especially spreading Open—is more common than abolishing.

At byte level, each ordinary rule owns a 32/256 range. Open owns two such ranges (64/256 total) because the range assigned to the dummied Retry slot falls back to Open; that is the implementation source of Open's double weight.

After a successful spread or abolition, the two carried-region memories are replaced with the challenged/current region, so the game no longer continues carrying the old mixed pair from that event.

The three-check structure and ordinary PS1 byte mapping are documented in the updated [PlayStation Triple Triad guide](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/manipulating-special160rules) and the archived [PS1 RNG-testing thread](https://gamefaqs.gamespot.com/boards/197343-final-fantasy-viii/53611093); the contemporary Ultimania translation gives the same high-level flow but renders the candidate choice less clearly as “1 out 7.” FF8.fr is **not** independent confirmation of the weighting: it publishes an incompatible Elemental-heavy candidate table for this branch. Because the PS1-focused guide's results reproduce the archived 0–255 test ranges directly, this section uses that mapping for the original PlayStation game and records the disagreement in [§15.2](#152-corrections-and-conflicts-resolved).

### 10.4 The all-seven-rules exception

If a region possesses all seven special rules, it cannot receive a new one. The game instead performs a special **1-in-4 abolition check** after an accepted game interaction, even without the ordinary carried-rule spread route. This is why Lunar/Space can lose a rule despite starting full.

Jerng's Ultimania translation and FF8.fr agree on the separate 1-in-4 trigger. They do **not** establish one uncontested conditional distribution for the identity of the removed rule. FF8.fr publishes Open 2/32, each of Same/Plus/Random/Sudden Death/Same Wall 1/32, and Elemental 25/32. Reusing the normal PS1 candidate mapping would instead imply Open 1/4 and each other rule 1/8, but the archived PS1 thread does not actually prove that the all-seven branch reuses it. Therefore the complete evidence-backed player rule is: **there is a 25% chance to abolish one rule; the exact conditional identity weighting is unresolved in the accessible documentation**. An emulator should not silently pick either table and call it official.

### 10.5 Deliberately adding a rule through the Queen

For **30,000 gil**, the Queen of Cards can introduce one absent special rule into her current region. The player does not choose freely. She selects the first rule absent from that region in this fixed order:

`Open → Same → Plus → Random → Sudden Death → Same Wall → Elemental`

This order appears in the 1999 [Ultimania translation](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/4902) and the independent [FF8.fr analysis](https://www.ff8.fr/quetes/triple-triad/changement-de-regles).

### 10.6 Randomness and reset behavior

The PlayStation game uses a deterministic pseudo-random table for these choices. A soft reset does not necessarily advance its card-rule position, and a hard reset returns to a repeatable starting position; moving NPCs and certain field inspections can advance it. This explains why reloading and repeating identical inputs often produces the identical spread/abolish result. Those RNG-manipulation techniques are not additional game rules, but the [PlayStation rule-RNG table](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/card-rule-rng-table) documents the original implementation for reproducibility.

---

## 11. How trade rules change

Special-rule transmission and trade-rule evolution are separate systems. Mixing special rules does not itself mix trade rules. A region always has one trade rule, initially One, and changes can occur silently before the rules screen or after an accepted interaction.

### 11.1 Queen of Cards: personal rule and regional adoption

The Queen has a **personal trade rule**. It moves along this adjacency chain:

`One ↔ Diff ↔ Direct ↔ All`

On a challenge to the Queen:

- her personal rule has a **220/256 (85.9375%)** chance to move one adjacent step;
- at an endpoint the only possible move is inward (One→Diff or All→Direct);
- from Diff, the only possible changed values are One or Direct;
- from Direct, the only possible changed values are Diff or All;
- the remaining **36/256** checks leave the personal rule unchanged.

The structural transition table is therefore:

| Current personal rule | Result if a change is triggered |
|---|---|
| One | Diff |
| Diff | One or Direct |
| Direct | Diff or All |
| All | Direct |

Simply challenging is enough; completing a match is not required for the personal-rule change check.

**Interior-direction evidence conflict.** An archived PlayStation community mechanics summary says the two interior directions are equally likely; under that reconstruction, Diff→One and Diff→Direct are each 110/256 overall, as are Direct→Diff and Direct→All. FF8.fr's newer technical account instead gives a **conditional** 73/128 bias toward the lower rule and 55/128 toward the higher rule after the 220/256 change check. No located primary text or stable disassembly resolves the conflict, so neither conditional table is presented as official fact. The endpoint behavior and 220/256 normal change rate are agreed.

**Post–Lunar Cry Lunar Gate exception.** FF8.fr reports that, only while the Queen is at Lunar Gate after the Lunar Cry, the change trigger falls to **1/4**; at an interior rule, its conditional direction becomes **7/8 downward and 1/8 upward**. At an endpoint, the single inward move remains the only changed result. FF8.fr presents this as a vanilla campaign edge case, but it currently rests on that one technical source rather than an independent PS1 disassembly.

While the Queen is associated with a region, every challenge to any card player affiliated with that region—including the Queen—has a **90/256 (35.15625%)** chance to replace that region's trade rule with the Queen's current personal rule. When the Queen herself is challenged, adoption uses her **pre-change** personal rule; only afterward is her personal step checked. There is no field-message announcement; the next rules screen reveals the result.

The 90/256 adoption and 220/256 normal change fractions are reported by the [FFVIII-specific Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_%28Final_Fantasy_VIII%29) and [FF8.fr](https://www.ff8.fr/quetes/triple-triad/changement-de-regles). The equal-direction claim comes from an archived [community PS1 mechanics summary](https://gamefaqs.gamespot.com/boards/197343-final-fantasy-viii/67481353?page=1), while FF8.fr supplies the conflicting biased table and Lunar Gate exception; the 1999 Ultimania translation describes the system only at a rounded/high level.

### 11.2 Dominant region and spread

The game tracks one **dominant region** and a dominance value from 0 to 10. The value begins at 0; from a player-facing perspective, the first affiliation challenged establishes the initial effective region.

- The first region challenged initializes dominance.
- Challenging an NPC affiliated with the dominant region raises the value by 1, to a maximum of 10.
- Challenging a different affiliation lowers the current value by 1.
- If it falls from 1 to 0, the old region remains designated; the next challenge made while it is already 0 transfers dominance to that challenged affiliation **and leaves the value at 0**. A subsequent challenge there begins raising it.

Therefore, from an arbitrary saved state, at most 11 consecutive challenges in one region make it the designated dominant region, and at most 21 make it dominant at strength 10.

After any accepted game interaction—including entering the rules screen and quitting—the dominant region's trade rule may spread to a **uniformly selected one of the eight regions** (possibly itself). The trigger chance is **25/256 per dominance point**:

| Dominance | Spread-trigger chance |
|---:|---:|
| 0 | 0% |
| 1 | 9.765625% |
| 5 | 48.828125% |
| 10 | 97.65625% |

If the randomly selected region already uses that trade rule, the event has no visible effect. The Queen can report which region/rule is currently popular and describe the dominance band: 0–2, 3–5, or 6–10.

### 11.3 Degeneration to One

The game also maintains a cyclic **degeneration** counter, `Y`, which begins at 0. It is processed **when the dominant-copy check triggers**, not after every accepted game:

1. Add a uniformly selected integer from 0 through 7 to `Y`.
2. If `Y > 250`, reset it to 0.
3. With probability `Y/256`, uniformly select one of the eight regions and set its trade rule directly to **One**.

The degeneration target is independent of the dominant-copy target. If both happen to select the same region in one resolution, degeneration occurs later and One is the final rule.

The essential, well-validated behavior is:

- degeneration may affect any random region, including the current or Queen's region;
- if the target already has One, nothing visible changes;
- the probability grows cyclically across triggered dominant-copy events;
- it changes the target **directly to One**.

It does **not** perform `All → Direct → Diff → One`. That old staircase theory is repeated by many walkthroughs but has been conclusively disproved by later testing/reverse-engineering. A non-One rule changing to a different non-One rule is the result of Queen adoption or dominant-region spreading, not degeneration. The updated [PlayStation guide's trade-rule section](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/manipulating-trade-rules) explicitly corrects the myth, and the [Final Fantasy Wiki implementation summary](https://finalfantasy.fandom.com/wiki/Triple_Triad_%28Final_Fantasy_VIII%29) independently reports direct-to-One behavior.

### 11.4 Challenge versus accepted game

For exact timing:

- **Challenge initiated:** update dominance; check Queen-region adoption from her pre-change rule if applicable; when challenging the Queen, check her personal step afterward.
- **Rules screen entered/interaction accepted:** later dominant-rule spread and degeneration machinery can run, even if the player chooses Quit.
- **A match actually completed:** determines card trading but is not required merely to cause the above regional trade-rule changes.

---

## 12. Special NPC and endgame cases

### 12.1 Student Skipping Class

A plainclothes Garden student appears intermittently by the Balamb Town harbor. He is commonly called **Student Skipping Class**. His personal special-rule set is permanently empty and cannot be altered.

After **playing a match** with him, Balamb's special rules are cleared—including its starting Open rule. The available sources do not prove that entering the rules screen and choosing Quit is sufficient for this exceptional clear, so do not assume the general Quit timing applies here. He does not normally clear or alter Balamb's stored regional trade rule; normal trade ecology still applies. This exception is confirmed by the modern [PlayStation guide](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/manipulating-special160rules), [Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_%28Final_Fantasy_VIII%29), and [FF8.fr](https://www.ff8.fr/quetes/triple-triad/changement-de-regles).

Both harbor players have a rule-loading bug. The girl with a dog usually initializes rules normally; the student reliably skips that initialization. If either skip occurs before any ordinary card match has initialized the current trade rule, the one-time hidden no-trade behavior in [§8.6](#86-the-hidden-no-trade-initialization-state) appears. Otherwise their matches use the already initialized trade context even though their special-rule handling can clear Balamb.

### 12.2 Queen movement and the point of no return

On Discs 1–3 the Queen moves between regional locations after the player wins a rare card from her or loses one to her. Her movement route affects which region receives her special-rule sales and personal-trade-rule influence; movement is quest/world-state behavior, not a fifth trade rule.

Her next-region probabilities are:

| Current region | Possible next region(s) |
|---|---|
| Balamb | Galbadia 62.5%; Dollet 37.5% |
| Dollet | Galbadia 62.5%; Balamb 37.5% |
| Galbadia | FH 62.5%; Balamb 12.5%; Dollet 12.5%; Centra 12.5% |
| Centra | Dollet 37.5%; Galbadia 37.5%; FH 25% |
| FH | Esthar 62.5%; Centra 25%; Dollet 12.5% |
| Trabia | Dollet 50%; Balamb 25%; Lunar 25% |
| Esthar | Lunar 50%; Trabia 25%; Dollet 12.5%; FH 12.5% |
| Lunar | Any of the eight regions, 12.5% each |

Except when departing Lunar, she gives a destination hint; “somewhere far away” means Lunar. From Lunar she gives no useful destination hint, so the player must locate her. These routes are documented in the 1999 [Ultimania translation](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/4902) and cross-checked in the modern [PlayStation trade-rule guide](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/manipulating-trade-rules).

At the endgame point of no return, her visible location is fixed at the Lunar Base crash site. Her stored regional association and personal trade rule for propagation are frozen from the end of Disc 3. In her Disc 4 match presentation she uses her special endgame setup (all special variations except Open, with One as the offered trade), while the frozen pre-endgame association remains relevant to global trade-rule state. Players cannot use Disc 4 to retune her personal rule normally. The frozen-state distinction is documented in the modern [PlayStation trade-rule guide](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/manipulating-trade-rules) and independently summarized by the [FFVIII-specific Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_%28Final_Fantasy_VIII%29).

### 12.3 Endgame Card Club affiliations

If the Card Club quest was completed, its members appear on the Ragnarok late in the game but retain disparate rule affiliations:

| Member | Regional affiliation |
|---|---|
| Jack | Balamb |
| Club | Dollet |
| Diamond | Trabia |
| Joker | Centra |
| Heart | FH |
| Spade | Esthar |
| King | Lunar |

This is another demonstration that rule region belongs to the NPC, not the room containing them. The exact Disc 4 affiliation table is reproduced in the modern [PlayStation Card Club guide](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525/cc-group-quest) and the [FFVIII-specific Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_%28Final_Fantasy_VIII%29).

---

## 13. Worked examples and edge cases

In these examples, “placed U4/L7” means the new card has printed rank 4 on top and 7 on the left. “Neighbor D4” means the neighboring card's down side faces that top side.

### 13.1 Ordinary capture—and the non-retaliation rule

An opponent card is immediately left of the empty space. Its right rank is 3. You place a card whose left rank is 5:

`placed L5 > neighbor R3` → the neighbor flips.

If the placed left were 3, equality would not flip it. If it were 2, the placed card would **not** be captured by the neighbor's 3; the attack simply fails. Only the just-placed card attacks.

### 13.2 Same with two different matched numbers

Before the move:

- cell 2 contains an opponent card with D4;
- cell 4 contains an opponent card with R7;
- cell 5 is empty.

Place in cell 5 a card with U4 and L7. The comparisons are 4=4 and 7=7. Two sides match, so Same flips both opponent cards. Same does not require all participating sides to show one common rank.

If the card in cell 2 were already friendly, it would still witness the 4=4 match. The enemy card in cell 4 would flip because the second match is 7=7. The friendly witness would remain friendly.

### 13.3 Plus

Before the move:

- cell 2 contains an opponent card with D3;
- cell 4 contains an opponent card with R5;
- cell 5 is empty.

Place in cell 5 a card with U4 and L2:

- top sum: 4+3 = 7;
- left sum: 2+5 = 7.

Two sums are equal, so both opponent cards flip. Neither pair is equal side-to-side, so Same is irrelevant.

With four occupied neighbors, suppose the four sums are 5, 5, 9, 9. There are two independent duplicate-total groups; all enemy participants in both groups flip. A friendly participant can supply one occurrence of a total but does not itself flip.

### 13.4 Same Wall

Place a card in cell 2 with U=A and R=6. The top board edge counts as A. If cell 3 holds an opponent card with L6, the two Same comparisons are A=A (wall) and 6=6 (card), so the opponent card flips and can start a Combo.

At cell 1, a card with A facing both the top and left walls technically has two wall witnesses, but walls are not enemy cards. With no matched enemy participant, nothing flips and no Combo begins.

### 13.5 A multi-link Combo

Before the move:

- cell 2: opponent, D4 and R8;
- cell 4: opponent, R7;
- cell 3: opponent, L6 and D9;
- cell 6: opponent, U4;
- cell 5: empty.

Place at cell 5 a card with U4 and L7. Same flips cells 2 and 4. Cell 2, newly flipped by Same, now attacks cell 3: its R8 is greater than cell 3's L6, so cell 3 flips by Combo. Cell 3 is now a new chain attacker; its D9 is greater than cell 6's U4, so cell 6 flips. The chain stops when no newly flipped card has a strictly greater side against a remaining enemy neighbor.

The Same test was performed only for the original placement. Neither cell 2 nor cell 3 re-tests Same or Plus during the chain.

### 13.6 Elemental and special rules together

Take a card printed as U7/R4/D2/L5.

- On a matching elemental space it compares as U8/R5/D3/L6 for basic capture and Combo.
- On a nonmatching elemental space it compares as U6/R3/D1/L4 for basic capture and Combo.
- For Same and Plus it remains U7/R4/D2/L5 in both cases.

Suppose the card is under −1 and faces two neighbors such that the **printed** comparisons are 4=4 and 5=5. Same still activates, even though the adjusted values would be 3 and 4. If those captured cards begin a Combo, their own persistent adjusted values are used for the chain's greater-than tests.

Printed 1 under −1 behaves as 0 for ordinary/Combo comparison; printed A under +1 behaves as 11. For Same/Same Wall/Plus, they remain printed 1 and printed A=10.

### 13.7 One move can use all capture mechanisms

On one placement it is possible that:

- one neighbor is lower and flips by the basic rule;
- two other neighbors form Same and flip;
- a fourth neighbor is in a duplicate Plus-sum group and flips;
- the Same/Plus captures then produce a recursive Combo.

All initial qualifying enemy cards flip once. Only those belonging to successful Same/Plus groups seed the Combo; the basic-only capture does not.

### 13.8 Scoring and trade

Suppose blue finishes 7–3:

- Blue wins by a margin of 4.
- One: blue chooses one of red's original five.
- Diff: blue chooses four of red's original five.
- All: blue takes red's original five.
- Direct: ignore the margin for reward quantity; every original card goes to whichever side controls it at the end.

Suppose instead the score is 5–5 with no Sudden Death:

- One, Diff, and All exchange nothing.
- Direct still distributes all ten cards by final control color.

---

## 14. What is not in vanilla FFVIII Triple Triad

The following rules or constraints belong to later Square Enix versions, fan games, physical adaptations, or house rules and must not be added to an original FFVIII match:

- Reverse
- Fallen Ace
- Ascension or Descension
- Order or Chaos
- Swap
- Roulette
- Three Open as distinct from Open
- a separate All Open rule
- Plus Wall
- Draft/deck-draft formats
- rarity/star limits on hand composition
- preconstructed deck slots
- a finite Sudden Death rematch cap
- timed turns or tournament points
- player-versus-player matchmaking
- diagonal capture
- card rotation
- a rule that a stronger existing card captures a weaker card just placed beside it

The original executable contains a dormant/unused **Retry** rule flag, but it is dummied and never becomes an active playable rule. It therefore is not an eighth vanilla special rule.

For comparison, the [official FFXIV Triple Triad guide](https://na.finalfantasyxiv.com/lodestone/playguide/contentsguide/goldsaucer/tripletriad/) describes a later implementation with additional rules, deck restrictions, and different Sudden Death handling. It is intentionally not used as evidence for FFVIII behavior.

---

## 15. Source audit and known documentation traps

### 15.1 Source hierarchy

| Priority | Source | What it verifies |
|---:|---|---|
| 1 | Squaresoft, [*Final Fantasy VIII* North American Owner's Manual scan](https://db.hfsplay.fr/files/2021/01/16/Final_Fantasy_VIII_-_1999_-_Square_Co._Ltd._mHbenLO.pdf); [second scan mirror](https://www.gamesdatabase.org/Media/SYSTEM/Sony_Playstation/Manual/formated/Final_Fantasy_8_-_1999_-_Sony_Computer_Entertainment.pdf); [unofficial searchable transcription](https://manuals.plus/m/afd0d9ca9e5b068e62e54fa8f5d67eb9606e8bc23eb42b75fe6a9be31cd73093), printed pp. 36–37 in the 48-page edition | Primary-source content in third-party-hosted scans for NPC challenge, five-card hands, random first player, 3×3 board, score, ranks/A, basic capture, four card categories, Open/Random, and the four named trade rules. Manuals+ is only a conversion; wording should be checked against the scans. |
| 2 | Henry H. Jerng's 1999 fan [translation of *Final Fantasy VIII Ultimania*, Chapter 5](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/4902), pp. 154–185; [Studio BentStuff's official book record](https://www.bent.co.jp/lineup_day/%E4%BD%9C%E5%93%81%E7%B4%B9%E4%BB%8B%E8%A9%B3%E7%B4%B0%E3%80%80um01/) | Unofficial secondary translation of the Japanese book's complete seven-rule set, hand/turn details, Sudden Death, Same/Plus/Same Wall/Elemental, starting regions, special-rule transmission, trade rules, and Queen systems. The underlying book was published March 31, 1999 and Square-supervised; the English page itself is unofficial. |
| 2 | [bover_87, *Triple Triad Guide* for PlayStation](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/72525), v1.21 (2024) | Modern PSX-focused correction and testing: interactions, hidden Same Wall, exact normal special-rule selection, regional/NPC exceptions, deterministic rule RNG, corrected trade degeneration |
| 2 | [FF8.fr, regional rule-change analysis](https://www.ff8.fr/quetes/triple-triad/changement-de-regles) | Technical fan account of recent-region memory, challenge/quit timing, default regions, spread/abolish procedure, Queen fractions/order, trade ecology, and exceptional NPC behavior; no linked code/disassembly is exposed on the page. |
| 2 | [Final Fantasy Wiki, “Triple Triad (Final Fantasy VIII)”](https://finalfantasy.fandom.com/wiki/Triple_Triad_%28Final_Fantasy_VIII%29) | Independent synthesis of capture interactions, Combo, Elemental/base-rank distinction, regional defaults, normal Queen/adoption and dominance fractions, direct-to-One degeneration, dummied Retry |
| 2 | Archived PS1 [special-rule RNG-testing thread](https://gamefaqs.gamespot.com/boards/197343-final-fantasy-viii/53611093) and [community trade-mechanics summary](https://gamefaqs.gamespot.com/boards/197343-final-fantasy-viii/67481353?page=1) | Reproducible ordinary candidate byte ranges and three-check examples; community conclusions about Queen transitions, dominance copying, and degeneration. These are not published source code or complete disassemblies. |
| 2 | [Hyne save editor's FFVIII save structure](https://github.com/myst6re/hyne/blob/master/src/SaveData.h) | Independent structural confirmation of eight regional special-rule fields, eight trade-rule fields, two carried-region slots, Queen state, dominance, and degeneration state |
| 2 | [OpenVIII English string extraction](https://github.com/MaKiPL/OpenVIII-monogame/blob/master/docs/strdump/strings_en.xml) | Original in-game English tutorial/message text in machine-readable form |
| 3 | [StrategyWiki, “Final Fantasy VIII/Cards”](https://strategywiki.org/wiki/Final_Fantasy_VIII/Cards) | Independent cross-check of basic, special, trade, and starting regional rules |
| 3 | [1999 GameFAQs Card Game FAQ](https://gamefaqs.gamespot.com/ps/197343-final-fantasy-viii/faqs/4903) | Near-release historical cross-check against later reinterpretation |

### 15.2 Corrections and conflicts resolved

#### “More than five” versus five

The English manual and the Ultimania translation both say that Squall must possess “more than five” cards before challenging. The actual game threshold and FFVIII-specific modern references are **at least five**. Each match needs exactly five card copies. The early gift of seven likely concealed the localization/documentation imprecision during normal play.

#### The inverted Same Wall sentence

The 1999 English Ultimania translation says Same Wall does not work “if Same is added at the same time.” That contradicts the rule's own preceding description, the game implementation, Esthar's latent starting state, and every independent rules reference. The intended condition is **if Same is not added**. Same Wall modifies Same and is inert without it.

#### Elemental versus Same/Plus

Some informal explanations apply ±1 before every calculation. The original behavior does not. Adjusted values govern normal capture and Combo; printed values govern Same, Same Wall, and Plus. Multiple independent FFVIII-specific sources and player tests agree.

#### Diff's practical quantities

The final score margin can be 2, 4, 6, or 8, but the loser owns only five offered cards. Therefore Diff awards 2, 4, 5, or 5—not six or eight, and not the often-misstated 1/2/3-card scale.

#### Trade-rule “devolution ladder”

Older guides commonly claim All becomes Direct, Direct becomes Diff, and Diff becomes One with time. Current reverse-engineering rejects that model. The true degeneration target is directly One; non-One-to-non-One changes come from Queen adoption or dominant-region spread.

#### Queen interior-transition probabilities

The normal 220/256 change trigger and one-step adjacency chain are well supported. The conditional direction at Diff and Direct is not: an archived PS1 community summary says 50/50, while FF8.fr says 73/128 toward the lower rule and 55/128 toward the higher. FF8.fr also uniquely documents the post–Lunar Cry Lunar Gate exception. [§11.1](#111-queen-of-cards-personal-rule-and-regional-adoption) preserves both claims and their source strength instead of presenting either disputed split as settled.

#### All-seven abolition weighting

The existence of a separate 1-in-4 abolition chance when all seven rules are present is supported by Jerng's translation of the Square-supervised Japanese Ultimania and FF8.fr. The archived PS1 thread proves the **ordinary** byte mapping but not its reuse in the all-seven branch; FF8.fr publishes a highly Elemental-weighted table for both branches. The player-visible trigger is secure; [§10.4](#104-the-all-seven-rules-exception) leaves the conditional identity distribution unresolved.

#### Elemental layout generation

Multiple sources agree that a random number/subset of spaces receives random elemental marks and on what those marks do. No located official text or stable technical source publishes the exact PS1 distribution over counts, spaces, or elements. A play log observes a fresh layout after a Sudden Death draw, but that single observation is weaker than the rest of the match resolver. The document therefore specifies every consequence of a supplied layout without inventing a tabletop randomizer or undocumented probability table.

### 15.3 Completeness boundary

This document includes every rule that can affect:

- legal hand formation and first player;
- legal placement and capture;
- scoring and draws;
- all playable special-rule combinations;
- capture resolution and Combo recursion;
- permanent card exchange;
- initial regional rule state;
- regional spread, abolition, adoption, dominance, and degeneration;
- exceptional rule-changing NPC/endgame behavior.

It does not reproduce the 110 card records, every NPC's card pool/AI weights, rare-card quest walkthroughs, Card/Card Mod acquisition formulas, or RNG-exploitation recipes. Those are game content, opponent AI, collection systems, or manipulation strategies—not additional rules governing a Triple Triad match. It also does not pretend that disputed or unpublished implementation details are known: the three probability gaps named in the opening scope, plus the unexposed tie-break branches of the two-slot carried-region queue, are explicitly labeled. Links above lead to the original data where adjacent systems are desired.

---

## Compact match-resolution specification

For implementers who want an unambiguous **match resolver**, the following assumes card records, the outcomes of hand-selection and first-player randomness, the players' move choices (or AI), an active **match** special-rule set (including any temporary regional union or NPC override), one trade rule, and—if Elemental is active—an initial board layout have been supplied. A fresh layout input is also required for each Sudden Death continuation. The campaign-level state transitions are described in §§9–12 because several internal random/state branches remain source-disputed or unpublished.

```text
setup:
  require 5 owned card copies
  hands := 5 cards per side (player-selected, or supplied Random outcome)
  first := supplied random first-player result
  board := empty 3x3

for turn 1..9:
  actor := first on odd turns, other on even turns
  place one unrotated hand card in one empty space
  if Elemental is active:
      assign persistent elemental modifier from that space
  else:
      modifier := 0

  basic := adjacent enemy cards where
           adjusted(placed.facing) > adjusted(neighbor.facing)

  same := empty
  if Same is active:
      same_matches := occupied sides where printed facing ranks are equal,
                      plus A-facing board edges if Same Wall is also active
      same := enemy participants if count(same_matches) >= 2

  plus := empty
  if Plus is active:
      for each occupied adjacent side:
          plus_sum := printed(placed.facing) + printed(neighbor.facing), A=10
      plus := enemy participants in every sum value occurring at least twice

  flip union(basic, same, plus)
  seeds := cards flipped as participants in same or plus

  while seeds remain:
      each seed captures adjacent enemy cards where
      adjusted(seed.facing) > adjusted(neighbor.facing)
      newly captured cards become next seeds
      do not re-test Same or Plus

score:
  count colors of 9 board cards + second player's 1 unplayed card
  >5 wins; 5-5 draws

if draw:
  if Sudden Death is active:
      next hands := all 10 original card instances partitioned by final color,
                    including the second player's unplayed card
      swap first/second
      if Elemental is active:
          obtain a fresh continuation-round elemental layout
      clear board and repeat without trading
      resume at the 9-turn loop; do not rerun setup, manual/Random selection,
      or random-first-player selection
  else if trade rule is Direct:
      each original card goes to side of its final color
  else:
      no card changes permanent owner
else:  # decisive score
  restore pre-series ownership if Sudden Death occurred
  One    := winner chooses 1 from loser's original five
  Diff   := winner chooses min(score margin, 5) from loser's original five
  All    := winner takes loser's original five
  Direct := each original card goes to side of its decisive final color
  Null   := no exchange (opening harbor initialization bug only)
```

That is the deterministic original vanilla match logic once its documented inputs are supplied: no added capture rules, no rarity restrictions, and no later-version modifiers.
