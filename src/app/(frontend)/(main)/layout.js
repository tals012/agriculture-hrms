import { cookies } from "next/headers";
import { IBM_Plex_Sans_Hebrew } from "next/font/google";
import AdminHeader from "./header";
import GroupLeaderHeader from "./groupLeaderHeader";
import ManagerHeader from "./managerHeader";
import { redirect } from "next/navigation";

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
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  const role = cookieStore.get("role")?.value;

  // If no token, redirect to login
  if (!token) {
    redirect("/login");
  }

  // Determine which header to show based on role
  const getHeader = () => {
    switch(role) {
      case "GROUP_LEADER":
        return <GroupLeaderHeader />;
      case "FIELD_MANAGER":
        return <ManagerHeader />;
      default:
        return <AdminHeader />;
    }
  };

  return (
    <html lang="en" className={ibm.className}>
      <body>
        {getHeader()}
        {children}
      </body>
    </html>
  );
}
