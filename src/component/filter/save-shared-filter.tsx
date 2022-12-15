import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import { IFilter, useGlobalFilterStore } from '@/mobx/filter';

import { useSharedFilter } from './hooks';
import { SaveFilterModal } from './save-filter-modal';

export const SharedFilterListener = observer(() => {
  const sharedFilter = useSharedFilter();
  const globalFilter = useGlobalFilterStore();
  const [closed, setClosed] = useState(false);
  const onSaved = useCallback(
    (filter: IFilter) => {
      globalFilter.setHighlightText(filter.highlightText);
      globalFilter.setSearchKeywords(filter.searchKeywords);
    },
    [globalFilter]
  );

  return (
    <>
      {sharedFilter && (
        <SaveFilterModal
          filter={sharedFilter}
          isOpen={!closed}
          onClose={() => {
            setClosed(true);
          }}
          onSaved={onSaved}
          title="A filter is shared with you"
        ></SaveFilterModal>
      )}
    </>
  );
});
