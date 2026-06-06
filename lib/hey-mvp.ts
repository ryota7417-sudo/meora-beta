'use client';

export type StaffStatus = '作業できます' | '少し疲れています' | '今日は休憩中です';
export type MessageSender = 'user' | 'ai';
export type TaskStatus = '未着手' | '進行中' | '完了';
export type LearningStatus = '未確認' | '採用' | '保留' | '却下';

export interface AiStaff {
  id: string;
  name: string;
  role: string;
  description: string;
  currentStamina: number;
  maxStamina: number;
  staminaCost: number;
}

export interface HeyMessage {
  id: string;
  staffId: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
}

export interface HeyTask {
  id: string;
  title: string;
  staffName: string;
  status: TaskStatus;
  createdAt: string;
  staminaCost: number;
}

export interface LearningCandidate {
  id: string;
  content: string;
  source: string;
  status: LearningStatus;
  target: string;
}

const STAFF_KEY = 'hey_mvp_ai_staff';
const MESSAGES_KEY = 'hey_mvp_messages';
const TASKS_KEY = 'hey_mvp_tasks';
const LEARNING_KEY = 'hey_mvp_learning_candidates';

export const defaultAiStaff: AiStaff[] = [
  {
    id: 'manager',
    name: 'マネージャー',
    role: 'タスク整理・進行管理',
    description: '依頼をタスクに分け、締切や進み具合を一緒に整理します。',
    currentStamina: 24,
    maxStamina: 30,
    staminaCost: 3,
  },
  {
    id: 'writer',
    name: 'ライター',
    role: '文章づくり',
    description: '告知文、メール文、商品説明、X投稿案を作ります。',
    currentStamina: 18,
    maxStamina: 30,
    staminaCost: 5,
  },
  {
    id: 'researcher',
    name: 'リサーチャー',
    role: '調査・情報整理',
    description: 'イベントや競合の情報を調べる方針をまとめます。',
    currentStamina: 8,
    maxStamina: 30,
    staminaCost: 8,
  },
];

export const defaultLearningCandidates: LearningCandidate[] = [
  {
    id: 'learning-140',
    content: 'イベント告知文では140字版も提案する',
    source: 'ライターへの依頼',
    status: '未確認',
    target: 'ライター',
  },
  {
    id: 'learning-deadline',
    content: '締切が曖昧な依頼では確認する',
    source: 'マネージャーへの依頼',
    status: '未確認',
    target: 'マネージャー',
  },
  {
    id: 'learning-product',
    content: '商品説明では価格・素材・サイズを確認する',
    source: '商品説明の作成',
    status: '未確認',
    target: 'ライター',
  },
];

export function getStaffStatus(staff: AiStaff): StaffStatus {
  if (staff.currentStamina <= 0) return '今日は休憩中です';
  if (staff.currentStamina < staff.staminaCost * 2) return '少し疲れています';
  return '作業できます';
}

export function getMockResponse(staffId: string): string {
  if (staffId === 'writer') {
    return '文章案を作成しました。必要なら短めのSNS向けにも調整できます。';
  }
  if (staffId === 'researcher') {
    return '調査方針を整理しました。次に確認すべき情報をまとめます。';
  }
  return '依頼内容を整理しました。必要なタスクに分けて進めましょう。';
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function createTaskTitle(request: string, staffName: string): string {
  const trimmed = request.replace(/\s+/g, ' ').trim();
  const title = trimmed.length > 28 ? `${trimmed.slice(0, 28)}...` : trimmed;
  return `${staffName}に依頼: ${title}`;
}

export function loadAiStaff(): AiStaff[] {
  return readList<AiStaff>(STAFF_KEY, defaultAiStaff);
}

export function saveAiStaff(staff: AiStaff[]): void {
  writeList(STAFF_KEY, staff);
}

export function loadMessages(): HeyMessage[] {
  return readList<HeyMessage>(MESSAGES_KEY, []);
}

export function saveMessages(messages: HeyMessage[]): void {
  writeList(MESSAGES_KEY, messages);
}

export function loadHeyTasks(): HeyTask[] {
  return readList<HeyTask>(TASKS_KEY, []);
}

export function saveHeyTasks(tasks: HeyTask[]): void {
  writeList(TASKS_KEY, tasks);
}

export function loadLearningCandidates(): LearningCandidate[] {
  return readList<LearningCandidate>(LEARNING_KEY, defaultLearningCandidates);
}

export function saveLearningCandidates(candidates: LearningCandidate[]): void {
  writeList(LEARNING_KEY, candidates);
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeList<T>(key: string, value: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
