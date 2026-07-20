import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { getDictionary } from "@/lib/i18n/server";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { locale, t } = await getDictionary();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold text-primary">
            SplitWiser
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher locale={locale} labels={t.lang} />
            <Link href="/profile" className="text-sm text-muted hover:text-foreground">
              {t.nav.profile}
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="secondary">
                {t.nav.logout}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
