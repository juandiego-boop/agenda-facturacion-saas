import { Link } from 'react-router-dom';
import { CalendarDays, Users, BarChart3, Shield, Zap, Globe } from 'lucide-react';

const features = [
  { icon: CalendarDays, title: 'Agendamiento inteligente', desc: 'Gestiona citas fácilmente. Evita conflictos de horario automáticamente.' },
  { icon: Users, title: 'Multi-especialista', desc: 'Agrega tu equipo, asigna servicios y define comisiones por especialista.' },
  { icon: BarChart3, title: 'Reportes en tiempo real', desc: 'Ingresos, citas, comisiones y métricas clave de tu negocio.' },
  { icon: Shield, title: 'Multi-negocio seguro', desc: 'Cada negocio tiene sus datos completamente aislados y seguros.' },
  { icon: Zap, title: 'Rápido y fácil', desc: 'Interfaz intuitiva. Empieza a usar en minutos, sin capacitación.' },
  { icon: Globe, title: 'Acceso desde cualquier lugar', desc: 'Web app que funciona en móvil, tablet y escritorio.' },
];

const plans = [
  { name: 'Básico', price: '10', period: '€/mes', features: ['3 especialistas', '100 citas/mes', 'Reportes básicos'], color: 'border-gray-200' },
  { name: 'Pro', price: '30', period: '€/mes', features: ['10 especialistas', 'Citas ilimitadas', 'Reportes avanzados', 'Pagos online'], color: 'border-indigo-500', popular: true },
  { name: 'Premium', price: '60', period: '€/mes', features: ['Sin límites', 'API access', 'Reportes completos', 'Soporte prioritario'], color: 'border-purple-400' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">AgendaPro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Iniciar sesión</Link>
            <Link to="/register" className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
            Plataforma SaaS para negocios de servicios
          </span>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Gestiona citas y pagos<br />
            <span className="text-indigo-500">sin complicaciones</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Agenda citas, controla a tu equipo, cobra a tus clientes y ve crecer tu negocio. Todo en un solo lugar.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors shadow-lg shadow-indigo-200">
              Registra tu negocio gratis
            </Link>
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium px-6 py-3.5">
              Ver demo →
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Todo lo que necesita tu negocio</h2>
            <p className="text-gray-500 mt-3">Diseñado para peluquerías, spas, clínicas, fisioterapeutas y más</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Planes simples y transparentes</h2>
            <p className="text-gray-500 mt-3">Elige el plan que mejor se adapte a tu negocio</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl border-2 ${plan.color} p-6 relative ${plan.popular ? 'shadow-xl' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Más popular
                  </div>
                )}
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <div className="mt-3 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}€</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register"
                  className={`block text-center py-2.5 rounded-xl font-medium transition-colors ${plan.popular ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  Empezar gratis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Listo para organizar tu negocio?</h2>
          <p className="text-gray-500 mb-8">Únete a los negocios que ya usan AgendaPro para crecer</p>
          <Link to="/register" className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-indigo-200 inline-block">
            Crear mi cuenta gratis
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2025 AgendaPro · Sistema de citas y facturación para negocios
      </footer>
    </div>
  );
}
