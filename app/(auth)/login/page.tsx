import { getDictionary } from "@/lib/i18n/server";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const { t } = await getDictionary();
  return <LoginForm t={t.auth} />;
}
