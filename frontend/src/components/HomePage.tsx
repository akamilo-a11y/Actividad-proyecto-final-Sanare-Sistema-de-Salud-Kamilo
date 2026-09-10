import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Users,
  Activity,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 text-white py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Activity className="w-4 h-4" />
            Sistema de Gestión de Turnos
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Turnos médicos en centros de salud públicos, al alcance de todos
          </h1>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Reservá tu turno médico de forma rápida, con asistencia de
            inteligencia artificial para orientar tu consulta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isAuthenticated ? '/booking' : '/register'}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              <CalendarCheck className="w-5 h-5" />
              Reservar mi turno
            </Link>
            <Link
              to="/triage"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Probar Triaje IA
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          ¿Cómo funciona?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Triaje con IA
            </h3>
            <p className="text-gray-600 text-sm">
              Describí tus síntomas y la inteligencia artificial te recomienda la
              especialidad más adecuada para tu consulta.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
              <Stethoscope className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Elige tu especialista
            </h3>
            <p className="text-gray-600 text-sm">
              Consulta disponibilidad de horarios y reserva tu turno con el
              doctor que prefieras en pocos clics.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Seguro y a tu medida
            </h3>
            <p className="text-gray-600 text-sm">
              Gestión de roles, turnos protegidos contra dobles reservas y
              notificaciones automáticas de confirmación.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Admin */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 rounded-xl w-12 h-12 flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ¿Eres administrador?
              </h3>
              <p className="text-gray-600 text-sm">
                Gestiona doctores, especialidades y el calendario completo de turnos.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Ir al panel
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}