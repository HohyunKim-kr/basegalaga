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

    // API 키는 서버 사이드 환경 변수에서 가져오기
    const apiKey = process.env.FLOCK_API_KEY;
    
    if (!apiKey) {
      console.error('FLOCK_API_KEY is not set in environment variables');
      // 폴백: 랜덤 선택
      const randomIndex = Math.floor(Math.random() * items.length);
      return res.status(200).json({ 
        selectedIndex: randomIndex,
        method: 'random_fallback',
        reason: 'API key not configured'
      });
    }

    // FLock API 호출
    const prompt = buildItemSelectionPrompt(gameState, items);
    
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('FLock API error:', response.status, errorText);
      
      // 폴백: 스마트 선택
      const fallbackIndex = smartFallbackSelection(items, gameState);
      return res.status(200).json({
        selectedIndex: fallbackIndex,
        method: 'smart_fallback',
        reason: `API error: ${response.status}`
      });
    }

    const data = await response.json();
    
    // 응답 파싱
    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\d+/);
    
    if (match) {
      const choice = parseInt(match[0], 10);
      if (choice >= 1 && choice <= items.length) {
        return res.status(200).json({
          selectedIndex: choice - 1, // 0-based index
          method: 'ai',
          rawResponse: data,
          parsedContent: content
        });
      }
    }

    // 파싱 실패 시 폴백
    const fallbackIndex = smartFallbackSelection(items, gameState);
    return res.status(200).json({
      selectedIndex: fallbackIndex,
      method: 'smart_fallback',
      reason: 'Failed to parse AI response'
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
 * Smart fallback selection
 */
function smartFallbackSelection(items, gameState) {
  if (gameState) {
    const healthPercent = (gameState.playerHealth / gameState.maxHealth) * 100;
    
    if (healthPercent < 50) {
      const healthItem = items.findIndex(item => item.name === 'HEALTH RESTORE');
      if (healthItem >= 0) return healthItem;
    }
    
    if (gameState.currentWeapon?.name === 'SINGLE') {
      const weaponItem = items.findIndex(item => item.name === 'WEAPON UPGRADE');
      if (weaponItem >= 0) return weaponItem;
    }
  }
  
  return Math.floor(Math.random() * items.length);
}

