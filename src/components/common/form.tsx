import { debounce, uniqueId } from 'lodash';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { cx } from './cx';

interface IFieldProps {
  label: string;
  onChange?: (value: string) => void;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
}

export function InputField(props: IFieldProps) {
  const {
    label,
    value,
    onChange,
    disabled,
    className,
    inputClassName,
    placeholder,
  } = props;
  const inputId = uniqueId();

  return (
    <div className={cx('field-section', className)}>
      <label htmlFor={inputId}>{label}</label>
      <input
        type="text"
        id={inputId}
        value={value}
        readOnly={!onChange}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onChange?.(e.target.value);
        }}
        disabled={disabled}
        placeholder={placeholder}
        className={cx('field-input', inputClassName)}
        style={props.inputStyle}
      />
    </div>
  );
}

export function DebouncedInputField(props: IFieldProps & { delay?: number }) {
  const { delay = 200, value, onChange: actualOnChange, ...restProps } = props;
  const [innerValue, setInnerValue] = useState(value);

  useEffect(() => {
    if (value !== innerValue) {
      setInnerValue(value);
    }
  }, [value]);

  const throttledOnChange = useCallback(
    debounce(actualOnChange ?? (() => {}), delay),
    [actualOnChange]
  );

  const onChange = useCallback(
    (v: string) => {
      setInnerValue(v);
      throttledOnChange(v);
    },
    [throttledOnChange, setInnerValue]
  );

  return (
    <InputField
      {...restProps}
      value={innerValue}
      onChange={onChange}
    ></InputField>
  );
}
