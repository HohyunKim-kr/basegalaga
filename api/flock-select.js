/**
 * Vercel Serverless Function for FLock API
 * API 키를 서버 사이드에서만 사용하여 보안 강화
 */

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameState, items } = req.body;

    // 요청 로깅
    console.log('📥 Serverless API Request received:', {
      hasGameState: !!gameState,
      itemsCount: items?.length || 0,
      items: items?.map(i => i.name) || [],
      gameState: gameState ? {
        stage: gameState.currentStage,
        health: `${gameState.playerHealth}/${gameState.maxHealth}`,
        weaponLevel: gameState.weaponLevel
      } : null
    });

    // API 키는 서버 사이드 환경 변수에서 가져오기
    const apiKey = process.env.FLOCK_API_KEY;
    
    if (!apiKey) {
      console.error('❌ FLOCK_API_KEY is not set in environment variables');
      console.error('⚠️ Please set FLOCK_API_KEY in Vercel environment variables');
      // 폴백: 랜덤 선택
      const randomIndex = Math.floor(Math.random() * items.length);
      return res.status(200).json({ 
        selectedIndex: randomIndex,
        method: 'random_fallback',
        reason: 'API key not configured',
        debug: {
          envCheck: 'FLOCK_API_KEY environment variable is missing',
          suggestion: 'Set FLOCK_API_KEY in Vercel project settings'
        }
      });
    }

    console.log('✅ API key found (length:', apiKey.length, 'chars)');

    // FLock API 호출
    const prompt = buildItemSelectionPrompt(gameState, items);
    console.log('📝 Prompt generated (length:', prompt.length, 'chars)');
    
    console.log('🌐 Calling Flock API...');
    const apiStartTime = Date.now();
    const response = await fetch('https://api.flock.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen3-235b-a22b-thinking-2507',
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

    const apiEndTime = Date.now();
    const apiResponseTime = apiEndTime - apiStartTime;
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('❌ FLock API error:', response.status, errorText);
      console.error('⏱️ Response time:', apiResponseTime, 'ms');
      
      // 폴백: 스마트 선택
      const fallbackIndex = smartFallbackSelection(items, gameState);
      console.log('🔄 Using smart fallback, selected index:', fallbackIndex);
      return res.status(200).json({
        selectedIndex: fallbackIndex,
        method: 'smart_fallback',
        reason: `API error: ${response.status}`,
        debug: {
          status: response.status,
          errorText: errorText.substring(0, 200),
          responseTime: apiResponseTime
        }
      });
    }

    const data = await response.json();
    console.log('✅ Flock API response received (time:', apiResponseTime, 'ms)');
    console.log('📦 Response data:', JSON.stringify(data, null, 2).substring(0, 500));
    
    // 응답 파싱
    const content = data.choices?.[0]?.message?.content || '';
    console.log('📄 Parsing content:', content);
    const match = content.match(/\d+/);
    
    if (match) {
      const choice = parseInt(match[0], 10);
      console.log('🔢 Parsed choice:', choice);
      if (choice >= 1 && choice <= items.length) {
        console.log('✅ Valid choice, returning index:', choice - 1);
        return res.status(200).json({
          selectedIndex: choice - 1, // 0-based index
          method: 'ai',
          rawResponse: data,
          parsedContent: content,
          debug: {
            responseTime: apiResponseTime,
            parsedChoice: choice
          }
        });
      } else {
        console.warn('⚠️ Choice out of range:', choice, 'Items length:', items.length);
      }
    } else {
      console.warn('⚠️ No number found in content:', content);
    }

    // 파싱 실패 시 폴백
    const fallbackIndex = smartFallbackSelection(items, gameState);
    console.log('🔄 Parse failed, using smart fallback, selected index:', fallbackIndex);
    return res.status(200).json({
      selectedIndex: fallbackIndex,
      method: 'smart_fallback',
      reason: 'Failed to parse AI response',
      debug: {
        content: content,
        responseTime: apiResponseTime
      }
    });

  } catch (error) {
    console.error('Serverless function error:', error);
    
    // 에러 발생 시 랜덤 선택
    const randomIndex = Math.floor(Math.random() * items.length);
    return res.status(200).json({
      selectedIndex: randomIndex,
      method: 'random_fallback',
      reason: error.message
    });
  }
}

/**
 * Build prompt for item selection
 */
function buildItemSelectionPrompt(gameState, items) {
  const {
    currentStage,
    playerHealth,
    maxHealth,
    score,
    weaponLevel = 0, // 0 = SINGLE, 1 = DOUBLE, 2 = TRIPLE, 3 = SPREAD, 4 = LASER
    fireRate,
    activeEffects
  } = gameState;

  // weaponLevel을 무기 이름으로 변환
  const weaponNames = ['SINGLE', 'DOUBLE', 'TRIPLE', 'SPREAD', 'LASER'];
  const currentWeaponName = weaponNames[weaponLevel] || 'SINGLE';

  const itemsDescription = items.map((item, index) => {
    return `${index + 1}. ${item.name}: ${item.description}`;
  }).join('\n');

  return `You are playing a Galaga-style shooter game. Help choose the best item upgrade.

Current Game State:
- Stage: ${currentStage}/10
- Health: ${playerHealth}/${maxHealth}
- Score: ${score}
- Current Weapon: ${currentWeaponName} (Level ${weaponLevel})
- Fire Rate: ${fireRate}ms
- Active Effects: ${JSON.stringify(activeEffects || {})}

Available Items (choose ONE by number):
${itemsDescription}

Strategy Guidelines:
- If health is low (${playerHealth}/${maxHealth} < 50%), prioritize HEALTH RESTORE
- If health is good, prioritize WEAPON UPGRADE or FIRE RATE BOOST for offense
- MAX HEALTH UP is good for long-term survival
- SCORE MULTIPLIER is good if you're doing well and want higher scores
- If weapon is SINGLE (level 0), WEAPON UPGRADE is very valuable

Respond with ONLY the number (1, 2, or 3) of the best item to choose. No explanation, just the number.`;
}

/**
 * Smart fallback selection
 */
function smartFallbackSelection(items, gameState) {
  if (gameState) {
    const healthPercent = (gameState.playerHealth / gameState.maxHealth) * 100;
    
    // 체력이 50% 미만이면 HEALTH RESTORE 우선
    if (healthPercent < 50) {
      const healthItem = items.findIndex(item => item.name === 'HEALTH RESTORE');
      if (healthItem >= 0) return healthItem;
    }
    
    // 무기가 SINGLE (weaponLevel 0)이면 WEAPON UPGRADE 우선
    const weaponLevel = gameState.weaponLevel || 0;
    if (weaponLevel === 0) {
      const weaponItem = items.findIndex(item => item.name === 'WEAPON UPGRADE');
      if (weaponItem >= 0) return weaponItem;
    }
  }
  
  // 기본: 무작위 선택
  return Math.floor(Math.random() * items.length);
}

