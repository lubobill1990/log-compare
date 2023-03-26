import { observer } from 'mobx-react-lite';

import { Find } from '@/icons/find';
import {
  ActivityBarEntry,
  ActivityBarSlot,
  SideBarBody,
  SideBarGeneratorSlot,
  SideBarTitle,
} from '@/layout';

import { SavedFilterList } from './saved-filters';

const EntryName = 'search-panel';

export const Entry = observer(() => {
  return (
    <ActivityBarEntry id={EntryName}>
      <Find></Find>
    </ActivityBarEntry>
  );
});

const SideBarContent = observer(() => {
  return (
    <div>
      <SideBarTitle title="Search"></SideBarTitle>
      <SideBarBody>
        <SavedFilterList></SavedFilterList>
      </SideBarBody>
    </div>
  );
});

export const SearchPanelRegister = observer(() => {
  return (
    <>
      <ActivityBarSlot slotId={EntryName}>
        <Entry></Entry>
      </ActivityBarSlot>

      <SideBarGeneratorSlot slotId={EntryName}>
        {() => <SideBarContent></SideBarContent>}
      </SideBarGeneratorSlot>
    </>
  );
});
