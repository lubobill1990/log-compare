import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { DebouncedInputField, InputField } from '@/components/common/form';
import { Modal, ModalActions, ModalSize } from '@/components/widget/modal';
import { IFilter, useStoredFiltersStore } from '@/mobx/filter';

import './filter.scss';

export const SaveFilterModal = observer(
  (props: {
    filter: IFilter;
    isOpen: boolean;
    onClose: () => void;
    onSaved?: (filter: IFilter) => void;
    title?: string;
  }) => {
    const { filter, onSaved, isOpen, onClose, title } = props;
    const storedFiltersStore = useStoredFiltersStore();
    const [name, setName] = useState(filter.name || '');
    const [errorMsgs, setErrorMsgs] = useState<string[]>([]);

    const checkError = () => {
      const errors: string[] = [];
      if (!name) {
        errors.push('Name is required');
      }
      if (!filter.searchKeywords && !filter.highlightText) {
        errors.push(
          'Search pattern and highlight keywords cannot be both empty'
        );
      }
      if (storedFiltersStore.storedFilters.some((f) => f.name === name)) {
        errors.push('Name already exists');
      }
      const identicalFilter = storedFiltersStore.storedFilters.find(
        (f) =>
          f.searchKeywords === filter.searchKeywords &&
          f.highlightText === filter.highlightText
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
        title={title || 'Save Filter Modal'}
        isOpen={isOpen}
        onClose={onClose}
        size={ModalSize.Medium}
        className="save-filter-modal"
      >
        <DebouncedInputField
          label="Filter name"
          value={name}
          onChange={(e) => setName(e)}
          inputClassName="flex-1"
        ></DebouncedInputField>
        <InputField
          label="Search pattern"
          value={filter.searchKeywords}
          disabled={true}
          inputClassName="flex-1"
        ></InputField>
        <InputField
          label="Highlight keywords"
          value={filter.highlightText}
          disabled={true}
          inputClassName="flex-1"
        ></InputField>

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
              if (checkError() && storedFiltersStore.saveFilter(filter, name)) {
                onClose();
                setName('');
                setErrorMsgs([]);
                onSaved?.({ ...filter, name });
              }
            }}
          >
            Save filter
          </button>
        </ModalActions>
      </Modal>
    );
  }
);
