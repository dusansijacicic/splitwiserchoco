export const metadata = { title: "Privacy Policy — SplitWiser" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-foreground">
      <h1 className="mb-6 text-2xl font-semibold">Privacy Policy</h1>
      <p className="mb-4 text-muted">Last updated: 2026-07-20</p>

      <p className="mb-4">
        SplitWiser (&quot;the app&quot;) is a personal expense-splitting tool. This page explains
        what data the app collects and how it is used.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-medium">What we collect</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>Your email address and password, used only to authenticate you (via Supabase Auth).</li>
        <li>A display name you choose, shown to other members of groups you join.</li>
        <li>Expense data you or your group members enter: descriptions, amounts, currencies, dates, and who paid.</li>
      </ul>

      <h2 className="mb-2 mt-6 text-lg font-medium">How it&apos;s used</h2>
      <p className="mb-4">
        Data is used solely to provide the app&apos;s functionality — tracking shared expenses and
        balances within the groups you create or join. We do not sell or share your data with
        third parties, and we do not use it for advertising.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-medium">Where it&apos;s stored</h2>
      <p className="mb-4">
        Data is stored in a Postgres database hosted by Supabase. Access is restricted so that
        only members of a group can see that group&apos;s data.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-medium">Your choices</h2>
      <p className="mb-4">
        You can edit your display name at any time from your profile. To request deletion of
        your account and associated data, contact us using the email below.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-medium">Contact</h2>
      <p className="mb-4">
        Questions about this policy: <a className="text-primary hover:underline" href="mailto:dusan.sijacic2@gmail.com">dusan.sijacic2@gmail.com</a>
      </p>
    </div>
  );
}
