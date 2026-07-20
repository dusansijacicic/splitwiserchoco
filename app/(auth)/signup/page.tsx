import { getDictionary } from "@/lib/i18n/server";
import { SignupForm } from "@/components/auth/SignupForm";

export default async function SignupPage() {
  const { t } = await getDictionary();
  return <SignupForm t={t.auth} />;
}
