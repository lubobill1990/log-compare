import ReactModal from 'react-modal';

import { cx } from '@/components/common/cx';

import './index.scss';

export enum ModalSize {
  Medium = 'Medium',
  Small = 'Small',
  Large = 'Large',
}

export function Modal(props: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
}) {
  const { title, isOpen, onClose, className, size } = {
    size: ModalSize.Medium,
    ...props,
  };
  const contentStyle = {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    maxWidth: '100%',
  };
  if (size) {
    contentStyle.maxWidth = {
      [ModalSize.Small]: '480px',
      [ModalSize.Medium]: '640px',
      [ModalSize.Large]: '1080px',
    }[size];
  }
  return (
    <ReactModal
      isOpen={isOpen}
      style={{
        content: contentStyle,
        overlay: {
          backgroundColor: 'rgb(0 0 0 / 78%)',
        },
      }}
      contentLabel={title}
      shouldCloseOnEsc={true}
      shouldCloseOnOverlayClick={true}
      shouldFocusAfterRender={true}
      shouldReturnFocusAfterClose={true}
      portalClassName={cx('modal-portal', className)}
    >
      <h2>{title}</h2>
      {props.children}

      <button className="modal-close" onClick={onClose}>
        ×
      </button>
    </ReactModal>
  );
}

export function ModalActions(props: { children: React.ReactNode }) {
  return <div className="modal-actions">{props.children}</div>;
}
