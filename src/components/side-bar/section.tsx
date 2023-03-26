import { uniqueId } from 'lodash';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { cx } from '@/components/common/cx';
import { Opened } from '@/icons/opened';
import { useLayoutStore } from '@/mobx/layout-store';

import classes from './section.module.scss';

export const SideBarSection = observer(
  (props: {
    title: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    id?: string;
  }) => {
    const id = useMemo(() => props.id ?? uniqueId(), [props.id]);
    const { sideBarSections } = useLayoutStore();
    const opened = sideBarSections.isOpened(id);
    return (
      <div
        className={cx(classes.root, opened && classes.opened, props.className)}
      >
        <div
          className={classes.title}
          onClick={() => {
            sideBarSections.toggleSection(id);
          }}
        >
          <Opened opened={opened}></Opened>
          {props.title}
        </div>
        {opened && <div className={classes.content}>{props.children}</div>}
      </div>
    );
  }
);
