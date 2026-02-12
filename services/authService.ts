import { signIn, signOut } from "next-auth/react";

export async function signInWithCredentials(email: string, password: string) {
  return signIn("credentials", {
    email,
    password,
    redirect: false,
  });
}

export async function signInWithGithub() {
  return signIn("github", { callbackUrl: "/official" });
}

export async function signInWithGoogle() {
  return signIn("google", { callbackUrl: "/official" });
}

export async function logout() {
  return signOut({ callbackUrl: "/" });
}
