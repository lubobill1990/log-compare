import React from 'react';
import { useCallback } from 'react';
import './App.css';
import { Line, useLogContext } from './GlobalLogProvider';

import { useSingleLogContext } from './SingleLogProvider';

interface IRowProps {
  index: number;
  style: any;
  data: {
    lines: Line[];
  };
}

function highlightContent(content: string, highlightKeywords: string) {
  const keywords = highlightKeywords
    .split(',')
    .map((v) => v.trim())
    .filter((v) => !!v);
  return keywords.reduce((acc, keyword, currentIndex) => {
    const colorIndex = (currentIndex % 18) + 1;
    return acc.replace(keyword, `<b class="c${colorIndex}">${keyword}</b>`);
  }, content);
}

export const LogLineRow = (props: IRowProps) => {
  const {
    index,
    style,
    data: { lines },
  } = props;
  const {
    highlightKeywords,
    setSelectedLine,
    selectedLine,
    targetTime,
    setTargetTime,
  } = useSingleLogContext();
  const { highlightKeywords: globalHighlightKeywords } = useLogContext();
  const { setScrollToTimestamp } = useLogContext();
  const content = lines[index][0];
  const time = lines[index][1];
  const lineNumber = lines[index][2];
  const onClick = useCallback(() => {
    setScrollToTimestamp(time);
    setTargetTime(time);
    setSelectedLine(lineNumber);
  }, [time, lineNumber, setScrollToTimestamp, setTargetTime, setSelectedLine]);
  return (
    <div
      className={[
        'line',
        index % 2 ? 'odd' : 'even',
        targetTime[0] === time ? 'target' : '',
        targetTime[1] === time ? 'prev-1' : '',
        targetTime[2] === time ? 'prev-2' : '',
        lineNumber === selectedLine ? 'selected' : '',
      ].join(' ')}
      key={index}
      style={style}
      onClick={onClick}
    >
      <div className="count">{lineNumber + 1}</div>
      <div
        className="content"
        dangerouslySetInnerHTML={{
          __html: highlightContent(
            content,
            [highlightKeywords, globalHighlightKeywords].join(',')
          ),
        }}
      ></div>
    </div>
  );
};
