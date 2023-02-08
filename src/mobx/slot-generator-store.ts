import { action, makeAutoObservable, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';

export type ReactNodeGenerator = () => React.ReactNode;

export class SlotGeneratorStore {
  slots = new Map<string, ReactNodeGenerator>();

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

  register(slotId: string, nodeGenerator: ReactNodeGenerator) {
    this.slots.set(slotId, nodeGenerator);

    return () => {
      if (this.slots.get(slotId) === nodeGenerator) {
        runInAction(() => {
          this.slots.delete(slotId);
        });
      }
    };
  }

  get(slotId: string) {
    return this.slots.get(slotId);
  }

  get nodeGenerators() {
    return Array.from(this.slots.entries()).map(
      ([_slotId, nodeGenerator]) => nodeGenerator
    );
  }
}

export const SlotGenerator = observer(
  (props: {
    slotStore: SlotGeneratorStore;
    slotId: string;
    children: ReactNodeGenerator;
  }) => {
    const { children, slotId, slotStore } = props;

    useEffect(() => {
      return slotStore.register(slotId, children);
    }, [slotId, children, slotStore]);

    return null;
  }
);
SlotGenerator.displayName = 'SlotGenerator';
