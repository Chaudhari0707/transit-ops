export function assertDifferentLocations(
  sourceLocationId: string,
  destinationLocationId: string,
): void {
  if (sourceLocationId === destinationLocationId) {
    throw new Error("Source and destination must be different locations");
  }
}
