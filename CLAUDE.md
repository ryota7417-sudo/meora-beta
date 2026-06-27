@AGENTS.md

# MEORA プロジェクトルール

## デザイン世界観
- テーマ: レトロ x AI
- フォント: Nosutaru-dotMPlusH-10-Regular（ドット系レトロフォント）
- UI: 方眼紙背景 x 白カード x 黒太枠 x 影（boxShadow: 4px 4px 0 #111）
- アイコン: 黒線モノクロSVG（components/ui/Icons.tsx を参照）
- 配色: 背景 #f7f5f0 / 文字 #111 / アクセント #e8568a
- 絵文字（色付きピクトグラム）はアプリUI内で使用禁止。矢印等の記号は可

## 技術スタック
- Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS 4
- Supabase (認証のみ。DBテーブルは未使用)
- OpenAI gpt-4o-mini (チャットAI)
- localStorage (キャラ・チャット履歴の永続化)
- Vercel (ホスティング)

## AIモデル
- gpt-4o-mini を使用（2026-06-22 に gpt-5.4-mini から切替）
- 変更時は route.ts, supabase-schema.sql, APP_OVERVIEW.txt を同時更新すること

## 開発ルール
- 開発後は必ず検証 → 修正 → 再検証のサイクルを回す
- 本番反映が必要な変更は commit + push まで完了させる（指示がある場合）
- 認証が必要なAPIルートでは Supabase getUser() でサーバー検証を行うこと（getSession() は使わない）
