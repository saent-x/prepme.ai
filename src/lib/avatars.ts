import { createAvatar } from '@dicebear/core';
import { funEmoji, openPeeps } from '@dicebear/collection';

/** Interviewer colours. The avatar picks one from the name, so it never changes for a given interviewer. */
export const FACE_COLOURS = ['ff7a66', '38bdf8', '34d399', 'ffc531', 'ff9f43', 'f9a8d4'] as const;

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
  return '#' + FACE_COLOURS[hash(name.trim().toLowerCase() || 'prepme') % FACE_COLOURS.length];
}

/** A friendly face generated from the interviewer's name. Same name, same face. */
export function interviewerFace(name: string) {
  const seed = name.trim().toLowerCase() || 'prepme';
  const hit = cache.get('f:' + seed);
  if (hit) return hit;
  const uri = createAvatar(funEmoji, {
    seed,
    backgroundColor: [faceColour(name).slice(1)],
    // Friendly expressions only: an interviewer should not look sad or sick.
    eyes: ['cute', 'wink', 'wink2', 'plain', 'glasses', 'closed', 'stars', 'shades', 'closed2'],
    mouth: ['plain', 'lilSmile', 'cute', 'wideSmile', 'smileTeeth', 'smileLol']
  }).toDataUri();
  cache.set('f:' + seed, uri);
  return uri;
}

/** Avatar for a person (the signed-in user), generated from their name. */
export function personFace(name: string) {
  const seed = name.trim().toLowerCase() || 'you';
  const hit = cache.get('p:' + seed);
  if (hit) return hit;
  const uri = createAvatar(openPeeps, { seed, backgroundColor: ['ffd5a8', 'd7e3ff', 'dcfaee', 'efe9ff'] }).toDataUri();
  cache.set('p:' + seed, uri);
  return uri;
}
