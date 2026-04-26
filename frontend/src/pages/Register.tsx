import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

const BUSINESS_TYPES = ['Peluquería', 'Barbería', 'Spa', 'Fisioterapia', 'Psicología', 'Odontología', 'Nutrición', 'Entrenamiento personal', 'Masajes', 'Otro'];

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    businessEmail: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      setAuth(data.token, data.user);
      toast.success('¡Negocio creado exitosamente!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-500 rounded-2xl mb-4">
            <CalendarDays className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Registra tu negocio</h1>
          <p className="text-slate-400 mt-1">Empieza gratis, sin tarjeta de crédito</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre del negocio</label>
                <input className="input" placeholder="Mi Salón" required
                  value={form.businessName} onChange={(e) => update('businessName', e.target.value)} />
              </div>
              <div>
                <label className="label">Tipo de negocio</label>
                <select className="input" required value={form.businessType} onChange={(e) => update('businessType', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Email del negocio</label>
              <input type="email" className="input" placeholder="info@minegocio.com" required
                value={form.businessEmail} onChange={(e) => update('businessEmail', e.target.value)} />
            </div>
            <hr className="my-2" />
            <p className="text-sm font-semibold text-gray-700">Tu cuenta de administrador</p>
            <div>
              <label className="label">Tu nombre</label>
              <input className="input" placeholder="Juan García" required
                value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} />
            </div>
            <div>
              <label className="label">Tu email</label>
              <input type="email" className="input" placeholder="juan@email.com" required
                value={form.ownerEmail} onChange={(e) => update('ownerEmail', e.target.value)} />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input type="password" className="input" placeholder="Mínimo 8 caracteres" minLength={8} required
                value={form.password} onChange={(e) => update('password', e.target.value)} />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base rounded-xl mt-2">
              {loading ? 'Creando negocio...' : 'Crear mi negocio gratis'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-accent-600 font-medium hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
