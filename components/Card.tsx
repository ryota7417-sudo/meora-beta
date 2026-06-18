export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[#e8ded0] bg-white p-4 shadow-[0_1px_8px_rgba(37,33,27,0.04)] ${className}`}>
      {children}
    </div>
  );
}
