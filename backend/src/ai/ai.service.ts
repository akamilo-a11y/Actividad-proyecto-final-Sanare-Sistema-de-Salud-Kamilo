import { ServiceUnavailableException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface TriageResult {
  recommendedSpecialty: string;
  urgency: 'Baja' | 'Media' | 'Alta';
  reasoning: string;
}

export const VALID_SPECIALTIES = [
  'Medicina General',
  'Pediatría',
  'Cardiología',
  'Traumatología',
  'Ginecología',
  'Dermatología',
  'Neurología',
  'Consulta General',
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ai: GoogleGenAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.logger.log('IA: Gemini inicializado');
    } else {
      this.ai = null;
    }
  }

  async triage(symptoms: string): Promise<TriageResult> {
    if (!this.ai) {
      throw new ServiceUnavailableException(
        'API key de Gemini no configurada en el servidor. Configure GEMINI_API_KEY en backend/.env',
      );
    }

    const prompt = `
Eres un asistente de triaje médico de un sistema de turnos de hospitales públicos.
Un paciente describe sus síntomas. Determina la especialidad médica más adecuada, la urgencia y un razonamiento breve.

Síntomas del paciente: "${symptoms}"

Especialidades disponibles: ${VALID_SPECIALTIES.join(', ')}

Responde ÚNICAMENTE con un JSON válido con esta estructura (sin markdown, sin texto adicional):
{
  "recommendedSpecialty": "una de las especialidades listadas",
  "urgency": "Baja" | "Media" | "Alta",
  "reasoning": "explicación breve en español (máx 150 caracteres)"
}
`;

    try {
      const response = await this.generateWithRetry(prompt);

      const text = response.text?.trim() || '';
      const cleaned = text
        .replace(/```json|```/g, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Respuesta de Gemini sin formato JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        recommendedSpecialty: parsed.recommendedSpecialty || 'Consulta General',
        urgency: ['Baja', 'Media', 'Alta'].includes(parsed.urgency)
          ? parsed.urgency
          : 'Baja',
        reasoning: parsed.reasoning || 'Consulta general recomendada.',
      };
    } catch (err) {
      this.logger.warn('Gemini no disponible, usando triaje heurístico local', err);
      return this.heuristicTriage(symptoms);
    }
  }

  private heuristicTriage(symptoms: string): TriageResult {
    const s = symptoms.toLowerCase();

    const rules: Array<{ keys: string[]; specialty: string; urgency: 'Baja' | 'Media' | 'Alta' }> = [
      { keys: ['pecho', 'corazon', 'dolor en el brazo', 'falta de aire', 'respira'], specialty: 'Cardiología', urgency: 'Alta' },
      { keys: ['hueso', 'rodilla', 'fractura', 'esguince', 'caida', 'caída', 'espalda', 'brazo roto'], specialty: 'Traumatología', urgency: 'Media' },
      { keys: ['embarazo', 'menstrual', 'gine', 'vulva', 'ovarios'], specialty: 'Ginecología', urgency: 'Media' },
      { keys: ['piel', 'erupcion', 'erupción', 'manchas', 'sarpullido', 'acne', 'acné'], specialty: 'Dermatología', urgency: 'Baja' },
      { keys: ['cabeza', 'cerebro', 'vomito', 'vómito', 'mareo', 'mareos', 'paralisis', 'parálisis', 'convul'], specialty: 'Neurología', urgency: 'Media' },
      { keys: ['nino', 'niño', 'bebe', 'bebé', 'fiebre en mi hijo', 'hijo'], specialty: 'Pediatría', urgency: 'Media' },
      { keys: ['fiebre', 'garganta', 'gripe', 'tos', 'dolor de cabeza', 'nausea', 'náusea', 'infeccion', 'infección'], specialty: 'Medicina General', urgency: 'Media' },
      { keys: ['digest', 'estomago', 'estómago', 'barriga', 'diarrea', 'estreñimiento', 'colon'], specialty: 'Medicina General', urgency: 'Baja' },
    ];

    for (const rule of rules) {
      if (rule.keys.some((k) => s.includes(k))) {
        return {
          recommendedSpecialty: rule.specialty,
          urgency: rule.urgency,
          reasoning: `Evaluación local basada en sus síntomas (${rule.specialty}). Consulte con un profesional para confirmar el diagnóstico.`,
        };
      }
    }

    return {
      recommendedSpecialty: 'Consulta General',
      urgency: 'Baja',
      reasoning: 'No se detectaron síntomas críticos. Se recomienda una consulta general de control.',
    };
  }

  private async generateWithRetry(prompt: string) {
    const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    const backoff = [1000, 3000, 6000, 10000, 15000];
    let lastError: unknown;

    for (const model of models) {
      for (let attempt = 0; attempt < backoff.length; attempt++) {
        try {
          return await this.ai!.models.generateContent({
            model,
            contents: prompt,
          });
        } catch (err: any) {
          lastError = err;
          const raw: any = err?.error ?? {};
          const code = Number(raw.code ?? err?.code);
          const status = raw.status || err?.status || '';

          if (code === 404 || status === 'NOT_FOUND' || status === 'PERMISSION_DENIED') {
            this.logger.warn(`IA: modelo ${model} no disponible (${code || status}), probando siguiente`);
            break;
          }
          if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
            this.logger.warn(`IA: modelo ${model} saturado (429), reintentando...`);
          } else {
            this.logger.warn(`IA: modelo ${model} intento ${attempt + 1} falló (${code || status})`);
          }
          if (attempt < backoff.length - 1) {
            await new Promise((r) => setTimeout(r, backoff[attempt]));
          }
        }
      }
    }

    throw lastError ?? new Error('No se pudo generar respuesta de IA');
  }
}