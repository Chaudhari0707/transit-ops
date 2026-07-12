/**
 * Official-style snapshot config for data tables (from boneyard docs demo).
 *
 * Defaults already treat `td`/`th` as leaves (cell-level bones). Listing `tr`
 * as well matches apps/docs/demo SNAPSHOT_CONFIG. Walk hits `tr` first when
 * present as a leaf — for cell-level capture we omit `tr` so each cell is a bone.
 *
 * Icons/buttons get excluded so action columns don't explode into icon boxes.
 */
export const TABLE_CELL_SNAPSHOT = {
  captureRoundedBorders: true,
  excludeSelectors: ["svg", "[data-no-skeleton]"],
  // Cell-level (default library behavior). Do NOT add "tr" here — that stops
  // at the row and produces full-width bars instead of a cell grid.
};

/**
 * Row-level bars (one bone per table row). Use when a dense cell grid looks
 * worse than classic list/table placeholders.
 */
export const TABLE_ROW_SNAPSHOT = {
  captureRoundedBorders: true,
  excludeSelectors: ["svg", "[data-no-skeleton]"],
  leafTags: ["tr"],
};
