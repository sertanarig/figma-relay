export function assertFreshSelection({
  expectedSelectionFingerprint,
  currentSelectionFingerprint
}: {
  expectedSelectionFingerprint: string;
  currentSelectionFingerprint: string;
}) {
  if (expectedSelectionFingerprint !== currentSelectionFingerprint) {
    throw new Error("STALE_SELECTION");
  }
}
