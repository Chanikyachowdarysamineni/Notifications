import { useMemo } from 'react';

const PALETTES = [
  {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/60',
    accent: 'bg-blue-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    glow: 'shadow-blue-500/20'
  },
  {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    accent: 'bg-indigo-500',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    glow: 'shadow-indigo-500/20'
  },
  {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/60',
    accent: 'bg-purple-500',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
    glow: 'shadow-purple-500/20'
  },
  {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    accent: 'bg-emerald-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    glow: 'shadow-emerald-500/20'
  },
  {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800/60',
    accent: 'bg-teal-500',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/40',
    glow: 'shadow-teal-500/20'
  },
  {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
    accent: 'bg-amber-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    glow: 'shadow-amber-500/20'
  },
  {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
    accent: 'bg-rose-500',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/40',
    glow: 'shadow-rose-500/20'
  },
  {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800/60',
    accent: 'bg-cyan-500',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    glow: 'shadow-cyan-500/20'
  }
];

export function getSubjectColor(subjectName = '') {
  if (!subjectName) return PALETTES[0];
  
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = (hash << 5) - hash + subjectName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

export function useSubjectColor(subjectName = '') {
  return useMemo(() => getSubjectColor(subjectName), [subjectName]);
}
