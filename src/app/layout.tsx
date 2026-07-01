import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const clerkEnabled =
  !!process.env.CLERK_SECRET_KEY &&
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Conduit — Systems Integration CRM",
    template: "%s · Conduit",
  },
  description:
    "Conduit is the operating system for systems integration — leads, quotations, projects, AMC/PPM and service operations, from enquiry to cash.",
  applicationName: "Conduit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tree = (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );

  // Only mount Clerk when configured, so dev-auth mode renders without keys.
  return clerkEnabled ? (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{ cssLayerName: "clerk" }}
    >
      {tree}
    </ClerkProvider>
  ) : (
    tree
  );
}
