"use client";

import { useState, useEffect, use } from "react";
import {
  joinRoom,
  submitAnswer,
  onRoomChange,
  Room,
} from "@/lib/firestore";
import { QUESTIONS, ENNEAGRAM_TYPES } from "@/lib/questions";

export default function PlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [step, setStep] = useState<"join" | "waiting" | "answering" | "submitted">("join");
  const [name, setName] = useState("");
  const [enneagramType, setEnneagramType] = useState(0);
  const [participantId, setParticipantId] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [answer, setAnswer] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = onRoomChange(code, (r) => {
      setRoom(r);
      if (r.status === "playing" && step === "submitted") {
        setStep("answering");
        setAnswer("");
      }
      if (r.status === "reviewing" && step === "answering") {
        setStep("submitted");
      }
    });
    return unsub;
  }, [code, step]);

  useEffect(() => {
    if (room && room.currentQuestion >= 0 && step === "waiting") {
      setStep("answering");
    }
  }, [room, step]);

  const currentQ =
    room && room.currentQuestion >= 0 && room.currentQuestion < QUESTIONS.length
      ? QUESTIONS[room.currentQuestion]
      : null;

  const handleJoin = async () => {
    if (!name.trim() || enneagramType === 0) return;
    try {
      const pid = await joinRoom(code, name.trim(), enneagramType);
      setParticipantId(pid);
      if (room && room.currentQuestion >= 0) {
        setStep("answering");
      } else {
        setStep("waiting");
      }
    } catch {
      alert("방 입장에 실패했습니다.");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentQ) return;
    try {
      await submitAnswer(code, participantId, currentQ.id, answer.trim());
      setAnsweredQuestions((prev) => new Set(prev).add(currentQ.id));
      setStep("submitted");
      setAnswer("");
    } catch {
      alert("답변 제출에 실패했습니다.");
    }
  };

  // Join screen
  if (step === "join") {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🧭</div>
            <h1 className="text-xl font-bold mb-1">저는 이런 사람이예요</h1>
            <div className="room-code mt-2">{code}</div>
          </div>

          <div className="card">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                이름
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="이름을 입력해주세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                에니어그램 유형
              </label>
              <select
                className="select-field"
                value={enneagramType}
                onChange={(e) => setEnneagramType(Number(e.target.value))}
              >
                <option value={0}>유형을 선택해주세요</option>
                {ENNEAGRAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={handleJoin}
              disabled={!name.trim() || enneagramType === 0}
            >
              참가하기
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Waiting screen
  if (step === "waiting") {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in text-center">
          <div className="card">
            <div className="text-4xl mb-4 animate-pulse-soft">⏳</div>
            <h2 className="text-lg font-semibold mb-2">
              {name}님, 환영합니다!
            </h2>
            <p className="text-gray-500 text-sm">
              진행자가 첫 번째 질문을 시작할 때까지
              <br />
              잠시 기다려주세요.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Answering screen
  if (step === "answering" && currentQ) {
    const alreadyAnswered = answeredQuestions.has(currentQ.id);

    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-6">
            <span className="badge bg-purple-100 text-purple-700">
              Q{(room?.currentQuestion ?? 0) + 1} / {QUESTIONS.length}
            </span>
          </div>

          <div className="card">
            <div className="text-3xl mb-3 text-center">{currentQ.emoji}</div>
            <h2 className="text-lg font-semibold mb-2 text-center leading-relaxed">
              {currentQ.title}
            </h2>
            {currentQ.description && (
              <p className="text-gray-400 text-sm text-center mb-4 leading-relaxed">
                {currentQ.description}
              </p>
            )}

            {alreadyAnswered ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-gray-500 text-sm">답변이 제출되었습니다.</p>
              </div>
            ) : (
              <>
                <textarea
                  className="textarea-field mb-4"
                  placeholder="답변을 입력해주세요..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <button
                  className="btn-primary"
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim()}
                >
                  제출하기
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Submitted / Reviewing screen
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="card">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-semibold mb-2">답변이 제출되었습니다</h2>
          <p className="text-gray-500 text-sm">
            {room?.status === "reviewing"
              ? "진행자가 결과를 공유하고 있습니다. 화면을 확인해주세요."
              : "다음 질문을 기다려주세요."}
          </p>
        </div>
      </div>
    </main>
  );
}
