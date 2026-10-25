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
