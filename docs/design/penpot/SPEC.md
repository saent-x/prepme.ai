# PrepMe – UI handoff spec

Source: Penpot file **"PrepMe – Redesign 2026-11"** (tor's local Penpot), read from the boards with the Penpot MCP on 2026-11-23.
All values are px at 1x. Desktop boards are 1440×900 (landing 1440×3360). Mobile board is 390×844.

---

## 1. Tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| `ink` | `#111114` | Main text, primary button fill, active border, logo mark, tooltip |
| `muted` | `#6B6B76` | Secondary text, labels, inactive nav text and icons |
| `bg` | `#FFFFFF` | Page, cards on grey, inputs, secondary buttons |
| `surface` | `#F7F7F8` | Grey sections, cards, active nav row, side panels, chips (meta), segmented track |
| `track` | `#F0F0F3` | Bar track, score ring track, user avatar fill |
| `border` | `#EAEAEE` | All 1px dividers and 1px borders |
| `dim` | `#111114` @ 40% | Modal backdrop |
| `good` | `#22A06B` | Score ≥ 75: text, bar, ring; "Live" dot; mic level |
| `good-bg` | `#E6F6EE` | Good pill background |
| `warn` | `#E8A317` | Score 60–74: bar and bullet dots |
| `warn-text` | `#9A6A00` | Score 60–74: number text |
| `warn-bg` | `#FDF3DC` | Warn pill background |
| `bad` | `#E5484D` | Score < 60: text, bar; Recording; End-call button |
| `bad-bg` | `#FDE9EA` | Bad pill and "Recording" pill background |
| `shadow-ink` | `#16150F` | Shadow colour (with opacity, see below) |

Rule: the UI is greyscale. Colour comes only from agent faces and from scores.
Score thresholds: ≥75 good, 60–74 warn, <60 bad.

### Agent colour map (face background, also used for rings and live waveform)

| Agent | Colour | Role (app) | Style |
|---|---|---|---|
| Maya | `#FF6B6B` | Staff Engineer · tough on trade-offs | Tough |
| Ravi | `#3E9BFF` | ML hiring manager · warm, curious | Friendly |
| June | `#2BC6A4` | Product lead · big on impact | Neutral |
| Omar | `#FFC53D` | Head of Data | Tough |
| Lea | `#9B7BFF` | Design manager | Friendly |

Landing "any job" strip: Maya Engineering, Ravi Sales, June Marketing, Omar Finance, Lea Nursing.

### Typography

Font: **Plus Jakarta Sans** (400–800).

| Style | Size / weight / line height | Letter spacing | Where |
|---|---|---|---|
| display | 56 / 800 / 1.15 | -1.6 | Landing hero |
| h-section | 36 / 800 / 1.2 | -1 | Landing section headings |
| h1 | 28 / 800 / 1.4 | -0.6 | Page titles |
| question | 28 / 800 / 1.3 | -0.4 | Live-call question (mobile 20 / 800 / 1.35) |
| score | 28 / 800 / 1.4 | 0 | Score ring number, plan price |
| logo | 20 / 800 / 1.4 | -0.4 | "PrepMe" wordmark |
| h2 | 20 / 800 / 1.4 | 0 (modal title -0.3) | Modal titles, "Mic check", agent name on call |
| h3 | 16 / 800 / 1.4 | 0 | Panel titles, card titles |
| h3-list | 16 / 700 / 1.4 | 0 | List headers |
| lead | 16 / 400 / 1.4 | 0 | Landing sub-lines (muted) |
| body-strong | 14 / 700 / 1.4 | 0 | Row titles, names, active nav |
| body-semi | 14 / 600 / 1.4 | 0 | Links, skill labels |
| nav | 14 / 500 / 1.4 | 0 | Inactive nav items |
| body | 14 / 400 / 1.4 | 0 | Row meta, list items |
| body-read | 14 / 400 / 1.5 | 0 | Transcript, coach chat, job description |
| button | 14 / 600 / 1.2 | 0 | Button labels |
| chip | 13 / 500 / 1.2 | 0 | Chips and tags |
| label | 12 / 700 / 1.4 | 0 | Field labels, table headers, speaker names, timestamps |
| small | 12 / 600 | 0 | "Next up", control labels, pill text (score pills 12/700) |
| caption | 12 / 400 / 1.4 | 0 | Roles under faces, helper lines |

Live transcript text being spoken: 14/400 italic, `muted`.

### Spacing

8px grid: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 120.
- Page content gap from sidebar: 48. App right margin 120 (expanded) / 48 (collapsed).
- Landing margin 120 (content 1200). Section gap 80.

### Radius

6 tooltip / selected segment / selected dropdown row · 8 buttons, inputs, nav row, logo mark · 10 cards, modals · 16 landing preview cards · 999 chips, pills · 50% faces. Bars r3 (6px tall), waveform bars r2.

### Borders and shadows

- Divider / border: 1px `border`. Focus / active field and selected plan card: 1.5px `ink`.
- Call rings: 3px agent colour (216), 2px @35% (248), 1.5px @15% (288).
- `shadow-sm` 0 1 2 #16150F @6% · `shadow-md` 0 4 16 @6% · `shadow-pop` 0 8 24 @12% · `shadow-modal` 0 24 64 @18%.

### Icons

Lucide, stroke 1.6. 20px nav/rows, 16px chips, 24px call controls. `ink` active, `muted` otherwise.

---

## 2. Avatars (DiceBear fun-emoji v9)

```
https://api.dicebear.com/9.x/fun-emoji/svg?seed={name}&eyes={eyes}&mouth={mouth}&backgroundColor={hex}&radius=50
```

| Agent | eyes | mouth | backgroundColor |
|---|---|---|---|
| Maya | glasses | lilSmile | ff6b6b |
| Ravi | cute | wideSmile | 3e9bff |
| June | wink | smileTeeth | 2bc6a4 |
| Omar | plain | cute | ffc53d |
| Lea | closed | smileLol | 9b7bff |

New agents: seed = name; background = next colour in the map. Sizes: 20, 24, 28 (rows), 48 (next-up), 64 (new-agent modal), 96 (landing), 160 (lobby, mobile call), 192 (live call). User avatar: `track` circle, initial 12/700.

---

## 3. Layout

### App shell

| Part | Expanded | Collapsed |
|---|---|---|
| Sidebar width | 232, 1px right border | 64 |
| Logo | "PrepMe" wordmark | 32×32 `ink` mark, r8, "P" white |
| Toggle | panel-left-close in header | panel-left-open at bottom |
| Nav rows | 200×36, r8 | 40×36, r8 |
| Active row | `surface` fill, 14/700 `ink` | `surface` fill |
| Collapsed hover | – | tooltip right, `ink`, r6, 12/600 white |
| Account | divider, avatar 32, name 14/700 + plan 12/400, more icon | avatar 32 |
| Main content | width 1040 | width 1280 |

Collapse state is remembered per user.

### Home
Title h1 + "New interview" button (right). Next-up card 96 tall `surface` r10 (face 48, "Next up", title 16/800, meta, Edit secondary + Start primary). Recent interviews table (680 wide expanded): header 32, rows 48 with dividers: mic icon, title, company, date, score pill 40×24, chevron. Agents list to the right (320 wide, 40 gap): rows 48, face 28, name, style.

### New interview (modal 560)
Job description textarea, parsed meta chips (`surface`) + skill chips (outlined); Interviewer dropdown 48 tall with rows 48 (face, name, one-liner, check) and "+ New agent"; CV file chip; Length segmented (15/30/45 min); footer Cancel + Start.

### Lobby
Top bar 64 (logo, title, close). Left: face 160 in ring 180, name 28/800, role, chips. Right 480: "Mic check", level meter (12px bars, `good`), "Sounds good", Microphone/Speaker selects, "I'm ready" primary 40, checklist.

### Live call
Stage + transcript panel 360 (`surface`). Top bar 64: logo, Recording pill, title, timer "12:48 / 30:00", 2px progress line. Face 192 with rings, name, agent-colour waveform, question 28/800 (760 wide). Idle notice 400×48 ("Still there? Maya waits 20s." + "I'm here"). Controls 56 circles: Mute, Pause, End (`bad`). Transcript entries: face 24 + name 12/700, text 14/1.5.

### Feedback
Breadcrumb, title, meta. Score ring 128 (10px stroke). Skill bars 384×6. Strengths / To improve with 6px dots. Key moments rows 64 (colour bar, time, quote, tag pill). Coach panel 360 `surface` with input.

### Agents
Title + "New agent". Table: Name / Role / Style / Interviews, rows 48, style pill. New-agent modal 480: face 64 preview "Face made from the name", Name, Role, Style segmented (Friendly / Neutral / Tough), Cancel + Create.

### Plans (modal 912)
Three cards 272×360, r10 (Sprint selected 1.5px `ink` + "Most picked"). Name, price 28/800 + period, divider, 3 check rows, Free usage bar, button. Footer "Prices in GBP. Cancel any time."

### Mobile call (390)
Recording pill, timer, title, face 160 + rings, name, question 20/800, transcript peek 104 tall, controls Mute / Text / End.

### Components

Primary button h36 (h40 landing/lobby) `ink` fill · Secondary h36 white + border · Input h40 · Chip h28 · Score pill 40×24 · Status pill h24 · Segmented h40 · Call control 56 · List row h48.

---

## 4. Landing (1440×3360)

- Top bar: logo left, "Log in" + "Start free" (secondary) right.
- Hero (centred, 800 wide): "Practise with an AI interviewer for the exact job." / "Talk it through by voice. Get a score and what to fix." / four 96 faces (Maya Staff Engineer, Ravi ML Manager, June Product Lead, Omar Head of Data) / "Start free interview" primary 40.
- Four 1200×400 sections, alternating text/card, card 680×400 `surface` r16 showing real UI:
  1. "Pick your interviewer" – "Tough, friendly or neutral. Each one asks like a real panel." (open agent dropdown)
  2. "Paste the job, get a tailored interview" – "PrepMe reads the role, the company and the skills." (job field + chips + CV chip)
  3. "Talk it through, live" – "Speak naturally. The transcript keeps up." (192 face with rings + waveform + 3 transcript lines)
  4. "See exactly what to fix" – "A score per skill, and the moments that cost you." (score ring 78, 5 skill bars, To improve)
- "An interviewer for any job" / "Make one for your role in a minute." – five 96 faces with tag chips (Engineering, Sales, Marketing, Finance, Nursing).
- CTA band `surface` 272 tall: "Practise before it counts." + "Start free interview".
