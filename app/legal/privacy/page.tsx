'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{
      backgroundColor: '#f8f8f4',
      minHeight: '100vh',
      maxWidth: 480,
      margin: '0 auto',
      color: '#111',
      fontFamily: 'var(--font-body)',
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
        <span style={{ color: '#f7f5f0', fontSize: 15, fontWeight: 800 }}>プライバシーポリシー</span>
      </header>

      <main style={{ padding: '20px 16px 80px', lineHeight: 1.85, fontSize: 14 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, borderBottom: '2px solid #111', paddingBottom: 8 }}>
          プライバシーポリシー
        </h1>

        <p style={{ color: '#666', marginBottom: 16 }}>最終更新日: 2026年6月27日</p>

        <Section title="1. 収集する情報">
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li><b>アカウント情報:</b> メールアドレス、認証情報（Google認証の場合はGoogleアカウント情報）</li>
            <li><b>チャット履歴:</b> MEORAとの会話内容（AIの応答品質向上のため）</li>
            <li><b>キャラクター設定:</b> ユーザーが作成したMEORAの名前・性格等</li>
            <li><b>決済情報:</b> Stripeを通じた購入履歴（クレジットカード情報は当社では保持しません）</li>
            <li><b>利用状況:</b> メッセージ送信数、利用時間帯等のサービス利用データ</li>
            <li><b>デバイス情報:</b> IPアドレス、ブラウザ種別、OS情報</li>
          </ul>
        </Section>

        <Section title="2. 情報の利用目的">
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>本サービスの提供・運営・維持</li>
            <li>AIキャラクターの応答品質の向上</li>
            <li>ユーザーサポートへの対応</li>
            <li>決済処理および購入履歴の管理</li>
            <li>サービスの安全性の確保（不正利用の検知・防止）</li>
            <li>利用規約違反への対応</li>
            <li>サービス改善のための統計分析（個人を特定しない形で実施）</li>
          </ul>
        </Section>

        <Section title="3. 第三者への提供">
          当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li><b>決済処理:</b> Stripe, Inc.（決済処理に必要な範囲）</li>
            <li><b>認証:</b> Supabase, Inc.（認証基盤として利用）</li>
            <li><b>AI処理:</b> OpenAI, LLC（チャット応答生成のためにメッセージ内容を送信）</li>
            <li><b>ホスティング:</b> Vercel Inc.（サービス提供基盤）</li>
            <li><b>法令に基づく場合:</b> 法令の定めに基づく開示要請がある場合</li>
          </ul>
        </Section>

        <Section title="4. データの保管と管理">
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>ユーザーデータはSupabase社のクラウドサーバーに保存されます。</li>
            <li>通信はSSL/TLSにより暗号化されます。</li>
            <li>チャット履歴の一部はユーザーのデバイスのローカルストレージにも保存されます。</li>
            <li>クレジットカード情報はStripe社が管理し、当社のサーバーには保存されません。</li>
          </ul>
        </Section>

        <Section title="5. ユーザーの権利">
          ユーザーは以下の権利を有します。
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>自己の個人情報の開示請求</li>
            <li>個人情報の訂正・削除の請求</li>
            <li>アカウントの削除（設定画面から実施可能）</li>
          </ul>
          これらの請求は、下記のお問い合わせ先までご連絡ください。
        </Section>

        <Section title="6. Cookie等の使用">
          本サービスでは、認証状態の維持のためにCookieを使用します。ブラウザの設定によりCookieを無効にすることは可能ですが、本サービスの一部機能が利用できなくなる場合があります。
        </Section>

        <Section title="7. 未成年者の利用">
          本サービスは13歳以上を対象としています。13歳未満の方は保護者の同意の上でご利用ください。当社は、13歳未満であると知った場合、当該アカウントの情報を削除する場合があります。
        </Section>

        <Section title="8. ポリシーの変更">
          当社は本ポリシーを変更する場合があります。重要な変更を行う場合は、本サービス上で通知します。
        </Section>

        <div style={{ marginTop: 24, padding: '12px 14px', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', fontSize: 13 }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>お問い合わせ</div>
          <div>MEORA運営</div>
          <div>メール: info@aritude.com</div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{title}</h2>
      <div style={{ color: '#333' }}>{children}</div>
    </section>
  );
}
