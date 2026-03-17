/**
 * KnarHeader — Standardised application header for the Diplomado / KNAR suite.
 *
 * Props:
 *   title       — main app title (bold, large)
 *   subtitle    — secondary line below title (uppercase, muted)
 *   logoSrc     — URL for the logo image (defaults to Diplomado logo)
 *   logoAlt     — alt text for the logo
 *   contextLeft — optional label shown on the right side (e.g. project name)
 *   contextRight— optional second label on the right (e.g. component)
 *
 * Height is fixed at 56px via CSS variable --knar-header-height.
 * Import this component into any app in the suite to get a consistent header.
 */

import type React from 'react';

const DIPLOMADO_LOGO =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ciDfPIK45LwNn6mBuWqCGasokejVkN.png"

export interface KnarHeaderProps {
  title: string
  subtitle?: string
  logoSrc?: string
  logoAlt?: string
  contextLeft?: string
  contextRight?: string
  /** Optional content rendered on the far right — e.g. tab switcher */
  rightContent?: React.ReactNode
}

export function KnarHeader({
  title,
  subtitle,
  logoSrc = DIPLOMADO_LOGO,
  logoAlt = "Diplomado Gestión de Activos — Cuerpos Técnicos Integrados",
  contextLeft,
  contextRight,
  rightContent,
}: KnarHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
        height: "var(--knar-header-height, 56px)",
        borderBottom: "1px solid #2d3748",
        background: "var(--knar-dark)",
        flexShrink: 0,
      }}
    >
      {/* Left — logo + divider + title */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt={logoAlt}
          style={{ height: 40, width: "auto" }}
        />

        <div style={{
          width: 1,
          height: 36,
          backgroundColor: "#4b5563",
          margin: "0 24px",
          flexShrink: 0,
        }} />

        <div>
          <div style={{
            fontFamily: "var(--font-sans)",
            fontSize: 18,
            fontWeight: 600,
            color: "#e5e7eb",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 400,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 2,
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right — tabs slot or optional project context */}
      {rightContent ? (
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          {rightContent}
        </div>
      ) : (contextLeft || contextRight) ? (
        <div style={{
          display: "flex",
          gap: "var(--space-5)",
          alignItems: "center",
          fontSize: "var(--text-2xs)",
          fontFamily: "var(--font-sans)",
          color: "var(--text-disabled)",
        }}>
          {contextLeft && <span>{contextLeft}</span>}
          {contextLeft && contextRight && (
            <span style={{ color: "var(--border-15)" }}>·</span>
          )}
          {contextRight && <span>{contextRight}</span>}
        </div>
      ) : null}
    </header>
  )
}
