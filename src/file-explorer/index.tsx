import { observer } from 'mobx-react-lite';

import { Files } from '@/icons/files';
import {
  ActivityBarEntry,
  ActivityBarSlot,
  SideBarGeneratorSlot,
} from '@/layout';
import { useLayoutStore } from '@/mobx/layout-store';

const EntryName = 'file-explorer';

export const Entry = observer(() => {
  const layoutStore = useLayoutStore();
  return (
    <ActivityBarEntry id={EntryName}>
      <Files></Files>
    </ActivityBarEntry>
  );
});

export const SideBarContent = observer(() => {
  return <div>Files</div>;
});

export const FileExplorerRegister = observer(() => {
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
