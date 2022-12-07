import cx from "classnames";
import React, {
  cloneElement,
  JSXElementConstructor,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";

import styles from "./dropdown.module.scss";
import DropdownTriangleIcon from "./dropdown-triangle.svg";

interface IDropdownContentProps {
  children: React.ReactNode;
  className?: string;
}
export const DropdownContent = (
  props: IDropdownContentProps & React.HTMLAttributes<HTMLDivElement>
) => {
  const { className, children, ...restProps } = props;
  return (
    <div {...restProps} className={cx(styles.dropdown__content, className)}>
      {children}
    </div>
  );
};

interface IDropdownTriggerProps {
  children: React.ReactNode;
  className?: string;
}
export const DropdownTrigger = (
  props: IDropdownTriggerProps & React.HTMLAttributes<HTMLDivElement>
) => {
  const { className, children, ...restProps } = props;
  return (
    <div {...restProps} className={cx(styles.dropdown__trigger, className)}>
      {children}
      <DropdownTriangleIcon></DropdownTriangleIcon>
    </div>
  );
};

type IDropdownProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement>
> & {
  disabled?: boolean;
};

export const Dropdown = React.memo((props: IDropdownProps) => {
  const { className, children, disabled, ...restProps } = props;
  const [isActive, setIsActive] = useState(false);
  const onWindowClick = useCallback(() => {
    if (isActive) {
      setIsActive(false);
    }
  }, [isActive, setIsActive]);
  const onToggleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setIsActive(!isActive);
    },
    [isActive, setIsActive]
  );
  useEffect(() => {
    window.addEventListener("click", onWindowClick);
    return () => {
      window.removeEventListener("click", onWindowClick);
    };
  }, [onWindowClick]);
  const boundChildren = React.Children.map(
    children as ReactElement[],
    (child: ReactElement) => {
      let res: ReactElement<any, string | JSXElementConstructor<any>> | null = null;
      if (child) {
        if (child.type === DropdownTrigger) {
          const originalOnClick = child.props.onClick;
          res = cloneElement(child, {
            onClick: (event: React.MouseEvent) => {
              onToggleClick(event);
              originalOnClick?.apply(child, [event]);
            },
          });
        } else if (child.type === DropdownContent) {
          if (isActive) {
            res = child;
          }
        }
      }
      return res;
    }
  );
  return (
    <div
      {...restProps}
      className={cx(
        styles.dropdown,
        isActive && styles["dropdown--active"],
        disabled && styles["dropdown--disabled"],
        className
      )}
    >
      {boundChildren}
    </div>
  );
});

Dropdown.displayName = "Dropdown";
