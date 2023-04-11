import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { DragSourceMonitor, useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { useLogFliesStore } from '@/mobx/log-file';
import { useUIStore } from '@/mobx/ui-store';

import { cx } from '../common/cx';
import classes from './log-file.module.scss';

const LogFileResizeHandleInner = observer((props: { index: number }) => {
  const { index } = props;

  const [{ isDragging }, resizeRef, dragPreview] = useDrag(
    () => ({
      type: 'LogFileResize',
      item: { index },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [index]
  );

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  return (
    <div
      className={cx(classes.resizer, isDragging && classes.resizerHover)}
      ref={resizeRef}
    ></div>
  );
});

export const LogFileResizeHandle = observer((props: { index: number }) => {
  const uiStore = useUIStore();
  const logFilesStore = useLogFliesStore();

  return (
    <>
      {uiStore.logPanelWidth > 400 * logFilesStore.size && (
        <LogFileResizeHandleInner
          index={props.index}
        ></LogFileResizeHandleInner>
      )}
    </>
  );
});
