import { isClerkAPIResponseError } from '@clerk/clerk-react/errors';

export function formatClerkError(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const message = error.errors[0]?.longMessage || error.errors[0]?.message;
    if (message) return message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
