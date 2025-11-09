import { Transaction, Summary, PoliticianInfo } from '../types';

/**
 * Calculate the 5 metrics for a politician
 */
export function calculatePoliticianMetrics(
  transactions: Transaction[],
  summary: Summary,
  politician: PoliticianInfo
) {
  // 1. 集金力: 実際の金額/1000万 (actual income / 10M)
  const shukinryokuValue = summary.incomeTotal;
  const shukinryokuScore = shukinryokuValue / 10000000; // Not rounded for calculation
  const shukinryokuScoreRounded = Math.round(shukinryokuScore); // Rounded for display
  const shukinryokuNormalized = Math.max(
    0,
    Math.min(100, ((shukinryokuValue - 20000000) / (300000000 - 20000000)) * 100)
  );

  // 2. 美食力: 実際の金額/100万 (restaurant spending / 1M)
  const bishokuryokuCategories = ['高級レストラン', '懇親会'];
  const bishokuryokuValue = transactions
    .filter((t) => bishokuryokuCategories.includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0);
  const bishokuryokuScore = bishokuryokuValue / 1000000; // Not rounded for calculation
  const bishokuryokuScoreRounded = Math.round(bishokuryokuScore); // Rounded for display
  const bishokuryokuNormalized = Math.max(0, Math.min(100, (bishokuryokuValue / 6000000) * 100));

  // 3. 派閥力: 実際の金額/100万 (faction donations / 1M)
  const habatsuryokuValue = transactions
    .filter((t) => t.category === '仲間への寄付')
    .reduce((sum, t) => sum + t.amount, 0);
  const habatsuryokuScore = habatsuryokuValue / 1000000; // Not rounded for calculation
  const habatsuryokuScoreRounded = Math.round(habatsuryokuScore); // Rounded for display
  const habatsuryokuNormalized = Math.max(0, Math.min(100, (habatsuryokuValue / 10000000) * 100));

  // 4. 当選力: チャート表記 (election count as-is)
  const tousenryokuValue = politician.electionCount || 1;
  const tousenryokuScore = tousenryokuValue;
  const tousenryokuNormalized = Math.max(
    0,
    Math.min(100, ((tousenryokuValue - 1) / (11 - 1)) * 100)
  );

  // 5. 世襲力: チャート表記のまま (hereditary generation as-is)
  // Parse hereditary string (e.g., "4代目" -> 4)
  // Default to 1代目 (non-hereditary) if not specified
  const hereditaryMatch = politician.hereditary?.match(/(\d+)/);
  const seshuuryokuValue = hereditaryMatch ? parseInt(hereditaryMatch[1]) : 1;
  const seshuuryokuScore = seshuuryokuValue;
  const seshuuryokuNormalized = Math.max(
    0,
    Math.min(100, (seshuuryokuValue / 4) * 100)
  );

  return {
    shukinryokuValue,
    shukinryokuScore, // Unrounded for calculation
    shukinryokuScoreRounded, // Rounded for display
    shukinryokuNormalized,
    bishokuryokuValue,
    bishokuryokuScore, // Unrounded for calculation
    bishokuryokuScoreRounded, // Rounded for display
    bishokuryokuNormalized,
    habatsuryokuValue,
    habatsuryokuScore, // Unrounded for calculation
    habatsuryokuScoreRounded, // Rounded for display
    habatsuryokuNormalized,
    tousenryokuValue,
    tousenryokuScore,
    tousenryokuNormalized,
    seshuuryokuValue,
    seshuuryokuScore,
    seshuuryokuNormalized,
  };
}

/**
 * Calculate overall score: (集金力 + 美食力 + 派閥力 + 当選力) × 世襲力
 * Uses raw score values, not normalized values
 * For scores > 100, rounds to nearest increment of 10
 * Returns a rounded whole number
 */
export function calculateOverallScore(
  transactions: Transaction[],
  summary: Summary,
  politician: PoliticianInfo
): number {
  const metrics = calculatePoliticianMetrics(transactions, summary, politician);

  const sum =
    metrics.shukinryokuScore +
    metrics.bishokuryokuScore +
    metrics.habatsuryokuScore +
    metrics.tousenryokuScore;

  let score = sum * metrics.seshuuryokuScore;

  // Round to nearest 10 for scores higher than 100
  if (score > 100) {
    score = Math.round(score / 10) * 10;
  } else {
    score = Math.round(score);
  }

  return score;
}

/**
 * Calculate MBTI-style political type based on metrics
 * Returns the type name (e.g., "帝王型ボス")
 */
export function calculatePoliticianMBTI(
  transactions: Transaction[],
  summary: Summary,
  politician: PoliticianInfo
): string {
  const result = calculatePoliticianMBTIDetails(transactions, summary, politician);
  return result.typeName;
}

/**
 * Calculate detailed MBTI information including dimensions and description
 */
