// app/layout.tsx
import "../app/globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ToastProvider from "../components/ToastProvider";
import { Inter } from "next/font/google";


export const metadata = { title: "Rhino Courses" };
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
<html lang="en" className={inter.className}>
  <body className={inter.className} suppressHydrationWarning={true}>
    <ToastProvider />
    <Navbar />
    <main>{children}</main>
    <Footer />
  </body>
</html>
  );
}
