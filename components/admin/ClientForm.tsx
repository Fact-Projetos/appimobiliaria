
import React, { useState } from 'react';
import { Property } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { fetchAddressByCep } from '../../lib/utils';

interface ClientFormProps {
    properties: Property[];
    onCancel: () => void;
    onSuccess: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ properties, onCancel, onSuccess }) => {
    const [clientData, setClientData] = useState({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: ''
    });

    // File states
    const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
    const [proofAddressFile, setProofAddressFile] = useState<File | null>(null);
    const [incomeProofFile, setIncomeProofFile] = useState<File | null>(null);

    const [propertySearch, setPropertySearch] = useState('');
    const [propertyCode, setPropertyCode] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);

    // Auto-fetch address when CEP changes
    React.useEffect(() => {
        const fetchAddress = async () => {
            const cep = clientData.zip;
            if (cep) {
                const cleanCep = cep.replace(/\D/g, '');
                if (cleanCep.length === 8) {
                    const addressData = await fetchAddressByCep(cleanCep);
                    if (addressData) {
                        setClientData(prev => ({
                            ...prev,
                            city: addressData.city,
                            address: addressData.street,
                            state: addressData.state
                        }));
                    }
                }
            }
        };
        fetchAddress();
    }, [clientData.zip]);

    // Filter properties for auto-complete
    const filteredProperties = propertySearch.length > 0
        ? properties.filter(p => p.title.toLowerCase().includes(propertySearch.toLowerCase()))
        : [];

    const handleSelectProperty = (property: Property) => {
        setPropertySearch(property.title);
        setPropertyCode(property.id);
        setShowSuggestions(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setClientData(prev => ({ ...prev, [name]: value }));
    };

    const uploadFile = async (file: File | null, prefix: string): Promise<string | null> => {
        if (!file) return null;
        try {
            const fileName = `clients/${prefix}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const { error: uploadError } = await supabase.storage.from('properties').upload(fileName, file);

            if (uploadError) {
                console.error(`Erro upload ${prefix}:`, uploadError);
                return null;
            } else {
                const { data: publicData } = supabase.storage.from('properties').getPublicUrl(fileName);
                return publicData.publicUrl;
            }
        } catch (e) {
            console.warn(`Upload falhou para ${prefix}`, e);
            return null;
        }
    };

    const handleSaveClient = async () => {
        setLoading(true);

        try {
            // Upload documents
            const idDocumentUrl = await uploadFile(idDocumentFile, 'id_doc');
            const proofAddressUrl = await uploadFile(proofAddressFile, 'proof_address');
            const incomeProofUrl = await uploadFile(incomeProofFile, 'income_proof');

            const { error } = await supabase.from('clients').insert([{
                ...clientData,
                property_interest: propertySearch,
                status: 'Em análise',
                id_document_url: idDocumentUrl,
                proof_of_address_url: proofAddressUrl,
                income_proof_url: incomeProofUrl
            }]);

            if (error) {
                alert('Erro ao salvar cliente: ' + error.message);
            } else {
                alert('Cliente salvo com sucesso!');
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
                <button onClick={onCancel} className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Voltar para Lista</button>
                <h3 className="text-xl font-bold text-black">Cadastrar Novo Cliente</h3>
            </div>

            <form className="space-y-8 pb-32">
                {/* Dados Pessoais */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white">Dados Pessoais</h4>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Nome Completo</label>
                                <input type="text" name="name" value={clientData.name} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="Nome do cliente" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">CPF</label>
                                <input type="text" name="cpf" value={clientData.cpf} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Email</label>
                                <input type="email" name="email" value={clientData.email} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="email@exemplo.com" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Telefone</label>
                                <input type="text" name="phone" value={clientData.phone} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="(11) 99999-9999" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Endereço */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white">Endereço de Residência</h4>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">CEP</label>
                                <input type="text" name="zip" value={clientData.zip} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="00000-000" />
                            </div>
                            <div className="md:col-span-9">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Logradouro</label>
                                <input type="text" name="address" value={clientData.address} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="Rua, Av..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Cidade</label>
                                <input type="text" name="city" value={clientData.city} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="Cidade" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Estado</label>
                                <input type="text" name="state" value={clientData.state} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="UF" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dados da Locação */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white">Dados da Locação</h4>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Código do Imóvel</label>
                                <input type="text" value={propertyCode} readOnly className="w-full p-3 bg-gray-100 border border-transparent rounded-lg text-gray-600 font-bold outline-none cursor-not-allowed text-sm" placeholder="Cód." />
                            </div>
                            <div className="md:col-span-3 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Imóvel Pretendido</label>
                                <input type="text" value={propertySearch} onChange={(e) => { setPropertySearch(e.target.value); setShowSuggestions(true); if (e.target.value === '') setPropertyCode(''); }} onFocus={() => setShowSuggestions(true)} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="Digite para buscar o imóvel..." />
                                {showSuggestions && filteredProperties.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredProperties.map((property) => (
                                            <li key={property.id} onClick={() => handleSelectProperty(property)} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"><p className="text-sm font-bold text-black">{property.title}</p><p className="text-xs text-gray-500">{property.neighborhood} - {property.city}</p></li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documentação */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white">Documentação</h4>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Documento de Identidade (RG/CNH)</label>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setIdDocumentFile(e.target.files?.[0] || null)}
                                    className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Comprovante de Residência</label>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setProofAddressFile(e.target.files?.[0] || null)}
                                    className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Comprovante de Renda</label>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setIncomeProofFile(e.target.files?.[0] || null)}
                                    className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </form>
            <div className="fixed bottom-0 right-0 left-0 lg:left-[288px] bg-white border-t border-gray-100 p-6 flex justify-end gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-20">
                <button onClick={onCancel} className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Cancelar</button>
                <button onClick={handleSaveClient} disabled={loading} className="bg-[#4A5D23] text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50">{loading ? 'Salvando...' : 'Finalizar Cadastro'}</button>
            </div>
        </div>
    );
};

export default ClientForm;
