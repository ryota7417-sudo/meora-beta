// キャラクターSVGコンポーネント
// 旧デフォルトキャラ（aoi/ruka/haruka）は廃止済み。現行は写真 or 名前イニシャルの
// プレースホルダで描画する CharAvatar / CharAvatarChat のみを使用する。

// ===== 写真対応アイコン =====
// photo（dataURL）があれば写真をアイコン表示（object-fit:cover・黒枠は呼び出し側で付与）。
// 無ければ名前イニシャルのプレースホルダにフォールバックする。
// 旧デフォルトキャラ（aoi/ruka/haruka）が廃止されたため、自作キャラ/マーケット入手キャラ
// は基本的にこのコンポーネントで描画する。

function initialOf(name: string): string {
  const trimmed = (name || '').trim();
  return trimmed ? Array.from(trimmed)[0] : '?';
}

// ダッシュボードのトーク一覧用（44pxの黒枠ボックス内に表示する前提）。
export function CharAvatar({ photo, name, size = 38 }: { photo?: string; name: string; size?: number }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        background: '#111',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.46),
        fontWeight: 800,
        letterSpacing: '0.02em',
      }}
    >
      {initialOf(name)}
    </div>
  );
}

// チャット吹き出し横用（40x40・黒枠付き）。
export function CharAvatarChat({ photo, name }: { photo?: string; name: string }) {
  if (photo) {
    return (
      <div style={{ flexShrink: 0, width: 40, height: 40, border: '2px solid #111', overflow: 'hidden', background: '#f0f0ea' }}>
        <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  return (
    <div
      style={{
        flexShrink: 0,
        width: 40,
        height: 40,
        border: '2px solid #111',
        background: '#111',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 800,
      }}
    >
      {initialOf(name)}
    </div>
  );
}
