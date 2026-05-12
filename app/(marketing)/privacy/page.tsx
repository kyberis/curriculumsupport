import type { Metadata } from "next";
import { siteConfig } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${siteConfig.name} — how we handle your data.`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="mb-4 font-serif text-4xl text-neutral-100">
        Privacy Policy
      </h1>
      <p className="mb-12 text-sm text-neutral-500">
        Last updated: May 12, 2025
      </p>

      <div className="space-y-10 text-neutral-300 [&_h2]:mb-3 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-neutral-100 [&_p]:leading-relaxed [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_li]:leading-relaxed">
        <section>
          <h2>1. What we collect</h2>
          <p>
            When you use {siteConfig.name}, we collect only what is necessary to
            provide the service:
          </p>
          <ul>
            <li>
              <strong>Account information:</strong> name and email from your
              Google sign-in.
            </li>
            <li>
              <strong>CV content:</strong> text you provide or upload during
              sessions.
            </li>
            <li>
              <strong>Conversation history:</strong> messages exchanged with the
              AI agent within your sessions.
            </li>
          </ul>
        </section>

        <section>
          <h2>2. How we use your data</h2>
          <p>Your data is used exclusively to:</p>
          <ul>
            <li>Generate and improve your CV through the AI agent.</li>
            <li>Preserve your sessions so you can return later.</li>
            <li>Authenticate you securely.</li>
          </ul>
          <p>
            We do not sell, rent, or share your personal data with third parties
            for marketing purposes.
          </p>
        </section>

        <section>
          <h2>3. AI processing</h2>
          <p>
            Your messages and CV content are sent to third-party AI providers
            (such as Anthropic) to generate responses. These providers process
            data according to their own privacy policies and do not use your
            inputs for model training.
          </p>
        </section>

        <section>
          <h2>4. Data storage</h2>
          <p>
            Your data is stored in a secure, encrypted database hosted on Neon
            (PostgreSQL). File uploads are stored via Vercel Blob with
            access-controlled URLs.
          </p>
        </section>

        <section>
          <h2>5. Data retention</h2>
          <p>
            Your data is retained as long as your account exists. You may
            request deletion of your account and all associated data at any time
            by contacting us.
          </p>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>
            We use strictly necessary cookies for authentication and session
            management. We do not use tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2>7. Third-party services</h2>
          <ul>
            <li>
              <strong>Google OAuth:</strong> for authentication.
            </li>
            <li>
              <strong>Anthropic:</strong> for AI-powered CV generation.
            </li>
            <li>
              <strong>Vercel:</strong> for hosting and file storage.
            </li>
            <li>
              <strong>Neon:</strong> for database hosting.
            </li>
          </ul>
        </section>

        <section>
          <h2>8. Your rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Export your data in a portable format.</li>
          </ul>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            For privacy-related inquiries or data requests, contact us at{" "}
            <a
              href="mailto:privacy@trefolio.com"
              className="text-neutral-100 underline underline-offset-4 hover:text-white"
            >
              privacy@trefolio.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
