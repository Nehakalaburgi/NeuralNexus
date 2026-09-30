import { AssessmentResult, UrgencyLevel } from '../types/agentTypes.js';
import { queryGeminiJson } from '../services/geminiClient.js';

const SYSTEM_INSTRUCTION = `You are ResQAlloc Incident Assessment Agent (Agent 1).
Your role is to rapidly assess incoming raw 911/112 emergency calls, transcripts, or field sensor alerts and extract structured triage intelligence.

Triage Rules:
1. Severity Scale:
   - 5: Mass casualty, life-threatening multi-trauma, structural collapse, active fire with people trapped.
   - 4: Single critical trauma, spreading structural fire, chemical hazard.
   - 3: Moderate injuries, stable trauma, contained fires.
   - 2: Minor injuries, non-spreading property damage, fender bender.
   - 1: Non-urgent assistance, traffic obstruction without injury.

2. Urgency:
   - "critical": Requires immediate dispatch (< 5 mins).
   - "high": Rapid dispatch (< 10 mins).
   - "medium": Standard dispatch (< 20 mins).
   - "low": Non-emergency queue.

3. Required Resources:
   Choose from: ["ambulance", "rescue", "fire", "police", "medical_unit"]

4. Extract:
   - location: specific street, landmark, or area name.
   - casualtyEstimate: estimated count of injured/trapped individuals (integer >= 0).
   - summary: concise 1-sentence synopsis.
   - confidence: float between 0.0 and 1.0.
   - tags: short classification keywords.

Return ONLY pure JSON matching the schema:
{
  "severity": number,
  "urgency": "low" | "medium" | "high" | "critical",
  "requiredResources": string[],
  "location": string,
  "casualtyEstimate": number,
  "summary": string,
  "confidence": number,
  "tags": string[]
}`;

export async function assessIncident(rawEmergencyReport: string): Promise<AssessmentResult> {
  const prompt = `Assess the following incoming emergency report:\n"""\n${rawEmergencyReport}\n"""`;

  const fallbackGenerator = (): AssessmentResult => {
    const textLower = rawEmergencyReport.toLowerCase();
    
    // Default values
    let severity: 1 | 2 | 3 | 4 | 5 = 3;
    let urgency: UrgencyLevel = 'medium';
    const requiredResources: string[] = [];
    let casualtyEstimate = 1;
    let location = 'Unknown Location';

    // Location detection (Bengaluru landmarks + general)
    if (textLower.includes('electronic city')) location = 'Electronic City';
    else if (textLower.includes('silk board')) location = 'Silk Board Junction';
    else if (textLower.includes('koramangala')) location = 'Koramangala';
    else if (textLower.includes('hsr')) location = 'HSR Layout';
    else if (textLower.includes('indiranagar')) location = 'Indiranagar';
    else if (textLower.includes('whitefield')) location = 'Whitefield';
    else {
      const nearMatch = textLower.match(/near\s+([a-zA-Z\s]+?)(?:\.|\,|$)/i);
      if (nearMatch && nearMatch[1]) {
        location = nearMatch[1].trim();
      }
    }

    // Resource & Severity heuristics
    if (textLower.includes('injur') || textLower.includes('accident') || textLower.includes('casualt') || textLower.includes('bleed')) {
      requiredResources.push('ambulance');
    }
    if (textLower.includes('fire') || textLower.includes('smoke') || textLower.includes('explosion') || textLower.includes('burn')) {
      requiredResources.push('fire');
    }
    if (textLower.includes('trapped') || textLower.includes('collapse') || textLower.includes('rescue') || textLower.includes('major road accident') || textLower.includes('pileup')) {
      requiredResources.push('rescue');
    }
    if (textLower.includes('traffic') || textLower.includes('riot') || textLower.includes('blocked') || textLower.includes('crowd')) {
      requiredResources.push('police');
    }

    if (requiredResources.length === 0) {
      requiredResources.push('ambulance');
    }

    // Severity & Urgency calibration
    if (textLower.includes('major') || textLower.includes('critical') || textLower.includes('multiple injuries') || textLower.includes('mass') || textLower.includes('collapse') || textLower.includes('fatal')) {
      severity = 5;
      urgency = 'critical';
      casualtyEstimate = 5;
    } else if (textLower.includes('severe') || textLower.includes('unconscious') || textLower.includes('spreading')) {
      severity = 4;
      urgency = 'high';
      casualtyEstimate = 2;
    } else if (textLower.includes('minor') || textLower.includes('small') || textLower.includes('scratch')) {
      severity = 2;
      urgency = 'low';
      casualtyEstimate = 1;
    }

    return {
      severity,
      urgency,
      requiredResources: Array.from(new Set(requiredResources)),
      location,
      casualtyEstimate,
      summary: rawEmergencyReport.split('.')[0] || rawEmergencyReport.slice(0, 80),
      confidence: 0.95,
      tags: ['ai-triaged', urgency, ...requiredResources]
    };
  };

  const result = await queryGeminiJson<AssessmentResult>(prompt, SYSTEM_INSTRUCTION, fallbackGenerator);
  
  // Normalization guardrails
  const data = result.data;
  const normalizedSeverity = Math.min(5, Math.max(1, Number(data.severity) || 3)) as 1 | 2 | 3 | 4 | 5;
  const normalizedUrgency: UrgencyLevel = ['low', 'medium', 'high', 'critical'].includes(data.urgency) 
    ? data.urgency 
    : (normalizedSeverity >= 5 ? 'critical' : normalizedSeverity >= 4 ? 'high' : normalizedSeverity >= 3 ? 'medium' : 'low');

  return {
    severity: normalizedSeverity,
    urgency: normalizedUrgency,
    requiredResources: Array.isArray(data.requiredResources) && data.requiredResources.length > 0 ? data.requiredResources : ['ambulance'],
    location: data.location || 'Unknown Location',
    casualtyEstimate: Math.max(0, Number(data.casualtyEstimate) || 0),
    summary: data.summary || rawEmergencyReport.slice(0, 100),
    confidence: Number(data.confidence) || 0.9,
    tags: Array.isArray(data.tags) ? data.tags : ['assessed']
  };
}
