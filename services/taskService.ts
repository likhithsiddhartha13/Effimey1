import { db } from "./firebase";
import { Task, TaskStatus } from '../types';

const COLLECTION = 'tasks';

// Get tasks for a specific user (Real-time listener support optional, using fetch for now)
export const getTasks = async (userId: string): Promise<Task[]> => {
  try {
    const querySnapshot = await db.collection(COLLECTION).where("userId", "==", userId).get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

// Subscribe to tasks (Real-time)
export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void) => {
  const q = db.collection(COLLECTION).where("userId", "==", userId);
  return q.onSnapshot((snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    callback(tasks);
  }, (error) => {
    console.error("Error subscribing to tasks:", error);
    // callback([]); // Optionally clear tasks or handle error in UI
  });
};

export const saveTask = async (task: Omit<Task, 'id'>) => {
  try {
    await db.collection(COLLECTION).add(task);
  } catch (error) {
    console.error("Error saving task:", error);
    throw error;
  }
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  try {
    await db.collection(COLLECTION).doc(id).update(updates);
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (id: string) => {
  try {
    await db.collection(COLLECTION).doc(id).delete();
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export const toggleTaskStatus = async (task: Task) => {
  try {
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    // Include userId in update for security rules that check request.resource.data.userId
    await db.collection(COLLECTION).doc(task.id).update({ 
      status: newStatus,
      userId: task.userId 
    });
  } catch (error) {
    console.error("Error toggling task:", error);
    throw error;
  }
};

export const getTaskStats = async (userId: string) => {
  const tasks = await getTasks(userId);
  const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const total = tasks.length;
  const pending = total - done;
  
  return { done, pending, total };
};