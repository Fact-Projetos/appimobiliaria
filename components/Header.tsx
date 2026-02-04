
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CompanySettings } from '../types';

interface HeaderProps {
  onNav: (path: string) => void;
  activeTab: string;
  companySettings: CompanySettings | null;
}

const Header: React.FC<HeaderProps> = ({ onNav, activeTab, companySettings }) => {
  const address = companySettings?.address
    ? `${companySettings.address}${companySettings.number ? `, ${companySettings.number}` : ''} - ${companySettings.state || 'SP'}`
    : 'Av. Brigadeiro Faria Lima, 2500 - SP';

  const phone = companySettings?.phone || '(11) 99999-9999';
  const hours = companySettings?.hours || '08h às 18h';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      {/* Top Contact Bar */}
      <div className="bg-black text-white py-2 px-4 sm:px-6 lg:px-8 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <svg className="w-3 h-3 text-[#4A5D23]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              {address}
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-3 h-3 text-[#4A5D23]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 004.587 4.587l.773-1.548a1 1 0 011.06-.54l4.435.741a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
              {phone}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-[#4A5D23]">Atendimento Segunda a Sexta: {hours}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center cursor-pointer group" onClick={() => onNav('home')}>
            <div className="mr-3 transform group-hover:scale-105 transition-transform duration-300">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5L95 50L50 95L5 50L50 5Z" stroke="#4A5D23" strokeWidth="2" strokeMiterlimit="10" />
                <rect x="35" y="45" width="4" height="25" fill="#000000" />
                <rect x="42" y="35" width="4" height="35" fill="#4A5D23" />
                <rect x="49" y="30" width="4" height="40" fill="#000000" />
                <rect x="56" y="35" width="4" height="35" fill="#4A5D23" />
                <rect x="63" y="45" width="4" height="25" fill="#000000" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-black tracking-tight leading-none">Nascimento</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#4A5D23] font-semibold">Negócios Imobiliários</p>
            </div>
          </div>

          <nav className="hidden md:flex space-x-10">
            <button
              onClick={() => onNav('home')}
              className={`${activeTab === 'home' ? 'text-[#4A5D23] border-b-2 border-[#4A5D23]' : 'text-gray-500'} hover:text-[#4A5D23] transition-all text-xs font-bold uppercase tracking-widest py-1`}
            >
              Início
            </button>
            <button
              onClick={() => onNav('buy-sell')}
              className={`${activeTab === 'buy-sell' ? 'text-[#4A5D23] border-b-2 border-[#4A5D23]' : 'text-gray-500'} hover:text-[#4A5D23] transition-all text-xs font-bold uppercase tracking-widest py-1`}
            >
              Comprar/Vender
            </button>
            <button
              onClick={() => onNav('rent')}
              className={`${activeTab === 'rent' ? 'text-[#4A5D23] border-b-2 border-[#4A5D23]' : 'text-gray-500'} hover:text-[#4A5D23] transition-all text-xs font-bold uppercase tracking-widest py-1`}
            >
              Alugar
            </button>
          </nav>

          <div className="flex items-center">
            <button
              onClick={() => onNav('admin')}
              className="bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#4A5D23] transition-all duration-300 shadow-sm"
            >
              Acesso Admin
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
