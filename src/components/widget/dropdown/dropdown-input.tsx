import React from 'react';

import { cx } from '@/components/common/cx';

import { Dropdown, DropdownContent, DropdownTrigger } from '.';

type Option<T> = { label: string; value: T };
export function DropdownInput<T = any>(props: {
  options: Option<T>[];
  onChange: (option: Option<T>) => void;
  value?: T;
  placeholder: string;
  className?: string;
  contentClassName?: string;
  labelClassName?: string;
  optionClassName?: string;
}) {
  const {
    options,
    onChange,
    value,
    placeholder,
    className,
    labelClassName,
    contentClassName,
    optionClassName,
  } = props;

  const matchedOption = options.find((option) => option.value === value);
  const selectedLabel = (matchedOption?.label ?? ' ') || placeholder;
  return (
    <Dropdown className={cx(className)}>
      <DropdownTrigger className={cx(labelClassName)}>
        {selectedLabel}
      </DropdownTrigger>
      <DropdownContent className={cx(contentClassName)}>
        {options.map((option) => (
          <div
            className={cx(optionClassName)}
            onClick={() => onChange(option)}
            key={option.label}
          >
            {option.label}
          </div>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
