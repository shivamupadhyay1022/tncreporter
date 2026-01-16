// ConsentLens AI Engine - Deterministic Legal Text Analysis
// This engine uses rule-based deterministic analysis to avoid AI hallucinations
// and provide explainable, reproducible results

class ConsentLensAIEngine {
  constructor() {
    this.setupCategories();
    this.setupPatterns();
    this.setupBenchmarks();
  }

  setupCategories() {
    // Risk categories with weights (must sum to 1.0)
    this.categories = {
      DATA_SHARING_RESALE: {
        name: 'Data Sharing & Resale',
        weight: 0.18,
        description: 'Clauses allowing sharing or selling user data to third parties',
        irreversible: false
      },
      FORCED_ARBITRATION: {
        name: 'Forced Arbitration',
        weight: 0.16,
        description: 'Mandatory arbitration clauses preventing court access',
        irreversible: true
      },
      CLASS_ACTION_WAIVER: {
        name: 'Class Action Waiver',
        weight: 0.14,
        description: 'Prohibitions on participating in class action lawsuits',
        irreversible: true
      },
      SURVEILLANCE_TRACKING: {
        name: 'Surveillance & Tracking',
        weight: 0.15,
        description: 'Extensive monitoring and tracking of user behavior',
        irreversible: false
      },
      UNILATERAL_MODIFICATION: {
        name: 'Unilateral Policy Modification',
        weight: 0.12,
        description: 'Company can change terms without consent',
        irreversible: false
      },
      ACCOUNT_TERMINATION: {
        name: 'Account Termination Rights',
        weight: 0.08,
        description: 'Broad rights to suspend or terminate accounts',
        irreversible: false
      },
      LIABILITY_LIMITATION: {
        name: 'Liability Limitation',
        weight: 0.09,
        description: 'Limiting company liability for damages',
        irreversible: false
      },
      INDEFINITE_RETENTION: {
        name: 'Indefinite Data Retention',
        weight: 0.08,
        description: 'Keeping user data indefinitely without deletion options',
        irreversible: false
      }
    };
  }

  setupPatterns() {
    // Deterministic pattern matching for each category
    // These patterns are based on legal language analysis and provide
    // transparent, explainable matches without AI hallucination risks
    
    this.patterns = {
      DATA_SHARING_RESALE: {
        keywords: [
          'share your data with third parties',
          'sell your personal information',
          'data brokers',
          'affiliate sharing',
          'partner companies',
          'third[-\s]party advertisers',
          'cross[-\s]device tracking',
          'data resellers'
        ],
        severity: 0.85,
        indicators: ['sell', 'resell', 'share with third', 'data broker', 'affiliate']
      },
      
      FORCED_ARBITRATION: {
        keywords: [
          'mandatory arbitration',
          'binding arbitration',
          'waive right to jury trial',
          'arbitrate any dispute',
          'no right to sue in court',
          'individual arbitration only'
        ],
        severity: 0.95,
        indicators: ['arbitration', 'waive', 'jury trial', 'dispute resolution']
      },
      
      CLASS_ACTION_WAIVER: {
        keywords: [
          'waive right to class action',
          'no class[-\s]action lawsuits',
          'individual claims only',
          'cannot participate in class action',
          'class action waiver'
        ],
        severity: 0.90,
        indicators: ['class action', 'collective action', 'group lawsuit']
      },
      
      SURVEILLANCE_TRACKING: {
        keywords: [
          'track your location',
          'monitor your activity',
          'collect usage data',
          'behavioral tracking',
          'cross[-\s]site tracking',
          'fingerprinting',
          'device identifiers'
        ],
        severity: 0.75,
        indicators: ['track', 'monitor', 'collect data', 'fingerprint', 'identifiers']
      },
      
      UNILATERAL_MODIFICATION: {
        keywords: [
          'reserve the right to modify',
          'change these terms at any time',
          'update without notice',
          'modifications effective immediately',
          'continued use constitutes acceptance'
        ],
        severity: 0.70,
        indicators: ['modify', 'change', 'update', 'without notice', 'reserve right']
      },
      
      ACCOUNT_TERMINATION: {
        keywords: [
          'terminate your account at any time',
          'suspend without notice',
          'refuse service at our discretion',
          'disable access immediately',
          'cancel for any reason'
        ],
        severity: 0.65,
        indicators: ['terminate', 'suspend', 'disable', 'refuse service', 'without notice']
      },
      
      LIABILITY_LIMITATION: {
        keywords: [
          'not liable for any damages',
          'maximum liability limited to',
          'exclude consequential damages',
          'as[-\s]is without warranty',
          'disclaim all warranties'
        ],
        severity: 0.60,
        indicators: ['not liable', 'limited liability', 'exclude damages', 'warranty disclaimer']
      },
      
      INDEFINITE_RETENTION: {
        keywords: [
          'retain your data indefinitely',
          'no obligation to delete',
          'store as long as necessary',
          'keep records forever',
          'indefinite storage period'
        ],
        severity: 0.70,
        indicators: ['retain indefinitely', 'no obligation to delete', 'store forever', 'indefinite period']
      }
    };
  }

