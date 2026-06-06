const MOCK_USER_ID = 'local-user';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function now(): string {
  return new Date().toISOString();
}

function localGet<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
}

function localSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function localGetStr(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function localSetStr(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkLog {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface GeneratedPost {
  id: string;
  user_id: string;
  source_log_id: string | null;
  content: string;
  created_at: string;
}

export interface SnsStyle {
  id: string;
  user_id: string;
  platform: string;
  account_id: string;
  style_prompt: string;
  created_at: string;
  updated_at: string;
}

// Tasks
export async function getTasks(): Promise<Task[]> {
  return localGet<Task>('opiyo_tasks');
}

export async function saveTask(title: string, deadline?: string): Promise<Task> {
  const task: Task = {
    id: generateId(),
    user_id: MOCK_USER_ID,
    title,
    status: 'todo',
    deadline: deadline || null,
    created_at: now(),
    updated_at: now(),
  };
  const tasks = localGet<Task>('opiyo_tasks');
  tasks.push(task);
  localSet('opiyo_tasks', tasks);
  return task;
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<void> {
  const tasks = localGet<Task>('opiyo_tasks');
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    tasks[idx].status = status;
    tasks[idx].updated_at = now();
    localSet('opiyo_tasks', tasks);
  }
}

export async function deleteTask(id: string): Promise<void> {
  localSet('opiyo_tasks', localGet<Task>('opiyo_tasks').filter((t) => t.id !== id));
}

// Work Logs
export async function getWorkLogs(): Promise<WorkLog[]> {
  return localGet<WorkLog>('opiyo_logs').slice(0, 50);
}

export async function saveWorkLog(content: string): Promise<WorkLog> {
  const log: WorkLog = {
    id: generateId(),
    user_id: MOCK_USER_ID,
    content,
    created_at: now(),
  };
  const logs = localGet<WorkLog>('opiyo_logs');
  logs.unshift(log);
  localSet('opiyo_logs', logs.slice(0, 50));
  return log;
}

export async function deleteWorkLog(id: string): Promise<void> {
  localSet('opiyo_logs', localGet<WorkLog>('opiyo_logs').filter((l) => l.id !== id));
}

// Usage tracking
export function trackUsage(featureName: string): void {
  localSetStr('opiyo_last_opened', now());
  const events = localGet<{ id: string; user_id: string; feature_name: string; created_at: string }>('opiyo_events');
  events.unshift({ id: generateId(), user_id: MOCK_USER_ID, feature_name: featureName, created_at: now() });
  localSet('opiyo_events', events.slice(0, 100));
}

export async function getMostUsedFeature(): Promise<string | null> {
  const events = localGet<{ feature_name: string }>('opiyo_events');
  if (!events.length) return null;
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.feature_name] = (counts[e.feature_name] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function getLastOpened(): string | null {
  return localGetStr('opiyo_last_opened');
}

// Generated Posts
export async function getGeneratedPosts(): Promise<GeneratedPost[]> {
  return localGet<GeneratedPost>('opiyo_posts').slice(0, 30);
}

export async function saveGeneratedPost(content: string, sourceLogId?: string): Promise<GeneratedPost> {
  const post: GeneratedPost = {
    id: generateId(),
    user_id: MOCK_USER_ID,
    source_log_id: sourceLogId || null,
    content,
    created_at: now(),
  };
  const posts = localGet<GeneratedPost>('opiyo_posts');
  posts.unshift(post);
  localSet('opiyo_posts', posts.slice(0, 30));
  return post;
}

// SNS Styles
export async function getSnsStyle(platform: string): Promise<SnsStyle | null> {
  const styles = localGet<SnsStyle>('opiyo_sns_styles');
  return styles.find((s) => s.platform === platform) ?? null;
}

export async function saveSnsStyle(platform: string, accountId: string, stylePrompt: string): Promise<SnsStyle> {
  const existing = await getSnsStyle(platform);
  const style: SnsStyle = {
    id: existing?.id || generateId(),
    user_id: MOCK_USER_ID,
    platform,
    account_id: accountId,
    style_prompt: stylePrompt,
    created_at: existing?.created_at || now(),
    updated_at: now(),
  };
  const others = localGet<SnsStyle>('opiyo_sns_styles').filter((s) => s.platform !== platform);
  localSet('opiyo_sns_styles', [style, ...others]);
  return style;
}
