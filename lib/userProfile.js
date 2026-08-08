const KEY = "userProfiles"; // { [email]: { name, phone, dob, location, photo, joinedDate } }

function getAll() {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem(KEY) || "{}");
}

function saveAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getUserProfile(email) {
  if (!email) return null;
  const all = getAll();
  return all[email.toLowerCase()] || null;
}

export function saveUserProfile(email, updates) {
  if (!email) return;
  const all = getAll();
  const key = email.toLowerCase();
  all[key] = { ...(all[key] || {}), ...updates };
  saveAll(all);
  return all[key];
}

// Loads this user's permanent profile into the current session's
// display keys (userName, userPhoto, etc.) — call this right after login.
export function hydrateSessionFromProfile(email) {
  const profile = getUserProfile(email);
  if (!profile) return;

  if (profile.name) localStorage.setItem("userName", profile.name);
  if (profile.phone) localStorage.setItem("userPhone", profile.phone);
  if (profile.dob) localStorage.setItem("userDob", profile.dob);
  if (profile.location) localStorage.setItem("userLocation", profile.location);
  if (profile.photo) localStorage.setItem("userPhoto", profile.photo);
  if (profile.joinedDate) localStorage.setItem("userJoinedDate", profile.joinedDate);
}