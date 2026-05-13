import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

/** Server-only: keep `@/app/actions/auth` out of client bundles (see `ChatShell`). */
export function GoogleSignInSidebar() {
  return (
    <form action={signInWithGoogle} className="space-y-2">
      <input type="hidden" name="redirectTo" value="/" />
      <Button
        type="submit"
        className="h-10 w-full bg-white text-black hover:bg-neutral-200"
      >
        Continue with Google
      </Button>
    </form>
  );
}
