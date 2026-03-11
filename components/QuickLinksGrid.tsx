import React from 'react';

interface QuickLink {
  /** Link href */
  href: string;
  /** Link label */
  label: string;
  /** Icon (Lucide-style SVG) */
  icon?: React.ReactNode;
}

interface QuickLinksGridProps {
  /** Array of links to display */
  links: QuickLink[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * QuickLinksGrid - KNAR styled quick links grid
 * 
 * Features:
 * - Dense grid layout (auto-fill, minmax 100px)
 * - 12px text, weight 300
 * - 0.5px thin borders
 * - 3px border radius
 * - Orange accent on hover
 * - Subtle icon scale animation
 */
export function QuickLinksGrid({ links, className = '' }: QuickLinksGridProps) {
  return (
    <div className={`knar-links-grid ${className}`}>
      {links.map((link, index) => (
        <QuickLinkItem key={index} {...link} />
      ))}
    </div>
  );
}

/**
 * QuickLinkItem - Individual link item
 */
function QuickLinkItem({ href, label, icon }: QuickLink) {
  return (
    <a href={href} className="knar-link">
      {/* Icon */}
      {icon && (
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
          className="knar-link-icon"
        >
          {icon}
        </svg>
      )}
      
      {/* Label */}
      <span className="knar-link-label">{label}</span>
    </a>
  );
}

/**
 * HeaderIconLink - Inline icon link for card headers
 * (e.g., folder link in group header)
 */
export function HeaderIconLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon?: React.ReactNode;
  label?: string;
}) {
  return (
    <a href={href} className="knar-header-icon-link" title={label}>
      {icon || (
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
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </a>
  );
}

export default QuickLinksGrid;
