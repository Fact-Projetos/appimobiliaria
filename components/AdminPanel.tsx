
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
    id: 'clients', label: 'Contratos', icon: (
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
  const [editingClient, setEditingClient] = useState<Client | null>(null);

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

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsAddingClient(true);
  };

  const handleDeleteClient = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato/cliente permanentemente?')) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        alert('Contrato excluído com sucesso.');
        fetchClients();
      }
    }
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

  const generateContractDoc = (client: Client) => {
    // Encontrar o imóvel relacionado para pegar valores de IPTU, condomínio, etc.
    const property = properties.find(p => p.title === client.property_interest);

    // Preparar dados
    const locatorName = client.locator_name || 'NASCIMENTO NEGÓCIOS IMOBILIÁRIOS';
    const locatorCpf = client.locator_cpf || '00.000.000/0001-00';
    const tenantName = client.name || '';
    const tenantCpf = client.cpf || '';

    const propType = property?.type || 'Imóvel';
    const propAddress = property
      ? `${property.street || ''}, ${property.number || ''}${property.complement ? `, ${property.complement}` : ''} - ${property.neighborhood || ''}, ${property.city || ''}/${property.state || ''}`
      : (client.property_interest || '-');

    const startDate = client.contract_start_date ? new Date(client.contract_start_date).toLocaleDateString('pt-BR') : '-';
    const endDate = client.contract_end_date ? new Date(client.contract_end_date).toLocaleDateString('pt-BR') : '-';
    const duration = client.contract_duration || 30;

    const rent = client.contract_value || property?.price || 0;
    const condo = property?.condoPrice || 0;
    const fire = property?.fireInsurance || 0;
    const iptu = property?.iptuPrice || 0;
    const service = property?.serviceCharge || 0;
    const totalValue = rent + condo + fire + iptu + service;
    const caucao = rent * 2;

    const dueDay = client.payment_due_day || 20;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const today = new Date();
    const fullDate = `${today.getDate()} de ${today.toLocaleString('pt-BR', { month: 'long' })} de ${today.getFullYear()}`;

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Contrato de Locação</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.2; text-align: justify; margin: 20px; }
          h1, h2, h3 { text-align: center; font-size: 14pt; font-weight: normal; text-transform: uppercase; margin-bottom: 5px; }
          .main-title { letter-spacing: 8px; font-size: 16pt; margin-bottom: 15px; }
          .highlight { font-weight: bold; }
          .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10pt; }
          .summary-table td { border: 1px solid black; padding: 3px 5px; vertical-align: middle; }
          .summary-header { background-color: #e5e7eb; font-weight: bold; text-align: center; font-size: 11pt; text-transform: uppercase; }
          .clause-title { font-weight: bold; margin-top: 12px; display: block; text-align: center; text-transform: uppercase; }
          .signature-box { margin-top: 40px; text-align: center; }
          .signature-line { border-top: 1px solid #000; width: 300px; margin: 0 auto; margin-top: 35px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 8px;">
          <h2 class="main-title">QUADRO DEMONSTRATIVO</h2>
        </div>

        <table class="summary-table">
          <tr class="summary-header">
            <td colspan="4">Informação das Partes</td>
          </tr>
          <tr style="font-weight: bold;">
            <td width="55%">Nome / Razão Social</td>
            <td width="30%" colspan="2">CPF / CNPJ</td>
            <td width="15%">Qualificação</td>
          </tr>
          <tr>
            <td>${locatorName}</td>
            <td colspan="2">${locatorCpf}</td>
            <td>Locador</td>
          </tr>
          <tr>
            <td>${tenantName}</td>
            <td colspan="2">${tenantCpf}</td>
            <td>Locatário</td>
          </tr>

          <tr class="summary-header">
            <td colspan="4">Informações do Imóvel</td>
          </tr>
          <tr style="font-weight: bold;">
            <td width="20%">Tipo do Imóvel</td>
            <td width="55%" colspan="2">Endereço do Imóvel</td>
            <td width="25%">Finalidade</td>
          </tr>
          <tr>
            <td>${propType}</td>
            <td colspan="2">${propAddress}</td>
            <td>Residencial</td>
          </tr>

          <tr class="summary-header">
            <td colspan="4">Informações de Vigência</td>
          </tr>
          <tr style="font-weight: bold;">
            <td width="30%">Data Inicial</td>
            <td width="40%" colspan="2">Data Final</td>
            <td width="30%">Total em Meses</td>
          </tr>
          <tr>
            <td style="text-align: center;">${startDate}</td>
            <td colspan="2" style="text-align: center;">${endDate}</td>
            <td style="text-align: center;">${duration} meses</td>
          </tr>

          <tr class="summary-header">
            <td colspan="4">Informações de Valores e Vencimentos</td>
          </tr>
          <tr style="font-weight: bold;">
            <td width="20%">Descrição</td>
            <td width="20%">Valor</td>
            <td width="60%" colspan="2">Fatura Vencimento</td>
          </tr>
          <tr>
            <td>Aluguel</td>
            <td style="text-align: right;">${formatCurrency(rent)}</td>
            <td colspan="2" rowspan="6" style="text-align: center; vertical-align: middle;">
              ${dueDay} de cada mês
            </td>
          </tr>
          <tr>
            <td>Condomínio</td>
            <td style="text-align: right;">${formatCurrency(condo)}</td>
          </tr>
          <tr>
            <td>Seguro Incêndio</td>
            <td style="text-align: right;">${formatCurrency(fire)}</td>
          </tr>
          <tr>
            <td>IPTU</td>
            <td style="text-align: right;">${formatCurrency(iptu)}</td>
          </tr>
          <tr>
            <td>Taxa de Serviços</td>
            <td style="text-align: right;">${formatCurrency(service)}</td>
          </tr>
          <tr style="font-weight: bold;">
            <td>Total geral</td>
            <td style="text-align: right;">${formatCurrency(totalValue)}</td>
          </tr>
        </table>

        <p>O LOCADOR e o LOCATÁRIO, acima qualificados, resolvem ajustar a locação do imóvel retro descrito, que ora contratam, sob as cláusulas e condições seguintes:</p>

        <p><span class="clause-title">CLÁUSULA PRIMEIRA</span>
        <p>
        A locação vigerá pelo período estabelecido no preâmbulo deste instrumento, devendo o LOCATÁRIO restituí-lo, findo o prazo, independente de notificação judicial ou extrajudicial.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA SEGUNDA</span>
        <p>
        O valor mensal da locação será aquele pactuado no preâmbulo deste instrumento, e os aluguéis serão reajustados na periodicidade também retro mencionada, ou no menor período que a legislação vier a permitir, com base no índice IPCA\\IBGE.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA TERCEIRA</span>
        <p>      
        O aluguel será exigível, impreterivelmente, no dia do vencimento, supra estabelecido, devendo o pagamento ser efetuado por transferência bancária na conta <span class="highlight">POUPANÇA:1039808-8, AGÊNCIA 0354 BANCO BRADESCO</span>, ou outro que lhe seja fixado por escrito. O pagamento após o prazo de vencimento implica na multa de mora de 2% DOIS POR CENTO mais juros de correção pela taxa SELIC sobre o débito.
        <br/>
        <p> 
        Parágrafo único: A eventual tolerância em qualquer atraso ou demora no pagamento de aluguéis, impostos, taxas, seguro, ou demais encargos de responsabilidade do LOCATÁRIO, em hipótese alguma poderá ser considerada como modificação das condições do contrato, que permanecerão em vigor para todos os efeitos.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA QUARTA</span>
        <p>
        Além do aluguel são encargos do LOCATÁRIO o imposto predial (IPTU), o seguro de incêndio, a taxa de luz, força, saneamento, esgoto, condomínio e quaisquer outras que recaiam ou venham a recair sobre o imóvel locado, que serão pagas às repartições arrecadadoras respectivas. Incumbe ao LOCATÁRIO, também, satisfazer por sua conta as exigências das autoridades sanitárias de higiene, ou do condomínio.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA QUINTA</span>
        <p>
        O LOCATÁRIO não poderá sublocar, no seu todo ou em parte, o imóvel, e dele usará de forma a não prejudicar as condições estéticas e de segurança, moral, bem como a tranquilidade e o bem-estar dos vizinhos.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA SEXTA</span>
        <p>
        O LOCATÁRIO recebe o imóvel, em perfeito estado de conservação, e obriga-se pela sua conservação, trazendo-o sempre nas mesmas condições, responsabilizando-se pela imediata reparação de qualquer estrago feito por si, seus prepostos ou visitantes, obrigando-se, ainda, a restituí-lo, quando finda a locação, ou rescindida esta, com pintura usada, porém conservado, com todas as instalações em funcionamento. Sendo necessário substituir qualquer aparelho ou peça de instalação, fica entendido que esta substituição se fará por outra da mesma qualidade, de forma que, quando forem entregues as chaves, esteja o imóvel em condições de ser novamente alugado, sem que para isso seja necessária qualquer despesa por parte do LOCADOR.
        <br/>
        <p> 
        Parágrafo único: O LOCADOR, por si ou por preposto, poderá visitar o imóvel, durante a locação, para verificar o exato cumprimento das cláusulas deste contrato.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA SÉTIMA</span>
        <p>
        A infração de qualquer das cláusulas deste contrato faz incorrer o infrator na multa irredutível no valor da caução de <span class="highlight">${formatCurrency(caucao)}</span> ou parcial, sobre o aluguel anual em vigor à época da infração, e importa na sua rescisão de pleno direito, independentemente de qualquer notificação ou aviso, sujeitando-se a parte inadimplente ao pagamento das perdas e danos que forem apuradas.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA OITAVA</span>
        <p>
        Nenhuma obra ou modificação será feita no imóvel sem autorização prévia e escrita do LOCADOR. Qualquer benfeitoria porventura construída adere ao imóvel, renunciando o LOCATÁRIO, expressamente, ao direito de retenção ou de indenização, salvo se convier ao LOCADOR que tudo seja reposto no anterior estado, cabendo, neste caso, ao LOCATÁRIO fazer a reposição por sua conta, responsabilizando-se por aluguéis, tributos e encargos até a conclusão da obra.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA NONA</span>
        <p>
        Como garantia do cumprimento das obrigações pactuadas a caução no valor de 2 aluguéis no valor de <span class="highlight">${formatCurrency(caucao)}</span>, será a forma de seguro podendo ultrapassar esse valor caso esse valor não cubra as despesas no final do contrato, feitas pelo locatário, qualificados no preâmbulo deste instrumento, responsabilizando-se, como principais pagadores, pelo fiel cumprimento de todas as cláusulas ora reciprocamente estipuladas e aceitas, inclusive indenização de danos no imóvel e reparos necessários, além dos ônus judiciais respectivos.
        <br/>
        <p> 
        Parágrafo 1° O LOCADOR pode ser cientificado ou citado para a ação de despejo contra o LOCATARIO, obrigando-se, inclusive, às despesas judiciais, acessórias da dívida principal, e honorários de advogado, no importe definido por ambas as partes sobre o valor da causa, quer quanto à ação de despejo, quer quanto à execução de aluguéis, tributos e demais encargos.
        <br/>
        <p> 
        Parágrafo 2° A responsabilidade do LOCATÁRIO pelo aluguel e demais obrigações legais e contratuais só terminará com a devolução definitiva das chaves e quitação de todos os débitos de locação e os consectários legais e contratuais, inclusive reparos, se necessários.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA DÉCIMA</span>
        <p>
        É de responsabilidade do LOCATÁRIO o pagamento do seguro anual de incêndio do imóvel locado, em nome do LOCADOR, garantindo o seu valor real.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA DÉCIMA PRIMEIRA</span>
        <p>
        Na hipótese de ser necessária qualquer medida judicial, o LOCADOR e LOCATÁRIO poderão ser citados pelo correio, com Aviso de Recebimento dirigido aos respectivos endereços mencionados no preâmbulo deste instrumento.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA DÉCIMA SEGUNDA</span>
        <p>
        O foro deste contrato, é o da Comarca de <span class="highlight">BARUERI-SP</span>.</p>
        <p> 

        <p><span class="clause-title">CLÁUSULA DÉCIMA TERCEIRA</span>
        <p>
        O LOCADOR poderá solicitar a desocupação do imóvel em caso de venda, conforme previsto no artigo 27 da Lei nº 8.245/1991. Para tanto, o LOCADOR deverá notificar o LOCATÁRIO com antecedência mínima de 90 dias, por escrito, especificando a intenção de venda e a necessidade de desocupação.
        <br/>
        <p> 
        Caso o LOCATÁRIO não desocupe o imóvel dentro do prazo estipulado, o LOCADOR poderá ingressar com ação de despejo, conforme previsto na Lei do Inquilinato, sem que haja necessidade de qualquer outra indenização ao LOCADOR.</p>

        <p>E por estarem justos e contratados, lavraram o presente instrumento em via única.</p>
        
        <p style="text-align: left;">Barueri, ${fullDate}.</p>

        <div class="signature-box">
          <div class="signature-line">ASSINATURA LOCADOR<br/>(${locatorName})</div>
          <p>
          <p>
          <p>
          <p>
          <div class="signature-line">ASSINATURA LOCATÁRIO<br/>(${tenantName})</div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_${tenantName.replace(/\\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeItem = menuItems.find(i => i.id === currentTab);

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden font-sans">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-6 flex flex-col animate-slide-in">
            <div className="flex justify-between items-center mb-8">
              <div className="font-bold text-lg">Menu</div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Fechar menu"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <nav className="space-y-2 flex-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id as AdminTab);
                    setIsAddingProperty(false);
                    setIsAddingClient(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${currentTab === item.id ? 'bg-[#4A5D23] text-white shadow-lg shadow-[#4A5D23]/20' : 'text-gray-400 hover:bg-gray-50 hover:text-black'}`}
                >
                  <span className={`mr-3 ${currentTab === item.id ? 'text-white' : 'text-gray-400'}`}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-50">
              <button onClick={onLogout} className="w-full flex items-center justify-center px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                Sair do Sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar (Desktop) */}
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
      <main className="flex-1 lg:ml-72 p-4 lg:p-12 pb-20 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Abrir menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="font-bold text-gray-800">Nascimento Admin</div>
          </div>
          <div className="w-8 h-8 bg-[#4A5D23] rounded-lg flex items-center justify-center text-white">
            <span className="font-bold text-xs">NA</span>
          </div>
        </div>

        {isAddingClient ? (
          <ClientForm
            properties={properties}
            editingClient={editingClient}
            onCancel={() => { setIsAddingClient(false); setEditingClient(null); }}
            onSuccess={() => { setIsAddingClient(false); setEditingClient(null); fetchClients(); }}
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
            <header className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-light text-black mb-2">{activeItem ? activeItem.label : 'Início'}</h2>
                <p className="text-sm text-gray-400">Gerencie as informações do sistema.</p>
              </div>

              {currentTab === 'properties' && (
                <button onClick={handleCreateClick} className="bg-[#4A5D23] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 w-full md:w-auto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Novo Imóvel
                </button>
              )}

              {currentTab === 'clients' && (
                <button onClick={() => { setEditingClient(null); setIsAddingClient(true); }} className="bg-[#4A5D23] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 w-full md:w-auto">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Imóvel</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proprietário</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {properties.length > 0 ? properties.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm font-medium">{p.title}</td>
                        <td className="p-4 text-sm text-gray-500">
                          {p.ownerName ? p.ownerName.split(' ')[0] : '-'}<br />
                          <span className="text-[10px] font-normal text-gray-400">{p.ownerPhone || '-'}</span>
                        </td>
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contato</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interesse</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contrato</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {clients.length > 0 ? clients.map(client => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm font-medium">{client.name}</td>
                        <td className="p-4 text-sm text-gray-500">{client.phone}<br />{client.email}</td>
                        <td className="p-4 text-sm text-gray-500">{client.property_interest || '-'}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wide">{client.status}</span></td>
                        <td className="p-4"><button onClick={() => generateContractDoc(client)} className="text-[10px] font-bold uppercase tracking-widest text-[#4A5D23] hover:underline">Gerar DOC</button></td>
                        <td className="p-4 text-sm flex gap-3">
                          <button
                            onClick={() => handleEditClient(client)}
                            className="text-gray-400 hover:text-[#4A5D23] transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClient(Number(client.id))}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum cliente cadastrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {currentTab === 'contacts' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
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
