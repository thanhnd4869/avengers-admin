import { Link } from "react-router";

import Icon from "@components/Icon";

/** The title block every page opens with; `actions` sit on the right. */
export function PageHeading({ eyebrow, title, description, actions, titleClassName = "" }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className={titleClassName}>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="heading-actions">{actions}</div> : null}
    </div>
  );
}

export function RefreshButton({ onClick, disabled }) {
  return (
    <button className="secondary-button" type="button" onClick={onClick} disabled={disabled}>
      <Icon name="refresh" size={12} /> Refresh
    </button>
  );
}

export function BackLink({ to, children }) {
  return (
    <Link className="back-link" to={to}>
      <Icon name="back" size={11} /> {children}
    </Link>
  );
}

export function PanelHeading({ eyebrow, title, children }) {
  return (
    <div className="panel-heading">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/** A "View all" style link with the shared trailing arrow. */
export function ArrowLink({ to, children }) {
  return (
    <Link className="arrow-link" to={to}>
      {children} <Icon name="forward" size={11} />
    </Link>
  );
}

export function StatCard({ icon, tone = "red", label, value, hint, to }) {
  const body = (
    <>
      <span className={`stat-icon ${tone}`}>
        <Icon name={icon} size={15} />
      </span>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </>
  );

  return to ? (
    <Link className="stat-card stat-card-link" to={to}>
      {body}
    </Link>
  ) : (
    <article className="stat-card">{body}</article>
  );
}

const NOTICE_ICONS = { error: "error", warning: "warning", success: "success" };

/** Inline result of an action or a heads-up, optionally dismissible. */
export function Notice({ tone = "error", children, onClose, className = "" }) {
  if (!children) return null;

  return (
    <div
      className={`notice notice-${tone} ${className}`.trim()}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon name={NOTICE_ICONS[tone]} size={13} />
      <span className="notice-text">{children}</span>
      {onClose ? (
        <button type="button" className="icon-button" onClick={onClose} title="Dismiss">
          <Icon name="close" size={12} />
          <span className="visually-hidden">Dismiss</span>
        </button>
      ) : null}
    </div>
  );
}
