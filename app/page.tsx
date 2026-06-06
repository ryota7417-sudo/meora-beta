'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { AiStaff, getStaffStatus, loadAiStaff } from '@/lib/hey-mvp';

export default function HomePage() {
  const [staffList, setStaffList] = useState<AiStaff[]>([]);

  useEffect(() => {
    Promise.resolve().then(() => setStaffList(loadAiStaff()));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <section className="pt-3">
        <p className="text-sm font-medium text-amber-600">HEY</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-gray-950">HEY</h1>
        <p className="mt-3 text-base leading-relaxed text-gray-600">
          クリエイターの仕事を、担当AIと一緒に片付ける
        </p>
      </section>

      <Card className="bg-gray-950 text-white">
        <p className="text-sm leading-relaxed text-gray-100">
          担当AIには体力があります。依頼すると体力を消費し、毎日回復します。
        </p>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">担当AI</h2>
          <Link href="/chat" className="text-sm font-medium text-amber-600">
            依頼する
          </Link>
        </div>

        {staffList.map((staff) => {
          const staminaPercent = Math.round((staff.currentStamina / staff.maxStamina) * 100);
          return (
            <Card key={staff.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">{staff.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{staff.role}</p>
                </div>
                <p className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {getStaffStatus(staff)}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">{staff.description}</p>
              <div>
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>体力</span>
                  <span>
                    {staff.currentStamina} / {staff.maxStamina}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${staminaPercent}%` }} />
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
