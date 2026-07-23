import UserForm from "@/components/UserForm";

export const dynamic = "force-dynamic";

export default function NewUserPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo usuario</h1>
        <p className="text-slate-600 max-w-xl mt-1">
          Registra un nuevo visitador médico con sus datos de contacto, laboratorio
          farmacéutico y el sector (departamento, municipio y, en la capital, zona) que
          tiene asignado.
        </p>
      </div>
      <UserForm />
    </div>
  );
}
