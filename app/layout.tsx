import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import NavLinks from "@/components/NavLinks";
import LogoutButton from "@/components/LogoutButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planificador de Visitas Médicas",
  description: "Planificador semanal de visitas médicas optimizado por IA",
};

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/doctors", label: "Médicos" },
  { href: "/visits/new", label: "Registrar visita" },
  { href: "/planner", label: "Planificador semanal" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-6 flex-wrap">
              <Link href="/" className="font-semibold text-lg">
                🩺 Visitas Médicas
              </Link>
              {user && <NavLinks links={NAV_LINKS} />}
            </div>
            <div className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <span className="text-slate-600">
                    {user.firstName} {user.lastName}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="text-slate-600 hover:text-slate-900">
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
