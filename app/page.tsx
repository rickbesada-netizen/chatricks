import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default function Page() {
  if (!isAuthed()) redirect("/login");
  return <Dashboard />;
}
