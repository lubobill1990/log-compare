import { observer } from 'mobx-react-lite';

import { useGlobalFilterStore } from '@/mobx/filter';
import { useUIStore } from '@/mobx/ui-store';

import { AllFiltersModal } from './all-filters-modal';
import { SaveFilterModal } from './save-filter-modal';

export const LoadFilterButton = observer(() => {
  const uiStore = useUIStore();
  return (
    <>
      <AllFiltersModal></AllFiltersModal>
      <button onClick={uiStore.toggleLoadFilterModal}>All filters</button>
    </>
  );
});

export const SaveFilterButton = observer(() => {
  const uiStore = useUIStore();
  const globalFilter = useGlobalFilterStore();

  return (
    <>
      <SaveFilterModal
        filter={globalFilter}
        isOpen={uiStore.isSaveFilterModalVisible}
        onClose={uiStore.toggleSaveFilterModel}
      ></SaveFilterModal>
      <button onClick={uiStore.toggleSaveFilterModel}>Save filter</button>
    </>
  );
});
