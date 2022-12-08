import React, { useRef } from 'react';

export function FilePicker(props: {
  children: React.ReactNode;
  onFilesPicked: (files: File[]) => void;
  extensions?: string[];
}) {
  const { children, onFilesPicked, extensions } = props;
  const parsedExt = extensions ? extensions.join() : undefined;

  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        style={{ display: 'none' }}
        ref={fileInput}
        type="file"
        accept={parsedExt}
        onChange={(event) => {
          if (event.target.files) {
            onFilesPicked(Array.from(event.target.files));
          }
        }}
      />
      {React.cloneElement(children as React.ReactElement<any>, {
        onClick: () => fileInput.current?.click(),
      })}
    </>
  );
}
