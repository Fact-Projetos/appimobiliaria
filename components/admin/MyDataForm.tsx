
import React, { useState, useEffect } from 'react';
import { Partner } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface MyDataFormProps {
    onSuccess: () => void;
}

const MyDataForm: React.FC<MyDataFormProps> = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [companyInfo, setCompanyInfo] = useState({
        address: '',
        number: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        hours: ''
    });

    const [partners, setPartners] = useState<Partner[]>([]);
    const [newPartner, setNewPartner] = useState({ name: '', category: '', contact: '' });

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Company Info
                const { data: companyData } = await supabase.from('company_settings').select('*').single();
                if (companyData) {
                    setCompanyInfo({
                        address: companyData.address || '',
                        number: companyData.number || '',
                        city: companyData.city || '',
                        state: companyData.state || '',
                        zip: companyData.zip || '',
                        phone: companyData.phone || '',
                        email: companyData.email || '',
                        hours: companyData.hours || ''
                    });
                }

                // Load Partners
                const { data: partnersData } = await supabase.from('partners').select('*');
                if (partnersData) {
                    setPartners(partnersData as unknown as Partner[]);
                }
            } catch (e) {
                console.log("Tabelas de configuração ainda não existem.");
            }
        };
        loadData();
    }, []);

    const handleSaveCompanyInfo = async () => {
        setLoading(true);
        // Upsert company info (ID 1 is the default singleton)
        const { error } = await supabase.from('company_settings').upsert({
            id: 1,
            ...companyInfo
        });

        if (error) alert('Erro ao salvar dados da empresa: ' + error.message);
        else {
            alert('Dados salvos com sucesso!');
            onSuccess();
        }
        setLoading(false);
    };

    const handleAddPartner = async () => {
        if (newPartner.name && newPartner.category) {
            const { data, error } = await supabase.from('partners').insert([newPartner]).select();
            if (error) {
                alert('Erro ao adicionar parceiro');
            } else if (data) {
                setPartners([...partners, data[0] as unknown as Partner]);
                setNewPartner({ name: '', category: '', contact: '' });
            }
        }
    };

    const handleDeletePartner = async (id: number) => {
        const { error } = await supabase.from('partners').delete().eq('id', id);
        if (!error) {
            setPartners(partners.filter(p => p.id !== id));
        }
    };

    return (
        <div className="animate-fadeIn pb-32">
            <h3 className="text-xl font-bold text-black mb-8">Meus Dados & Configurações</h3>
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center mb-8">
                    <div className="w-8 h-8 bg-[#4A5D23] text-white rounded-lg flex items-center justify-center mr-3 font-bold text-sm">01</div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-black">Endereço e Contato (Site)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Logradouro</label><input type="text" value={companyInfo.address} onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Número</label><input type="text" value={companyInfo.number} onChange={(e) => setCompanyInfo({ ...companyInfo, number: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Cidade</label><input type="text" value={companyInfo.city} onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Estado</label><input type="text" value={companyInfo.state} onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">CEP</label><input type="text" value={companyInfo.zip} onChange={(e) => setCompanyInfo({ ...companyInfo, zip: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Telefone</label><input type="text" value={companyInfo.phone} onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">E-mail de Contato</label><input type="text" value={companyInfo.email} onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Horário Atendimento</label><input type="text" value={companyInfo.hours} onChange={(e) => setCompanyInfo({ ...companyInfo, hours: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                </div>
            </section>
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8"><div className="flex items-center"><div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center mr-3 font-bold text-sm">02</div><h4 className="text-sm font-bold uppercase tracking-widest text-black">Empresas Parceiras</h4></div></div>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Adicionar Novo Parceiro</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1"><input type="text" placeholder="Nome da Empresa" value={newPartner.name} onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })} className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                        <div className="md:col-span-1"><input type="text" placeholder="Categoria (ex: Seguros)" value={newPartner.category} onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })} className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                        <div className="md:col-span-1"><input type="text" placeholder="Contato / Telefone" value={newPartner.contact} onChange={(e) => setNewPartner({ ...newPartner, contact: e.target.value })} className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" /></div>
                        <div className="md:col-span-1"><button onClick={handleAddPartner} className="w-full bg-black text-white p-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#4A5D23] transition-colors">Adicionar</button></div>
                    </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Empresa</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categoria</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contato</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ação</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {partners.map(partner => (<tr key={partner.id} className="hover:bg-gray-50"><td className="p-4 text-sm font-bold text-gray-900">{partner.name}</td><td className="p-4 text-sm text-gray-500">{partner.category}</td><td className="p-4 text-sm text-gray-500">{partner.contact}</td><td className="p-4 text-right"><button onClick={() => handleDeletePartner(partner.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase">Remover</button></td></tr>))}
                            {partners.length === 0 && (<tr><td colSpan={4} className="p-8 text-center text-sm text-gray-400">Nenhum parceiro cadastrado.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8 mb-32">
                <div className="flex items-center mb-8">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center mr-3 font-bold text-sm">03</div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-black">Segurança e Senha</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Nova Senha</label>
                        <input
                            type="password"
                            id="new_password"
                            placeholder="Mínimo 6 caracteres"
                            className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                        />
                    </div>
                    <div>
                        <button
                            onClick={async () => {
                                const pass = (document.getElementById('new_password') as HTMLInputElement).value;
                                if (pass.length < 6) return alert('A senha deve ter pelo menos 6 caracteres.');
                                const { error } = await supabase.auth.updateUser({ password: pass });
                                if (error) alert('Erro: ' + error.message);
                                else {
                                    alert('Senha atualizada com sucesso!');
                                    (document.getElementById('new_password') as HTMLInputElement).value = '';
                                }
                            }}
                            className="w-full bg-black text-white p-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                        >
                            Atualizar Senha
                        </button>
                    </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-4 italic">* Use esta seção para definir sua nova senha após uma recuperação por e-mail ou para alterar sua senha atual.</p>
            </section>

            <div className="fixed bottom-0 right-0 left-[288px] bg-white border-t border-gray-100 p-6 flex justify-end gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <button onClick={() => { }} className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Descartar</button>
                <button onClick={handleSaveCompanyInfo} disabled={loading} className="bg-[#4A5D23] text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all">
                    {loading ? 'Salvando...' : 'Salvar Alterações Gerais'}
                </button>
            </div>
        </div>
    );
};

export default MyDataForm;
