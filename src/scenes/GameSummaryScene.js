import Phaser from 'phaser';
import { isMobile } from '../main.js';

/**
 * Star Wars 스타일 크롤 텍스트 씬
 * 게임 요약을 트위터 형태로 표시
 */
export class GameSummaryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameSummaryScene' });
  }

  init(data) {
    this.summaryText = data.summaryText || 'Game completed!';
    this.gameStats = data.gameStats || {};
    this.canSkip = false;
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // 검은 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    
    // 크롤 텍스트 생성
    this.createCrawlText();
    
    // 스킵 가능 표시 (3초 후)
    this.time.delayedCall(3000, () => {
      this.canSkip = true;
      this.showSkipHint();
    });
    
    // 터치/클릭으로 스킵
    this.input.once('pointerdown', () => {
      if (this.canSkip) {
        this.skipToGameOver();
      }
    });
    
    // 자동으로 GameOver 씬으로 전환 (크롤 완료 후)
    const crawlDuration = this.calculateCrawlDuration();
    this.time.delayedCall(crawlDuration, () => {
      this.skipToGameOver();
    });
  }

  createCrawlText() {
    const { width, height } = this.cameras.main;
    
    // Episode 번호 (작은 텍스트)
    const episodeText = this.add.text(width / 2, height * 0.3, 'EPISODE VII', {
      fontSize: isMobile ? '20px' : '28px',
      fontFamily: 'Arial',
      color: '#FFD700',
      align: 'center'
    }).setOrigin(0.5, 0.5).setAlpha(0);

    // 제목 (큰 텍스트)
    const titleText = this.add.text(width / 2, height * 0.35, 'THE FORCE AWAKENS', {
      fontSize: isMobile ? '32px' : '48px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#FFD700',
      align: 'center'
    }).setOrigin(0.5, 0.5).setAlpha(0);

    // 요약 텍스트 (본문)
    const lines = this.wrapText(this.summaryText, isMobile ? 280 : 600);
    const summaryLines = lines.map((line, index) => {
      return this.add.text(width / 2, height * 0.5 + (index * (isMobile ? 28 : 36)), line, {
        fontSize: isMobile ? '14px' : '18px',
        fontFamily: 'Arial',
        fontStyle: 'italic',
        color: '#FFD700',
        align: 'center',
        wordWrap: { width: isMobile ? 280 : 600 }
      }).setOrigin(0.5, 0).setAlpha(0);
    });

    // 페이드 인 애니메이션
    this.tweens.add({
      targets: [episodeText, titleText],
      alpha: 1,
      duration: 2000,
      onComplete: () => {
        // 제목 페이드 아웃
        this.tweens.add({
          targets: [episodeText, titleText],
          alpha: 0,
          duration: 1000,
          onComplete: () => {
            // 요약 텍스트 크롤 시작
            this.startCrawl(summaryLines);
          }
        });
      }
    });
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = this.getTextWidth(testLine, isMobile ? 14 : 18);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  getTextWidth(text, fontSize) {
    // 대략적인 텍스트 너비 계산
    return text.length * (fontSize * 0.6);
  }

  startCrawl(summaryLines) {
    const { width, height } = this.cameras.main;
    const startY = height + 100;
    const endY = -height * 0.5;
    const duration = 20000; // 20초 크롤
    
    summaryLines.forEach((line, index) => {
      line.setY(startY + (index * (isMobile ? 28 : 36)));
      line.setAlpha(1);
      
      // 크롤 애니메이션
      this.tweens.add({
        targets: line,
        y: endY + (index * (isMobile ? 28 : 36)),
        duration: duration,
        ease: 'Linear',
        delay: index * 500 // 각 줄마다 약간의 딜레이
      });
    });
  }

  calculateCrawlDuration() {
    const lineCount = this.wrapText(this.summaryText, isMobile ? 280 : 600).length;
    return 2000 + 1000 + 20000 + (lineCount * 500) + 2000; // 페이드인 + 제목 + 크롤 + 여유
  }

  showSkipHint() {
    const { width, height } = this.cameras.main;
    const hint = this.add.text(width / 2, height - 50, 'Tap to skip', {
      fontSize: isMobile ? '14px' : '18px',
      fontFamily: 'Arial',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: hint,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }

  skipToGameOver() {
    // GameOver 씬으로 전환 (통계 포함)
    this.scene.start('GameOver', {
      score: this.gameStats.score || 0,
      baseScore: this.gameStats.baseScore || this.gameStats.score || 0,
      time: this.gameStats.elapsedTime || 0,
      stage: this.gameStats.currentStage || 1,
      allCleared: this.gameStats.allCleared || false
    });
  }
}

