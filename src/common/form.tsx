import { uniqueId } from 'lodash';

import { cx } from './cx';

export function Field(props: {
  label: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
}) {
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
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cx('field-input', inputClassName)}
        style={props.inputStyle}
      />
    </div>
  );
}
