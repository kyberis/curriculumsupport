// Temporary auth stub — returns a fixed user ID while Clerk is not configured.
// Replace with real Clerk auth() once credentials are added.
const ANONYMOUS_USER_ID = "anonymous";

export function getUserId(): string {
  return ANONYMOUS_USER_ID;
}
