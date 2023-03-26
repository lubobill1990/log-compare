import { makeAutoObservable } from 'mobx';

export class SideBarSectionStore {
  openedSections = new Map<string, boolean>();

  constructor() {
    makeAutoObservable(this);
  }

  toggleSection(id: string) {
    if (this.isOpened(id)) {
      this.closeSection(id);
    } else {
      this.openSection(id);
    }
  }

  openSection(id: string) {
    this.openedSections.set(id, true);
  }

  closeSection(id: string) {
    this.openedSections.set(id, false);
  }

  isOpened(id: string) {
    return this.openedSections.get(id) ?? false;
  }
}
