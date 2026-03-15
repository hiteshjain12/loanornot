export function saveForm(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving ${key}:`, e);
  }
}

export function loadForm(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn(`Error loading ${key}:`, e);
    localStorage.removeItem(key);
    return null;
  }
}
