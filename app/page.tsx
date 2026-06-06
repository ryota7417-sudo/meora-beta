'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks, trackUsage } from '@/lib/storage';
import type { Task } from '@/lib/storage';
import { Card } from '@/components/Card';

export default function HomePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    trackUsage('home');
    getTasks().then((t) => setTasks(t));
  }, []);

  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="text-center">
        <p className="text-4xl mb-2">🐥</p>
        <h1 className="text-2xl font-bold text-gray-800">HEY!おぴよ!</h1>
        <p className="text-sm text-gray-400 mt-1">クリエイターのアシスタント</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-600">タスク</p>
          <button type="button" onClick={() => router.push('/tasks')} className="text-xs text-amber-500">
            すべて見る ›
          </button>
        </div>
        {activeTasks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {activeTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-sm text-gray-700">
                <span>{task.status === 'in_progress' ? '🔄' : '⬜'}</span>
                <span className="truncate">{task.title}</span>
              </div>
            ))}
            {activeTasks.length > 3 && (
              <p className="text-xs text-gray-400 mt-1">他 {activeTasks.length - 3} 件</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">タスクはまだないよ 🐥</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => router.push('/tasks')}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-2 text-center active:scale-95 transition-all"
        >
          <span className="text-3xl">✅</span>
          <p className="text-sm font-medium text-gray-700">タスク管理</p>
          <p className="text-xs text-gray-400">{activeTasks.length} 件進行中</p>
        </button>
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-2 text-center active:scale-95 transition-all"
        >
          <span className="text-3xl">⚙️</span>
          <p className="text-sm font-medium text-gray-700">投稿スタイル</p>
          <p className="text-xs text-gray-400">SNS設定</p>
        </button>
      </div>

      {doneTasks.length > 0 && (
        <p className="text-xs text-gray-400 text-center">完了済みタスク: {doneTasks.length} 件</p>
      )}
    </div>
  );
}
