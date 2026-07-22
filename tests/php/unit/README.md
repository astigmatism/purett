# Core mechanics unit tests

`tests/php/unit.php` is the dependency-free unit runner. It loads every
`*Test.php` file in this directory, so new rule groups can be added without
changing the runner.

The tests execute the production `PureTripleTriad_Game` resolver and
`PureTripleTriad_AI` scorer with in-memory cards, player state, persistence,
and logging fixtures. They do not boot the application or connect to MariaDB
or Redis. Private engine methods are reached through a small reflection helper
solely to bypass constructor persistence.

Test names cite the applicable sections of `docs/rules.md`. Current coverage is:

- §§2, 4: board adjacency, directional comparisons, strict-greater capture,
  attacker-only behavior, multi-capture, and no Fallen Ace behavior;
- §§5, 8: ten-card score accounting and decisive score margins;
- §6: Same, Plus, Same Wall, Elemental, and Sudden Death round reset;
- §7: Combo seeds, recursion, non-seeds, and Elemental interactions;
- §§6.5–7.3: deterministic AI scoring for Same Wall, equal-side Plus
  participants, and the unique union of Basic, Same, and Plus captures.

Open and Random are setup/presentation rules rather than deterministic capture
rules. Permanent One, Diff, Direct, and All exchanges remain covered by the
database-backed integration suite because the current production settlement
path is intentionally transactional.

Run only this suite with:

```sh
./scripts/test.sh unit
```

When adding an engine rule, build the smallest board that distinguishes the
rule from ordinary capture, cite `docs/rules.md` in the test name, and assert
both the cards that flip and the nearby cards that must not flip.

The Docker-backed runner mounts the working-tree `library/` read-only so unit
results cannot silently come from a previously built application image.
