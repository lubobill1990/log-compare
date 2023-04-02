import { observer } from 'mobx-react-lite';
import ReactModal from 'react-modal';

import { GlobalFilterRenderer } from '@/components/filter';

import './app.scss';
import { LogPanel } from './components/log-panel/log-panel';
import { ContextMenus } from './components/widget/context-menu';
import { FileExplorerRegister } from './file-explorer';
import { AppLayout, LayoutSlot } from './layout';
import { SlotName } from './mobx/layout-store';
import { SearchPanelRegister } from './search-panel';

ReactModal.setAppElement('#root');

const App = observer(() => {
  return (
    <>
      <LayoutSlot slotId={SlotName.searchBar}>
        <GlobalFilterRenderer></GlobalFilterRenderer>
      </LayoutSlot>
      <LayoutSlot slotId={SlotName.logPanel}>
        <LogPanel></LogPanel>
      </LayoutSlot>
      <FileExplorerRegister></FileExplorerRegister>
      <SearchPanelRegister></SearchPanelRegister>
      <AppLayout></AppLayout>
      <ContextMenus></ContextMenus>
    </>
  );
});

App.displayName = 'App';

export default App;
