import { getDictionary } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getDictionary();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <span className="text-2xl font-semibold text-primary">SplitWiser</span>
          <LanguageSwitcher locale={locale} labels={t.lang} />
        </div>
        {children}
      </div>
    </div>
  );
}
