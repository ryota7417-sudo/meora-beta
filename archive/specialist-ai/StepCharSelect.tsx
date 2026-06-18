'use client';
/**
 * [ARCHIVED 2026-06-15]
 * 専門AI（ジョブ + AIタイプ/tier）選択機能。
 * 2026-06-15 のピボット（「気軽な話し相手キャラ × クリエイターマーケット」への転換）で
 * オンボーディングのアクティブフローから外して退避した。
 *
 * 復活時は app/onboarding/page.tsx のフローに step5 として再接続する想定。
 * 詳細は同ディレクトリの README.md を参照。
 *
 * 依存:
 *   - @/components/ui/CharacterSvg の CharIconSelect
 *   - @/lib/store の DEFAULT_CHARACTERS（StepHpSetting で使用）
 * このファイルは Next.js のルーティングに乗らない archive/ 配下に置いてある。
 */
import { useState } from 'react';
import { DEFAULT_CHARACTERS } from '@/lib/store';
import { CharIconSelect } from '@/components/ui/CharacterSvg';

// ===== 専門AI専用の型 =====
export type CharSelectId = 'aoi' | 'ruka' | 'haruka';
export type JobId = 'ライター' | 'デザイナー' | '秘書';

// AIタイプ（tier）
// 'basic'    = 一緒に成長していく基本技術を搭載したAI（基本技術型）
// 'advanced' = すでに専門性の高い技術を搭載したAI（専門技術型）
// 将来 inbox/AI_pronpt/{coding,designer,secretary,writer}/ 配下の
//   basic / advanced プロンプトを読み込む想定。ここでは tier を保持するのみ。
// ジョブ↔フォルダ対応: ライター→writer / デザイナー→designer / 秘書→secretary / ※coding は将来枠
export type AiTier = 'basic' | 'advanced';

export interface Selection {
  charId: CharSelectId;
  jobId: JobId;
  tier: AiTier;
}

