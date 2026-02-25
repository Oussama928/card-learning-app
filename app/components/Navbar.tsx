"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, signIn, useSession } from "next-auth/react";
import Notification from "./Notification";
import ProgressionPopup from "./ProgressionPopup";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { searchSchema } from "@/types/validationSchemas";
import { io, Socket } from "socket.io-client";
import type { NotificationItemDTO, NotificationMetadataDTO } from "@/types";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface ProgressionPopupState {
  title: string;
  message: string;
  metadata?: NotificationMetadataDTO | null;
}

const Navbar = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [notification, setNotification] = React.useState<boolean | null>(null);
  const { data: session, status } = useSession();
  const [picked, setPicked] = React.useState<string>("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [notifs, setNotifs] = React.useState<NotificationItemDTO[]>([]);
  const [neww, setNeww] = React.useState<boolean>(false);
  const [searchAppear, setSearchAppear] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>("");
  const [streak, setStreak] = React.useState<number>(0);
  const [tierName, setTierName] = React.useState<string>("bronze");
  const [progressionPopup, setProgressionPopup] =
    React.useState<ProgressionPopupState | null>(null);
  const icon_paths = ["leaderboard", "profile"];
  useEffect(() => {
    if (session) {
      console.log("Session:", session);
      const lastUpdated = Cookies.get("streakUpdated");
      const today = new Date().toISOString().split("T")[0];

      if (!lastUpdated || lastUpdated !== today) {
        const updateStreak = async () => {
          try {
            const response = await fetch(`/api/updateStreak`, {
              method: "PATCH",
              credentials: "include",
              headers: {
                authorization: `Bearer ${session.user.accessToken}`,
              },
            });

            if (response.ok) {
              console.log("Streak updated successfully", session);
              const expires = new Date();
              expires.setUTCHours(23, 0, 0, 0);

              Cookies.set("streakUpdated", today, {
                expires: expires,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
              });
            }
          } catch (error) {
            console.error("Streak update failed:", error);
          }
        };

        updateStreak();
      }
      const retrieveNotifications = async () => {
        try {
          const response = await fetch("/api/notifications/getSmall", {
            method: "GET",
            headers: {
              authorization: `Bearer ${session.user.accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Notifications:", data);
            setNotifs(data.notifs);
            setNeww(data.new);
          } else {
            console.error("Failed to retrieve notifications");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      };
      retrieveNotifications();

      const retrieveStreak = async () => {
        try {
          const response = await fetch("/api/getStats/" + session.user.id, {
            method: "GET",
            headers: {
              authorization: `Bearer ${session.user.accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setStreak(data.stats?.dailyStreak || 0);
            setTierName(
              data.stats?.progression?.currentTier?.name?.toLowerCase() ||
                "bronze",
            );
          } else {
            console.error("Failed to retrieve streak");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      };
      retrieveStreak();
    }
  }, [session, router, pathname]);

  useEffect(() => {
    if (!session?.user?.accessToken) return;

    const token = session.user.accessToken;
    const socket: Socket = io({
      path: "/api/socket",
      auth: { token },
    });

    socket.on("notification", (incoming: NotificationItemDTO) => {
      setNotifs((prev) => [incoming, ...prev].slice(0, 4));
      setNeww(true);

      if (incoming.metadata?.popupType === "tier_unlock") {
        setProgressionPopup({
          title: "Tier Unlocked",
          message: incoming.content,
          metadata: incoming.metadata,
        });
      }

      if (incoming.metadata?.popupType === "achievement_unlock") {
        setProgressionPopup({
          title: "Achievement Unlocked",
          message: incoming.content,
          metadata: incoming.metadata,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user?.accessToken]);

  const handleSignOut = () => {
    Cookies.remove("streakUpdated");
    signOut({ callbackUrl: "/" });
  };

  const navigation = [
    {
      name: "Favorites",
      href: "/favorites",
      current: pathname === "/favorites",
    },
    {
      name: "official",
      href: "/official",
      current: pathname === "/official",
    },
    {
      name: "community",
      href: "/community",
      current: pathname === "/community",
    },
    {
      name: "create",
      href: "/cardAdd",
      current: pathname === "/cardAdd",
    },
    {
      name: "created",
      href: "/created",
      current: pathname === "/created",
    },
    {
      name: "groups",
      href: "/study-groups",
      current: pathname === "/study-groups",
    },
  ];

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }
  const handleView = async () => {
    try {
      if (!session?.user?.accessToken) return;

      const response = await fetch("/api/notifications/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({ notifs: notifs }),
      });

      if (response.ok) {
        console.log("Viewed notifications");
        setNeww(false);
      } else {
        console.error("Failed to view notifications");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleSearch = () => {
    try {
      searchSchema.validateSync({ search: search.trim() });
      router.push(`/search/${encodeURIComponent(search.trim())}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
      return;
    }
  };

  return (
    <Disclosure
      as="nav"
      className="bg-background border-b sticky top-0 w-full z-50"
    >
      {searchAppear && (
        <div className="absolute text-foreground left-0 top-14 w-full h-full bg-background/90 backdrop-blur-sm z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
              setSearchAppear(false);
              setSearch("");
            }}
            className="flex justify-center items-center h-full"
          >
            <input
              value={search}
              ref={inputRef}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search"
              className="w-1/2 h-10 border border-input bg-background rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              type="button"
              onClick={() => setSearchAppear(false)}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </form>
        </div>
      )}
      <div className="mx-auto max-w-8xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center   ">
          <div className="absolute inset-y-0 left-0 flex items-center md:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon
                className="block h-6 w-6 group-data-[open]:hidden"
                aria-hidden="true"
              />
              <XMarkIcon
                className="hidden h-6 w-6 group-data-[open]:block"
                aria-hidden="true"
              />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center md:items-stretch md:justify-center">
            <div className="flex shrink-0 items-center">
              <Link href="/" onClick={() => setPicked("official")}>
                <Image
                  src="https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg"
                  alt="TikTok Logo"
                  width={100}
                  height={100}
                  className="h-8 w-auto"
                  unoptimized
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 md:block">
              <div className="flex space-x-4">
                {session?.user &&
                  navigation.map((item) => (
                    <Link
                      onClick={() => setPicked(item.name)}
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        item.name === picked
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      )}
                      aria-current={item.current ? "page" : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
              </div>
            </div>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 flex-nowrap">
            {session?.user && (
              <div className="flex items-center gap-3 text-foreground whitespace-nowrap shrink-0">
                <div className="flex flex-col items-center gap-0">
                  <img
                    src={`/tiers/${tierName}.png`}
                    className="h-7 w-7 rounded-full object-cover"
                    alt={`${tierName} tier icon`}
                  />
                  <span className="text-xs font-semibold capitalize text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {tierName}
                  </span>
                </div>
                <div className="flex items-center gap-1 border border-border rounded-lg px-1 py-1 bg-muted">
                  <img src="/flame.png" className="h-6 w-6" />
                  <span className="text-sm font-semibold">{streak}</span>
                </div>
              </div>
            )}

            <MagnifyingGlassIcon
              onClick={() => {
                setSearchAppear(true);
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 0);
              }}
              className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            />
            {session?.user ? (
              <div className="flex">
                <Menu>
                  <MenuButton
                    onClick={() => handleView()}
                    className="relative ml-auto shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                  >
                    <BellIcon aria-hidden="true" className="size-6" />
                    {neww && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full"></span>
                    )}
                  </MenuButton>
                  <MenuItems
                    style={{ width: "320px" }}
                    className="absolute right-0 z-10 mt-10 origin-top-right rounded-md bg-popover border border-border py-1 shadow-lg focus:outline-none"
                  >
                    {notifs.map((item, index) => (
                      <MenuItem key={index}>
                        {({ focus }) => (
                          <div
                            className={classNames(
                              focus ? "bg-muted" : "",
                              "block w-full text-left px-6 py-3 text-sm text-popover-foreground rounded-md transition-colors duration-200",
                            )}
                          >
                            <div className="font-semibold">
                              {item.type} notification
                            </div>
                            <p className="text-muted-foreground text-sm mt-1">
                              {item.content.length > 35
                                ? `${item.content.slice(0, 35)}...`
                                : item.content}
                            </p>
                          </div>
                        )}
                      </MenuItem>
                    ))}
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => router.push("/notifications")}
                          className={classNames(
                            focus ? "bg-muted" : "",
                            "block w-full text-center border-t border-border px-6 py-2 text-sm text-popover-foreground transition-colors duration-200",
                          )}
                        >
                          <div className="font-semibold">
                            View all notifications
                          </div>
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>

                <Menu as="div" className="relative ml-3">
                  <div>
                    <MenuButton className="relative flex rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-8 w-8 rounded-full border border-border"
                        src={session.user.image || "/default-avatar.png"}
                        alt="User profile"
                      />
                    </MenuButton>
                  </div>

                  <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-popover border border-border py-1 shadow-lg focus:outline-none">
                    {session?.user?.role === "admin" && (
                      <>
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => router.push("/addNotification")}
                              className={classNames(
                                focus ? "bg-muted" : "",
                                "block w-full text-left px-4 py-2 text-sm text-popover-foreground",
                              )}
                            >
                              Add notification
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => router.push("/addAchievement")}
                              className={classNames(
                                focus ? "bg-muted" : "",
                                "block w-full text-left px-4 py-2 text-sm text-popover-foreground",
                              )}
                            >
                              Add achievement
                            </button>
                          )}
                        </MenuItem>
                      </>
                    )}

                    {icon_paths.map((path) => (
                      <MenuItem key={path}>
                        {({ focus }) => (
                          <Link
                            href={`/${path}`}
                            className={classNames(
                              focus ? "bg-muted" : "",
                              "block px-4 py-2 text-sm text-popover-foreground capitalize",
                            )}
                          >
                            {path}
                          </Link>
                        )}
                      </MenuItem>
                    ))}
                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          href="/settings"
                          className={classNames(
                            focus ? "bg-muted" : "",
                            "block px-4 py-2 text-sm text-popover-foreground capitalize",
                          )}
                        >
                          Settings
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => setNotification(true)}
                          className={classNames(
                            focus ? "bg-muted" : "",
                            "block w-full text-left px-4 py-2 text-sm text-popover-foreground",
                          )}
                        >
                          Sign out
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      <DisclosurePanel className="md:hidden z-0 absolute w-full bg-background border-b">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {session?.user &&
            navigation.map((item) => (
              <DisclosureButton
                key={item.name}
                as={Link}
                href={item.href}
                className={classNames(
                  item.current
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  "block rounded-md px-3 py-2 text-base font-medium transition-colors",
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.name}
              </DisclosureButton>
            ))}
          {session?.user && (
            <DisclosureButton
              as="button"
              onClick={() => setNotification(true)}
              className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Sign Out
            </DisclosureButton>
          )}
        </div>
      </DisclosurePanel>

      {notification && (
        <Notification
          func={handleSignOut}
          text="Are you sure you want to sign out?"
          cancel={setNotification}
          main_action="sign out"
        />
      )}

      {progressionPopup && (
        <ProgressionPopup
          title={progressionPopup.title}
          message={progressionPopup.message}
          metadata={progressionPopup.metadata}
          onClose={() => setProgressionPopup(null)}
        />
      )}
    </Disclosure>
  );
};

export default Navbar;
