import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "30 лет в мультивселенной",
  description: "Мини-игра поздравление: зеленый портал, гаражная реальность, кликабельные заметки и финальная sci-fi сцена.",
  openGraph: {
    title: "30 лет в мультивселенной",
    description: "Портальная мини-игра на день рождения.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
