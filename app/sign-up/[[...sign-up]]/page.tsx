import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Renata account and start writing your tailored, ATS-friendly CV with AI in minutes.",
};

export default function SignUpPage() {
  redirect("/sign-in");
}
