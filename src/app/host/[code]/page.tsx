"use client";

import { useState, useEffect, use } from "react";
import {
  onRoomChange,
  onParticipantsChange,
  nextQuestion,
  showResults,
  backToPlaying,
  Room,
  Participant,
} from "@/lib/firestore";
import {
  QUESTIONS,
  ENNEAGRAM_TYPES,
  ENNEAGRAM_COLORS,
  getEnneagramInsight,
} from "@/lib/questions";

export default function HostPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const unsub1 = onRoomChange(code, setRoom);
    const unsub2 = onParticipantsChange(code, setParticipants);
    return () => {
      unsub1();
      unsub2();
    };
  }, [code]);

  if (!room) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="animate-pulse-soft text-gray-400">로딩 중...</div>
      </main>
    );
  }

  const currentQ =
    room.currentQuestion >= 0 && room.currentQuestion < QUESTIONS.length
      ? QUESTIONS[room.currentQuestion]
      : null;

  const isLastQuestion = room.currentQuestion >= QUESTIONS.length - 1;
  const isBeforeStart = room.currentQuestion < 0;

  const answeredCount = currentQ
    ? participants.filter((p) => p.answers?.[currentQ.id]).length
    : 0;

  const getTypeName = (type: number) =>
    ENNEAGRAM_TYPES.find((t) => t.value === type)?.label ?? `${type}유형`;

  const getTypeShort = (type: number) =>
    ENNEAGRAM_TYPES.find((t) => t.value === type)?.short ?? `${type}유형`;

  const handleNextQuestion = async () => {
    await nextQuestion(code);
  };

  const handleShowResults = async () => {
    await showResults(code);
  };

  const handleBackToPlaying = async () => {
    await backToPlaying(code);
  };

  // Before start — waiting room
  if (isBeforeStart) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎯</div>
            <h1 className="text-xl font-bold mb-2">진행자 대시보드</h1>
            <div className="room-code">{code}</div>
            <p className="text-gray-400 text-sm mt-2">
              참여자에게 이 코드를 공유해주세요
            </p>
          </div>

          <div className="card mb-4">
            <h3 className="font-semibold mb-3">
              👥 참여자 ({participants.length}명)
            </h3>
            {participants.length === 0 ? (
              <p className="text-gray-400 text-sm">
                아직 참여자가 없습니다...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <span
                    key={p.id}
                    className="badge"
                    style={{
                      backgroundColor: `${ENNEAGRAM_COLORS[p.enneagramType]}15`,
                      color: ENNEAGRAM_COLORS[p.enneagramType],
                    }}
                  >
                    {p.name} · {getTypeShort(p.enneagramType)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={handleNextQuestion}
            disabled={participants.length === 0}
          >
            🚀 첫 번째 질문 시작
          </button>
        </div>
      </main>
    );
  }

  // Reviewing state — show results
  if (room.status === "reviewing" && currentQ) {
    return (
      <main className="flex-1 p-6">
        <div className="w-full max-w-3xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="badge bg-purple-100 text-purple-700 mb-2">
              Q{room.currentQuestion + 1} / {QUESTIONS.length}
            </span>
            <h2 className="text-lg font-semibold leading-relaxed whitespace-pre-wrap">
              {currentQ.emoji} {currentQ.title}
            </h2>
          </div>

          {/* Responses */}
          <div className="space-y-4 mb-6">
            {participants.map((p) => {
              const ans = p.answers?.[currentQ.id];
              const insight = getEnneagramInsight(
                currentQ.id,
                p.enneagramType
              );
              return (
                <div key={p.id} className="card animate-fade-in">
                  {/* Participant info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{
                        backgroundColor:
                          ENNEAGRAM_COLORS[p.enneagramType] || "#888",
                      }}
                    >
                      {p.enneagramType}
                    </div>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div
                        className="text-xs"
                        style={{
                          color:
                            ENNEAGRAM_COLORS[p.enneagramType] || "#888",
                        }}
                      >
                        {getTypeName(p.enneagramType)}
                      </div>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-3">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {ans || "(아직 답변하지 않았습니다)"}
                    </p>
                  </div>

                  {/* Enneagram Insight */}
                  {insight && ans && (
                    <div
                      className="rounded-xl p-3 text-sm leading-relaxed"
                      style={{
                        backgroundColor: `${ENNEAGRAM_COLORS[p.enneagramType]}10`,
                        color: ENNEAGRAM_COLORS[p.enneagramType],
                      }}
                    >
                      💬 {insight}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={handleBackToPlaying}>
              ← 답변 계속 받기
            </button>
            {!isLastQuestion ? (
              <button className="btn-primary" onClick={handleNextQuestion}>
                다음 질문 →
              </button>
            ) : (
              <div className="btn-primary text-center opacity-80 cursor-default">
                🎉 모든 질문이 끝났습니다!
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Playing state — collecting answers
  return (
    <main className="flex-1 p-6">
      <div className="w-full max-w-lg mx-auto animate-fade-in">
        {/* Question display */}
        <div className="text-center mb-6">
          <span className="badge bg-purple-100 text-purple-700 mb-2">
            Q{room.currentQuestion + 1} / {QUESTIONS.length}
          </span>
        </div>

        <div className="card mb-6">
          <div className="text-4xl mb-3 text-center">
            {currentQ?.emoji}
          </div>
          <h2 className="text-lg font-semibold text-center leading-relaxed mb-2 whitespace-pre-wrap">
            {currentQ?.title}
          </h2>
          {currentQ?.description && (
            <p className="text-gray-400 text-sm text-center leading-relaxed whitespace-pre-wrap">
              {currentQ.description}
            </p>
          )}
        </div>

        {/* Answer status */}
        <div className="card mb-6">
          <h3 className="font-semibold mb-3">
            📝 답변 현황 ({answeredCount} / {participants.length})
          </h3>
          <div className="space-y-2">
            {participants.map((p) => {
              const answered = currentQ && p.answers?.[currentQ.id];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        backgroundColor:
                          ENNEAGRAM_COLORS[p.enneagramType] || "#888",
                      }}
                    >
                      {p.enneagramType}
                    </div>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <span className="text-sm">
                    {answered ? "✅" : "⏳"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <button
          className="btn-primary"
          onClick={handleShowResults}
        >
          📊 결과 보기
        </button>
      </div>
    </main>
  );
}
