import { cookies } from "next/headers";
import { IBM_Plex_Sans_Hebrew } from "next/font/google";
import { redirect } from "next/navigation";
import AdminHeader from "./header";
import GroupLeaderHeader from "./groupLeaderHeader";
import ManagerHeader from "./managerHeader";
import WorkerHeader from "./workerHeader";

export const metadata = {
  title: "Agriculture Management System",
  description: "Agriculture Management System",
};

const ibm = IBM_Plex_Sans_Hebrew({
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700"],
});

export default async function AppLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const role = cookieStore.get("role")?.value;

  // If no token, redirect to login
  if (!token) {
    redirect("/login");
  }

  // Determine which header to show based on role
  const getHeader = () => {
    switch (role) {
      case "GROUP_LEADER":
        return <GroupLeaderHeader />;
      case "FIELD_MANAGER":
        return <ManagerHeader />;
      case "WORKER":
        return null;
      default:
        return <AdminHeader />;
    }
  };

  return (
    <div className="app-layout">
      {getHeader()}
      {children}
    </div>
  );
}
