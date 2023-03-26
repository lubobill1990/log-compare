import { observer } from 'mobx-react-lite';
import React, { ChangeEvent } from 'react';

import { DebouncedInputField } from '@/components/common/form';
import { useGlobalFilterStore } from '@/mobx/filter';

import { LoadFilterButton, SaveFilterButton } from './filter-button';
import './filter.scss';
import { SharedFilterListener } from './save-shared-filter';

export const GlobalFilterRenderer = observer(() => {
  const globalFilter = useGlobalFilterStore();
  return (
    <div className="global-footer">
      <input
        type="checkbox"
        checked={globalFilter.searchEnabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          globalFilter.setEnableSearch(e.target.checked);
        }}
        title="Enable global search"
        className={'field-input'}
      />
      <DebouncedInputField
        className="flex-1"
        inputClassName="flex-1"
        label="Global search"
        value={globalFilter.searchKeywords}
        onChange={(e) => globalFilter.setSearchKeywords(e)}
        placeholder="Format: `pattern1&&pattern2,pattern3`. `pattern1` can be `keyword` or `/regex/`."
      ></DebouncedInputField>

      <DebouncedInputField
        label="Global highlights"
        value={globalFilter.highlightText}
        onChange={(e) => globalFilter.setHighlightText(e)}
        placeholder="Separate with `,`"
      ></DebouncedInputField>
      <SharedFilterListener></SharedFilterListener>
      <div className="filter-action">
        <SaveFilterButton></SaveFilterButton>
        <LoadFilterButton></LoadFilterButton>
      </div>
    </div>
  );
});

GlobalFilterRenderer.displayName = 'GlobalFilterRenderer';
