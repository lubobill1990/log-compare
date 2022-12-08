import { observer } from 'mobx-react-lite';
import React from 'react';

import { cx } from '@/common/cx';

import './App.css';
import { useGlobalFilterStore, useLogFileFilterStore } from './mobx/filter';

const StoredFiltersSelector = observer(() => {
  const storedFilters = useLogFileFilterStore();
  const globalFilter = useGlobalFilterStore();
  return (
    <select
      className={cx('123')}
      onChange={(e) => {
        const filter =
          storedFilters.storedFilters[parseInt(e.target.value, 10)];
        if (filter) {
          globalFilter.hightlightText = filter.hightlightText;
          globalFilter.searchKeywords = filter.searchKeywords;
        }
      }}
    >
      <option value="">Stored filters</option>
      {storedFilters.storedFilters.map((filter, index) => (
        <option value={index} key={index}>
          {filter.name ||
            `Search: ${filter.searchKeywords} - Highlight: ${filter.hightlightText}`}
        </option>
      ))}
    </select>
  );
});

export const GlobalFilterRenderer = observer(() => {
  const storedFilters = useLogFileFilterStore();
  const globalFilter = useGlobalFilterStore();
  return (
    <div className="global-footer">
      <div className="stored-filters">
        <StoredFiltersSelector></StoredFiltersSelector>
      </div>
      <div className="keyword-filter">
        <label htmlFor="">Global search:</label>
        <input
          type="text"
          className="keywords"
          onChange={(e: React.ChangeEvent) =>
            globalFilter.setSearchKeywords((e.target as HTMLInputElement).value)
          }
          placeholder="Separate keydwords with `,`. Regular expression supported as `/search1|search2/`. `AND` condition supported with regular express as `/a/&&/b/`."
          value={globalFilter.searchKeywords}
        />
      </div>
      <div className="global-highlight-keywords">
        <label htmlFor="">Global highlights:</label>
        <input
          type="text"
          className="keywords"
          onChange={(e: React.ChangeEvent) =>
            globalFilter.setHightlightText((e.target as HTMLInputElement).value)
          }
          placeholder="Separate with `,`"
          value={globalFilter.hightlightText}
        />
      </div>
      <div>
        <button
          onClick={() => {
            storedFilters.saveFilter(globalFilter);
          }}
        >
          Save Filter
        </button>
      </div>
    </div>
  );
});

GlobalFilterRenderer.displayName = 'GlobalFilterRenderer';
