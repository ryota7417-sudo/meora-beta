-- =============================================================================
-- MEORA Supabase DB Schema
-- 話し相手AIチャットアプリ用データベーススキーマ
--
-- 全テーブル: UTC保存。金額は整数(円)。estimated_cost_jpyのみnumeric(10,4)。
-- RLS: 全テーブルで有効化。ポリシーはテーブル直後に定義。
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. 拡張機能
-- ---------------------------------------------------------------------------
-- pgcrypto: gen_random_uuid() 用（Supabaseではデフォルト有効だが念のため）
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ===========================================================================
-- 1. user_profiles — ユーザープロフィール
--    auth.users と 1:1。HP残量・プラン種別を管理。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name     TEXT,
  free_hp          INTEGER     NOT NULL DEFAULT 30,    -- 毎日付与の無料HP
  plan_hp          INTEGER     NOT NULL DEFAULT 0,     -- 月額プランHP
  purchased_hp     INTEGER     NOT NULL DEFAULT 0,     -- 単品購入HP
  plan_type        TEXT        NOT NULL DEFAULT 'free', -- free / basic / premium
  daily_hp_reset_at TIMESTAMPTZ,                       -- 次回の無料HP付与時刻
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが自分のIDでINSERT
CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 自分のレコードのみSELECT
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 自分のレコードのみUPDATE
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ===========================================================================
-- 2. characters — キャラクター
--    ユーザーが所有するキャラクター。マーケットで購入したものも含む。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS characters (
  id               TEXT        PRIMARY KEY,             -- キャラID (market-moco 等)
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  personality      TEXT,
  category         TEXT,
  photo            TEXT,                                -- dataURL or storage path
  sprites          JSONB,                               -- [{type, dataUrl}]
  hp               INTEGER     NOT NULL DEFAULT 100,
  max_hp           INTEGER     NOT NULL DEFAULT 100,
  last_reset_date  TEXT,
  role             TEXT,
  job              TEXT,
  color            TEXT,
  tier             TEXT,                                -- basic / advanced
  user_created     BOOLEAN     NOT NULL DEFAULT false,
  sellable         BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- 自分のレコードのみ ALL
CREATE POLICY "characters_all_own"
  ON characters FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ===========================================================================
-- 3. chat_messages — チャット履歴
--    改ざん防止のためUPDATE/DELETEポリシーなし。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id               BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  character_id     TEXT        NOT NULL,
  role             TEXT        NOT NULL,                -- user / assistant
  content          TEXT        NOT NULL,
  token_count      INTEGER,                             -- このメッセージのトークン数推定
  summarized       BOOLEAN     NOT NULL DEFAULT false,  -- 要約済みかどうか
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 自分のレコードのみSELECT
CREATE POLICY "chat_messages_select_own"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 自分のIDでINSERT
CREATE POLICY "chat_messages_insert_own"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ===========================================================================
-- 4. chat_summaries — 会話要約
--    INSERT/UPDATE は service_role 経由のみ（APIサーバーから）。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS chat_summaries (
  id               BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  character_id     TEXT        NOT NULL,
  summary          TEXT        NOT NULL,                -- 要約テキスト
  token_count      INTEGER,                             -- 要約のトークン数
  messages_from    BIGINT,                              -- 要約対象の最初のmessage id
  messages_to      BIGINT,                              -- 要約対象の最後のmessage id
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

-- 自分のレコードのみSELECT
CREATE POLICY "chat_summaries_select_own"
  ON chat_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT/UPDATE は service_role のみ (RLSをバイパス)
-- → ポリシーを定義しないことで、anon/authenticated からの INSERT/UPDATE を拒否


-- ===========================================================================
-- 5. character_memories — キャラクターの重要記憶
--    AIが会話から抽出した事実ベースの記憶。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS character_memories (
  id                 BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id            UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  character_id       TEXT        NOT NULL,
  content            TEXT        NOT NULL,              -- 記憶内容（短い事実ベース）
  category           TEXT        NOT NULL,              -- profile / preference / dislike / relationship / promise / goal / ongoing_topic / important_event / communication_style / other
  importance         INTEGER     NOT NULL DEFAULT 5,    -- 1-10
  confidence         INTEGER     NOT NULL DEFAULT 5,    -- 1-10 信頼度
  source_message_id  BIGINT,                            -- 元になった会話ID
  user_requested     BOOLEAN     NOT NULL DEFAULT false, -- ユーザーが明示的に保存を希望
  active             BOOLEAN     NOT NULL DEFAULT true,  -- 有効状態
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_memories ENABLE ROW LEVEL SECURITY;

-- 自分のレコードのみSELECT
CREATE POLICY "character_memories_select_own"
  ON character_memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 自分のレコードのみUPDATE（activeフラグの切替のみを想定）
CREATE POLICY "character_memories_update_own"
  ON character_memories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT は service_role のみ (ポリシー定義なし → anon/authenticated からの INSERT 拒否)


-- ===========================================================================
-- 6. memory_history — 記憶の更新履歴
--    記憶の変更を追跡するための監査ログ。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS memory_history (
  id                 BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  memory_id          BIGINT      NOT NULL REFERENCES character_memories (id) ON DELETE CASCADE,
  action             TEXT        NOT NULL,              -- created / updated / deactivated / reactivated
  old_content        TEXT,
  new_content        TEXT,
  reason             TEXT,                              -- 更新理由
  source_message_id  BIGINT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE memory_history ENABLE ROW LEVEL SECURITY;

-- 自分のレコードのみSELECT（memory経由でuser_idを確認）
CREATE POLICY "memory_history_select_own"
  ON memory_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM character_memories cm
      WHERE cm.id = memory_history.memory_id
        AND cm.user_id = auth.uid()
    )
  );

-- INSERT は service_role のみ (ポリシー定義なし)


-- ===========================================================================
-- 7. api_usage_logs — API利用量ログ
--    各APIリクエストのトークン数・コスト・HP消費を記録。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id               BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          UUID          NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  character_id     TEXT,
  model            TEXT          NOT NULL,              -- gpt-4o-mini 等
  input_tokens     INTEGER       NOT NULL,
  output_tokens    INTEGER       NOT NULL,
  total_tokens     INTEGER       NOT NULL,
  cached_tokens    INTEGER       NOT NULL DEFAULT 0,
  estimated_cost_jpy NUMERIC(10,4),                    -- 推定API原価（円）小数4桁
  request_type     TEXT          NOT NULL,              -- chat / summarize / memory_extract / memory_merge / safety_check / other
  plan_type        TEXT,                                -- free / basic / premium
  hp_consumed      INTEGER       NOT NULL DEFAULT 0,
  error            BOOLEAN       NOT NULL DEFAULT false,
  error_message    TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- 自分のレコードのみSELECT
CREATE POLICY "api_usage_logs_select_own"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT は service_role のみ (ポリシー定義なし)


-- ===========================================================================
-- 8. purchases — 購入履歴
--    HP購入・スキン購入・サブスクリプション等の決済記録。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS purchases (
  id               BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  item_type        TEXT        NOT NULL,                -- hp / skin / subscription
  item_id          TEXT,
  amount_jpy       INTEGER     NOT NULL,                -- 金額（円・整数）
  hp_granted       INTEGER     NOT NULL DEFAULT 0,      -- 付与HP
  store_fee_jpy    INTEGER     NOT NULL DEFAULT 0,      -- ストア手数料（円）
  status           TEXT        NOT NULL DEFAULT 'completed', -- pending / completed / refunded
  stripe_session_id TEXT,                                   -- Stripe Checkout Session ID
  character_id     TEXT,                                    -- HP付与対象のキャラクターID
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON purchases (stripe_session_id);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- 自分のレコードのみSELECT
CREATE POLICY "purchases_select_own"
  ON purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT / UPDATE は service_role のみ (ポリシー定義なし)


-- ===========================================================================
-- 9. creator_profiles — クリエイタープロフィール
--    マーケットに出品するクリエイターの情報。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS creator_profiles (
  id               TEXT        PRIMARY KEY,             -- creator ID
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name     TEXT        NOT NULL,
  handle           TEXT,
  bio              TEXT,
  followers_count  INTEGER     NOT NULL DEFAULT 0,
  rating           NUMERIC(2,1),
  banner_bg        TEXT,
  avatar_bg        TEXT,
  stripe_account_id TEXT,                              -- Stripe Connect Express アカウントID
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT は全員
CREATE POLICY "creator_profiles_select_all"
  ON creator_profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT は自分のuser_idでのみ
CREATE POLICY "creator_profiles_insert_own"
  ON creator_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE は自分のレコードのみ
CREATE POLICY "creator_profiles_update_own"
  ON creator_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ===========================================================================
-- 10. market_listings — マーケット出品
--     キャラクター・フード・スキン等のアイテム出品。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS market_listings (
  id               TEXT        PRIMARY KEY,
  creator_id       TEXT        NOT NULL REFERENCES creator_profiles (id) ON DELETE CASCADE,
  type             TEXT        NOT NULL,                -- character / food / skin
  name             TEXT        NOT NULL,
  description      TEXT,
  price            INTEGER     NOT NULL,                -- 価格（円）
  photo_url        TEXT,
  sprite_idle      TEXT,
  hp_bonus         INTEGER,
  status           TEXT        NOT NULL DEFAULT 'active', -- active / inactive / deleted
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

-- SELECT は全員
CREATE POLICY "market_listings_select_all"
  ON market_listings FOR SELECT
  TO authenticated
  USING (true);

-- INSERT は自分が作成者のレコードのみ
CREATE POLICY "market_listings_insert_own"
  ON market_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = creator_id
        AND cp.user_id = auth.uid()
    )
  );

-- UPDATE は自分が作成者のレコードのみ
CREATE POLICY "market_listings_update_own"
  ON market_listings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = market_listings.creator_id
        AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = creator_id
        AND cp.user_id = auth.uid()
    )
  );


-- ===========================================================================
-- 11. creator_distributions — クリエイター分配
--     月次のクリエイター売上分配記録。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS creator_distributions (
  id                  BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id          TEXT        NOT NULL REFERENCES creator_profiles (id) ON DELETE CASCADE,
  period_start        DATE        NOT NULL,
  period_end          DATE        NOT NULL,
  total_sales_jpy     INTEGER     NOT NULL DEFAULT 0,
  store_fee_jpy       INTEGER     NOT NULL DEFAULT 0,
  refund_jpy          INTEGER     NOT NULL DEFAULT 0,
  chat_api_cost_jpy   INTEGER     NOT NULL DEFAULT 0,
  summary_api_cost_jpy INTEGER    NOT NULL DEFAULT 0,
  memory_api_cost_jpy INTEGER     NOT NULL DEFAULT 0,
  total_api_cost_jpy  INTEGER     NOT NULL DEFAULT 0,
  distributable_jpy   INTEGER     NOT NULL DEFAULT 0,   -- 分配対象額
  creator_share_jpy   INTEGER     NOT NULL DEFAULT 0,   -- クリエイター分(80%)
  platform_share_jpy  INTEGER     NOT NULL DEFAULT 0,   -- MEORA運営分(20%)
  status              TEXT        NOT NULL DEFAULT 'pending', -- pending / confirmed / paid
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE creator_distributions ENABLE ROW LEVEL SECURITY;

-- 自分のcreator_idのレコードのみSELECT
CREATE POLICY "creator_distributions_select_own"
  ON creator_distributions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = creator_distributions.creator_id
        AND cp.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE は service_role のみ (ポリシー定義なし)


-- ===========================================================================
-- 12. rate_limits — レート制限
--     ユーザーごとのAPI呼び出し回数管理。service_role経由でのみアクセス。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id               BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  minute_count     INTEGER     NOT NULL DEFAULT 0,
  hour_count       INTEGER     NOT NULL DEFAULT 0,
  day_count        INTEGER     NOT NULL DEFAULT 0,
  minute_reset_at  TIMESTAMPTZ,
  hour_reset_at    TIMESTAMPTZ,
  day_reset_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLSは有効だがポリシーなし → anon/authenticated からは一切アクセス不可
-- service_role はRLSをバイパスするため、APIサーバーからのみ操作可能


-- ===========================================================================
-- 13. app_config — アプリ設定
--     環境変数の代替/補助。key-value形式。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS app_config (
  key              TEXT        PRIMARY KEY,
  value            JSONB       NOT NULL,
  description      TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- SELECT は全員（anon含む）
CREATE POLICY "app_config_select_all"
  ON app_config FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE は service_role のみ (ポリシー定義なし)


-- ===========================================================================
-- インデックス
-- ===========================================================================

-- chat_messages: 会話履歴の時系列取得
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_char_created
  ON chat_messages (user_id, character_id, created_at);

-- chat_messages: 未要約メッセージの検索
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_char_summarized
  ON chat_messages (user_id, character_id, summarized);

-- chat_summaries: ユーザー×キャラの要約検索
CREATE INDEX IF NOT EXISTS idx_chat_summaries_user_char
  ON chat_summaries (user_id, character_id);

-- character_memories: アクティブな記憶の検索
CREATE INDEX IF NOT EXISTS idx_character_memories_user_char_active
  ON character_memories (user_id, character_id, active);

-- api_usage_logs: ユーザーの利用量を時系列で取得
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_created
  ON api_usage_logs (user_id, created_at);

-- api_usage_logs: リクエスト種別ごとの集計
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_char_type
  ON api_usage_logs (user_id, character_id, request_type);

-- rate_limits: ユーザーIDで高速検索
CREATE INDEX IF NOT EXISTS idx_rate_limits_user
  ON rate_limits (user_id);


-- ===========================================================================
-- updated_at 自動更新トリガー
-- ===========================================================================

-- 汎用のupdated_atトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_profiles
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- characters
DROP TRIGGER IF EXISTS trg_characters_updated_at ON characters;
CREATE TRIGGER trg_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- chat_summaries
DROP TRIGGER IF EXISTS trg_chat_summaries_updated_at ON chat_summaries;
CREATE TRIGGER trg_chat_summaries_updated_at
  BEFORE UPDATE ON chat_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- character_memories
DROP TRIGGER IF EXISTS trg_character_memories_updated_at ON character_memories;
CREATE TRIGGER trg_character_memories_updated_at
  BEFORE UPDATE ON character_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- creator_profiles
DROP TRIGGER IF EXISTS trg_creator_profiles_updated_at ON creator_profiles;
CREATE TRIGGER trg_creator_profiles_updated_at
  BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- market_listings
DROP TRIGGER IF EXISTS trg_market_listings_updated_at ON market_listings;
CREATE TRIGGER trg_market_listings_updated_at
  BEFORE UPDATE ON market_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- app_config
DROP TRIGGER IF EXISTS trg_app_config_updated_at ON app_config;
CREATE TRIGGER trg_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- rate_limits
DROP TRIGGER IF EXISTS trg_rate_limits_updated_at ON rate_limits;
CREATE TRIGGER trg_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ===========================================================================
-- 新規ユーザー登録時に user_profiles を自動作成するトリガー
-- ===========================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, daily_hp_reset_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'ユーザー'),
    now() + INTERVAL '1 day'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ===========================================================================
-- app_config 初期データ
-- ===========================================================================
INSERT INTO app_config (key, value, description) VALUES
  ('model',                    '"gpt-4o-mini"'::jsonb,   '使用するAIモデル名'),
  ('model_input_price_per_1m', '0.15'::jsonb,            'モデル入力価格 (USD / 1Mトークン)'),
  ('model_output_price_per_1m','0.60'::jsonb,            'モデル出力価格 (USD / 1Mトークン)'),
  ('hp_per_message',           '5'::jsonb,               '1メッセージあたりのHP消費'),
  ('free_daily_hp',            '30'::jsonb,              '毎日付与される無料HP'),
  ('max_recent_messages',      '40'::jsonb,              'コンテキストに含める最大直近メッセージ数'),
  ('max_input_tokens',         '5000'::jsonb,            '入力トークン上限'),
  ('max_output_tokens',        '500'::jsonb,             '出力トークン上限'),
  ('max_summary_tokens',       '1000'::jsonb,            '要約トークン上限'),
  ('max_memory_per_request',   '20'::jsonb,              '1リクエストに含める記憶の最大数'),
  ('max_memory_tokens',        '800'::jsonb,             '記憶コンテキストのトークン上限'),
  ('rate_limit_per_minute',    '10'::jsonb,              'レート制限: 1分あたり'),
  ('rate_limit_per_hour',      '60'::jsonb,              'レート制限: 1時間あたり'),
  ('rate_limit_per_day',       '200'::jsonb,             'レート制限: 1日あたり'),
  ('cost_alert_notice_jpy',    '150'::jsonb,             'コストアラート: 注意 (円/日)'),
  ('cost_alert_warning_jpy',   '250'::jsonb,             'コストアラート: 警告 (円/日)'),
  ('cost_alert_critical_jpy',  '400'::jsonb,             'コストアラート: 危険 (円/日)'),
  ('creator_share_pct',        '80'::jsonb,              'クリエイター分配率 (%)'),
  ('platform_share_pct',       '20'::jsonb,              'プラットフォーム分配率 (%)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();


-- ===========================================================================
-- 14. subscriptions -- サブスクリプション管理
--     Stripe Subscription と同期。プラン変更・解約はすべてここで管理。
-- ===========================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id             UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  stripe_customer_id  TEXT        NOT NULL,
  stripe_subscription_id TEXT     NOT NULL UNIQUE,
  plan_id             TEXT        NOT NULL DEFAULT 'free',  -- free / light / standard
  status              TEXT        NOT NULL DEFAULT 'active', -- active / canceled / past_due / incomplete
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN   NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions (stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 自分のレコードのみSELECT
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT / UPDATE は service_role のみ (ポリシー定義なし)

-- updated_at 自動更新
DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ===========================================================================
-- 完了
-- ===========================================================================
-- テーブル数: 13
-- RLSポリシー: 全テーブルで有効化済み
-- インデックス: 7個
-- トリガー: updated_at自動更新 (8テーブル) + 新規ユーザー自動プロフィール作成
-- 初期データ: app_config 19件
--
-- 適用方法:
--   Supabaseダッシュボード > SQL Editor にこのファイルの内容を貼り付けて実行
--   または: supabase db push (Supabase CLI使用時)
