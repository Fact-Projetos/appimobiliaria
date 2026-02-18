
import React, { useState, useEffect } from 'react';
import { Property } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { fetchAddressByCep } from '../../lib/utils';

interface PropertyFormProps {
    editingProperty: Property | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ editingProperty, onCancel, onSuccess }) => {
    // New state for form fields to support saving
    const [formData, setFormData] = useState({
        title: 'Novo Imóvel',
        type: 'Casa',
        operation: 'Venda',
        price: '',
        condoPrice: '',
        iptuPrice: '',
        fireInsurance: '',
        serviceCharge: '',
        city: '',
        neighborhood: '',
        street: '',
        number: '',
        complement: '',
        state: '',
        zip: '',
        description: '',
        bedrooms: '',
        bathrooms: '',
        parkingSpaces: '',
        area: '',
        pets: false,
        furnished: false,
        ownerName: '',
        ownerCpf: '',
        ownerPhone: ''
    });

    // File states for uploads
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
    const [inspectionFiles, setInspectionFiles] = useState<FileList | null>(null);

    const [loading, setLoading] = useState(false);

    // Auto-fetch address when CEP changes
    useEffect(() => {
        const fetchAddress = async () => {
            const cep = formData.zip;
            if (cep) {
                const cleanCep = cep.replace(/\D/g, '');
                if (cleanCep.length === 8) {
                    const addressData = await fetchAddressByCep(cleanCep);
                    if (addressData) {
                        setFormData(prev => ({
                            ...prev,
                            city: addressData.city,
                            neighborhood: addressData.neighborhood,
                            street: addressData.street,
                            state: addressData.state
                        }));
                    }
                }
            }
        };
        fetchAddress();
    }, [formData.zip]);

    // Populate form if editing
    useEffect(() => {
        if (editingProperty) {
            setFormData({
                title: editingProperty.title,
                type: editingProperty.type,
                operation: editingProperty.operation,
                price: editingProperty.price.toString(),
                condoPrice: editingProperty.condoPrice?.toString() || '',
                iptuPrice: editingProperty.iptuPrice?.toString() || '',
                fireInsurance: editingProperty.fireInsurance?.toString() || '',
                serviceCharge: editingProperty.serviceCharge?.toString() || '',
                city: editingProperty.city,
                neighborhood: editingProperty.neighborhood,
                street: editingProperty.street || '',
                number: editingProperty.number || '',
                complement: editingProperty.complement || '',
                state: editingProperty.state || '',
                zip: editingProperty.zip || '',
                description: editingProperty.description || '',
                bedrooms: editingProperty.bedrooms.toString(),
                bathrooms: editingProperty.bathrooms.toString(),
                parkingSpaces: editingProperty.parkingSpaces?.toString() || '0',
                area: editingProperty.area.toString(),
                pets: editingProperty.pets || false,
                furnished: editingProperty.furnished || false,
                ownerName: editingProperty.ownerName || '',
                ownerCpf: editingProperty.ownerCpf || '',
                ownerPhone: editingProperty.ownerPhone || ''
            });
        }
    }, [editingProperty]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // Helper to upload multiple files
    const uploadFiles = async (files: FileList | null, prefix: string): Promise<string[]> => {
        if (!files || files.length === 0) return [];
        const uploadedUrls: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // Ensure file names are unique enough
                const fileName = `${prefix}_${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
                const { error: uploadError } = await supabase.storage.from('properties').upload(fileName, file);

                if (uploadError) {
                    console.error(`Erro upload ${prefix} ${i}:`, uploadError);
                } else {
                    const { data: publicData } = supabase.storage.from('properties').getPublicUrl(fileName);
                    uploadedUrls.push(publicData.publicUrl);
                }
            } catch (e) {
                console.warn(`Upload falhou para ${prefix} ${i}`, e);
            }
        }
        return uploadedUrls;
    }

    const handleSave = async () => {
        setLoading(true);
        try {
            let coverUrl = editingProperty?.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'; // Fallback or Keep Existing
            let galleryUrlString = editingProperty?.galleryUrls || '';
            let inspectionUrlString = editingProperty?.inspectionUrls || '';

            // 1. Upload Cover Image (Only if new file selected)
            if (coverFile) {
                // Tenta upload, se bucket não existir, vai falhar.
                try {
                    const fileName = `cover_${Date.now()}_${coverFile.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    const { error: uploadError } = await supabase.storage.from('properties').upload(fileName, coverFile);

                    if (uploadError) {
                        console.error("Erro upload capa:", uploadError);
                        alert(`Erro ao subir foto de capa: ${uploadError.message}. Verifique se o bucket 'properties' foi criado.`);
                    } else {
                        const { data: publicData } = supabase.storage.from('properties').getPublicUrl(fileName);
                        coverUrl = publicData.publicUrl;
                    }
                } catch (e) {
                    console.warn("Upload falhou excepcionalmente.");
                }
            }

            // 2. Upload Gallery Images
            if (galleryFiles && galleryFiles.length > 0) {
                const newGalleryUrls = await uploadFiles(galleryFiles, 'gallery');
                if (newGalleryUrls.length > 0) {
                    const existing = galleryUrlString ? galleryUrlString.split(',') : [];
                    const combined = [...existing, ...newGalleryUrls];
                    galleryUrlString = combined.join(',');
                }
            }

            // 3. Upload Inspection Images
            if (inspectionFiles && inspectionFiles.length > 0) {
                const newInspectionUrls = await uploadFiles(inspectionFiles, 'inspection');
                if (newInspectionUrls.length > 0) {
                    const existing = inspectionUrlString ? inspectionUrlString.split(',') : [];
                    const combined = [...existing, ...newInspectionUrls];
                    inspectionUrlString = combined.join(',');
                }
            }

            // 4. Save to Database
            const payload = {
                title: formData.title,
                type: formData.type,
                operation: formData.operation,
                price: Number(formData.price || 0),
                condo_price: Number(formData.condoPrice || 0),
                iptu_price: Number(formData.iptuPrice || 0),
                fire_insurance: Number(formData.fireInsurance || 0),
                service_charge: Number(formData.serviceCharge || 0),
                city: formData.city,
                neighborhood: formData.neighborhood,
                street: formData.street,
                number: formData.number,
                complement: formData.complement,
                state: formData.state,
                zip: formData.zip,
                description: formData.description,
                bedrooms: Number(formData.bedrooms || 0),
                bathrooms: Number(formData.bathrooms || 0),
                parking_spaces: Number(formData.parkingSpaces || 0),
                area: Number(formData.area || 0),
                pets: formData.pets,
                furnished: formData.furnished,
                image_url: coverUrl,
                gallery_urls: galleryUrlString,
                inspection_urls: inspectionUrlString,
                owner_name: formData.ownerName,
                owner_cpf: formData.ownerCpf,
                owner_phone: formData.ownerPhone
            };

            let error;
            if (editingProperty) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('properties')
                    .update(payload)
                    .eq('id', parseInt(editingProperty.id));
                error = updateError;
            } else {
                // INSERT
                const { error: insertError } = await supabase
                    .from('properties')
                    .insert([payload]);
                error = insertError;
            }

            if (error) {
                console.error("Erro insert/update properties:", error);
                if (error.code === '42P01') {
                    alert('A tabela "properties" não existe no Supabase. Por favor, execute o script SQL fornecido no SQL Editor do Supabase.');
                } else {
                    alert('Erro ao salvar imóvel: ' + error.message);
                }
            } else {
                alert(editingProperty ? 'Imóvel atualizado com sucesso!' : 'Imóvel criado com sucesso!');
                onSuccess();
            }
        } catch (err: any) {
            alert('Erro inesperado: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const total = (
        (parseFloat(formData.price) || 0) +
        (parseFloat(formData.condoPrice) || 0) +
        (parseFloat(formData.iptuPrice) || 0) +
        (parseFloat(formData.fireInsurance) || 0) +
        (parseFloat(formData.serviceCharge) || 0)
    ).toFixed(2);

    return (
        <div className="animate-fadeIn space-y-10">
            <div className="flex items-center justify-between">
                <button onClick={onCancel} className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Voltar para Lista</button>
                <h3 className="text-xl font-bold text-black">{editingProperty ? 'Editar Imóvel' : 'Novo Cadastro de Imóvel'}</h3>
            </div>

            <form className="space-y-4 pb-32">
                {/* Dados do Imóvel Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Dados do Imóvel</h4>
                    </div>
                    <div className="p-5 space-y-3">
                        {/* Row 1 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Tipo de Imóvel</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs">
                                    <option value="Casa">Casa</option>
                                    <option value="Apartamento">Apartamento</option>
                                    <option value="Terreno">Terreno</option>
                                    <option value="Comercial">Comercial</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Objetivo</label>
                                <select name="operation" value={formData.operation} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs">
                                    <option value="Venda">Venda</option>
                                    <option value="Aluguel">Aluguel</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Título do Anúncio</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Título do Anúncio" />
                            </div>
                        </div>

                        {/* Row 2: Address */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">CEP</label>
                                <input type="text" name="zip" value={formData.zip} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="00000-000" />
                            </div>
                            <div className="md:col-span-6">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Logradouro</label>
                                <input type="text" name="street" value={formData.street} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Rua, Avenida..." />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nº</label>
                                <input type="text" name="number" value={formData.number} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="123" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Complemento</label>
                                <input type="text" name="complement" value={formData.complement} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Apto 101" />
                            </div>
                        </div>

                        {/* Row 3: City */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Bairro</label>
                                <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Bairro" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Cidade</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Cidade" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">UF</label>
                                <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="SP" />
                            </div>
                        </div>

                        {/* Row 4: Specs */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">M²</label>
                                <input type="number" name="area" value={formData.area} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Quartos</label>
                                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Banheiros</label>
                                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Vagas</label>
                                <input type="number" name="parkingSpaces" value={formData.parkingSpaces} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="0" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Aceita Pets</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="pets" checked={formData.pets} onChange={handleChange} className="w-4 h-4 text-[#4A5D23] rounded focus:ring-[#4A5D23] border-gray-300" />
                                        <span className="text-xs">Sim</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Mobiliado</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="furnished" checked={formData.furnished} onChange={handleChange} className="w-4 h-4 text-[#4A5D23] rounded focus:ring-[#4A5D23] border-gray-300" />
                                        <span className="text-xs">Sim</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Descrição do Imóvel</label>
                            <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Descrição completa..." />
                        </div>
                    </div>
                </div>

                {/* Valore Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Valores</h4>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Aluguel/Venda</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="0,00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Condomínio</label>
                                <input type="number" name="condoPrice" value={formData.condoPrice} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="0,00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Seguro Incêndio</label>
                                <input type="number" name="fireInsurance" value={formData.fireInsurance} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="0,00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">IPTU</label>
                                <input type="number" name="iptuPrice" value={formData.iptuPrice} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="0,00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Taxa de Serviço</label>
                                <input type="number" name="serviceCharge" value={formData.serviceCharge} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="0,00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Total (R$)</label>
                                <input type="text" readOnly value={total} className="w-full p-2 bg-gray-100 border border-transparent rounded-lg text-gray-800 font-bold outline-none cursor-not-allowed text-xs" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dados do Proprietário Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Dados do Proprietário</h4>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nome Completo</label>
                                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="Nome do Proprietário" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">CPF</label>
                                <input type="text" name="ownerCpf" value={formData.ownerCpf} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Telefone</label>
                                <input type="text" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs" placeholder="(00) 00000-0000" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Imagens Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#4A5D23] px-6 py-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Imagens e Vistoria</h4>
                    </div>
                    <div className="p-5">
                        <div className="mb-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Foto de Capa {editingProperty && '(Deixe vazio para manter)'}</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                            />
                            {editingProperty && <p className="text-[10px] text-green-600 mt-1">Imagem atual mantida se não enviar nova.</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Galeria de Fotos (Adicionar Novas)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setGalleryFiles(e.target.files)}
                                    className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Fotos da Vistoria (Adicionar Novas)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setInspectionFiles(e.target.files)}
                                    className="w-full p-2 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
            <div className="fixed bottom-0 right-0 left-0 lg:left-[288px] bg-white border-t border-gray-100 p-6 flex justify-end gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <button onClick={onCancel} className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Cancelar</button>
                <button onClick={handleSave} disabled={loading} className="bg-[#4A5D23] text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar Imóvel'}</button>
            </div>
        </div>
    );
};

export default PropertyForm;
