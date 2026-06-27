'use client';

import Link from 'next/link';

export default function TermsPage() {
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
        <span style={{ color: '#f7f5f0', fontSize: 15, fontWeight: 800 }}>利用規約</span>
      </header>

      <main style={{ padding: '20px 16px 80px', lineHeight: 1.85, fontSize: 14 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, borderBottom: '2px solid #111', paddingBottom: 8 }}>
          MEORA 利用規約
        </h1>

        <p style={{ color: '#666', marginBottom: 16 }}>最終更新日: 2026年6月27日</p>

        <Section title="第1条（適用）">
          本規約は、MEORA運営（以下「当社」）が提供するAIキャラクターチャットサービス「MEORA」（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。
        </Section>

        <Section title="第2条（定義）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>「ユーザー」とは、本サービスを利用するすべての個人をいいます。</li>
            <li>「MEORA」とは、本サービス上で提供されるAIキャラクターをいいます。</li>
            <li>「クリエイター」とは、本サービス上でMEORAやスキン等のコンテンツを制作・販売するユーザーをいいます。</li>
            <li>「コンテンツ」とは、MEORAのキャラクター、スキン、応援アイテム等、本サービス上で提供される一切のデジタルコンテンツをいいます。</li>
          </ol>
        </Section>

        <Section title="第3条（アカウント）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>ユーザーは、正確な情報を提供してアカウントを登録する必要があります。</li>
            <li>アカウントの管理責任はユーザーにあり、第三者への貸与・譲渡はできません。</li>
            <li>当社は、規約違反その他合理的な理由がある場合、アカウントを停止または削除できるものとします。</li>
          </ol>
        </Section>

        <Section title="第4条（料金および決済）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>本サービスには無料プランと有料プラン（ライトプラン: 月額680円、スタンダードプラン: 月額1,480円）があります。</li>
            <li>追加会話アイテム（さくらんぼ: 290円、みかん: 480円、ぶどう: 980円）は買い切り型で、購入後180日間有効です。</li>
            <li>決済はStripeを通じて処理されます。決済に関する個人情報はStripe社のプライバシーポリシーに従い管理されます。</li>
            <li>月額プランは自動更新されます。解約はいつでも可能で、解約後は当該月の終了まで利用できます。</li>
            <li>デジタルコンテンツの性質上、購入後の返金は原則としてお受けできません。ただし、法令に基づく場合はこの限りではありません。</li>
          </ol>
        </Section>

        <Section title="第5条（禁止事項）">
          ユーザーは以下の行為を行ってはなりません。
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>法令または公序良俗に違反する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>他のユーザーまたは第三者の権利を侵害する行為</li>
            <li>AIの応答を悪用し、違法行為を誘導・助長する行為</li>
            <li>本サービスのリバースエンジニアリング、不正アクセス</li>
            <li>自動化ツール等を用いた大量のリクエスト送信</li>
            <li>未成年者に対する不適切な接触を目的とした利用</li>
          </ul>
        </Section>

        <Section title="第6条（AIの特性と免責）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>本サービスのAIは大規模言語モデルを使用しており、その応答は常に正確であるとは限りません。</li>
            <li>AIの応答は医療・法律・金融等の専門的助言に代わるものではありません。</li>
            <li>当社はAIの応答内容に起因する損害について、法令の定める範囲を超えて責任を負いません。</li>
            <li>当社は、精神的な危機に関する相談においてAIが専門機関への相談を促すよう設計していますが、その対応の完全性を保証するものではありません。</li>
          </ol>
        </Section>

        <Section title="第7条（知的財産権）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>本サービスおよびコンテンツに関する知的財産権は、当社またはクリエイターに帰属します。</li>
            <li>ユーザーが作成したMEORAのキャラクター設定（名前・性格等）の権利はユーザーに帰属しますが、本サービス上での利用に必要な範囲で当社に利用を許諾するものとします。</li>
          </ol>
        </Section>

        <Section title="第8条（サービスの変更・停止）">
          当社は、事前の通知なく本サービスの内容を変更し、または提供を停止できるものとします。ただし、有料プランの変更については、合理的な期間を設けて事前に通知するよう努めます。
        </Section>

        <Section title="第9条（規約の変更）">
          当社は本規約を変更できるものとします。変更後の規約は、本サービス上に掲示した時点で効力を生じます。重要な変更については、合理的な方法で事前に通知します。
        </Section>

        <Section title="第10条（準拠法・管轄）">
          本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
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