  setupBenchmarks() {
    // Industry benchmarks for comparative analysis
    this.benchmarks = {
      'SOCIAL_MEDIA': {
        name: 'Social Media Platforms',
        average_risk_score: 65,
        examples: ['Facebook', 'Twitter', 'Instagram', 'TikTok']
      },
      'E_COMMERCE': {
        name: 'E-commerce Platforms', 
        average_risk_score: 45,
        examples: ['Amazon', 'eBay', 'Shopify', 'Etsy']
      },
      'FINANCIAL': {
        name: 'Financial Services',
        average_risk_score: 55,
        examples: ['PayPal', 'Banks', 'Investment platforms']
      },
      'TECHNOLOGY': {
        name: 'Technology Companies',
        average_risk_score: 50,
        examples: ['Google', 'Microsoft', 'Apple', 'Software services']
      }
    };
  }

  async analyze(text, options = {}) {
    const { url, language = 'en', user_preferences = {} } = options;
    
    // Preprocess text
    const normalizedText = this.preprocessText(text);
    
    // Extract clauses
    const clauses = this.extractClauses(normalizedText);
    
    // Analyze each clause
    const clauseAnalyses = clauses.map(clause => this.analyzeClause(clause));
    
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(clauseAnalyses, user_preferences);
    
    // Determine risk level
    const riskLevel = this.getRiskLevel(riskScore);
    
    // Generate red flag report
    const redFlags = this.generateRedFlags(clauseAnalyses);
    
    // Calculate category scores
    const categories = this.calculateCategoryScores(clauseAnalyses);
    
    // Generate benchmark comparison
    const benchmark = this.generateBenchmark(url, riskScore);
    
    return {
      risk_score: riskScore,
      risk_level: riskLevel,
      red_flags: redFlags,
      categories: categories,
      benchmark: benchmark,
      clauses_analyzed: clauseAnalyses.length,
      confidence: this.calculateConfidence(clauseAnalyses),
      metadata: {
        url,
        language,
        text_length: text.length,
        deterministic_analysis: true
      }
    };
  }

  preprocessText(text) {
    // Normalize whitespace and common encoding issues
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .trim();
  }

  extractClauses(text) {
    // Simple clause segmentation based on sentence boundaries
    // More sophisticated segmentation could be added here
    const sentences = text.split(/[.!?]+\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 20); // Filter out very short fragments
    
    return sentences;
  }

  analyzeClause(clause) {
    const matches = [];
    
    // Check each category for matches
    for (const [categoryKey, category] of Object.entries(this.categories)) {
      const pattern = this.patterns[categoryKey];
      const match = this.findPatternMatch(clause, pattern);
      
      if (match) {
        matches.push({
          category: categoryKey,
          category_name: category.name,
          severity: match.severity,
          confidence: match.confidence,
          matched_text: clause,
          matched_keywords: match.keywords,
          irreversible: category.irreversible,
          explanation: this.generateExplanation(categoryKey, clause, match)
        });
      }
    }
    
    return {
      text: clause,
      matches: matches,
      is_risky: matches.length > 0,
      highest_risk: matches.length > 0 ? Math.max(...matches.map(m => m.severity)) : 0
    };
  }

  findPatternMatch(clause, pattern) {
    const lowerClause = clause.toLowerCase();
    const matchedKeywords = [];
    let totalMatches = 0;
    
    // Check each keyword pattern
    for (const keyword of pattern.keywords) {
      const regex = new RegExp(keyword.replace(/[-\s]/g, '[-\\s]'), 'i');
      if (regex.test(lowerClause)) {
        matchedKeywords.push(keyword);
        totalMatches++;
      }
    }
    
    if (totalMatches === 0) {
      return null;
    }
    
    // Calculate confidence based on number and strength of matches
    const confidence = Math.min(0.95, 0.6 + (totalMatches * 0.15));
    
    return {
      severity: pattern.severity,
      confidence: confidence,
      keywords: matchedKeywords
    };
  }

