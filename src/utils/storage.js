/**
 * Base MiniApp SDK storage wrapper
 * SDK is accessed via window.mini (injected by Base app)
 */
const getMini = () => {
  if (typeof window !== 'undefined' && window.mini) {
    return window.mini;
  }
  return null;
};

export const storage = {
  /**
   * Get value from storage
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const mini = getMini();
      if (mini && mini.storage) {
        return await mini.storage.get(key);
      }
      // Fallback to localStorage for local development
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
  },

  /**
   * Set value to storage
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    try {
      const mini = getMini();
      if (mini && mini.storage) {
        await mini.storage.set(key, value);
      } else {
        // Fallback to localStorage for local development
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Storage set error:', error);
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  /**
   * Remove value from storage
   * @param {string} key
   * @returns {Promise<void>}
   */
  async remove(key) {
    try {
      const mini = getMini();
      if (mini && mini.storage) {
        await mini.storage.remove(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage remove error:', error);
      localStorage.removeItem(key);
    }
  }
};

