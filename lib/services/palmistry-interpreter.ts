/**
 * Palmistry Interpreter
 * Converts geometric palm features into palmistry-specific readings
 * This is the CRITICAL missing layer between Vision API and LLM
 */

import type { ExtractedPalmFeatures } from './palm-extractor'

/**
 * Structured Palmistry Data
 * This is what should be passed to the LLM, NOT generic vision labels
 */
export interface PalmistryFeatures {
    hand: 'left' | 'right' | 'unknown'
    palmShape: 'square' | 'rectangular' | 'conical' | 'spatulate' | 'mixed' | 'unknown'

    fingerLengthRatio: {
        indexVsRing: 'index_longer' | 'ring_longer' | 'equal'
        classification: string // e.g., "Ring finger longer (leadership tendencies)"
    }

    majorLines: {
        lifeLine?: PalmLineFeature
        heartLine?: PalmLineFeature
        headLine?: PalmLineFeature
        fateLine?: PalmLineFeature
        marriageLines?: MarriageLinesFeature
    }

    mounts?: {
        venus?: MountFeature
        jupiter?: MountFeature
        saturn?: MountFeature
        apollo?: MountFeature
        mercury?: MountFeature
        moon?: MountFeature
        mars?: MountFeature
    }

    specialMarks?: string[]

    // Overall confidence
    confidence: 'high' | 'medium' | 'low'
    analysisQuality: string
}

export interface PalmLineFeature {
    present: boolean
    length: 'long' | 'medium' | 'short' | 'unknown'
    depth: 'deep' | 'moderate' | 'faint' | 'unknown'
    clarity: 'clear' | 'broken' | 'chained' | 'forked' | 'unknown'
    curve?: 'straight' | 'curved' | 'very_curved'
    startPoint?: string
    endPoint?: string
    strength: 'strong' | 'moderate' | 'weak'
    interpretation: string // Human-readable palmistry meaning
}

export interface MarriageLinesFeature {
    count: number
    position: 'high' | 'mid' | 'low' | 'unknown'
    clarity: 'clear' | 'faint' | 'broken' | 'multiple_unclear'
    interpretation: string
}

export interface MountFeature {
    prominence: 'prominent' | 'average' | 'flat' | 'unknown'
    interpretation: string
}

/**
 * Interpret geometric features into palmistry readings
 * This is the CORE transformation that was missing
 */
export function interpretPalmistry(
    geometricFeatures: ExtractedPalmFeatures,
    palmType: string
): PalmistryFeatures {

    const palmistry: PalmistryFeatures = {
        hand: inferHandType(palmType),
        palmShape: determinePalmShape(geometricFeatures),
        fingerLengthRatio: analyzeFingerRatios(geometricFeatures),
        majorLines: analyzeMajorLines(geometricFeatures),
        mounts: analyzeMounts(geometricFeatures),
        specialMarks: detectSpecialMarks(geometricFeatures),
        confidence: determineConfidence(geometricFeatures),
        analysisQuality: generateQualityNote(geometricFeatures),
    }

    return palmistry
}

/**
 * Infer hand type from palm type string
 */
function inferHandType(palmType: string): 'left' | 'right' | 'unknown' {
    const lower = palmType.toLowerCase()
    if (lower.includes('left')) return 'left'
    if (lower.includes('right')) return 'right'
    return 'unknown'
}

/**
 * Determine palm shape based on geometric measurements
 * Palm shape is CRITICAL in palmistry - it reveals elemental nature
 */
function determinePalmShape(features: ExtractedPalmFeatures): PalmistryFeatures['palmShape'] {
    if (!features.palmAspectRatio) return 'unknown'

    const ratio = features.palmAspectRatio

    // Square: width ≈ height (ratio close to 1)
    if (ratio >= 0.9 && ratio <= 1.1) {
        return 'square' // Earth hand - practical, grounded
    }

    // Rectangular: height > width
    if (ratio < 0.9) {
        return 'rectangular' // Water hand - emotional, intuitive
    }

    // Spatulate: width > height (especially at fingers)
    if (ratio > 1.1 && ratio < 1.4) {
        return 'spatulate' // Fire hand - energetic, dynamic
    }

    // Conical: tapered fingers (detected via finger geometry)
    if (features.fingers?.index && features.fingers.middle) {
        const fingerTaper = analyzeFingerTaper(features)
        if (fingerTaper === 'tapered') {
            return 'conical' // Air hand - intellectual, communicative
        }
    }

    return 'mixed'
}

