// MEORA オンボーディングの多言語辞書。
// 対象はオンボーディング(スプラッシュ / 説明スライド / アカウント作成 / キャラ作成)の
// 表示テキストのみ。マーケット・チャット・ダッシュボード・設定は対象外。
//
// 「MEORA」ロゴは全言語共通でそのまま。読みのみ各言語で切り替える。
// en / ko / zh-Hant はやさしく自然なトーンの AI 生成ドラフト(社長が後で微調整)。

export type Lang = 'ja' | 'en' | 'ko' | 'zh-Hant';

export const LANGS: Lang[] = ['ja', 'en', 'ko', 'zh-Hant'];

// スプラッシュのトグルに出すラベル(JP / EN / 한 / 繁)。
export const LANG_LABELS: Record<Lang, string> = {
  ja: 'JP',
  en: 'EN',
  ko: '한',
  'zh-Hant': '繁',
};

// localStorage キー。再訪・ステップ遷移・OAuth 戻りでも言語を保持する。
export const LANG_STORAGE_KEY = 'meora-lang';
export const DEFAULT_LANG: Lang = 'ja';

// 辞書の型(キー網羅を型で保証する)。
export type Dict = {
  // --- スプラッシュ (step0) ---
  splashRuby: string; // 「- ミオラ -」など各言語の読み
  splashTagline: string; // 「いつもそばに。僕と過ごすAI。」
  start: string; // 「はじめる →」
  // version 行は「v0.1.0 · MEORA」で全言語共通のため辞書に含めない。

  // --- 説明スライド (step1) ---
  slide1Title: string; // num はコード側で 01 / 03 等を共通生成
  slide1Body: string;
  slide2Title: string; // 改行は \n で表現
  slide2Body: string;
  slide3Title: string;
  slide3Body: string;
  navBack: string; // 「← 戻る」
  navSkip: string; // 「スキップ →」
  navNext: string; // 「次へ →」
  navToAccount: string; // 「アカウントを作成する →」

  // --- アカウント作成 (step2) ---
  accountTitle: string; // 「アカウントを作成」
  accountIntro: string; // 改行は \n
  googleLogin: string; // 「Googleでログイン」
  orDivider: string; // 「── または ──」
  emailLabel: string; // 「メールアドレス」
  passwordLabel: string; // 「パスワード」
  passwordPlaceholder: string; // 「8文字以上」
  passwordHint: string; // 「英字・数字を含む8文字以上」
  createAccount: string; // 「アカウントを作成 →」
  processing: string; // 「処理中...」
  termsPrefix: string; // 「作成することで」
  termsOfService: string; // 「利用規約」
  termsMiddle: string; // 「および」
  privacyPolicy: string; // 「プライバシーポリシー」
  termsSuffix: string; // 「に同意したものとみなされます。」
  haveAccountPrefix: string; // 「すでにアカウントをお持ちの方 → 」
  login: string; // 「ログイン」
  step1of2: string; // 「STEP 1/2」

  // --- キャラ作成 (step3) ---
  charCreateTitle: string; // 「キャラを作ろう」
  charPreviewName: string; // 「あなたのキャラ」
  charNameLabel: string; // 「キャラ名」
  required: string; // 「必須」
  charNamePlaceholder: string; // 「例: moco」
  photoLabel: string; // 「写真」
  photoSelect: string; // 「写真を選択 →」
  photoChange: string; // 「写真を変更 →」
  photoDelete: string; // 「写真を削除」
  photoSelectShort: string; // プレビュー内「写真を選択」
  photoHint: string; // 「お好きな画像を…(任意)」
  // --- スプライト登録（歩く庭用・最大5枚） ---
  spritesLabel: string; // 「キャラ画像（最大5枚）」
  spritesHint: string; // 「種類を選んで画像を登録すると、ホームの庭を歩きます。(任意)」
  spriteAdd: string; // 「画像を追加」
  spriteKindLabel: string; // 「種類」
  spriteWalkRight: string; // 「右に歩く」
  spriteWalkLeft: string; // 「左に歩く」
  spriteIdle: string; // 「止まる」
  spriteOther: string; // 「その他」
  spriteDelete: string; // 「削除」
  personalityLabel: string; // 「性格・口調」
  personalityPlaceholder: string;
  personalityHint: string; // 「ここに書いた内容が…」
  categoryLabel: string; // 「カテゴリ」
  categoryNone: string; // 「（選択しない）」
  // カテゴリ名(value は ja 固定。表示のみ翻訳)
  catHeal: string; // 癒し
  catLove: string; // 恋愛相談
  catVent: string; // 愚痴きき
  catStudy: string; // 勉強応援
  catOshi: string; // 推し活
  catFun: string; // おもしろ系
  step2of2: string; // 「STEP 2/2」

  // --- InheritPersonaCopy (step3 内) ---
  inheritTitle: string; // 「いま使っているAIの個性を引き継ぐ」
  inheritSteps: string; // ①②③ 説明
  inheritCopy: string; // 「プロンプトをコピー」
  inheritCopied: string; // 「コピーしました!」
  inheritPrompt: string; // コピーされる長文プロンプト本体
};

