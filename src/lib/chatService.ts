/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const createThread = async (title: string, model: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Unauthorized");

  const threadId = doc(collection(db, 'threads')).id;
  const threadRef = doc(db, 'threads', threadId);

  try {
    await setDoc(threadRef, {
      threadId,
      ownerId: userId,
      title,
      lastModel: model,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return threadId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `threads/${threadId}`);
  }
};

export const saveMessage = async (threadId: string, role: 'user' | 'assistant', content: any, modelLabel?: string) => {
  const messagesRef = collection(db, 'threads', threadId, 'messages');
  const messageId = doc(messagesRef).id;
  try {
    const payload: any = {
      messageId,
      threadId,
      role,
      content,
      createdAt: serverTimestamp(),
    };
    if (modelLabel) payload.modelLabel = modelLabel;
    
    await setDoc(doc(messagesRef, messageId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `threads/${threadId}/messages`);
  }
};
