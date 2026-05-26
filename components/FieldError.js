/**
 * Inline validation or API error text below a form field.
 */

export default function FieldError({ message, className = "" }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={`text-sm text-destructive ${className}`.trim()}
    >
      {message}
    </p>
  );
}
