import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { specialistsApi, servicesApi } from '../api/client';

export default function Specialists() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', bio: '', commission: 0, serviceIds: [] as string[] });

  const { data: specialists = [], isLoading } = useQuery({ queryKey: ['specialists'], queryFn: () => specialistsApi.getAll().then(r => r.data) });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.getAll().then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: object) => specialistsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['specialists'] }); setShowModal(false); toast.success('Especialista creado'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => specialistsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['specialists'] }); toast.success('Especialista desactivado'); },
  });

  const toggleService = (id: string) => {
    setForm(f => ({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter(s => s !== id) : [...f.serviceIds, id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Especialistas</h1>
          <p className="text-gray-500 mt-1">Gestiona tu equipo de trabajo</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo especialista
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? [1,2,3].map(i => <div key={i} className="card h-40 animate-pulse bg-gray-100" />) :
          (specialists as any[]).map((s: any) => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-bold text-lg">
                  {s.name[0]}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => deleteMutation.mutate(s.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{s.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{s.email}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="badge bg-purple-50 text-purple-700">Comisión: {s.commission}%</span>
                <span className="text-xs text-gray-400">{s.specialistServices?.length || 0} servicios</span>
              </div>
            </div>
          ))}
        {!isLoading && (specialists as any[]).length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <p>No hay especialistas. Agrega uno para empezar.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Nuevo especialista</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Nombre</label><input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Teléfono</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><label className="label">Comisión (%)</label><input type="number" min="0" max="100" className="input" value={form.commission} onChange={e => setForm({...form, commission: parseFloat(e.target.value)})} /></div>
              </div>
              <div>
                <label className="label">Servicios que realiza</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(services as any[]).map((s: any) => (
                    <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${form.serviceIds.includes(s.id) ? 'bg-accent-500 text-white border-accent-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creando...' : 'Crear especialista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
