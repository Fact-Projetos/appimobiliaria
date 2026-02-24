import React, { useState, useEffect } from 'react';

import { supabase } from '../lib/supabaseClient';
import PropertyForm from './admin/PropertyForm';
import ClientForm from './admin/ClientForm';
import MyDataForm from './admin/MyDataForm';
import IncomeReportForm from './admin/IncomeReportForm';
import { Property, Client, Contact, CompanySettings, IncomeReport } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
  properties: Property[];
  onPropertiesUpdate: () => void;
  onSettingsUpdate: () => void;
  companySettings: CompanySettings | null;
}

type AdminTab = 'overview' | 'properties' | 'clients' | 'income-reports' | 'contacts' | 'my-data';

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
    id: 'income-reports', label: 'Informe de Rendimentos', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
  const [isAddingIncomeReport, setIsAddingIncomeReport] = useState(false);
  const [editingIncomeReport, setEditingIncomeReport] = useState<IncomeReport | null>(null);

  // Estado para controlar qual imóvel está sendo editado (null = criando novo)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Estado para lista de clientes
  const [clients, setClients] = useState<Client[]>([]);

  // Estado para lista de contatos do site
  const [contactsList, setContactsList] = useState<Contact[]>([]);

  // Estado para lista de informes
  const [incomeReports, setIncomeReports] = useState<IncomeReport[]>([]);

  // Carregar dados ao iniciar ou mudar de aba
  useEffect(() => {
    if (currentTab === 'clients' || currentTab === 'overview') {
      fetchClients();
    }
    if (currentTab === 'contacts') {
      fetchContacts();
    }
    if (currentTab === 'income-reports') {
      fetchIncomeReports();
    }
  }, [currentTab]);

  const fetchIncomeReports = async () => {
    try {
      const { data, error } = await (supabase as any).from('income_reports').select('*').order('id', { ascending: false });
      if (!error && data) {
        setIncomeReports(data as unknown as IncomeReport[]);
      }
    } catch (e) {
      console.log('Tabela income_reports possivelmente não existe ainda.');
    }
  };

  const deleteIncomeReport = async (id: number) => {
    if (confirm('Deseja excluir este informe?')) {
      const { error } = await (supabase as any).from('income_reports').delete().eq('id', id);
      if (!error) {
        setIncomeReports(incomeReports.filter(r => r.id !== id));
      } else {
        alert('Erro ao excluir: ' + error.message);
      }
    }
  };

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

  const getContractHTML = (client: Client) => {
    // Encontrar o imóvel relacionado para pegar valores de IPTU, condomínio, etc.
    const property = properties.find(p =>
      p.title.trim().toLowerCase() === client.property_interest?.trim().toLowerCase() ||
      p.id === client.property_interest
    );

    // Preparar dados
    const locatorName = client.locator_name || 'NASCIMENTO NEGÓCIOS IMOBILIÁRIOS';
    const locatorCpf = client.locator_cpf || '00.000.000/0001-00';
    const tenantName = client.name || '';
    const tenantCpf = client.cpf || '';

    const propType = property?.type || 'Imóvel';
    const propAddress = property
      ? `${property.street || ''}, ${property.number || ''}${property.complement ? `, ${property.complement}` : ''} - ${property.neighborhood || ''}, ${property.city || ''}/${property.state || ''}`
      : (client.property_interest || '-');

    const formatDate = (dateStr: string | undefined | null) => {
      if (!dateStr) return '-';
      // Se vier no formato YYYY-MM-DD
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      // Fallback para outros formatos
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      } catch (e) {
        return dateStr;
      }
    };

    const startDate = formatDate(client.contract_start_date);
    const endDate = formatDate(client.contract_end_date);
    const duration = client.contract_duration || '-';

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

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Contrato de Locação</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.2; text-align: justify; margin: 20px; }
          h1, h2, h3 { text-align: center; font-size: 14pt; font-weight: normal; text-transform: uppercase; margin-bottom: 8px; }
          .main-title { letter-spacing: 8px; font-size: 16pt; margin-bottom: 20px; text-align: center; }
          .highlight { font-weight: bold; }
          .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 0px; font-size: 10pt; }
          .summary-table td { border: 1px solid black; padding: 2px 5px; vertical-align: middle; }
          .summary-header { background-color: #e5e7eb; font-weight: bold; text-align: center; font-size: 11pt; text-transform: uppercase; }
          .clause-title { font-weight: bold; margin-top: 14px; margin-bottom: 8px; text-align: center; text-transform: uppercase; display: block; width: 100%; }
          .clause-text { text-align: justify; margin-bottom: 10px; text-indent: 2.0cm; }
          .italic-paragraph { font-style: italic; }
          .title-separator { border-bottom: 1.5pt solid black; padding-bottom: 5px; margin-bottom: 15px; }
          .signature-box { margin-top: 40px; text-align: center; }
          .signature-line { border-top: 1px solid #000; width: 300px; margin: 0 auto; margin-top: 35px; padding-top: 5px; }
          @media print {
            body { margin: 0; padding: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 6px;">
          <div class="title-separator">
            <h2 class="main-title" style="margin-bottom: 0;">CONTRATO DE LOCAÇÃO</h2>
          </div>
          <h2 class="main-title">QUADRO DEMONSTRATIVO</h2>
        </div>

        <table class="summary-table">
          <tr class="summary-header"><td colspan="3">Informação das Partes</td></tr>
          <tr style="font-weight: bold;">
            <td width="55%">Nome / Razão Social</td>
            <td width="30%">CPF / CNPJ</td>
            <td width="15%">Qualificação</td>
          </tr>
          <tr><td>${locatorName}</td><td>${locatorCpf}</td><td style="text-align: center;">Locador</td></tr>
          <tr><td>${tenantName}</td><td>${tenantCpf}</td><td style="text-align: center;">Locatário</td></tr>
        </table>

        <table class="summary-table" style="border-top: none;">
          <tr class="summary-header"><td colspan="4">Informações do Imóvel</td></tr>
          <tr style="font-weight: bold;">
            <td width="15%">Tipo do Imóvel</td>
            <td width="50%">Endereço do Imóvel</td>
            <td width="15%">Finalidade</td>
            <td width="20%">Condições do Imóvel</td>
          </tr>
          <tr>
            <td style="text-align: center;">${propType}</td>
            <td>${propAddress}</td>
            <td style="text-align: center;">Residencial</td>
            <td style="text-align: center;">${client.property_conditions || '-'}</td>
          </tr>
        </table>

        <table class="summary-table" style="border-top: none;">
          <tr class="summary-header"><td colspan="4">Informações de Vigência</td></tr>
          <tr style="font-weight: bold; text-align: center;">
            <td width="25%">Data Inicial</td>
            <td width="25%">Data Final</td>
            <td width="25%">Total em Meses</td>
            <td width="25%">Garantia Locatícia</td>
          </tr>
          <tr style="text-align: center;">
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${duration}${duration !== '-' ? ' meses' : ''}</td>
            <td>${client.rental_warranty || '-'}</td>
          </tr>
        </table>

        <table class="summary-table" style="border-top: none;">
          <tr class="summary-header"><td colspan="3">Informações de Valores e Vencimentos</td></tr>
          <tr style="font-weight: bold;">
            <td width="40%">Descrição</td>
            <td width="30%">Valor</td>
            <td width="30%">Fatura Vencimento</td>
          </tr>
          <tr>
            <td>Aluguel</td>
            <td style="text-align: right;">${formatCurrency(rent)}</td>
            <td rowspan="6" style="text-align: center; vertical-align: middle;">
              ${dueDay} de cada mês
            </td>
          </tr>
          <tr>
            <td>Condomínio [${client.condo_variation || 'Sem Variação'}]</td>
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

        <p class="clause-text">O LOCADOR e o LOCATÁRIO, acima qualificados, resolvem ajustar a locação do imóvel retro descrito, que ora contratam, sob as cláusulas e condições seguintes:</p>

        <div class="clause-title">CLÁUSULA PRIMEIRA – DA VIGÊNCIA</div>
        <p class="clause-text">A locação vigerá pelo período estabelecido no preâmbulo deste instrumento, devendo o LOCATÁRIO restituí-lo, findo o prazo, independente de notificação judicial ou extrajudicial.</p>

        <div class="clause-title">CLÁUSULA SEGUNDA - DO VALOR MENSAL E REAJUSTE</div>
        <p class="clause-text">O valor mensal da locação será aquele pactuado no preâmbulo deste instrumento, e os aluguéis serão reajustados na periodicidade também retro mencionada, ou no menor período que a legislação vier a permitir, com base no índice IPCA\\IBGE.</p>

        <div class="clause-title">CLÁUSULA TERCEIRA – DAS CONDIÇOES DE PAGAMENTO</div>
        <p class="clause-text">O aluguel será exigível, impreterivelmente, no dia do vencimento, supra estabelecido, devendo o pagamento ser efetuado por transferência bancária ou via PIX, outro que lhe seja fixado por escrito. O pagamento após o prazo de vencimento implica na multa de mora de 2% DOIS POR CENTO mais juros de correção pela taxa SELIC sobre o débito.</p>
        
        <p class="clause-text italic-paragraph">Parágrafo único: A eventual tolerância em qualquer atraso ou demora no pagamento de aluguéis, impostos, taxas, seguro, ou demais encargos de responsabilidade do LOCATÁRIO, em hipótese alguma poderá ser considerada como modificação das condições do contrato, que permanecerão em vigor para todos os efeitos.</p>

        <div class="clause-title">CLÁUSULA QUARTA – DAS VARIAÇÕES</div>
        <p class="clause-text">O Inquilino tem conhecimento de que os valores dos encargos locatícios previstos no Quadro Resumo são apenas referenciais, podendo sofrer alterações, pois são definidos por terceiros (por exemplo: pelo Poder Público, no caso do IPTU; pelo condomínio, no caso da taxa condominial). Em qualquer hipótese, o Inquilino tem conhecimento de que é sua a responsabilidade pagar a integralidade de tais encargos, podendo ser reembolsado pelo Locador caso pague valores por ele devidos.</p>

        <div class="clause-title">CLÁUSULA QUINTA -DA OBRIGAÇÃO DO INQUILINO</div>
        <p class="clause-text">O LOCATÁRIO não poderá sublocar, no seu todo ou em parte, o imóvel, e dele usará de forma a não prejudicar as condições estéticas e de segurança, moral, bem como a tranquilidade e o bem-estar dos vizinhos.</p>

        <div class="clause-title">CLÁUSULA SEXTA – DAS CONDIÇÕES DO IMÓVEL</div>
        <p class="clause-text">O LOCATÁRIO recebe o imóvel, em perfeito estado de conservação, e obriga-se pela sua conservação, trazendo-o sempre nas mesmas condições, responsabilizando-se pela imediata reparação de qualquer estrago feito por si, seus prepostos ou visitors, obrigando-se, ainda, a restituí-lo, quando finda a locação, ou rescindida esta, com pintura usada, porém conservado, com todas as instalações em funcionamento. Sendo necessário substituir qualquer aparelho ou peça de instalação, fica entendido que esta substituição se fará por outra da mesma qualidade, de forma que, quando forem entregues as chaves, esteja o imóvel em condições de ser novamente alugado, sem que para isso seja necessária qualquer despesa por parte do LOCADOR.</p>
        

        <div class="clause-title">CLÁUSULA SÉTIMA – RESIDENTES DO IMÓVEL</div>
        <p class="clause-text">No imóvel terão os seguintes residentes:</p>
        ${client.residents ? client.residents.split('\n').map(r => `<p class="clause-text" style="margin-left: 2.0cm; margin-bottom: 2px;">${r.trim()}</p>`).join('') : '<p class="clause-text">Nenhum residente adicional informado.</p>'}
        
        <p class="clause-text italic-paragraph">Parágrafo único: O locatário ou o(s) residente(s) do imóvel poderão autorizar outros moradores sem prévia autorização de ambas as partes.</p>

        <div class="clause-title">CLÁUSULA OITAVA – DAS MODIFICAÇÕES NO IMÓVEL</div>
        <p class="clause-text">Nenhuma obra ou modificação será feita no imóvel sem autorização prévia e escrita do LOCADOR. Qualquer benfeitoria porventura construída adere ao imóvel, renunciando o LOCATÁRIO, expressamente, ao direito de retenção ou de indenização, salvo se convier ao LOCADOR que tudo seja reposto no anterior estado, cabendo, neste caso, ao LOCATÁRIO fazer a reposição por sua conta, responsabilizando-se por aluguéis, tributos e encargos até a conclusão da obra.</p>

        <div class="clause-title">CLÁUSULA NONA – DA GARANTIA LOCATÍCIA</div>
        ${client.rental_warranty === 'Seguro Fiança' ? `
          <p class="clause-text">Para garantia do fiel cumprimento de todas as obrigações assumidas neste contrato, o LOCATÁRIO apresentará, antes da entrega das chaves, Seguro Fiança Locatícia, contratado junto a seguradora devidamente autorizada pela SUSEP.</p>
          <p class="clause-text">O seguro deverá:</p>
          <p class="clause-text">I. Garantir o pagamento dos aluguéis, encargos da locação, multas contratuais, danos ao imóvel e demais obrigações previstas neste contrato;</p>
          <p class="clause-text">II. Permanecer vigente durante todo o prazo da locação, inclusive em eventuais prorrogações, devendo ser renovado pelo LOCATÁRIO sempre que necessário;</p>
          <p class="clause-text">III. Ser entregue ao LOCADOR a respectiva apólice e comprovante de pagamento.</p>
          <p class="clause-text">O não pagamento do prêmio do seguro ou a não renovação da apólice caracterizará infração contratual, podendo ensejar a rescisão do contrato, nos termos da legislação vigente.</p>
        ` : `
          <p class="clause-text">Como garantia do cumprimento das obrigações pactuadas a caução no valor de 2 aluguéis no valor de <span class="highlight">${formatCurrency(caucao)}</span>, será a forma de seguro podendo ultrapassar esse valor caso esse valor não cubra as despesas no final do contrato, feitas pelo locatário, qualificados no preâmbulo deste instrumento, responsabilizando-se, como principais pagadores, pelo fiel cumprimento de todas as cláusulas ora reciprocamente estipuladas e aceitas, inclusive indenização de danos no imóvel e reparos necessários, além dos ônus judiciais respectivos.</p>
          
          <p class="clause-text italic-paragraph">§ 1° O LOCADOR pode ser cientificado ou citado para a ação de despejo contra o LOCATARIO, obrigando-se, inclusive, às despesas judiciais, acessórias da dívida principal, e honorários de advogado, no importe definido por ambas as partes sobre o valor da causa, quer quanto à ação de despejo, quer quanto à execução de aluguéis, tributos e demais encargos.</p>
          
          <p class="clause-text italic-paragraph">§ 2° A responsabilidade do LOCATÁRIO pelo aluguel e demais obrigações legais e contratuais só terminará com a devolução definitiva das chaves e quitação de todos os débitos de locação e os consectários legais e contratuais, inclusive reparos, se necessários.</p>
        `}

        <div class="clause-title">CLÁUSULA DÉCIMA – DO SEGURO</div>
        <p class="clause-text">É de responsabilidade do LOCATÁRIO o pagamento do seguro anual de incêndio do imóvel locado, em nome do LOCADOR, garantindo o seu valor real.</p>

        <div class="clause-title">CLÁUSULA DÉCIMA PRIMEIRA – DA VISTORIA</div>
        <p class="clause-text">O LOCATÁRIO declara, neste ato, haver realizado vistoria prévia e minuciosa no imóvel objeto do presente contrato, recebendo-o em perfeitas condições de uso, conservação, limpeza e funcionamento, conforme descrito no Laudo de Vistoria que integra o presente instrumento como parte indissociável.</p>
        <p class="clause-text italic-paragraph">Parágrafo 1º - O Laudo de Vistoria inicial, devidamente assinado pelas partes, conterá a descrição detalhada do estado do imóvel, suas instalações, benfeitorias, equipamentos, móveis (se houver) e demais acessórios, servindo como parâmetro para aferição das condições do bem ao término da locação.</p>
        <p class="clause-text italic-paragraph">Parágrafo 2º - Ao final da locação, será realizada vistoria de saída, comprometendo-se o LOCATÁRIO a restituí-lo nas mesmas condições em que o recebeu, ressalvadas as deteriorações decorrentes do uso normal e do decurso do tempo, nos termos do art. 23, inciso III, da Lei nº 8.245/1991.</p>
        <p class="clause-text italic-paragraph">Parágrafo 3º - Constatados danos, avarias ou modificações não autorizadas, ficará o LOCATÁRIO obrigado a reparar, substituir ou indenizar o LOCADOR pelos prejuízos verificados, no prazo estipulado por este, sob pena de execução das garantias contratuais e demais medidas cabíveis.</p>
        <p class="clause-text italic-paragraph">Parágrafo 4º - A eventual recusa do LOCATÁRIO em acompanhar a vistoria final não impede sua realização, presumindo-se como verdadeiras as informações constantes no respectivo laudo, desde que devidamente documentadas.</p>

        <div class="clause-title">CLÁUSULA DÉCIMA SEGUNDA – DA MEDIDA JUDICIAL</div>
        <p class="clause-text">Na hipótese de ser necessária qualquer medida judicial, o LOCADOR e LOCATÁRIO poderão ser citados pelo correio, com Aviso de Recebimento dirigido aos respectivos endereços mencionados no preâmbulo deste instrumento.</p>

        <div class="clause-title">CLÁUSULA DÉCIMA TERCEIRA – DO FORO</div>
        <p class="clause-text">O foro deste contrato, é o da Comarca de Barueri/SP para dirimir eventuais questões emergentes do presente instrumento.</p>

        <div class="clause-title">CLÁUSULA DÉCIMA QUARTA – DISPOSIÇÕES FINAIS</div>
        <p class="clause-text">O LOCADOR poderá solicitar a desocupação do imóvel em caso de venda, conforme previsto no artigo 27 da Lei nº 8.245/1991. Para tanto, o LOCADOR deverá notificar o LOCATÁRIO com antecedência mínima de 90 dias, por escrito, especificando a intenção de venda e a necessidade de desocupação.</p>
        
        <p class="clause-text">Caso o LOCATÁRIO não desocupe o imóvel dentro do prazo estipulado, o LOCADOR poderá ingressar com ação de despejo, conforme previsto na Lei do Inquilinato, sem que haja necessidade de qualquer outra indenização ao LOCADOR.</p>

        <p class="clause-text">E por estarem justos e contratados, lavraram o presente instrumento em via única.</p>
        
        <p style="text-align: left;">Barueri, ${fullDate}.</p>

        <table class="summary-table" style="margin-top: 50px;">
          <tr class="summary-header">
            <td width="60%" style="text-align: left;">Nome das Partes</td>
            <td width="40%" style="text-align: left;">Assinaturas</td>
          </tr>
          <tr style="height: 60px;">
            <td style="vertical-align: middle;">${locatorName}</td>
            <td></td>
          </tr>
          <tr style="height: 60px;">
            <td style="vertical-align: middle;">${tenantName}</td>
            <td></td>
          </tr>
          <tr style="height: 60px;">
            <td style="vertical-align: middle;">Flavia Catarina Nascimento Gonçalves [Intermediadora]</td>
            <td></td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };

  const generateContractDoc = (client: Client) => {
    const content = getContractHTML(client);
    const tenantName = client.name || 'Contrato';
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_${tenantName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateContractPDF = (client: Client) => {
    const content = getContractHTML(client);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const generateIncomeReportPDF = async (report: IncomeReport) => {
    // Buscar imóvel e cliente para pegar dados extras como CPF
    const property = properties.find(p => p.id === report.property_id || p.title === report.property_title);

    // Buscar cliente (locatário)
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .or(`property_interest.eq.${report.property_id},property_interest.eq.${report.property_title}`)
      .limit(1);

    const client = clientsData && clientsData.length > 0 ? clientsData[0] : null;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    // Calcular totais
    const totalBruto = report.monthly_data.reduce((acc, curr) => acc + (curr.paid_value || 0), 0);
    const totalComissao = report.monthly_data.reduce((acc, curr) => acc + (curr.commission || 0), 0);
    const totalIrrf = report.monthly_data.reduce((acc, curr) => acc + (curr.irrf || 0), 0);

    const year = report.contract_date ? new Date(report.contract_date).getFullYear() : new Date().getFullYear();

    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; margin: 2cm; padding: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .company-name { font-weight: bold; font-size: 14pt; }
          .report-title { text-align: right; font-weight: bold; font-size: 9pt; text-transform: uppercase; }
          
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 10pt; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
          
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .data-table td { padding: 4px 0; }
          .label { font-size: 8pt; color: #666; display: block; text-transform: uppercase; }
          .value { font-size: 10pt; font-weight: bold; }

          .income-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .income-table th { background: #f2f2f2; font-size: 8pt; text-transform: uppercase; padding: 6px; border: 1px solid #ccc; text-align: center; }
          .income-table td { padding: 5px; border: 1px solid #ccc; font-size: 9pt; text-align: center; }
          .income-table .month-col { text-align: left; font-weight: bold; width: 100px; }
          .income-table .total-row { font-weight: bold; background: #f9f9f9; }

          .complementary { font-size: 9pt; line-height: 1.4; }
          .signature-section { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-box { border-top: 1px solid #000; width: 250px; text-align: center; padding-top: 5px; }

          @media print {
            body { margin: 0; padding: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">NASCIMENTO NEGÓCIOS IMOBILIÁRIOS</div>
          <div class="report-title">
            COMPROVANTE ANUAL DE<br>
            RENDIMENTO DE ALUGUÉIS<br>
            Ano-calendário: ${year}
          </div>
        </div>

        <div class="section">
          <div class="section-title">1 - Beneficiário do Rendimento (Locador)</div>
          <table class="data-table">
            <tr>
              <td width="70%">
                <span class="label">Nome / Nome Empresarial</span>
                <span class="value">${report.locator_name}</span>
              </td>
              <td>
                <span class="label">CPF / CNPJ</span>
                <span class="value">${property?.ownerCpf || '-'}</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">2 - Fonte Pagadora (Locatário)</div>
          <table class="data-table">
            <tr>
              <td width="70%">
                <span class="label">Nome / Nome Empresarial</span>
                <span class="value">${report.tenant_name}</span>
              </td>
              <td>
                <span class="label">CPF / CNPJ</span>
                <span class="value">${client?.cpf || '-'}</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">3 - Rendimentos (Em Reais)</div>
          <table class="income-table">
            <thead>
              <tr>
                <th class="month-col">Mês</th>
                <th>Rend. Bruto</th>
                <th>Valor Comissão</th>
                <th>IR</th>
              </tr>
            </thead>
            <tbody>
              ${report.monthly_data.map(m => `
                <tr>
                  <td class="month-col">${m.month}</td>
                  <td>${formatCurrency(m.paid_value || 0)}</td>
                  <td>${formatCurrency(m.commission || 0)}</td>
                  <td>${formatCurrency(m.irrf || 0)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td class="month-col">TOTAL</td>
                <td>${formatCurrency(totalBruto)}</td>
                <td>${formatCurrency(totalComissao)}</td>
                <td>${formatCurrency(totalIrrf)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">4 - Informações Complementares</div>
          <div class="complementary">
            <strong>CNPJ da Administradora do Imóvel (Imobiliária):</strong> 00.000.000/0001-00<br>
            <strong>Nome:</strong> NASCIMENTO NEGÓCIOS IMOBILIÁRIOS<br>
            <strong>Endereço:</strong> ${companySettings?.address || 'Avenida Exemplo'}, ${companySettings?.number || '0'} - ${companySettings?.city || 'Cidade'} / ${companySettings?.state || 'UF'}<br>
            <br>
            <strong>Dados do Imóvel</strong><br>
            Número do Contrato: ${report.id || '-'}<br>
            Data do Contrato: ${report.contract_date ? new Date(report.contract_date).toLocaleDateString('pt-BR') : '-'}<br>
            Tipo do Imóvel: ${property?.type || 'URBANO'}<br>
            Endereço do Imóvel: ${property?.street || ''}, ${property?.number || ''} ${property?.complement || ''} - ${property?.neighborhood || ''}<br>
            Município: ${property?.city || '-'} | UF: ${property?.state || '-'} | CEP: ${property?.zip || '-'}
          </div>
        </div>

        <div class="section">
          <div class="section-title">5 - Responsável pelas Informações</div>
          <div class="signature-section">
            <div style="font-size: 9pt;">
              <strong>Nome:</strong> FLAVIA CATARINA NASCIMENTO GONÇALVES<br>
              <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
            </div>
            <div class="signature-box">
              Assinatura
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 700);
    }
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
        ) : isAddingIncomeReport ? (
          <IncomeReportForm
            properties={properties}
            editingReport={editingIncomeReport}
            onCancel={() => { setIsAddingIncomeReport(false); setEditingIncomeReport(null); }}
            onSuccess={() => { setIsAddingIncomeReport(false); setEditingIncomeReport(null); fetchIncomeReports(); }}
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

              {currentTab === 'income-reports' && (
                <button onClick={() => { setEditingIncomeReport(null); setIsAddingIncomeReport(true); }} className="bg-[#4A5D23] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 w-full md:w-auto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Novo Informe
                </button>
              )}
            </header>

            {currentTab === 'overview' && (
              <div className="space-y-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Imóveis Ativos</h3>
                    <p className="text-4xl font-light text-black font-serif">{properties.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Contratos Ativos</h3>
                    <p className="text-4xl font-light text-black font-serif">{clients.filter(c => c.status === 'Ativo').length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Leads do Site</h3>
                    <p className="text-4xl font-light text-[#4A5D23] font-serif">{contactsList.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Latest Contacts List */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-black uppercase tracking-[0.2em]">Últimos Contatos do Site</h3>
                      <button onClick={() => setCurrentTab('contacts')} className="text-[10px] font-bold text-[#4A5D23] uppercase hover:underline">Ver todos</button>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                      {contactsList.length > 0 ? contactsList.slice(0, 3).map(contact => (
                        <div key={contact.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-black">{contact.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tight">{contact.property_title || 'Interesse Geral'}</p>
                          </div>
                          <span className="text-[10px] font-bold text-[#4A5D23] bg-green-50 px-2 py-1 rounded uppercase tracking-tighter">Novo</span>
                        </div>
                      )) : (
                        <div className="p-10 text-center">
                          <p className="text-sm text-gray-400">Nenhum contato recente.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Insurance Partners */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-black uppercase tracking-[0.2em]">Seguradoras e Fiança</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:border-[#4A5D23] transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">P</div>
                        <p className="text-xs font-bold text-gray-800">Porto Seguro</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-tighter mt-1">Fiança Tradicional</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:border-[#4A5D23] transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3 text-orange-600 font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors">C</div>
                        <p className="text-xs font-bold text-gray-800">CredPago</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-tighter mt-1">Cartão de Crédito</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Management Tips Section */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-black uppercase tracking-[0.2em]">Central de Gestão Imobiliária</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-black text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group border border-black hover:bg-white hover:text-black transition-all duration-500">
                      <div className="relative z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A5D23] mb-2 block">Dica de Gestão</span>
                        <h4 className="text-base font-bold mb-3">Vistoria de Entrada</h4>
                        <p className="text-xs text-gray-400 group-hover:text-gray-600 leading-relaxed">Sempre anexe no mínimo 50 fotos e detalhe o estado das pinturas e rejuntes para evitar conflitos na saída.</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-[#4A5D23] transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2 block">Jurídico</span>
                      <h4 className="text-base font-bold text-black mb-3">Análise de Crédito</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">Exija que o comprometimento de renda não ultrapasse 30% do rendimento líquido mensal do inquilino.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-[#4A5D23] transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2 block">Finanças</span>
                      <h4 className="text-base font-bold text-black mb-3">Reajuste de Aluguel</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">Utilize preferencialmente o IPCA. Notifique o cliente com 30 dias de antecedência para evitar surpresas.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'properties' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Imóvel</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proprietário</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Link do Imóvel</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {properties.length > 0 ? properties.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm font-medium">{p.title}</td>
                        <td className="p-4 text-sm text-gray-500">
                          {p.ownerName ? p.ownerName.split(' ')[0] : '-'}<br />
                          <span className="text-[10px] font-normal text-gray-400">{p.ownerPhone || '-'}</span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">{p.operation}</td>
                        <td className="p-4 text-sm font-bold text-[#4A5D23]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p.price + (p.condoPrice || 0) + (p.iptuPrice || 0))}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wide">Ativo</span></td>
                        <td className="p-4 text-sm">
                          <button
                            onClick={() => {
                              const link = `${window.location.host}?prop=${p.id}`;
                              const message = `Olá! Segue o link do imóvel "${p.title}" para sua consulta: ${link}`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="flex items-center gap-2 text-[#4A5D23] hover:text-black transition-colors font-bold text-[10px] uppercase tracking-wider"
                            title="Enviar Link via WhatsApp"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            Enviar Link
                          </button>
                        </td>
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
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => generateContractDoc(client)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors group"
                              title="Baixar Word (.doc)"
                            >
                              <svg className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.11 11.23l-1.01 4.54h-.05l-1.01-4.54H8.72l1.64 6.78h1.49l1.01-4.54 1.01 4.54h1.49l1.64-6.78h-1.32l-1.01 4.54h-.05l-1.01-4.54h-1.41zM14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => generateContractPDF(client)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                              title="Gerar PDF"
                            >
                              <svg className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm12 6V9c0-.55-.45-1-1-1h-2v5h2c.55 0 1-.45 1-1zm-2-3h1v3h-1V9zm-3 4h1.5c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H11v4zm1-3h.5v2H12v-2zm-4 3h1v-1.5h1V12h-1V10.5h1V9H8v4z" />
                              </svg>
                            </button>
                          </div>
                        </td>
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
            {currentTab === 'income-reports' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Locador (Beneficiário)</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Locatário (Fonte Pagadora)</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Imóvel</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Contrato</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor Contrato</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rendimento</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {incomeReports.length > 0 ? incomeReports.map(report => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm font-medium">{report.locator_name}</td>
                        <td className="p-4 text-sm text-gray-500">{report.tenant_name}</td>
                        <td className="p-4 text-sm text-gray-500 italic">{report.property_title}</td>
                        <td className="p-4 text-sm text-gray-500">{new Date(report.contract_date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-sm font-medium text-gray-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            report.monthly_data.reduce((acc, curr) => acc + (curr.contract_value || 0), 0)
                          )}
                        </td>
                        <td className="p-4 text-sm font-bold text-[#4A5D23]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            report.monthly_data.reduce((acc, curr) => acc + (curr.paid_value || 0), 0)
                          )}
                        </td>
                        <td className="p-4 text-right flex gap-3 justify-end items-center">
                          <button
                            onClick={() => generateIncomeReportPDF(report)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Baixar PDF"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </button>
                          <button
                            onClick={() => { setEditingIncomeReport(report); setIsAddingIncomeReport(true); }}
                            className="text-gray-400 hover:text-[#4A5D23] transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button
                            onClick={() => deleteIncomeReport(report.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum informe de rendimentos encontrado.</td></tr>
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
