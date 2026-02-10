
import React, { useState, useEffect } from 'react';
import { Property } from '../../types';
import { supabase } from '../../lib/supabaseClient';

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
        city: '',
        neighborhood: '',
        street: '',
        description: '',
        bedrooms: '',
        bathrooms: '',
        parkingSpaces: '',
        area: ''
    });

    // File states for uploads
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
    const [inspectionFiles, setInspectionFiles] = useState<FileList | null>(null);

    const [loading, setLoading] = useState(false);

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
                city: editingProperty.city,
                neighborhood: editingProperty.neighborhood,
                street: editingProperty.street || '',
                description: editingProperty.description || '',
                bedrooms: editingProperty.bedrooms.toString(),
                bathrooms: editingProperty.bathrooms.toString(),
                parkingSpaces: editingProperty.parkingSpaces?.toString() || '0',
                area: editingProperty.area.toString()
            });
        }
    }, [editingProperty]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                city: formData.city,
                neighborhood: formData.neighborhood,
                street: formData.street,
                description: formData.description,
                bedrooms: Number(formData.bedrooms || 0),
                bathrooms: Number(formData.bathrooms || 0),
                parking_spaces: Number(formData.parkingSpaces || 0),
                area: Number(formData.area || 0),
                image_url: coverUrl,
                gallery_urls: galleryUrlString,
                inspection_urls: inspectionUrlString
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
        (parseFloat(formData.iptuPrice) || 0)
    ).toFixed(2);

    return (
        <div className="animate-fadeIn space-y-10">
            <div className="flex items-center justify-between">
                <button onClick={onCancel} className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Voltar para Lista</button>
                <h3 className="text-xl font-bold text-black">{editingProperty ? 'Editar Imóvel' : 'Novo Cadastro de Imóvel'}</h3>
            </div>
            <form className="space-y-8 pb-32">
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-8"><div className="w-8 h-8 bg-[#4A5D23] text-white rounded-lg flex items-center justify-center mr-3 font-bold text-sm">01</div><h4 className="text-sm font-bold uppercase tracking-widest text-black">Dados do Imóvel</h4></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Imóvel</label><select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm"><option value="Casa">Casa</option><option value="Apartamento">Apartamento</option><option value="Terreno">Terreno</option><option value="Comercial">Comercial</option></select></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Tipo de Negócio</label><select name="operation" value={formData.operation} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm"><option value="Venda">Venda</option><option value="Aluguel">Aluguel</option></select></div>
                        <div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Título do Anúncio</label><input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="Ex: Casa Linda nos Jardins" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="md:col-span-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Cidade</label><input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="Cidade" /></div>
                        <div className="md:col-span-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Bairro</label><input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="Bairro" /></div>
                        <div className="md:col-span-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Logradouro</label><input type="text" name="street" value={formData.street} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="Rua, Av..." /></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">M²</label><input type="number" name="area" value={formData.area} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Quartos</label><input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Banheiros</label><input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Vagas</label><input type="number" name="parkingSpaces" value={formData.parkingSpaces} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="0" /></div>
                    </div>
                    <div className="mt-6"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Descrição</label><input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="Descrição do imóvel..." /></div>
                </section>

                <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-8"><div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center mr-3 font-bold text-sm">03</div><h4 className="text-sm font-bold uppercase tracking-widest text-black">Valores</h4></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Aluguel / Venda (R$)</label><input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="0,00" /></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Condomínio (R$)</label><input type="number" name="condoPrice" value={formData.condoPrice} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="0,00" /></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">IPTU (R$)</label><input type="number" name="iptuPrice" value={formData.iptuPrice} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm" placeholder="0,00" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Total (R$)</label><input type="text" readOnly value={total} className="w-full p-3 bg-gray-100 border border-transparent rounded-lg text-gray-600 font-bold outline-none cursor-not-allowed" placeholder="0,00" /></div>
                    </div>
                </section>

                <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-8"><div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center mr-3 font-bold text-sm">03</div><h4 className="text-sm font-bold uppercase tracking-widest text-black">Imagens & Vistoria</h4></div>

                    <div className="mb-6">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Foto de Capa {editingProperty && '(Deixe vazio para manter)'}</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                            className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                        />
                        {editingProperty && <p className="text-xs text-green-600 mt-1">Imagem atual mantida se não enviar nova.</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Galeria de Fotos (Adicionar Novas)</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => setGalleryFiles(e.target.files)}
                                className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Fotos da Vistoria (Adicionar Novas)</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => setInspectionFiles(e.target.files)}
                                className="w-full p-3 bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-[#4A5D23] outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A5D23] file:text-white hover:file:bg-black transition-all"
                            />
                        </div>
                    </div>
                </section>
            </form>
            <div className="fixed bottom-0 right-0 left-0 lg:left-[288px] bg-white border-t border-gray-100 p-6 flex justify-end gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <button onClick={onCancel} className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Cancelar</button>
                <button onClick={handleSave} disabled={loading} className="bg-[#4A5D23] text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar Imóvel'}</button>
            </div>
        </div>
    );
};

export default PropertyForm;
