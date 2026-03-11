import React from 'react';

interface HeroSectionProps {
  /** Eyebrow label above title */
  eyebrow?: string;
  /** Main heading (uses serif font) */
  title?: string;
  /** Subtitle/description text */
  description?: string;
  /** Action buttons or content */
  actions?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * HeroSection - KNAR styled hero section
 * 
 * Features:
 * - Category eyebrow label (9px, uppercase, orange)
 * - Serif title (Playfair Display)
 * - Sans-serif description
 * - Compact spacing
 * - Optional action buttons
 */
export function HeroSection({
  eyebrow,
  title,
  description,
  actions,
  className = '',
}: HeroSectionProps) {
  return (
    <section className={`knar-hero ${className}`}>
      <div className="knar-container-narrow">
        {/* Eyebrow Label */}
        {eyebrow && (
          <div className="knar-eyebrow">{eyebrow}</div>
        )}

        {/* Title */}
        {title && (
          <h1 className="knar-hero-title">{title}</h1>
        )}

        {/* Description */}
        {description && (
          <p className="knar-hero-description">{description}</p>
        )}

        {/* Actions */}
        {actions && (
          <div className="knar-hero-actions">{actions}</div>
        )}
      </div>
    </section>
  );
}

export default HeroSection;
