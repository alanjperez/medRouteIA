"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteDoctorButton({ doctorId }: { doctorId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este médico y su historial de visitas?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/doctors/${doctorId}`, { method: "DELETE" });
      router.push("/doctors");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {deleting ? "Eliminando..." : "Eliminar médico"}
    </button>
  );
}