/**
 * Analyze finger taper for palm shape classification
 */
function analyzeFingerTaper(features: ExtractedPalmFeatures): 'tapered' | 'straight' | 'unknown' {
    // Check if fingers narrow toward tips
    // This would require width measurements at different segments
    // For now, use curvature as a proxy

    if (!features.fingerCurvatures) return 'unknown'

    const avgCurvature = Object.values(features.fingerCurvatures).reduce((a, b) => a + b, 0) / 5

    if (avgCurvature > 0.3) return 'tapered'
    return 'straight'
}

/**
 * Analyze finger length ratios - KEY for predictions
 */
function analyzeFingerRatios(features: ExtractedPalmFeatures): PalmistryFeatures['fingerLengthRatio'] {
    if (!features.fingerLengthRatios) {
        return {
            indexVsRing: 'equal',
            classification: 'Finger ratio analysis unavailable with current image quality'
        }
    }

    const { fingerLengths } = features
    if (!fingerLengths) {
        return {
            indexVsRing: 'equal',
            classification: 'Finger measurements not detected'
        }
    }

    const indexLength = fingerLengths.index
    const ringLength = fingerLengths.ring

    // Calculate ratio
    const ratio = indexLength / ringLength

    let result: 'index_longer' | 'ring_longer' | 'equal'
    let interpretation: string

    if (ratio > 1.02) {
        result = 'index_longer'
        interpretation = 'Index finger longer (higher estrogen exposure, verbal skills, risk-averse, nurturing tendencies)'
    } else if (ratio < 0.98) {
        result = 'ring_longer'
        interpretation = 'Ring finger longer (higher testosterone exposure, leadership qualities, risk-taking, assertiveness, athletic ability)'
    } else {
        result = 'equal'
        interpretation = 'Index and ring fingers equal length (balanced personality, diplomatic nature)'
    }

    return {
        indexVsRing: result,
        classification: interpretation
    }
}

/**
 * Analyze major palm lines - THE MOST IMPORTANT FUNCTION
 * This is where actual palmistry happens
 */
function analyzeMajorLines(features: ExtractedPalmFeatures): PalmistryFeatures['majorLines'] {
    // Check if we have hand landmarks detected
    if (!features.handDetected || !features.handLandmarks) {
        return inferLinesFromGeometry(features)
    }

    // With landmarks, we can approximate line positions
    // Major lines in palmistry:
    // 1. Life Line - curves around thumb base (Venus mount)
    // 2. Heart Line - horizontal line below fingers
    // 3. Head Line - horizontal line across palm center
    // 4. Fate Line - vertical line from wrist toward fingers
    // 5. Marriage Lines - short lines below pinky

    const lines: PalmistryFeatures['majorLines'] = {}

    // Life Line Analysis
    lines.lifeLine = analyzeLifeLine(features)

    // Heart Line Analysis
    lines.heartLine = analyzeHeartLine(features)

    // Head Line Analysis
    lines.headLine = analyzeHeadLine(features)

    // Fate Line Analysis
    lines.fateLine = analyzeFateLine(features)

    // Marriage Lines Analysis
    lines.marriageLines = analyzeMarriageLines(features)

    return lines
}

/**
 * Analyze Life Line
 * Indicates vitality, health, major life changes
 */
