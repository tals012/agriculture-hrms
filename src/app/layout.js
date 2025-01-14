import { IBM_Plex_Sans_Hebrew } from "next/font/google";
import "@/styles/globals.scss";
import "@/styles/override.scss";

export const metadata = {
  title: "Agriculture Management System",
  description: "Agriculture Management System",
};

const ibm = IBM_Plex_Sans_Hebrew({
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700"],
});


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={ibm.className}>
        {children}
      </body>
    </html>
  );
}
