// app/page.tsx
// The root "/" route redirects to "/dashboard"
// If not logged in, middleware.ts will catch it and redirect to /sign-in
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
