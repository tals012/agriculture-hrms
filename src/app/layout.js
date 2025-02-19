import { IBM_Plex_Sans_Hebrew } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/globals.scss";
import "@/styles/override.scss";

export const metadata = {
  title: "Agriculture Management System",
  description: "Agriculture Management System",
};

const ibm = IBM_Plex_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700"],
  preload: true,
});

export default function RootLayout({ children }) {
  return (
    <html lang="he" className={ibm.className}>
      <body>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
