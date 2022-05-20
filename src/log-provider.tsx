import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "lodash";
export type Line = [string, number];
export type LogFile = {
  id: string;
  name: string;
  lines: Line[];
};

interface ILogContext {
  logFiles: Map<string, LogFile>;
  addLogFile(name: string, content: string): void;
  delLogFile(id: string): void;
  scrollToTimestamp: number;
  setScrollToTimestamp(val: number): void;
  searchKeywords: string;
  setSearchKeywords(keywords: string): void;
  activeLogFileId: string;
  setActiveLogFileId(id: string): void;
}

const defaultValue = {
  logFiles: new Map(),
  addLogFile() {},
  delLogFile() {},
  scrollToTimestamp: 0,
  setScrollToTimestamp(_val: number) {},

  searchKeywords: "",
  setSearchKeywords(_keywords: string) {},

  activeLogFileId: "",
  setActiveLogFileId(_id: string) {},
};

const LogContext = createContext<ILogContext>(defaultValue);

export const useLogContext = () => {
  return useContext(LogContext);
};

export const LogContextProvider: React.FunctionComponent<any> = React.memo(
  ({ children }) => {
    const [logFiles, setLogFiles] = useState(defaultValue.logFiles);
    const [scrollToTimestamp, localSetScrollToTimestamp] = useState(
      defaultValue.scrollToTimestamp
    );
    const [searchKeywords, localSetSearchKeywords] = useState(
      defaultValue.searchKeywords
    );
    const [activeLogFileId, localSetActiveLogFileId] = useState(
      defaultValue.activeLogFileId
    );
    const addLogFile = useCallback(
      (name: string, content: string) => {
        setLogFiles((prev) => {
          const rawLines = content.split("\n");
          let currentTimestamp = Number.MAX_SAFE_INTEGER;
          const lines = rawLines.map((line) => {
            let thisLine = line;
            const timestampEndIndex = line.indexOf(" ");
            const date = new Date(line.slice(0, timestampEndIndex));
            let timestamp = date.getTime();

            if (!timestamp) {
              timestamp = currentTimestamp;
            } else {
              currentTimestamp = timestamp;

              thisLine = `${date.getHours().toString().padStart(2, "0")}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}:${date
                .getSeconds()
                .toString()
                .padStart(2, "0")}.${date
                .getMilliseconds()
                .toString()
                .padStart(3, "0")} - ${line.slice(timestampEndIndex)}`;
            }
            return [thisLine, timestamp];
          });
          const id = uuidv4();
          return new Map(prev).set(id, {
            lines,
            name,
            id,
          });
        });
      },
      [setLogFiles]
    );

    const delLogFile = useCallback(
      (id: string) => {
        setLogFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      },
      [setLogFiles]
    );

    const [worker, setWorker] = useState<SharedWorker>();

    useEffect(() => {
      if (typeof SharedWorker !== "undefined") {
        const worker = new SharedWorker("/shared-worker.js");
        setWorker(worker);
      }
    }, [setWorker]);

    const debounceSetActiveLogFileId = useMemo(
      () => debounce(localSetActiveLogFileId, 100),
      [localSetActiveLogFileId]
    );
    const debounceSetSearchKeywords = useMemo(
      () => debounce(localSetSearchKeywords, 100),
      [localSetSearchKeywords]
    );
    const debounceSetScrollToTimestamp = useMemo(
      () => debounce(localSetScrollToTimestamp, 100),
      [localSetScrollToTimestamp]
    );
    useEffect(() => {
      return () => {
        debounceSetActiveLogFileId.cancel();
        debounceSetSearchKeywords.cancel();
        debounceSetScrollToTimestamp.cancel();
      };
    }, [
      debounceSetActiveLogFileId,
      debounceSetSearchKeywords,
      debounceSetScrollToTimestamp,
    ]);
    const messageHandler = useCallback(
      (e: MessageEvent) => {
        const data = e.data as any;
        if (data.type === "activeLogFileId") {
          debounceSetActiveLogFileId(data.value);
        } else if (data.type === "searchKeywords") {
          debounceSetSearchKeywords(data.value);
        } else if (data.type === "scrollToTimestamp") {
          debounceSetScrollToTimestamp(data.value);
        }
      },
      [
        debounceSetActiveLogFileId,
        debounceSetSearchKeywords,
        debounceSetScrollToTimestamp,
      ]
    );

    useEffect(() => {
      if (worker) {
        worker.port.addEventListener("message", messageHandler);
        worker.port.start();
        return () => {
          worker.port.removeEventListener("message", messageHandler);
        };
      }
      return () => {};
    }, [worker, messageHandler]);

    const postMessage = useCallback(
      (message: any) => {
        if (worker) {
          worker.port.postMessage(message);
        }
      },
      [worker]
    );
    const setActiveLogFileId = useCallback(
      (value: string) => {
        postMessage({
          type: "activeLogFileId",
          value,
        });
        localSetActiveLogFileId(value);
      },
      [localSetActiveLogFileId, postMessage]
    );

    const setScrollToTimestamp = useCallback(
      (value: number) => {
        postMessage({
          type: "scrollToTimestamp",
          value,
        });
        localSetScrollToTimestamp(value);
      },
      [postMessage, localSetScrollToTimestamp]
    );

    const setSearchKeywords = useCallback(
      (value: string) => {
        postMessage({
          type: "searchKeywords",
          value,
        });
        localSetSearchKeywords(value);
      },
      [postMessage, localSetSearchKeywords]
    );

    const value = {
      delLogFile,
      logFiles,
      addLogFile,
      scrollToTimestamp,
      setScrollToTimestamp,
      searchKeywords,
      setSearchKeywords,
      activeLogFileId,
      setActiveLogFileId,
    };

    return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
  }
);

LogContextProvider.displayName = "LogContextProvider";
