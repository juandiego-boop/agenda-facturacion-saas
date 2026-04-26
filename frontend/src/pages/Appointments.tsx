import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { appointmentsApi, specialistsApi, servicesApi, clientsApi } from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function Appointments() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [form, setForm] = useState({
    specialistId: '', serviceId: '', clientId: '', clientName: '',
    clientPhone: '', date: '', notes: '',
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () => appointmentsApi.getAll({ date: selectedDate }).then((r) => r.data),
  });

  const { data: specialists = [] } = useQuery({ queryKey: ['specialists'], queryFn: () => specialistsApi.getAll().then((r) => r.data) });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.getAll().then((r) => r.data) });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.getAll().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: object) => appointmentsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setShowModal(false); toast.success('Cita creada'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error al crear cita'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => appointmentsApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Estado actualizado'); },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Cita cancelada'); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, date: new Date(form.date).toISOString() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 mt-1">Gestiona el calendario de citas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva cita
        </button>
      </div>

      {/* Date picker */}
      <div className="card">
        <div className="flex items-center gap-4">
          <label className="label mb-0 whitespace-nowrap">Fecha:</label>
          <input type="date" className="input max-w-xs" value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)} />
          <p className="text-sm text-gray-500">
            {appointments.length} cita{appointments.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Appointments list */}
      <div className="card">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No hay citas para este día</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Agregar cita</button>
          </div>
        ) : (
          <div className="space-y-3">
            {(appointments as any[]).map((apt) => (
              <div key={apt.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: apt.service?.color || '#6366f1' }} />
                <div className="w-20 text-center">
                  <p className="font-bold text-gray-900">{format(new Date(apt.date), 'HH:mm')}</p>
                  <p className="text-xs text-gray-400">{apt.service?.duration}min</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{apt.client?.name || apt.clientName || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-500">{apt.service?.name} · {apt.specialist?.name}</p>
                </div>
                <p className="font-medium text-gray-900">${apt.price?.toLocaleString('es-CO')}</p>
                <span className={`badge ${STATUS_COLORS[apt.status]}`}>{apt.status}</span>
                <div className="flex gap-1">
                  {apt.status === 'CONFIRMED' && (
                    <button onClick={() => statusMutation.mutate({ id: apt.id, status: 'COMPLETED' })}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Completar">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {!['CANCELLED', 'COMPLETED'].includes(apt.status) && (
                    <button onClick={() => cancelMutation.mutate(apt.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Cancelar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nueva Cita */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Nueva cita</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Especialista</label>
                  <select className="input" required value={form.specialistId} onChange={(e) => setForm({...form, specialistId: e.target.value})}>
                    <option value="">Seleccionar</option>
                    {(specialists as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Servicio</label>
                  <select className="input" required value={form.serviceId} onChange={(e) => setForm({...form, serviceId: e.target.value})}>
                    <option value="">Seleccionar</option>
                    {(services as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Cliente existente (opcional)</label>
                <select className="input" value={form.clientId} onChange={(e) => setForm({...form, clientId: e.target.value})}>
                  <option value="">Nuevo cliente</option>
                  {(clients as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {!form.clientId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nombre cliente</label>
                    <input className="input" value={form.clientName} onChange={(e) => setForm({...form, clientName: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Teléfono</label>
                    <input className="input" value={form.clientPhone} onChange={(e) => setForm({...form, clientPhone: e.target.value})} />
                  </div>
                </div>
              )}
              <div>
                <label className="label">Fecha y hora</label>
                <input type="datetime-local" className="input" required value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creando...' : 'Crear cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
