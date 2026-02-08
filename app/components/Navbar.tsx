"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, signIn, useSession } from "next-auth/react";
import Notification from "./Notification";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";

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

const Navbar = () => {
  const inputRef = useRef(null);
  const [notification, setNotification] = React.useState<boolean | null>(null);
  const { data: session, status } = useSession();
  const [picked, setPicked] = React.useState<boolean>("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [notifs, setNotifs] = React.useState<any>([]);
  const [neww, setNeww] = React.useState<boolean>(false);
  const [searchAppear, setSearchAppear] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>("");
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
    }
  }, [session, router, pathname]);

  const handleSignOut = () => {
    Cookies.remove("streakUpdated");
    signOut({ callbackUrl: "/" });
  };

  const navigation = [
    {
      name: "Profile",
      href: "/profile",
      current: router.pathname === "/profile",
    },
    {
      name: "Favorites",
      href: "/favorites",
      current: router.pathname === "/favorites",
    },
    {
      name: "official",
      href: "/official",
      current: router.pathname === "/official",
    },
    {
      name: "community",
      href: "/community",
      current: router.pathname === "/community",
    },
    {
      name: "create",
      href: "/cardAdd",
      current: router.pathname === "/cardAdd",
    },
    {
      name: "created",
      href: "/created",
      current: router.pathname === "/created",
    },
  ];

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }
  const handleView = async () => {
    try {
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
    router.push(`/search/${search}`);
  };

  return (
    <Disclosure as="nav" className="bg-gray-800 shadow-md relative">
      {searchAppear && (
        <div className="absolute text-black  left-0 top-14 w-full h-full bg-opacity-90 z-50">
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
              className="w-1/2 h-10 border-2 border-gray-400 rounded-md px-2"
            />

            <button
              type="button"
              onClick={() => setSearchAppear(false)}
              className="text-gray-400 hover:text-black"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </form>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
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
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
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
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {session?.user &&
                  navigation.map((item) => (
                    <Link
                      onClick={() => setPicked(item.name)}
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        item.name === picked
                          ? "bg-gray-900 text-gray-200 text-l "
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                        "rounded-md px-3 py-2 text-sm font-medium"
                      )}
                      aria-current={item.current ? "page" : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
              </div>
            </div>
          </div>

          <MagnifyingGlassIcon
            onClick={() => {
              setSearchAppear(true);
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);            }}
            className="h-6 w-6 text-gray-400 cursor-pointer"
          />

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {session?.user ? (
              <div className="flex">
                <Menu>
                  <MenuButton
                    onClick={() => handleView()}
                    className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden"
                  >
                    <BellIcon aria-hidden="true" className="size-6" />
                    {neww && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                  </MenuButton>
                  <MenuItems
                    style={{ width: "320px" }}
                    className="absolute right-0 z-10 mt-10  origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    {notifs.map((item, index) => (
                      <MenuItem key={index}>
                        {({ focus }) => (
                          <div
                            className={classNames(
                              focus ? "bg-gray-100" : "",
                              "block w-full text-left px-6 py-3 text-sm text-gray-700 rounded-md transition-colors duration-200",
                              "hover:bg-gray-200 hover:text-gray-900"
                            )}
                          >
                            <div className="font-semibold text-gray-800">
                              {item.type} notification
                            </div>
                            <p className="text-gray-600 text-sm mt-1">
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
                            focus ? "bg-gray-100 text-center " : "",
                            "block w-full text-center border-t-2   px-6 py-2 text-sm text-gray-700 rounded-md transition-colors duration-200",
                            "hover:bg-gray-200 hover:text-gray-900"
                          )}
                        >
                          <div className="font-semibold  text-gray-800">
                            view All notifications
                          </div>
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>

                <Menu as="div" className="relative ml-3">
                  <div>
                    <MenuButton className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-8 w-8 rounded-full"
                        src={session.user.image || ""}
                        alt="User profile"
                      />
                    </MenuButton>
                  </div>

                  <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {session?.user?.role === "admin" && (
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={() => router.push("/addNotification")}
                            className={classNames(
                              focus ? "bg-gray-100" : "",
                              "block w-full text-left px-4 py-2 text-sm text-gray-700"
                            )}
                          >
                            add notification
                          </button>
                        )}
                      </MenuItem>
                    )}

                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          onClick={() => setPicked("Profile")}
                          href="/profile"
                          className={classNames(
                            focus ? "bg-gray-100" : "",
                            "block px-4 py-2 text-sm text-gray-700"
                          )}
                        >
                          Profile
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          href="/leaderboard"
                          className={classNames(
                            focus ? "bg-gray-100" : "",
                            "block px-4 py-2 text-sm text-gray-700"
                          )}
                        >
                          leaderboard
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => setNotification(true)}
                          className={classNames(
                            focus ? "bg-gray-100" : "",
                            "block w-full text-left px-4 py-2 text-sm text-gray-700"
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
                className="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {session?.user &&
            navigation.map((item) => (
              <DisclosureButton
                key={item.name}
                as={Link}
                href={item.href}
                className={classNames(
                  item.current
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white",
                  "block rounded-md px-3 py-2 text-base font-medium"
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
              className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
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
    </Disclosure>
  );
};

export default Navbar;
