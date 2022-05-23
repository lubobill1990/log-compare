import "./App.css";
import { useLogContext } from "./GlobalLogProvider";
import { GlobalFilter } from "./GlobalFilter";
import { LogFileContainer } from "./LogFileSection";
import { useFileDropzone } from "./useFileDropzone";

function App() {
  const { logFiles } = useLogContext();
  const dropRef = useFileDropzone();

  return (
    <div className="App" ref={dropRef}>
      <div className="vertical-compare-zone">
        {logFiles.size === 0 && (
          <div className="dropzone-hint">
            <div>Drop log files here</div>
            <div className="ensure-hint">
              To compare log files with timestamp locally, safely, and
              efficiently.
              <br />
              Multiple tabs comparing supported.
            </div>
          </div>
        )}
        {Array.from(logFiles.keys()).map((key) => {
          const logFile = logFiles.get(key);
          return (
            logFile && (
              <LogFileContainer key={key} file={logFile}></LogFileContainer>
            )
          );
        })}
      </div>
      <GlobalFilter></GlobalFilter>
    </div>
  );
}

export default App;
