// Canonical "Pitch" formation renderer, per the SofaScore-IA rebuild brief's
// requirement for one shared Pitch component used by My Team (and, in future,
// Team of the Round once the backend ships bulk round-level player points —
// see BACKEND_CONTRACT.md §9). PitchLayout.tsx is the confirmed-working
// formation renderer already used across 5 screens — re-exported here under
// the new name rather than rewritten, so no existing call site breaks.
export { PitchLayout as Pitch } from './PitchLayout'
