
export type PropertyType = 'Casa' | 'Apartamento' | 'Terreno' | 'Comercial';
export type OperationType = 'Venda' | 'Aluguel';

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  operation: OperationType;
  price: number;
  condoPrice?: number;
  iptuPrice?: number;
  fireInsurance?: number;
  serviceCharge?: number;
  city: string;
  neighborhood: string;
  street?: string;
  number?: string;
  complement?: string;
  state?: string;
  zip?: string;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  area: number;
  pets?: boolean;
  furnished?: boolean;
  imageUrl: string;
  galleryUrls?: string;
  inspectionUrls?: string;
  ownerName?: string;
  ownerCpf?: string;
  ownerPhone?: string;
}

export interface Client {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  property_interest: string;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  locator_name?: string;
  locator_cpf?: string;
  locator_email?: string;
  locator_phone?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_duration?: number;
  contract_value?: number;
  payment_due_day?: number;
  id_document_url?: string;
  proof_of_address_url?: string;
  income_proof_url?: string;
  property_conditions?: string;
}

export interface Partner {
  id: number;
  name: string;
  category: string;
  contact: string;
}

export interface CompanySettings {
  id: number;
  address: string;
  number: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  hours: string;
}

export interface Contact {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  property_id?: string;
  property_title?: string;
  status: string;
}

export interface Filters {
  city: string;
  neighborhood: string;
  type: string;
  bedrooms: string;
  priceRange: string;
  operation: OperationType | 'Todos';
}

export const CITIES = ['São Paulo', 'Rio de Janeiro', 'Curitiba', 'Belo Horizonte'];
export const NEIGHBORHOODS = ['Centro', 'Jardins', 'Barra da Tijuca', 'Batel', 'Savassi', 'Vila Madalena'];
export const PROPERTY_TYPES: PropertyType[] = ['Casa', 'Apartamento', 'Terreno', 'Comercial'];
