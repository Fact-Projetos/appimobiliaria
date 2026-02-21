
import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { supabase } from '../lib/supabaseClient';

interface PropertyDetailsProps {
  property: Property;
  onBack: () => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onBack }) => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  // Combine all images: Cover -> Gallery -> Inspection
  const [allImages, setAllImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const images: string[] = [];

    // 1. Cover Image
    if (property.imageUrl) {
      images.push(property.imageUrl);
    }

    // 2. Gallery Images (CSV string)
    if (property.galleryUrls && property.galleryUrls.trim() !== '') {
      const gallery = property.galleryUrls.split(',').filter(url => url.trim() !== '');
      images.push(...gallery);
    }

    // 3. Inspection Images (CSV string) - Added per request to see everything
    if (property.inspectionUrls && property.inspectionUrls.trim() !== '') {
      const inspection = property.inspectionUrls.split(',').filter(url => url.trim() !== '');
      images.push(...inspection);
    }

    // Deduplicate just in case
    const uniqueImages = Array.from(new Set(images));

    setAllImages(uniqueImages);
    if (uniqueImages.length > 0) {
      setActiveImage(uniqueImages[0]);
    } else {
      setActiveImage('https://via.placeholder.com/800x600?text=Sem+Imagem');
    }
  }, [property]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImage, allImages]); // Dependência importante para pegar o estado atual

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    const currentIndex = allImages.indexOf(activeImage);
    const nextIndex = (currentIndex + 1) % allImages.length;
    setActiveImage(allImages[nextIndex]);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    const currentIndex = allImages.indexOf(activeImage);
    const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    setActiveImage(allImages[prevIndex]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSendProposal = async () => {
    if (!formState.name || !formState.phone) {
      alert("Por favor, preencha pelo menos Nome e Telefone.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('contacts').insert([{
        name: formState.name,
        email: formState.email,
        phone: formState.phone,
        message: formState.message,
        property_id: property.id,
        property_title: property.title,
        status: 'Novo'
      }]);

      if (error) {
        if (error.code === '42P01') {
          alert('A tabela "contacts" não existe no Supabase. Por favor, solicite ao admin que execute o script SQL de atualização.');
        } else {
          alert("Erro ao enviar: " + error.message);
        }
      } else {
        alert("Proposta enviada com sucesso! Entraremos em contato em breve.");
        setFormState({ name: '', email: '', phone: '', message: '' });
      }
    } catch (e: any) {
      alert("Erro inesperado: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const message = `Olá, tenho interesse no imóvel: ${property.title}.`;
    const whatsappUrl = `https://wa.me/5511966255047?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const condoPrice = property.condoPrice || 0;
  const iptuPrice = property.iptuPrice || 0;
  const totalPrice = property.price + condoPrice + iptuPrice;

  return (
    <div className="bg-[#fcfcfc] min-h-screen animate-fadeIn">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-20 z-30 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-[#4A5D23] transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar para resultados
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Header Info */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md">
                  {property.type}
                </span>
                <span className="bg-[#4A5D23] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md">
                  {property.operation}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <p className="text-gray-500 text-sm md:text-base flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#4A5D23]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {property.street}, {property.neighborhood} - {property.city}
              </p>
            </div>

            {/* Image Gallery Section */}
            <div className="space-y-4 select-none">
              {/* Main Hero Image */}
              <div
                className="rounded-2xl overflow-hidden shadow-lg aspect-video relative group bg-gray-100 cursor-pointer"
                onClick={() => setIsFullscreen(true)}
              >
                <img
                  src={activeImage}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-between p-4 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={handlePrevImage}
                    className="p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-black transition-all transform hover:scale-110 shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-black transition-all transform hover:scale-110 shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded text-white text-xs font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  {allImages.indexOf(activeImage) + 1} / {allImages.length}
                </div>
              </div>

              {/* Thumbnails Strip */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`snap-start relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${activeImage === img
                        ? 'border-[#4A5D23] opacity-100 ring-2 ring-[#4A5D23] ring-opacity-50'
                        : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-y border-gray-100 py-8">
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-50">
                <span className="text-3xl font-light text-[#4A5D23] mb-1">{property.area}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Metros Quadrados</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-50">
                <span className="text-3xl font-light text-[#4A5D23] mb-1">{property.bedrooms}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dormitórios</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-50">
                <span className="text-3xl font-light text-[#4A5D23] mb-1">{property.bathrooms}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Banheiros</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-50">
                <span className="text-3xl font-light text-[#4A5D23] mb-1">{property.parkingSpaces}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Vagas</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-50">
                <span className="text-3xl font-light text-[#4A5D23] mb-1">{property.pets ? 'Sim' : 'Não'}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Aceita Pets</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-50">
                <span className="text-3xl font-light text-[#4A5D23] mb-1">{property.furnished ? 'Sim' : 'Não'}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mobiliado</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide">Sobre o Imóvel</h3>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-50 text-gray-600 leading-relaxed text-sm md:text-base">
                {property.description}
                <br /><br />
                <p>Este imóvel destaca-se pela sua localização privilegiada e acabamentos de alto padrão. Ideal para quem busca conforto, segurança e qualidade de vida. Agende uma visita e venha conhecer pessoalmente todos os detalhes.</p>
              </div>
            </div>

          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">

              {/* Pricing Box */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Valores</h3>

                {property.operation === 'Aluguel' ? (
                  <>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm text-gray-600">Aluguel</span>
                      <span className="text-lg font-semibold text-black">{formatCurrency(property.price)}</span>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm text-gray-600">Condomínio</span>
                      <span className="text-base text-gray-500">{condoPrice > 0 ? formatCurrency(condoPrice) : '-'}</span>
                    </div>
                    <div className="flex justify-between items-end mb-6">
                      <span className="text-sm text-gray-600">IPTU</span>
                      <span className="text-base text-gray-500">{iptuPrice > 0 ? formatCurrency(iptuPrice) : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-sm font-bold uppercase tracking-widest text-black">Total Mensal</span>
                      <span className="text-2xl font-bold text-[#4A5D23]">{formatCurrency(totalPrice)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-sm font-bold uppercase tracking-widest text-black">Valor de Venda</span>
                      <span className="text-2xl font-bold text-[#4A5D23]">{formatCurrency(property.price)}</span>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm text-gray-600">Condomínio</span>
                      <span className="text-base text-gray-500">{condoPrice > 0 ? formatCurrency(condoPrice) : '-'}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-gray-600">IPTU (Anual)</span>
                      <span className="text-base text-gray-500">{iptuPrice > 0 ? formatCurrency(iptuPrice) : '-'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Contact Form */}
              <div className="bg-[#1a1a1a] text-white p-6 rounded-2xl shadow-xl">
                <h3 className="text-lg font-bold mb-1">Interessou?</h3>
                <p className="text-gray-400 text-xs mb-6">Preencha seus dados para agendar uma visita.</p>

                <form className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    placeholder="Nome completo"
                    className="w-full bg-[#2a2a2a] border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-[#4A5D23] outline-none placeholder-gray-500 text-white"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    placeholder="Seu e-mail"
                    className="w-full bg-[#2a2a2a] border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-[#4A5D23] outline-none placeholder-gray-500 text-white"
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    placeholder="Telefone / WhatsApp"
                    className="w-full bg-[#2a2a2a] border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-[#4A5D23] outline-none placeholder-gray-500 text-white"
                  />
                  <textarea
                    rows={3}
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    placeholder={`Informe o periodo de estadia...\nEx: 00/00/0000 a 00/00/0000`}
                    className="w-full bg-[#2a2a2a] border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-[#4A5D23] outline-none placeholder-gray-500 text-white"
                  ></textarea>

                  <button
                    type="button"
                    onClick={handleSendProposal}
                    disabled={loading}
                    className="w-full bg-[#4A5D23] hover:bg-[#3a4a1c] text-white font-bold py-3 rounded-lg uppercase tracking-widest text-xs transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar Proposta'}
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="w-full bg-transparent border border-gray-600 hover:border-white text-white font-bold py-3 rounded-lg uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                    Falar no WhatsApp
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fadeIn">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-50 p-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <button
            onClick={handlePrevImage}
            className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors p-4 hover:bg-white/10 rounded-full"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>

          <img
            src={activeImage}
            alt="Fullscreen"
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
          />

          <button
            onClick={handleNextImage}
            className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-colors p-4 hover:bg-white/10 rounded-full"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/70 font-mono text-sm bg-black/50 px-4 py-1 rounded-full">
            {allImages.indexOf(activeImage) + 1} / {allImages.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
