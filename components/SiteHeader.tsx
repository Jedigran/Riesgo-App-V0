import React from 'react';

interface SiteHeaderProps {
  logoSrc?: string;
  logoAlt?: string;
  actionHref?: string;
  actionLabel?: string;
  showAction?: boolean;
}

/**
 * SiteHeader - KNAR styled header component
 * 
 * Features:
 * - Dark background matching KNAR theme
 * - Logo on the left (48px height)
 * - Optional action button on the right
 * - Thin border separator at bottom
 */
export function SiteHeader({
  logoSrc = '/logo.svg',
  logoAlt = 'Logo',
  actionHref = '#',
  actionLabel = 'Action',
  showAction = true,
}: SiteHeaderProps) {
  return (
    <header className="knar-header">
      {/* Logo */}
      <img
        src={logoSrc}
        alt={logoAlt}
        className="knar-logo"
      />

      {/* Action Button */}
      {showAction && (
        <a
          href={actionHref}
          className="knar-header-action"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span>{actionLabel}</span>
        </a>
      )}
    </header>
  );
}

export default SiteHeader;
