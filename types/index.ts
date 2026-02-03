export interface CompanyProfile {
  id: string;
  name: string; // "MSilva"
  tagline: {
    pt: string; // "Catering & Eventos"
    en: string; // "Catering & Events"
  };
  logo: string; // URL
  contact: {
    phone: string;
    email: string;
    website: string;
    instagram?: string;
    facebook?: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface ServiceCategory {
  id: string;
  name: {
    pt: string; // "Menus de Refeicao"
    en: string; // "Meal Menus"
  };
  description?: {
    pt: string;
    en: string;
  };
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export type PricingType =
  | 'per_person'
  | 'fixed'
  | 'on_request';

export interface ServiceIncludedItem {
  id: string;
  serviceId: string;
  sectionKey: string;
  text: {
    pt: string;
    en: string;
  };
  sortOrder: number;
}

export interface ServicePricedOption {
  id: string;
  serviceId: string;
  name: {
    pt: string;
    en: string;
  };
  description?: {
    pt: string;
    en: string;
  };
  pricingType: PricingType;
  price?: number | null;
  minQuantity?: number | null;
  sortOrder: number;
}

export interface CatalogItem {
  id: number;
  name: {
    pt: string;
    en: string;
  };
  description?: {
    pt: string;
    en: string;
  };
  pricingType: PricingType;
  basePrice?: number | null;
  unit?: {
    pt: string;
    en: string;
  };
  minQuantity?: number | null;
  tags?: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface ProposalMoment {
  id: number;
  key: string;
  title: {
    pt: string;
    en: string;
  };
  sortOrder: number;
  isActive: boolean;
}

export interface MomentItem {
  id: number;
  momentId: number;
  itemId: number;
  item: CatalogItem;
  isDefault: boolean;
  sortOrder: number;
}

export interface Service {
  id: string;
  categoryId: string;
  category?: ServiceCategory | null;
  name: {
    pt: string; // "Menu Premium"
    en: string; // "Premium Menu"
  };
  description?: {
    pt: string;
    en: string;
  };
  image?: string;
  
  // Configuracao de Preco
  pricingType: PricingType;
  basePrice?: number | null; // Preco base em EUR
  
  // Para servicos "per_person"
  unit?: {
    pt: string; // "pessoa"
    en: string; // "person"
  };
  minQuantity?: number;
  maxQuantity?: number;
  
  // Descontos por volume (opcional)
  volumeDiscounts?: {
    minQuantity: number;
    discountPercent: number;
  }[];
  
  // Items incluidos (para menus)
  includedItems?: ServiceIncludedItem[];
  pricedOptions?: ServicePricedOption[];
  
  // Metadata
  isActive: boolean;
  sortOrder: number;
  tags?: string[]; // ["vegetariano", "premium"]
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Proposal {
  id: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  
  // Cliente
  client: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  
  // Evento
  event: {
    type: 'wedding' | 'corporate' | 'private' | 'other';
    typeName?: { // Nome custom se "other"
      pt: string;
      en: string;
    };
    title: string;
    date?: Date;
    location?: string;
    guestCount: number; // Numero de convidados
    notes?: string;
  };
  
  // Servicos Selecionados
  selectedServices: ProposalService[];
  
  // Seccoes da Proposta
  sections: ProposalSection[];
  
  // Configuracoes
  language: 'pt' | 'en';
  currency: 'EUR';
  showVAT: boolean;
  vatRate: number; // 23% em Portugal
  validUntil?: Date;
  
  // Totais (calculados)
  subtotal: number;
  vatAmount: number;
  total: number;
  
  // Metadata
  referenceNumber: string;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
}

export interface ProposalService {
  serviceId: string;
  quantity: number; // Numero de pessoas ou unidades
  customPrice?: number; // Override do preco base
  notes?: string;
  
  // Calculados
  unitPrice: number;
  totalPrice: number;
}

export interface ProposalSection {
  id: string;
  type: 'intro' | 'services' | 'menu_details' | 'extras' | 'terms' | 'custom';
  title?: {
    pt: string;
    en: string;
  };
  content?: {
    pt: string;
    en: string;
  };
  isVisible: boolean;
  sortOrder: number;
}
