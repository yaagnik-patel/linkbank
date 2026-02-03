import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

const LINKS_COLLECTION = "links";

function userLinksRef(uid) {
  return collection(db, "users", uid, LINKS_COLLECTION);
}

function linkDocRef(uid, linkId) {
  return doc(db, "users", uid, LINKS_COLLECTION, linkId);
}

/**
 * Subscribe to the current user's links (realtime updates).
 * @param {string} uid - User ID
 * @param {function} setLinks - Callback that receives array of links
 * @returns {function} Unsubscribe function
 */
export function subscribeUserLinks(uid, setLinks) {
  if (!uid) {
    setLinks([]);
    return () => {};
  }
  const q = query(userLinksRef(uid), orderBy("timestamp", "desc"));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const byId = new Map(list.map((l) => [l.id, l]));
      setLinks(Array.from(byId.values()));
    },
    (err) => {
      console.error("subscribeUserLinks error:", err);
      // Don't clear list on error so UI doesn't flash empty (e.g. permission/index)
    }
  );
  return unsubscribe;
}

/**
 * Add a link for the user.
 * @param {string} uid - User ID
 * @param {object} link - { name, url, date, timestamp, logo, note?, category? }
 * @returns {Promise<string>} New document ID
 */
export async function addUserLink(uid, link) {
  if (!uid) throw new Error("User must be logged in to save links");
  const ref = await addDoc(userLinksRef(uid), link);
  return ref.id;
}

/**
 * Update a link's note and/or category.
 * @param {string} uid - User ID
 * @param {string} linkId - Document ID
 * @param {object} updates - { note?, category? }
 */
export async function updateUserLink(uid, linkId, updates) {
  if (!uid) throw new Error("User must be logged in");
  await updateDoc(linkDocRef(uid, linkId), updates);
}

/**
 * Delete a link for the user.
 * @param {string} uid - User ID
 * @param {string} linkId - Document ID
 */
export async function deleteUserLink(uid, linkId) {
  if (!uid) throw new Error("User must be logged in");
  await deleteDoc(linkDocRef(uid, linkId));
}
