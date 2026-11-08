/** Label, control and the API's message for this field, laid out the same everywhere. */
export default function FormField({ id, label, hint, error, children, className = "" }) {
  return (
    <div className={`form-field ${error ? "has-error" : ""} ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <div className="field-error" id={`${id}-error`}>
          {error}
        </div>
      ) : hint ? (
        <div className="field-hint">{hint}</div>
      ) : null}
    </div>
  );
}

/** `{ field: message }` from an API error, for showing next to inputs. */
export function fieldErrors(error) {
  return Object.fromEntries(
    (error?.details ?? [])
      .filter((detail) => detail.field && detail.message)
      .map((detail) => [detail.field, detail.message]),
  );
}
