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
    const patterns = this.filterStringArray
      .map((search) =>
        search
          .split('&&')
          .map((v) => v.trim())
          .filter((v) => v)
          .map((s) => {
            if (s.startsWith('/') && s.endsWith('/')) {
              const regexPattern = s.slice(1, -1);
              if (regexPattern === '') {
                return '';
              }
              try {
                return new RegExp(regexPattern, 'gd');
              } catch (e) {
                return '';
              }
            } else {
              return s.toLowerCase();
            }
          })
          .filter((v) => v)
      )
      .flat();
    return (content: string, lowerCaseContent: string) => {
      const matches: MatchIndices[] = [];
      if (patterns.length > 0) {
        patterns.forEach((pattern, patternIndex) => {
          if (typeof pattern === 'string') {
            let index = lowerCaseContent.indexOf(pattern);
            while (index >= 0) {
              matches.push([index, index + pattern.length, patternIndex]);
              index = lowerCaseContent.indexOf(pattern, index + 1);
            }
          } else {
            [...content.matchAll(pattern)].forEach((match) => {
              matches.push([
                (match as any).indices[0][0],
                (match as any).indices[0][1],
                patternIndex,
              ]);
            });
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
