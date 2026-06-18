# 専門AI（ジョブ + AIタイプ）選択機能 — アーカイブ

これは一旦アーカイブした **専門AI（ジョブ + AIタイプ）選択機能** です。
2026-06-15 のピボット（「専門AIチーム」→「気軽な話し相手キャラ × クリエイターマーケット」への転換）で
オンボーディングのアクティブフローから退避しました。**削除ではなくアーカイブ**で、後日アップデートで復活する可能性があります。

## 含まれるもの

- `StepCharSelect.tsx`
  - `StepCharSelect` … キャラ選択 → ジョブ選択 → AIタイプ（tier）選択（subStep 1〜3）の専門AI選択コンポーネント
  - `StepHpSetting` … 専門AI選択直後に表示していたHP説明ステップ（選択結果 `selections` に依存するため一緒に退避）
  - 専門AI専用の型: `Selection` / `CharSelectId` / `JobId` / `AiTier`

## アーカイブの場所と理由

`archive/` はプロジェクト直下に置いてあり、Next.js の `app/` 配下ではないためルーティングに乗りません
（誤ってページとして公開されることを防ぐ目的）。`app/_archive/` に置く場合も `_` プレフィックスでルート化を防げますが、
ここでは「アクティブなアプリと完全に切り離す」ことを明確にするためプロジェクト直下の `archive/` を採用しました。

## 復活手順（要約）

ピボット前のオンボーディングは全6ステップ（0:スプラッシュ / 1:イントロ / 2:アカウント / 3:名前 / 4:アバター / 5:キャラ選択 / 6:HP設定）でした。
現在は **アバター作成（step4）までで完了 → ホームへ遷移** に短縮しています。

復活させる場合は `app/onboarding/page.tsx` に対して概ね以下を行います。

1. このファイルから `StepCharSelect` / `StepHpSetting` と型 `Selection` 等を import する
   （または onboarding 内に戻す）。
2. `OnboardingPage` に `selections` ステート（`useState<Selection[]>([])`）と
   `handleCharSelectDone(sels)` / `handleFinish` での `selections` 反映ロジックを戻す。
   - `handleFinish` で各 `Character` に `job` / `role` / `tier` を反映する処理（DEFAULT_CHARACTERS をベースに上書き）。
3. step ルーティングを再接続する:
   - `if (step === 4) return <StepAvatarCreate ... onNext={() => advanceStep(5)} />`
   - `if (step === 5) return <StepCharSelect onNext={handleCharSelectDone} onBack={() => advanceStep(4)} />`
   - `step === 6` で `<StepHpSetting ... />`（onFinish で保存）。
4. STEP 表示・プログレスドットを 1/4・2/4・3/4 → 1/5・2/5 … に戻す
   （ピボットで `StepAccount` `StepUserName` `StepAvatarCreate` の表記を /4 系へ変更済み）。

## 関連メモ

- `lib/store.ts` の `Character.tier`（`'basic' | 'advanced'`）は将来の再接続用に**残してあります**。
  現在アクティブコードからは書き込まれません（デフォルトのまま未設定）。
- tier に応じて将来 `inbox/AI_pronpt/{coding,designer,secretary,writer}/{basic|advanced}` の
  プロンプトを読み込む構想でした（ジョブ↔フォルダ対応: ライター→writer / デザイナー→designer / 秘書→secretary / coding は将来枠）。
