import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Field } from '@/common/form';
import { useGlobalFilterStore, useStoredFiltersStore } from '@/mobx/filter';
import { useUIStore } from '@/mobx/ui-store';
import { Modal, ModalActions, ModalSize } from '@/widget/modal';

import './filter.scss';

export const SaveFilterModal = observer(() => {
  const uiStore = useUIStore();
  const globalFilter = useGlobalFilterStore();
  const storedFiltersStore = useStoredFiltersStore();
  const [name, setName] = useState('');
  const [errorMsgs, setErrorMsgs] = useState<string[]>([]);

  const checkError = () => {
    const errors: string[] = [];
    if (!name) {
      errors.push('Name is required');
    }
    if (!globalFilter.searchKeywords && !globalFilter.hightlightText) {
      errors.push('Search pattern and highlight keywords cannot be both empty');
    }
    if (storedFiltersStore.storedFilters.some((f) => f.name === name)) {
      errors.push('Name already exists');
    }
    const identicalFilter = storedFiltersStore.storedFilters.find(
      (f) =>
        f.searchKeywords === globalFilter.searchKeywords &&
        f.hightlightText === globalFilter.hightlightText
    );
    if (identicalFilter) {
      errors.push(`Filter already exists: ${identicalFilter.name}`);
    }
    if (errors.length > 0) {
      setErrorMsgs(errors);
      return false;
    }
    setErrorMsgs([]);
    return true;
  };

  return (
    <Modal
      title="Save Filter Modal"
      isOpen={uiStore.isSaveFilterModalVisible}
      onClose={uiStore.toggleSaveFilterModel}
      size={ModalSize.Medium}
      className="save-filter-modal"
    >
      <Field
        label="Filter name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        inputClassName="flex-1"
      ></Field>
      <Field
        label="Search pattern"
        value={globalFilter.searchKeywords}
        disabled={true}
        inputClassName="flex-1"
      ></Field>
      <Field
        label="Highlight keywords"
        value={globalFilter.hightlightText}
        disabled={true}
        inputClassName="flex-1"
      ></Field>

      {errorMsgs.length > 0 && (
        <ul className="error">
          {errorMsgs.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}

      <ModalActions>
        <button
          onClick={() => {
            if (
              checkError() &&
              storedFiltersStore.saveFilter(globalFilter, name)
            ) {
              uiStore.toggleSaveFilterModel();
              setName('');
              setErrorMsgs([]);
            }
          }}
        >
          Save filter
        </button>
      </ModalActions>
    </Modal>
  );
});
