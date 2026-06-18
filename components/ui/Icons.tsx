// レトロ×AI 世界観の黒線モノクロSVGアイコン群。
// 共通仕様: currentColor を stroke に使い、塗りなし（fill="none"）の黒線で統一。
// 色付き絵文字の代替として使用する。サイズは props.size（既定 16）。

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

function base(size: number, color: string): React.SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    xmlns: 'http://www.w3.org/2000/svg',
  };
}

// プレゼント / アイテム（箱にリボン）。🎁 の代替。
export function GiftIcon({ size = 16, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size, color)} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" style={style}>
      <rect x="3" y="9" width="18" height="11" />
      <line x1="3" y1="13" x2="21" y2="13" />
      <line x1="12" y1="9" x2="12" y2="20" />
      <path d="M12 9C12 9 9 9 8 7.5C7.3 6.4 8 5 9.2 5C11 5 12 9 12 9Z" />
      <path d="M12 9C12 9 15 9 16 7.5C16.7 6.4 16 5 14.8 5C13 5 12 9 12 9Z" />
    </svg>
  );
}

// ハート（塗りなし・モノクロ）。♥ の代替。投げ銭/応援。
export function HeartIcon({ size = 16, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size, color)} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 20S4 14.5 4 9.2C4 6.5 6 5 8 5C9.8 5 11 6 12 7.3C13 6 14.2 5 16 5C18 5 20 6.5 20 9.2C20 14.5 12 20 12 20Z" />
    </svg>
  );
}

// 星（塗りなし・モノクロ）。⭐ の代替。
export function StarIcon({ size = 16, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size, color)} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 3L14.6 8.6L20.5 9.3L16 13.3L17.3 19.2L12 16.1L6.7 19.2L8 13.3L3.5 9.3L9.4 8.6Z" />
    </svg>
  );
}

// ショッピングバッグ。🛍 の代替。
export function BagIcon({ size = 16, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size, color)} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" style={style}>
      <path d="M5 8H19L18 21H6Z" />
      <path d="M8.5 8V6.5C8.5 4.6 10 3 12 3C14 3 15.5 4.6 15.5 6.5V8" />
    </svg>
  );
}

// レンチ（工具）。🛠 の代替。準備中トースト用。
export function WrenchIcon({ size = 16, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size, color)} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M15.5 4.5C13.8 4.5 12.5 5.8 12.5 7.5C12.5 8.1 12.7 8.7 13 9.2L4.5 17.7L6.3 19.5L14.8 11C15.3 11.3 15.9 11.5 16.5 11.5C18.2 11.5 19.5 10.2 19.5 8.5C19.5 8 19.4 7.6 19.2 7.2L17 9.4L15.6 8L17.8 5.8C17.4 5.6 16.9 4.5 15.5 4.5Z" />
    </svg>
  );
}

// 通電/オンライン状態を示すドット枠（🟢 の代替）。塗りなし二重丸。
export function StatusDotIcon({ size = 14, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size, color)} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" fill={color} stroke="none" />
    </svg>
  );
}

// チェック。✓ の代替（任意でモノクロSVGに揃える用途）。
export function CheckIcon({ size = 16, color = 'currentColor', strokeWidth = 2.4, style }: IconProps) {
  return (
    <svg {...base(size, color)} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" style={style}>
      <path d="M4 12.5L9.5 18L20 6" />
    </svg>
  );
}
