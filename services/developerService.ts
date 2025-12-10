
import { db } from "./firebase";
import firebase from "./firebase";
import { DeveloperProfile, School } from "../types";

const DEV_COL = 'developers';
const SCHOOLS_COL = 'schools';

// Check if user is a developer
export const checkIsDeveloper = async (uid: string, email: string | null): Promise<boolean> => {
  try {
    // Check 1: Document ID matches UID
    const doc = await db.collection(DEV_COL).doc(uid).get();
    if (doc.exists) return true;

    // Check 2: Email matches a document in the collection
    if (email) {
      const querySnapshot = await db.collection(DEV_COL).where("email", "==", email).get();
      if (!querySnapshot.empty) return true;

      // --- SPECIAL ACCESS: Auto-add specific developer email ---
      if (email === 'victoryvitalize@gmail.com') {
        console.log("Auto-seeding developer access for:", email);
        await db.collection(DEV_COL).doc(uid).set({
            uid: uid,
            email: email,
            name: "Victory Vitalize",
            role: "Owner",
            accessLevel: 999,
            specialization: "Full Stack",
            joinedAt: firebase.firestore.Timestamp.now()
        });
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking dev status:", error);
    return false;
  }
};

// Get Developer Profile
export const getDeveloperProfile = async (uid: string): Promise<DeveloperProfile | null> => {
  try {
    // Try getting by UID first
    let doc = await db.collection(DEV_COL).doc(uid).get();
    
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as DeveloperProfile;
    }
    
    // Fallback: Try getting by email if UID doc doesn't exist (optional, but good for flexibility)
    
    return null; 
  } catch (error) {
    console.error("Error fetching dev profile:", error);
    return null;
  }
};

// Add School
export const addSchool = async (name: string, region: string, domain?: string) => {
  try {
    await db.collection(SCHOOLS_COL).add({
      name,
      region,
      domain: domain || null,
      addedAt: firebase.firestore.Timestamp.now()
    });
  } catch (error) {
    console.error("Error adding school:", error);
    throw error;
  }
};

// Bulk Upload Schools
export const uploadSchoolsBatch = async (schools: {name: string, region: string, domain?: string}[]) => {
  try {
    const batch = db.batch();
    
    schools.forEach(school => {
      const ref = db.collection(SCHOOLS_COL).doc();
      batch.set(ref, {
        ...school,
        addedAt: firebase.firestore.Timestamp.now()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error batch uploading schools:", error);
    throw error;
  }
};

// Delete School
export const deleteSchool = async (id: string) => {
  try {
    await db.collection(SCHOOLS_COL).doc(id).delete();
  } catch (error) {
    console.error("Error deleting school:", error);
    throw error;
  }
};

// Subscribe to Schools
export const subscribeToSchools = (callback: (schools: School[]) => void) => {
  // Sort client-side to avoid needing a specific index immediately
  return db.collection(SCHOOLS_COL)
    .onSnapshot((snapshot) => {
      const schools = snapshot.docs.map(doc => {
        const data = doc.data();
        // Handle potential case sensitivity from manual DB entry (Name vs name)
        return { 
            id: doc.id, 
            name: data.name || data.Name || 'Unknown School', 
            region: data.region || data.Region || 'Unknown Region',
            domain: data.domain || data.Domain || '',
            ...data // spread remaining
        } as School;
      });
      
      // Sort alphabetically by name safely
      schools.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      callback(schools);
    }, (error) => {
      console.error("Error subscribing to schools:", error);
    });
};

// Get Students by School
export const getStudentsBySchool = async (schoolName: string): Promise<any[]> => {
  try {
    const snapshot = await db.collection('users').where('school', '==', schoolName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching students by school:", error);
    return [];
  }
};
