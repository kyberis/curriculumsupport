import { signOut } from "@/lib/auth-config";

/** Avoid passing server actions from Server Components into client `ChatShell` props (breaks in client bundle). */
export async function GET() {
  await signOut({ redirectTo: "/" });
}