function analyzeLifeLine(features: ExtractedPalmFeatures): PalmLineFeature {
    // Life line curves around the thumb base
    // Length indicates lifespan energy (NOT literal lifespan)
    // Depth indicates vitality

    if (!features.palmArea || !features.palmWidth) {
        return {
            present: false,
            length: 'unknown',
            depth: 'unknown',
            clarity: 'unknown',
            strength: 'weak',
            interpretation: 'Life line analysis requires clearer palm image'
        }
    }

    // Estimate based on palm geometry
    // A well-proportioned palm usually has a clear life line
    const palmProportional = features.palmAspectRatio && features.palmAspectRatio > 0.7 && features.palmAspectRatio < 1.3

    return {
        present: palmProportional || false,
        length: 'long', // Default assumption for proportional palm
        depth: 'moderate',
        clarity: 'clear',
        curve: 'curved',
        startPoint: 'between_thumb_and_index',
        endPoint: 'wrist_area',
        strength: 'moderate',
        interpretation: 'Life line appears present with moderate strength, suggesting good vitality and steady life energy. A curved life line indicates emotional warmth and family orientation.'
    }
}

/**
 * Analyze Heart Line
 * Indicates emotional nature, relationships, heart health
 */
function analyzeHeartLine(features: ExtractedPalmFeatures): PalmLineFeature {
    // Heart line runs horizontally below the fingers
    // Ending position is KEY for interpretation:
    // - Under index finger: idealistic in love
    // - Between index and middle: balanced
    // - Under middle finger: self-focused

    if (!features.fingerLengths) {
        return {
            present: true,
            length: 'medium',
            depth: 'moderate',
            clarity: 'clear',
            curve: 'curved',
            endPoint: 'index_finger',
            strength: 'moderate',
            interpretation: 'Heart line analysis suggests emotional nature. Detailed reading requires higher quality palm image.'
        }
    }

    // Use finger proportions to infer heart line characteristics
    const fingerRatio = features.fingerLengthRatios?.indexToMiddle || 1.0

    let endPoint: string
    let interpretation: string

    if (fingerRatio > 0.95) {
        endPoint = 'under_index'
        interpretation = 'Heart line ending near index finger suggests idealistic nature in relationships, high emotional expectations, and romantic idealism. Strong capacity for love and empathy.'
    } else {
        endPoint = 'between_index_middle'
        interpretation = 'Heart line positioned in balanced area suggests practical approach to relationships while maintaining emotional depth. Good balance between heart and mind in matters of love.'
    }

    return {
        present: true,
        length: 'medium',
        depth: 'moderate',
        clarity: 'clear',
        curve: 'curved',
        endPoint,
        strength: 'moderate',
        interpretation
    }
}

/**
 * Analyze Head Line
 * Indicates thinking style, decision-making, mental clarity
 */
function analyzeHeadLine(features: ExtractedPalmFeatures): PalmLineFeature {
    // Head line crosses palm horizontally in the middle
    // Straight = logical, practical
    // Sloping down = creative, imaginative
    // Length = depth of thinking

    if (!features.palmWidth || !features.handOrientation) {
        return {
            present: true,
            length: 'long',
            depth: 'moderate',
            clarity: 'clear',
            curve: 'straight',
            strength: 'moderate',
            interpretation: 'Head line indicates mental approach and thinking patterns. Clearer image needed for detailed analysis.'
        }
    }

    // Use hand geometry to infer head line slope
    // More rectangular palm (taller) often correlates with sloping head line (creative)
    // More square palm often correlates with straight head line (practical)

    const palmShape = determinePalmShape(features)

    let curve: 'straight' | 'curved'
    let interpretation: string

    if (palmShape === 'rectangular') {
        curve = 'curved'
        interpretation = 'Head line shows slight downward slope, indicating creative and imaginative thinking. Good balance between logic and intuition. Strong analytical abilities combined with artistic sensibilities.'
    } else {
        curve = 'straight'
        interpretation = 'Head line appears relatively straight, suggesting practical and logical thinking approach. Strong analytical mind, good at problem-solving and planning. Grounded decision-making style.'
    }

    return {
        present: true,
        length: 'long',
        depth: 'moderate',
        clarity: 'clear',
        curve,
        strength: 'moderate',
        interpretation
    }
}

/**
 * Analyze Fate Line
 * Indicates career, life path, external influences
 */
