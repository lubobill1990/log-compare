import { LogLine } from './interface';

export function binarySearchClosestLog(
  orderedLogLines: LogLine[],
  targetNumber: number,
  isInvertedOrder: boolean = true
) {
  let start = 0;
  let end = orderedLogLines.length - 1;

  if (isInvertedOrder) {
    while (start <= end) {
      const middleIndex = Math.floor((start + end) / 2);
      const middleValue = orderedLogLines[middleIndex].timestamp;
      if (middleValue === targetNumber) {
        // found the key
        return middleIndex;
      }
      if (middleValue < targetNumber) {
        // continue searching to the right
        end = middleIndex - 1;
      } else {
        // search searching to the left
        start = middleIndex + 1;
      }
    }
  } else {
    while (start <= end) {
      const middleIndex = Math.floor((start + end) / 2);
      const middleValue = orderedLogLines[middleIndex].timestamp;
      if (middleValue === targetNumber) {
        // found the key
        return middleIndex;
      }
      if (middleValue < targetNumber) {
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
