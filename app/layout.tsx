import type { Metadata } from "next";
import "./globals.css";
import { TranslationProvider } from "./contexts/TranslationContext";

export const metadata: Metadata = {
  title: "Whispering Palms - AI",
  description: "Ancient Indian wisdom, modern AI guidance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Stripe.js */}
        {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
          <script src="https://js.stripe.com/v3/" async></script>
        )}
        {/* Razorpay */}
        {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && (
          <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        )}
      </head>
      <body className="font-sans">
        <TranslationProvider>
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}