  generateExplanation(categoryKey, clause, match) {
    const explanations = {
      DATA_SHARING_RESALE: `This clause indicates your personal data may be shared with or sold to third parties, including advertisers, data brokers, or affiliate companies.`,
      FORCED_ARBITRATION: `You would be required to resolve disputes through private arbitration rather than in court, forfeiting your right to a jury trial.`,
      CLASS_ACTION_WAIVER: `You cannot join class-action lawsuits against the company, limiting your ability to seek justice collectively with other users.`,
      SURVEILLANCE_TRACKING: `The company monitors and tracks your activities, location, or behavior, potentially across multiple devices and platforms.`,
      UNILATERAL_MODIFICATION: `The company can change these terms at any time without notice, and your continued use constitutes automatic acceptance.`,
      ACCOUNT_TERMINATION: `The company can suspend or terminate your account at their discretion, potentially without notice or explanation.`,
      LIABILITY_LIMITATION: `The company's liability for damages is limited, potentially leaving you without recourse if their service causes you harm.`,
      INDEFINITE_RETENTION: `Your data may be kept indefinitely even after you delete your account or stop using the service.`
    };
    
    return explanations[categoryKey] || 'This clause presents a potential risk to your rights or privacy.';
  }

  calculateRiskScore(clauseAnalyses, user_preferences = {}) {
    if (clauseAnalyses.length === 0) return 0;
    
    const riskyClauses = clauseAnalyses.filter(c => c.is_risky);
    if (riskyClauses.length === 0) return 0;
    
    // Calculate weighted score based on matches
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const clause of riskyClauses) {
      for (const match of clause.matches) {
        const categoryWeight = this.categories[match.category].weight;
        const userWeight = this.getUserAdjustedWeight(match.category, user_preferences);
        
        const combinedWeight = categoryWeight * userWeight;
        const weightedScore = match.severity * combinedWeight;
        
        totalWeightedScore += weightedScore;
        totalWeight += combinedWeight;
      }
    }
    
    if (totalWeight === 0) return 0;
    
    // Normalize to 0-100 scale
    const rawScore = (totalWeightedScore / totalWeight) * 100;
    
    // Apply linguistic strength modifiers
    const text = clauseAnalyses.map(c => c.text).join(' ');
    const finalScore = this.applyLinguisticModifiers(rawScore, text);
    
