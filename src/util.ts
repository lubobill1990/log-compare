import { Line } from "./GlobalLogProvider";

export function binarySearchClosestLog(
    orderedLogLines: Line[],
    targetNumber: number,
    targetIndex: number = 1,
    isInvertedOrder: boolean = true
) {
    let start = 0;
    let end = orderedLogLines.length - 1;

    if (isInvertedOrder) {
        while (start <= end) {
            let middleIndex = Math.floor((start + end) / 2);
            let middleValue = orderedLogLines[middleIndex][targetIndex];
            if (middleValue === targetNumber) {
                // found the key
                return middleIndex;
            } else if (middleValue < targetNumber) {
                // continue searching to the right
                end = middleIndex - 1;
            } else {
                // search searching to the left
                start = middleIndex + 1;
            }
        }
    } else {
        while (start <= end) {
            let middleIndex = Math.floor((start + end) / 2);
            let middleValue = orderedLogLines[middleIndex][targetIndex];
            if (middleValue === targetNumber) {
                // found the key
                return middleIndex;
            } else if (middleValue < targetNumber) {
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