// ===== キャラクター選択 (旧 step 5) =====
export function StepCharSelect({ onNext, onBack }: { onNext: (selections: Selection[]) => void; onBack: () => void }) {
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
  const [selectedChar, setSelectedChar] = useState<CharSelectId | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [pendingJob, setPendingJob] = useState<JobId | null>(null);
  const [pendingTier, setPendingTier] = useState<AiTier | null>(null);

  const tiers: { id: AiTier; name: string; desc: string }[] = [
    { id: 'basic', name: '基本技術型', desc: '一緒に成長していく基本技術を搭載したAI。使うほど馴染んでいきます。' },
    { id: 'advanced', name: '専門技術型', desc: 'すでに専門性の高い技術を搭載したAI。最初から即戦力です。' },
  ];

  const chars: { id: CharSelectId; name: string; desc: string }[] = [
    { id: 'aoi', name: 'アオイ', desc: '明るく情熱的。グイグイ引っ張るムードメーカー。' },
    { id: 'ruka', name: 'ルカ', desc: 'クールで論理的。データと根拠を重視する。' },
    { id: 'haruka', name: 'ハルカ', desc: '穏やかで丁寧。相手の気持ちに寄り添う調停者。' },
  ];

  const jobs: { id: JobId; desc: string; color: string; icon: React.ReactNode }[] = [
    { id: 'ライター', desc: '記事・コピー・シナリオを書く', color: '#2196f3', icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="2" width="6" height="10" fill="#2196f3" transform="rotate(45 18 2)"/>
        <path d="M5 20 L3 25 L8 23 Z" fill="#2196f3"/>
        <line x1="8" y1="23" x2="20" y2="7" stroke="#2196f3" strokeWidth="2.2" strokeLinecap="square"/>
        <line x1="6" y1="21" x2="18" y2="9" stroke="#fff" strokeWidth="0.8" strokeLinecap="square" opacity="0.6"/>
        <rect x="2" y="25" width="12" height="2" fill="#1565c0"/>
      </svg>
    )},
    { id: 'デザイナー', desc: 'UI・ビジュアル・配色を考える', color: '#9c27b0', icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="4,24 24,24 4,6" stroke="#9c27b0" strokeWidth="2.2" fill="none" strokeLinejoin="miter"/>
        <line x1="4" y1="18" x2="8" y2="18" stroke="#9c27b0" strokeWidth="1.5"/>
        <line x1="4" y1="12" x2="7" y2="12" stroke="#9c27b0" strokeWidth="1.5"/>
        <rect x="4" y="20" width="4" height="4" stroke="#9c27b0" strokeWidth="1.5" fill="none"/>
        <circle cx="18" cy="10" r="2" fill="#e040fb"/>
        <circle cx="22" cy="6" r="2" fill="#7b1fa2"/>
      </svg>
    )},
    { id: '秘書', desc: 'スケジュール・議事録・整理を担う', color: '#388e3c', icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="6" width="18" height="20" stroke="#388e3c" strokeWidth="2.2" fill="none"/>
        <rect x="10" y="3" width="8" height="5" stroke="#388e3c" strokeWidth="2" fill="#fff"/>
        <line x1="9" y1="14" x2="19" y2="14" stroke="#388e3c" strokeWidth="1.8" strokeLinecap="square"/>
        <line x1="9" y1="18" x2="19" y2="18" stroke="#388e3c" strokeWidth="1.8" strokeLinecap="square"/>
        <line x1="9" y1="22" x2="15" y2="22" stroke="#388e3c" strokeWidth="1.8" strokeLinecap="square"/>
        <path d="M8 10.5 L10.5 13 L15 8" stroke="#66bb6a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
  ];

  const light = {
    backgroundColor: '#f8f8f4',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: 48,
  } as const;

  // ジョブ決定 → AIタイプ選択(subStep 3)へ。確定モーダルはタイプ選択後に出す。
  const handleDecideJob = (jobId: JobId) => {
    setPendingJob(jobId);
    setSubStep(3);
    window.scrollTo(0, 0);
  };

  // AIタイプ選択 → 確定モーダル表示
  const handleSelectTier = (tier: AiTier) => {
    setPendingTier(tier);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!selectedChar || !pendingJob || !pendingTier) return;
    const newSelections = [
      ...selections.filter(s => s.charId !== selectedChar),
      { charId: selectedChar, jobId: pendingJob, tier: pendingTier },
    ];
    setSelections(newSelections);
    setShowModal(false);
    onNext(newSelections);
  };

  const charData = selectedChar ? chars.find(c => c.id === selectedChar) : null;
  const pendingTierData = pendingTier ? tiers.find(t => t.id === pendingTier) : null;

  return (
    <div style={light}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>

        {/* STEP 1 VIEW */}
        {subStep === 1 && (
          <>
            <header style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f8f4', backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', borderBottom: '2px solid #111', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #111', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer' }}>
                ← 戻る
              </button>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 900, letterSpacing: '0.04em', textAlign: 'center' }}>キャラクター選択</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#555', border: '2px solid #555', padding: '2px 7px', background: '#fff' }}>STEP 4/5</span>
            </header>

            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: '#111', color: '#fff' }}>1</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>キャラ</span>
              </div>
              <div style={{ flex: 1, height: 2, background: '#bbb', margin: '0 6px' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: '#fff', color: '#999' }}>2</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#bbb' }}>ジョブ</span>
              </div>
              <div style={{ flex: 1, height: 2, background: '#bbb', margin: '0 6px' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: '#fff', color: '#999' }}>3</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#bbb' }}>タイプ</span>
              </div>
            </div>

            {/* Character List */}
            <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {chars.map(char => (
                <div key={char.id} style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <CharIconSelect id={char.id} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#111', letterSpacing: '0.02em' }}>{char.name}</div>
                      <div style={{ fontSize: 12, color: '#555', fontWeight: 500, lineHeight: 1.5 }}>{char.desc}</div>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedChar(char.id); setSubStep(2); window.scrollTo(0,0); }} style={{ width: '100%', padding: '10px 16px', background: '#111', border: '2px solid #111', boxShadow: '4px 4px 0 #555', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 900, cursor: 'pointer', letterSpacing: '0.04em', textAlign: 'center' }}>
                    選択する &nbsp;→
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 2 VIEW */}
        {subStep === 2 && charData && (
          <>
            <header style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f8f4', backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', borderBottom: '2px solid #111', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { setSubStep(1); window.scrollTo(0,0); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #111', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer' }}>
                ← キャラクター選択に戻る
              </button>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 900, letterSpacing: '0.04em', textAlign: 'center' }}>ジョブ選択</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#555', border: '2px solid #555', padding: '2px 7px', background: '#fff' }}>STEP 2 / 3</span>
            </header>

            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: '#4caf50', color: '#fff' }}>✓</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4caf50' }}>キャラ</span>
              </div>
              <div style={{ flex: 1, height: 2, background: '#4caf50', margin: '0 6px' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: '#111', color: '#fff' }}>2</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>ジョブ</span>
              </div>
              <div style={{ flex: 1, height: 2, background: '#bbb', margin: '0 6px' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: '#fff', color: '#999' }}>3</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#bbb' }}>タイプ</span>
              </div>
            </div>

            {/* Selected Char Summary */}
            <div style={{ margin: '4px 16px 0', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36 }}>
                <CharIconSelect id={charData.id} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{charData.name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2, fontWeight: 500 }}>のジョブを選択中</div>
              </div>
              <div style={{ flexShrink: 0, width: 22, height: 22, background: '#4caf50', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7 L5.5 10.5 L12 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Job List */}
            <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {jobs.map(job => (
                <div key={job.id} style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flexShrink: 0, width: 48, height: 48, border: `2px solid ${job.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f4' }}>
                    {job.icon}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, background: job.color, marginRight: 4, border: '1px solid rgba(0,0,0,0.2)' }}/>
                      {job.id}
                    </div>
                    <div style={{ fontSize: 12, color: '#555', fontWeight: 500, lineHeight: 1.4 }}>{job.desc}</div>
                  </div>
                  <button onClick={() => handleDecideJob(job.id)} style={{ flexShrink: 0, padding: '8px 12px', background: '#111', border: '2px solid #111', boxShadow: '3px 3px 0 #555', color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                    このジョブに決定 →
                  </button>
                </div>
              ))}

              {/* ロック済み */}
              <div style={{ background: '#f4f4f4', border: '2px dashed #bbb', boxShadow: '4px 4px 0 #bbb', padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flexShrink: 0, width: 48, height: 48, border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="13" width="16" height="12" stroke="#bbb" strokeWidth="2" fill="#e0e0e0"/>
                    <path d="M10 13V9a4 4 0 0 1 8 0v4" stroke="#bbb" strokeWidth="2"/>
                    <circle cx="14" cy="19" r="2" fill="#bbb"/>
                  </svg>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#999' }}>新ジョブ</div>
                  <div style={{ fontSize: 12, color: '#ccc', fontWeight: 500, lineHeight: 1.4 }}>新ジョブ公開予定</div>
                </div>
                <span style={{ flexShrink: 0, padding: '6px 10px', background: '#e0e0e0', border: '2px solid #bbb', color: '#999', fontFamily: 'inherit', fontSize: 11, fontWeight: 700 }}>近日公開</span>
              </div>
            </div>
          </>
        )}

        {/* STEP 3 VIEW — AIタイプ選択 */}
        {subStep === 3 && charData && pendingJob && (
          <>
            <header style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f8f4', backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', borderBottom: '2px solid #111', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { setSubStep(2); window.scrollTo(0,0); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #111', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer' }}>
                ← ジョブ選択に戻る
              </button>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 900, letterSpacing: '0.04em', textAlign: 'center' }}>AIタイプ選択</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#555', border: '2px solid #555', padding: '2px 7px', background: '#fff' }}>STEP 3 / 3</span>
            </header>

            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: '#4caf50', color: '#fff' }}>✓</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4caf50' }}>キャラ</span>
              </div>
              <div style={{ flex: 1, height: 2, background: '#4caf50', margin: '0 6px' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: '#4caf50', color: '#fff' }}>✓</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4caf50' }}>ジョブ</span>
              </div>
              <div style={{ flex: 1, height: 2, background: '#4caf50', margin: '0 6px' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, background: '#111', color: '#fff' }}>3</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>タイプ</span>
              </div>
            </div>

            {/* Selected Char × Job Summary */}
            <div style={{ margin: '4px 16px 0', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36 }}>
                <CharIconSelect id={charData.id} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{charData.name} × {pendingJob}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2, fontWeight: 500 }}>AIタイプを選択中</div>
              </div>
            </div>

            {/* Tier List */}
            <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tiers.map(tier => (
                <div key={tier.id} style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flexShrink: 0, width: 44, height: 44, border: '2px solid #111', background: '#f8f8f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {tier.id === 'basic' ? (
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 22 V8" stroke="#388e3c" strokeWidth="2.2" strokeLinecap="round"/>
                          <path d="M13 11 Q7 9 5 4 Q11 5 13 11Z" fill="#a5d6a7" stroke="#388e3c" strokeWidth="1.5" strokeLinejoin="round"/>
                          <path d="M13 14 Q19 12 21 7 Q15 8 13 14Z" fill="#a5d6a7" stroke="#388e3c" strokeWidth="1.5" strokeLinejoin="round"/>
                          <rect x="9" y="22" width="8" height="2" fill="#388e3c"/>
                        </svg>
                      ) : (
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <polygon points="13,2 16,9 23,9 17.5,14 19.5,21 13,17 6.5,21 8.5,14 3,9 10,9" fill="#ffd54f" stroke="#f57f17" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#111', letterSpacing: '0.02em' }}>{tier.name}</div>
                      <div style={{ fontSize: 12, color: '#555', fontWeight: 500, lineHeight: 1.5 }}>{tier.desc}</div>
                    </div>
                  </div>
                  <button onClick={() => handleSelectTier(tier.id)} style={{ width: '100%', padding: '10px 16px', background: '#111', border: '2px solid #111', boxShadow: '4px 4px 0 #555', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 900, cursor: 'pointer', letterSpacing: '0.04em', textAlign: 'center' }}>
                    これにする &nbsp;→
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {showModal && charData && pendingJob && pendingTierData && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '8px 8px 0 #111', padding: '24px 20px', maxWidth: 360, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111', letterSpacing: '0.02em' }}>設定を確定しますか？</div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>以下の組み合わせでキャラクターを設定します。</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8f8f4', border: '2px solid #111', padding: '10px 12px' }}>
              <div style={{ width: 36, height: 36, flexShrink: 0 }}>
                <CharIconSelect id={charData.id} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{charData.name} × {pendingJob} × {pendingTierData.name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>キャラクター × ジョブ × AIタイプ</div>
              </div>
            </div>
            <button onClick={handleConfirm} style={{ width: '100%', padding: 12, background: '#111', border: '2px solid #111', boxShadow: '4px 4px 0 #555', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 900, cursor: 'pointer', letterSpacing: '0.04em' }}>
              決定してはじめる
            </button>
            <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: 10, background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', color: '#111', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}>
              やっぱりやめる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== HP設定 (旧 step 6) =====
// 専門AI選択フローの最終ステップだったため一緒にアーカイブ。
export function StepHpSetting({ onFinish, onBack, selections }: { onFinish: () => void; onBack: () => void; userName: string; selections: Selection[] }) {
  const light = {
    backgroundColor: '#f8f8f4',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '24px 16px 48px',
  } as const;

  const dotColors: Record<string, string> = { aoi: '#2196f3', haruka: '#e91e8c', ruka: '#9c27b0' };
  const barColors: Record<string, string> = { aoi: '#2196f3', ruka: '#9c27b0', haruka: '#4caf50' };

  return (
    <div style={light}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 0 12px', borderBottom: '2px solid #111' }}>
          <div><button onClick={onBack} style={{ fontSize: 12, fontWeight: 600, color: '#111', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>← 戻る</button></div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>HP設定</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><span style={{ fontSize: 11, fontWeight: 700, background: '#111', color: '#fff', padding: '3px 8px', letterSpacing: '0.06em', fontFamily: 'monospace' }}>STEP 5/5</span></div>
        </div>

        {/* プログレスバー */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 20px' }}>
          {[true, true, true, true, true].map((done, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div style={{ flex: 1, height: 6, background: i < 4 ? '#111' : 'repeating-linear-gradient(45deg, #111 0px, #111 3px, #fff 3px, #fff 6px)', border: `1px solid ${done ? '#111' : '#bbb'}` }}/>
              {i < 4 && <div style={{ width: 3, height: 10, background: '#111' }}/>}
            </div>
          ))}
        </div>

        {/* 説明カード */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>HPについて</p>
        <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 8, letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 14s-6-4-6-8a4 4 0 018 0 4 4 0 018 0c0 4-6 8-6 8z" fill="#111"/>
            </svg>
            各キャラクターはそれぞれHPを持ちます
          </div>
          <div style={{ fontSize: 14, color: '#333', lineHeight: 1.7, letterSpacing: '0.02em' }}>
            各キャラクターはそれぞれ <strong>100HP</strong> を持っています。チャットするたびにHPを消費します。HPが0になると翌日AM 5:00の自動回復まで会話できなくなります。
          </div>
        </div>

        {/* HP ビジュアル */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>各キャラクターのHP</p>
        <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '20px 18px 22px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 16, textAlign: 'center' }}>— HP STATUS —</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {selections.map(s => {
              const name = DEFAULT_CHARACTERS.find(c => c.id === s.charId)?.name || s.charId;
              return (
                <div key={s.charId}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', color: '#111' }}>
                      <span style={{ width: 14, height: 14, border: '2px solid #111', background: dotColors[s.charId] || '#999', flexShrink: 0, display: 'inline-block' }}/>
                      {name}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#111' }}>100 / 100 HP</span>
                  </div>
                  <div style={{ width: '100%', height: 16, border: '2px solid #111', background: '#e8e8e8', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '100%', background: barColors[s.charId] || '#4caf50', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 10px, rgba(255,255,255,0.25) 10px, rgba(255,255,255,0.25) 11px)' }}/>
                      <div style={{ position: 'absolute', top: 1, left: 2, right: 2, height: 3, background: 'rgba(255,255,255,0.35)' }}/>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 4, fontFamily: 'monospace', textAlign: 'right', letterSpacing: '0.03em' }}>毎日 AM 5:00 自動回復</div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#999', marginTop: 14, letterSpacing: '0.04em', fontFamily: 'monospace', padding: '8px 0 0', borderTop: '1px solid #e0e0e0' }}>
            全AIのHPは毎日 AM 5:00 に自動回復します
          </div>
        </div>

        {/* インフォチップ */}
        <div style={{ background: '#f0f0f0', border: '1px solid #bbb', padding: '10px 14px', fontSize: 12, color: '#555', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.6 }}>
          <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="#888" strokeWidth="1"/>
            <rect x="6.3" y="5.5" width="1.4" height="5" fill="#888"/>
            <rect x="6.3" y="3.2" width="1.4" height="1.4" fill="#888"/>
          </svg>
          HPはマーケットでアイテムを購入して補充できます。
        </div>

        {/* ダッシュボードへ */}
        <button onClick={onFinish} style={{ width: '100%', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #555', padding: '16px 20px', fontSize: 16, fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          ダッシュボードへ →
        </button>

        <p onClick={onFinish} style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 14, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>後で設定する</p>
      </div>
    </div>
  );
}
