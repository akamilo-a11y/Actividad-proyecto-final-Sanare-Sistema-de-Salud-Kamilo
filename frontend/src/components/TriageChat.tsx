import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { TriageResult } from '../types';
import {
  Sparkles,
  Send,
  Loader2,
  Stethoscope,
  AlertTriangle,
  Activity,
  ArrowRight,
} from 'lucide-react';

const urgencyStyles: Record<TriageResult['urgency'], { badge: string; bar: string; text: string }> = {
  Baja: { badge: 'bg-green-100 text-green-800', bar: 'bg-green-500', text: 'text-green-700' },
  Media: { badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500', text: 'text-yellow-700' },
  Alta: { badge: 'bg-red-100 text-red-800', bar: 'bg-red-500', text: 'text-red-700' },
};

const examples = [
  'Dolor de cabeza constante desde hace una semana',
  'Me duele el pecho al hacer ejercicio',
  'Mi hijo tiene fiebre alta desde anoche',
  'Dolor agudo en la rodilla después de una caída',
];

export default function TriageChat() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || loading) return;

    setError('');
    setResult(null);

    try {
      setLoading(true);
      const data = await geminiService.analyzeSymptoms(symptoms);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo realizar el análisis. Intente nuevamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (specialty: string) => {
    navigate('/booking');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Triaje con Inteligencia Artificial
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">
          ¿Qué te está pasando?
        </h1>
        <p className="text-gray-600 mt-2">
          Describe tus síntomas y la IA te orientará hacia la especialidad adecuada.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Ej: Tengo dolor de pecho y falta de aire desde hace dos días..."
            rows={4}
            required
            minLength={3}
            className="w-full resize-none focus:outline-none text-gray-800"
          />
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div className="hidden sm:flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setSymptoms(ex)}
                  className="text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-3 py-1 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || !symptoms.trim()}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analizar
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="animate-pulse-soft">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded-full w-3/4 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden animate-fade-in">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Stethoscope className="w-5 h-5" />
              <span className="font-semibold">Resultado del triaje</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${urgencyStyles[result.urgency].badge}`}
            >
              Urgencia {result.urgency}
            </span>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Especialidad recomendada</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.recommendedSpecialty}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Nivel de urgencia</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    urgencyStyles[result.urgency].bar
                  }`}
                  style={{
                    width:
                      result.urgency === 'Baja'
                        ? '33%'
                        : result.urgency === 'Media'
                        ? '66%'
                        : '100%',
                  }}
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className={`font-semibold ${urgencyStyles[result.urgency].text}`}>
                  ¿Por qué?
                </span>{' '}
                {result.reasoning}
              </p>
            </div>

            <button
              onClick={() => handleBook(result.recommendedSpecialty)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Reservar turno
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}