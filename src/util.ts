import { LogLine } from './interface';

export function binarySearchClosestLog(
  orderedLogLines: LogLine[],
  targetTimestamp: number,
  isInvertedOrder: boolean = true
) {
  let start = 0;
  let end = orderedLogLines.length - 1;

  if (orderedLogLines.length === 0) {
    return 0;
  }

  if (isInvertedOrder) {
    if (targetTimestamp > orderedLogLines[start].timestamp) {
      return start;
    }
    if (targetTimestamp < orderedLogLines[end].timestamp) {
      return end;
    }
    while (start <= end) {
      const middleIndex = Math.floor((start + end) / 2);
      const middleTimestamp = orderedLogLines[middleIndex].timestamp;
      if (middleTimestamp === targetTimestamp) {
        // found the key
        return middleIndex;
      }
      if (targetTimestamp > middleTimestamp) {
        // continue searching to the right
        end = middleIndex - 1;
      } else {
        // search searching to the left
        start = middleIndex + 1;
      }
    }
  } else {
    if (targetTimestamp < orderedLogLines[start].timestamp) {
      return start;
    }
    if (targetTimestamp > orderedLogLines[end].timestamp) {
      return end;
    }
    while (start <= end) {
      const middleIndex = Math.floor((start + end) / 2);
      const middleValue = orderedLogLines[middleIndex].timestamp;
      if (middleValue === targetTimestamp) {
        // found the key
        return middleIndex;
      }
      if (middleValue < targetTimestamp) {
        // continue searching to the right
        start = middleIndex + 1;
      } else {
        // search searching to the left
        end = middleIndex - 1;
      }
    }
  }

  // key wasn't found
  return Math.floor((start + end) / 2);
}

export function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}
