import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export async function saveChat(chatId: string | null, messages: any[], title: string = "New Chat") {
  if (!auth.currentUser) return null;
  
  const chatData = {
    userId: auth.currentUser.uid,
    messages,
    title,
    updatedAt: serverTimestamp()
  };

  if (chatId) {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, chatData);
    return chatId;
  } else {
    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    return chatRef.id;
  }
}

export async function getChats() {
  if (!auth.currentUser) return [];
  const q = query(
    collection(db, 'chats'), 
    where('userId', '==', auth.currentUser.uid),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveDocument(docId: string | null, content: string, title: string = "Untitled Document") {
  if (!auth.currentUser) return null;
  const docData = {
    userId: auth.currentUser.uid,
    content,
    title,
    updatedAt: serverTimestamp()
  };

  if (docId) {
    await updateDoc(doc(db, 'documents', docId), docData);
    return docId;
  } else {
    const res = await addDoc(collection(db, 'documents'), docData);
    return res.id;
  }
}

export async function getDocuments() {
  if (!auth.currentUser) return [];
  const q = query(collection(db, 'documents'), where('userId', '==', auth.currentUser.uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function savePresentation(presId: string | null, slides: any[], title: string = "New Presentation") {
  if (!auth.currentUser) return null;
  const presData = {
    userId: auth.currentUser.uid,
    slides,
    title,
    updatedAt: serverTimestamp()
  };

  if (presId) {
    await updateDoc(doc(db, 'presentations', presId), presData);
    return presId;
  } else {
    const res = await addDoc(collection(db, 'presentations'), presData);
    return res.id;
  }
}

export async function getPresentations() {
  if (!auth.currentUser) return [];
  const q = query(collection(db, 'presentations'), where('userId', '==', auth.currentUser.uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteChat(chatId: string) {
  if (!auth.currentUser) return;
  await deleteDoc(doc(db, 'chats', chatId));
}
