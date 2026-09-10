import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  Users,
  Activity,
  CalendarClock,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { appointmentService } from '../services/appointmentService';
import { StatsResponse } from '../types';
import DoctorManagement from './DoctorManagement';
import AppointmentsCalendar from './AppointmentsCalendar';

type Tab = 'overview' | 'doctors' | 'calendar';

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsKey, setStatsKey] = useState(0);

  const loadStats = async () => {
    try {
      setError('');
      const data = await appointmentService.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [statsKey]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'doctors', label: 'Doctores', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendario', icon: <CalendarDays className="w-4 h-4" /> },
  ];

  const statCards = [
    {
      label: 'Turnos totales',
      value: stats?.total ?? 0,
      icon: <CalendarClock className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Doctores',
      value: stats?.totalDoctors ?? 0,
      icon: <Stethoscope className="w-6 h-6" />,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Especialidades',
      value: stats?.totalSpecialties ?? 0,
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Pacientes registrados',
      value: stats?.totalUsers ?? 0,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-amber-100 text-amber-600',
    },
  ];

  const byStatusData = stats
    ? [
        { name: 'Pendientes', value: stats.byStatus.pending },
        { name: 'Confirmados', value: stats.byStatus.confirmed },
        { name: 'Cancelados', value: stats.byStatus.cancelled },
        { name: 'Completados', value: stats.byStatus.completed },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-1">Gestión integral del sistema de turnos</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-white rounded-xl p-1.5 border border-gray-200 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'doctors' && <DoctorManagement />}

      {tab === 'calendar' && <AppointmentsCalendar />}

      {tab === 'overview' && (
        <>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200"
                  >
                    <div
                      className={`inline-flex items-center justify-center rounded-xl w-11 h-11 mb-3 ${card.color}`}
                    >
                      {card.icon}
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">
                      {card.value}
                    </p>
                    <p className="text-sm text-gray-500">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Turnos por día */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Turnos por día (7 días)
                    </h3>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.appointmentsByDay ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v: string) => v.slice(5)}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip />
                        <Bar dataKey="appointments" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Turnos por especialidad */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Turnos por especialidad
                    </h3>
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.appointmentsBySpecialty ?? []}
                          dataKey="appointments"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry: any) =>
                            `${entry.name}: ${entry.appointments}`
                          }
                        >
                          {(stats?.appointmentsBySpecialty ?? []).map((_, index) => (
                            <Cell
                              key={index}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Estados */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Estado de los turnos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {byStatusData.map((item) => (
                    <div key={item.name} className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-gray-900">{item.value}</p>
                      <p className="text-sm text-gray-500">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}