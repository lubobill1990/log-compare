import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { cx } from '@/components/common/cx';
import { Opened } from '@/icons/opened';

import classes from './section.module.scss';

export const SideBarSection = observer(
  (props: {
    title: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }) => {
    const [opened, setOpened] = useState(false);

    return (
      <div
        className={cx(classes.root, opened && classes.opened, props.className)}
      >
        <div
          className={classes.title}
          onClick={() => {
            setOpened(!opened);
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
