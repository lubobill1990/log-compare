import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Field } from '@/common/form';
import { IFilter, useStoredFiltersStore } from '@/mobx/filter';
import { Modal, ModalActions, ModalSize } from '@/widget/modal';

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
        <Field
          label="Filter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          inputClassName="flex-1"
        ></Field>
        <Field
          label="Search pattern"
          value={filter.searchKeywords}
          disabled={true}
          inputClassName="flex-1"
        ></Field>
        <Field
          label="Highlight keywords"
          value={filter.highlightText}
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
