export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;800&display=swap"
        rel="stylesheet"
      />
      <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
        {children}
      </div>
    </>
  );
}
