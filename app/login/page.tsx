import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
          <p className="text-slate-600 mt-1">Planificador semanal de visitas médicas</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
