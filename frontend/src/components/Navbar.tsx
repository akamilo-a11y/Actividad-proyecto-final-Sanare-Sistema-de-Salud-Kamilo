import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, LayoutDashboard, Menu, X, LogOut, Stethoscope, Sparkles, CalendarDays, UserRound } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-white/20 text-white'
        : 'text-blue-100 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <nav className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-white/20 rounded-lg p-1.5">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-tight">
                SaludPublica Connect
              </span>
              <span className="hidden sm:block text-blue-100 text-xs leading-tight">
                Gestión de Turnos
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkClass('/')}>
              <Stethoscope className="w-4 h-4" />
              Inicio
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/triage" className={linkClass('/triage')}>
                  <Sparkles className="w-4 h-4" />
                  Triaje IA
                </Link>
                <Link to="/booking" className={linkClass('/booking')}>
                  <CalendarDays className="w-4 h-4" />
                  Reservar Turno
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <Link to="/admin" className={linkClass('/admin')}>
                <LayoutDashboard className="w-4 h-4" />
                Administración
              </Link>
            )}

            {user?.role === 'DOCTOR' && (
              <Link to="/doctor" className={linkClass('/doctor')}>
                <CalendarDays className="w-4 h-4" />
                Mis Turnos
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2 text-white">
                  <div className="bg-white/20 rounded-full p-1.5">
                    <UserRound className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full uppercase">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white p-2"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-blue-800 px-4 pb-4 pt-2 space-y-1">
          <Link to="/" onClick={() => setMobileOpen(false)} className={linkClass('/')}>
            <Stethoscope className="w-4 h-4" />
            Inicio
          </Link>

          {isAuthenticated && (
            <>
              <Link to="/triage" onClick={() => setMobileOpen(false)} className={linkClass('/triage')}>
                <Sparkles className="w-4 h-4" />
                Triaje IA
              </Link>
              <Link to="/booking" onClick={() => setMobileOpen(false)} className={linkClass('/booking')}>
                <CalendarDays className="w-4 h-4" />
                Reservar Turno
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className={linkClass('/admin')}>
              <LayoutDashboard className="w-4 h-4" />
              Administración
            </Link>
          )}

          {user?.role === 'DOCTOR' && (
            <Link to="/doctor" onClick={() => setMobileOpen(false)} className={linkClass('/doctor')}>
              <CalendarDays className="w-4 h-4" />
              Mis Turnos
            </Link>
          )}

          <div className="pt-3 border-t border-white/10">
            {isAuthenticated && user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión ({user.firstName})
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 rounded-lg text-center"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-white text-blue-700 rounded-lg text-center"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}