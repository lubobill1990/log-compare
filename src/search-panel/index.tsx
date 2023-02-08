import { observer } from 'mobx-react-lite';

import { Find } from '@/icons/find';
import {
  ActivityBarEntry,
  ActivityBarSlot,
  SideBarGeneratorSlot,
} from '@/layout';

const EntryName = 'search-panel';

export const Entry = observer(() => {
  return (
    <ActivityBarEntry id={EntryName}>
      <Find></Find>
    </ActivityBarEntry>
  );
});

export const SideBarContent = observer(() => {
  return <div>Search</div>;
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
