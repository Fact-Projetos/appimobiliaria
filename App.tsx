
import React, { useState, useMemo, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { MOCK_PROPERTIES } from './constants';
import { Filters, Property, PropertyType, OperationType, CompanySettings } from './types';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import PropertyCard from './components/PropertyCard';
import PropertyDetails from './components/PropertyDetails';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [session, setSession] = useState<Session | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  // Inicia vazio e carrega do Supabase
  const [properties, setProperties] = useState<Property[]>([]);

  const [filters, setFilters] = useState<Filters>({
    city: '',
    neighborhood: '',
    type: '',
    bedrooms: '',
    priceRange: '',
    operation: 'Todos'
  });

  useEffect(() => {
    fetchProperties();
    fetchCompanySettings();

    // Verificar sessão ativa ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });

      if (error) {
        console.error('Erro Supabase ao buscar imóveis:', error);
        setDbError(true);
        // Se a tabela não existir, mantemos os Mocks para demonstração
        return;
      }

      setDbError(false);
      // IMPORTANTE: Se a conexão for bem sucedida (data existe), usamos os dados do banco,
      // mesmo que seja um array vazio []. Isso remove os Mocks e mostra o estado real.
      if (data) {
        console.log("Imóveis carregados do Supabase:", data);
        const mappedProperties: Property[] = data.map((item) => ({
          id: item.id?.toString() || '',
          title: item.title || 'Sem Título',
          type: (item.type || 'Casa') as PropertyType,
          operation: (item.operation || 'Venda') as OperationType,
          price: Number(item.price || 0),
          condoPrice: Number(item.condo_price || 0),
          iptuPrice: Number(item.iptu_price || 0),
          city: item.city || '',
          neighborhood: item.neighborhood || '',
          street: item.street || '',
          description: item.description || '',
          bedrooms: Number(item.bedrooms || 0),
          bathrooms: Number(item.bathrooms || 0),
          parkingSpaces: Number(item.parking_spaces || 0),
          area: Number(item.area || 0),
          imageUrl: item.image_url || 'https://via.placeholder.com/800x600?text=Sem+Imagem',
          galleryUrls: item.gallery_urls || '',
          inspectionUrls: item.inspection_urls || ''
        }));
        setProperties(mappedProperties);
      }
    } catch (err) {
      console.error('Erro de conexão/fetch:', err);
      setDbError(true);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      console.log('Buscando configurações da empresa...');
      const { data, error } = await supabase.from('company_settings').select('*');

      if (error) {
        console.error('Erro Supabase (company_settings):', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('Configurações carregadas:', data[0]);
        setCompanySettings(data[0] as unknown as CompanySettings);
      } else {
        console.warn('Nenhuma configuração de empresa encontrada no banco.');
      }
    } catch (err) {
      console.error('Erro fatal ao carregar configurações:', err);
    }
  };

  const handleNav = (tab: string) => {
    fetchCompanySettings();
    setActiveTab(tab);
    setSelectedProperty(null); // Reset selection when navigating
    if (tab === 'buy-sell') {
      setFilters(prev => ({ ...prev, operation: 'Venda' }));
    } else if (tab === 'rent') {
      setFilters(prev => ({ ...prev, operation: 'Aluguel' }));
    } else if (tab === 'home') {
      setFilters(prev => ({ ...prev, operation: 'Todos' }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    setLoginError('');
    setLoginSuccess('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        console.error("Erro login:", error);
        if (error.status === 400) {
          setLoginError('Credenciais inválidas. Verifique seu e-mail e senha.');
        } else {
          setLoginError(error.message);
        }
      } else {
        setLoginForm({ email: '', password: '' });
      }
    } catch (err) {
      setLoginError('Ocorreu um erro inesperado ao tentar entrar.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email) {
      setLoginError('Por favor, informe seu e-mail para recuperação.');
      return;
    }

    setLoadingLogin(true);
    setLoginError('');
    setLoginSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginForm.email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        setLoginError(error.message);
      } else {
        setLoginSuccess('Instruções de recuperação enviadas para o seu e-mail.');
        // Opcional: voltar para tela de login após alguns segundos
        setTimeout(() => setIsForgotPassword(false), 5000);
      }
    } catch (err) {
      setLoginError('Erro ao tentar enviar e-mail de recuperação.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      if (filters.operation !== 'Todos' && property.operation !== filters.operation) return false;
      if (filters.city && property.city !== filters.city) return false;
      if (filters.neighborhood && property.neighborhood !== filters.neighborhood) return false;
      if (filters.type && property.type !== filters.type) return false;
      if (filters.bedrooms && property.bedrooms < parseInt(filters.bedrooms)) return false;

      if (filters.priceRange) {
        const [minStr, maxStr] = filters.priceRange.split('-');
        const min = parseInt(minStr);
        if (filters.priceRange.includes('+')) {
          if (property.price < min) return false;
        } else {
          const max = parseInt(maxStr);
          if (property.price < min || property.price > max) return false;
        }
      }
      return true;
    });
  }, [filters, properties]);

  const renderContent = () => {
    if (activeTab === 'admin') {
      if (session) {
        return (
          <AdminPanel
            onLogout={handleLogout}
            properties={properties}
            onPropertiesUpdate={fetchProperties}
            onSettingsUpdate={fetchCompanySettings}
            companySettings={companySettings}
          />
        );
      }

      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 animate-fadeIn">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 flex items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5L95 50L50 95L5 50L50 5Z" stroke="#4A5D23" strokeWidth="2" strokeMiterlimit="10" />
                  <rect x="35" y="45" width="4" height="25" fill="#000000" />
                  <rect x="42" y="35" width="4" height="35" fill="#4A5D23" />
                  <rect x="49" y="30" width="4" height="40" fill="#000000" />
                  <rect x="56" y="35" width="4" height="35" fill="#4A5D23" />
                  <rect x="63" y="45" width="4" height="25" fill="#000000" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-center text-black">
              {isForgotPassword ? 'Recuperar Senha' : 'Acesso Restrito'}
            </h2>
            <p className="text-center text-gray-400 text-sm mb-8">
              {isForgotPassword ? 'Enviaremos um link para o seu e-mail' : 'Identifique-se para gerenciar a plataforma'}
            </p>

            <form className="space-y-5" onSubmit={isForgotPassword ? handleForgotPassword : handleLogin}>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">E-mail</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-[#4A5D23] focus:bg-white transition-all text-sm"
                  placeholder="admin@exemplo.com"
                  required
                />
              </div>

              {!isForgotPassword && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Senha</label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-[#4A5D23] focus:bg-white transition-all text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              {loginError && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-xs font-medium p-3 rounded-lg text-center animate-shake">
                  {loginError}
                </div>
              )}

              {loginSuccess && (
                <div className="bg-green-50 border border-green-100 text-green-600 text-xs font-medium p-3 rounded-lg text-center">
                  {loginSuccess}
                </div>
              )}

              <button
                disabled={loadingLogin}
                className="w-full bg-[#4A5D23] text-white font-bold py-4 rounded-xl uppercase tracking-widest mt-4 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 disabled:opacity-70"
              >
                {loadingLogin ? 'Processando...' : (isForgotPassword ? 'Enviar E-mail' : 'Entrar no Painel')}
              </button>

              {isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setLoginError('');
                    setLoginSuccess('');
                  }}
                  className="w-full text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                >
                  Voltar para o Login
                </button>
              )}
            </form>
          </div>
        </div>
      );
    }

    if (selectedProperty) {
      return (
        <PropertyDetails
          property={selectedProperty}
          onBack={() => setSelectedProperty(null)}
        />
      );
    }

    return (
      <div className="bg-[#fcfcfc] min-h-screen">
        {/* Intro Section - Compact */}
        <div className="bg-white border-b border-gray-50 pt-10 pb-6 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-sm font-bold text-[#4A5D23] uppercase tracking-[0.3em] mb-3">Encontre seu novo lar</h2>
            <h3 className="text-3xl md:text-4xl font-light text-black tracking-tight mb-8">Curadoria exclusiva de <span className="font-bold underline decoration-[#4A5D23]/30">imóveis de luxo</span></h3>
            {dbError && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-lg text-xs inline-block">
                Aviso: Conexão com banco de dados pendente. Exibindo dados de exemplo. (Admin: Verifique se executou o script SQL)
              </div>
            )}
          </div>
        </div>

        {/* Filter Section - Now at the Top */}
        <div className="px-4 -mt-4 relative z-20">
          <FilterBar filters={filters} setFilters={setFilters} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-2xl font-light text-black tracking-tight">
                {filters.operation === 'Venda' ? 'Imóveis para ' : filters.operation === 'Aluguel' ? 'Opções de ' : 'Destaques em '}
                <span className="font-bold">{filters.operation === 'Todos' ? 'Portfólio' : filters.operation}</span>
              </h2>
              <div className="h-1 w-16 bg-[#4A5D23] mt-3 rounded-full" />
            </div>

            <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner">
              {(['Todos', 'Venda', 'Aluguel'] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setFilters(f => ({ ...f, operation: op }))}
                  className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filters.operation === op ? 'bg-white text-[#4A5D23] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={handlePropertyClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Nenhum imóvel encontrado</h3>
              <p className="text-gray-400 text-sm mt-1">
                {session ? 'O banco de dados está vazio. Adicione um imóvel no painel Admin.' : 'Ajuste os filtros acima para ver outras opções disponíveis.'}
              </p>
              <button
                onClick={() => setFilters({ city: '', neighborhood: '', type: '', bedrooms: '', priceRange: '', operation: 'Todos' })}
                className="mt-6 text-[#4A5D23] font-bold text-[10px] uppercase tracking-[0.2em] border-b-2 border-[#4A5D23] pb-1 hover:text-black hover:border-black transition-colors"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc]">
      <Header onNav={handleNav} activeTab={activeTab} companySettings={companySettings} />

      <main className="flex-grow">
        {renderContent()}
      </main>

      {activeTab !== 'admin' && <Footer companySettings={companySettings} />}
    </div>
  );
};

export default App;
