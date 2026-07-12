/**
 * Boneyard runtime look — NOT CSS animate-pulse.
 *
 * Theme reference (globals.css):
 *   light --muted ≈ #f9fafb (pulse skeleton fill in shadcn/Sardhar)
 *   light --border ≈ #dcdfe2
 *   dark  --muted ≈ #2a303e
 *
 * animate-pulse only fades opacity of muted. Boneyard’s value is the
 * *shimmer sweep* over bone geometry. Base fill ≈ muted; highlight slightly
 * lighter so the sweep reads without looking like a different palette.
 */
export const BONEYARD_RUNTIME = {
  animate: "shimmer" as const,
  /** Bone fill — between muted (#f9fafb) and border so pills read on white cards */
  color: "#e8eaee",
  /** Sweep highlight — theme muted light */
  shimmerColor: "#f9fafb",
  /** Dark mode bone fill — theme muted */
  darkColor: "#2a303e",
  /** Dark mode sweep — slightly elevated muted */
  darkShimmerColor: "#3a4254",
  shimmerAngle: 110,
  speed: "2s",
  select: "viewport" as const,
  transition: 300,
  stagger: 40,
};