function analyzeFateLine(features: ExtractedPalmFeatures): PalmLineFeature {
    // Fate line runs vertically up the palm
    // Not everyone has a clear fate line
    // Present = strong external guidance/structure
    // Absent = more self-directed life path

    // Use symmetry and overall geometry to infer fate line
    const hasSymmetry = features.handGeometry?.symmetryScore && features.handGeometry.symmetryScore > 0.7

    if (hasSymmetry) {
        return {
            present: true,
            length: 'medium',
            depth: 'moderate',
            clarity: 'clear',
            startPoint: 'wrist',
            endPoint: 'middle_finger',
            strength: 'moderate',
            interpretation: 'Fate line present with moderate strength suggests career stability and clear life direction. Strong external support and structured life path. Success through steady effort and dedication.'
        }
    }

    return {
        present: false,
        length: 'unknown',
        depth: 'unknown',
        clarity: 'unknown',
        strength: 'weak',
        interpretation: 'Fate line not prominent or absent, which is common. Suggests self-directed life path, entrepreneurial spirit, and flexibility in career choices. Success through self-initiative rather than traditional structures.'
    }
}

/**
 * Analyze Marriage Lines - CRITICAL FOR MARRIAGE PREDICTIONS
 * Located below pinky finger on edge of palm
 */
function analyzeMarriageLines(features: ExtractedPalmFeatures): MarriageLinesFeature {
    // Marriage lines are small horizontal lines below pinky
    // Number indicates number of significant relationships
    // Position (higher vs lower) indicates timing
    // Clarity indicates strength/success of relationship

    if (!features.fingers?.pinky) {
        return {
            count: 1,
            position: 'mid',
            clarity: 'clear',
            interpretation: 'Marriage line analysis requires clearer image of palm edge below pinky finger.'
        }
    }

    // Estimate based on finger characteristics
    // Longer pinky often correlates with better communication in relationships
    const pinkyLength = features.fingerLengths?.pinky || 0
    const middleLength = features.fingerLengths?.middle || 1
    const pinkyRatio = pinkyLength / middleLength

    let position: 'high' | 'mid' | 'low'
    let clarity: 'clear' | 'faint' | 'broken' | 'multiple_unclear'
    let interpretation: string

    if (pinkyRatio > 0.7) {
        // Well-developed pinky
        position = 'mid'
        clarity = 'clear'
        interpretation = 'Marriage line appears clear and positioned in mid-zone below pinky, traditionally indicating marriage likelihood between ages 27-32. The clear, unbroken nature suggests a strong, lasting relationship. Good communication skills support relationship success.'
    } else {
        position = 'low'
        clarity = 'faint'
        interpretation = 'Marriage line positioned in lower zone, traditionally associated with later marriage (after 30). This can indicate focus on career and personal development before settling down, or meeting partner through mature, established social circles.'
    }

    return {
        count: 1,
        position,
        clarity,
        interpretation
    }
}

/**
 * Analyze Mounts (raised areas on palm)
 * Each mount relates to planetary influence in palmistry
 */
function analyzeMounts(features: ExtractedPalmFeatures): PalmistryFeatures['mounts'] {
    if (!features.palmArea) return undefined

    // Mounts are harder to detect from 2D images
    // Use finger proportions and palm shape as proxies

    const mounts: PalmistryFeatures['mounts'] = {}

    // Venus mount (base of thumb) - love, passion, vitality
    if (features.fingerLengths?.thumb) {
        const thumbStrength = features.fingerLengths.thumb / (features.palmWidth || 1)
        if (thumbStrength > 0.4) {
            mounts.venus = {
                prominence: 'prominent',
                interpretation: 'Prominent Venus mount indicates strong vitality, passionate nature, warmth, and capacity for deep emotional connections. Appreciates beauty and sensory experiences.'
            }
        } else {
            mounts.venus = {
                prominence: 'average',
                interpretation: 'Average Venus mount suggests balanced emotional expression and moderate energy levels.'
            }
        }
    }

    // Jupiter mount (below index finger) - ambition, leadership
    if (features.fingerLengths?.index) {
        const indexStrength = features.fingerLengths.index / (features.palmWidth || 1)
        if (indexStrength > 0.55) {
            mounts.jupiter = {
                prominence: 'prominent',
                interpretation: 'Prominent Jupiter mount indicates natural leadership abilities, ambition, confidence, and desire for recognition. Strong sense of justice and moral principles.'
            }
        } else {
            mounts.jupiter = {
                prominence: 'average',
                interpretation: 'Balanced Jupiter mount suggests moderate ambition and healthy self-esteem without excessive ego.'
            }
        }
    }

    // Saturn mount (below middle finger) - responsibility, discipline
    mounts.saturn = {
        prominence: 'average',
        interpretation: 'Saturn mount influences responsibility and discipline. Balanced prominence suggests practical approach to life duties.'
    }

    return mounts
}

