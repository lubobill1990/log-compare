import { useEffect, useState } from 'react';

import { IFilter, useStoredFiltersStore } from '@/mobx/filter';

export function useSharedFilter() {
  const storedFilters = useStoredFiltersStore();
  const { href } = window.location;
  const [filterState, setFilterState] = useState<IFilter>();

  useEffect(() => {
    const filterParams = new URL(href).searchParams.get('filter');
    if (filterParams) {
      const filter = JSON.parse(filterParams) as IFilter;
      if (
        filter.name !== undefined &&
        filter.searchKeywords !== undefined &&
        filter.highlightText !== undefined
      ) {
        setFilterState(filter);
      }
    }
  }, [setFilterState, href]);

  if (filterState && storedFilters.exists(filterState)) {
    return undefined;
  }

  return filterState;
}
