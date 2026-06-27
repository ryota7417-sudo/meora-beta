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
            <li>「推し設定」とは、月額プラン加入ユーザーが特定のクリエイターを「推し」として設定する機能をいいます。</li>
            <li>「分配対象額」とは、売上金額からアプリストア手数料・返金額・対象取引に直接関連して発生したデータベース利用料を差し引いた金額をいいます。</li>
          </ol>
        </Section>

        <Section title="第3条（アカウント）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>ユーザーは、正確な情報を提供してアカウントを登録する必要があります。</li>
            <li>アカウントの管理責任はユーザーにあり、第三者への貸与・譲渡はできません。</li>
            <li>当社は、規約違反その他合理的な理由がある場合、アカウントを停止または削除できるものとします。</li>
            <li>本サービスは13歳以上の方を対象としています。13歳未満の方は本サービスを利用できません。13歳以上18歳未満の未成年者は、保護者の同意を得た上でご利用ください。</li>
          </ol>
        </Section>

        <Section title="第4条（退会）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>ユーザーはいつでも本サービスから退会できます。退会の手続きは設定画面から行うことができます。</li>
            <li>退会した場合、アカウントに紐づくチャット履歴・キャラクター設定等のデータは当社の定める期間が経過した後に削除されます。</li>
            <li>退会時に有料プランが有効な場合、当該月末まで利用でき、その後自動的に解約されます。未使用の追加会話アイテムおよびスキン等のデジタルコンテンツは退会時に失効し、返金はいたしかねます。</li>
            <li>クリエイターとして未出金の収益残高がある場合は、退会前に必ず出金手続きを完了してください。退会後は出金請求ができなくなります。</li>
          </ol>
        </Section>

        <Section title="第5条（料金および決済）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>本サービスには無料プランと有料プラン（ライトプラン: 月額680円、スタンダードプラン: 月額1,480円）があります。</li>
            <li>追加会話アイテム（さくらんぼ: 290円、みかん: 480円、ぶどう: 980円）は買い切り型で、購入後180日間有効です。</li>
            <li>決済はStripeを通じて処理されます。決済に関する個人情報はStripe社のプライバシーポリシーに従い管理されます。</li>
            <li>月額プランは自動更新されます。解約はいつでも可能で、解約後は当該月の終了まで利用できます。</li>
            <li>デジタルコンテンツの性質上、購入後の返金は原則としてお受けできません。ただし、法令に基づく場合はこの限りではありません。</li>
          </ol>
        </Section>

        <Section title="第6条（禁止事項）">
          ユーザーは以下の行為を行ってはなりません。
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>法令または公序良俗に違反する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>他のユーザーまたは第三者の権利を侵害する行為</li>
            <li>アニメ・漫画・ゲーム・映画等の著作物を権利者の許諾なくアップロード・使用する行為</li>
            <li>AIの応答を悪用し、違法行為を誘導・助長する行為</li>
            <li>本サービスのリバースエンジニアリング、不正アクセス</li>
            <li>自動化ツール等を用いた大量のリクエスト送信</li>
            <li>未成年者に対する不適切な接触を目的とした利用</li>
          </ul>
        </Section>

        <Section title="第7条（AIの特性と免責）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>本サービスのAIは大規模言語モデルを使用しており、その応答は常に正確であるとは限りません。</li>
            <li>AIの応答は医療・法律・金融等の専門的助言に代わるものではありません。</li>
            <li>当社はAIの応答内容に起因する損害について、法令の定める範囲を超えて責任を負いません。</li>
            <li>当社は、精神的な危機に関する相談においてAIが専門機関への相談を促すよう設計していますが、その対応の完全性を保証するものではありません。</li>
          </ol>
        </Section>

        <Section title="第8条（クリエイター制度）">
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li><b>参加資格:</b> 当社が定める審査を通過したユーザーがクリエイターとして登録できます。</li>
            <li><b>販売可能なコンテンツ:</b> スキン、応援アイテム等、当社が別途定める基準に従ったデジタルコンテンツを販売できます。</li>
            <li><b>収益分配:</b>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>コンテンツの種類ごとに、分配対象額から別途定めるクリエイタープログラム規約に基づく割合をクリエイターへ還元します。</li>
                <li>追加会話アイテムはMEORA運営のみが販売し、クリエイターへの分配対象外です。</li>
                <li>具体的な分配率はクリエイター登録時に別途開示します。</li>
              </ul>
            </li>
            <li><b>推し設定（第2条5号）:</b> 月額プラン加入者のみ利用可能で、設定は1名まで、変更は原則として月1回です。推し設定されたクリエイターには当該ユーザーの月額プランにかかる分配対象額の一部が分配されます。</li>
            <li><b>出金条件:</b>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>最低出金額: 1,000円</li>
                <li>締日: 毎月末日</li>
                <li>振込時期: 翌月末日</li>
                <li>振込手数料は出金額から差し引きます。</li>
                <li>最低出金額未満の残高は翌月以降に繰り越されます。</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="第9条（知的財産権）">
          <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>本サービス（プラットフォーム・システム・UIを含む）に関する知的財産権は当社に帰属します。</li>
            <li>クリエイターが制作・登録したコンテンツに関するすべての知的財産権はクリエイターに帰属します。当社はコンテンツの知的財産権を取得しません。</li>
            <li>クリエイターは、本サービス上でユーザーにコンテンツを提供するために必要な限りにおいて、当社に対して非独占的・無償の利用許諾を付与するものとします。この許諾はクリエイター登録が有効な期間に限り有効です。</li>
            <li>ユーザーが作成したMEORAのキャラクター設定（名前・性格等）の権利はユーザーに帰属します。</li>
          </ol>
        </Section>

        <Section title="第10条（第三者サービス）">
          本サービスは、決済処理（Stripe）・認証基盤（Supabase）・AI応答生成（外部LLMプロバイダー）・ホスティング（Vercel）等の第三者サービスを利用しています。これら第三者サービスの利用規約・プライバシーポリシーについてはそれぞれの事業者のものが適用されます。
        </Section>

        <Section title="第11条（サービスの変更・停止）">
          当社は、事前の通知なく本サービスの内容を変更し、または提供を停止できるものとします。ただし、有料プランの変更については、合理的な期間を設けて事前に通知するよう努めます。
        </Section>

        <Section title="第12条（規約の変更）">
          当社は本規約を変更できるものとします。変更後の規約は、本サービス上に掲示した時点で効力を生じます。重要な変更については、合理的な方法で事前に通知します。
        </Section>

        <Section title="第13条（分離可能性）">
          本規約のいずれかの条項が法令等により無効または執行不能と判断された場合であっても、その他の条項は引き続き有効に存続するものとします。
        </Section>

        <Section title="第14条（準拠法・管轄）">
          本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
        </Section>

        <div style={{ marginTop: 24, padding: '12px 14px', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', fontSize: 13 }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>お問い合わせ</div>
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
