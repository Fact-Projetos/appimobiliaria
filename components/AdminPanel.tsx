
import React, { useState, useEffect } from 'react';
import { Property, Client, Contact, CompanySettings } from '../types';
import { supabase } from '../lib/supabaseClient';
import PropertyForm from './admin/PropertyForm';
import ClientForm from './admin/ClientForm';
import MyDataForm from './admin/MyDataForm';

interface AdminPanelProps {
  onLogout: () => void;
  properties: Property[];
  onPropertiesUpdate: () => void;
  onSettingsUpdate: () => void;
  companySettings: CompanySettings | null;
}

type AdminTab = 'overview' | 'properties' | 'clients' | 'contacts' | 'my-data';

const menuItems = [
  {
    id: 'overview', label: 'Início', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )
  },
  {
    id: 'properties', label: 'Cadastro de Imóveis', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    )
  },
  {
    id: 'clients', label: 'Cadastro de Clientes', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )
  },
  {
    id: 'contacts', label: 'Contatos Plataforma', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    )
  },
  {
    id: 'my-data', label: 'Meus Dados', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    )
  },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, properties, onPropertiesUpdate, onSettingsUpdate, companySettings }) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Estado para controlar qual imóvel está sendo editado (null = criando novo)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Estado para lista de clientes
  const [clients, setClients] = useState<Client[]>([]);

  // Estado para lista de contatos do site
  const [contactsList, setContactsList] = useState<Contact[]>([]);

  // Carregar dados ao iniciar ou mudar de aba
  useEffect(() => {
    if (currentTab === 'clients' || currentTab === 'overview') {
      fetchClients();
    }
    if (currentTab === 'contacts') {
      fetchContacts();
    }
  }, [currentTab]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('id', { ascending: false });
      if (!error && data) {
        setClients(data as unknown as Client[]);
      }
    } catch (e) {
      console.log('Tabela clients possivelmente não existe ainda.');
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setContactsList(data as unknown as Contact[]);
      }
    } catch (e) {
      console.log('Tabela contacts possivelmente não existe ainda.');
    }
  };

  const deleteContact = async (id: number) => {
    if (confirm('Deseja excluir este contato?')) {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (!error) {
        setContactsList(contactsList.filter(c => c.id !== id));
      } else {
        alert('Erro ao excluir: ' + error.message);
      }
    }
  };

  const openWhatsApp = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    // Assume Brasil (55) se o número não tiver código de país e tiver tamanho típico (10 ou 11 dígitos)
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${finalPhone}`, '_blank');
  };

  const openEmail = (email: string) => {
    if (!email) return;
    window.open(`mailto:${email}`, '_blank');
  };

  // Função de Excluir Imóvel
  const handleDeleteProperty = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este imóvel permanentemente?')) {
      const { error } = await supabase.from('properties').delete().eq('id', parseInt(id));
      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        alert('Imóvel excluído com sucesso.');
        onPropertiesUpdate();
      }
    }
  };

  const handleEditClick = (property: Property) => {
    setEditingProperty(property);
    setIsAddingProperty(true);
  };

  const handleCreateClick = () => {
    setEditingProperty(null);
    setIsAddingProperty(true);
  };

  const generateContractDoc = (clientName: string, clientCpf: string, propertyName: string) => {
    const today = new Date();
    const startDate = today.toLocaleDateString('pt-BR');
    const endDateObj = new Date(today);
    endDateObj.setMonth(endDateObj.getMonth() + 30);
    const endDate = endDateObj.toLocaleDateString('pt-BR');
    const day = today.getDate();
    const month = today.toLocaleString('pt-BR', { month: 'long' });
    const year = today.getFullYear();
    const fullDate = `${day} de ${month} de ${year}`;
    const rentalValue = "R$ 2.300,00 (Dois mil e trezentos reais)";
    const guaranteeValue = "R$ 4.600,00 (Quatro mil e seiscentos reais)";

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Contrato de Locação</title>
        <style>
          body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; text-align: justify; margin: 20px; }
          h1 { text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .highlight { font-weight: bold; }
          p { margin-bottom: 10px; }
          .signature-box { margin-top: 50px; text-align: center; }
          .signature-line { border-top: 1px solid #000; width: 300px; margin: 0 auto; margin-top: 40px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <h1>CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL/COMERCIAL</h1>
        <p><span class="highlight">LOCADOR:</span> NASCIMENTO NEGÓCIOS IMOBILIÁRIOS (Representando o Proprietário), CNPJ 00.000.000/0001-00.</p>
        <p><span class="highlight">LOCATÁRIO:</span> ${clientName.toUpperCase()}, portador(a) do CPF sob o nº ${clientCpf}, residente e domiciliado(a) em ____________________________________________________________________.</p>
        <p><span class="highlight">IMÓVEL:</span> ${propertyName.toUpperCase()}.</p>
        <p><span class="highlight">PRAZO DA LOCAÇÃO:</span> 30 meses</p>
        <p><span class="highlight">INÍCIO:</span> ${startDate}</p>
        <p><span class="highlight">TÉRMINO:</span> ${endDate}</p>
        <p><span class="highlight">VALOR MENSAL:</span> ${rentalValue}.</p>
        <br/>
        <p>O LOCADOR e o LOCATÁRIO, acima qualificados, resolvem ajustar a locação do imóvel retro descrito.</p>
        <br/>
        <p style="text-align: right;">São Paulo, ${fullDate}.</p>
        <br/><br/>
        <div class="signature-box">
          <div class="signature-line">ASSINATURA LOCADOR</div>
          <div class="signature-line">ASSINATURA LOCATÁRIO<br/>(${clientName})</div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_${clientName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeItem = menuItems.find(i => i.id === currentTab);

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 fixed h-full z-30 hidden lg:flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#4A5D23] rounded-lg flex items-center justify-center text-white">
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 5L95 50L50 95L5 50L50 5Z" stroke="currentColor" strokeWidth="4" /></svg>
            </div>
            <div><h1 className="text-lg font-bold text-black tracking-tight leading-none">Admin</h1><p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Painel de Controle</p></div>
          </div>
          <nav className="space-y-2">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => { setCurrentTab(item.id as AdminTab); setIsAddingProperty(false); setIsAddingClient(false); }} className={`w-full flex items-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${currentTab === item.id ? 'bg-[#4A5D23] text-white shadow-lg shadow-[#4A5D23]/20' : 'text-gray-400 hover:bg-gray-50 hover:text-black'}`}><span className={`mr-3 ${currentTab === item.id ? 'text-white' : 'text-gray-400'}`}>{item.icon}</span>{item.label}</button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-50"><button onClick={onLogout} className="w-full flex items-center justify-center px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">Sair do Sistema</button></div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 p-8 lg:p-12">
        <div className="lg:hidden flex justify-between items-center mb-8"><div className="font-bold">Nascimento Admin</div><button onClick={onLogout} className="text-red-500 text-sm">Sair</button></div>

        {isAddingClient ? (
          <ClientForm
            properties={properties}
            onCancel={() => setIsAddingClient(false)}
            onSuccess={() => { setIsAddingClient(false); fetchClients(); }}
          />
        ) : isAddingProperty ? (
          <PropertyForm
            editingProperty={editingProperty}
            onCancel={() => setIsAddingProperty(false)}
            onSuccess={() => {
              setIsAddingProperty(false);
              setEditingProperty(null);
              onPropertiesUpdate();
            }}
          />
        ) : currentTab === 'my-data' ? (
          <MyDataForm onSuccess={onSettingsUpdate} />
        ) : (
          <>
            <header className="flex justify-between items-end mb-10 min-h-[50px]">
              <div>
                <h2 className="text-3xl font-light text-black mb-2">{activeItem ? activeItem.label : 'Início'}</h2>
                <p className="text-sm text-gray-400">Gerencie as informações do sistema.</p>
              </div>

              {currentTab === 'properties' && (
                <button onClick={handleCreateClick} className="bg-[#4A5D23] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Novo Imóvel
                </button>
              )}

              {currentTab === 'clients' && (
                <button onClick={() => setIsAddingClient(true)} className="bg-[#4A5D23] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Novo Cliente
                </button>
              )}
            </header>

            {currentTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Imóveis Ativos</h3><p className="text-4xl font-light text-black">{properties.length}</p></div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Propostas Pendentes</h3><p className="text-4xl font-light text-black">{clients.filter(c => c.status === 'Em análise').length}</p></div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Leads do Site</h3><p className="text-4xl font-light text-black">{contactsList.length}</p></div>
              </div>
            )}

            {currentTab === 'properties' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Imóvel</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {properties.length > 0 ? properties.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm font-medium">{p.title}</td>
                        <td className="p-4 text-sm text-gray-500">{p.operation}</td>
                        <td className="p-4 text-sm font-bold text-[#4A5D23]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p.price)}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wide">Ativo</span></td>
                        <td className="p-4 text-sm flex gap-3">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="text-gray-400 hover:text-[#4A5D23] transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum imóvel encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {currentTab === 'clients' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contato</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interesse</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contrato</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {clients.length > 0 ? clients.map(client => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm font-medium">{client.name}</td>
                        <td className="p-4 text-sm text-gray-500">{client.phone}<br />{client.email}</td>
                        <td className="p-4 text-sm text-gray-500">{client.property_interest || '-'}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wide">{client.status}</span></td>
                        <td className="p-4"><button onClick={() => generateContractDoc(client.name, client.cpf, client.property_interest)} className="text-[10px] font-bold uppercase tracking-widest text-[#4A5D23] hover:underline">Gerar DOC</button></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum cliente cadastrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {currentTab === 'contacts' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome / Contato</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Imóvel de Interesse</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mensagem</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contactsList.length > 0 ? contactsList.map(contact => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm text-gray-500">{new Date(contact.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-sm font-medium">{contact.name}<br /><span className="text-gray-400 font-normal">{contact.phone}</span> {contact.email && <span className="text-gray-400 font-normal">| {contact.email}</span>}</td>
                        <td className="p-4 text-sm text-gray-500">{contact.property_title || `#${contact.property_id}`}</td>
                        <td className="p-4 text-sm text-gray-500 max-w-xs">{contact.message}</td>
                        <td className="p-4 text-right flex gap-2 justify-end">
                          <button onClick={() => openWhatsApp(contact.phone)} className="text-green-600 hover:text-green-800 text-xs font-bold uppercase">WhatsApp</button>
                          {contact.email && <button onClick={() => openEmail(contact.email)} className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase">Email</button>}
                          <button onClick={() => deleteContact(contact.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase">Excluir</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum contato recebido.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
