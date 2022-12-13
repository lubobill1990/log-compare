import { observer } from 'mobx-react-lite';
import React from 'react';

import { Field } from '@/common/form';
import { useGlobalFilterStore } from '@/mobx/filter';

import { LoadFilterButton, SaveFilterButton } from './filter-button';
import './filter.scss';

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
        placeholder="Separate keydwords with `,`. Regular expression supported as `/search1|search2/`. `AND` condition supported with regular express as `/a/&&/b/`."
      ></Field>

      <Field
        label="Global highlights"
        value={globalFilter.hightlightText}
        onChange={(e: React.ChangeEvent) =>
          globalFilter.setHightlightText((e.target as HTMLInputElement).value)
        }
        placeholder="Separate with `,`"
      ></Field>
      <div className="filter-action">
        <SaveFilterButton></SaveFilterButton>
        <LoadFilterButton></LoadFilterButton>
      </div>
    </div>
  );
});

GlobalFilterRenderer.displayName = 'GlobalFilterRenderer';
