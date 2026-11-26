import { createAvatar } from '@dicebear/core';
import { funEmoji, openPeeps } from '@dicebear/collection';

/** Agent colours (coral, sky, mint, sun, lilac). The avatar picks one from the name, so it never changes for a given agent. */
export const FACE_COLOURS = ['ff6b6b', '3e9bff', '2bc6a4', 'ffc53d', '9b7bff'] as const;

/** Faces pinned in the design (docs/design/penpot/SPEC.md), so the sample agents look the same everywhere. */
const PINNED: Record<string, { eyes: string; mouth: string; colour: string }> = {
  maya: { eyes: 'glasses', mouth: 'lilSmile', colour: 'ff6b6b' },
  ravi: { eyes: 'cute', mouth: 'wideSmile', colour: '3e9bff' },
  june: { eyes: 'wink', mouth: 'smileTeeth', colour: '2bc6a4' },
  omar: { eyes: 'plain', mouth: 'cute', colour: 'ffc53d' },
  lea: { eyes: 'closed', mouth: 'smileLol', colour: '9b7bff' }
};

function hash(seed: string) {
  // FNV-1a: spreads short names evenly across the colours.
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}

const cache = new Map<string, string>();

/** Colour tied to an interviewer's name, as a CSS hex value. */
export function faceColour(name: string) {
  const pin = PINNED[name.trim().toLowerCase()];
  if (pin) return '#' + pin.colour;
  return '#' + FACE_COLOURS[hash(name.trim().toLowerCase() || 'prepme') % FACE_COLOURS.length];
}

/** A friendly face generated from the interviewer's name. Same name, same face. */
export function interviewerFace(name: string) {
  const seed = name.trim().toLowerCase() || 'prepme';
  const hit = cache.get('f:' + seed);
  if (hit) return hit;
  const pin = PINNED[seed];
  const uri = createAvatar(funEmoji, {
    seed,
    backgroundColor: [faceColour(name).slice(1)],
    // Friendly expressions only: an interviewer should not look sad or sick.
    eyes: (pin ? [pin.eyes] : ['cute', 'wink', 'wink2', 'plain', 'glasses', 'closed', 'shades', 'closed2']) as never,
    mouth: (pin ? [pin.mouth] : ['plain', 'lilSmile', 'cute', 'wideSmile', 'smileTeeth', 'smileLol']) as never
  }).toDataUri();
  cache.set('f:' + seed, uri);
  return uri;
}

/** Avatar for a person (the signed-in user), generated from their name. */
export function personFace(name: string) {
  const seed = name.trim().toLowerCase() || 'you';
  const hit = cache.get('p:' + seed);
  if (hit) return hit;
  const uri = createAvatar(openPeeps, { seed, backgroundColor: ['ffe3cc', 'dde6ff', 'dcf5ea', 'f1f1f3'] }).toDataUri();
  cache.set('p:' + seed, uri);
  return uri;
}
