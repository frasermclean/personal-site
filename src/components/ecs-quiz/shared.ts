export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const panelClass = 'bg-card text-card-foreground ring-border flex flex-col gap-4 rounded-xl p-6 ring-1';

/**
 * Format a duration as minutes and seconds, e.g. 125000 => "2:05".
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// The theme's success/error tokens are background colours, so use readable text shades in both themes
export const correctTextClass = 'text-green-700 dark:text-green-400';
export const incorrectTextClass = 'text-red-700 dark:text-red-400';

/**
 * Footer strip for a panel's action buttons, bleeding to the panel's edges (offsets its p-6 padding).
 * Uses a faint foreground tint rather than the theme's card-footer colour, which is darker than the card.
 * Buttons sit on the right; put secondary buttons first with `secondaryActionClass` to push them to the left.
 */
export const panelFooterClass =
  'bg-foreground/5 -mx-6 -mb-6 mt-2 flex flex-wrap items-center justify-end gap-2 rounded-b-xl border-t px-6 py-4';

export const secondaryActionClass = 'mr-auto';
