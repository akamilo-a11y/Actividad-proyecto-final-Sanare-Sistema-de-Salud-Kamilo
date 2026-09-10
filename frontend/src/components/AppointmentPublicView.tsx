import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types';
import {
  CalendarX2,
  Loader2,
  Stethoscope,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function AppointmentPublicView() {
  const { token } = useParams<{ token: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido');
      setLoading(false);
      return;
    }

    appointmentService
      .getByToken(token)
      .then(setAppointment)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Turno no encontrado'),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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

  const handleCancel = async () => {
    if (!token) return;

    try {
      setCancelling(true);
      setError('');
      await appointmentService.cancelByToken(token);
      setCancelled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar el turno');
    } finally {
      setCancelling(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <CalendarX2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Turno no encontrado</h2>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const canCancel =
    appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {cancelled ? (
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-8 text-center">
              <CheckCircle2 className="w-14 h-14 text-white mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white">Turno cancelado</h2>
              <p className="text-red-100 text-sm mt-1">
                Tu turno fue cancelado correctamente
              </p>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                El horario quedó liberado para otros pacientes.
                Si lo necesitas, puedes reservar un nuevo turno desde el portal.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-6">
              <h2 className="text-xl font-bold text-white">Detalle de tu turno</h2>
              <p className="text-blue-100 text-sm mt-1">
                Gestión de turnos - SaludPublica Connect
              </p>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Estado</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}
                >
                  {getStatusText(appointment.status)}
                </span>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{appointment.doctor?.name}</p>
                  <p className="text-sm text-gray-500">
                    {appointment.doctor?.specialty?.name} · {appointment.doctor?.hospital}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <div className="bg-blue-100 rounded-lg p-2">
                  <CalendarCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 capitalize">
                    {formatDate(appointment.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatTime(appointment.date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {appointment.patientName} · {appointment.patientPhone}
                  </p>
                </div>
              </div>

              {canCancel && (
                <div className="border-t border-gray-100 pt-5 text-center">
                  {showConfirm ? (
                    <div className="bg-white border-2 border-red-200 rounded-xl p-4 animate-fade-in">
                      <p className="text-sm font-medium text-gray-800 mb-3">
                        ¿Seguro que deseas cancelar este turno?
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => setShowConfirm(false)}
                          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Volver
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                        >
                          {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                          Cancelar turno
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="inline-flex items-center gap-2 text-red-600 font-medium hover:text-red-800 transition-colors px-4 py-2"
                    >
                      <CalendarX2 className="w-4 h-4" />
                      Cancelar este turno
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}