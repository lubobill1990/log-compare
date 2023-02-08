import { action, makeAutoObservable, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';

export class SlotStore {
  slots = new Map<string, React.ReactNode>();

  constructor() {
    makeAutoObservable(
      this,
      {
        slots: observable,
        register: action.bound,
      },
      {}
    );
  }

  register(slotId: string, node: React.ReactNode) {
    this.slots.set(slotId, node);

    return () => {
      if (this.slots.get(slotId) === node) {
        runInAction(() => {
          this.slots.delete(slotId);
        });
      }
    };
  }

  get(slotId: string) {
    return this.slots.get(slotId);
  }

  get slotArray() {
    return Array.from(this.slots.entries()).map(([_slotId, node]) => node);
  }
}

export const Slot = observer(
  (
    props: React.PropsWithChildren<{ slotStore: SlotStore; slotId: string }>
  ) => {
    const { children, slotId, slotStore } = props;

    useEffect(() => {
      return slotStore.register(slotId, children);
    }, [slotId, children, slotStore]);

    return null;
  }
);
Slot.displayName = 'Slot';
