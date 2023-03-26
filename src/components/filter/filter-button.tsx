import { observer } from 'mobx-react-lite';

import { useGlobalFilterStore } from '@/mobx/filter';
import { useLayoutStore } from '@/mobx/layout-store';
import { useUIStore } from '@/mobx/ui-store';

import { SaveFilterModal } from './save-filter-modal';

export const LoadFilterButton = observer(() => {
  const layoutStore = useLayoutStore();

  return (
    <>
      <button
        onClick={() => {
          layoutStore.showActivityEntry('search-panel');
          layoutStore.sideBarSections.openSection('saved-filters');
        }}
      >
        All filters
      </button>
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
