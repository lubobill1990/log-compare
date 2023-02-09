import { Caret } from './caret';

export const Opened = (props: { opened: boolean }) => {
  return (
    <div
      style={{
        width: '16px',
        height: '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: '4px',
        marginRight: '4px',
      }}
    >
      <Caret direction={props.opened ? 'down' : 'right'}></Caret>
    </div>
  );
};