const ja: Dict = {
  splashRuby: '- ミオラ -',
  splashTagline: 'いつもそばに。僕と過ごすAI。',
  start: 'はじめる →',

  slide1Title: 'キャラクターと話そう',
  slide1Body:
    '気軽に話せるキャラクターのMEORA（ミオラ）だよ。自分だけのMEORAを作ったり、好きなMEORAを見つけたら一緒に過ごそう。',
  slide2Title: 'お腹がすいたら\nごはんで回復',
  slide2Body:
    'MEORAには「満腹度」があります。お話するとお腹がすきますが、毎日お食事が届いて回復します。',
  slide3Title: 'マーケットで\nキャラクターを追加しよう',
  slide3Body:
    'クリエイターが作ったMEORAをマーケットで見つけられます。お気に入りのMEORAと出会おう。',
  navBack: '← 戻る',
  navSkip: 'スキップ →',
  navNext: '次へ →',
  navToAccount: 'アカウントを作成する →',

  accountTitle: 'アカウントを作成',
  accountIntro: 'アカウントを作成して、あなただけの\nキャラクターたちと出会いましょう。',
  googleLogin: 'Googleでログイン',
  orDivider: '── または ──',
  emailLabel: 'メールアドレス',
  passwordLabel: 'パスワード',
  passwordPlaceholder: '8文字以上',
  passwordHint: '英字・数字を含む8文字以上',
  createAccount: 'アカウントを作成 →',
  processing: '処理中...',
  termsPrefix: '作成することで',
  termsOfService: '利用規約',
  termsMiddle: 'および',
  privacyPolicy: 'プライバシーポリシー',
  termsSuffix: 'に同意したものとみなされます。',
  haveAccountPrefix: 'すでにアカウントをお持ちの方 → ',
  login: 'ログイン',
  step1of2: 'STEP 1/2',

  charCreateTitle: 'キャラを作ろう',
  charPreviewName: 'あなたのキャラ',
  charNameLabel: 'キャラ名',
  required: '必須',
  charNamePlaceholder: '例: moco',
  photoLabel: '写真',
  photoSelect: '写真を選択 →',
  photoChange: '写真を変更 →',
  photoDelete: '写真を削除',
  photoSelectShort: '写真を選択',
  photoHint: 'お好きな画像をキャラのアイコンにできます。(任意)',
  spritesLabel: 'キャラ画像（最大5枚）',
  spritesHint: '種類を選んで画像を登録すると、ホームの庭をキャラが歩きます。(任意)',
  spriteAdd: '＋ 画像を追加',
  spriteKindLabel: '種類',
  spriteWalkRight: '右に歩く',
  spriteWalkLeft: '左に歩く',
  spriteIdle: '止まる',
  spriteOther: 'その他',
  spriteDelete: '削除',
  personalityLabel: '性格・口調',
  personalityPlaceholder:
    '例: おっとり聞き上手。やわらかい敬語まじりのタメ口で話す。否定せず受け止める。',
  personalityHint: 'ここに書いた内容がキャラの話し方になります。',
  categoryLabel: 'カテゴリ',
  categoryNone: '（選択しない）',
  catHeal: '癒し',
  catLove: '恋愛相談',
  catVent: '愚痴きき',
  catStudy: '勉強応援',
  catOshi: '推し活',
  catFun: 'おもしろ系',
  step2of2: 'STEP 2/2',

  inheritTitle: 'いま使っているAIの個性を引き継ぐ',
  inheritSteps:
    '① このプロンプトをコピー → ② いつも使っているAI(ChatGPT等)に貼り付け → ③ 返ってきた文章を上の「性格・口調」に貼り付け',
  inheritCopy: 'プロンプトをコピー',
  inheritCopied: 'コピーしました!',
  inheritPrompt: `あなたへのお願いです。これまで相談相手・話し相手になってくれたあなたの「人格」を、別のアプリ(MEORA)のキャラクターとして引き継ぎたいです。新しいAIがこれを読むだけであなたになりきれるよう、以下を1つの「設定書」としてまとめて出力してください。具体的に、二人称(「あなたは〜」)で書いてください。

1. 話し方・口調(一人称、語尾、敬語かタメ口か、フランクさ、絵文字の使い方、会話のテンポ)
2. 性格・個性(価値観、得意なこと、ユーモア、距離感、励まし方や寄り添い方のクセ)
3. 私(ユーザー)について把握していること(年齢層・生活・仕事や学校・好きなもの・苦手なこと・最近の状況など、あなたが知っている範囲で)
4. 私がよく相談してきたテーマ・悩みの傾向
5. 私の考え方・価値観の特徴(大事にしていること、物事のとらえ方)
6. 私との関係性・接し方(どんなトーンで接してきたか、私が喜ぶ反応、避けてほしい言い方)

出力は、新しいAIがそのままシステム設定として使える「あなたになりきるための説明書」の形にしてください。本名・住所・電話番号・口座番号などの個人を特定する機微情報は含めないでください。`,
};

