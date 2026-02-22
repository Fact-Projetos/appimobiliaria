
import React, { useState } from 'react';
import { Property, Client } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { fetchAddressByCep } from '../../lib/utils';

interface ClientFormProps {
    properties: Property[];
    onCancel: () => void;
    onSuccess: () => void;
    editingClient?: Client | null;
}

const ClientForm: React.FC<ClientFormProps> = ({ properties, onCancel, onSuccess, editingClient }) => {
    const [clientData, setClientData] = useState({
        // Tenant Info
        name: editingClient?.name || '',
        cpf: editingClient?.cpf || '',
        email: editingClient?.email || '',
        phone: editingClient?.phone || '',
        address: editingClient?.address || '',
        city: editingClient?.city || '',
        state: editingClient?.state || '',
        zip: editingClient?.zip || '',
        // Locator Info
        locator_name: editingClient?.locator_name || '',
        locator_cpf: editingClient?.locator_cpf || '',
        locator_email: editingClient?.locator_email || '',
        locator_phone: editingClient?.locator_phone || '',
        // Contract Info
        contract_start_date: editingClient?.contract_start_date || '',
        contract_end_date: editingClient?.contract_end_date || '',
        contract_duration: editingClient?.contract_duration?.toString() || '',
        payment_due_day: editingClient?.payment_due_day?.toString() || '',
        contract_value: editingClient?.contract_value?.toString() || '',
        property_conditions: editingClient?.property_conditions || 'Pintura Realizada',
        rental_warranty: editingClient?.rental_warranty || 'Caução',
        condo_variation: editingClient?.condo_variation || 'Sem Variação',
        residents: editingClient?.residents || ''
    });

    // Add another state for property interest if it comes from the object
    React.useEffect(() => {
        if (editingClient?.property_interest) {
            setPropertySearch(editingClient.property_interest);
            const prop = properties.find(p => p.title === editingClient.property_interest);
            if (prop) {
                setPropertyCode(prop.id);
                setSelectedPropertyPrice(prop.price.toString());
            }
        }
    }, [editingClient, properties]);

    // File states
    const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
    const [proofAddressFile, setProofAddressFile] = useState<File | null>(null);
    const [incomeProofFile, setIncomeProofFile] = useState<File | null>(null);

    const [idDocPreview, setIdDocPreview] = useState<string>(editingClient?.id_document_url || '');
    const [proofAddressPreview, setProofAddressPreview] = useState<string>(editingClient?.proof_of_address_url || '');
    const [incomeProofPreview, setIncomeProofPreview] = useState<string>(editingClient?.income_proof_url || '');

    const [propertySearch, setPropertySearch] = useState('');
    const [propertyCode, setPropertyCode] = useState('');
    const [selectedPropertyPrice, setSelectedPropertyPrice] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filter properties for auto-complete
    const filteredProperties = propertySearch.length > 0
        ? properties.filter(p => p.title.toLowerCase().includes(propertySearch.toLowerCase()))
        : [];

    const handleSelectProperty = (property: Property) => {
        setPropertySearch(property.title);
        setPropertyCode(property.id);
        setSelectedPropertyPrice(property.price.toString());
        // Auto-fill contract value
        setClientData(prev => ({ ...prev, contract_value: property.price.toString() }));
        setShowSuggestions(false);
    };

    // Auto-fetch tenant address when CEP changes
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

            const payload = {
                name: clientData.name,
                cpf: clientData.cpf,
                email: clientData.email,
                phone: clientData.phone,
                address: clientData.address,
                city: clientData.city,
                state: clientData.state,
                zip: clientData.zip,
                property_interest: propertySearch,

                locator_name: clientData.locator_name,
                locator_cpf: clientData.locator_cpf,
                locator_email: clientData.locator_email,
                locator_phone: clientData.locator_phone,

                contract_start_date: clientData.contract_start_date || null,
                contract_end_date: clientData.contract_end_date || null,
                contract_duration: clientData.contract_duration ? Number(clientData.contract_duration) : null,
                contract_value: clientData.contract_value ? Number(clientData.contract_value) : null,
                payment_due_day: clientData.payment_due_day ? Number(clientData.payment_due_day) : null,

                status: editingClient?.status || 'Contrato Ativo',
                property_conditions: clientData.property_conditions,
                rental_warranty: clientData.rental_warranty,
                condo_variation: clientData.condo_variation,
                residents: clientData.residents,
                id_document_url: idDocumentUrl || editingClient?.id_document_url,
                proof_of_address_url: proofAddressUrl || editingClient?.proof_of_address_url,
                income_proof_url: incomeProofUrl || editingClient?.income_proof_url
            };

            let result;
            if (editingClient?.id) {
                result = await supabase.from('clients').update(payload).eq('id', editingClient.id);
            } else {
                result = await supabase.from('clients').insert([payload]);
            }

            if (result.error) {
                alert('Erro ao salvar contrato: ' + result.error.message);
            } else {
                alert('Contrato salvo com sucesso!');
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
                <h3 className="text-xl font-bold text-black">{editingClient ? 'Editar Contrato' : 'Novo Contrato'}</h3>
            </div>

            <form className="space-y-4 pb-32">

                {/* Section 1: Dados do Locador */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Dados do Locador</h4>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nome/Razão Social</label>
                                <input type="text" name="locator_name" value={clientData.locator_name} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Nome do Locador" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">CNPJ/CPF</label>
                                <input type="text" name="locator_cpf" value={clientData.locator_cpf} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Telefone</label>
                                <input type="text" name="locator_phone" value={clientData.locator_phone} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="(00) 00000-0000" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Email</label>
                                <input type="email" name="locator_email" value={clientData.locator_email} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="email@exemplo.com" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Dados do Locatário */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Dados do Locatário</h4>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nome/Razão Social</label>
                                <input type="text" name="name" value={clientData.name} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Nome do Locatário" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">CNPJ/CPF</label>
                                <input type="text" name="cpf" value={clientData.cpf} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Telefone</label>
                                <input type="text" name="phone" value={clientData.phone} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="(11) 99999-9999" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Email</label>
                                <input type="email" name="email" value={clientData.email} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="email@exemplo.com" />
                            </div>
                        </div>
                        {/* Tenant Address Fields - Inline */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-gray-100 pt-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">CEP</label>
                                <input type="text" name="zip" value={clientData.zip} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="00000-000" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Cidade</label>
                                <input type="text" name="city" value={clientData.city} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Cidade" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Endereço</label>
                                <input type="text" name="address" value={clientData.address} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Rua, Av..." />
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Residentes do Imóvel (Nome e CPF)</label>
                            <textarea
                                name="residents"
                                value={clientData.residents}
                                onChange={(e) => setClientData(prev => ({ ...prev, residents: e.target.value }))}
                                placeholder="Ex: Nome do Residente - CPF: 000.000.000-00 (Um por linha)"
                                className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs min-h-[80px]"
                            />
                            <p className="text-[9px] text-gray-400 mt-1 italic">Insira um residente por linha conforme o exemplo acima.</p>
                        </div>
                    </div>
                </div>

                {/* Section 3: Informações do Imóvel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Informações do Imóvel</h4>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Cód. do Imóvel</label>
                                <input type="text" value={propertyCode} readOnly className="w-full p-2 bg-gray-100 border border-transparent rounded-lg text-gray-600 font-bold outline-none cursor-not-allowed text-xs" placeholder="Cód." />
                            </div>
                            <div className="md:col-span-3 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Imóvel Pretendido</label>
                                <input type="text" value={propertySearch} onChange={(e) => { setPropertySearch(e.target.value); setShowSuggestions(true); if (e.target.value === '') setPropertyCode(''); }} onFocus={() => setShowSuggestions(true)} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Digite para buscar o imóvel..." />
                                {showSuggestions && filteredProperties.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredProperties.map((property) => (
                                            <li key={property.id} onClick={() => handleSelectProperty(property)} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"><p className="text-sm font-bold text-black">{property.title}</p><p className="text-xs text-gray-500">{property.neighborhood} - {property.city}</p></li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Valor Anunciado</label>
                                <input type="text" readOnly value={selectedPropertyPrice ? `R$ ${Number(selectedPropertyPrice).toFixed(2)}` : ''} className="w-full p-2 bg-gray-100 border border-transparent rounded-lg text-gray-600 font-bold outline-none cursor-not-allowed text-xs" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Condições do Imóvel</label>
                                <select name="property_conditions" value={clientData.property_conditions} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs">
                                    <option value="Pintura Realizada">Pintura Realizada</option>
                                    <option value="Pintura ñ Realizada">Pintura ñ Realizada</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Condomínio (Variação)</label>
                                <select name="condo_variation" value={clientData.condo_variation} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs">
                                    <option value="Com Variação">Com Variação</option>
                                    <option value="Sem Variação">Sem Variação</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 4: Prazos e Vencimentos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Prazos e Vencimentos</h4>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Data Inicial</label>
                                <input type="date" name="contract_start_date" value={clientData.contract_start_date} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Data Final</label>
                                <input type="date" name="contract_end_date" value={clientData.contract_end_date} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Total em Meses</label>
                                <input type="number" name="contract_duration" value={clientData.contract_duration} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="30" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Vencimento Fatura</label>
                                <select name="payment_due_day" value={clientData.payment_due_day} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs">
                                    <option value="">Selecione</option>
                                    {[1, 5, 10, 15, 20, 25, 30].map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Garantia Locatícia</label>
                                <select name="rental_warranty" value={clientData.rental_warranty} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs">
                                    <option value="Caução">Caução</option>
                                    <option value="Seguro Fiança">Seguro Fiança</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-20">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Documentação</h4>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="flex flex-col items-center">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block w-full text-left">Documento de Identidade (RG/CNH)</label>
                                <div className="w-full h-32 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-2">
                                    {idDocPreview ? (
                                        idDocPreview.toLowerCase().endsWith('.pdf') ? (
                                            <div className="text-gray-400 flex flex-col items-center">
                                                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                                <span className="text-[10px]">Documento PDF</span>
                                            </div>
                                        ) : (
                                            <img src={idDocPreview} alt="Preview" className="w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <div className="text-gray-300 flex flex-col items-center">
                                            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            <span className="text-[10px]">Sem visualização</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setIdDocumentFile(file);
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            setIdDocPreview(url);
                                        }
                                    }}
                                    className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                                />
                            </div>
                            <div className="flex flex-col items-center">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block w-full text-left">Comprovante de Residência</label>
                                <div className="w-full h-32 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-2">
                                    {proofAddressPreview ? (
                                        proofAddressPreview.toLowerCase().endsWith('.pdf') ? (
                                            <div className="text-gray-400 flex flex-col items-center">
                                                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                                <span className="text-[10px]">Documento PDF</span>
                                            </div>
                                        ) : (
                                            <img src={proofAddressPreview} alt="Preview" className="w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <div className="text-gray-300 flex flex-col items-center">
                                            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            <span className="text-[10px]">Sem visualização</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setProofAddressFile(file);
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            setProofAddressPreview(url);
                                        }
                                    }}
                                    className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                                />
                            </div>
                            <div className="flex flex-col items-center">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block w-full text-left">Comprovante de Renda</label>
                                <div className="w-full h-32 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-2">
                                    {incomeProofPreview ? (
                                        incomeProofPreview.toLowerCase().endsWith('.pdf') ? (
                                            <div className="text-gray-400 flex flex-col items-center">
                                                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                                <span className="text-[10px]">Documento PDF</span>
                                            </div>
                                        ) : (
                                            <img src={incomeProofPreview} alt="Preview" className="w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <div className="text-gray-300 flex flex-col items-center">
                                            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            <span className="text-[10px]">Sem visualização</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setIncomeProofFile(file);
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            setIncomeProofPreview(url);
                                        }
                                    }}
                                    className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </form>
            <div className="fixed bottom-0 right-0 left-0 lg:left-[288px] bg-white border-t border-gray-100 p-6 flex justify-end gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-20">
                <button onClick={onCancel} className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Cancelar</button>
                <button onClick={handleSaveClient} disabled={loading} className="bg-[#4A5D23] text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50">{loading ? 'Salvando...' : (editingClient ? 'Salvar Alterações' : 'Finalizar Contrato')}</button>
            </div>
        </div>
    );
};

export default ClientForm;
