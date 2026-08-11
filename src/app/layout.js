import "./globals.css";
import NotificationChecker from "@/components/NotificationChecker";
import Toast from "@/components/Toast";

export const metadata = {
  title: "Life Lens AI",
  description: "Manage memories, documents, and life events in one timeline.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <NotificationChecker />
        <Toast />
        {children}
      </body>
    </html>
  );
}
