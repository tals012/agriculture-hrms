import { cookies } from "next/headers";
import { IBM_Plex_Sans_Hebrew } from "next/font/google";
import AdminHeader from "./header";
import GroupLeaderHeader from "./groupLeaderHeader";
import ManagerHeader from "./managerHeader";

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
  const role = await cookieStore.get("role")?.value;

  return (
    <html lang="en" className={ibm.className}>
      <body>
        {role === "GROUP_LEADER" ? (
          <GroupLeaderHeader />
        ) : role === "FIELD_MANAGER" ? (
          <ManagerHeader />
        ) : (
          <AdminHeader />
        )}
        {children}
      </body>
    </html>
  );
}
