import { observer } from 'mobx-react-lite';

import { useUIStore } from '@/mobx/ui-store';

import { LoadFilterModal } from './load-filter-modal';
import { SaveFilterModal } from './save-filter-modal';

export const LoadFilterButton = observer(() => {
  const uiStore = useUIStore();
  return (
    <>
      <LoadFilterModal></LoadFilterModal>
      <button onClick={uiStore.toggleLoadFilterModal}>Load filter</button>
    </>
  );
});

export const SaveFilterButton = observer(() => {
  const uiStore = useUIStore();
  return (
    <>
      <SaveFilterModal></SaveFilterModal>
      <button onClick={uiStore.toggleSaveFilterModel}>Save filter</button>
    </>
  );
});
