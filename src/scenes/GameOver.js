import Phaser from 'phaser';
import { scoreManager } from '../utils/score.js';
import { MODERN_COLORS, createModernBackground, createModernGrid } from '../utils/modernStyle.js';
import { createRexButton, createRexLabel } from '../utils/rexUIHelper.js';
import { isMobile } from '../main.js';

export class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
    this.finalScore = 0;
    this.bestScore = 0;
  }

  async init(data) {
    this.finalScore = data.score || 0;
    this.baseScore = data.baseScore || this.finalScore;
    this.elapsedTime = data.time || 0;
    this.stage = data.stage || 1;
    this.allCleared = data.allCleared || false;
    
    // Save score with all data
    if (this.finalScore > 0) {
      await scoreManager.saveScore(this.finalScore, this.baseScore, this.elapsedTime, this.stage);
    }
    
    // Get best score
    this.bestScore = await scoreManager.getBestScore();
  }

  create() {
    const { width, height } = this.cameras.main;

    // Phaser 입력 시스템 완전 비활성화 (DOM 이벤트만 사용)
    this.input.enabled = false;
    if (this.input.mouse) this.input.mouse.enabled = false;
    if (this.input.touch) this.input.touch.enabled = false;

    // 버튼 정리 함수 저장
    this.buttonCleanups = [];

    // Modern gradient background
    createModernBackground(this, width, height);
    
    // Subtle grid overlay
    createModernGrid(this, width, height);

    // Game Over or All Cleared Text - Rex UI
    if (this.allCleared) {
      const titleSize = isMobile ? 40 : 56;
      const title = createRexLabel(this, width / 2, height * 0.10, 'ALL STAGES CLEARED', {
        fontSize: titleSize,
        color: '#ffffff',
        backgroundColor: null
      });
      
      this.tweens.add({
        targets: title,
        alpha: { from: 0.8, to: 1 },
        duration: 1500,
        yoyo: true,
        repeat: -1
      });
    } else {
      const titleSize = isMobile ? 52 : 72;
      const title = createRexLabel(this, width / 2, height * 0.10, 'GAME OVER', {
        fontSize: titleSize,
        color: '#ffffff',
        backgroundColor: null
      });
      
      this.tweens.add({
        targets: title,
        alpha: { from: 0.8, to: 1 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    }

    // Stats - Rex UI
    const statsY = isMobile ? height * 0.20 : height * 0.22;
    const statsSpacing = isMobile ? 24 : 32;
    
    createRexLabel(this, width / 2, statsY, `STAGE: ${this.stage}/10`, {
      fontSize: isMobile ? 18 : 24,
      color: '#ffffff',
      backgroundColor: null
    });

    const minutes = Math.floor(this.elapsedTime / 60000);
    const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
    createRexLabel(this, width / 2, statsY + statsSpacing, `TIME: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, {
      fontSize: isMobile ? 18 : 24,
      color: '#ffffff',
      backgroundColor: null
    });

    // Score Display - Rex UI
    createRexLabel(this, width / 2, statsY + statsSpacing * 2, `SCORE: ${this.finalScore.toLocaleString()}`, {
      fontSize: isMobile ? 36 : 48,
      color: MODERN_COLORS.textAccent,
      backgroundColor: null
    });

    if (this.baseScore !== this.finalScore) {
      createRexLabel(this, width / 2, statsY + statsSpacing * 3, `BASE: ${this.baseScore.toLocaleString()} + BONUS`, {
        fontSize: isMobile ? 14 : 18,
        color: '#ffffff',
        backgroundColor: null
      });
    }

    // New Record indicator
    if (this.finalScore === this.bestScore && this.finalScore > 0) {
      const recordText = createRexLabel(this, width / 2, statsY + statsSpacing * 4, 'NEW RECORD!', {
        fontSize: isMobile ? 24 : 32,
        color: MODERN_COLORS.textAccent,
        backgroundColor: null
      });
      
      this.tweens.add({
        targets: recordText,
        scaleX: { from: 1, to: 1.05 },
        scaleY: { from: 1, to: 1.05 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }

    // Buttons - Rex UI
    const btnWidth = isMobile ? width * 0.85 : Math.min(width * 0.5, 320);
    const btnHeight = isMobile ? 56 : 64;
    const btnSpacing = isMobile ? 52 : 60;
    let btnY = isMobile ? height * 0.52 : height * 0.54;
    
    // RETRY 버튼
    const retryBtn = createRexButton(
      this,
      width / 2,
      btnY,
      btnWidth,
      btnHeight,
      'RETRY',
      () => {
        console.log('✅ RETRY button clicked - restarting game');
        this.cleanupButtons();
        this.scene.start('GameScene');
      },
      {
        backgroundColor: 0x00ff00,
        borderColor: 0x00ffff,
        textColor: '#000000',
        fontSize: isMobile ? 18 : 20
      }
    );
    if (retryBtn && retryBtn.cleanup) {
      this.buttonCleanups.push(retryBtn.cleanup);
    }

    btnY += btnSpacing;
    // SHARE 버튼
    const shareBtn = createRexButton(
      this,
      width / 2,
      btnY,
      btnWidth,
      btnHeight,
      'SHARE TO FARCASTER',
      async () => {
        console.log('✅ SHARE button clicked');
        await this.shareToFarcaster();
      },
      {
        backgroundColor: 0x1a2a3a,
        borderColor: 0x00ffff,
        textColor: '#ffffff',
        fontSize: isMobile ? 16 : 18
      }
    );
    if (shareBtn && shareBtn.cleanup) {
      this.buttonCleanups.push(shareBtn.cleanup);
    }

    btnY += btnSpacing;
    // LEADERBOARD 버튼
    const leaderboardBtn = createRexButton(
      this,
      width / 2,
      btnY,
      btnWidth,
      btnHeight,
      'LEADERBOARD',
      () => {
        console.log('✅ LEADERBOARD button clicked - going to leaderboard');
        this.cleanupButtons();
        this.scene.start('Leaderboard');
      },
      {
        backgroundColor: 0x1a2a3a,
        borderColor: 0x00ffff,
        textColor: '#ffffff',
        fontSize: isMobile ? 18 : 20
      }
    );
    if (leaderboardBtn && leaderboardBtn.cleanup) {
      this.buttonCleanups.push(leaderboardBtn.cleanup);
    }

    btnY += btnSpacing;
    // MENU 버튼
    const menuBtn = createRexButton(
      this,
      width / 2,
      btnY,
      btnWidth,
      btnHeight,
      'MENU',
      () => {
        console.log('✅ MENU button clicked - going to main menu');
        this.cleanupButtons();
        this.scene.start('MainMenu');
      },
      {
        backgroundColor: 0x4a5568,
        borderColor: 0x00ffff,
        textColor: '#ffffff',
        fontSize: isMobile ? 18 : 20
      }
    );
    if (menuBtn && menuBtn.cleanup) {
      this.buttonCleanups.push(menuBtn.cleanup);
    }
    
    console.log('✅ GameOver buttons created:', {
      retry: !!retryBtn,
      share: !!shareBtn,
      leaderboard: !!leaderboardBtn,
      menu: !!menuBtn,
      cleanups: this.buttonCleanups.length
    });
  }

  cleanupButtons() {
    if (this.buttonCleanups && Array.isArray(this.buttonCleanups)) {
      this.buttonCleanups.forEach(cleanup => {
        try {
          if (typeof cleanup === 'function') {
            cleanup();
          }
        } catch (error) {
          console.warn('Button cleanup error:', error);
        }
      });
      this.buttonCleanups = [];
    }
  }

  shutdown() {
    // 씬 종료 시 버튼 정리
    this.cleanupButtons();
  }

  async shareToFarcaster() {
    try {
      const mini = typeof window !== 'undefined' && window.mini ? window.mini : null;
      if (mini && mini.social) {
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        await mini.social.share({
          text: `🚀 Base Galaga Stage ${this.stage} 클리어! ${this.finalScore.toLocaleString()}점 (${timeStr}) 달성! 도전해보세요!`
        });
      } else {
        // Fallback for local development
        alert(`Share to Farcaster: ${this.finalScore}점 달성!`);
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('공유 기능을 사용할 수 없습니다.');
    }
  }

}

