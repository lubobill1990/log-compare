import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';

import { cx } from './components/common/cx';
import { useFileDropzone } from './file-dropzone';
import classes from './layout.module.scss';
import { SlotName, useLayoutStore } from './mobx/layout-store';
import { ReactNodeGenerator, SlotGenerator } from './mobx/slot-generator-store';
import { Slot } from './mobx/slot-store';

export const LayoutSlot = observer(
  (props: { slotId: SlotName; children: React.ReactNode }) => {
    const { children, slotId } = props;
    const store = useLayoutStore();
    return (
      <Slot slotId={slotId} slotStore={store.slots}>
        {children}
      </Slot>
    );
  }
);
LayoutSlot.displayName = 'LayoutSlot';

export const ActivityBarSlot = observer(
  (props: { slotId: string; children: React.ReactNode }) => {
    const { children, slotId } = props;
    const store = useLayoutStore();
    return (
      <Slot slotId={slotId} slotStore={store.activityBarEntrySlots}>
        {children}
      </Slot>
    );
  }
);
ActivityBarSlot.displayName = 'ActivityBarSlot';

export const SideBarGeneratorSlot = observer(
  (props: { slotId: string; children: ReactNodeGenerator }) => {
    const { children, slotId } = props;
    const store = useLayoutStore();
    return (
      <SlotGenerator slotId={slotId} slotStore={store.sideBarSlotGenerators}>
        {children}
      </SlotGenerator>
    );
  }
);
SideBarGeneratorSlot.displayName = 'SideBarGeneratorSlot';

export function Rows(props: React.PropsWithChildren<{ gap?: number }>) {
  const { gap, children } = props;
  const style: React.CSSProperties = {};
  if (gap !== undefined) {
    style.gap = `${gap}px`;
  }
  return (
    <div className={classes.rows} style={style}>
      {children}
    </div>
  );
}

export function Cols(
  props: React.PropsWithChildren<{ center?: boolean; className?: string }>
) {
  return (
    <div
      className={cx(classes.cols, props.className)}
      style={{ alignItems: props.center ? 'center' : 'none' }}
    >
      {props.children}
    </div>
  );
}

export const ActivityBar = observer(() => {
  const node = useLayoutStore().getSlot(SlotName.activityBar);
  return <div className={classes.activityBar}>{node}</div>;
});

export const ActivityBarEntry = observer(
  (props: React.PropsWithChildren<{ id: string }>) => {
    const { id } = props;
    const store = useLayoutStore();
    const selected = store.selectedActivityEntryId === id;
    const onClick = useCallback(() => {
      store.toggleActivityEntry(id);
    }, [id]);
    return (
      <div
        className={cx(
          classes.activityBarEntry,
          selected && classes.activityEntrySelected
        )}
        onClick={onClick}
      >
        {props.children}
      </div>
    );
  }
);

export const SideBar = observer(() => {
  const node = useLayoutStore().getSlot(SlotName.sideBar);
  return <>{node && <div className={classes.sideBar}>{node}</div>}</>;
});

export const SideBarTitle = observer(
  (props: { title: string; children?: React.ReactNode }) => {
    return (
      <div className={classes.sideBarTitle}>
        {props.title}
        {props.children}
      </div>
    );
  }
);

export const MainView = observer(() => {
  const node = useLayoutStore().getSlot(SlotName.mainView);
  return <div className={classes.mainView}>{node}</div>;
});

export const SearchBar = observer(() => {
  const node = useLayoutStore().getSlot(SlotName.searchBar);
  return <div className={classes.searchBar}>{node}</div>;
});

export const LogPanel = observer(() => {
  const node = useLayoutStore().getSlot(SlotName.logPanel);
  const dropRef = useFileDropzone();
  return (
    <div ref={dropRef} className={classes.logPanel}>
      {node}
    </div>
  );
});

export const ColResizer = () => {
  return <div className={classes.colResizer}></div>;
};

export const RowResizer = () => {
  return <div className={classes.rowResizer}></div>;
};

const MainViewContent = observer(() => (
  <LayoutSlot slotId={SlotName.mainView}>
    <LogPanel />
    <SearchBar />
  </LayoutSlot>
));

const ActivityBarContent = observer(() => {
  const store = useLayoutStore();

  return (
    <LayoutSlot slotId={SlotName.activityBar}>
      {store.activityBarEntries}
    </LayoutSlot>
  );
});
const SideBarContent = observer(() => {
  const store = useLayoutStore();
  const nodeGenerator = store.sideBarSlotGenerators.get(
    store.selectedActivityEntryId
  );
  const node = useMemo(nodeGenerator ?? (() => undefined), [nodeGenerator]);
  return <LayoutSlot slotId={SlotName.sideBar}>{node}</LayoutSlot>;
});

export const AppLayout = (props: React.PropsWithChildren) => {
  return (
    <>
      <MainViewContent />
      <ActivityBarContent />
      <SideBarContent />
      <div className={classes.root}>
        <ActivityBar />
        <SideBar />
        <ColResizer />
        <MainView />
      </div>
    </>
  );
};
