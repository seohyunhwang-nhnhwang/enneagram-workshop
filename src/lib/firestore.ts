import { getApp } from "./firebase";

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

async function getDb() {
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(getApp());
}

export async function createRoom(): Promise<string> {
  const { doc, setDoc } = await import("firebase/firestore");
  const db = await getDb();
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
  const { doc, getDoc } = await import("firebase/firestore");
  const db = await getDb();
  const roomRef = doc(db, "rooms", code);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return null;
  return snap.data() as Room;
}

export function onRoomChange(
  code: string,
  callback: (room: Room) => void
): () => void {
  let unsub = () => {};
  (async () => {
    const { doc, onSnapshot } = await import("firebase/firestore");
    const db = await getDb();
    const roomRef = doc(db, "rooms", code);
    unsub = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Room);
      }
    });
  })();
  return () => unsub();
}

export async function joinRoom(
  code: string,
  name: string,
  enneagramType: number
): Promise<string> {
  const { doc, setDoc, collection } = await import("firebase/firestore");
  const db = await getDb();
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
  const { doc, updateDoc } = await import("firebase/firestore");
  const db = await getDb();
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
  const { doc, getDoc, updateDoc } = await import("firebase/firestore");
  const db = await getDb();
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
  const { doc, updateDoc } = await import("firebase/firestore");
  const db = await getDb();
  const roomRef = doc(db, "rooms", code);
  await updateDoc(roomRef, { status: "reviewing" });
}

export async function backToPlaying(code: string): Promise<void> {
  const { doc, updateDoc } = await import("firebase/firestore");
  const db = await getDb();
  const roomRef = doc(db, "rooms", code);
  await updateDoc(roomRef, { status: "playing" });
}

export function onParticipantsChange(
  code: string,
  callback: (participants: Participant[]) => void
): () => void {
  let unsub = () => {};
  (async () => {
    const { collection, query, onSnapshot } = await import("firebase/firestore");
    const db = await getDb();
    const q = query(collection(db, "rooms", code, "participants"));
    unsub = onSnapshot(q, (snap) => {
      const participants: Participant[] = [];
      snap.forEach((doc) => {
        participants.push(doc.data() as Participant);
      });
      callback(participants);
    });
  })();
  return () => unsub();
}
