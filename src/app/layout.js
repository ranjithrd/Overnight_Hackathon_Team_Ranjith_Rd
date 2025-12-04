// src/app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Coop Manager Dashboard",
  description: "Dashboard for Cooperative Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
  }