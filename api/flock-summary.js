/**
 * Vercel Serverless Function for FLock API - Game Summary Generation
 * 게임 요약을 트위터 스타일로 생성
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
    const { prompt, gameStats } = req.body;

    // API 키는 서버 사이드 환경 변수에서 가져오기
    const apiKey = process.env.FLOCK_API_KEY;
    
    if (!apiKey) {
      console.error('FLOCK_API_KEY is not set in environment variables');
      // 폴백: 기본 요약 생성
      return res.status(200).json({ 
        summaryText: generateFallbackSummary(gameStats),
        method: 'fallback',
        reason: 'API key not configured'
      });
    }

    // FLock API 호출
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
            content: 'You are a creative game journalist. Write engaging Twitter posts about games. Keep responses under 280 characters.'
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('FLock API error:', response.status, errorText);
      
      // 폴백: 기본 요약 생성
      return res.status(200).json({
        summaryText: generateFallbackSummary(gameStats),
        method: 'fallback',
        reason: `API error: ${response.status}`
      });
    }

    const data = await response.json();
    
    // 응답 파싱
    const content = data.choices?.[0]?.message?.content || '';
    const summaryText = content.trim() || generateFallbackSummary(gameStats);
    
    return res.status(200).json({
      summaryText: summaryText,
      method: 'ai',
      rawResponse: data
    });

  } catch (error) {
    console.error('Serverless function error:', error);
    
    // 에러 발생 시 폴백
    return res.status(200).json({
      summaryText: generateFallbackSummary(req.body.gameStats || {}),
      method: 'fallback',
      reason: error.message
    });
  }
}

/**
 * Fallback summary generation
 */
function generateFallbackSummary(gameStats) {
  const {
    currentStage = 1,
    score = 0,
    elapsedTime = 0,
    selectedItemsHistory = [],
    enemiesKilled = 0,
    allCleared = false
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

