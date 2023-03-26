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
        const searches = search
          .split('&&')
          .map((v) => v.trim())
          .filter((v) => v)
          .map((s) => {
            if (s.startsWith('/') && s.endsWith('/')) {
              try {
                return new RegExp(s.slice(1, -1));
              } catch (e) {
                return '';
              }
            } else {
              return s;
            }
          })
          .filter((v) => v);
        if (searches.length === 0) {
          return falseFunction;
        }
        return (content: string, lowerCaseContent: string) =>
          searches.every((keyword) => {
            if (typeof keyword === 'string') {
              return lowerCaseContent.indexOf(keyword) >= 0;
            }
            return content.search(keyword) > -1;
          });
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
