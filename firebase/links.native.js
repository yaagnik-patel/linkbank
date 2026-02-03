import firestore from "@react-native-firebase/firestore";

const LINKS_COLLECTION = "links";

function userLinksRef(uid) {
  return firestore().collection("users").doc(uid).collection(LINKS_COLLECTION);
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
  const unsubscribe = userLinksRef(uid)
    .orderBy("timestamp", "desc")
    .onSnapshot(
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
      }
    );
  return unsubscribe;
}

/**
 * Add a link for the user.
 * @param {string} uid - User ID
 * @param {object} link - { name, url, date, timestamp, logo }
 * @returns {Promise<string>} New document ID
 */
export async function addUserLink(uid, link) {
  if (!uid) throw new Error("User must be logged in to save links");
  const ref = await userLinksRef(uid).add(link);
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
  await userLinksRef(uid).doc(linkId).update(updates);
}

/**
 * Delete a link for the user.
 * @param {string} uid - User ID
 * @param {string} linkId - Document ID
 */
export async function deleteUserLink(uid, linkId) {
  if (!uid) throw new Error("User must be logged in");
  await userLinksRef(uid).doc(linkId).delete();
}
