'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { HeyTask, TaskStatus, formatDate, loadHeyTasks, saveHeyTasks } from '@/lib/hey-mvp';

const statuses: TaskStatus[] = ['未着手', '進行中', '完了'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<HeyTask[]>([]);

  useEffect(() => {
    Promise.resolve().then(() => setTasks(loadHeyTasks()));
  }, []);

  function updateStatus(id: string, status: TaskStatus) {
    const nextTasks = tasks.map((task) => (task.id === id ? { ...task, status } : task));
    setTasks(nextTasks);
    saveHeyTasks(nextTasks);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-gray-500">タスク</p>
        <h1 className="text-2xl font-bold text-gray-900">依頼から作られたタスク</h1>
      </div>

      {tasks.length === 0 ? (
        <Card className="text-center">
          <p className="text-base font-medium text-gray-800">まだタスクはありません。</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            チャットで担当AIに依頼すると、ここにタスクが追加されます。
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <Card key={task.id} className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-gray-500">タスク名</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{task.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">担当AI</p>
                  <p className="mt-1 text-gray-800">{task.staffName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">作成日</p>
                  <p className="mt-1 text-gray-800">{formatDate(task.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500">ステータス</p>
                <div className="grid grid-cols-3 gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStatus(task.id, status)}
                      className={`rounded-2xl border px-3 py-2 text-sm transition ${
                        task.status === status
                          ? 'border-amber-400 bg-amber-50 font-semibold text-gray-900'
                          : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
