'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  AiStaff,
  HeyMessage,
  HeyTask,
  createTaskTitle,
  formatDate,
  getMockResponse,
  getStaffStatus,
  loadAiStaff,
  loadHeyTasks,
  loadMessages,
  makeId,
  saveAiStaff,
  saveHeyTasks,
  saveMessages,
} from '@/lib/hey-mvp';

export default function ChatPage() {
  const [staffList, setStaffList] = useState<AiStaff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('manager');
  const [messages, setMessages] = useState<HeyMessage[]>([]);
  const [tasks, setTasks] = useState<HeyTask[]>([]);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.resolve().then(() => {
      setStaffList(loadAiStaff());
      setMessages(loadMessages());
      setTasks(loadHeyTasks());
    });
  }, []);

  const selectedStaff = useMemo(
    () => staffList.find((staff) => staff.id === selectedStaffId) ?? staffList[0],
    [selectedStaffId, staffList],
  );

  const selectedMessages = messages.filter((message) => message.staffId === selectedStaff?.id);

  function handleSend() {
    if (!selectedStaff || !input.trim()) return;
    if (selectedStaff.currentStamina < selectedStaff.staminaCost) {
      setNotice('この担当AIの体力が足りません。明日また回復します。');
      return;
    }

    const request = input.trim();
    const createdAt = new Date().toISOString();
    const userMessage: HeyMessage = {
      id: makeId('message'),
      staffId: selectedStaff.id,
      sender: 'user',
      content: request,
      createdAt,
    };
    const aiMessage: HeyMessage = {
      id: makeId('message'),
      staffId: selectedStaff.id,
      sender: 'ai',
      content: getMockResponse(selectedStaff.id),
      createdAt: new Date().toISOString(),
    };
    const nextStaff = staffList.map((staff) =>
      staff.id === selectedStaff.id
        ? { ...staff, currentStamina: Math.max(0, staff.currentStamina - staff.staminaCost) }
        : staff,
    );
    const nextTask: HeyTask = {
      id: makeId('task'),
      title: createTaskTitle(request, selectedStaff.name),
      staffName: selectedStaff.name,
      status: '未着手',
      createdAt,
      staminaCost: selectedStaff.staminaCost,
    };
    const nextMessages = [...messages, userMessage, aiMessage];
    const nextTasks = [nextTask, ...tasks];

    setStaffList(nextStaff);
    setMessages(nextMessages);
    setTasks(nextTasks);
    setInput('');
    setNotice('依頼を受け付けました。タスクにも追加しました。');
    saveAiStaff(nextStaff);
    saveMessages(nextMessages);
    saveHeyTasks(nextTasks);
  }

  function handleEnergyDrink() {
    if (!selectedStaff) return;
    const nextStaff = staffList.map((staff) =>
      staff.id === selectedStaff.id
        ? { ...staff, currentStamina: Math.min(staff.maxStamina, staff.currentStamina + 20) }
        : staff,
    );
    setStaffList(nextStaff);
    saveAiStaff(nextStaff);
    setNotice('エナジードリンクで体力を20回復しました。');
  }

  if (!selectedStaff) {
    return <p className="mt-10 text-center text-sm text-gray-500">担当AIを準備しています。</p>;
  }

  const staminaPercent = Math.round((selectedStaff.currentStamina / selectedStaff.maxStamina) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-gray-500">チャット</p>
        <h1 className="text-2xl font-bold text-gray-900">担当AIに依頼する</h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {staffList.map((staff) => (
          <button
            key={staff.id}
            type="button"
            onClick={() => {
              setSelectedStaffId(staff.id);
              setNotice('');
            }}
            className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
              selectedStaff.id === staff.id
                ? 'border-amber-400 bg-amber-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            {staff.name}
          </button>
        ))}
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{selectedStaff.name}</p>
            <p className="text-sm text-gray-500">{selectedStaff.role}</p>
          </div>
          <p className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{getStaffStatus(selectedStaff)}</p>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>体力</span>
            <span>
              {selectedStaff.currentStamina} / {selectedStaff.maxStamina}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-amber-400" style={{ width: `${staminaPercent}%` }} />
          </div>
        </div>
        <p className="text-xs text-gray-500">この担当AIは1回の依頼で体力を{selectedStaff.staminaCost}使います。</p>
      </Card>

      <Card className="min-h-64 flex flex-col gap-3">
        {selectedMessages.length > 0 ? (
          selectedMessages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.sender === 'user'
                  ? 'self-end bg-gray-900 text-white'
                  : 'self-start bg-gray-100 text-gray-700'
              }`}
            >
              <p>{message.content}</p>
              <p className={`mt-1 text-[11px] ${message.sender === 'user' ? 'text-gray-300' : 'text-gray-400'}`}>
                {formatDate(message.createdAt)}
              </p>
            </div>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="text-sm leading-relaxed text-gray-400">
              依頼したいことを下に入力してください。
              <br />
              送信すると、返答とタスクが作られます。
            </p>
          </div>
        )}
      </Card>

      {notice && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-gray-700">{notice}</div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
          placeholder="例: 来週のイベント告知文を作って"
          className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-amber-400"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={handleSend} disabled={!input.trim()}>
            送信する
          </Button>
          <Button variant="secondary" onClick={handleEnergyDrink}>
            エナジードリンクを使う
          </Button>
        </div>
      </div>
    </div>
  );
}
