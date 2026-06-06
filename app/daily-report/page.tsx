'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { HeyTask, defaultLearningCandidates, loadHeyTasks } from '@/lib/hey-mvp';

export default function DailyReportPage() {
  const [tasks, setTasks] = useState<HeyTask[]>([]);

  useEffect(() => {
    Promise.resolve().then(() => setTasks(loadHeyTasks()));
  }, []);

  const summary = useMemo(() => {
    const byStaff = tasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.staffName] = (acc[task.staffName] || 0) + 1;
      return acc;
    }, {});

    return {
      requestCount: tasks.length,
      staminaUsed: tasks.reduce((total, task) => total + task.staminaCost, 0),
      doneCount: tasks.filter((task) => task.status === '完了').length,
      byStaff,
    };
  }, [tasks]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-gray-500">日報</p>
        <h1 className="text-2xl font-bold text-gray-900">今日のHEY日報</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="今日の依頼数" value={`${summary.requestCount}件`} />
        <SummaryCard label="消費した体力" value={`${summary.staminaUsed}`} />
        <SummaryCard label="完了タスク数" value={`${summary.doneCount}件`} />
        <SummaryCard
          label="担当AI別の作業数"
          value={
            Object.keys(summary.byStaff).length > 0
              ? Object.entries(summary.byStaff)
                  .map(([name, count]) => `${name} ${count}件`)
                  .join(' / ')
              : 'まだありません'
          }
        />
      </div>

      <Card>
        <h2 className="text-lg font-bold text-gray-900">学習メモ</h2>
        <div className="mt-3 flex flex-col gap-2">
          {defaultLearningCandidates.map((candidate) => (
            <p key={candidate.id} className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {candidate.content}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-h-28">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-3 text-xl font-bold leading-snug text-gray-900">{value}</p>
    </Card>
  );
}
