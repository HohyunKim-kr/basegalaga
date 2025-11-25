import { storage } from './storage.js';

const MAX_LEADERBOARD_ENTRIES = 20;

/**
 * Score management utilities
 */
export const scoreManager = {
  /**
   * Save a new score to leaderboard
   * @param {number} score - Final calculated score
   * @param {number} baseScore - Base score without bonuses
   * @param {number} time - Time elapsed in milliseconds
   * @param {number} stage - Stage reached
   * @returns {Promise<void>}
   */
  async saveScore(score, baseScore = null, time = null, stage = null) {
    let scores = await storage.get('scores') || [];
    scores.push({
      score,           // Final score (with time bonus)
      baseScore: baseScore || score,
      time: time || 0,
      stage: stage || 1,
      timestamp: Date.now()
    });
    
    // Sort by score descending (higher score = better)
    // Faster time with same score = better ranking
    scores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, faster time wins
      return a.time - b.time;
    });
    
    // Keep only top scores
    scores = scores.slice(0, MAX_LEADERBOARD_ENTRIES);
    
    await storage.set('scores', scores);
  },

  /**
   * Get all scores from leaderboard
   * @returns {Promise<Array>}
   */
  async getScores() {
    const scores = await storage.get('scores') || [];
    return scores.sort((a, b) => b.score - a.score);
  },

  /**
   * Get best score
   * @returns {Promise<number>}
   */
  async getBestScore() {
    const scores = await storage.get('scores') || [];
    if (scores.length === 0) return 0;
    return Math.max(...scores.map(s => s.score));
  },

  /**
   * Get rank for a given score
   * @param {number} score
   * @returns {Promise<number>}
   */
  async getRank(score) {
    const scores = await storage.get('scores') || [];
    const sortedScores = scores.map(s => s.score).sort((a, b) => b - a);
    const rank = sortedScores.findIndex(s => s < score) + 1;
    return rank || sortedScores.length + 1;
  }
};

