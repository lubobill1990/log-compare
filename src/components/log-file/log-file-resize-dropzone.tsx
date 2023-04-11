import { range } from 'lodash';
import { runInAction } from 'mobx';
import { useRef } from 'react';
import { useDrop } from 'react-dnd';

import { useLogFliesStore } from '@/mobx/log-file';
import { useUIStore } from '@/mobx/ui-store';

function resizeColumns(
  minColumnWidth: number,
  originColumWidthArray: number[],
  changeIndex: number,
  xDiff: number
): number[] {
  if (xDiff === 0) {
    return originColumWidthArray;
  }
  const res = originColumWidthArray.slice();
  const indexToIterate =
    xDiff > 0
      ? range(changeIndex, originColumWidthArray.length)
      : range(changeIndex - 1, -1, -1);
  let diffLeft = Math.abs(xDiff);
  indexToIterate.some((i) => {
    if (diffLeft <= 0) {
      return true;
    }
    const decreasableWidthForI = Math.max(
      originColumWidthArray[i] - minColumnWidth,
      0
    );
    const widthToDecrease = Math.min(diffLeft, decreasableWidthForI);
    res[i] -= widthToDecrease;
    diffLeft -= widthToDecrease;
    return false;
  });

  res[changeIndex - (xDiff > 0 ? 1 : 0)] += Math.abs(xDiff) - diffLeft;

  return res;
}

export const useLogFileResizeDropzone = () => {
  const logFileStore = useLogFliesStore();
  const uiStore = useUIStore();
  const initialWidths = useRef<number[] | null>(null);

  const [, logFileResizeDropRef] = useDrop(
    () => ({
      accept: ['LogFileResize'],
      drop() {
        initialWidths.current = null;
      },
      hover({ index }: { index: number }, dropTargetMonitor) {
        if (initialWidths.current === null) {
          initialWidths.current = logFileStore.files.map(
            (file) => file.widthProportion * uiStore.logPanelWidth
          );
        }
        const xDiff =
          dropTargetMonitor.getDifferenceFromInitialOffset()?.x ?? 0;
        const resizedColumnWidthArray = resizeColumns(
          400,
          initialWidths.current,
          index,
          xDiff
        );
        runInAction(() => {
          logFileStore.files.forEach((file, i) =>
            file.setWidthProportion(
              resizedColumnWidthArray[i] / uiStore.logPanelWidth
            )
          );
        });
      },
    }),
    [logFileStore, uiStore]
  );
  return { logFileResizeDropRef };
};