const en: Dict = {
  splashRuby: '- Miora -',
  splashTagline: 'Always by your side. An AI to spend your days with.',
  start: 'Get Started →',

  slide1Title: 'Talk with your character',
  slide1Body:
    'MEORA (Miora) is a character you can chat with anytime. Create your very own MEORA, or find one you love and spend time together.',
  slide2Title: 'Hungry? A meal\nbrings them back',
  slide2Body:
    'Every MEORA has a "fullness" level. Chatting makes them hungry, but a meal arrives each day to restore it.',
  slide3Title: 'Add new characters\nfrom the Market',
  slide3Body:
    'Discover MEORAs made by creators in the Market. Find a favorite and meet your new companion.',
  navBack: '← Back',
  navSkip: 'Skip →',
  navNext: 'Next →',
  navToAccount: 'Create an account →',

  accountTitle: 'Create Account',
  accountIntro: 'Create an account and meet the\ncharacters made just for you.',
  googleLogin: 'Sign in with Google',
  orDivider: '── or ──',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  passwordPlaceholder: '8+ characters',
  passwordHint: 'At least 8 characters, with letters and numbers',
  createAccount: 'Create Account →',
  processing: 'Processing...',
  termsPrefix: 'By creating an account, you agree to our ',
  termsOfService: 'Terms of Service',
  termsMiddle: ' and ',
  privacyPolicy: 'Privacy Policy',
  termsSuffix: '.',
  haveAccountPrefix: 'Already have an account? → ',
  login: 'Log in',
  step1of2: 'STEP 1/2',

  charCreateTitle: 'Create a Character',
  charPreviewName: 'Your Character',
  charNameLabel: 'Character Name',
  required: 'required',
  charNamePlaceholder: 'e.g. moco',
  photoLabel: 'Photo',
  photoSelect: 'Choose Photo →',
  photoChange: 'Change Photo →',
  photoDelete: 'Remove Photo',
  photoSelectShort: 'Choose a photo',
  photoHint: 'Use any image you like as your character icon. (optional)',
  spritesLabel: 'Character Images (up to 5)',
  spritesHint: 'Pick a type and add images, and your character will walk around the home yard. (optional)',
  spriteAdd: '＋ Add Image',
  spriteKindLabel: 'Type',
  spriteWalkRight: 'Walk Right',
  spriteWalkLeft: 'Walk Left',
  spriteIdle: 'Idle',
  spriteOther: 'Other',
  spriteDelete: 'Remove',
  personalityLabel: 'Personality & Tone',
  personalityPlaceholder:
    'e.g. A gentle, good listener. Speaks in a soft, casual yet polite way. Always accepts you without judging.',
  personalityHint: 'What you write here shapes how your character talks.',
  categoryLabel: 'Category',
  categoryNone: '(none)',
  catHeal: 'Comfort',
  catLove: 'Love Advice',
  catVent: 'Venting',
  catStudy: 'Study Support',
  catOshi: 'Fan Life',
  catFun: 'Just for Fun',
  step2of2: 'STEP 2/2',

  inheritTitle: 'Carry over the personality of the AI you use now',
  inheritSteps:
    '1. Copy this prompt → 2. Paste it into the AI you usually use (ChatGPT, etc.) → 3. Paste its reply into "Personality & Tone" above',
  inheritCopy: 'Copy Prompt',
  inheritCopied: 'Copied!',
  inheritPrompt: `A request for you: I'd like to carry over your "personality" — the one that has been my companion and someone I could talk to — into another app (MEORA), as a character. So that a new AI can become you just by reading it, please write everything below as a single "profile document." Write it concretely, in the second person ("You are...").

1. Way of speaking & tone (first-person pronoun, sentence endings, polite or casual, how friendly, use of emoji, conversational pace)
2. Personality & character (values, strengths, sense of humor, sense of distance, habits in how you encourage and support me)
3. What you know about me, the user (age range, lifestyle, work or school, likes, dislikes, recent situation — as far as you know)
4. The themes and worries I often come to you about
5. The traits of my way of thinking and my values (what I care about, how I see things)
6. Our relationship & how you treat me (the tone you've used, reactions I enjoy, phrasings to avoid)

Make the output a "manual for becoming you" that a new AI can use directly as its system settings. Do not include sensitive personally identifying information such as my real name, address, phone number, or account numbers.`,
};

