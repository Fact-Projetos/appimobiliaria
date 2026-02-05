
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Partner, CompanySettings } from '../types';

interface FooterProps {
  companySettings: CompanySettings | null;
}

const Footer: React.FC<FooterProps> = ({ companySettings }) => {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Partners
        const { data: partnersData } = await supabase.from('partners').select('*');
        if (partnersData) {
          setPartners(partnersData as unknown as Partner[]);
        }
      } catch (e) {
        console.error('Error fetching footer data:', e);
      }
    };
    fetchData();
  }, []);

  // Helpers for display
  const getAddress = () => {
    if (companySettings?.address) {
      return `${companySettings.address}${companySettings.number ? `, ${companySettings.number}` : ''}`;
    }
    return 'Av. Brigadeiro Faria Lima, 2500';
  };

  const getCityState = () => {
    if (companySettings?.city || companySettings?.state) {
      return `${companySettings.city || ''} - ${companySettings.state || ''}`;
    }
    return 'São Paulo - SP';
  }

  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-6">
              <div className="mr-3">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5L95 50L50 95L5 50L50 5Z" stroke="#4A5D23" strokeWidth="2" strokeMiterlimit="10" />
                  <rect x="35" y="45" width="4" height="25" fill="#ffffff" />
                  <rect x="42" y="35" width="4" height="35" fill="#4A5D23" />
                  <rect x="49" y="30" width="4" height="40" fill="#ffffff" />
                  <rect x="56" y="35" width="4" height="35" fill="#4A5D23" />
                  <rect x="63" y="45" width="4" height="25" fill="#ffffff" />
                </svg>
              </div>
              <h2 className="text-lg font-bold">Nascimento</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Excelência e transparência em negócios imobiliários. Encontre o imóvel que precisa.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Links Rápidos</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-[#4A5D23] transition-colors">Comprar</a></li>
              <li><a href="#" className="hover:text-[#4A5D23] transition-colors">Vender</a></li>
              <li><a href="#" className="hover:text-[#4A5D23] transition-colors">Alugar</a></li>
              <li><a href="#" className="hover:text-[#4A5D23] transition-colors">Trabalhe Conosco</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Contato</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>{getAddress()}</li>
              <li>{getCityState()}</li>
              <li>{companySettings?.phone || '(11) 99999-9999'}</li>
              <li>{companySettings?.email || 'contato@nascimento.com.br'}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Parceiros</h3>
            {partners.length > 0 ? (
              <ul className="space-y-4 text-sm text-gray-400">
                {partners.map((partner) => (
                  <li key={partner.id} className="border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                    <p className="text-white font-semibold">{partner.name}</p>
                    <p className="text-xs text-gray-500">{partner.category}</p>
                    <p className="text-xs text-[#4A5D23] mt-0.5">{partner.contact}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">Conheça nossa rede de parceiros credenciados.</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2024 Nascimento Negócios Imobiliários. Todos os direitos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
