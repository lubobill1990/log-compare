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
export type Line = [string, number, number];
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

  highlightKeywords: string;
  setHighlightKeywords(_keywords: string): void;

  activeLogFileId: string;
  setActiveLogFileId(id: string): void;
}

const defaultValue = {
  logFiles: new Map<string, LogFile>(),
  addLogFile() {},
  delLogFile() {},
  scrollToTimestamp: Number.MAX_SAFE_INTEGER,
  setScrollToTimestamp(_val: number) {},

  searchKeywords: "",
  setSearchKeywords(_keywords: string) {},

  highlightKeywords: "",
  setHighlightKeywords(_keywords: string) {},

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
    const [highlightKeywords, localSetHighlightKeywords] = useState(
      defaultValue.highlightKeywords
    );
    const [activeLogFileId, localSetActiveLogFileId] = useState(
      defaultValue.activeLogFileId
    );
    const addLogFile = useCallback(
      (name: string, content: string) => {
        setLogFiles((prev) => {
          const rawLines = content.split("\n");
          let currentTimestamp = Number.MAX_SAFE_INTEGER;
          const lines = rawLines.map((line, index) => {
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
            return [thisLine, timestamp, index] as Line;
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
    const debounceSetHighlightKeywords = useMemo(
      () => debounce(localSetHighlightKeywords, 100),
      [localSetHighlightKeywords]
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
        debounceSetHighlightKeywords.cancel();
      };
    }, [
      debounceSetActiveLogFileId,
      debounceSetSearchKeywords,
      debounceSetScrollToTimestamp,
      debounceSetHighlightKeywords,
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
        } else if (data.type === "highlightKeywords") {
          debounceSetHighlightKeywords(data.value);
        }
      },
      [
        debounceSetActiveLogFileId,
        debounceSetSearchKeywords,
        debounceSetScrollToTimestamp,
        debounceSetHighlightKeywords,
      ]
    );

    useEffect(() => {
      if (worker) {
        worker.port.addEventListener("message", messageHandler);
        worker.port.start();
        postMessage(
          {
            type: "fetch",
          },
          false
        );
        return () => {
          worker.port.removeEventListener("message", messageHandler);
        };
      }
      return () => {};
    }, [worker, messageHandler]);

    const postMessage = useCallback(
      (message: any, sync: boolean = true) => {
        if (worker) {
          worker.port.postMessage({
            ...message,
            sync,
          });
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
        postMessage(
          {
            type: "searchKeywords",
            value,
          },
          true
        );
        localSetSearchKeywords(value);
      },
      [postMessage, localSetSearchKeywords]
    );

    const setHighlightKeywords = useCallback(
      (value: string) => {
        postMessage({
          type: "highlightKeywords",
          value,
        });
        localSetHighlightKeywords(value);
      },
      [postMessage, localSetHighlightKeywords]
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
      highlightKeywords,
      setHighlightKeywords,
    };

    return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
  }
);

LogContextProvider.displayName = "LogContextProvider";
