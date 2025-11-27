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

    // 요청 로깅
    console.log('📥 Serverless Summary API Request received:', {
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0,
      hasGameStats: !!gameStats,
      gameStats: gameStats ? {
        stage: gameStats.currentStage,
        score: gameStats.score,
        itemsCount: gameStats.selectedItemsHistory?.length || 0,
        items: gameStats.selectedItemsHistory?.map(i => `${i.stage}:${i.name}`).join(', ') || 'None',
        enemiesKilled: gameStats.enemiesKilled,
        allCleared: gameStats.allCleared
      } : null
    });

    // API 키는 서버 사이드 환경 변수에서 가져오기
    const apiKey = process.env.FLOCK_API_KEY;
    
    if (!apiKey) {
      console.error('❌ FLOCK_API_KEY is not set in environment variables');
      console.error('⚠️ Please set FLOCK_API_KEY in Vercel environment variables');
      // 폴백: 기본 요약 생성
      const fallbackSummary = generateFallbackSummary(gameStats);
      return res.status(200).json({ 
        summaryText: fallbackSummary,
        method: 'fallback',
        reason: 'API key not configured',
        debug: {
          envCheck: 'FLOCK_API_KEY environment variable is missing',
          suggestion: 'Set FLOCK_API_KEY in Vercel project settings'
        }
      });
    }

    console.log('✅ API key found (length:', apiKey.length, 'chars)');
    console.log('📝 Prompt preview (first 200 chars):', prompt?.substring(0, 200) || 'N/A');

    // FLock API 호출
    console.log('🌐 Calling Flock API for summary generation...');
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

    const apiEndTime = Date.now();
    const apiResponseTime = apiEndTime - apiStartTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('❌ FLock API error:', response.status, errorText);
      console.error('⏱️ Response time:', apiResponseTime, 'ms');
      
      // 폴백: 기본 요약 생성
      const fallbackSummary = generateFallbackSummary(gameStats);
      console.log('🔄 Using fallback summary, length:', fallbackSummary.length);
      return res.status(200).json({
        summaryText: fallbackSummary,
        method: 'fallback',
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
    console.log('📦 Response data preview:', JSON.stringify(data, null, 2).substring(0, 500));
    
    // 응답 파싱
    const content = data.choices?.[0]?.message?.content || '';
    console.log('📄 Parsed content:', content);
    const summaryText = content.trim() || generateFallbackSummary(gameStats);
    
    console.log('✅ Summary generated:', {
      method: 'ai',
      summaryLength: summaryText.length,
      summaryPreview: summaryText.substring(0, 100)
    });
    
    return res.status(200).json({
      summaryText: summaryText,
      method: 'ai',
      rawResponse: data,
      debug: {
        responseTime: apiResponseTime,
        contentLength: content.length
      }
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