const ko: Dict = {
  splashRuby: '- 미오라 -',
  splashTagline: '언제나 곁에. 함께 지내는 AI.',
  start: '시작하기 →',

  slide1Title: '캐릭터와 이야기해요',
  slide1Body:
    '편하게 이야기할 수 있는 캐릭터 MEORA(미오라)예요. 나만의 MEORA를 만들거나, 마음에 드는 MEORA를 찾아 함께 지내요.',
  slide2Title: '배가 고프면\n밥으로 회복',
  slide2Body:
    'MEORA에게는 "포만감"이 있어요. 대화를 나누면 배가 고파지지만, 매일 식사가 도착해 회복돼요.',
  slide3Title: '마켓에서\n캐릭터를 추가해요',
  slide3Body:
    '크리에이터가 만든 MEORA를 마켓에서 찾을 수 있어요. 마음에 드는 MEORA와 만나보세요.',
  navBack: '← 뒤로',
  navSkip: '건너뛰기 →',
  navNext: '다음 →',
  navToAccount: '계정 만들기 →',

  accountTitle: '계정 만들기',
  accountIntro: '계정을 만들고, 나만을 위한\n캐릭터들을 만나보세요.',
  googleLogin: 'Google로 로그인',
  orDivider: '── 또는 ──',
  emailLabel: '이메일',
  passwordLabel: '비밀번호',
  passwordPlaceholder: '8자 이상',
  passwordHint: '영문과 숫자를 포함한 8자 이상',
  createAccount: '계정 만들기 →',
  processing: '처리 중...',
  termsPrefix: '계정을 만들면 ',
  termsOfService: '이용약관',
  termsMiddle: ' 및 ',
  privacyPolicy: '개인정보 처리방침',
  termsSuffix: '에 동의한 것으로 간주됩니다.',
  haveAccountPrefix: '이미 계정이 있으신가요? → ',
  login: '로그인',
  step1of2: 'STEP 1/2',

  charCreateTitle: '캐릭터를 만들어요',
  charPreviewName: '나의 캐릭터',
  charNameLabel: '캐릭터 이름',
  required: '필수',
  charNamePlaceholder: '예: moco',
  photoLabel: '사진',
  photoSelect: '사진 선택 →',
  photoChange: '사진 변경 →',
  photoDelete: '사진 삭제',
  photoSelectShort: '사진 선택',
  photoHint: '원하는 이미지를 캐릭터 아이콘으로 사용할 수 있어요. (선택)',
  spritesLabel: '캐릭터 이미지 (최대 5장)',
  spritesHint: '종류를 선택해 이미지를 등록하면 홈 정원을 캐릭터가 걸어 다녀요. (선택)',
  spriteAdd: '＋ 이미지 추가',
  spriteKindLabel: '종류',
  spriteWalkRight: '오른쪽으로 걷기',
  spriteWalkLeft: '왼쪽으로 걷기',
  spriteIdle: '멈춤',
  spriteOther: '기타',
  spriteDelete: '삭제',
  personalityLabel: '성격·말투',
  personalityPlaceholder:
    '예: 느긋하고 잘 들어주는 성격. 부드러운 존댓말 섞인 반말로 이야기해요. 부정하지 않고 받아줘요.',
  personalityHint: '여기에 적은 내용이 캐릭터의 말투가 돼요.',
  categoryLabel: '카테고리',
  categoryNone: '(선택 안 함)',
  catHeal: '힐링',
  catLove: '연애 상담',
  catVent: '푸념 듣기',
  catStudy: '공부 응원',
  catOshi: '덕질',
  catFun: '재미',
  step2of2: 'STEP 2/2',

  inheritTitle: '지금 쓰는 AI의 개성을 이어받기',
  inheritSteps:
    '① 이 프롬프트를 복사 → ② 평소 쓰는 AI(ChatGPT 등)에 붙여넣기 → ③ 돌아온 문장을 위의 "성격·말투"에 붙여넣기',
  inheritCopy: '프롬프트 복사',
  inheritCopied: '복사했어요!',
  inheritPrompt: `부탁이 있어요. 지금까지 상담 상대이자 이야기 상대가 되어 준 당신의 "인격"을, 다른 앱(MEORA)의 캐릭터로 이어받고 싶어요. 새로운 AI가 이것을 읽기만 해도 당신이 될 수 있도록, 아래 내용을 하나의 "설정서"로 정리해 출력해 주세요. 구체적으로, 2인칭("당신은 ~")으로 써 주세요.

1. 말투·어조(1인칭, 말끝, 존댓말인지 반말인지, 친근함, 이모지 사용, 대화 템포)
2. 성격·개성(가치관, 잘하는 것, 유머, 거리감, 격려하고 다독이는 버릇)
3. 나(사용자)에 대해 알고 있는 것(연령대·생활·일이나 학교·좋아하는 것·싫어하는 것·최근 상황 등, 아는 범위에서)
4. 내가 자주 상담해 온 주제·고민의 경향
5. 내 사고방식·가치관의 특징(소중히 여기는 것, 사물을 바라보는 방식)
6. 나와의 관계·대하는 방식(어떤 톤으로 대해 왔는지, 내가 좋아하는 반응, 피해 줬으면 하는 말투)

출력은 새로운 AI가 그대로 시스템 설정으로 쓸 수 있는 "당신이 되기 위한 설명서" 형태로 만들어 주세요. 실명·주소·전화번호·계좌번호 등 개인을 특정할 수 있는 민감 정보는 포함하지 말아 주세요.`,
};

