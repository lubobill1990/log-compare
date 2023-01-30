import { observer } from 'mobx-react-lite';
import React from 'react';

import { Field } from '@/common/form';
import { useGlobalFilterStore } from '@/mobx/filter';

import { LoadFilterButton, SaveFilterButton } from './filter-button';
import './filter.scss';
import { SharedFilterListener } from './save-shared-filter';

export const GlobalFilterRenderer = observer(() => {
  const globalFilter = useGlobalFilterStore();
  return (
    <div className="global-footer">
      <Field
        className="flex-1"
        inputClassName="flex-1"
        label="Global search"
        value={globalFilter.searchKeywords}
        onChange={(e: React.ChangeEvent) =>
          globalFilter.setSearchKeywords((e.target as HTMLInputElement).value)
        }
        placeholder="Keydword match: `keyword1&&keyword2,keyword3&&keyword4`, `,` means `or` and `&&` means `and`. RegExp match: `reg::regexp&&regexp2`."
      ></Field>

      <Field
        label="Global highlights"
        value={globalFilter.highlightText}
        onChange={(e: React.ChangeEvent) =>
          globalFilter.setHighlightText((e.target as HTMLInputElement).value)
        }
        placeholder="Separate with `,`"
      ></Field>
      <SharedFilterListener></SharedFilterListener>
      <div className="filter-action">
        <SaveFilterButton></SaveFilterButton>
        <LoadFilterButton></LoadFilterButton>
      </div>
    </div>
  );
});

GlobalFilterRenderer.displayName = 'GlobalFilterRenderer';
