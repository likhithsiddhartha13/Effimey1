
import { db, storage } from "./firebase";
import firebase from "./firebase";

// Interfaces reused locally or imported
export interface ChatGroup {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  description?: string;
  logo?: string;
  memberIds: string[];
  createdBy?: string;
  inviteCode?: string;
  lastMessageAt?: any;
  participantNames?: Record<string, string>;
  lastRead?: Record<string, any>;
}

export interface GroupMessage {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: any;
  imageUrl?: string; // Deprecated in favor of attachment
  attachment?: {
    url: string;
    name: string;
    type: 'image' | 'file';
  };
  type?: 'text' | 'call';
  callDuration?: number;
  isEdited?: boolean;
}

const DM_COL = 'chatdata';
const GROUPS_COL = 'groupschatdata';

// Helper to get collection name
const getCollectionName = (type: 'channel' | 'dm') => type === 'dm' ? DM_COL : GROUPS_COL;

// Create a new group/channel (Always goes to GROUPS_COL)
export const createGroup = async (groupData: Omit<ChatGroup, 'id'>) => {
  try {
    const docRef = await db.collection(GROUPS_COL).add({
      ...groupData,
      type: 'channel', // Enforce type
      lastMessageAt: firebase.firestore.Timestamp.now(),
      createdAt: firebase.firestore.Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

// Create or Get DM Channel (Always goes to DM_COL with deterministic ID)
export const getOrCreateDmChannel = async (currentUserId: string, targetUserId: string, targetUserName: string, currentUserName: string) => {
  try {
    // Generate deterministic ID: lexicographically smaller UID first
    const sortedIds = [currentUserId, targetUserId].sort();
    const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
    
    const docRef = db.collection(DM_COL).doc(chatId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data(), type: 'dm' } as ChatGroup;
    }

    // Create new DM with participant names for display resolution
    const newDm = {
      name: `${currentUserName}, ${targetUserName}`, // Fallback name
      type: 'dm' as const,
      memberIds: [currentUserId, targetUserId],
      participantNames: {
        [currentUserId]: currentUserName,
        [targetUserId]: targetUserName
      },
      lastMessageAt: firebase.firestore.Timestamp.now(),
      createdAt: firebase.firestore.Timestamp.now()
    };
    
    // Use setDoc to create with the specific ID
    await docRef.set(newDm);
    return { id: chatId, ...newDm } as ChatGroup;

  } catch (error) {
    console.error("Error getting DM:", error);
    throw error;
  }
};

// Subscribe to User's Groups AND DMs
export const subscribeToGroups = (userId: string, callback: (groups: ChatGroup[]) => void) => {
  let groupList: ChatGroup[] = [];
  let dmList: ChatGroup[] = [];

  const mergeAndCallback = () => {
    // Merge and sort by last message
    const combined = [...groupList, ...dmList].sort((a, b) => {
        // Safe timestamp handling for nulls (latency compensation)
        const getMillis = (t: any) => {
            if (!t) return 0;
            if (typeof t.toMillis === 'function') return t.toMillis();
            if (t instanceof Date) return t.getTime();
            return 0;
        };
        const tA = getMillis(a.lastMessageAt);
        const tB = getMillis(b.lastMessageAt);
        return tB - tA;
    });
    callback(combined);
  };

  // Listener for Groups
  const unsubGroups = db.collection(GROUPS_COL).where("memberIds", "array-contains", userId)
    .onSnapshot((snapshot) => {
      // Explicitly enforce type 'channel' for items from GROUPS_COL
      groupList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'channel' } as ChatGroup));
      mergeAndCallback();
    }, (error) => console.error("Error sub groups:", error));

  // Listener for DMs
  const unsubDms = db.collection(DM_COL).where("memberIds", "array-contains", userId)
    .onSnapshot((snapshot) => {
      // Explicitly enforce type 'dm' for items from DM_COL (chatdata)
      dmList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'dm' } as ChatGroup));
      mergeAndCallback();
    }, (error) => console.error("Error sub DMs:", error));

  return () => {
    unsubGroups();
    unsubDms();
  };
};

