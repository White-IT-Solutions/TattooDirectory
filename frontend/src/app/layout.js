import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "../design-system/components/ui/ThemeProvider";
import { ToastProvider } from "../design-system/components/feedback/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tattoo Directory",
  description: "Find your tattoo artist",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Rock+Salt&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Merienda:wght@300..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider defaultTheme="system" enableTransitions={true}>
          <ToastProvider 
            position="top-right" 
            maxToasts={5} 
            defaultDuration={5000}
          >
            <ErrorBoundary>
              <Navbar />
              <main>{children}</main>
              <Footer />
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