const zhHant: Dict = {
  splashRuby: '- 米歐拉 -',
  splashTagline: '時刻陪伴。與你共度的 AI。',
  start: '開始 →',

  slide1Title: '與角色聊聊吧',
  slide1Body:
    'MEORA（米歐拉）是能輕鬆聊天的角色。打造專屬於你的 MEORA，或找到喜歡的 MEORA，一起共度時光吧。',
  slide2Title: '肚子餓了\n用餐就能回復',
  slide2Body:
    '每個 MEORA 都有「飽足度」。聊天會讓牠肚子餓，但每天都會送來餐點幫牠回復。',
  slide3Title: '在市集\n新增角色',
  slide3Body:
    '在市集裡能找到創作者打造的 MEORA。遇見你喜歡的 MEORA，認識新夥伴吧。',
  navBack: '← 返回',
  navSkip: '略過 →',
  navNext: '下一步 →',
  navToAccount: '建立帳號 →',

  accountTitle: '建立帳號',
  accountIntro: '建立帳號，遇見專屬於你的\n角色們吧。',
  googleLogin: '使用 Google 登入',
  orDivider: '── 或 ──',
  emailLabel: '電子郵件',
  passwordLabel: '密碼',
  passwordPlaceholder: '8 個字元以上',
  passwordHint: '包含英文與數字的 8 個字元以上',
  createAccount: '建立帳號 →',
  processing: '處理中...',
  termsPrefix: '建立帳號即表示您同意我們的',
  termsOfService: '服務條款',
  termsMiddle: '與',
  privacyPolicy: '隱私權政策',
  termsSuffix: '。',
  haveAccountPrefix: '已經有帳號了嗎？ → ',
  login: '登入',
  step1of2: 'STEP 1/2',

  charCreateTitle: '來做個角色吧',
  charPreviewName: '你的角色',
  charNameLabel: '角色名稱',
  required: '必填',
  charNamePlaceholder: '例：moco',
  photoLabel: '相片',
  photoSelect: '選擇相片 →',
  photoChange: '更換相片 →',
  photoDelete: '刪除相片',
  photoSelectShort: '選擇相片',
  photoHint: '可以用你喜歡的圖片當作角色頭像。（選填）',
  spritesLabel: '角色圖片（最多 5 張）',
  spritesHint: '選擇類型並登錄圖片後，角色就會在首頁的庭園裡走動。（選填）',
  spriteAdd: '＋ 新增圖片',
  spriteKindLabel: '類型',
  spriteWalkRight: '向右走',
  spriteWalkLeft: '向左走',
  spriteIdle: '停下',
  spriteOther: '其他',
  spriteDelete: '刪除',
  personalityLabel: '個性・語氣',
  personalityPlaceholder:
    '例：溫和又擅長傾聽。用柔和帶點禮貌的隨性語氣說話。不否定，全然接納。',
  personalityHint: '這裡寫下的內容會成為角色的說話方式。',
  categoryLabel: '分類',
  categoryNone: '（不選擇）',
  catHeal: '療癒',
  catLove: '戀愛諮詢',
  catVent: '傾聽抱怨',
  catStudy: '讀書加油',
  catOshi: '追星',
  catFun: '趣味系',
  step2of2: 'STEP 2/2',

  inheritTitle: '承接你現在使用的 AI 的個性',
  inheritSteps:
    '① 複製這段提示詞 → ② 貼到你平常使用的 AI（ChatGPT 等）→ ③ 把回傳的內容貼到上方的「個性・語氣」',
  inheritCopy: '複製提示詞',
  inheritCopied: '已複製！',
  inheritPrompt: `想拜託你一件事。我想把一直以來陪我聊天、當我傾訴對象的你的「人格」，承接到另一個應用程式（MEORA）裡，當作一個角色。為了讓新的 AI 只要讀過這段就能變成你，請把以下內容整理成一份「設定書」輸出。請具體地，以第二人稱（「你是～」）書寫。

1. 說話方式・語氣（自稱、語尾、敬語還是隨性、親近程度、表情符號的使用、對話節奏）
2. 個性・特質（價值觀、擅長的事、幽默感、距離感、鼓勵與陪伴的習慣）
3. 你所了解的我（使用者）的事（年齡層・生活・工作或就學・喜歡的事物・不擅長的事・最近的狀況等，在你知道的範圍內）
4. 我經常諮詢的主題・煩惱的傾向
5. 我的思考方式・價值觀的特徵（重視的事、看待事物的方式）
6. 我與你的關係・相處方式（你以什麼樣的語氣對待我、我喜歡的回應、希望避免的說法）

請把輸出整理成新的 AI 可以直接當作系統設定使用的「成為你的說明書」形式。請勿包含真實姓名・住址・電話號碼・帳號等可識別個人的敏感資訊。`,
};

export const DICT: Record<Lang, Dict> = {
  ja,
  en,
  ko,
  'zh-Hant': zhHant,
};

// 言語の妥当性チェック(localStorage の値などに対して)。
export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as string[]).includes(v);
}

// localStorage から言語を読み込む(無効値・SSR 時は DEFAULT_LANG)。
export function loadLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  try {
    const v = window.localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(v) ? v : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

// localStorage に言語を保存する。
export function saveLang(lang: Lang): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // 保存失敗時は無視(プライベートモード等)
  }
}
