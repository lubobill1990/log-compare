import "./App.css";
import { useLogContext } from "./GlobalLogProvider";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";

export function useFileDropzone() {
  const { addLogFile } = useLogContext();

  const [, dropRef] = useDrop(
    () => ({
      accept: [NativeTypes.FILE, NativeTypes.URL],
      drop(item, _monitor) {
        const files = (item as any).files as File[];
        if (files) {
          files.forEach((file) => {
            const reader = new FileReader();
            // dropRef.current.getBoundingClientRect()
            reader.onabort = () => console.log("file reading was aborted");
            reader.onerror = () => console.log("file reading has failed");
            reader.onload = () => {
              if (reader.result) {
                addLogFile(file.name, reader.result as string);
              }
            };
            reader.readAsText(file);
          });
        }
        return undefined;
      },
      hover(_item, _monitor) {},
      canDrop(_item: any) {
        return true;
      },
      collect: (monitor: DropTargetMonitor) => {
        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        };
      },
    }),
    [addLogFile]
  );
  return dropRef;
}
