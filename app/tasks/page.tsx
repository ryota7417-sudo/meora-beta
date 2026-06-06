'use client';

import { useState, useEffect } from 'react';
import { getTasks, saveTask, updateTaskStatus, deleteTask, trackUsage } from '@/lib/storage';
import type { Task } from '@/lib/storage';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    setTasks(await getTasks());
  }

  useEffect(() => {
    trackUsage('tasks');
    reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd() {
    if (!newTitle.trim()) return;
    await saveTask(newTitle.trim(), newDeadline || undefined);
    setNewTitle('');
    setNewDeadline('');
    setShowForm(false);
    await reload();
  }

  async function handleToggle(task: Task) {
    const next: Task['status'] =
      task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done';
    await updateTaskStatus(task.id, next);
    await reload();
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    await reload();
  }

  const active = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">タスク ✅</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '閉じる' : '+ 追加'}
        </Button>
      </div>

      {showForm && (
        <Card className="flex flex-col gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="タスク名を入力..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-amber-400"
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAdd()}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">締切（任意）</label>
            <input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-amber-400"
            />
          </div>
          <Button onClick={handleAdd} disabled={!newTitle.trim()}>
            追加する
          </Button>
        </Card>
      )}

      {active.length === 0 && !showForm && (
        <p className="text-center text-gray-400 mt-8">タスクはまだないよ 🐥</p>
      )}

      <div className="flex flex-col gap-2">
        {active.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </div>

      {done.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mt-2">完了済み</p>
          <div className="flex flex-col gap-2 opacity-60">
            {done.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const statusIcon = task.status === 'done' ? '✅' : task.status === 'in_progress' ? '🔄' : '⬜';
  const deadlineText = task.deadline
    ? (() => {
        const d = new Date(task.deadline);
        const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 0) return { label: '期限切れ', warn: true };
        if (days === 0) return { label: '今日が締切', warn: true };
        if (days === 1) return { label: '明日が締切', warn: true };
        return { label: `あと${days}日`, warn: false };
      })()
    : null;

  return (
    <Card className="flex items-start gap-3">
      <button type="button" onClick={() => onToggle(task)} className="text-xl mt-0.5 shrink-0">
        {statusIcon}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-base text-gray-800 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </p>
        {deadlineText && (
          <p className={`text-xs mt-0.5 ${deadlineText.warn ? 'text-red-400' : 'text-gray-400'}`}>
            {deadlineText.label}
          </p>
        )}
      </div>
      <button type="button" onClick={() => onDelete(task.id)} className="text-gray-300 hover:text-gray-500 text-sm shrink-0">
        ✕
      </button>
    </Card>
  );
}
