import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { reportsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
};

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.dashboard().then((r) => r.data),
  });

  const stats = [
    { label: 'Citas hoy', value: data?.todayAppointments || 0, icon: CalendarDays, color: 'bg-blue-50 text-blue-600' },
    { label: 'Citas este mes', value: data?.monthAppointments || 0, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total clientes', value: data?.totalClients || 0, icon: Users, color: 'bg-green-50 text-green-600' },
    {
      label: 'Ingresos del mes',
      value: `$${(data?.monthRevenue || 0).toLocaleString('es-CO')}`,
      icon: DollarSign, color: 'bg-yellow-50 text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Aquí tienes un resumen de {user?.business?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Próximas citas */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-500" />
          Próximas citas
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : data?.upcomingAppointments?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay citas próximas</p>
        ) : (
          <div className="space-y-3">
            {data?.upcomingAppointments?.map((apt: any) => (
              <div key={apt.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-2 h-10 rounded-full" style={{ backgroundColor: apt.service.color || '#6366f1' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{apt.client?.name || apt.clientName || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-500">{apt.service.name} · {apt.specialist.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(apt.date), 'HH:mm', { locale: es })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(apt.date), 'd MMM', { locale: es })}
                  </p>
                </div>
                <span className={`badge ${STATUS_COLORS[apt.status]}`}>{STATUS_LABELS[apt.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
