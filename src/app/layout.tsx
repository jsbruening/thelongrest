import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "./_components/auth-provider";
import { Navbar } from "./_components/navbar-shadcn";

export const metadata: Metadata = {
  title: "The Long Rest - D&D VTT",
  description: "Virtual Tabletop for Dungeons & Dragons",
  icons: [{ rel: "icon", url: "/images/favicon.png" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" className={`${geist.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning className="relative min-h-screen bg-base-100">
        <AuthProvider>
          <TRPCReactProvider>
            <div className="drawer lg:drawer-open">
              <input id="drawer-toggle" type="checkbox" className="drawer-toggle" />
              
              {/* Page content */}
              <div className="drawer-content flex flex-col">
                {/* Mobile top bar */}
                <div className="w-full navbar bg-base-100 border-b border-base-300 lg:hidden">
                  <div className="flex-none">
                    <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="inline-block w-5 h-5 stroke-current"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                      </svg>
                    </label>
                  </div>
                  <div className="flex-1">
                    <Link href="/campaigns" className="btn btn-ghost normal-case text-xl px-2">
                      <span className="text-lg font-bold">The Long Rest</span>
                    </Link>
                  </div>
                </div>

                {/* Main content */}
                <main className="flex-1">
                  {children}
                </main>
              </div>

              {/* Sidebar */}
              <Navbar />
            </div>
          </TRPCReactProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
