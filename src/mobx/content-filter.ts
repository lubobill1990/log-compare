import { makeAutoObservable } from 'mobx';

const falseFunction = () => false;

export class ContentFilter {
  constructor(public filterStrings: string[] = []) {
    makeAutoObservable(this);
  }

  setFilterStrings(filterStrings: string[]) {
    this.filterStrings = filterStrings;
  }

  get filterStringArray() {
    return this.filterStrings.map((v) => v.trim()).filter((v) => v);
  }

  get lineFilter() {
    const orMatchers = this.filterStringArray
      .map((search) => {
        if (search.startsWith('/') && search.endsWith('/')) {
          const searches = search
            .slice(1, -1)
            .split('&&')
            .map((v) => v.trim())
            .filter((v) => v)
            .map((s) => new RegExp(s));
          if (searches.length === 0) {
            return falseFunction;
          }
          return (content: string) =>
            searches.every((reg) => content.search(reg) > -1);
        }

        const andMatches = search
          .toLowerCase()
          .split('&&')
          .map((v) => v.trim())
          .filter((v) => v);

        if (andMatches.length === 0) {
          return falseFunction;
        }
        return (content: string, lowerCaseContent: string) => {
          const lowerLine = content.toLowerCase();
          return andMatches.every((keyword) => lowerLine.indexOf(keyword) >= 0);
        };
      })
      .filter((v) => v !== falseFunction);

    return (content: string) => {
      if (orMatchers.length === 0) {
        return true;
      }
      const lowerCaseContent = content.toLowerCase();
      return orMatchers.some((orMatcher) =>
        orMatcher(content, lowerCaseContent)
      );
    };
  }
}
