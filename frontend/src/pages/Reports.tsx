import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Award } from 'lucide-react';
import { reportsApi } from '../api/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function Reports() {
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: revenue } = useQuery({
    queryKey: ['revenue', startDate, endDate],
    queryFn: () => reportsApi.revenue({ startDate, endDate }).then((r) => r.data),
  });

  const { data: specialists } = useQuery({
    queryKey: ['specialists-report'],
    queryFn: () => reportsApi.specialists().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1">Análisis de ingresos y rendimiento del negocio</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Ingresos del mes', value: `$${(revenue?.totalRevenue || 0).toLocaleString('es-CO')}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Citas completadas', value: revenue?.totalAppointments || 0, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
          { label: 'Promedio por cita', value: revenue?.totalAppointments ? `$${Math.round((revenue.totalRevenue || 0) / revenue.totalAppointments).toLocaleString('es-CO')}` : '$0', icon: Award, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por día</h2>
        {revenue?.revenueByDay?.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenue.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString('es-CO')}`, 'Ingresos']} />
              <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-400 text-center py-8">No hay datos para este período</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Service */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por servicio</h2>
          {revenue?.revenueByService?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenue.revenueByService}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString('es-CO')}`, 'Ingresos']} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">Sin datos</p>}
        </div>

        {/* Specialists */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporte por especialista</h2>
          {specialists?.length > 0 ? (
            <div className="space-y-3">
              {(specialists as any[]).map((s: any) => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="font-bold text-gray-900">${s.totalRevenue.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{s.appointmentsCount} citas</span>
                    <span>Comisión: ${s.commission.toLocaleString('es-CO')} ({s.commissionRate}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center py-8">Sin datos</p>}
        </div>
      </div>
    </div>
  );
}
