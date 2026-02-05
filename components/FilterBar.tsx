
import React from 'react';
import { Filters, CITIES, NEIGHBORHOODS, PROPERTY_TYPES } from '../types';

interface FilterBarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl relative z-10 max-w-7xl mx-auto border border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* City Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 ml-1 tracking-widest">Cidade</label>
          <select
            name="city"
            value={filters.city}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#4A5D23] focus:bg-white outline-none transition-all text-black font-medium"
          >
            <option value="">Todas as cidades</option>
            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>

        {/* Neighborhood Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 ml-1 tracking-widest">Bairro</label>
          <select
            name="neighborhood"
            value={filters.neighborhood}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#4A5D23] focus:bg-white outline-none transition-all text-black font-medium"
          >
            <option value="">Todos os bairros</option>
            {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Property Type Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 ml-1 tracking-widest">Tipo de Imóvel</label>
          <select
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#4A5D23] focus:bg-white outline-none transition-all text-black font-medium"
          >
            <option value="">Qualquer tipo</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Bedrooms Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 ml-1 tracking-widest">Dormitórios</label>
          <select
            name="bedrooms"
            value={filters.bedrooms}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#4A5D23] focus:bg-white outline-none transition-all text-black font-medium"
          >
            <option value="">Qualquer quantidade</option>
            <option value="1">1+ Dormitórios</option>
            <option value="2">2+ Dormitórios</option>
            <option value="3">3+ Dormitórios</option>
            <option value="4">4+ Dormitórios</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 ml-1 tracking-widest">Faixa de Preço</label>
          <select
            name="priceRange"
            value={filters.priceRange}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#4A5D23] focus:bg-white outline-none transition-all text-black font-medium"
          >
            <option value="">Qualquer valor</option>
            <option value="0-500000">Até R$ 500.000</option>
            <option value="500000-1000000">R$ 500k - R$ 1M</option>
            <option value="1000000-2000000">R$ 1M - R$ 2M</option>
            <option value="2000000+">Acima de R$ 2M</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
