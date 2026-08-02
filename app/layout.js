import "./globals.css";

export const metadata = {
  title: "My Chatbot",
  description: "AI chatbot pakai DeepSeek API",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
