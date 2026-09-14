import re
from typing import List, Dict, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer

# Key risk dictionary mapping regex patterns to risk category and severity weight
RISK_PATTERNS = [
    (r"\b(land acquisition|row|right of way|compensation dispute|eviction)\b", "Land & ROW Dispute", 12.0),
    (r"\b(court|stay order|litigation|legal dispute|arbitration|nct|tribunal)\b", "Legal & Judicial Injunction", 15.0),
    (r"\b(fund|payment|budget|financial shortage|liquidity|arrears|disbursement)\b", "Fund Crunch & Payment Delay", 14.0),
    (r"\b(contractor|vendor|subcontractor|labor|manpower|strike|non-performance)\b", "Contractor & Labor Default", 10.0),
    (r"\b(material|steel|cement|bitumen|shortage|supply chain|equipment)\b", "Material & Resource Bottleneck", 8.0),
    (r"\b(environmental|forest|clearance|ec|wildlife|coastal|pollution)\b", "Environmental & Forest Clearance", 10.0),
    (r"\b(monsoon|flood|heavy rain|cyclone|weather|flooding|inundation)\b", "Adverse Weather Disruption", 6.0),
    (r"\b(design|revision|dpr|technical error|re-alignment|scope change)\b", "Technical Scope Revision", 7.0),
    (r"\b(delay|slow progress|sluggish|behind schedule|halted|stalled|stopped)\b", "Schedule Drag Warning", 9.0),
]

def analyze_project_remarks(remarks_text: str) -> Tuple[List[str], List[str], float, float]:
    """
    Analyzes project remarks text using Regex pattern matching & TF-IDF keyword extraction.
    Returns:
      - extracted_keywords: top 5-7 TF-IDF terms
      - detected_risk_flags: list of identified risk category labels
      - sentiment_score: -1.0 (very negative) to +1.0 (positive)
      - risk_weight_addition: total extra risk score penalty points (0-25)
    """
    if not remarks_text or len(remarks_text.strip()) == 0:
        return [], [], 0.0, 0.0

    text_lower = remarks_text.lower()
    
    # 1. Regex Risk Flag Detection
    detected_risk_flags = []
    total_risk_addition = 0.0

    for pattern, flag_label, weight in RISK_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            detected_risk_flags.append(flag_label)
            total_risk_addition += weight

    # Cap risk addition to max 25 points
    risk_weight_addition = min(total_risk_addition, 25.0)

    # 2. TF-IDF Keyword Extraction
    # Splitting into sentence/chunks to compute TF-IDF
    chunks = [c.strip() for c in re.split(r'[.;!\n]', remarks_text) if len(c.strip()) > 3]
    if not chunks:
        chunks = [remarks_text]

    extracted_keywords = []
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=10, ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform(chunks)
        feature_names = vectorizer.get_feature_names_out()
        
        # Get mean score per word across chunks
        mean_scores = tfidf_matrix.mean(axis=0).A1
        scored_words = sorted(zip(feature_names, mean_scores), key=lambda x: x[1], reverse=True)
        extracted_keywords = [word for word, score in scored_words[:7] if len(word) > 2]
    except Exception:
        # Simple fallback tokenization if TF-IDF fails on very short text
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text_lower)
        extracted_keywords = list(set(words))[:6]

    # 3. Sentiment Calculation (Heuristic based on risk flags & keyword density)
    negative_words_count = len(detected_risk_flags) * 2 + sum(1 for w in ['delay', 'overrun', 'halted', 'slow', 'dispute', 'penalty', 'crisis'] if w in text_lower)
    positive_words_count = sum(1 for w in ['completed', 'on track', 'achieved', 'ahead', 'fast', 'approved', 'smooth'] if w in text_lower)
    
    if negative_words_count + positive_words_count == 0:
        sentiment_score = 0.0
    else:
        sentiment_score = (positive_words_count - negative_words_count) / (positive_words_count + negative_words_count)
        sentiment_score = max(-1.0, min(1.0, sentiment_score))

    return extracted_keywords, detected_risk_flags, round(sentiment_score, 2), round(risk_weight_addition, 1)
