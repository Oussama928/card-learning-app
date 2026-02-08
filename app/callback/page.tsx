"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { useSession } from "next-auth/react";

const CallbackPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      console.log("User session:", session.user?.email);
      const registerUser = async () => {
        try {
          const response = await fetch("/api/register", {
            method: "POST", 
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: session?.user?.email,
              username: session?.user?.name,
            }),
          });
          console.log("response", response);
          if (response.ok) {
            const data = await response.json();
            console.log("User registered successfully:", data);

            
          } else {
            console.error("Registration failed:", await response.text());
          }
        } catch (error) {
          console.error("Error registering user:", error);
        }
      };

      registerUser();
      router.push("/official"); 
    }
  }, [session, router]);

  return (
        <div className="w-full h-screen flex justify-center items-center ">
          <div className="w-1/4  aspect-square  border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      
  );};

export default CallbackPage;
