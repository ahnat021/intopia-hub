import type { Metadata } from "next"
import { AdminConsole } from "@/components/admin/admin-console"

export const metadata: Metadata = {
  title: "Admin Control Panel · Intopia Hub",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminConsole />
}
