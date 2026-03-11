import React, { useState } from 'react';

interface SearchEngine {
  /** Engine identifier */
  id: string;
  /** Engine name */
  name: string;
  /** Engine icon (SVG) */
  icon: React.ReactNode;
}

interface SearchInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Search engines to display below input */
  engines?: SearchEngine[];
  /** Callback when search is submitted */
  onSearch?: (query: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SearchInput - KNAR styled search input
 * 
 * Features:
 * - White pill-shaped input
 * - Grey placeholder
 * - Search icon 10px from left edge
 * - Engine selector buttons below
 * - No "Search" button (icon-only trigger)
 */
export function SearchInput({
  placeholder = 'Search...',
  engines = [],
  onSearch,
  className = '',
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<string>(engines[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <div className={`knar-search-section ${className}`}>
      <form onSubmit={handleSubmit} className="knar-search-form">
        {/* Search Input Wrapper */}
        <div className="knar-search-wrapper">
          {/* Search Icon */}
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
            className="knar-search-icon"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>

          {/* Input Field */}
          <input
            type="text"
            className="knar-search-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Search Engine Selectors */}
        {engines.length > 0 && (
          <div className="knar-search-engines">
            {engines.map((engine) => (
              <button
                key={engine.id}
                type="button"
                className={`knar-btn knar-btn-pill ${
                  selectedEngine === engine.id ? 'active' : ''
                }`}
                onClick={() => setSelectedEngine(engine.id)}
                title={engine.name}
              >
                {engine.icon}
                <span>{engine.name}</span>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

export default SearchInput;
