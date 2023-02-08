import React from 'react';

import { cx } from '@/components/common/cx';

import classes from './button.module.scss';

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cx(props.className)}>
      {props.children}
    </button>
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <Button {...props} className={cx(classes.primary, props.className)}>
      {props.children}
    </Button>
  );
}

export function SecondaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <Button {...props} className={cx(classes.secondary, props.className)}>
      {props.children}
    </Button>
  );
}
