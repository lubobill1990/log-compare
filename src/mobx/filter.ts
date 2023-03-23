/* eslint-disable max-classes-per-file */
import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react';

import { StorageProvider } from '@/utils/storage-provider';

export interface IFilter {
  searchKeywords: string;
  highlightText: string;
  name: string;
}

export class Filter implements IFilter {
  constructor(
    public searchKeywords = '',
    public highlightText = '',
    public name = ''
  ) {
    makeAutoObservable(this);
  }

  setSearchKeywords(searchKeywords: string) {
    this.searchKeywords = searchKeywords;
  }

  setHighlightText(highlightText: string) {
    this.highlightText = highlightText;
  }
}

export class StoredFilters {
  storedFilters: IFilter[] = [];

  private storageProvider: StorageProvider;

  constructor() {
    this.storageProvider = new StorageProvider('storedFilters');
    this.storedFilters = this.reloadFilters();
    makeAutoObservable(this);
  }

  private reloadFilters() {
    return this.storageProvider.load<IFilter[]>([]);
  }

  private storeFilters() {
    this.storageProvider.save(this.storedFilters);
  }

  deleteFilter(name: string) {
    this.storedFilters = this.reloadFilters();
    this.storedFilters = this.storedFilters.filter(
      (filter) => filter.name !== name
    );
    this.storeFilters();
    return true;
  }

  saveFilter(filter: IFilter, name: string) {
    this.storedFilters = this.reloadFilters();
    this.storedFilters.push({
      searchKeywords: filter.searchKeywords,
      highlightText: filter.highlightText,
      name,
    });
    this.storeFilters();
    return true;
  }

  exists(filter: IFilter) {
    return this.reloadFilters().some(
      (f) =>
        f.searchKeywords === filter.searchKeywords &&
        f.highlightText === filter.highlightText
    );
  }
}

const storedFiltersStore = new StoredFilters();
const storedFiltersContext = createContext(storedFiltersStore);

export function useStoredFiltersStore() {
  return useContext(storedFiltersContext);
}

export const globalFilterStore = new Filter();
const context = createContext(globalFilterStore);

export function useGlobalFilterStore() {
  return useContext(context);
}