export function calculatePoliticianMBTIDetails(
  transactions: Transaction[],
  summary: Summary,
  politician: PoliticianInfo
): {
  typeName: string;
  typeCode: string;
  description: string;
  dimensions: {
    R_P: { value: 'R' | 'P'; label: string; percentage: number };
    X_M: { value: 'X' | 'M'; label: string; percentage: number };
    L_F: { value: 'L' | 'F'; label: string; percentage: number };
    E_N: { value: 'E' | 'N'; label: string; percentage: number };
    S_T: { value: 'S' | 'T'; label: string; percentage: number };
  };
} {
  const metrics = calculatePoliticianMetrics(transactions, summary, politician);

  // R/P: 集金力 (年間収入総額) - 2億円以上=R (Rich) / 未満=P (Poor)
  // Match radar chart normalization: (value - 20M) / (400M - 20M) * 100
  const R_P = metrics.shukinryokuValue >= 200000000 ? 'R' : 'P';
  const R_P_percentage = metrics.shukinryokuNormalized;

  // X/M: 美食力 (高級レストラン・ホテルでの会食・懇親会費) - 300万円以上=X (Extravagant) / 未満=M (Modest)
  // Match radar chart normalization: (value / 6M) * 100
  const X_M = metrics.bishokuryokuValue >= 3000000 ? 'X' : 'M';
  const X_M_percentage = metrics.bishokuryokuNormalized;

  // L/F: 派閥力 (他政治団体への交付金など) - 100万円以上=L (Leader) / 未満=F (Follower)
  // Match radar chart normalization: (value / 10M) * 100
  const L_F = metrics.habatsuryokuValue >= 1000000 ? 'L' : 'F';
  const L_F_percentage = metrics.habatsuryokuNormalized;

  // E/N: 当選力 (当選回数) - 5回以上=E (Experienced) / 未満=N (Newcomer)
  // Match radar chart normalization: ((value - 1) / (11 - 1)) * 100
  const E_N = metrics.tousenryokuValue >= 5 ? 'E' : 'N';
  const E_N_percentage = metrics.tousenryokuNormalized;

  // S/T: 世襲力 (家系内の政治家人数) - 2代目以上=S (Successor) / 1代目=T (Trailblazer)
  // Match radar chart normalization: (value / 4) * 100
  // 1代目(非世襲)=25%, 2代目=50%, 3代目=75%, 4代目=100%
  const S_T = metrics.seshuuryokuValue >= 2 ? 'S' : 'T';
  const S_T_percentage = metrics.seshuuryokuNormalized;

  const typeCode = `${R_P}-${X_M}-${L_F}-${E_N}`;

  // Map type codes to type names and descriptions
  const typeInfoMap: { [key: string]: { name: string; description: string } } = {
    'R-X-L-E': {
      name: '帝王型ボス',
      description: '巨額の資金を動かし、派閥を率いるベテラン。豪華な会食と圧倒的な支配力で政界を掌握する。',
    },
    'R-X-L-N': {
      name: 'カリスマ若手ボス',
      description: '派手な資金使いと発信力で注目を集める新星。野心と勢いで組織を引っ張る。',
    },
    'R-X-F-E': {
      name: '開放的エリート',
      description: '豊富な資金と華やかさを持ちながら、組織に縛られず個人の力で動く外交型ベテラン。',
    },
    'R-X-F-N': {
      name: 'ムーブメント便乗者',
      description: '時代の空気を読み、流れに乗って存在感を高めるタイプ。派閥を率いるよりも、話題性と機動力で注目を集める。',
    },
    'R-M-L-E': {
      name: '現実派エリート',
      description: '豊富な資金とリーダー力を持ちながら、支出は節度ある。堅実で信頼される長老型。',
    },
    'R-M-L-N': {
      name: '期待の実力派参謀',
      description: '若手ながら冷静で分析的。堅実な資金運用で信頼を積み重ねる次世代リーダー候補。',
    },
    'R-M-F-E': {
      name: '理想的リーダー',
      description: '経済的に安定しつつ、誠実で透明な運営を行う。改革志向と信頼性を兼ね備えた存在。',
    },
    'R-M-F-N': {
      name: '静かな実力者',
      description: '派手さはないが堅実な実務で成果を出す。裏方としての信頼感が厚いタイプ。',
    },
    'P-X-L-E': {
      name: '情熱型リーダー',
      description: '資金は少ないが、熱意と人望でチームを率いるベテラン。華やかな支出で存在感を保ち、情で動くタイプ。',
    },
    'P-X-L-N': {
      name: '期待の実力派参謀',
      description: '活動資金は少ないが、柔軟な発想と機動力で場を動かす戦略家。',
    },
    'P-X-F-E': {
      name: '庶民派ポピュリスト',
      description: 'お金はなくても社交的で、イベントや交流で民意をつかむタイプ。',
    },
    'P-X-F-N': {
      name: '市民派インフルエンサー',
      description: '発信力と共感力で市民に支持される。SNSや街頭で存在感を放つタイプ。',
    },
    'P-M-L-E': {
      name: '草の根長老',
      description: '資金規模は小さいが、長年の信頼で地域や仲間を支える。穏やかで誠実な長老。',
    },
    'P-M-L-N': {
      name: '実直な参謀',
      description: '地道に誠実。派手さはないが調整力に優れ、裏方として確かな支えとなる。',
    },
    'P-M-F-E': {
      name: '清貧リーダー',
      description: '少ない資金でも清廉な政治を貫く。理念と誠実さで支持を得る。',
    },
    'P-M-F-N': {
      name: '市民派新人',
      description: '経済力や人脈よりも信念で勝負する純粋な挑戦者。',
    },
  };

  const typeInfo = typeInfoMap[typeCode] || { name: '不明', description: '' };

  return {
    typeName: typeInfo.name,
    typeCode,
    description: typeInfo.description,
    dimensions: {
      R_P: { value: R_P as 'R' | 'P', label: '集金力', percentage: R_P_percentage },
      X_M: { value: X_M as 'X' | 'M', label: '美食力', percentage: X_M_percentage },
      L_F: { value: L_F as 'L' | 'F', label: '派閥力', percentage: L_F_percentage },
      E_N: { value: E_N as 'E' | 'N', label: '当選力', percentage: E_N_percentage },
      S_T: { value: S_T as 'S' | 'T', label: '世襲力', percentage: S_T_percentage },
    },
  };
}
