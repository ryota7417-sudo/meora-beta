'use client';

import Link from 'next/link';

export default function CommercePage() {
  return (
    <div style={{
      backgroundColor: '#f8f8f4',
      minHeight: '100vh',
      maxWidth: 480,
      margin: '0 auto',
      color: '#111',
      fontFamily: 'inherit',
    }}>
      <header style={{
        background: '#111',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '2px solid #111',
      }}>
        <Link href="/settings" style={{ color: '#f7f5f0', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
          ← 戻る
        </Link>
        <span style={{ color: '#f7f5f0', fontSize: 15, fontWeight: 800 }}>特定商取引法に基づく表示</span>
      </header>

      <main style={{ padding: '20px 16px 80px', lineHeight: 1.85, fontSize: 14 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, borderBottom: '2px solid #111', paddingBottom: 8 }}>
          特定商取引法に基づく表示
        </h1>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111' }}>
          <tbody>
            <Row label="事業者名" value="Aritude" />
            <Row label="代表者" value="松岡亮汰" />
            <Row label="所在地" value="〒150-0044 東京都渋谷区円山町5番3号 MIEUX渋谷ビル8階" />
            <Row label="電話番号" value="電話番号は設けておりません。お問い合わせはメール（info@aritude.com）にてご連絡ください。" />
            <Row label="メールアドレス" value="info@aritude.com" />
            <Row label="販売URL" value="https://meora.aritude.com" />
            <Row label="販売価格" value={
              <div>
                <div>【月額プラン】</div>
                <div>- ライトプラン: 680円（税込）/月</div>
                <div>- スタンダードプラン: 1,480円（税込）/月</div>
                <div style={{ marginTop: 4 }}>【追加会話アイテム】</div>
                <div>- さくらんぼ: 290円（税込）</div>
                <div>- みかん: 480円（税込）</div>
                <div>- ぶどう: 980円（税込）</div>
                <div style={{ marginTop: 4 }}>【スキン・応援アイテム】</div>
                <div>- 300円〜99,999円（税込、クリエイターにより異なる）</div>
              </div>
            } />
            <Row label="販売価格以外の必要料金" value="インターネット接続料金、通信料金はお客様のご負担となります。" />
            <Row label="支払方法" value="クレジットカード（Stripe経由）" />
            <Row label="支払時期" value="月額プラン: 申込時に初回決済、以降毎月自動決済。単品購入: 購入時に即時決済。" />
            <Row label="商品の引渡し時期" value="決済完了後、直ちにサービス上で利用可能となります。" />
            <Row label="返品・キャンセル" value="デジタルコンテンツの性質上、購入後の返品・返金はお受けできません。ただし、法令に基づく場合はこの限りではありません。月額プランの解約は次回更新日の前日まで可能です。" />
            <Row label="動作環境" value="モダンブラウザ（Chrome、Safari、Firefox、Edge）の最新版。インターネット接続が必要です。" />
            <Row label="申込みの撤回" value="月額プランはいつでも解約可能です。解約した場合、当該月の終了まで利用できます。" />
          </tbody>
        </table>

        <div style={{ marginTop: 20, padding: '12px 14px', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', fontSize: 13, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>注記</div>
          <div>お問い合わせはメール（info@aritude.com）にて承ります。特定商取引法第11条ただし書に基づき、消費者からの請求があった場合には電話番号を遅滞なく開示いたします。</div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr style={{ borderBottom: '1px solid #ddd' }}>
      <td style={{
        padding: '10px 12px',
        fontWeight: 800,
        fontSize: 13,
        verticalAlign: 'top',
        width: '35%',
        background: '#f7f5f0',
        borderRight: '1px solid #ddd',
      }}>
        {label}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 13 }}>
        {value}
      </td>
    </tr>
  );
}