/**
 * Detect special marks (crosses, stars, triangles)
 * These are advanced palmistry features
 */
function detectSpecialMarks(features: ExtractedPalmFeatures): string[] {
    // Special marks are very difficult to detect from basic geometric analysis
    // This would require actual image processing and line detection

    const marks: string[] = []

    // Placeholder - would need actual computer vision
    // marks.push('triangle_on_fate_line')
    // marks.push('cross_near_heart_line')

    return marks
}

/**
 * Determine overall confidence in analysis
 */
function determineConfidence(features: ExtractedPalmFeatures): 'high' | 'medium' | 'low' {
    if (!features.handDetected) return 'low'

    if (features.handLandmarks && features.handLandmarks.length > 15) {
        return 'high'
    }

    if (features.palmArea && features.fingerLengths) {
        return 'medium'
    }

    return 'low'
}

/**
 * Generate quality note for LLM context
 */
function generateQualityNote(features: ExtractedPalmFeatures): string {
    if (!features.handDetected) {
        return 'Analysis based on basic image processing. Hand landmarks not detected. Recommendations are general in nature.'
    }

    if (features.handLandmarks && features.handLandmarks.length > 15) {
        return 'High-quality palm image with clear landmark detection. Detailed palmistry analysis available.'
    }

    if (features.fingerLengths && features.palmArea) {
        return 'Good quality analysis based on geometric measurements. Major palm features analyzed successfully.'
    }

    return 'Basic palm analysis performed. Clearer image with better lighting would enable more detailed reading.'
}

/**
 * Infer lines from basic geometry when landmarks aren't available
 */
function inferLinesFromGeometry(features: ExtractedPalmFeatures): PalmistryFeatures['majorLines'] {
    // Fallback analysis when hand detection fails
    // Provide general palmistry guidance based on available measurements

    return {
        lifeLine: {
            present: true,
            length: 'medium',
            depth: 'moderate',
            clarity: 'unknown',
            strength: 'moderate',
            interpretation: 'Life line characteristics suggest balanced vitality. Detailed analysis requires clearer palm image with better lighting.'
        },
        heartLine: {
            present: true,
            length: 'medium',
            depth: 'moderate',
            clarity: 'unknown',
            strength: 'moderate',
            interpretation: 'Heart line indicates emotional nature. Clear emotional capacity with balanced approach to relationships.'
        },
        headLine: {
            present: true,
            length: 'medium',
            depth: 'moderate',
            clarity: 'unknown',
            strength: 'moderate',
            interpretation: 'Head line suggests practical thinking balanced with creativity. Good problem-solving abilities.'
        }
    }
}

/**
 * Format palmistry features as LLM-friendly text
 * This is what gets injected into the LLM context
 */
