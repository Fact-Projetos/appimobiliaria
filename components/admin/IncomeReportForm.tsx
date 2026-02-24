
import React, { useState, useEffect } from 'react';
import { Property, IncomeReport, MonthlyIncomeData } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface IncomeReportFormProps {
    properties: Property[];
    editingReport?: IncomeReport | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const IncomeReportForm: React.FC<IncomeReportFormProps> = ({ properties, editingReport, onCancel, onSuccess }) => {
    const [formData, setFormData] = useState({
        property_id: editingReport?.property_id || '',
        property_title: editingReport?.property_title || '',
        start_date: editingReport?.start_date || '',
        end_date: editingReport?.end_date || '',
        contract_date: editingReport?.contract_date || '',
        locator_name: editingReport?.locator_name || '',
        tenant_name: editingReport?.tenant_name || ''
    });

    const [monthlyData, setMonthlyData] = useState<MonthlyIncomeData[]>(
        editingReport?.monthly_data || MONTHS.map(month => ({
            month,
            due_day: undefined,
            payment_date: '',
            contract_value: 0,
            paid_value: 0,
            commission: 0,
            irrf: 0
        }))
    );

    const [propertySearch, setPropertySearch] = useState(editingReport?.property_title || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);

    const filteredProperties = propertySearch.length > 0
        ? properties.filter(p => p.title.toLowerCase().includes(propertySearch.toLowerCase()))
        : [];

    const handleSelectProperty = (property: Property) => {
        setPropertySearch(property.title);
        setFormData(prev => ({
            ...prev,
            property_id: property.id,
            property_title: property.title,
            locator_name: property.ownerName || '',
            // Try to find a client for this property to get the tenant name
        }));
        setShowSuggestions(false);
        fetchTenantForProperty(property.id, property.title);
    };

    const fetchTenantForProperty = async (propertyId: string, propertyTitle: string) => {
        const { data, error } = await supabase
            .from('clients')
            .select('name')
            .or(`property_interest.eq.${propertyId},property_interest.eq.${propertyTitle}`)
            .limit(1);

        if (data && data.length > 0) {
            setFormData(prev => ({ ...prev, tenant_name: data[0].name }));
        }
    };

    const handleMonthlyChange = (index: number, field: keyof MonthlyIncomeData, value: any) => {
        const newData = [...monthlyData];
        newData[index] = { ...newData[index], [field]: value };
        setMonthlyData(newData);
    };

    const handleSave = async () => {
        setLoading(true);
        const payload = {
            ...formData,
            monthly_data: monthlyData
        };

        try {
            let error;
            if (editingReport?.id) {
                const { error: updateError } = await (supabase as any)
                    .from('income_reports')
                    .update(payload)
                    .eq('id', editingReport.id);
                error = updateError;
            } else {
                const { error: insertError } = await (supabase as any)
                    .from('income_reports')
                    .insert([payload]);
                error = insertError;
            }

            if (error) {
                alert('Erro ao salvar informe: ' + error.message);
            } else {
                alert('Informe salvo com sucesso!');
                onSuccess();
            }
        } catch (err: any) {
            alert('Erro inesperado: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn space-y-10">
            <div className="flex items-center justify-between">
                <button onClick={onCancel} className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Voltar para Lista
                </button>
                <h3 className="text-xl font-bold text-black">{editingReport ? 'Editar Informe' : 'Novo Informe de Rendimentos'}</h3>
            </div>

            <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Dados Gerais</h4>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Imóvel</label>
                            <input
                                type="text"
                                value={propertySearch}
                                onChange={(e) => { setPropertySearch(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs"
                                placeholder="Buscar imóvel..."
                            />
                            {showSuggestions && filteredProperties.length > 0 && (
                                <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredProperties.map(p => (
                                        <li key={p.id} onClick={() => handleSelectProperty(p)} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 text-xs">
                                            {p.title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Data do Contrato</label>
                            <input
                                type="date"
                                value={formData.contract_date}
                                onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                                className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Data Inicial</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Data Final</label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Locador (Beneficiário)</label>
                                <input
                                    type="text"
                                    value={formData.locator_name}
                                    onChange={(e) => setFormData({ ...formData, locator_name: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs"
                                    placeholder="Nome do Locador"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Locatário (Fonte Pagadora)</label>
                                <input
                                    type="text"
                                    value={formData.tenant_name}
                                    onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs"
                                    placeholder="Nome do Locatário"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-[#4A5D23] text-white">
                            <tr>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Mês</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Vencimento</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Pagamento</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Valor Contrato</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Valor Pago</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">Comissão</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest">IRRF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {monthlyData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-3 text-xs font-bold text-gray-600">{row.month}</td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={row.due_day || ''}
                                            onChange={(e) => handleMonthlyChange(idx, 'due_day', parseInt(e.target.value))}
                                            className="w-16 p-1 bg-gray-50 border border-transparent rounded text-xs outline-none focus:ring-1 focus:ring-[#4A5D23]"
                                            placeholder="1"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="date"
                                            value={row.payment_date}
                                            onChange={(e) => handleMonthlyChange(idx, 'payment_date', e.target.value)}
                                            className="w-32 p-1 bg-gray-50 border border-transparent rounded text-xs outline-none focus:ring-1 focus:ring-[#4A5D23]"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={row.contract_value || 0}
                                            onChange={(e) => handleMonthlyChange(idx, 'contract_value', parseFloat(e.target.value))}
                                            className="w-24 p-1 bg-gray-50 border border-transparent rounded text-xs outline-none focus:ring-1 focus:ring-[#4A5D23]"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={row.paid_value || 0}
                                            onChange={(e) => handleMonthlyChange(idx, 'paid_value', parseFloat(e.target.value))}
                                            className="w-24 p-1 bg-gray-50 border border-transparent rounded text-xs outline-none focus:ring-1 focus:ring-[#4A5D23]"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={row.commission || 0}
                                            onChange={(e) => handleMonthlyChange(idx, 'commission', parseFloat(e.target.value))}
                                            className="w-24 p-1 bg-gray-50 border border-transparent rounded text-xs outline-none focus:ring-1 focus:ring-[#4A5D23]"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={row.irrf || 0}
                                            onChange={(e) => handleMonthlyChange(idx, 'irrf', parseFloat(e.target.value))}
                                            className="w-24 p-1 bg-gray-50 border border-transparent rounded text-xs outline-none focus:ring-1 focus:ring-[#4A5D23]"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end gap-4 pb-10">
                <button onClick={onCancel} className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all border border-gray-100">
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-[#4A5D23] text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? 'Salvando...' : 'Salvar Informe'}
                </button>
            </div>
        </div>
    );
};

export default IncomeReportForm;
