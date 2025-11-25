/**
 * 리포트 콘텐츠 생성 모듈
 * 
 * Anthropic Claude API를 사용하여 수집된 데이터를 기반으로
 * 전문적인 커피 시장 리포트 콘텐츠를 생성합니다.
 */

const https = require('https');

// API 설정
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// HTTP POST 요청 헬퍼
function postRequest(url, data, headers) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                ...headers
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            res.setEncoding('utf8');
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    if (res.statusCode >= 400) {
                        reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(json)}`));
                    } else {
                        resolve(json);
                    }
                } catch (e) {
                    reject(new Error(`JSON Parse Error: ${responseData}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(120000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.write(postData);
        req.end();
    });
}

// 날짜 포맷팅
function formatKoreanDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 리포트 프롬프트 생성
function buildReportPrompt(data) {
    const { date, dateStr, weekRange, marketData, newsData } = data;
    
    // 시장 데이터 요약
    let marketSummary = '## 수집된 시장 데이터\n\n';
    
    if (marketData.arabica) {
        marketSummary += `### ICE 아라비카 선물 (KC)\n`;
        marketSummary += `- 현재가: ${marketData.arabica.price}센트/파운드\n`;
        marketSummary += `- 주간 변동: ${marketData.arabica.change >= 0 ? '+' : ''}${marketData.arabica.change.toFixed(2)}센트 (${marketData.arabica.changePercent}%)\n`;
        marketSummary += `- 주간 고가: ${marketData.arabica.weekHigh}센트\n`;
        marketSummary += `- 주간 저가: ${marketData.arabica.weekLow}센트\n\n`;
    }
    
    if (marketData.usdBrl) {
        marketSummary += `### USD/BRL 환율\n`;
        marketSummary += `- 현재: ${marketData.usdBrl.rate}\n`;
        marketSummary += `- 주간 변동: ${marketData.usdBrl.changePercent}%\n\n`;
    }
    
    if (marketData.iceStocks) {
        marketSummary += `### ICE 인증 재고\n`;
        marketSummary += `- 현재: ${Math.round(marketData.iceStocks.total).toLocaleString()}백\n`;
        marketSummary += `- 주간 변동: ${marketData.iceStocks.changePercent}%\n\n`;
    }
    
    if (marketData.cftcPositions) {
        marketSummary += `### CFTC 머니매니저 포지션\n`;
        marketSummary += `- 순매수: ${Math.round(marketData.cftcPositions.netPosition).toLocaleString()}계약\n`;
        marketSummary += `- 주간 변동: ${marketData.cftcPositions.changePercent}%\n\n`;
    }
    
    // 뉴스 요약
    let newsSummary = '## 수집된 뉴스 (최근 7일)\n\n';
    newsData.slice(0, 15).forEach((news, i) => {
        newsSummary += `### ${i + 1}. ${news.title}\n`;
        newsSummary += `- 출처: ${news.source}\n`;
        newsSummary += `- 날짜: ${new Date(news.pubDate).toLocaleDateString('ko-KR')}\n`;
        newsSummary += `- 요약: ${news.description}\n`;
        newsSummary += `- 링크: ${news.link}\n\n`;
    });
    
    const prompt = `당신은 커피 원자재 시장 전문 애널리스트입니다. 아래 수집된 데이터를 바탕으로 "${formatKoreanDate(date)}" 기준 커피 선물 시장 주간 동향 리포트를 작성해주세요.

분석 기간: ${weekRange.startKorean} ~ ${weekRange.endKorean}

${marketSummary}

${newsSummary}

## 리포트 작성 요구사항

### 1. 구조
다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
    "title": "커피 선물 시장 주간 동향",
    "subtitle": "영문 부제목 (핵심 키워드 포함)",
    "summary": "전체 요약 (3-4문장, 핵심 데이터와 주요 이벤트 포함)",
    "tags": ["태그1", "태그2", ...],  // 8-12개 태그
    "regions": ["브라질", "베트남", ...],  // 언급된 지역
    "sections": {
        "marketOverview": {
            "title": "시장 개요",
            "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", ...],
            "content": "상세 분석 내용 (HTML 형식)"
        },
        "priceAction": {
            "title": "주요 가격 동향",
            "priceTable": [
                {"contract": "근월물", "price": "XXX.XX", "change": "+X.XX", "volume": "XXX"},
                ...
            ],
            "content": "가격 분석 내용"
        },
        "keyNews": {
            "title": "주간 핵심 뉴스",
            "items": [
                {
                    "date": "YYYY.MM.DD",
                    "title": "뉴스 제목",
                    "summary": "뉴스 요약 (2-3문장)",
                    "source": "출처명",
                    "sourceUrl": "URL"
                },
                ...
            ]
        },
        "originUpdates": {
            "title": "산지별 동향",
            "brazil": { "title": "브라질", "content": "브라질 동향" },
            "vietnam": { "title": "베트남", "content": "베트남 동향" },
            "others": { "title": "기타 산지", "content": "기타 산지 동향" }
        },
        "supplyDemand": {
            "title": "수급 전망",
            "content": "수급 분석 내용"
        },
        "technicalAnalysis": {
            "title": "기술적 분석",
            "support": ["지지선 1", "지지선 2"],
            "resistance": ["저항선 1", "저항선 2"],
            "content": "기술적 분석 내용"
        },
        "riskFactors": {
            "title": "리스크 요인",
            "bullish": ["상방 리스크 1", "상방 리스크 2", "상방 리스크 3"],
            "bearish": ["하방 리스크 1", "하방 리스크 2", "하방 리스크 3"]
        },
        "outlook": {
            "title": "시장 전망",
            "shortTerm": { "range": "XXX-XXX", "content": "단기 전망" },
            "midTerm": { "content": "중장기 전망" }
        }
    },
    "sources": [
        { "name": "출처명", "url": "URL" },
        ...
    ]
}
\`\`\`

### 2. 작성 톤 & 스타일
- 객관적이고 전문적인 톤 유지
- 과장된 표현 금지 ("폭등", "급락" 대신 "상승", "하락")
- 구체적인 수치 포함 (%, 센트, 백 단위)
- 한국어로 작성
- 영문 고유명사는 원문 유지 (ICE, CFTC, StoneX 등)

### 3. 품질 기준
- 모든 가격 데이터는 제공된 데이터 기준으로 작성
- 뉴스는 반드시 출처 링크 포함
- 객관적인 톤 유지
- 분석은 데이터에 기반

JSON만 응답해주세요. 추가 설명이나 마크다운 블록 없이 순수 JSON만 반환해주세요.`;

    return prompt;
}

