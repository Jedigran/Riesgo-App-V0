import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'ghost' | 'pill' | 'open-all';
  /** Button href (if used as link) */
  href?: string;
  /** Icon to display before label */
  icon?: React.ReactNode;
  /** Button label */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button - KNAR styled button component
 * 
 * Features:
 * - Delicate sizing (11px text, compact padding)
 * - Light font weight (300)
 * - 0.5px thin borders
 * - 4px border radius (md)
 * - Subtle hover transitions
 * - Multiple variants: primary, ghost, pill, open-all
 */
export function Button({
  variant = 'ghost',
  href,
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'knar-btn';
  const variantClasses = {
    primary: 'knar-btn-primary',
    ghost: 'knar-btn-ghost',
    pill: 'knar-btn-pill',
    'open-all': 'knar-btn-open-all',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  // If href is provided, render as anchor
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {icon && <span className="btn-icon">{icon}</span>}
        {children && <span className="btn-label">{children}</span>}
      </a>
    );
  }

  // Otherwise render as button
  return (
    <button className={classes} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children && <span className="btn-label">{children}</span>}
    </button>
  );
}

/**
 * ButtonIcon - Helper component for button icons
 * Ensures consistent 12px icon size with 1.5 stroke width
 */
export function ButtonIcon({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export default Button;
