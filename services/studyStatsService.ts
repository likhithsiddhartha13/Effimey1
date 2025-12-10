import { db, auth } from "./firebase";
import firebase from "./firebase";

export interface DailyData {
  day: string;
  hours: number;
}

export interface StudyData {
  weekStart: string;
  daily: DailyData[];
  history: { weekStart: string; total: number }[];
}

const COLLECTION = 'studyfocus';

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getInitialData = (weekStart: string): StudyData => ({
  weekStart,
  daily: [
    { day: 'M', hours: 0 },
    { day: 'T', hours: 0 },
    { day: 'W', hours: 0 },
    { day: 'T', hours: 0 },
    { day: 'F', hours: 0 },
    { day: 'S', hours: 0 },
    { day: 'S', hours: 0 },
  ],
  history: []
});

export const subscribeToStudyStats = (callback: (data: StudyData) => void) => {
  if (!auth.currentUser) return () => {};

  return db.collection(COLLECTION).doc(auth.currentUser.uid).onSnapshot(async (doc) => {
    const currentWeekStart = getStartOfWeek(new Date()).toISOString();

    if (!doc.exists) {
      const initial = getInitialData(currentWeekStart);
      // We don't wait for this to prevent blocking, Firestore will trigger another snapshot
      doc.ref.set(initial).catch(e => console.error("Error init stats:", e));
      return;
    }

    const data = doc.data() as StudyData;
    const storedWeekStart = new Date(data.weekStart);
    const currentWeekStartDate = new Date(currentWeekStart);

    // Weekly Reset Logic
    if (storedWeekStart.getTime() < currentWeekStartDate.getTime()) {
        const currentTotal = data.daily.reduce((acc, curr) => acc + curr.hours, 0);
        const history = data.history || [];
        
        if (currentTotal > 0) {
            history.push({ weekStart: data.weekStart, total: currentTotal });
        }
        
        const newData = { ...getInitialData(currentWeekStart), history };
        
        // Update DB with reset data
        doc.ref.set(newData).catch(e => console.error("Error resetting stats:", e));
    } else {
        callback(data);
    }
  });
};

export const updateStudyTime = async (minutes: number) => {
  if (!auth.currentUser) return;
  
  const docRef = db.collection(COLLECTION).doc(auth.currentUser.uid);
  
  try {
    // Try transaction first (consistency)
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
         const start = getStartOfWeek(new Date()).toISOString();
         transaction.set(docRef, getInitialData(start));
         return; 
      }

      const data = doc.data() as StudyData;
      const todayIndex = new Date().getDay(); 
      // Map JS getDay() (0=Sun) to our array index (0=Mon...6=Sun)
      let arrayIndex = todayIndex - 1;
      if (todayIndex === 0) arrayIndex = 6;

      const newDaily = [...data.daily];
      newDaily[arrayIndex].hours += (minutes / 60);

      transaction.update(docRef, { daily: newDaily });
    });
  } catch (error) {
    // Transaction failed (likely offline). Fallback to optimistic update.
    try {
        const doc = await docRef.get(); // Reads from cache if offline
        if (doc.exists) {
            const data = doc.data() as StudyData;
            const todayIndex = new Date().getDay(); 
            let arrayIndex = todayIndex - 1;
            if (todayIndex === 0) arrayIndex = 6;

            const newDaily = [...data.daily];
            newDaily[arrayIndex].hours += (minutes / 60);
            
            // Standard update will queue when offline
            await docRef.update({ daily: newDaily });
        }
    } catch (innerError) {
        console.error("Error updating study time:", innerError);
    }
  }
};

// Legacy support / Helper
export const initStudyStats = async () => {
    if (!auth.currentUser) return;
    const docRef = db.collection(COLLECTION).doc(auth.currentUser.uid);
    const doc = await docRef.get();
    if (!doc.exists) {
        const start = getStartOfWeek(new Date()).toISOString();
        await docRef.set(getInitialData(start));
    }
};

export const getTotalHours = (data: StudyData): number => {
    return data?.daily?.reduce((acc, curr) => acc + curr.hours, 0) || 0;
};

export const getTrend = (data: StudyData): { value: string, isUp: boolean } => {
    if (!data || !data.daily) return { value: "0%", isUp: true };
    
    const currentTotal = getTotalHours(data);
    const lastWeek = data.history?.[data.history.length - 1];
    
    if (!lastWeek || lastWeek.total === 0) return { value: "100%", isUp: true };
    
    const diff = currentTotal - lastWeek.total;
    const percentage = ((Math.abs(diff) / lastWeek.total) * 100).toFixed(0);
    
    return {
        value: `${percentage}%`,
        isUp: diff >= 0
    };
};