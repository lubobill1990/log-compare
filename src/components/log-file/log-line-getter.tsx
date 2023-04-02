import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { LogLine } from '@/interface';
import { LogFile } from '@/mobx/log-file';

export const LogLineGetter = observer(
  (props: {
    file: LogFile;
    index: number;
    children: (line: LogLine, isPinedLine: boolean) => React.ReactNode;
  }) => {
    const { index, file, children } = props;
    const line = file.filteredLines[index];
    const isPinedLine = line && file.pinedLines.has(line.lineNumber);
    useEffect(() => {
      file.fetchFilteredLine(index);
    }, [index, file.fetchFilteredLine]);

    return <>{line && children(line, isPinedLine)}</>;
  }
);
