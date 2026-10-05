// Turns an axios error into a message a person can act on.
// The backend replies with { error: "..." } (see GlobalExceptionHandler).
export function apiError(err, fallback = 'Something went wrong. Try again.') {
  if (!err?.response) {
    return err?.code === 'ECONNABORTED'
      ? 'The server took too long to answer. Try again.'
      : "Can't reach the server. Check your connection and try again.";
  }
  const data = err.response.data || {};
  if (err.response.status === 429) return 'Too many attempts. Wait a minute and try again.';
  return data.error || data.message || fallback;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
