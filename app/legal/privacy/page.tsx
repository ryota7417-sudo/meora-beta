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
            <li><b>チャット履歴:</b> ユーザーとMEORAの会話内容（ユーザー自身が過去の会話を参照するためにのみ使用します。AIの学習・改善には使用しません）</li>
            <li><b>キャラクター設定:</b> ユーザーが作成したMEORAの名前・性格等</li>
            <li><b>決済情報:</b> Stripeを通じた購入履歴（クレジットカード情報は当社では保持しません）</li>
            <li><b>利用状況:</b> メッセージ送信数、利用時間帯等のサービス利用データ</li>
            <li><b>デバイス情報:</b> IPアドレス、ブラウザ種別、OS情報</li>
            <li><b>クリエイター情報（クリエイター登録者のみ）:</b> 振込先口座情報、クリエイタープロフィール、販売コンテンツ情報、収益・出金履歴</li>
          </ul>
        </Section>

        <Section title="2. 情報の利用目的">
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>本サービスの提供・運営・維持</li>
            <li>ユーザーが過去の会話履歴を参照できる機能の提供</li>
            <li>ユーザーサポートへの対応</li>
            <li>決済処理および購入履歴の管理</li>
            <li>クリエイターへの収益分配計算および振込処理</li>
            <li>サービスの安全性の確保（不正利用の検知・防止）</li>
            <li>利用規約違反への対応</li>
            <li>サービス改善のための統計分析（個人を特定しない形で実施）</li>
            <li>法令に基づく義務の履行（税務申告、行政機関への報告等）</li>
          </ul>
        </Section>

        <Section title="3. 第三者への提供">
          当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li><b>決済処理:</b> Stripe, Inc.（決済処理に必要な範囲。カード情報は当社に送信されません）</li>
            <li><b>認証・データ基盤:</b> Supabase, Inc.（認証・データベース基盤として利用）</li>
            <li><b>AI処理:</b> OpenAI, LLC（チャット応答生成のためにメッセージ内容を送信。送信されたデータはOpenAI社のプライバシーポリシーに従い取り扱われます）</li>
            <li><b>ホスティング:</b> Vercel Inc.（サービス提供基盤）</li>
            <li><b>振込処理:</b> 金融機関（クリエイターへの収益振込に必要な最小限の情報）</li>
            <li><b>法令に基づく場合:</b> 裁判所・行政機関等からの適法な要請がある場合</li>
            <li><b>事業承継:</b> 合併・事業譲渡等の際に、適切な守秘義務を課した上で引継ぎ先に提供する場合</li>
          </ul>
        </Section>

        <Section title="4. データの保管と管理">
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>ユーザーデータはSupabase社のクラウドサーバーに保存されます。</li>
            <li>通信はSSL/TLSにより暗号化されます。</li>
            <li>チャット履歴の一部はユーザーのデバイスのローカルストレージにも保存されます。</li>
            <li>クレジットカード情報はStripe社が管理し、当社のサーバーには保存されません。</li>
            <li>クリエイターの振込先口座情報は、出金処理に必要な期間に限り保管し、登録解除後は速やかに削除します。</li>
          </ul>
        </Section>

        <Section title="5. データ保存期間">
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li><b>チャット履歴:</b> アカウント有効期間中、および退会後90日間保存後削除</li>
            <li><b>アカウント情報:</b> 退会後90日間保存後削除（法令上の義務がある場合はこの限りではありません）</li>
            <li><b>購入履歴・決済記録:</b> 関連法令（電子帳簿保存法等）に従い、最長7年間保存</li>
            <li><b>クリエイター収益履歴:</b> 関連法令に従い、最長7年間保存</li>
            <li><b>ログ情報（不正利用調査用）:</b> 最長6ヶ月保存後削除</li>
          </ul>
        </Section>

        <Section title="6. ユーザーの権利">
          ユーザーは以下の権利を有します。
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>自己の個人情報の開示請求</li>
            <li>個人情報の訂正・削除の請求</li>
            <li>アカウントの削除（設定画面から実施可能）</li>
          </ul>
          これらの請求は、下記のお問い合わせ先までご連絡ください。
        </Section>

        <Section title="7. Cookie等の使用">
          本サービスでは、認証状態の維持のためにCookieを使用します。ブラウザの設定によりCookieを無効にすることは可能ですが、本サービスの一部機能が利用できなくなる場合があります。
        </Section>

        <Section title="8. 未成年者の利用">
          本サービスは13歳以上を対象としています。13歳未満の方は本サービスを利用できません。当社は、13歳未満であると判明した場合、当該アカウントを削除します。13歳以上18歳未満の未成年者は保護者の同意を得た上でご利用ください。
        </Section>

        <Section title="9. 個人情報の安全管理">
          当社は、収集した個人情報の漏えい・滅失・毀損の防止のため、適切なセキュリティ対策を実施します。従業員に対する教育・監督を行い、個人情報への不正アクセスを防止します。
        </Section>

        <Section title="10. 個人情報保護法に関する事項">
          当社は個人情報の保護に関する法律（個人情報保護法）を遵守します。個人情報に関するご相談・苦情は下記のお問い合わせ先までご連絡ください。また、個人情報保護委員会への申告等、法令に定める権利行使は妨げません。
        </Section>

        <Section title="11. 国際的なデータ転送">
          本サービスが利用する第三者サービス（Supabase、Vercel、Stripe、AI処理事業者等）のサーバーは日本国外に所在する場合があります。これらのサービスは、それぞれ適切なデータ保護措置を講じており、当社は適切な契約等に基づきデータ転送を行います。
        </Section>

        <Section title="12. ポリシーの変更">
          当社は本ポリシーを変更する場合があります。重要な変更を行う場合は、本サービス上で通知します。
        </Section>

        <div style={{ marginTop: 24, padding: '12px 14px', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', fontSize: 13 }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>個人情報取扱事業者</div>
          <div>Aritude（MEORA運営）</div>
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
