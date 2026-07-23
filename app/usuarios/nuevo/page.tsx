import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import UserForm from "@/components/UserForm";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="text-slate-600 max-w-xl mt-1">
          Regístrate como visitador médico con tus datos de contacto, laboratorio
          farmacéutico y el sector (departamento, municipio y, en la capital, zona) que
          tienes asignado. Al crear tu cuenta iniciarás sesión automáticamente.
        </p>
      </div>
      <UserForm />
    </div>
  );
}
