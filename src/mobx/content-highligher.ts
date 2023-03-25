import { MinHeap } from '@datastructures-js/heap';
import { IGetCompareValue } from '@datastructures-js/heap/src/maxHeap';

import { makeAutoObservable } from 'mobx';

type HighlightTag = {
  position: number;
  tag: string;
};

const getHighlightTagPosition: IGetCompareValue<HighlightTag> = (
  a: HighlightTag
) => a.position;

type MatchIndices = [number, number, number];
export class ContentHighlighter {
  constructor(public filterStrings: string[] = []) {
    makeAutoObservable(this);
  }

  setFilterStrings(filterStrings: string[]) {
    this.filterStrings = filterStrings;
  }

  get filterStringArray() {
    return this.filterStrings.map((v) => v.trim()).filter((v) => v);
  }

  get highlightMarker() {
    const patterns: { isRegex: boolean; pattern: string }[] = [];
    this.filterStringArray.forEach((search) => {
      if (search.startsWith('/') && search.endsWith('/')) {
        const searches = search
          .slice(1, -1)
          .split('&&')
          .map((v) => v.trim())
          .filter((v) => v);

        if (searches.length === 0) {
          return;
        }

        patterns.push(...searches.map((v) => ({ isRegex: true, pattern: v })));
      } else {
        const andMatches = search
          .toLowerCase()
          .split('&&')
          .map((v) => v.trim())
          .filter((v) => v);

        if (andMatches.length === 0) {
          return;
        }

        patterns.push(
          ...andMatches.map((v) => ({ isRegex: false, pattern: v }))
        );
      }
    }, [] as ((content: string, _lowerCaseContent: string) => MatchIndices[])[]);

    return (content: string, lowerCaseContent: string) => {
      const matches: MatchIndices[] = [];
      if (patterns.length > 0) {
        patterns.forEach((pattern, keywordIndex) => {
          if (pattern.isRegex) {
            try {
              const regex = new RegExp(pattern.pattern, 'gd');
              [...content.matchAll(regex)].forEach((match) => {
                matches.push([
                  (match as any).indices[0][0],
                  (match as any).indices[0][1],
                  keywordIndex,
                ]);
              });
            } catch (_e) {
              // ignore
            }
          } else {
            const keyword = pattern.pattern;
            let index = lowerCaseContent.indexOf(keyword);
            while (index >= 0) {
              matches.push([index, index + keyword.length, keywordIndex]);
              index = lowerCaseContent.indexOf(keyword, index + 1);
            }
          }
        });
      }

      return matches;
    };
  }

  get highlightContent() {
    const marker = this.highlightMarker;
    return (content: string) => {
      const lowerCaseContent = content.toLowerCase();
      const matches = marker(content, lowerCaseContent);
      if (matches.length === 0) {
        return content;
      }
      const highlightTagHeap = MinHeap.heapify(
        matches.reduce((accu, [startIndex, endIndex, patternIndex]) => {
          accu.push({
            position: startIndex,
            tag: `<b class="c${(patternIndex % 18) + 1}">`,
          });
          accu.push({
            position: endIndex,
            tag: `</b>`,
          });
          return accu;
        }, [] as HighlightTag[]),
        getHighlightTagPosition
      );

      const result = [];

      let lastPosition = 0;
      while (highlightTagHeap.size() > 0) {
        const { position, tag } = highlightTagHeap.pop();
        result.push(content.slice(lastPosition, position));
        result.push(tag);
        lastPosition = position;
      }

      result.push(content.slice(lastPosition));

      return result.join('');
    };
  }
}
