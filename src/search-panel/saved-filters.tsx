import {
  faShareFromSquare,
  faTrashCan,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { ShareLinkModal } from '@/components/filter/share-link-modal';
import { SideBarSection } from '@/components/side-bar/section';
import { useGlobalFilterStore, useStoredFiltersStore } from '@/mobx/filter';

import './saved-filters.scss';

export const SavedFilterList = observer(() => {
  const storedFilters = useStoredFiltersStore();
  const [filterShareLink, setFilterShareLink] = useState<string>('');
  const globalFilter = useGlobalFilterStore();

  return (
    <SideBarSection id="saved-filters" title="Saved filters">
      <ShareLinkModal
        filterShareLink={filterShareLink}
        setFilterShareLink={setFilterShareLink}
      ></ShareLinkModal>
      {storedFilters.storedFilters.length === 0 && <div>No filters</div>}
      {storedFilters.storedFilters.length > 0 && (
        <>
          <div className="stored-filters">
            {storedFilters.storedFilters.map((filter, index) => (
              <div className="stored-filter" key={index}>
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
                      globalFilter.setSearchKeywords(filter.searchKeywords);
                      globalFilter.setHighlightText(filter.highlightText);
                    }}
                    icon={faWandMagicSparkles}
                  ></FontAwesomeIcon>
                  <FontAwesomeIcon
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('filter', JSON.stringify(filter));
                      setFilterShareLink(url.toString());
                    }}
                    icon={faShareFromSquare}
                  ></FontAwesomeIcon>
                  <FontAwesomeIcon
                    className="delete"
                    onClick={() =>
                      window.confirm('Confirm delete?') &&
                      storedFilters.deleteFilter(filter.name)
                    }
                    icon={faTrashCan}
                  ></FontAwesomeIcon>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </SideBarSection>
  );
});
