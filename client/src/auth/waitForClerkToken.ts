/** Clerk session can lag behind setActive; getToken may briefly return null in embedded hosts. */
export async function waitForClerkToken(
  getToken: () => Promise<string | null>,
  attempts = 25,
  delayMs = 200,
): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const token = await getToken();
      if (token) return token;
    } catch {
      // Retry until session is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
}
