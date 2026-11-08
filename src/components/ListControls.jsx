import { useEffect, useState } from "react";

import Icon from "@components/Icon";

export function FilterTabs({ items, value, onChange, label }) {
  return (
    <div className="filter-tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          key={item.value || "all"}
          className={`filter-tab${value === item.value ? " selected" : ""}`}
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Applies the search after typing pauses, so each key press is not a request. */
export function SearchBox({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (draft === value) return undefined;
    const timer = setTimeout(() => onChange(draft.trim()), 350);
    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <label className="search-box">
      <Icon name="search" size={12} />
      <input
        type="search"
        value={draft}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
        onChange={(event) => setDraft(event.target.value)}
      />
    </label>
  );
}

export function Pagination({ meta, page, loading, onChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="secondary-button"
        type="button"
        disabled={page <= 1 || loading}
        onClick={() => onChange(page - 1)}
      >
        <Icon name="previous" size={10} /> Previous
      </button>
      <span>
        Page {meta.page} of {meta.totalPages}
      </span>
      <button
        className="secondary-button"
        type="button"
        disabled={page >= meta.totalPages || loading}
        onClick={() => onChange(page + 1)}
      >
        Next <Icon name="next" size={10} />
      </button>
    </div>
  );
}

export function ListState({ loading, error, empty, emptyText }) {
  if (error) {
    return (
      <div className="notice notice-error list-notice" role="alert">
        <Icon name="error" size={13} />
        <span className="notice-text">{error}</span>
      </div>
    );
  }
  if (loading) return <div className="empty-state">Loading…</div>;
  if (empty) return <div className="empty-state">{emptyText}</div>;
  return null;
}

export function StatusPill({ status, labels, className = "" }) {
  return (
    <span className={`status-pill status-${status} ${className}`.trim()}>
      {labels?.[status] ?? status}
    </span>
  );
}
