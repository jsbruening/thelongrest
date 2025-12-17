"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Home, Users, Settings, LogOut } from "lucide-react";
import { ProfileDrawer } from "./profile-drawer";
import { cn } from "~/lib/utils";

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  if (status !== "authenticated") {
    return null;
  }

  return (
    <>
      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="drawer-toggle" className="drawer-overlay"></label>
        <aside className="w-64 min-h-full bg-base-100 border-r border-base-300 flex flex-col">
          {/* Logo */}
          <div className="px-4 pt-4 pb-2 border-b border-base-300">
            <Link href="/campaigns" className="flex items-center gap-2">
              <Image
                src="/images/tlr_logo.png"
                alt="The Long Rest"
                width={320}
                height={96}
                className="h-28 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pt-3">
            <ul className="menu menu-vertical w-full gap-1">
              <li>
                <Link
                  href="/campaigns"
                  className={cn(
                    "gap-3",
                    isActive("/campaigns") && "active bg-primary text-primary-content"
                  )}
                >
                  <Home className="h-5 w-5" />
                  Campaigns
                </Link>
              </li>
              <li>
                <Link
                  href="/characters"
                  className={cn(
                    "gap-3",
                    isActive("/characters") && "active bg-primary text-primary-content"
                  )}
                >
                  <Users className="h-5 w-5" />
                  Characters
                </Link>
              </li>
            </ul>
          </nav>

          {/* User section */}
          {session?.user && (
            <div className="p-4 border-t border-base-300">
              <div className="dropdown dropdown-top dropdown-end w-full">
                <div tabIndex={0} role="button" className="btn btn-ghost w-full justify-start gap-3">
                  <div className="avatar">
                    <div className="w-10 rounded-full ring ring-primary/20 ring-offset-2 ring-offset-base-100 overflow-hidden">
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.displayName ?? session.user.name ?? "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-sm font-semibold">
                          {(session.user.displayName ?? session.user.name)?.[0]?.toUpperCase() ??
                            session.user.email?.[0]?.toUpperCase() ??
                            "U"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold truncate">
                      {session.user.displayName ?? session.user.name ?? "User"}
                    </div>
                    <div className="text-xs text-base-content/60 truncate">{session.user.email}</div>
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 rounded-box z-[1] mb-2 w-56 p-2 shadow-lg border border-base-300"
                >
                  <li>
                    <a onClick={() => setProfileDrawerOpen(true)}>
                      <Settings className="h-4 w-4" />
                      Profile Settings
                    </a>
                  </li>
                  <li>
                    <a onClick={handleLogout} className="text-error">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>

      <ProfileDrawer open={profileDrawerOpen} onClose={() => setProfileDrawerOpen(false)} />
    </>
  );
}