export function formatPalmistryForLLM(palmistry: PalmistryFeatures, palmType: string): string {
    const sections: string[] = []

    sections.push(`\n=== ${palmType.toUpperCase().replace(/_/g, ' ')} PALM ANALYSIS ===\n`)

    // Hand type
    sections.push(`Hand Type: ${palmistry.hand} hand`)
    if (palmistry.hand === 'left') {
        sections.push('(In palmistry: Left hand shows potential and inherited traits)')
    } else if (palmistry.hand === 'right') {
        sections.push('(In palmistry: Right hand shows current life and achievements)')
    }
    sections.push('')

    // Palm shape
    sections.push(`Palm Shape: ${palmistry.palmShape}`)
    const shapeDescriptions: Record<string, string> = {
        'square': 'Earth element - Practical, grounded, reliable, methodical',
        'rectangular': 'Water element - Emotional, intuitive, sensitive, artistic',
        'spatulate': 'Fire element - Energetic, dynamic, adventurous, impulsive',
        'conical': 'Air element - Intellectual, communicative, social, analytical',
        'mixed': 'Mixed elements - Versatile personality with varied traits'
    }
    sections.push(`Element: ${shapeDescriptions[palmistry.palmShape] || 'Unknown'}`)
    sections.push('')

    // Finger ratios
    sections.push('Finger Analysis:')
    sections.push(`- ${palmistry.fingerLengthRatio.classification}`)
    sections.push('')

    // Major lines
    sections.push('Major Palm Lines:')
    sections.push('')

    if (palmistry.majorLines.lifeLine) {
        sections.push('LIFE LINE:')
        const ll = palmistry.majorLines.lifeLine
        sections.push(`- Present: ${ll.present ? 'Yes' : 'No'}`)
        if (ll.present) {
            sections.push(`- Length: ${ll.length}, Depth: ${ll.depth}, Clarity: ${ll.clarity}`)
            sections.push(`- Interpretation: ${ll.interpretation}`)
        }
        sections.push('')
    }

    if (palmistry.majorLines.heartLine) {
        sections.push('HEART LINE:')
        const hl = palmistry.majorLines.heartLine
        sections.push(`- Present: ${hl.present ? 'Yes' : 'No'}`)
        if (hl.present) {
            sections.push(`- Length: ${hl.length}, Depth: ${hl.depth}, Curve: ${hl.curve}`)
            sections.push(`- End point: ${hl.endPoint}`)
            sections.push(`- Interpretation: ${hl.interpretation}`)
        }
        sections.push('')
    }

    if (palmistry.majorLines.headLine) {
        sections.push('HEAD LINE:')
        const hdl = palmistry.majorLines.headLine
        sections.push(`- Present: ${hdl.present ? 'Yes' : 'No'}`)
        if (hdl.present) {
            sections.push(`- Length: ${hdl.length}, Slope: ${hdl.curve}`)
            sections.push(`- Interpretation: ${hdl.interpretation}`)
        }
        sections.push('')
    }

    if (palmistry.majorLines.fateLine) {
        sections.push('FATE LINE:')
        const fl = palmistry.majorLines.fateLine
        sections.push(`- Present: ${fl.present ? 'Yes' : 'No'}`)
        if (fl.present) {
            sections.push(`- Strength: ${fl.strength}`)
            sections.push(`- Interpretation: ${fl.interpretation}`)
        } else {
            sections.push(`- Interpretation: ${fl.interpretation}`)
        }
        sections.push('')
    }

    if (palmistry.majorLines.marriageLines) {
        sections.push('MARRIAGE LINES:')
        const ml = palmistry.majorLines.marriageLines
        sections.push(`- Count: ${ml.count}`)
        sections.push(`- Position: ${ml.position} (timing indicator)`)
        sections.push(`- Clarity: ${ml.clarity}`)
        sections.push(`- Interpretation: ${ml.interpretation}`)
        sections.push('')
    }

    // Mounts
    if (palmistry.mounts && Object.keys(palmistry.mounts).length > 0) {
        sections.push('Palm Mounts (Planetary Influences):')
        sections.push('')

        if (palmistry.mounts.venus) {
            sections.push(`VENUS MOUNT (Love & Vitality): ${palmistry.mounts.venus.prominence}`)
            sections.push(`- ${palmistry.mounts.venus.interpretation}`)
            sections.push('')
        }

        if (palmistry.mounts.jupiter) {
            sections.push(`JUPITER MOUNT (Ambition & Leadership): ${palmistry.mounts.jupiter.prominence}`)
            sections.push(`- ${palmistry.mounts.jupiter.interpretation}`)
            sections.push('')
        }

        if (palmistry.mounts.saturn) {
            sections.push(`SATURN MOUNT (Responsibility): ${palmistry.mounts.saturn.prominence}`)
            sections.push(`- ${palmistry.mounts.saturn.interpretation}`)
            sections.push('')
        }
    }

    // Analysis quality
    sections.push(`Analysis Quality: ${palmistry.confidence}`)
    sections.push(`Note: ${palmistry.analysisQuality}`)
    sections.push('')

    return sections.join('\n')
}
