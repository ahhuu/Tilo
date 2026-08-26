import React from 'react';

interface TiloLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Tilo Brand Logo Component
 * Seamless monolithic letter T with smooth organic inner fillets and Indigo gradient
 */
export const TiloLogo: React.FC<TiloLogoProps> = ({
  size = 28,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Tilo Logo"
      {...props}
    >
      <defs>
        <linearGradient id="tilo-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="45%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#3730A3" />
        </linearGradient>
      </defs>
      <path
        d="M 12 10
           L 36 10
           A 4 4 0 0 1 36 18
           L 31 18
           Q 28 18 28 21
           L 28 34
           A 4 4 0 0 1 20 34
           L 20 21
           Q 20 18 17 18
           L 12 18
           A 4 4 0 0 1 12 10
           Z"
        fill="url(#tilo-logo-grad)"
      />
    </svg>
  );
};

export default TiloLogo;
