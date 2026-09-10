import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { specialtyService } from '../services/specialtyService';
import { appointmentService } from '../services/appointmentService';
import { Doctor, Specialty, Slot, Appointment } from '../types';
import {
  CalendarCheck,
  Loader2,
  Stethoscope,
  Building,
  Clock,
  CheckCircle2,
  Copy,
  MapPin,
} from 'lucide-react';

export default function AppointmentScheduler() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [openSlots, setOpenSlots] = useState<Slot[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [patientName, setPatientName] = useState(
    user ? `${user.firstName} ${user.lastName}` : '',
  );
  const [patientEmail, setPatientEmail] = useState(user?.email || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');

  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState<Appointment | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    specialtyService
      .getAll()
      .then((data) => {
        setSpecialties(data);

        const fromQuery = searchParams.get('specialtyId');
        if (fromQuery && data.some((s) => s.id === fromQuery)) {
          setSelectedSpecialtyId(fromQuery);
        }
      })
      .catch(() => setError('No se pudieron cargar las especialidades'))
      .finally(() => setLoadingSpecialties(false));
  }, [searchParams]);

  useEffect(() => {
    if (!selectedSpecialtyId) {
      setSpecialty(null);
      setSelectedDoctorId('');
      setSelectedSlot(null);
      setOpenSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSelectedDoctorId('');
    setSelectedSlot(null);
    setOpenSlots([]);

    specialtyService
      .getById(selectedSpecialtyId)
      .then((data) => setSpecialty(data))
      .catch(() => setError('No se pudo cargar la especialidad'))
      .finally(() => setLoadingSlots(false));
  }, [selectedSpecialtyId]);

  useEffect(() => {
    if (!specialty || !selectedDoctorId) {
      setOpenSlots([]);
      setSelectedSlot(null);
      return;
    }

    const doctor = specialty.doctors?.find((d: Doctor) => d.id === selectedDoctorId);
    setOpenSlots(
      doctor?.availableSlots
        ? [...doctor.availableSlots].sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          )
        : [],
    );
    setSelectedSlot(null);
  }, [selectedDoctorId, specialty]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const handleBook = async () => {
    if (!selectedSlot || !patientName.trim() || !patientPhone.trim()) {
      setError('Complete nombre y teléfono del paciente');
      return;
    }

    try {
      setBooking(true);
      setError('');
      const appointment = await appointmentService.create({
        doctorId: selectedSlot.doctorId,
        patientName,
        patientEmail: patientEmail || undefined,
        patientPhone,
        date: selectedSlot.startTime,
        notes: notes || undefined,
      });
      setResult(appointment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reservar el turno');
    } finally {
      setBooking(false);
    }
  };

  const handleCopyLink = async () => {
    if (!result?.cancellationToken) return;
    const link = `${window.location.origin}/appointment/${result.cancellationToken}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt('Copia el enlace de cancelación:', link);
    }
  };

  if (result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-white mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white">Turno reservado</h2>
            <p className="text-green-100 text-sm mt-1">
              Se enviará una confirmación por email
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-sm text-gray-500">Doctor</p>
                <p className="font-semibold text-gray-900">{result.doctor?.name}</p>
              </div>
              <Stethoscope className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {formatDate(result.date)}
                </p>
              </div>
              <CalendarCheck className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-sm text-gray-500">Hora</p>
                <p className="font-semibold text-gray-900">{formatTime(result.date)}</p>
              </div>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-sm text-gray-500">Paciente</p>
                <p className="font-semibold text-gray-900">{result.patientName}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Enlace de cancelación:</span>
                <span className="block text-xs mt-1">
                  /appointment/{result.cancellationToken}
                </span>
              </p>
              <button
                onClick={handleCopyLink}
                className="mt-3 inline-flex items-center gap-2 text-sm text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copiar enlace
              </button>
            </div>

            <p className="text-xs text-gray-400">
              También puedes cancelar desde "Mis turnos" con tu sesión iniciada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <CalendarCheck className="w-4 h-4" />
          Reserva de turnos
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Elige tu turno</h1>
        <p className="text-gray-600 mt-2">
          Selecciona la especialidad, el doctor y el horario disponible
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        {loadingSpecialties ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Especialidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. Especialidad
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specialties.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpecialtyId(spec.id)}
                    className={`p-3 text-left rounded-xl border transition-colors ${
                      selectedSpecialtyId === spec.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Stethoscope
                      className={`w-5 h-5 mb-2 ${
                        selectedSpecialtyId === spec.id ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    <p className="text-sm font-semibold text-gray-900">{spec.name}</p>
                    {spec._count && (
                      <p className="text-xs text-gray-500">
                        {spec._count.doctors} doctor(s)
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor */}
            {selectedSpecialtyId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Doctor
                </label>
                {loadingSlots ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                ) : specialty?.doctors?.length ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {specialty.doctors.map((doctor: Doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => setSelectedDoctorId(doctor.id)}
                        disabled={!doctor.availableSlots?.length}
                        className={`p-4 text-left rounded-xl border transition-colors ${
                          selectedDoctorId === doctor.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                            : 'border-gray-200 hover:border-blue-300'
                        } ${
                          !doctor.availableSlots?.length
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{doctor.name}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Building className="w-4 h-4" />
                          {doctor.hospital}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Clock className="w-4 h-4" />
                          {doctor.availableSlots?.length || 0} horarios disponibles
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                    No hay doctores disponibles en esta especialidad.
                  </p>
                )}
              </div>
            )}

            {/* Horarios */}
            {selectedDoctorId && openSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Horario disponible
                </label>
                <div className="flex flex-wrap gap-2">
                  {openSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        selectedSlot?.id === slot.id
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <span className="block">{formatTime(slot.startTime)}</span>
                      <span className="text-xs opacity-70">
                        {formatDate(slot.startTime)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Datos del paciente */}
            {selectedSlot && (
              <div className="border-t border-gray-100 pt-6 space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    4. Datos del paciente
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Notas
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Opcional"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={booking}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Reservando...
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-5 h-5" />
                      Confirmar reserva
                    </>
                  )}
                </button>

                {selectedSlot && (
                  <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {specialty?.doctors
                      ?.find((d: Doctor) => d.id === selectedDoctorId)
                      ?.hospital}{' '}
                    · Turno de {selectedSlot.durationMinutes} minutos
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}