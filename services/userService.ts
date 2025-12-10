
import { db } from "./firebase";
import firebase from "./firebase";
import { User, FriendRequest } from '../types';

const USERS_COL = 'users';
const REQUESTS_COL = 'friend_requests';

// Search users by name (case-insensitive substring match)
export const searchUsers = async (searchTerm: string, currentUserId?: string): Promise<User[]> => {
  if (!searchTerm.trim()) return [];

  try {
    const snapshot = await db.collection(USERS_COL).get();
    
    const users = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      avatar: doc.data().avatarUrl || 'bg-slate-500' 
    } as User));

    const lowerTerm = searchTerm.toLowerCase();

    return users.filter(u => 
      u.id !== currentUserId && 
      u.name.toLowerCase().includes(lowerTerm)
    );

  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

// Check if username exists (for uniqueness validation)
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    // Note: This matches exactly. For robust systems, you might store a 'username_lower' field.
    // Here we assume usernames are stored/checked in lowercase or exact match.
    const snapshot = await db.collection(USERS_COL).where("username", "==", username).get();
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking username:", error);
    return false;
  }
};

// Get Email from Username
export const getEmailFromUsername = async (username: string): Promise<string | null> => {
  try {
    // Exact match on username (assuming stored as lowercase/consistent)
    const snapshot = await db.collection(USERS_COL).where("username", "==", username).limit(1).get();
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return data.email || null;
  } catch (error) {
    console.error("Error fetching email from username:", error);
    return null;
  }
};

// Check if a request is pending
export const checkRequestStatus = async (fromId: string, toId: string): Promise<'pending' | 'none'> => {
  try {
    const snapshot = await db.collection(REQUESTS_COL)
      .where("fromId", "==", fromId)
      .where("toId", "==", toId)
      .where("status", "==", "pending")
      .get();
    return snapshot.empty ? 'none' : 'pending';
  } catch (e) {
    return 'none';
  }
};

// Send Friend Request
export const sendFriendRequest = async (fromUser: User, toUserId: string) => {
  try {
    // 1. Check if already friends
    if (fromUser.friends?.includes(toUserId)) {
      throw new Error("Already friends");
    }

    // 2. Check if request already exists (from me to them)
    const status = await checkRequestStatus(fromUser.id, toUserId);
    if (status === 'pending') throw new Error("Request already sent");

    // 3. Check if they already sent me one
    const reverseStatus = await checkRequestStatus(toUserId, fromUser.id);
    if (reverseStatus === 'pending') throw new Error("They already sent you a request. Check notifications.");

    await db.collection(REQUESTS_COL).add({
      fromId: fromUser.id,
      fromName: fromUser.name,
      fromAvatar: fromUser.avatar || '',
      toId: toUserId,
      status: 'pending',
      timestamp: firebase.firestore.Timestamp.now()
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
};

// Accept Friend Request
export const acceptFriendRequest = async (requestId: string, fromId: string, toId: string) => {
  try {
    // 1. Update Request Status
    await db.collection(REQUESTS_COL).doc(requestId).update({ status: 'accepted' });

    // 2. Add to 'friends' array for both users
    const user1Ref = db.collection(USERS_COL).doc(fromId);
    const user2Ref = db.collection(USERS_COL).doc(toId);

    await user1Ref.update({ friends: firebase.firestore.FieldValue.arrayUnion(toId) });
    await user2Ref.update({ friends: firebase.firestore.FieldValue.arrayUnion(fromId) });

  } catch (error) {
    console.error("Error accepting friend request:", error);
    throw error;
  }
};

// Reject Friend Request
export const rejectFriendRequest = async (requestId: string) => {
  try {
    await db.collection(REQUESTS_COL).doc(requestId).update({ status: 'rejected' });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    throw error;
  }
};

// Subscribe to Incoming Friend Requests
export const subscribeToFriendRequests = (userId: string, callback: (requests: FriendRequest[]) => void) => {
  const q = db.collection(REQUESTS_COL)
    .where("toId", "==", userId)
    .where("status", "==", "pending");

  return q.onSnapshot((snapshot) => {
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
    callback(requests);
  });
};

// Get User by ID
export const getUserById = async (userId: string): Promise<User | null> => {
    try {
        const docSnap = await db.collection(USERS_COL).doc(userId).get();

        if (docSnap.exists) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: data?.name || 'User',
                email: data?.email || '',
                avatar: data?.avatarUrl || '',
                status: data?.status || 'offline',
                friends: data?.friends || [],
                ...data
            } as User;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return null;
    }
};

// Get list of friends (User objects)
export const getFriends = async (friendIds: string[]): Promise<User[]> => {
  if (!friendIds || friendIds.length === 0) return [];
  
  try {
    // Firestore 'in' query supports max 10 items. If more, we need multiple queries or Promise.all
    // For scalability, we'll use Promise.all here as 'in' has strict limits.
    const promises = friendIds.map(id => getUserById(id));
    const results = await Promise.all(promises);
    return results.filter(u => u !== null) as User[];
  } catch (error) {
    console.error("Error fetching friends:", error);
    return [];
  }
};

// Update User Status (online, busy, offline)
export const updateUserStatus = async (userId: string, status: 'online' | 'busy' | 'offline' | 'focus') => {
  try {
    await db.collection(USERS_COL).doc(userId).update({ status });
  } catch (error) {
    console.error("Error updating user status:", error);
  }
};

export const MOCK_USERS: Record<string, User> = {};
