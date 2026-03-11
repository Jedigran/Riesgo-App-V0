import React, { useState } from 'react';

interface Tab {
  /** Tab identifier */
  id: string;
  /** Tab label */
  label: string;
  /** Tab content */
  content: React.ReactNode;
}

interface TabsProps {
  /** Array of tabs */
  tabs: Tab[];
  /** Default active tab ID */
  defaultTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tabs - KNAR styled tab navigation
 * 
 * Features:
 * - Minimal tab navigation
 * - 13px text, weight 300 (400 when active)
 * - 1.5px orange underline for active tab
 * - Subtle fade-in animation for tab content
 */
export function Tabs({ tabs, defaultTab, onTabChange, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={className}>
      {/* Tab Bar */}
      <div className="knar-tabs-bar">
        <ul className="knar-tabs-list">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                className={`knar-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Panels */}
      <div className="tab-panels">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`knar-tab-panel ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tabs;