// Anthropic Claude API 호출
async function callAnthropicAPI(prompt) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    
    console.log('     🤖 Claude API 호출 중...');
    
    const response = await postRequest(
        ANTHROPIC_API_URL,
        {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        },
        {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        }
    );
    
    if (response.content && response.content[0] && response.content[0].text) {
        return response.content[0].text;
    }
    
    throw new Error('API 응답에서 콘텐츠를 찾을 수 없습니다.');
}

// OpenAI API 호출 (백업)
async function callOpenAIAPI(prompt) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    
    console.log('     🤖 OpenAI API 호출 중...');
    
    const response = await postRequest(
        OPENAI_API_URL,
        {
            model: 'gpt-4o',
            max_tokens: 8192,
            messages: [
                {
                    role: 'system',
                    content: '당신은 커피 원자재 시장 전문 애널리스트입니다. 요청된 JSON 형식으로만 응답해주세요.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        },
        {
            'Authorization': `Bearer ${apiKey}`
        }
    );
    
    if (response.choices && response.choices[0] && response.choices[0].message) {
        return response.choices[0].message.content;
    }
    
    throw new Error('API 응답에서 콘텐츠를 찾을 수 없습니다.');
}

// JSON 파싱 (코드 블록 제거)
function parseJSONResponse(text) {
    // 코드 블록 제거
    let jsonText = text
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/gi, '')
        .trim();
    
    // JSON 시작/끝 찾기
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
        throw new Error('JSON 객체를 찾을 수 없습니다.');
    }
    
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    
    return JSON.parse(jsonText);
}

