
import { db, auth } from "./firebase";
import firebase from "./firebase";
import { CalendarEvent, EventProperty } from "../types";

const COLLECTION = 'schedule';

// --- RRule Logic ---

/**
 * Generates an iCalendar RRule string from user inputs.
 */
export const generateRRuleString = (
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  interval: number,
  endDate?: string // YYYY-MM-DD
): string => {
  let rule = `FREQ=${frequency}`;
  if (interval > 1) rule += `;INTERVAL=${interval}`;
  if (endDate) {
    // Basic formatting for UNTIL (needs to be YYYYMMDD typically)
    const formattedDate = endDate.replace(/-/g, '');
    rule += `;UNTIL=${formattedDate}`;
  }
  return rule;
};

/**
 * Expands recurring events for a specific view range.
 * This is a lightweight client-side expansion since we don't have the 'rrule' library installed.
 */
export const expandRecurringEvents = (
  events: CalendarEvent[],
  startRange: Date,
  endRange: Date
): CalendarEvent[] => {
  const expandedEvents: CalendarEvent[] = [];

  events.forEach(event => {
    if (!event.isRecurring || !event.rrule || !event.date) {
      // Non-recurring events pass through if they are in range (handled by caller usually, but safe to keep)
      expandedEvents.push(event);
      return;
    }

    // Parse RRule (Simplified Parser)
    const ruleParts = event.rrule.split(';');
    const freqPart = ruleParts.find(p => p.startsWith('FREQ='));
    const intervalPart = ruleParts.find(p => p.startsWith('INTERVAL='));
    const untilPart = ruleParts.find(p => p.startsWith('UNTIL='));

    const freq = freqPart ? freqPart.split('=')[1] : 'DAILY';
    const interval = intervalPart ? parseInt(intervalPart.split('=')[1]) : 1;
    let untilDate: Date | null = null;

    if (untilPart) {
        const dStr = untilPart.split('=')[1];
        // Parse YYYYMMDD
        const y = parseInt(dStr.substring(0, 4));
        const m = parseInt(dStr.substring(4, 6)) - 1;
        const d = parseInt(dStr.substring(6, 8));
        untilDate = new Date(y, m, d);
        untilDate.setHours(23, 59, 59);
    }

    const startDate = new Date(event.date);
    let currentDate = new Date(startDate); // Start from the event's start date

    // Prevent infinite loops if logic fails
    let safetyCounter = 0;
    const maxOccurrences = 365; 

    while (currentDate <= endRange && safetyCounter < maxOccurrences) {
      // Check if current instance is after UNTIL
      if (untilDate && currentDate > untilDate) break;

      // Check if current instance is within the view range
      if (currentDate >= startRange) {
        expandedEvents.push({
          ...event,
          id: `${event.id}_${currentDate.getTime()}`, // Unique ID for instance
          date: currentDate.toISOString().split('T')[0], // Override date
          isRecurring: false // Expanded instances aren't recurring themselves visually
        });
      }

      // Advance Date
      if (freq === 'DAILY') {
        currentDate.setDate(currentDate.getDate() + interval);
      } else if (freq === 'WEEKLY') {
        currentDate.setDate(currentDate.getDate() + (7 * interval));
      } else if (freq === 'MONTHLY') {
        currentDate.setMonth(currentDate.getMonth() + interval);
      }
      
      safetyCounter++;
    }
  });

  return expandedEvents;
};

// --- Firebase Operations ---

// Subscribe to events (Real-time)
// Fetches both personal events (userId == current) and global events (userId == 'all')
export const subscribeToEvents = (userId: string, callback: (events: CalendarEvent[]) => void) => {
  // We use the 'in' operator to get both personal and global events in one query
  const q = db.collection(COLLECTION).where("userId", "in", [userId, "all"]);

  return q.onSnapshot((snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
    callback(events);
  }, (error: any) => {
    console.error("Error subscribing to events:", error);
    // If permission denied for 'all', fallback to just user events
    if (error.code === 'permission-denied') {
        const fallbackQuery = db.collection(COLLECTION).where("userId", "==", userId);
        fallbackQuery.onSnapshot((snap) => {
            const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
            callback(events);
        });
    }
  });
};

export const createEvent = async (event: Omit<CalendarEvent, 'id'>) => {
  try {
    const docRef = await db.collection(COLLECTION).add(event);
    return { id: docRef.id, ...event };
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
  try {
    // If updating a master recurring event, this updates ALL future instances logic
    // Exception handling (splitting an instance) would go here in a full implementation
    await db.collection(COLLECTION).doc(id).update(updates);
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

export const deleteEvent = async (id: string) => {
  try {
    await db.collection(COLLECTION).doc(id).delete();
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

// --- Google Calendar Sync ---

export const fetchGoogleCalendarEvents = async (start: Date, end: Date): Promise<CalendarEvent[]> => {
  if (!auth.currentUser) return [];

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');

    let token: string | undefined;

    // Attempt to re-authenticate or link to get the token with scopes
    try {
        // Try linking first (adds google to email/pass users)
        const result = await auth.currentUser.linkWithPopup(provider);
        // @ts-ignore
        token = result.credential?.accessToken;
    } catch (error: any) {
        if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/provider-already-linked') {
           // Account already exists or is linked, re-auth to get fresh token with scopes
           const result = await auth.currentUser.reauthenticateWithPopup(provider);
           // @ts-ignore
           token = result.credential?.accessToken;
        } else {
            throw error;
        }
    }

    if (!token) throw new Error("Could not obtain Google Access Token");

    const timeMin = start.toISOString();
    const timeMax = end.toISOString();
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error("Failed to fetch from Google Calendar");

    const data = await response.json();
    
    return data.items.map((item: any) => {
        const startDateTime = item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date);
        const endDateTime = item.end.dateTime ? new Date(item.end.dateTime) : new Date(item.end.date);
        
        // Calculate duration in minutes
        const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / 60000;

        return {
            id: `gcal_${item.id}`,
            title: item.summary || 'Google Event',
            date: item.start.dateTime?.split('T')[0] || item.start.date,
            time: item.start.dateTime?.split('T')[1]?.substring(0, 5) || '00:00',
            durationMinutes: durationMinutes || 60,
            type: 'other',
            isRecurring: false,
            assignedBy: 'user', 
            description: item.description,
            properties: [{ id: 'gcal_link', name: 'Google Link', type: 'url', value: item.htmlLink }]
        } as CalendarEvent;
    });

  } catch (error: any) {
    console.error("Google Calendar Sync Error:", error);
    
    if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        const message = `
CONFIGURATION REQUIRED:
The domain "${domain}" is not authorized for authentication.

To fix this:
1. Go to the Firebase Console (console.firebase.google.com).
2. Select your project.
3. Go to Authentication > Settings > Authorized Domains.
4. Click "Add Domain" and paste: ${domain}
        `;
        alert(message);
    } else if (error.code === 'auth/operation-not-allowed') {
        alert("Google Sign-In is not enabled in Firebase Console. Go to Authentication > Sign-in method and enable Google.");
    } else if (error.code === 'auth/popup-closed-by-user') {
        // User cancelled, ignore
        console.log("Google sync cancelled by user");
    } else if (error.code === 'auth/popup-blocked') {
        alert("Pop-up blocked. Please allow pop-ups for this site to sync Google Calendar.");
    } else {
        alert(`Failed to sync Google Calendar: ${error.message || "Unknown error"}`);
    }
    return [];
  }
};
