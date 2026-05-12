import type { Metadata } from "next";
import { siteConfig } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${siteConfig.name}.`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="mb-4 font-serif text-4xl text-neutral-100">
        Terms of Service
      </h1>
      <p className="mb-12 text-sm text-neutral-500">
        Last updated: May 12, 2025
      </p>

      <div className="space-y-10 text-neutral-300 [&_h2]:mb-3 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-neutral-100 [&_p]:leading-relaxed [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_li]:leading-relaxed">
        <section>
          <h2>1. Acceptance of terms</h2>
          <p>
            By accessing or using {siteConfig.name} (&quot;the Service&quot;),
            you agree to be bound by these Terms of Service. If you do not agree
            to these terms, do not use the Service.
          </p>
        </section>

        <section>
          <h2>2. Description of service</h2>
          <p>
            {siteConfig.name} is an AI-powered tool that helps users create
            professional, ATS-friendly CVs through guided conversation. The
            Service includes CV parsing, AI-assisted writing, and PDF export.
          </p>
        </section>

        <section>
          <h2>3. Account registration</h2>
          <p>
            You must sign in with a Google account to use the Service. You are
            responsible for maintaining the security of your account and for all
            activity that occurs under it.
          </p>
        </section>

        <section>
          <h2>4. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose.</li>
            <li>
              Submit false, misleading, or fraudulent information in your CV.
            </li>
            <li>
              Attempt to access other users&apos; data or interfere with the
              Service.
            </li>
            <li>
              Use automated tools to scrape, overload, or abuse the Service.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Intellectual property</h2>
          <p>
            You retain full ownership of the content you provide (your CV data,
            work history, achievements). The AI-generated output is provided to
            you for your unrestricted use.
          </p>
          <p>
            The Service itself — its design, code, and branding — remains the
            property of {siteConfig.name} and its operators.
          </p>
        </section>

        <section>
          <h2>6. AI-generated content</h2>
          <p>
            The Service uses AI to generate CV text based on your inputs. While
            we strive for accuracy and quality, you are solely responsible for
            reviewing and verifying all generated content before using it. The
            AI may occasionally produce inaccurate or inappropriate suggestions.
          </p>
        </section>

        <section>
          <h2>7. Availability and modifications</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue the Service
            at any time without notice. We do not guarantee uninterrupted or
            error-free operation.
          </p>
        </section>

        <section>
          <h2>8. Limitation of liability</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any
            kind. To the fullest extent permitted by law, we shall not be liable
            for any indirect, incidental, or consequential damages arising from
            your use of the Service, including but not limited to lost job
            opportunities or hiring outcomes.
          </p>
        </section>

        <section>
          <h2>9. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at our
            discretion if you violate these terms. You may stop using the
            Service at any time and request deletion of your account.
          </p>
        </section>

        <section>
          <h2>10. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the
            Service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a
              href="mailto:legal@trefolio.com"
              className="text-neutral-100 underline underline-offset-4 hover:text-white"
            >
              legal@trefolio.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
