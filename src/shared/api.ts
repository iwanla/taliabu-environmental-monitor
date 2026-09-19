const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "";

export function apiUrl(path: string): string {
  return `${API_ORIGIN}${path}`;
}
