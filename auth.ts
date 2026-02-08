import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "./lib/db";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
    }),
    CredentialsProvider({
      name: "Credentials",
      id: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("=== Authorization Attempt ===");
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            return null;
          }
      
          const email = credentials.email.trim().toLowerCase();
          const password = credentials.password.trim();
      
          console.log("Querying user:", email);
          const [user] = await db.queryAsync(
            `SELECT id, email,role, password, username,image FROM users WHERE email = ?`, 
            [email]
          );
      
          if (!user) {
            console.log("User not found");
            return null;
          }
      
          console.log("User found - ID:", user.id);
      
          console.log("Comparing passwords...");
          const isValid = await compare(password, user.password.toString());
          console.log(isValid ? "Password valid" : "Invalid password");
      
          if (!isValid) return null;
          console.log("user image : " , user.image);

          const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'secret');
          const token = await new SignJWT({ userId: user.id.toString(), role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('200h')
            .sign(secret);
          console.log("role : " , user.role);
      
          return {
            id: user.id,
            email: user.email,
            name: user.username,
            image: user.image || null,
            accessToken: token,
            role : user.role
          };
      
        } catch (error) {
          console.error("🔥 Authorization error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("=== JWT Callback ===");
      console.log("user : " , user);
      if (user) {
        let id = user.id;
        let accessToken = user.accessToken;
        let role = user.role;
        if ((typeof id !== 'number' || isNaN(Number(id)) ) && role != "admin") {
          const iddResult = await db.queryAsync(
          `SELECT id FROM users WHERE email = $1`, 
          [user.email]
          );
          const idd = iddResult.rows[0];
          if (!idd) {
            const insertResult = await db.queryAsync(
              `INSERT INTO users (email, username) VALUES ($1, $2)`,
              [user.email, user.name] 
            );
        
            const newUserResult = await db.queryAsync(
              `SELECT id FROM users WHERE email = $1`,
              [user.email]
            );
            const newUser = newUserResult.rows[0];
        
            if (newUser) {
              id = newUser.id; 
              role = "user"; 
            } else {
              console.error("Failed to retrieve the new user's ID after insertion");
              return token; 
            }
          }
          else{
            id = idd.id;

          }
          console.log("idd : " , idd);
          role = "user";
          const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'secret');
          accessToken = await new SignJWT({ userId: id.toString(), role: "user" })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('200h')
            .sign(secret);

        }
        
        token.id = id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.accessToken = accessToken;
        token.role = role ;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("=== SESSION Callback ===");
      console.log("user : " , token);
      session.user = {
        ...session.user,
        id: token.id,
        email: token.email,
        name: token.name,
        image : token.image,
        role : token.role,
        accessToken: token.accessToken
      };
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth/error"
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.AUTH_SECRET
});
