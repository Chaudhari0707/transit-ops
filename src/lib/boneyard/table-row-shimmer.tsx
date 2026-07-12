import { TableCell, TableRow } from "@/components/ui/table";
/**
 * Structure-preserving loading bars (Sardhar-style).
 *
 * Tables: keep ONE <table>; only tbody cells use TableLoadingRows.
 * KPI cards: keep card + label; only the numeric value uses ValueShimmerBar.
 *
 * Do not wrap HTML tables in boneyard-js <Skeleton> (div) — splits columns.
 */
import { BONEYARD_RUNTIME } from "@/lib/boneyard/runtime-style";
import { cn } from "@/lib/utils";

const barStyle = {
  backgroundColor: BONEYARD_RUNTIME.color,
  backgroundImage: `linear-gradient(${BONEYARD_RUNTIME.shimmerAngle}deg, ${BONEYARD_RUNTIME.color} 30%, ${BONEYARD_RUNTIME.shimmerColor} 50%, ${BONEYARD_RUNTIME.color} 70%)`,
  backgroundSize: "200% 100%",
  animation: `boneyard-cell-shimmer ${BONEYARD_RUNTIME.speed} linear infinite`,
} as const;

export function ShimmerKeyframes() {
  return (
    <style>{`@keyframes boneyard-cell-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
  );
}

/** Single bar — for KPI values, chart titles, etc. Card chrome stays real. */
export function ValueShimmerBar({ className }: { className?: string }) {
  return (
    <>
      <ShimmerKeyframes />
      <div
        className={cn("h-7 w-14 max-w-full rounded-full", className)}
        style={barStyle}
        aria-hidden
      />
    </>
  );
}

export function TableLoadingRows({
  columnCount,
  rowCount = 6,
}: {
  columnCount: number;
  rowCount?: number;
}) {
  const cols = Math.max(1, columnCount);
  const rows = Math.max(1, rowCount);

  return (
    <>
      <ShimmerKeyframes />
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`load-row-${rowIndex}`}>
          {Array.from({ length: cols }).map((__, cellIndex) => (
            <TableCell key={`load-cell-${rowIndex}-${cellIndex}`}>
              <div className="h-6 w-full rounded-2xl" style={barStyle} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
