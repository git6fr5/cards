/**
 * Converts a number to a CSS rem string.
 * Returns undefined if the value is 0 or nullish so that inline style props
 * can omit the property entirely rather than setting an explicit "0rem".
 *
 * Used in: KellonBody, KellonButton, KellonHeader, and any component
 * that accepts paddingTop / paddingBottom / gap as numeric rem values.
 */
export const rem = (n?: number): string | undefined =>
  n != null && n !== 0 ? `${n}rem` : undefined;

/* variants ... */