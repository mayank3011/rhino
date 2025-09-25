// app/layout.tsx
import "../app/globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ToastProvider from "../components/ToastProvider";
import RouteProgress from "../components/RouteProgress";
import { Roboto } from "next/font/google";

export const metadata = { 
  title: "RhinoGeeks",
  icons: { icon: "/favicon.ico" },   // (optional) correct metadata key
};

const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.className}>
      <body className={roboto.className} suppressHydrationWarning>
        <ToastProvider />
        <RouteProgress />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
