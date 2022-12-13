import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { cx } from '@/common/cx';
import {
  StoredFilter,
  useGlobalFilterStore,
  useStoredFiltersStore,
} from '@/mobx/filter';
import { useUIStore } from '@/mobx/ui-store';
import { Modal, ModalActions } from '@/widget/modal';

import './filter.scss';

export const LoadFilterModal = observer(() => {
  const uiStore = useUIStore();

  const storedFilters = useStoredFiltersStore();
  const globalFilter = useGlobalFilterStore();
  const [pickedFilter, setPickedFilter] = useState<StoredFilter | null>(null);
  return (
    <Modal
      title="Load Filter Modal"
      isOpen={uiStore.isLoadFilterModalVisible}
      onClose={uiStore.toggleLoadFilterModal}
    >
      {storedFilters.storedFilters.length === 0 && <div>No filters</div>}
      {storedFilters.storedFilters.length > 0 && (
        <>
          <div className="stored-filters">
            {storedFilters.storedFilters.map((filter, index) => (
              <div
                className={cx(
                  'stored-filter',
                  pickedFilter?.name === filter.name && 'picked'
                )}
                key={index}
                onClick={() => setPickedFilter(filter)}
              >
                <label>{filter.name}</label>
                {filter.searchKeywords && (
                  <p>{`Search: ${filter.searchKeywords}`}</p>
                )}
                {filter.hightlightText && (
                  <p>{`Highlight: ${filter.hightlightText}`}</p>
                )}
                <FontAwesomeIcon
                  className="delete"
                  onClick={() =>
                    window.confirm('Confirm delete?') &&
                    storedFilters.deleteFilter(filter.name)
                  }
                  icon={faTrash}
                ></FontAwesomeIcon>
              </div>
            ))}
          </div>
          <ModalActions>
            <button
              onClick={() => {
                if (pickedFilter) {
                  globalFilter.setSearchKeywords(pickedFilter.searchKeywords);
                  globalFilter.setHightlightText(pickedFilter.hightlightText);
                  uiStore.toggleLoadFilterModal();
                }
              }}
            >
              Load filter
            </button>
          </ModalActions>
        </>
      )}
    </Modal>
  );
});