    return Math.min(100, Math.max(0, finalScore));
  }

  getUserAdjustedWeight(category, user_preferences) {
    const { privacy_weight = 0.4, legal_rights_weight = 0.4, convenience_weight = 0.2 } = user_preferences;
    
    // Map categories to user preference dimensions
    const categoryMappings = {
      DATA_SHARING_RESALE: privacy_weight,
      SURVEILLANCE_TRACKING: privacy_weight,
      INDEFINITE_RETENTION: privacy_weight,
      FORCED_ARBITRATION: legal_rights_weight,
      CLASS_ACTION_WAIVER: legal_rights_weight,
      LIABILITY_LIMITATION: legal_rights_weight,
      UNILATERAL_MODIFICATION: convenience_weight,
      ACCOUNT_TERMINATION: convenience_weight
    };
    
    return categoryMappings[category] || 1.0;
  }

  applyLinguisticModifiers(score, text) {
    const lowerText = text.toLowerCase();
    let modifier = 1.0;
    
    // Strong indicators increase score
    if (/(?:will|must|shall|required to)/.test(lowerText)) {
      modifier += 0.1;
    }
    
    if (/unconditional|absolute|irrevocable/.test(lowerText)) {
      modifier += 0.15;
    }
    
    // Weak indicators decrease score  
    if (/(?:may|might|could|optional|at your discretion)/.test(lowerText)) {
      modifier -= 0.1;
    }
    
    return score * modifier;
  }

  getRiskLevel(score) {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  generateRedFlags(clauseAnalyses) {
    const redFlags = [];
    
    // Sort by severity and take top 3
    const allMatches = [];
    
    for (const clause of clauseAnalyses) {
      for (const match of clause.matches) {
        allMatches.push({
          ...match,
          clause_text: clause.text
        });
      }
    }
    
    // Sort by severity and confidence
    allMatches.sort((a, b) => {
      const scoreA = a.severity * a.confidence;
      const scoreB = b.severity * b.confidence;
      return scoreB - scoreA;
    });
    
    // Take top 3 unique categories
    const usedCategories = new Set();
    for (const match of allMatches) {
      if (!usedCategories.has(match.category) && redFlags.length < 3) {
        usedCategories.add(match.category);
        
        redFlags.push({
          text: match.matched_text,
          explanation: match.explanation,
          implication: this.generateImplication(match.category),
          irreversible: match.irreversible,
          confidence: match.confidence,
          category: match.category,
          category_name: match.category_name
        });
      }
    }
    
    return redFlags;
  }

  generateImplication(category) {
    const implications = {
      DATA_SHARING_RESALE: 'Your personal data could be sold to or shared with unknown third parties for profit.',
      FORCED_ARBITRATION: 'You permanently give up your right to sue this company in court, even if they seriously harm you.',
      CLASS_ACTION_WAIVER: 'You cannot join other users in class-action lawsuits, limiting your legal recourse.',
      SURVEILLANCE_TRACKING: 'The company may extensively monitor your activities across devices and platforms.',
      UNILATERAL_MODIFICATION: 'The company can change the rules at any time without asking for your permission.',
      ACCOUNT_TERMINATION: 'Your account could be deleted at any time without warning or explanation.',
      LIABILITY_LIMITATION: 'The company limits what they have to pay if their mistakes cause you harm.',
      INDEFINITE_RETENTION: 'Your data may be kept forever, even after you delete your account.'
    };
    
    return implications[category] || 'This clause may negatively impact your rights or privacy.';
  }

  calculateCategoryScores(clauseAnalyses) {
    const categoryScores = {};
    
    // Initialize scores
    for (const [key, category] of Object.entries(this.categories)) {
      categoryScores[key] = {
        name: category.name,
        severity: 0,
        clause_count: 0
      };
    }
    
    // Accumulate scores
    for (const clause of clauseAnalyses) {
      for (const match of clause.matches) {
        const categoryScore = categoryScores[match.category];
        categoryScore.severity += match.severity;
        categoryScore.clause_count++;
      }
    }
    
    // Normalize and convert to array
    return Object.entries(categoryScores)
      .filter(([_, score]) => score.clause_count > 0)
      .map(([key, score]) => ({
        key,
        name: score.name,
        severity: (score.severity / score.clause_count) * 100
      }));
  }

  generateBenchmark(url, riskScore) {
    // Determine category based on domain
    const domain = url ? new URL(url).hostname.toLowerCase() : '';
    let category = 'TECHNOLOGY';
    
    if (domain.includes('facebook') || domain.includes('twitter') || 
        domain.includes('instagram') || domain.includes('tiktok')) {
      category = 'SOCIAL_MEDIA';
    } else if (domain.includes('amazon') || domain.includes('ebay') || 
               domain.includes('shop') || domain.includes('buy')) {
      category = 'E_COMMERCE';
    } else if (domain.includes('bank') || domain.includes('finance') || 
               domain.includes('paypal') || domain.includes('invest')) {
      category = 'FINANCIAL';
    }
    
    const benchmark = this.benchmarks[category];
    const percentage = Math.round(((riskScore - benchmark.average_risk_score) / benchmark.average_risk_score) * 100);
    
    return {
      category: benchmark.name,
      percentage: percentage,
      average_score: benchmark.average_risk_score,
      comparison: percentage > 0 ? 'worse' : 'better'
    };
  }

  calculateConfidence(clauseAnalyses) {
    if (clauseAnalyses.length === 0) return 1.0;
    
    const riskyClauses = clauseAnalyses.filter(c => c.is_risky);
    if (riskyClauses.length === 0) return 1.0;
    
    const confidences = [];
    for (const clause of riskyClauses) {
      for (const match of clause.matches) {
        confidences.push(match.confidence);
      }
    }
    
    return confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length 
      : 1.0;
  }

  getCategories() {
    return Object.entries(this.categories).map(([key, category]) => ({
      key,
      name: category.name,
      description: category.description,
      weight: category.weight,
      irreversible: category.irreversible
    }));
  }

  getFallbackAnalysis() {
    return {
      risk_score: 0,
      risk_level: 'UNKNOWN',
      red_flags: [
        {
          text: 'Unable to analyze terms',
          explanation: 'AI service is temporarily unavailable',
          implication: 'Manual review recommended',
          irreversible: false,
          confidence: 1.0
        }
      ],
      categories: [],
      confidence: 1.0,
      fallback: true
    };
  }
}

module.exports = { ConsentLensAIEngine };