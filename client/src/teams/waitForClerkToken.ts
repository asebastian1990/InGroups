/** Clerk session can lag behind setActive in the Teams iframe. */
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
