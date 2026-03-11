import React from 'react';

interface CardProps {
  /** Icon to display in the card header (Lucide-style SVG) */
  icon?: React.ReactNode;
  /** Category label above the title (eyebrow) */
  eyebrow?: string;
  /** Card title (uses serif font) */
  title?: string;
  /** Card content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Show hover effect with orange accent bar */
  hoverEffect?: boolean;
}

/**
 * Card - KNAR styled card component
 * 
 * Features:
 * - Gradient dark background
 * - 0.5px thin border
 * - 6px border radius
 * - Orange accent bar appears at top on hover
 * - Icon box with orange gradient background
 * - Serif font for titles
 * - Compact spacing
 */
export function Card({
  icon,
  eyebrow,
  title,
  children,
  className = '',
  hoverEffect = true,
}: CardProps) {
  return (
    <div className={`knar-card ${className}`}>
      {/* Header Section */}
      {(icon || eyebrow || title) && (
        <div className="knar-card-header">
          {/* Icon Box */}
          {icon && (
            <div className="knar-icon-box">
              {icon}
            </div>
          )}

          {/* Header Text */}
          {(eyebrow || title) && (
            <div className="knar-card-header-text">
              {/* Category Eyebrow */}
              {eyebrow && (
                <div className="knar-eyebrow">{eyebrow}</div>
              )}
              
              {/* Title */}
              {title && (
                <h3 className="knar-card-title">{title}</h3>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      {children && (
        <div className="knar-card-content">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * CardIcon - Helper component for card icons
 * Ensures consistent icon sizing and styling
 */
export function CardIcon({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`knar-icon-box ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardTitle - Helper component for card titles
 * Uses serif font (Playfair Display)
 */
export function CardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`knar-card-title ${className}`}>
      {children}
    </h3>
  );
}

export default Card;
