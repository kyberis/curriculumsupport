import { auth } from "@/lib/auth-config";
import { ChatShell } from "@/components/chat/chat-shell";
import { GoogleSignInSidebar } from "@/components/auth/google-sign-in-sidebar";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user?.id
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : null;

  return (
    <ChatShell user={user} sidebarGoogleSignIn={<GoogleSignInSidebar />}>
      {children}
    </ChatShell>
  );
}
