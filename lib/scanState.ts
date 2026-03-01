// Simple module-level state to pass the uploaded image URL from
// scan.tsx to result.tsx without serializing through URL params.

let pendingImageUrl: string | null = null;

export function setPendingImageUrl(url: string) {
  pendingImageUrl = url;
}

export function getPendingImageUrl(): string | null {
  return pendingImageUrl;
}

export function clearPendingImageUrl() {
  pendingImageUrl = null;
}