// 폴백 콘텐츠 생성 (API 실패 시)
function generateFallbackContent(data) {
    const { date, dateStr, weekRange, marketData, newsData } = data;
    
    const arabicaPrice = marketData.arabica?.price || '데이터 미확인';
    const arabicaChange = marketData.arabica?.changePercent || 0;
    const usdBrl = marketData.usdBrl?.rate || '데이터 미확인';
    const iceStocks = marketData.iceStocks?.total || '데이터 미확인';
    
    const changeDirection = parseFloat(arabicaChange) >= 0 ? '상승' : '하락';
    
    return {
        title: '커피 선물 시장 주간 동향',
        subtitle: 'Coffee Futures Market Weekly Update',
        summary: `${weekRange.startKorean}부터 ${weekRange.endKorean}까지 ICE 아라비카 선물은 ${arabicaPrice}센트로 주간 ${Math.abs(arabicaChange)}% ${changeDirection}했습니다. USD/BRL 환율은 ${usdBrl}, ICE 인증 재고는 ${typeof iceStocks === 'number' ? Math.round(iceStocks).toLocaleString() : iceStocks}백 수준입니다.`,
        tags: ['주간동향', '아라비카', '선물시장', 'ICE', dateStr.substring(0, 7)],
        regions: ['글로벌', '브라질', '베트남'],
        sections: {
            marketOverview: {
                title: '시장 개요',
                keyPoints: [
                    `아라비카 선물 ${arabicaPrice}센트 기록`,
                    `주간 ${Math.abs(arabicaChange)}% ${changeDirection}`,
                    `ICE 인증 재고 ${typeof iceStocks === 'number' ? Math.round(iceStocks).toLocaleString() : iceStocks}백`
                ],
                content: `<p>이번 주 커피 선물 시장은 ${changeDirection}세를 보였습니다.</p>`
            },
            priceAction: {
                title: '주요 가격 동향',
                priceTable: marketData.arabica ? [
                    {
                        contract: '근월물',
                        price: arabicaPrice,
                        change: `${arabicaChange >= 0 ? '+' : ''}${arabicaChange}%`,
                        volume: '-'
                    }
                ] : [],
                content: '<p>상세 가격 동향은 데이터 확인 후 업데이트됩니다.</p>'
            },
            keyNews: {
                title: '주간 핵심 뉴스',
                items: newsData.slice(0, 5).map(news => ({
                    date: new Date(news.pubDate).toLocaleDateString('ko-KR'),
                    title: news.title,
                    summary: news.description,
                    source: news.source,
                    sourceUrl: news.link
                }))
            },
            originUpdates: {
                title: '산지별 동향',
                brazil: { title: '브라질', content: '<p>브라질 동향 업데이트 예정</p>' },
                vietnam: { title: '베트남', content: '<p>베트남 동향 업데이트 예정</p>' },
                others: { title: '기타 산지', content: '<p>기타 산지 동향 업데이트 예정</p>' }
            },
            supplyDemand: {
                title: '수급 전망',
                content: '<p>수급 전망 업데이트 예정</p>'
            },
            technicalAnalysis: {
                title: '기술적 분석',
                support: [],
                resistance: [],
                content: '<p>기술적 분석 업데이트 예정</p>'
            },
            riskFactors: {
                title: '리스크 요인',
                bullish: ['데이터 확인 필요'],
                bearish: ['데이터 확인 필요']
            },
            outlook: {
                title: '시장 전망',
                shortTerm: { range: '-', content: '단기 전망 업데이트 예정' },
                midTerm: { content: '중장기 전망 업데이트 예정' }
            }
        },
        sources: newsData.slice(0, 5).map(news => ({
            name: news.source,
            url: news.link
        }))
    };
}

// 메인 콘텐츠 생성 함수
async function generateReportContent(data) {
    const prompt = buildReportPrompt(data);
    
    // API 키 확인
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    
    if (!hasAnthropicKey && !hasOpenAIKey) {
        console.log('     ⚠️ API 키가 설정되지 않았습니다. 폴백 콘텐츠를 생성합니다.');
        return generateFallbackContent(data);
    }
    
    try {
        let responseText;
        
        // Anthropic API 우선 사용
        if (hasAnthropicKey) {
            try {
                responseText = await callAnthropicAPI(prompt);
            } catch (anthropicError) {
                console.log(`     ⚠️ Anthropic API 실패: ${anthropicError.message}`);
                if (hasOpenAIKey) {
                    console.log('     🔄 OpenAI API로 전환합니다...');
                    responseText = await callOpenAIAPI(prompt);
                } else {
                    throw anthropicError;
                }
            }
        } else {
            responseText = await callOpenAIAPI(prompt);
        }
        
        console.log('     ✓ API 응답 수신 완료');
        
        // JSON 파싱
        const content = parseJSONResponse(responseText);
        console.log('     ✓ JSON 파싱 완료');
        
        return content;
        
    } catch (error) {
        console.error(`     ❌ 콘텐츠 생성 실패: ${error.message}`);
        console.log('     🔄 폴백 콘텐츠로 대체합니다...');
        return generateFallbackContent(data);
    }
}

module.exports = {
    generateReportContent,
    buildReportPrompt,
    callAnthropicAPI,
    callOpenAIAPI,
    parseJSONResponse,
    generateFallbackContent
};
