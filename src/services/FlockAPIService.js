/**
 * FLock API Service
 * AI-powered item selection for Base Galaga game
 * 
 * Setup:
 * 1. Go to https://platform.flock.io and sign up
 * 2. Create an API key
 * 3. Add your API key to environment variables or config
 * 4. Buy credits if needed
 */

export class FlockAPIService {
  constructor(apiKey) {
    this.apiKey = apiKey || this.getAPIKey();
    this.apiBaseUrl = 'https://api.flock.io/v1'; // FLock API endpoint
    // FLock API 키에 따라 사용 가능한 모델이 다름
    // 기본값은 qwen3-235b-a22b-thinking-2507 (에러 메시지에서 확인)
    this.model = 'qwen3-235b-a22b-thinking-2507'; // FLock에서 제공하는 모델
  }

  /**
   * Get API key from environment or localStorage
   */
  getAPIKey() {
    // 환경 변수에서 가져오기 (빌드 시)
    if (typeof process !== 'undefined' && process.env?.VITE_FLOCK_API_KEY) {
      return process.env.VITE_FLOCK_API_KEY;
    }
    
    // localStorage에서 가져오기 (런타임)
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('FLOCK_API_KEY');
    }
    
    return null;
  }

  /**
   * Set API key
   */
  setAPIKey(apiKey) {
    this.apiKey = apiKey;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('FLOCK_API_KEY', apiKey);
    }
  }

  /**
   * Build prompt for item selection based on game state
   */
  buildItemSelectionPrompt(gameState, items) {
    const { 
      currentStage, 
      playerHealth, 
      maxHealth, 
      score, 
      currentWeapon,
      fireRate,
      activeEffects 
    } = gameState;

    const itemsDescription = items.map((item, index) => {
      return `${index + 1}. ${item.name}: ${item.description}`;
    }).join('\n');

    return `You are playing a Galaga-style shooter game. Help choose the best item upgrade.

Current Game State:
- Stage: ${currentStage}/10
- Health: ${playerHealth}/${maxHealth}
- Score: ${score}
- Current Weapon: ${currentWeapon?.name || 'SINGLE'}
- Fire Rate: ${fireRate}ms
- Active Effects: ${JSON.stringify(activeEffects)}

Available Items (choose ONE by number):
${itemsDescription}

Strategy Guidelines:
- If health is low (${playerHealth}/${maxHealth} < 50%), prioritize HEALTH RESTORE
- If health is good, prioritize WEAPON UPGRADE or FIRE RATE BOOST for offense
- MAX HEALTH UP is good for long-term survival
- SCORE MULTIPLIER is good if you're doing well and want higher scores

Respond with ONLY the number (1, 2, or 3) of the best item to choose. No explanation, just the number.`;
  }

  /**
   * Call FLock API to select item
   * 보안: 서버 사이드 API 사용 (Vercel 서버리스 함수)
   */
  async selectItem(gameState, items, useRandom = false) {
    // 랜덤 선택 모드: 게임 상태와 무관하게 완전 랜덤
    if (useRandom) {
      const randomIndex = Math.floor(Math.random() * items.length);
      console.log('🎲 Random selection (game state ignored):', randomIndex, 'Item:', items[randomIndex]?.name);
      return randomIndex;
    }

    // 서버 사이드 API 사용 (보안 강화)
    const useServerlessAPI = true; // 서버리스 함수 사용 여부
    
    if (useServerlessAPI) {
      try {
        console.group('🟢 Serverless API Request');
        console.log('🌐 Endpoint: /api/flock-select');
        console.log('📦 Request Data:', { gameState, items: items.map(i => i.name) });
        console.groupEnd();
        
        const apiStartTime = performance.now();
        
        // Vercel 서버리스 함수 호출
        const response = await fetch('/api/flock-select', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            gameState,
            items
          })
        });

        if (!response.ok) {
          throw new Error(`Serverless API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const apiEndTime = performance.now();
        const apiResponseTime = (apiEndTime - apiStartTime).toFixed(2);
        
        console.group('🔵 Serverless API Response');
        console.log(`⏱️ Response Time: ${apiResponseTime}ms`);
        console.log('📦 Full Response:', data);
        console.log('🔧 Method Used:', data.method);
        if (data.reason) {
          console.log('ℹ️ Reason:', data.reason);
        }
        if (data.rawResponse) {
          console.log('📋 Raw API Response:', data.rawResponse);
        }
        console.groupEnd();
        
        if (data.selectedIndex >= 0 && data.selectedIndex < items.length) {
          console.log('✅ Selected index:', data.selectedIndex, 'Item:', items[data.selectedIndex]?.name, `(${data.method})`);
          return data.selectedIndex;
        }
      } catch (error) {
        console.error('❌ Serverless API error:', error);
        // 폴백으로 클라이언트 사이드 API 시도
        console.warn('⚠️ Falling back to client-side API...');
      }
    }

    // 클라이언트 사이드 API (폴백 또는 useServerlessAPI가 false인 경우)
    // ⚠️ 경고: API 키가 클라이언트에 노출됩니다!
    if (!this.apiKey || this.apiKey === 'your_flock_api_key_here') {
      console.warn('⚠️ FLock API key not set. Using smart fallback selection.');
      console.warn('⚠️ SECURITY WARNING: API keys in client-side code are exposed in the browser!');
      const fallbackIndex = this.fallbackSelection(items, gameState);
      console.log('Fallback selected index:', fallbackIndex, 'Item:', items[fallbackIndex]?.name);
      return fallbackIndex;
    }

    console.warn('⚠️ SECURITY WARNING: Using client-side API. API key is exposed in browser!');
    console.warn('⚠️ Consider using serverless function (/api/flock-select) for better security.');

    try {
      const prompt = this.buildItemSelectionPrompt(gameState, items);
      
      // API 요청 데이터 상세 로그
      console.group('🟢 FLock API Request (Client-side)');
      console.log('🌐 Endpoint:', `${this.apiBaseUrl}/chat/completions`);
      console.log('🤖 Model:', this.model);
      console.log('📝 Prompt (first 200 chars):', prompt.substring(0, 200) + '...');
      console.log('📏 Full Prompt Length:', prompt.length, 'characters');
      console.groupEnd();
      
      // API 응답 시간 측정
      const apiStartTime = performance.now();
      
      // FLock API 호출 (클라이언트 사이드 - API 키 노출됨!)
      const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a game strategy assistant. Respond with only a number (1, 2, or 3).'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('FLock API error response:', errorText);
        throw new Error(`FLock API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const apiEndTime = performance.now();
      const apiResponseTime = (apiEndTime - apiStartTime).toFixed(2);
      
      // API 응답 데이터 상세 로그
      console.group('🔵 FLock API Response Data');
      console.log(`⏱️ Response Time: ${apiResponseTime}ms`);
      console.log('📦 Full Response Object:', data);
      console.log('📋 Response Keys:', Object.keys(data));
      
      // 응답 구조 분석
      if (data.choices && Array.isArray(data.choices)) {
        console.log(`📊 Choices Count: ${data.choices.length}`);
        data.choices.forEach((choice, idx) => {
          console.log(`\n  Choice ${idx + 1}:`, {
            index: choice.index,
            finish_reason: choice.finish_reason,
            message: choice.message,
            message_role: choice.message?.role,
            message_content: choice.message?.content,
            delta: choice.delta
          });
        });
      }
      
      if (data.usage) {
        console.log('\n📈 Usage Stats:', {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens
        });
      }
      
      if (data.model) {
        console.log(`🤖 Model Used: ${data.model}`);
      }
      
      if (data.id) {
        console.log(`🆔 Request ID: ${data.id}`);
      }
      
      // 원시 텍스트 응답
      const rawContent = data.choices?.[0]?.message?.content || data.content || data.response || '';
      console.log(`\n📝 Raw Content: "${rawContent}"`);
      console.log(`📏 Content Length: ${rawContent.length} characters`);
      
      console.groupEnd();
      
      // 응답에서 선택된 번호 추출
      const choice = this.parseSelection(data);
      console.log('✅ Parsed Choice (1-3):', choice);
      
      if (choice >= 1 && choice <= items.length) {
        const selectedIndex = choice - 1; // 0-based index
        console.log('AI selected index:', selectedIndex, 'Item:', items[selectedIndex]?.name);
        return selectedIndex;
      } else {
        console.warn('Invalid selection from AI, using fallback');
        const fallbackIndex = this.fallbackSelection(items, gameState);
        console.log('Fallback selected index:', fallbackIndex, 'Item:', items[fallbackIndex]?.name);
        return fallbackIndex;
      }
    } catch (error) {
      console.error('FLock API error:', error);
      const fallbackIndex = this.fallbackSelection(items, gameState);
      console.log('Error fallback selected index:', fallbackIndex, 'Item:', items[fallbackIndex]?.name);
      return fallbackIndex;
    }
  }

  /**
   * Parse AI response to get item index
   */
  parseSelection(data) {
    try {
      console.group('🔍 Parsing AI Response');
      
      // FLock API 응답 형식에 따라 파싱
      // 일반적인 형식: { choices: [{ message: { content: "1" } }] }
      const content = data.choices?.[0]?.message?.content || 
                     data.content || 
                     data.response ||
                     '';
      
      console.log('📄 Content to parse:', content);
      console.log('📄 Content type:', typeof content);
      
      // 숫자만 추출
      const match = content.match(/\d+/);
      console.log('🔢 Number match:', match);
      
      if (match) {
        const parsedNumber = parseInt(match[0], 10);
        console.log('✅ Parsed number:', parsedNumber);
        console.groupEnd();
        return parsedNumber;
      }
      
      console.warn('⚠️ No number found in content');
      console.groupEnd();
      return null;
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      console.groupEnd();
      return null;
    }
  }

  /**
   * Generate game summary in Twitter style using FLock API
   */
  async generateGameSummary(gameStats) {
    const {
      currentStage,
      score,
      elapsedTime,
      selectedItemsHistory,
      enemiesKilled,
      allCleared
    } = gameStats;

    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const itemsSummary = selectedItemsHistory.map((item, idx) => 
      `Stage ${item.stage}: ${item.name}`
    ).join(', ');

    const prompt = `You are a creative game journalist. Write a Twitter-style post (tweet) summarizing a Galaga-style shooter game playthrough.

Game Statistics:
- Final Stage: ${currentStage}/10
- Final Score: ${score.toLocaleString()}
- Play Time: ${timeStr}
- Enemies Killed: ${enemiesKilled}
- Result: ${allCleared ? 'ALL STAGES CLEARED! 🎉' : 'Game Over'}
- Items Selected: ${itemsSummary || 'None'}

Write a creative, engaging Twitter post (tweet) about this game session. Make it:
- Fun and exciting
- Include emojis naturally
- Mention key achievements (stage, score, items)
- Keep it under 280 characters
- Write in a casual, celebratory tone
- Use hashtags if appropriate

Respond with ONLY the tweet text. No explanations, no quotes, just the tweet content.`;

    try {
      // 서버 사이드 API 사용 (프로덕션에서만)
      const useServerlessAPI = true;
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (useServerlessAPI && !isLocalDev) {
        try {
          const response = await fetch('/api/flock-summary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt,
              gameStats
            })
          });

          if (response.ok) {
            const data = await response.json();
            return data.summaryText || this.generateFallbackSummary(gameStats);
          }
        } catch (serverlessError) {
          console.warn('Serverless API failed, falling back to client-side:', serverlessError);
          // 폴백으로 클라이언트 사이드 API 시도
        }
      }

      // 클라이언트 사이드 API (폴백)
      if (this.apiKey && this.apiKey !== 'your_flock_api_key_here') {
        const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You are a creative game journalist. Write engaging Twitter posts about games.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.8,
            max_tokens: 150
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          return content.trim() || this.generateFallbackSummary(gameStats);
        }
      }

      return this.generateFallbackSummary(gameStats);
    } catch (error) {
      console.error('Error generating game summary:', error);
      return this.generateFallbackSummary(gameStats);
    }
  }

  /**
   * Fallback summary if API fails
   */
  generateFallbackSummary(gameStats) {
    const {
      currentStage,
      score,
      elapsedTime,
      selectedItemsHistory,
      enemiesKilled,
      allCleared
    } = gameStats;

    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const itemsCount = selectedItemsHistory.length;
    const itemsList = selectedItemsHistory.slice(-3).map(i => i.name).join(', ');

    if (allCleared) {
      return `🎉 ALL STAGES CLEARED! 🎉\n\nReached Stage ${currentStage} with ${score.toLocaleString()} points in ${timeStr}!\n\nDefeated ${enemiesKilled} enemies and collected ${itemsCount} power-ups: ${itemsList}\n\nWhat an epic journey! 🚀✨`;
    } else {
      return `🚀 Base Galaga Adventure Complete!\n\nMade it to Stage ${currentStage} with ${score.toLocaleString()} points in ${timeStr}!\n\nFought ${enemiesKilled} enemies and gathered ${itemsCount} upgrades: ${itemsList}\n\nUntil next time, pilot! ⭐`;
    }
  }

  /**
   * Fallback selection if API fails
   */
  fallbackSelection(items, gameState = null) {
    // 스마트 폴백: 게임 상태를 고려한 선택
    if (gameState) {
      const healthPercent = (gameState.playerHealth / gameState.maxHealth) * 100;
      
      // 체력이 50% 미만이면 HEALTH RESTORE 우선
      if (healthPercent < 50) {
        const healthItem = items.findIndex(item => item.name === 'HEALTH RESTORE');
        if (healthItem >= 0) return healthItem;
      }
      
      // 무기가 약하면 WEAPON UPGRADE
      if (gameState.currentWeapon?.name === 'SINGLE') {
        const weaponItem = items.findIndex(item => item.name === 'WEAPON UPGRADE');
        if (weaponItem >= 0) return weaponItem;
      }
    }
    
    // 기본: 무작위 선택
    return Math.floor(Math.random() * items.length);
  }
}

