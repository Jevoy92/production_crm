# Script Index — Theme-First (matches the Lovable site layout)
*The site groups by THEME with JP / PH / MYB tabs per row. This index mirrors that exact mental model. The folders on disk are venture-first (easy browsing per channel); this index + `_MANIFEST.csv` / `_MANIFEST.json` are the theme-first bridge your site reads against.*

**Pillars (lanes):** Reel · Spotlight · Evergreen · System — same four-lane system as the Pals. (Pillar assignments below are a sensible starting point; adjust freely — they're a column in the manifest.)

---

## THEMES WITH ALL THREE VENTURES (9)

| # | Theme | Pillar | Jevoy Palmer | Palmer House | MindYourBizniz |
|---|---|---|---|---|---|
| 01 | Your Own Voice | Evergreen | ✅ 2,500+ | ✅ 2,500+ | ✅ 2,500+ |
| 02 | Judged Before You Speak | Spotlight | ✅ 2,500+ | ✅ 2,500+ | ✅ 2,500+ |
| 03 | The Height Tax | Reel | ✅ 2,500+ | ✅ 2,500+ | ✅ 2,500+ |
| 04 | The Miniature Lie | Spotlight | ✅ 2,500+ | ✅ 2,500+ | ✅ 2,500+ |
| 05 | The Watched Brain | Evergreen | ✅ | ✅ | ✅ |
| 06 | The Cut | Spotlight | ✅ | ✅ | ✅ |
| 07 | The Frame | Reel | ✅ | ✅ | ✅ |
| 08 | The Witness | Spotlight | ✅ | ✅ | ✅ |
| 09 | Seen but Not Known | System | ✅ | ✅ | ✅ |

## MINDYOURBIZNIZ SOLO THEMES (9 — MYB only)

| # | Theme | Pillar | MindYourBizniz |
|---|---|---|---|
| 10 | The Mirror With Memory | System | ✅ |
| 11 | Why We Hide | Spotlight | ✅ |
| 12 | Context Doesn't Travel | System | ✅ |
| 13 | The Wet Cement | Reel | ✅ |
| 14 | The Compass, Not the Megaphone | System | ✅ |
| 15 | A Well-Lit Room With Doors | Evergreen | ✅ |
| 16 | The Clean Lens | System | ✅ |
| 17 | The Empty Chair | Reel | ✅ |
| 18 | The Sharp Photograph | Spotlight | ✅ |

*(Themes 01–04 are at the full 2,500-word standard; 05–18 are complete at their original length — see `_README + Status`.)*

---

## HOW THIS HELPS THE LOVABLE SITE

Your site is **Supabase-backed** — the theme/venture/pillar grid is database rows, not files. So the clean way to keep it organized is a single source of truth the database loads from. That's what `_MANIFEST.csv` and `_MANIFEST.json` are: every script tagged with `theme_no`, `theme`, `pillar`, `venture`, `status`, `spoken_words`, and exact file paths. Import that and the site's categorization stays consistent and never drifts from the files.

Use whichever fits your workflow:
- **`_MANIFEST.csv`** — drop into a Supabase table import, or open in Sheets.
- **`_MANIFEST.json`** — for a code/API import (nested: themes → ventures).
- **This `_INDEX`** — the human-readable version for you.
