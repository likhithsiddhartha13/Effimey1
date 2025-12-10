import { db } from "./firebase";
import { SyllabusSubject, SyllabusTopic } from "../types";

const COLLECTION = 'syllabus';

// Subscribe to a user's syllabus
export const subscribeToSyllabus = (userId: string, callback: (subjects: SyllabusSubject[]) => void) => {
  const q = db.collection(COLLECTION).where("userId", "==", userId);
  
  return q.onSnapshot((snapshot) => {
    const subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SyllabusSubject));
    callback(subjects);
  }, (error) => {
    console.error("Error subscribing to syllabus:", error);
  });
};

// Create a new Subject
export const createSubject = async (userId: string, name: string) => {
  try {
    const newSubject: Omit<SyllabusSubject, 'id'> = {
      userId,
      name,
      topics: [],
      progress: 0,
      color: 'bg-brand-red' // Default color class logic can be expanded
    };
    await db.collection(COLLECTION).add(newSubject);
  } catch (error) {
    console.error("Error creating subject:", error);
    throw error;
  }
};

// Delete a Subject
export const deleteSubject = async (subjectId: string) => {
  try {
    await db.collection(COLLECTION).doc(subjectId).delete();
  } catch (error) {
    console.error("Error deleting subject:", error);
    throw error;
  }
};

// Update Topics (Add, Remove, Toggle)
// We simply replace the topics array and recalculate progress
export const updateSubjectTopics = async (subjectId: string, topics: SyllabusTopic[]) => {
  try {
    const total = topics.length;
    const completed = topics.filter(t => t.isCompleted).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    await db.collection(COLLECTION).doc(subjectId).update({
      topics,
      progress
    });
  } catch (error) {
    console.error("Error updating topics:", error);
    throw error;
  }
};