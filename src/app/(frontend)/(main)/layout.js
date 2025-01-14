import Header from "./header";
import { IBM_Plex_Sans_Hebrew } from "next/font/google";

export const metadata = {
  title: "Agriculture Management System",
  description: "Agriculture Management System",
};

const ibm = IBM_Plex_Sans_Hebrew({
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700"],
});

export default function AppLayout({ children }) {
  return (
    <html lang="en" className={ibm.className}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
