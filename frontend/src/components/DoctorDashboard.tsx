import { useEffect, useState } from 'react';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types';
import {
  Stethoscope,
  CalendarX2,
  Clock,
  Loader2,
  User,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await appointmentService.getAll();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmado';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelado';
      case 'COMPLETED':
        return 'Completado';
      default:
        return status;
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;
    try {
      setError('');
      await appointmentService.cancel(id);
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <Stethoscope className="w-4 h-4" />
          Panel del Doctor
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Mis Turnos</h1>
        <p className="text-gray-600 mt-2">
          Turnos asignados a tu especialidad y horario de atención
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <CalendarX2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No tienes turnos asignados
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Cuando los pacientes reserven turnos con tu especialidad, los verás aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-xl flex flex-col items-center justify-center">
                      <Clock className="w-5 h-5 text-emerald-600 mb-0.5" />
                      <span className="text-[10px] font-bold text-emerald-800">
                        {formatTime(apt.date)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">
                        {formatDate(apt.date)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}
                      >
                        {getStatusText(apt.status)}
                      </span>
                    </div>
                  </div>

                  {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="self-start sm:self-auto flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <CalendarX2 className="w-4 h-4" />
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-700">{apt.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-600">{apt.patientPhone}</span>
                  </div>
                  {apt.patientEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600 truncate">{apt.patientEmail}</span>
                    </div>
                  )}
                </div>

                {apt.notes && (
                  <div className="mt-3 flex items-start gap-2 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span>
                      <span className="font-medium">Notas del paciente:</span> {apt.notes}
                    </span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}