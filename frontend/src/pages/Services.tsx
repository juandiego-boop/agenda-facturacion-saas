import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Trash2, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi } from '../api/client';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Services() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', duration: 60, price: 0, category: '', color: '#6366f1' });

  const { data: services = [], isLoading } = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.getAll().then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: object) => servicesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setShowModal(false); toast.success('Servicio creado'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast.success('Servicio eliminado'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-500 mt-1">Define los servicios que ofrece tu negocio</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? [1,2,3].map(i => <div key={i} className="card h-36 animate-pulse bg-gray-100" />) :
          (services as any[]).map((s: any) => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + '20' }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                </div>
                <button onClick={() => deleteMutation.mutate(s.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900">{s.name}</h3>
              {s.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{s.description}</p>}
              <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.duration}min</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />${s.price?.toLocaleString('es-CO')}</span>
              </div>
              {s.category && <span className="badge bg-gray-100 text-gray-600 mt-2">{s.category}</span>}
            </div>
          ))}
        {!isLoading && (services as any[]).length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">No hay servicios. Crea uno para empezar.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Nuevo servicio</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div><label className="label">Nombre del servicio *</label><input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><label className="label">Descripción</label><input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Duración (minutos) *</label><input type="number" className="input" required min="5" value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})} /></div>
                <div><label className="label">Precio *</label><input type="number" className="input" required min="0" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} /></div>
              </div>
              <div><label className="label">Categoría</label><input className="input" placeholder="Ej: Cabello, Uñas..." value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 mt-1">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creando...' : 'Crear servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
