import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { InputField } from '@/components/common/form';
import { Modal, ModalActions, ModalSize } from '@/components/widget/modal';

export const ShareLinkModal = observer(
  (props: {
    filterShareLink: string;
    setFilterShareLink: (link: string) => void;
  }) => {
    const { filterShareLink, setFilterShareLink } = props;
    const [copied, setCopied] = useState<boolean>(false);

    useEffect(() => {
      setCopied(false);
    }, [filterShareLink, setCopied]);
    return (
      <Modal
        title="Share this filter"
        isOpen={!!filterShareLink}
        onClose={() => setFilterShareLink('')}
        size={ModalSize.Small}
      >
        <InputField
          label="Filter sharing URL"
          value={filterShareLink}
          inputStyle={{ width: '100%' }}
        ></InputField>
        <ModalActions>
          <CopyToClipboard
            text={filterShareLink}
            onCopy={() => setCopied(true)}
          >
            <button>Copy link to clipboard</button>
          </CopyToClipboard>
          {copied && (
            <span style={{ color: 'green', marginLeft: '1rem' }}>
              Link copied to clipboard.
            </span>
          )}
        </ModalActions>
      </Modal>
    );
  }
);
