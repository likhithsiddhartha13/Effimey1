import { db, storage } from "./firebase";
import firebase from "./firebase";
import { Note } from "../types";

const COLLECTION = 'personal_notes';

export const getNotes = async (userId: string): Promise<Note[]> => {
  try {
    // Note: requires index for compound query userId + createdAt. 
    // Fallback to client-side sort if index missing in dev.
    const snapshot = await db.collection(COLLECTION).where("userId", "==", userId).get();
    const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
    
    // Sort by lastModified (desc)
    return notes.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
};

export const createNote = async (note: Omit<Note, 'id'>, file?: File) => {
  try {
    let attachmentUrl = note.attachmentUrl;
    let attachmentName = note.attachmentName;
    let attachmentType = note.attachmentType;

    if (file && !attachmentUrl) {
      // STRICT PATH: /user_uploads/{uid}/{filename}
      const storageRef = storage.ref(`user_uploads/${note.userId}/${file.name}`);
      const snapshot = await storageRef.put(file);
      attachmentUrl = await snapshot.ref.getDownloadURL();
      attachmentName = file.name;
      attachmentType = file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'doc';
    }

    const docData = {
      ...note,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
      lastModified: new Date().toISOString(),
      createdAt: firebase.firestore.Timestamp.now()
    };

    const docRef = await db.collection(COLLECTION).add(docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
};

export const deleteNote = async (id: string) => {
  try {
    await db.collection(COLLECTION).doc(id).delete();
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};