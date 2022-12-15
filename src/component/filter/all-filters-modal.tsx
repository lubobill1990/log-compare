import { faShare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { cx } from '@/common/cx';
import {
  IFilter,
  useGlobalFilterStore,
  useStoredFiltersStore,
} from '@/mobx/filter';
import { useUIStore } from '@/mobx/ui-store';
import { Modal, ModalActions } from '@/widget/modal';

import './filter.scss';
import { ShareLinkModal } from './share-link-modal';

export const AllFiltersModal = observer(() => {
  const uiStore = useUIStore();

  const storedFilters = useStoredFiltersStore();
  const globalFilter = useGlobalFilterStore();
  const [pickedFilter, setPickedFilter] = useState<IFilter | null>(null);
  const [filterShareLink, setFilterShareLink] = useState<string>('');

  return (
    <Modal
      title="All filters"
      isOpen={uiStore.isLoadFilterModalVisible}
      onClose={uiStore.toggleLoadFilterModal}
    >
      <ShareLinkModal
        filterShareLink={filterShareLink}
        setFilterShareLink={setFilterShareLink}
      ></ShareLinkModal>
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
                {filter.highlightText && (
                  <p>{`Highlight: ${filter.highlightText}`}</p>
                )}
                <div className="actions">
                  <FontAwesomeIcon
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('filter', JSON.stringify(filter));
                      setFilterShareLink(url.toString());
                    }}
                    icon={faShare}
                  ></FontAwesomeIcon>
                  <FontAwesomeIcon
                    className="delete"
                    onClick={() =>
                      window.confirm('Confirm delete?') &&
                      storedFilters.deleteFilter(filter.name)
                    }
                    icon={faTrash}
                  ></FontAwesomeIcon>
                </div>
              </div>
            ))}
          </div>
          <ModalActions>
            <button
              onClick={() => {
                if (pickedFilter) {
                  globalFilter.setSearchKeywords(pickedFilter.searchKeywords);
                  globalFilter.setHighlightText(pickedFilter.highlightText);
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
