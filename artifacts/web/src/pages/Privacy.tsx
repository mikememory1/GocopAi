export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: May 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Who We Are</h2>
          <p className="text-muted-foreground leading-relaxed">
            GoCopyAI ("we", "us", "our") is a marketing AI platform for ecommerce businesses,
            accessible at gocopyai.com. We are committed to protecting your personal data and
            your right to privacy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. What Data We Collect</h2>
          <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2">
            <li><strong className="text-foreground">Account data:</strong> name, email address, and password (handled securely by Clerk).</li>
            <li><strong className="text-foreground">Usage data:</strong> AI generations, quiz results, and tool usage for billing and improving the service.</li>
            <li><strong className="text-foreground">Payment data:</strong> billing details processed by Stripe — we never store card numbers.</li>
            <li><strong className="text-foreground">Social connections:</strong> OAuth tokens for platforms you choose to connect (Facebook, LinkedIn, YouTube, etc.).</li>
            <li><strong className="text-foreground">Log data:</strong> IP address, browser type, and pages visited for security and analytics.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
          <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2">
            <li>To provide, maintain, and improve the GoCopyAI platform.</li>
            <li>To process payments and manage your subscription.</li>
            <li>To generate AI content on your behalf when you use our tools.</li>
            <li>To send transactional emails (quiz results, billing receipts).</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal data. We share data only with trusted third-party
            service providers (OpenAI for AI generation, Stripe for payments, Clerk for
            authentication, Resend for email) solely to operate the service. Each provider
            is bound by their own privacy and data-processing agreements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your account data for as long as your account is active. You may
            request deletion at any time by contacting us. AI generation logs are retained
            for up to 12 months for billing and audit purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            Under GDPR and UK data protection law you have the right to access, correct,
            delete, and port your personal data. You also have the right to object to
            processing and to withdraw consent at any time. To exercise any right, email us
            at <a href="mailto:privacy@gocopyai.com" className="text-primary hover:underline">privacy@gocopyai.com</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use essential cookies for authentication sessions and optional analytics
            cookies to understand how the platform is used. You can disable non-essential
            cookies in your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibent mb-3">8. Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            All data is transmitted over HTTPS. Passwords are never stored in plain text.
            OAuth tokens are encrypted at rest. We perform regular security reviews.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. We will notify you of significant
            changes by email or via an in-app notice. Continued use of GoCopyAI after
            changes means you accept the updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For any privacy-related questions, contact us at{" "}
            <a href="mailto:privacy@gocopyai.com" className="text-primary hover:underline">
              privacy@gocopyai.com
            </a>
            .
          </p>
        </section>

        <div className="pt-8 border-t border-border">
          <a href="/" className="text-primary hover:underline text-sm">← Back to GoCopyAI</a>
        </div>
      </div>
    </div>
  );
}
