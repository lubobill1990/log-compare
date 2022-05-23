import React, { useCallback } from "react";
import "./App.css";
import { LogFile, useLogContext } from "./GlobalLogProvider";
import { SingleLogContextProvider } from "./SingleLogProvider";
import { LogFileHeader } from "./LogFileHeader";
import { LogFileLines } from "./LogFileLines";

export const LogFileContainer = React.memo((props: { file: LogFile }) => {
  return (
    <SingleLogContextProvider>
      <LogFileSection file={props.file}></LogFileSection>
    </SingleLogContextProvider>
  );
});
LogFileContainer.displayName = "LogFileContainer";

function LogFileSection(props: { file: LogFile }) {
  const { file } = props;
  const { setActiveLogFileId } = useLogContext();

  const onMouseEnter = useCallback(() => {
    setActiveLogFileId(file.id);
  }, [file.id, setActiveLogFileId]);

  return (
    <div className="file-wrapper" onMouseEnter={onMouseEnter}>
      <LogFileHeader file={file}></LogFileHeader>
      <LogFileLines file={file}></LogFileLines>
    </div>
  );
}
