export const Eye = ({ color }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_2235_37292)">
        <path
          d="M8 3.49951C3 3.49951 1 7.99951 1 7.99951C1 7.99951 3 12.4995 8 12.4995C13 12.4995 15 7.99951 15 7.99951C15 7.99951 13 3.49951 8 3.49951Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 10.4995C9.38071 10.4995 10.5 9.38022 10.5 7.99951C10.5 6.6188 9.38071 5.49951 8 5.49951C6.61929 5.49951 5.5 6.6188 5.5 7.99951C5.5 9.38022 6.61929 10.4995 8 10.4995Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2235_37292">
          <rect
            width="16"
            height="16"
            fill={color}
            transform="translate(0 -0.000488281)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
