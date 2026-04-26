import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Building2, Users, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { businessApi } from '../api/client';

const PLANS = [
  { key: 'BASIC', name: 'Básico', price: '10€/mes', color: 'border-gray-200', features: ['Hasta 3 especialistas', '100 citas/mes', 'Reportes básicos'] },
  { key: 'PRO', name: 'Pro', price: '30€/mes', color: 'border-accent-500', highlight: true, features: ['10 especialistas', 'Citas ilimitadas', 'Reportes avanzados'] },
  { key: 'PREMIUM', name: 'Premium', price: '60€/mes', color: 'border-purple-400', features: ['Sin límites', 'API access', 'Soporte prioritario'] },
];

export default function Settings() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'business' | 'team' | 'billing'>('business');
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', type: '', description: '' });

  const { data: business } = useQuery({ queryKey: ['business'], queryFn: () => businessApi.getMe().then(r => r.data) });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => businessApi.getUsers().then(r => r.data) });

  useEffect(() => {
    if (business) setForm({ name: business.name || '', address: business.address || '', phone: business.phone || '', email: business.email || '', type: business.type || '', description: business.description || '' });
  }, [business]);

  const updateMutation = useMutation({
    mutationFn: (data: object) => businessApi.update(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['business'] }); toast.success('Configuración guardada'); },
    onError: () => toast.error('Error al guardar'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'business', label: 'Negocio', icon: Building2 },
          { key: 'team', label: 'Equipo', icon: Users },
          { key: 'billing', label: 'Plan', icon: CreditCard },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-accent-500 text-accent-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'business' && (
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="card max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nombre del negocio</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label className="label">Tipo</label><input className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})} /></div>
          </div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div><label className="label">Teléfono</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div><label className="label">Dirección</label><input className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div><label className="label">Descripción</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
            {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      )}

      {tab === 'team' && (
        <div className="card max-w-2xl">
          <h3 className="font-semibold text-gray-900 mb-4">Usuarios del equipo</h3>
          <div className="space-y-3">
            {(users as any[]).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-semibold text-sm">{u.name[0]}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className="badge bg-gray-100 text-gray-600">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          {PLANS.map((plan) => (
            <div key={plan.key} className={`card border-2 ${plan.color} ${plan.highlight ? 'shadow-lg' : ''} relative`}>
              {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full">Recomendado</div>}
              <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1 mb-3" style={{ color: plan.highlight ? '#6366f1' : undefined }}>{plan.price}</p>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => <li key={f} className="text-sm text-gray-600 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />{f}</li>)}
              </ul>
              <button className={plan.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                {business?.plan === plan.key ? 'Plan actual' : 'Cambiar plan'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
