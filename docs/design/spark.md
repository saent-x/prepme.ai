# Spark

Spark is PrepMe's design system. The full reference (tokens, components, the game layer and the 13-screen prototype) lives in the Spark design-system artifact. This file holds the rules the app code follows.

## Foundation (`src/app.css`)

- **Colour.** Ink text and ink (black) primary buttons on white. Cobalt `--spark` (#2b59ff, dark #6b8cff) only marks links, the active place and progress. Green, amber and red only mean good, fix and wrong. Gold and flame are for rewards (XP, streaks). Dark mode is neutral grey, with no purple cast.
- **Type.** Body 14. Page heading `.page-title` 24 (20 on a phone). Section heading `.section-title` 14 bold. Key number `.number-xl` 48.
- **Shape.** Radius 6 / 8 / 10 / 14. Buttons are flat: 32 by default, 28 small, 40 large. Tabs and segmented controls are fully rounded pills that hug their labels.
- **Layout.** Sections and hairline lists, not cards. A panel (border, no fill) is rare. No coloured containers.
- **Chips.** Coloured text with a small dot, no fill (`Badge`, `ScoreChip`).
- **Icons.** Phosphor duotone through `$lib/icons` (never import the icon library in a screen). Icons never sit in tinted squares. The soft layer takes `--icon-tint`, which turns cobalt on the active place and disappears on solid buttons.
- **Illustrations.** unDraw, recoloured with the `--ill-*` tokens, bare (no background) and rare: empty states only (`EmptyState`).
- **Avatars.** Interviewers: DiceBear fun-emoji, one fixed face per name. People: the account photo, otherwise DiceBear open-peeps from the name.
- **Wordmark.** "PrepMe" in type. There is no logo mark yet.

## Sound (`src/lib/sound.ts`)

Sparingly. Only nine moments make a sound: call start, call end, notify ("still there?"), success (scorecard ready), xp, level, badge, streak, error. Clicks, taps and navigation are silent. People can turn sound off from the account menu, and the choice is kept on the device. During a live call only start, end, notify and error can play.

## Credits

Everything third-party is listed on `/credits` with its licence. Add a line there when you add an asset.
