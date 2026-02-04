
import React from 'react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onClick: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const condoPrice = property.condoPrice || 0;
  const iptuPrice = property.iptuPrice || 0;
  const totalPrice = property.price + condoPrice + iptuPrice;

  return (
    <div
      onClick={() => onClick(property)}
      className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Imagem */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={property.imageUrl}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-black text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm">
            {property.type}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Endereço e Localização */}
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {property.street || 'Endereço não informado'}, {property.neighborhood}
          </p>
          <p className="text-xs text-gray-500 truncate">{property.city}</p>
        </div>

        {/* Características */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 border-b border-gray-100 pb-4">
          <span className="flex items-center gap-1">
            <b>{property.area}</b> m²
          </span>
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <b>{property.bedrooms}</b> quartos
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <b>{property.bathrooms}</b> banheiros
            </span>
          )}
          {property.parkingSpaces > 0 && (
            <span className="flex items-center gap-1">
              <b>{property.parkingSpaces}</b> vagas
            </span>
          )}
        </div>

        {/* Descrição Curta */}
        {property.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
            {property.description}
          </p>
        )}

        {/* Valores */}
        <div className="mt-auto pt-2">
          {property.operation === 'Aluguel' ? (
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Total</span>
                <span className="text-lg font-bold text-[#4A5D23]">{formatCurrency(totalPrice)}</span>
                <span className="text-xs text-gray-400">/mês</span>
              </div>
              <div className="text-[10px] text-gray-400 flex flex-wrap gap-x-3">
                <span>Aluguel {formatCurrency(property.price)}</span>
                {condoPrice > 0 && <span>• Cond. {formatCurrency(condoPrice)}</span>}
                {iptuPrice > 0 && <span>• IPTU {formatCurrency(iptuPrice)}</span>}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-lg font-bold text-[#4A5D23]">{formatCurrency(property.price)}</span>
              </div>
              <div className="text-[10px] text-gray-400 flex flex-wrap gap-x-3">
                {condoPrice > 0 && <span>Cond. {formatCurrency(condoPrice)}</span>}
                {iptuPrice > 0 && <span>• IPTU {formatCurrency(iptuPrice)}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
