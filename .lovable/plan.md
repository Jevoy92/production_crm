## Goal

Polish the 13 MindYourBizniz scripts so they sound like Jevoy, not a template. Two surgical passes only — no body restructuring, no new framework retrofit.

## Pass 1 — Kill the repetitive open

Every MYB cold open currently starts with some flavor of "I want to talk about…". Rewrite each opening line (and only the opening beat — first 2–6 lines of the COLD OPEN block) so:

- No script starts with "I want to…" / "I want to start with…" / "Tonight I want to…".
- Each open is **distinct from the other 12** — pulls from the script's own anchor image (the smudge on the lens, the empty chair, the room with three doors, the platform/train, the trailer vs. the whole film, etc.) instead of a preamble.
- Opens stay in Jevoy's hushed second-person voice — no billboard hooks, no "huge news," no manufactured urgency.
- Time-of-day language ("tonight", "this evening", "late tonight", "stay up with me") is removed everywhere in the script, not just the open. Replace with neutral framing ("right now," "for a minute," or just delete).

## Pass 2 — Remove fabricated proof

Audit every script for invented evidence that Jevoy would have to fake on camera, and either delete it or rewrite it as honest first-person ("I've felt this," "I've done this," generalized "you/we" recognition). Specifically hunt and remove:

- Fabricated letters / DMs / "a viewer wrote me…"
- Fabricated patients, buddies, "my friend who…" composites
- Invented case studies, made-up stats, "a guy I know" anecdotes
- "Imagine you got a letter that said…" devices

What stays:
- Real cited research already in the scripts (Zajonc, Todorov, Boothby, Willis, Ambady, Gilovich, the documented ancient stories, etc.) — these are public and not fabrications.
- Generalized second-person scenes ("you walk into the room, you set down the mug…") — these are recognition, not invented evidence.
- Jevoy's own first-person experience where it already exists.

Where a fabricated anecdote was load-bearing for a beat, replace it with one of:
1. A first-person Jevoy line ("I've sat in that chair. I know the feeling of…").
2. A generalized second-person recognition scene.
3. A clean cut — delete the beat if it isn't doing work.

## Files in scope (13)

`src/content/scripts/Final/MYB/`:
- A Well-Lit Room With Doors
- Context Doesn't Travel
- Judged Before You Speak
- Known by Thousands, Seen by No One
- The Clean Lens
- The Compass, Not the Megaphone
- The Empty Chair
- The Height Tax
- The Miniature Lie
- The Mirror With Memory
- The Moment You Didn't Keep
- The Parts We Cut
- The Sharp Photograph
- The Watched Brain
- The Wet Cement
- Who Holds You in Mind
- Why We Hide
- Your Own Voice

(Manifest will be checked — final count is the 18 in `_manifest.json`; the 13 number is the set flagged with "I want to…" opens, but every MYB file gets the fabrication scrub.)

## Mechanics

For each file:
1. Read it in full.
2. Rewrite the cold open's first beat only.
3. Search the body for `tonight|this evening|late tonight|letter from|wrote me|got a DM|patient of mine|buddy of mine|friend of mine who|imagine you got` and rewrite each hit per the rules above.
4. Update the source file under `src/content/scripts/Final/MYB/`.
5. Mirror to `public/hubs/scripts/Final/MYB/`.
6. Regenerate that script's teleprompter file (same location, `*-Teleprompter.txt`) and update its word count in `src/content/scripts/Final/MYB/_manifest.json`.

## Out of scope

- No Illusion-of-Novelty restructuring (you chose "opens + fabrications only").
- No JP or PH script edits.
- No UI / route changes.
- No new framework section, no contrast/urgency/proof-ladder rewrite of bodies.

## Verification

After the batch: grep MYB folder for `I want to`, `tonight`, `letter`, `patient`, `buddy of mine` — expect zero hits outside legitimate uses. Spot-check 2 scripts in the preview's Scripts page to confirm rendering and teleprompter download still work.
