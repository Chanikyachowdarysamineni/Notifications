/**
 * copyMicrocopy.js - Centralized student-friendly & warm micro-copy
 */

export const GREETINGS = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  night: 'Burning the midnight oil'
};

export const EMPTY_STATES = {
  dashboard: {
    title: "You're all caught up! 🎉",
    subtitle: 'No pending classes or deadlines right now. Enjoy your free time!',
    cta: 'Browse Resources'
  },
  announcements: {
    title: 'No new announcements',
    subtitle: 'All quiet on the department feed. Check back later for news and updates.'
  },
  events: {
    title: 'No upcoming events right now',
    subtitle: 'Stay tuned! Workshops, hackathons, and guest lectures will be posted here.'
  },
  timetable: {
    title: 'No classes scheduled',
    subtitle: 'Take a breather or catch up on your reading!'
  },
  files: {
    title: 'No files found',
    subtitle: 'No course materials matched your search. Try different keywords.'
  },
  gallery: {
    title: 'Gallery is quiet',
    subtitle: 'Moments from department events and activities will appear here.'
  }
};

export const ERROR_MESSAGES = {
  general: 'Hmm, that didn’t work — let’s give it another try.',
  network: 'Unable to connect to CSE HUB. Please check your internet connection.',
  sessionExpired: 'Your session has timed out. Please log in again.'
};

export const TIME_LABELS = {
  now: 'Happening Now',
  inMinutes: (mins) => `Starts in ${mins} min`,
  upcoming: 'Next Up',
  completed: 'Done for the day'
};
