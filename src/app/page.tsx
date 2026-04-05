"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom, getRoom } from "@/lib/firestore";

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRoom = async () => {
    setLoading(true);
    setError("");
    try {
      alert("방 생성 시작...");
      const code = await createRoom();
      alert(`방 생성 성공! 코드: ${code}`);
      router.push(`/host/${code}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
      setError(`방 생성 실패: ${msg}`);
      alert(`방 생성 실패: ${msg}`);
      console.error("createRoom error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError("방 코드를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const room = await getRoom(roomCode.toUpperCase());
      if (!room) {
        setError("존재하지 않는 방 코드입니다.");
        return;
      }
      router.push(`/play/${roomCode.toUpperCase()}`);
    } catch {
      setError("방 입장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🧭</div>
          <h1 className="text-2xl font-bold mb-2">저는 이런 사람이예요</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            같은 상황, 다른 반응
            <br />
            에니어그램으로 서로를 이해하는 시간
          </p>
        </div>

        {/* Create Room */}
        <div className="card mb-4">
          <h2 className="font-semibold text-lg mb-3">🎯 진행자</h2>
          <button
            className="btn-primary"
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? "생성 중..." : "방 만들기"}
          </button>
        </div>

        {/* Join Room */}
        <div className="card">
          <h2 className="font-semibold text-lg mb-3">👋 참여자</h2>
          <input
            type="text"
            className="input-field mb-3 text-center tracking-widest uppercase"
            placeholder="방 코드 입력"
            maxLength={6}
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
          />
          <button
            className="btn-secondary"
            onClick={handleJoinRoom}
            disabled={loading || !roomCode.trim()}
          >
            참가하기
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          에니어그램 리더십 워크숍 · Better US
        </p>
      </div>
    </main>
  );
}
