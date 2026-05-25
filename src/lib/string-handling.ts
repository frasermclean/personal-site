export function nameToInitials(name: string): string {
  const names = name.trim().split(' ');

  if (names.length >= 2) {
    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  return names[0].charAt(0).toUpperCase();
}
