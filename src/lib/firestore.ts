import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface Room {
  code: string;
  createdAt: number;
  currentQuestion: number;
  status: "waiting" | "playing" | "reviewing";
}

export interface Participant {
  id: string;
  name: string;
  enneagramType: number;
  answers: Record<string, string>;
}

export async function createRoom(): Promise<string> {
  const code = generateRoomCode();
  const roomRef = doc(db, "rooms", code);
  await setDoc(roomRef, {
    code,
    createdAt: Date.now(),
    currentQuestion: -1,
    status: "waiting",
  });
  return code;
}

export async function getRoom(code: string): Promise<Room | null> {
  const roomRef = doc(db, "rooms", code);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return null;
  return snap.data() as Room;
}

export function onRoomChange(
  code: string,
  callback: (room: Room) => void
): () => void {
  const roomRef = doc(db, "rooms", code);
  return onSnapshot(roomRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Room);
    }
  });
}

export async function joinRoom(
  code: string,
  name: string,
  enneagramType: number
): Promise<string> {
  const participantRef = doc(collection(db, "rooms", code, "participants"));
  const id = participantRef.id;
  await setDoc(participantRef, {
    id,
    name,
    enneagramType,
    answers: {},
  });
  return id;
}

export async function submitAnswer(
  code: string,
  participantId: string,
  questionId: string,
  answer: string
): Promise<void> {
  const participantRef = doc(
    db,
    "rooms",
    code,
    "participants",
    participantId
  );
  await updateDoc(participantRef, {
    [`answers.${questionId}`]: answer,
  });
}

export async function nextQuestion(code: string): Promise<void> {
  const roomRef = doc(db, "rooms", code);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const room = snap.data() as Room;
  await updateDoc(roomRef, {
    currentQuestion: room.currentQuestion + 1,
    status: "playing",
  });
}

export async function showResults(code: string): Promise<void> {
  const roomRef = doc(db, "rooms", code);
  await updateDoc(roomRef, { status: "reviewing" });
}

export async function backToPlaying(code: string): Promise<void> {
  const roomRef = doc(db, "rooms", code);
  await updateDoc(roomRef, { status: "playing" });
}

export function onParticipantsChange(
  code: string,
  callback: (participants: Participant[]) => void
): () => void {
  const q = query(collection(db, "rooms", code, "participants"));
  return onSnapshot(q, (snap) => {
    const participants: Participant[] = [];
    snap.forEach((doc) => {
      participants.push(doc.data() as Participant);
    });
    callback(participants);
  });
}

export async function getParticipants(
  code: string
): Promise<Participant[]> {
  const q = query(collection(db, "rooms", code, "participants"));
  const snap = await getDocs(q);
  const participants: Participant[] = [];
  snap.forEach((doc) => {
    participants.push(doc.data() as Participant);
  });
  return participants;
}
