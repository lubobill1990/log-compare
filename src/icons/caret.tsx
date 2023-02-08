export const Caret = (props: {
  direction: 'right' | 'down';
  className?: string;
}) => {
  return (
    <svg
      width="18"
      height="12"
      viewBox="0 0 18 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      style={{
        transform: `rotate(${props.direction === 'right' ? -90 : 0}deg)`,
      }}
    >
      <path
        d="M1.47147 1.39643L9.24965 9.88171L17.0278 1.39643"
        stroke="black"
        strokeWidth="2"
      />
    </svg>
  );
};
