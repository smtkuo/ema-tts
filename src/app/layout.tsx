export const metadata = { title: "EMA TTS", description: "Local Turkish TTS with EMA Lightning" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
        {children}
      </body>
    </html>
  );
}
