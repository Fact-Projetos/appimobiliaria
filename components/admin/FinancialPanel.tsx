import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { parseAirbnbReport, AirbnbReport } from '../../lib/airbnbReport';
import { FinancialEntry, FinancialOrigin, Property } from '../../types';

interface FinancialPanelProps {
  properties: Property[];
}

type OriginFilter = 'Todos' | FinancialOrigin;

type EntryForm = {
  origin: FinancialOrigin;
  entry_date: string;
  property_title: string;
  days: string;
  gross_value: string;
  cleaning: string;
  maintenance: string;
  platform_fees: string;
  notes: string;
};

type ImportRow = {
  selected: boolean;
  duplicate: boolean;
  property_title: string;
  days: number;
  gross_value: number;
  platform_fees: number;
  net_value: number;
};

const db = () => (supabase as any).from('financial_entries');

const money = (v: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const formatDate = (iso?: string | null) => {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Aceita "1.329,00", "1329,00" ou "1329.00"
const parseInput = (s: string): number => {
  if (!s) return 0;
  const clean = s.trim();
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  return parseFloat(normalized) || 0;
};

const calcNet = (gross: number, cleaning: number, maintenance: number, fees: number) =>
  +(gross - cleaning - maintenance - fees).toFixed(2);

const emptyForm = (): EntryForm => ({
  origin: 'Por fora',
  entry_date: todayIso(),
  property_title: '',
  days: '',
  gross_value: '',
  cleaning: '',
  maintenance: '',
  platform_fees: '',
  notes: '',
});

const th = 'p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap';
const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4A5D23] bg-white';
const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2';

const FinancialPanel: React.FC<FinancialPanelProps> = ({ properties }) => {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filtros
  const [originFilter, setOriginFilter] = useState<OriginFilter>('Todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Lançamento manual / edição
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Importação Airbnb
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<AirbnbReport | null>(null);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importDate, setImportDate] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await db().select('*').order('entry_date', { ascending: false }).order('id', { ascending: false });
    if (error) {
      setLoadError(error.message);
    } else {
      setLoadError(null);
      setEntries((data || []).map((e: any) => ({
        ...e,
        days: Number(e.days) || 0,
        gross_value: Number(e.gross_value) || 0,
        cleaning: Number(e.cleaning) || 0,
        maintenance: Number(e.maintenance) || 0,
        platform_fees: Number(e.platform_fees) || 0,
        net_value: Number(e.net_value) || 0,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const filtered = useMemo(() => entries.filter((e) => {
    if (originFilter !== 'Todos' && e.origin !== originFilter) return false;
    const d = e.entry_date?.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  }), [entries, originFilter, dateFrom, dateTo]);

  const totals = useMemo(() => filtered.reduce((acc, e) => ({
    days: acc.days + e.days,
    gross: acc.gross + e.gross_value,
    cleaning: acc.cleaning + e.cleaning,
    maintenance: acc.maintenance + e.maintenance,
    fees: acc.fees + e.platform_fees,
    net: acc.net + calcNet(e.gross_value, e.cleaning, e.maintenance, e.platform_fees),
  }), { days: 0, gross: 0, cleaning: 0, maintenance: 0, fees: 0, net: 0 }), [filtered]);

  const setQuickRange = (kind: 'month' | 'lastMonth' | 'year') => {
    const now = new Date();
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (kind === 'month') {
      setDateFrom(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
      setDateTo(iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
    } else if (kind === 'lastMonth') {
      setDateFrom(iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
      setDateTo(iso(new Date(now.getFullYear(), now.getMonth(), 0)));
    } else {
      setDateFrom(`${now.getFullYear()}-01-01`);
      setDateTo(`${now.getFullYear()}-12-31`);
    }
  };

  // ---------- Lançamento manual ----------
  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (e: FinancialEntry) => {
    setEditingId(e.id);
    setForm({
      origin: e.origin,
      entry_date: e.entry_date?.slice(0, 10) || todayIso(),
      property_title: e.property_title || '',
      days: String(e.days || ''),
      gross_value: e.gross_value ? money(e.gross_value) : '',
      cleaning: e.cleaning ? money(e.cleaning) : '',
      maintenance: e.maintenance ? money(e.maintenance) : '',
      platform_fees: e.platform_fees ? money(e.platform_fees) : '',
      notes: e.notes || '',
    });
    setFormOpen(true);
  };

  const formNet = calcNet(
    parseInput(form.gross_value), parseInput(form.cleaning), parseInput(form.maintenance), parseInput(form.platform_fees)
  );

  const saveForm = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.property_title.trim()) { alert('Informe o imóvel.'); return; }
    if (!form.entry_date) { alert('Informe a data.'); return; }

    const gross = parseInput(form.gross_value);
    const cleaning = parseInput(form.cleaning);
    const maintenance = parseInput(form.maintenance);
    const fees = parseInput(form.platform_fees);
    const payload = {
      origin: form.origin,
      entry_date: form.entry_date,
      property_title: form.property_title.trim(),
      days: parseInt(form.days, 10) || 0,
      gross_value: gross,
      cleaning,
      maintenance,
      platform_fees: fees,
      net_value: calcNet(gross, cleaning, maintenance, fees),
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    const { error } = editingId
      ? await db().update(payload).eq('id', editingId)
      : await db().insert([payload]);
    setSaving(false);

    if (error) { alert('Erro ao salvar: ' + error.message); return; }
    setFormOpen(false);
    fetchEntries();
  };

  const deleteEntry = async (id: number) => {
    if (!confirm('Deseja excluir este lançamento?')) return;
    const { error } = await db().delete().eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // ---------- Importação do relatório Airbnb ----------
  const handleFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const report = await parseAirbnbReport(file);
      if (report.rows.length === 0) {
        alert('Não encontrei acomodações neste PDF. Verifique se é o "Relatório de ganhos" do Airbnb.');
        return;
      }
      const isDup = (title: string) => entries.some((e) =>
        e.origin === 'Airbnb' &&
        e.property_title.trim().toLowerCase() === title.trim().toLowerCase() &&
        (e.period_start || null) === report.period_start &&
        (e.period_end || null) === report.period_end
      );
      setImportReport(report);
      setImportDate(report.generated_at || report.period_end || todayIso());
      setImportRows(report.rows.map((r) => {
        const duplicate = isDup(r.property_title);
        return { ...r, duplicate, selected: !duplicate };
      }));
    } catch (err: any) {
      console.error(err);
      alert('Não foi possível ler o PDF: ' + (err?.message || err));
    } finally {
      setImporting(false);
    }
  };

  const confirmImport = async () => {
    const chosen = importRows.filter((r) => r.selected);
    if (chosen.length === 0) { alert('Selecione ao menos uma acomodação.'); return; }
    if (!importDate) { alert('Informe a data do lançamento.'); return; }

    const payload = chosen.map((r) => ({
      origin: 'Airbnb' as FinancialOrigin,
      entry_date: importDate,
      property_title: r.property_title,
      days: r.days,
      gross_value: r.gross_value,
      cleaning: 0,
      maintenance: 0,
      platform_fees: r.platform_fees,
      net_value: calcNet(r.gross_value, 0, 0, r.platform_fees),
      period_start: importReport?.period_start || null,
      period_end: importReport?.period_end || null,
      notes: null,
    }));

    setSaving(true);
    const { error } = await db().insert(payload);
    setSaving(false);
    if (error) { alert('Erro ao importar: ' + error.message); return; }
    setImportReport(null);
    setImportRows([]);
    fetchEntries();
  };

  const updateImportRow = (idx: number, patch: Partial<ImportRow>) =>
    setImportRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  // ---------- UI ----------
  const cards = [
    { label: 'Total Recebido (Líquido)', value: totals.net, highlight: true },
    { label: 'Valor Bruto', value: totals.gross },
    { label: 'Limpeza', value: totals.cleaning },
    { label: 'Manutenção', value: totals.maintenance },
    { label: 'Taxas Plataforma', value: totals.fees },
  ];

  return (
    <div>
      <header className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-light text-black mb-2">Financeiro</h2>
          <p className="text-sm text-gray-400">Receitas do Airbnb e locações por fora.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="bg-white border border-[#4A5D23] text-[#4A5D23] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#4A5D23] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {importing ? 'Lendo PDF...' : 'Importar Relatório Airbnb'}
          </button>
          <button
            onClick={openNew}
            className="bg-[#4A5D23] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Novo Lançamento
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col lg:flex-row gap-4 lg:items-end">
        <div>
          <span className={labelCls}>Origem</span>
          <div className="inline-flex bg-gray-50 rounded-xl p-1">
            {(['Todos', 'Airbnb', 'Por fora'] as OriginFilter[]).map((o) => (
              <button
                key={o}
                onClick={() => setOriginFilter(o)}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${originFilter === o ? 'bg-[#4A5D23] text-white shadow' : 'text-gray-400 hover:text-black'}`}
              >
                {o === 'Airbnb' ? 'Plataforma' : o}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div>
            <label className={labelCls}>De</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#4A5D23]" />
          </div>
          <div>
            <label className={labelCls}>Até</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#4A5D23]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setQuickRange('month')} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100">Este mês</button>
          <button onClick={() => setQuickRange('lastMonth')} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100">Mês passado</button>
          <button onClick={() => setQuickRange('year')} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100">Este ano</button>
          {(dateFrom || dateTo || originFilter !== 'Todos') && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setOriginFilter('Todos'); }} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 rounded-lg hover:bg-red-100">Limpar</button>
          )}
        </div>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className={`p-5 rounded-2xl border shadow-sm ${c.highlight ? 'bg-[#4A5D23] border-[#4A5D23] text-white col-span-2 lg:col-span-1' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${c.highlight ? 'text-white/70' : 'text-gray-400'}`}>{c.label}</h3>
            <p className={`text-xl font-semibold ${c.highlight ? 'text-white' : 'text-black'}`}>{brl(c.value)}</p>
          </div>
        ))}
      </div>

      {loadError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
          Não foi possível carregar os lançamentos: {loadError}. Verifique se a tabela <b>financial_entries</b> foi criada no Supabase.
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className={th}>Origem</th>
              <th className={th}>Data</th>
              <th className={th}>Imóvel</th>
              <th className={`${th} text-right`}>Período</th>
              <th className={`${th} text-right`}>Valor Bruto</th>
              <th className={`${th} text-right`}>Limpeza</th>
              <th className={`${th} text-right`}>Manutenção</th>
              <th className={`${th} text-right`}>Taxas Plataforma</th>
              <th className={`${th} text-right`}>Líquido</th>
              <th className={`${th} text-right`}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={10} className="p-8 text-center text-gray-400">Carregando...</td></tr>
            ) : filtered.length > 0 ? filtered.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${e.origin === 'Airbnb' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-700'}`}>{e.origin}</span>
                </td>
                <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(e.entry_date)}</td>
                <td className="p-4 text-sm font-medium">
                  {e.property_title}
                  {e.period_start && e.period_end && (
                    <span className="block text-[10px] font-normal text-gray-400">Ref.: {formatDate(e.period_start)} a {formatDate(e.period_end)}</span>
                  )}
                  {e.notes && <span className="block text-[10px] font-normal text-gray-400">{e.notes}</span>}
                </td>
                <td className="p-4 text-sm text-gray-500 text-right whitespace-nowrap">{e.days} {e.days === 1 ? 'dia' : 'dias'}</td>
                <td className="p-4 text-sm text-right">{money(e.gross_value)}</td>
                <td className="p-4 text-sm text-right text-gray-500">{e.cleaning ? money(e.cleaning) : ''}</td>
                <td className="p-4 text-sm text-right text-gray-500">{e.maintenance ? money(e.maintenance) : ''}</td>
                <td className="p-4 text-sm text-right text-gray-500">{money(e.platform_fees)}</td>
                <td className="p-4 text-sm text-right font-bold text-[#4A5D23]">{money(calcNet(e.gross_value, e.cleaning, e.maintenance, e.platform_fees))}</td>
                <td className="p-4">
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => openEdit(e)} className="text-gray-400 hover:text-[#4A5D23] transition-colors" title="Editar">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => deleteEntry(e.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={10} className="p-8 text-center text-gray-400">Nenhum lançamento encontrado.</td></tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr className="text-sm font-bold">
                <td className="p-4 text-[10px] uppercase tracking-widest text-gray-500" colSpan={3}>Total ({filtered.length} lançamentos)</td>
                <td className="p-4 text-right whitespace-nowrap">{totals.days} dias</td>
                <td className="p-4 text-right">{money(totals.gross)}</td>
                <td className="p-4 text-right">{money(totals.cleaning)}</td>
                <td className="p-4 text-right">{money(totals.maintenance)}</td>
                <td className="p-4 text-right">{money(totals.fees)}</td>
                <td className="p-4 text-right text-[#4A5D23]">{money(totals.net)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal: lançamento manual / edição */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFormOpen(false)}></div>
          <form onSubmit={saveForm} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 lg:p-8">
            <h3 className="text-xl font-light text-black mb-6">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Origem</label>
                <select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value as FinancialOrigin })} className={inputCls}>
                  <option value="Por fora">Por fora</option>
                  <option value="Airbnb">Airbnb</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Data</label>
                <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className={inputCls} required />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Imóvel</label>
                <input
                  list="financial-properties"
                  value={form.property_title}
                  onChange={(e) => setForm({ ...form, property_title: e.target.value })}
                  placeholder="Ex.: Apto 1608"
                  className={inputCls}
                  required
                />
                <datalist id="financial-properties">
                  {Array.from(new Set([...properties.map((p) => p.title), ...entries.map((e) => e.property_title)]))
                    .filter(Boolean)
                    .map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Período (dias)</label>
                <input type="number" min="0" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valor Bruto (R$)</label>
                <input inputMode="decimal" value={form.gross_value} onChange={(e) => setForm({ ...form, gross_value: e.target.value })} placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Limpeza (R$)</label>
                <input inputMode="decimal" value={form.cleaning} onChange={(e) => setForm({ ...form, cleaning: e.target.value })} placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Manutenção (R$)</label>
                <input inputMode="decimal" value={form.maintenance} onChange={(e) => setForm({ ...form, maintenance: e.target.value })} placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Taxas Plataforma (R$)</label>
                <input inputMode="decimal" value={form.platform_fees} onChange={(e) => setForm({ ...form, platform_fees: e.target.value })} placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Líquido (calculado)</label>
                <div className="w-full rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 text-[#4A5D23]">{brl(formNet)}</div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Observação</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setFormOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100">Cancelar</button>
              <button type="submit" disabled={saving} className="bg-[#4A5D23] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: conferência da importação */}
      {importReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setImportReport(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 lg:p-8">
            <h3 className="text-xl font-light text-black mb-1">Importar Relatório Airbnb</h3>
            <p className="text-sm text-gray-400 mb-6">
              Período do relatório: {formatDate(importReport.period_start)} a {formatDate(importReport.period_end)}
              {importReport.generated_at && <> · gerado em {formatDate(importReport.generated_at)}</>}
            </p>

            <div className="mb-6 max-w-xs">
              <label className={labelCls}>Data do lançamento</label>
              <input type="date" value={importDate} onChange={(e) => setImportDate(e.target.value)} className={inputCls} />
            </div>

            <div className="border border-gray-100 rounded-xl overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={th}></th>
                    <th className={th}>Acomodação</th>
                    <th className={`${th} text-right`}>Dias</th>
                    <th className={`${th} text-right`}>Bruto</th>
                    <th className={`${th} text-right`}>Taxas</th>
                    <th className={`${th} text-right`}>Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {importRows.map((r, i) => (
                    <tr key={i} className={r.duplicate ? 'bg-amber-50' : ''}>
                      <td className="p-3 pl-4">
                        <input type="checkbox" checked={r.selected} onChange={(e) => updateImportRow(i, { selected: e.target.checked })} className="w-4 h-4 accent-[#4A5D23]" />
                      </td>
                      <td className="p-3 text-sm">
                        <input
                          value={r.property_title}
                          onChange={(e) => updateImportRow(i, { property_title: e.target.value })}
                          className="w-full border border-transparent hover:border-gray-200 focus:border-[#4A5D23] rounded-lg px-2 py-1 focus:outline-none"
                        />
                        {r.duplicate && <span className="block px-2 text-[10px] text-amber-700">Já importado para este período</span>}
                      </td>
                      <td className="p-3 text-sm text-right">
                        <input
                          type="number"
                          min="0"
                          value={r.days}
                          onChange={(e) => updateImportRow(i, { days: parseInt(e.target.value, 10) || 0 })}
                          className="w-16 text-right border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#4A5D23]"
                        />
                      </td>
                      <td className="p-3 text-sm text-right">{money(r.gross_value)}</td>
                      <td className="p-3 text-sm text-right text-gray-500">{money(r.platform_fees)}</td>
                      <td className="p-3 text-sm text-right font-bold text-[#4A5D23]">{money(r.net_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-400 mt-4">Limpeza e manutenção podem ser preenchidas depois, editando cada lançamento.</p>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setImportReport(null)} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100">Cancelar</button>
              <button onClick={confirmImport} disabled={saving} className="bg-[#4A5D23] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 disabled:opacity-50">
                {saving ? 'Importando...' : `Importar ${importRows.filter((r) => r.selected).length} lançamento(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialPanel;
