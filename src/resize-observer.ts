import { useEffect, useState } from 'react';

export const useResizeObserver = (elementRef?: React.RefObject<Element>) => {
  const [size, setSize] = useState({ width: 0, height: 0, x: 0, y: 0 });

  useEffect(() => {
    if (elementRef?.current) {
      const resizeObserver = new ResizeObserver((entries, _observer) => {
        entries.forEach((entry) => {
          if (entry.contentBoxSize) {
            // Firefox implements `contentBoxSize` as a single content rect, rather than an array
            const contentBoxSize = (
              Array.isArray(entry.contentBoxSize)
                ? entry.contentBoxSize[0]
                : entry.contentBoxSize
            ) as ResizeObserverSize;
            const boundingBox = elementRef.current?.getBoundingClientRect();
            setSize({
              width: contentBoxSize.inlineSize,
              height: contentBoxSize.blockSize,
              x: boundingBox?.x ?? 0,
              y: boundingBox?.y ?? 0,
            });
          } else {
            setSize({
              width: entry.contentRect.width,
              height: entry.contentRect.height,
              x: entry.contentRect.x,
              y: entry.contentRect.y,
            });
          }
        });
      });
      resizeObserver.observe(elementRef.current);
      return () => {
        if (elementRef.current) {
          resizeObserver.unobserve(elementRef.current);
        }
        resizeObserver.disconnect();
      };
    }
    return () => {};
  }, [elementRef?.current, setSize]);

  return size;
};
