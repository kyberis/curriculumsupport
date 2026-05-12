import {
  FileText,
  MessageSquare,
  PenLine,
  Download,
  History,
  Shield,
} from "lucide-react";

export const siteConfig = {
  name: "Renata",
  tagline: "Your CV, reborn.",
  description:
    "An AI agent that guides you through building a professional, ATS-friendly CV — tailored to the role you want.",
};

export const heroContent = {
  headline: ["Your next role", "starts with a better CV."],
  subheadline:
    "Upload your existing CV or start from scratch. Our AI agent asks the right questions, then writes a polished, ATS-friendly CV you can download as a PDF.",
  cta: "Get started — free",
};

export const demoMessages = [
  {
    role: "user" as const,
    content: "I'm applying for a Senior Product Manager role at a fintech startup.",
  },
  {
    role: "assistant" as const,
    content:
      "Great choice. Do you have a current CV you'd like me to start from? You can upload a PDF, paste a LinkedIn URL, or we can build from scratch.",
  },
  {
    role: "user" as const,
    content: "Here's my LinkedIn export.",
    hasAttachment: true,
    attachmentName: "linkedin-export.pdf",
  },
  {
    role: "assistant" as const,
    content:
      "I've read through your profile — solid background in B2B SaaS. Before I draft the new version, a few quick questions:\n\n1. What's the one achievement from the last two years you're most proud of?\n2. Are there specific keywords from the job description you'd like me to weave in?",
  },
];

export const features = [
  {
    icon: FileText,
    title: "Upload your CV",
    description: "PDF or LinkedIn export, parsed and understood instantly.",
  },
  {
    icon: MessageSquare,
    title: "Guided conversation",
    description:
      "Targeted questions — not a blank form. The agent draws out what matters.",
  },
  {
    icon: PenLine,
    title: "Expert rewrite",
    description:
      "Language tuned to the role, seniority, and industry you're targeting.",
  },
  {
    icon: Download,
    title: "Download as PDF",
    description: "Clean, ATS-friendly output ready to send to recruiters.",
  },
  {
    icon: History,
    title: "Stored sessions",
    description:
      "Come back anytime. Your conversation and drafts are preserved.",
  },
  {
    icon: Shield,
    title: "Secure by default",
    description: "Your data is private. Authentication required, always.",
  },
];

export const steps = [
  {
    number: "01",
    title: "Start a session",
    description: "Sign in and tell the agent what role you're targeting.",
  },
  {
    number: "02",
    title: "Answer questions",
    description:
      "Upload your CV, share achievements, and refine the details through conversation.",
  },
  {
    number: "03",
    title: "Download your CV",
    description:
      "Review the draft, request changes, then download a polished PDF.",
  },
];