// New: Subscribe to unread count across all groups
export const subscribeToUnreadCount = (userId: string, callback: (hasUnread: boolean) => void) => {
  return subscribeToGroups(userId, (groups) => {
    const hasUnread = groups.some(g => {
        const lastMsg = g.lastMessageAt;
        if (!lastMsg) return false; // No messages yet
        
        const lastMsgTime = typeof lastMsg.toMillis === 'function' ? lastMsg.toMillis() : new Date(lastMsg).getTime();
        
        const readEntry = g.lastRead?.[userId];
        const lastReadTime = readEntry 
            ? (typeof readEntry.toMillis === 'function' ? readEntry.toMillis() : new Date(readEntry).getTime())
            : 0; // Never read
            
        // If message exists and is newer than last read (or never read), it's unread
        return lastMsgTime > lastReadTime;
    });
    callback(hasUnread);
  });
};

// Send Message
export const sendMessage = async (
  groupId: string, 
  text: string, 
  senderId: string, 
  senderName: string, 
  type: 'channel' | 'dm', 
  attachment?: { url: string, name: string, type: 'image' | 'file' } | null,
  messageType: 'text' | 'call' = 'text',
  callDuration?: number
) => {
  try {
    const colName = getCollectionName(type);
    
    await db.collection(colName).doc(groupId).collection('messages').add({
      text,
      senderId,
      senderName,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Use serverTimestamp for accuracy
      attachment: attachment || null,
      type: messageType,
      callDuration: callDuration || null
    });

    // Update group last activity
    await db.collection(colName).doc(groupId).update({
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Subscribe to Messages
export const subscribeToMessages = (groupId: string, type: 'channel' | 'dm', callback: (messages: GroupMessage[]) => void) => {
  const colName = getCollectionName(type);
  const q = db.collection(colName).doc(groupId).collection('messages').orderBy("timestamp", "asc");

  return q.onSnapshot((snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Safety: timestamp is null on immediate local write (latency compensation). 
        // Fallback to new Date() to prevent crash.
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date() 
      } as GroupMessage;
    });
    callback(messages);
  }, (error) => {
    console.error("Error subscribing to messages:", error);
  });
};

// Mark Channel as Read
export const markChannelAsRead = async (channelId: string, userId: string, type: 'channel' | 'dm') => {
  const colName = getCollectionName(type);
  try {
    // Update the specific user's lastRead timestamp using dot notation
    await db.collection(colName).doc(channelId).update({
      [`lastRead.${userId}`]: firebase.firestore.Timestamp.now()
    });
  } catch (error) {
    // If simple update fails (e.g., map field doesn't exist yet), use set with merge
    try {
        await db.collection(colName).doc(channelId).set({
            lastRead: {
                [userId]: firebase.firestore.Timestamp.now()
            }
        }, { merge: true });
    } catch (e) {
        console.error("Error marking read:", e);
    }
  }
};

// Add Member to Group (Only for channels usually)
export const addMemberToGroup = async (groupId: string, userId: string) => {
  // Assuming this is only for groups based on current app logic
  await db.collection(GROUPS_COL).doc(groupId).update({
    memberIds: firebase.firestore.FieldValue.arrayUnion(userId)
  });
};

// Upload Group Logo
export const uploadGroupLogo = async (groupId: string, file: File, type: 'channel' | 'dm') => {
  const colName = getCollectionName(type);
  const storageRef = storage.ref(`group_logos/${groupId}_${Date.now()}`);
  const snapshot = await storageRef.put(file);
  const url = await snapshot.ref.getDownloadURL();
  
  await db.collection(colName).doc(groupId).update({
    logo: url
  });
  return url;
};

// Upload Chat Attachment (File or Image)
export const uploadChatFile = async (groupId: string, file: File) => {
  const storageRef = storage.ref(`chat_attachments/${groupId}/${Date.now()}_${file.name}`);
  const snapshot = await storageRef.put(file);
  const url = await snapshot.ref.getDownloadURL();
  
  const isImage = file.type.startsWith('image/');
  
  return {
    url,
    name: file.name,
    type: isImage ? 'image' as const : 'file' as const
  };
};

// Edit Message
export const editMessage = async (groupId: string, messageId: string, newText: string, type: 'channel' | 'dm') => {
  const colName = getCollectionName(type);
  try {
    await db.collection(colName).doc(groupId).collection('messages').doc(messageId).update({
      text: newText,
      isEdited: true
    });
  } catch (error) {
    console.error("Error editing message:", error);
    throw error;
  }
};

// Delete Message
export const deleteMessage = async (groupId: string, messageId: string, type: 'channel' | 'dm') => {
  const colName = getCollectionName(type);
  try {
    await db.collection(colName).doc(groupId).collection('messages').doc(messageId).delete();
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};
