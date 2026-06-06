'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import {
  LearningCandidate,
  LearningStatus,
  loadLearningCandidates,
  saveLearningCandidates,
} from '@/lib/hey-mvp';

const actions: LearningStatus[] = ['採用', '保留', '却下'];

export default function LearningPage() {
  const [candidates, setCandidates] = useState<LearningCandidate[]>([]);

  useEffect(() => {
    Promise.resolve().then(() => setCandidates(loadLearningCandidates()));
  }, []);

  function updateStatus(id: string, status: LearningStatus) {
    const nextCandidates = candidates.map((candidate) =>
      candidate.id === id ? { ...candidate, status } : candidate,
    );
    setCandidates(nextCandidates);
    saveLearningCandidates(nextCandidates);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-gray-500">学習候補</p>
        <h1 className="text-2xl font-bold text-gray-900">HEYに覚えてほしいこと</h1>
      </div>

      <Card className="bg-gray-950 text-white">
        <p className="text-sm leading-relaxed text-gray-100">
          採用した学習候補は、次回以降のHEYの動きに反映されます。
        </p>
      </Card>

      <div className="flex flex-col gap-3">
        {candidates.map((candidate) => (
          <Card key={candidate.id} className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-gray-500">内容</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{candidate.content}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="発生元" value={candidate.source} />
              <Info label="反映先" value={candidate.target} />
              <Info label="ステータス" value={candidate.status} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => updateStatus(candidate.id, action)}
                  className={`rounded-2xl border px-3 py-2 text-sm transition ${
                    candidate.status === action
                      ? 'border-amber-400 bg-amber-50 font-semibold text-gray-900'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-gray-800">{value}</p>
    </div>
  );
}
