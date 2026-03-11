'use client';

import React from 'react';
import { SiteHeader, Card, Button, HeroSection } from '@/components';

/**
 * Hello World Page - KNAR Design System Test
 */
export default function Home() {
  return (
    <div className="knar-bg-pattern min-h-screen">
      {/* Header */}
      <SiteHeader
        logoSrc="/logo.svg"
        logoAlt="Riesgo App"
        actionHref="#"
        actionLabel="Action"
        showAction={true}
      />

      {/* Hero Section */}
      <HeroSection
        eyebrow="Hello"
        title="Hello World"
        description="This is a test page using the KNAR Design System. The styles are working correctly."
        actions={
          <div className="knar-flex knar-gap-md" style={{ marginTop: 'var(--space-5)' }}>
            <Button variant="primary" href="#">
              Primary Button
            </Button>
            <Button variant="ghost" href="#">
              Ghost Button
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="knar-container">
        {/* Hello World Card */}
        <section className="knar-mt-lg">
          <Card
            eyebrow="Test"
            title="Hello World Card"
            icon={
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
                <path d="M12 2v20M2 12h20" />
              </svg>
            }
          >
            <p className="knar-text-secondary knar-text-sm">
              Congratulations! The KNAR Design System is working perfectly.
              You can now access the page and see the styles in action.
            </p>
            <div className="knar-flex knar-gap-md knar-mt-sm">
              <Button variant="primary" href="#">
                Get Started
              </Button>
              <Button variant="ghost" href="#">
                Learn More
              </Button>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="knar-footer">
        <div className="knar-container">
          <p className="knar-footer-text">
            © 2026{' '}
            <span className="knar-footer-accent">Riesgo App</span>.
            Built with KNAR Design System.
          </p>
        </div>
      </footer>
    </div>
  );
}
