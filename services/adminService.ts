
import { db, storage } from "./firebase";
import firebase from "./firebase";
import { Note } from "../types";

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  addedBy: string;
}

// --- ADMIN MANAGEMENT ---

export const checkIsAdmin = async (uid: string, email: string | null): Promise<boolean> => {
  try {
    if (!email) return false;
    const query = await db.collection('admins').where('email', '==', email).get();
    if (!query.empty) return true;
    
    // Fallback: Check if doc ID is the UID (legacy)
    const doc = await db.collection('admins').doc(uid).get();
    if (doc.exists) return true;

    // Fallback: Hardcoded super admin for safety
    if (email === 'admin@effimey.app') return true;

    return false;
  } catch (error) {
    console.error("Error checking admin:", error);
    return false;
  }
};

export const subscribeToUsers = (callback: (users: any[]) => void) => {
  return db.collection('users').onSnapshot(snapshot => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(users);
  }, error => console.error(error));
};

export const subscribeToAdmins = (callback: (admins: AdminUser[]) => void) => {
  return db.collection('admins').onSnapshot(snapshot => {
    const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
    callback(admins);
  }, error => console.error(error));
};

export const addAdmin = async (email: string, addedBy: string) => {
  // Check if already exists
  const existing = await db.collection('admins').where('email', '==', email).get();
  if (!existing.empty) throw new Error("Admin already exists");

  await db.collection('admins').add({
    email,
    role: 'admin',
    addedBy,
    createdAt: firebase.firestore.Timestamp.now()
  });
};

export const removeAdmin = async (id: string) => {
  await db.collection('admins').doc(id).delete();
};

export const sendAdminMessage = async (recipientId: string, text: string, adminId: string) => {
  await db.collection('admin_messages').add({
    recipientId,
    text,
    senderId: adminId,
    timestamp: firebase.firestore.Timestamp.now(),
    read: false
  });
};

export const subscribeToAdminMessages = (callback: (count: number) => void) => {
  return db.collection('admin_messages').onSnapshot(snapshot => {
    callback(snapshot.size);
  });
};


// --- OFFICIAL SOURCES ---

// Upload Official Source
export const uploadOfficialSource = async (
  file: File, 
  title: string, 
  subject: string, 
  description: string, 
  classGrade: string,
  section: string
) => {
  try {
    // Storage Path: uploaded_notes/class{grade}notes/{filename}
    // Example: uploaded_notes/class10thnotes/syllabus.pdf
    const storagePath = `uploaded_notes/class${classGrade}notes/${file.name}`;
    
    const storageRef = storage.ref(storagePath);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();

    const docData = {
      title,
      subject,
      content: description,
      classGrade, 
      section,
      attachmentName: file.name,
      attachmentType: file.type.includes('pdf') ? 'pdf' : 'doc',
      attachmentUrl: downloadURL,
      lastModified: new Date().toLocaleDateString(),
      createdAt: firebase.firestore.Timestamp.now(),
      isOfficial: true
    };

    // Store in 'uploaded_notes' collection
    await db.collection("uploaded_notes").add(docData);
    return true;
  } catch (error) {
    console.error("Error uploading source:", error);
    throw error;
  }
};

// Delete Official Source
export const deleteOfficialSource = async (id: string) => {
  try {
    await db.collection("uploaded_notes").doc(id).delete();
  } catch (error) {
    console.error("Error deleting official source:", error);
    throw error;
  }
};

// Get Official Sources (ADMIN VIEW - One time fetch)
export const getOfficialSources = async (): Promise<Note[]> => {
  try {
    const querySnapshot = await db.collection("uploaded_notes").orderBy("createdAt", "desc").get();
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Note));
  } catch (error) {
    console.error("Error fetching official sources:", error);
    return [];
  }
};

// Subscribe to ALL Official Sources (ADMIN VIEW - Real time)
export const subscribeToAllOfficialSources = (callback: (notes: Note[]) => void) => {
  return db.collection("uploaded_notes")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      callback(notes);
    }, (error) => {
      console.error("Error subscribing to all official sources:", error);
    });
};

// --- STUDENT SPECIFIC ACCESS ---

export const getStudentNotes = async (classGrade: string, section: string): Promise<Note[]> => {
  try {
    const querySnapshot = await db.collection("uploaded_notes")
      .where("classGrade", "==", classGrade)
      .where("section", "in", [section, "All"]) // Match student section OR "All"
      .orderBy("createdAt", "desc")
      .get();
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Note));
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
        console.error("Requires Firestore Index. Check console for link.");
    }
    console.error("Error fetching student notes:", error);
    return [];
  }
};

export const subscribeToStudentNotes = (classGrade: string, section: string, callback: (notes: Note[]) => void) => {
  return db.collection("uploaded_notes")
    .where("classGrade", "==", classGrade)
    .where("section", "in", [section, "All"]) // Match student section OR "All"
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      callback(notes);
    }, (error) => {
      console.error("Error subscribing to student notes:", error);
    });
};

export const subscribeToOfficialSources = (callback: (count: number) => void) => {
  return db.collection("uploaded_notes").onSnapshot((snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error("Error subscribing to official sources:", error);
  });
};
