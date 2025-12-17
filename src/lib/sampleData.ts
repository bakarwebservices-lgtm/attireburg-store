// Sample product data for development
export const sampleProducts = [
  {
    id: '1',
    name: 'Premium Wollpullover Classic',
    nameEn: 'Premium Wool Sweater Classic',
    description: 'Ein zeitloser Wollpullover aus feinster Merinowolle. Perfekt für die kalte Jahreszeit, kombiniert Wärme mit elegantem Design. Handgefertigt in Deutschland mit höchster Präzision.',
    descriptionEn: 'A timeless wool sweater made from finest merino wool. Perfect for the cold season, combining warmth with elegant design. Handcrafted in Germany with highest precision.',
    price: 129.99,
    salePrice: null,
    currency: 'EUR',
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center'
    ],
    category: 'pullover',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Grau', 'Schwarz', 'Navy'],
    stock: 25,
    featured: true,
    onSale: false,
    sku: 'ATB-WP-001',
    weight: 0.8,
    tags: ['Premium', 'Wolle', 'Handgefertigt'],
    metaTitle: 'Premium Wollpullover Classic - Attireburg',
    metaDescription: 'Zeitloser Wollpullover aus feinster Merinowolle. Handgefertigt in Deutschland.',
    isActive: true,
    avgRating: 4.8,
    reviewCount: 24
  },
  {
    id: '2',
    name: 'Winterjacke Alpine Pro',
    nameEn: 'Winter Jacket Alpine Pro',
    description: 'Robuste Winterjacke für extreme Wetterbedingungen. Wasserdicht, winddicht und atmungsaktiv. Mit hochwertiger Daunenfüllung für optimale Wärmeisolierung.',
    descriptionEn: 'Robust winter jacket for extreme weather conditions. Waterproof, windproof and breathable. With high-quality down filling for optimal thermal insulation.',
    price: 299.99,
    salePrice: 249.99,
    currency: 'EUR',
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center'
    ],
    category: 'jacken',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Schwarz', 'Dunkelblau', 'Olivgrün'],
    stock: 15,
    featured: true,
    onSale: true,
    sku: 'ATB-WJ-002',
    weight: 1.2,
    tags: ['Wasserdicht', 'Daunen', 'Winter'],
    metaTitle: 'Winterjacke Alpine Pro - Attireburg',
    metaDescription: 'Robuste Winterjacke mit Daunenfüllung. Wasserdicht und winddicht.',
    isActive: true,
    avgRating: 4.6,
    reviewCount: 18
  },
  {
    id: '3',
    name: 'Hoodie Urban Comfort',
    nameEn: 'Hoodie Urban Comfort',
    description: 'Lässiger Hoodie aus Bio-Baumwolle. Weich, bequem und nachhaltig produziert. Perfekt für entspannte Tage und urbane Abenteuer.',
    descriptionEn: 'Casual hoodie made from organic cotton. Soft, comfortable and sustainably produced. Perfect for relaxed days and urban adventures.',
    price: 89.99,
    salePrice: null,
    currency: 'EUR',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&h=800&fit=crop&crop=center'
    ],
    category: 'hoodies',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Grau', 'Schwarz', 'Weiß', 'Bordeaux'],
    stock: 30,
    featured: true,
    onSale: false,
    sku: 'ATB-HD-003',
    weight: 0.6,
    tags: ['Bio-Baumwolle', 'Nachhaltig', 'Komfort'],
    metaTitle: 'Hoodie Urban Comfort - Attireburg',
    metaDescription: 'Lässiger Hoodie aus Bio-Baumwolle. Nachhaltig und bequem.',
    isActive: true,
    avgRating: 4.7,
    reviewCount: 31
  },
  {
    id: '4',
    name: 'Strickjacke Heritage',
    nameEn: 'Cardigan Heritage',
    description: 'Elegante Strickjacke im klassischen Design. Aus hochwertiger Schurwolle gefertigt. Ein zeitloser Begleiter für Business und Freizeit.',
    descriptionEn: 'Elegant cardigan in classic design. Made from high-quality virgin wool. A timeless companion for business and leisure.',
    price: 159.99,
    salePrice: null,
    currency: 'EUR',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop&crop=center'
    ],
    category: 'pullover',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Beige', 'Dunkelbraun', 'Grau'],
    stock: 20,
    featured: false,
    onSale: false,
    sku: 'ATB-CG-004',
    weight: 0.7,
    tags: ['Schurwolle', 'Klassisch', 'Business'],
    metaTitle: 'Strickjacke Heritage - Attireburg',
    metaDescription: 'Elegante Strickjacke aus hochwertiger Schurwolle. Zeitlos und vielseitig.',
    isActive: true,
    avgRating: 4.5,
    reviewCount: 12
  },
  {
    id: '5',
    name: 'Übergangsjacke Spring',
    nameEn: 'Transition Jacket Spring',
    description: 'Leichte Übergangsjacke für Frühling und Herbst. Wasserabweisend und windresistent. Ideal für wechselhafte Wetterbedingungen.',
    descriptionEn: 'Light transition jacket for spring and autumn. Water-repellent and wind-resistant. Ideal for changeable weather conditions.',
    price: 179.99,
    salePrice: 149.99,
    currency: 'EUR',
    images: [
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center'
    ],
    category: 'jacken',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Navy', 'Khaki', 'Schwarz'],
    stock: 18,
    featured: false,
    onSale: true,
    sku: 'ATB-TJ-005',
    weight: 0.9,
    tags: ['Wasserabweisend', 'Leicht', 'Übergang'],
    metaTitle: 'Übergangsjacke Spring - Attireburg',
    metaDescription: 'Leichte Übergangsjacke für Frühling und Herbst. Wasserabweisend.',
    isActive: true,
    avgRating: 4.4,
    reviewCount: 9
  },
  {
    id: '6',
    name: 'Langarmshirt Essential',
    nameEn: 'Long Sleeve Shirt Essential',
    description: 'Vielseitiges Langarmshirt aus weicher Baumwolle. Perfekt als Basis-Layer oder für den lässigen Look. In verschiedenen Farben erhältlich.',
    descriptionEn: 'Versatile long sleeve shirt made from soft cotton. Perfect as a base layer or for a casual look. Available in various colors.',
    price: 49.99,
    salePrice: null,
    currency: 'EUR',
    images: [
      'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop&crop=center'
    ],
    category: 'shirts',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Weiß', 'Schwarz', 'Grau', 'Navy', 'Bordeaux'],
    stock: 45,
    featured: false,
    onSale: false,
    sku: 'ATB-LS-006',
    weight: 0.3,
    tags: ['Baumwolle', 'Basic', 'Vielseitig'],
    metaTitle: 'Langarmshirt Essential - Attireburg',
    metaDescription: 'Vielseitiges Langarmshirt aus weicher Baumwolle. Perfekt für jeden Tag.',
    isActive: true,
    avgRating: 4.3,
    reviewCount: 27
  },
  {
    id: '7',
    name: 'Fleecejacke Outdoor',
    nameEn: 'Fleece Jacket Outdoor',
    description: 'Warme Fleecejacke für Outdoor-Aktivitäten. Schnell trocknend und atmungsaktiv. Ideal für Wanderungen und Sport im Freien.',
    descriptionEn: 'Warm fleece jacket for outdoor activities. Quick-drying and breathable. Ideal for hiking and outdoor sports.',
    price: 79.99,
    salePrice: 69.99,
    currency: 'EUR',
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center'
    ],
    category: 'jacken',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Grau', 'Schwarz', 'Blau'],
    stock: 22,
    featured: false,
    onSale: true,
    sku: 'ATB-FJ-007',
    weight: 0.5,
    tags: ['Fleece', 'Outdoor', 'Atmungsaktiv'],
    metaTitle: 'Fleecejacke Outdoor - Attireburg',
    metaDescription: 'Warme Fleecejacke für Outdoor-Aktivitäten. Schnell trocknend.',
    isActive: true,
    avgRating: 4.2,
    reviewCount: 15
  },
  {
    id: '8',
    name: 'Pullover Merino Deluxe',
    nameEn: 'Sweater Merino Deluxe',
    description: 'Luxuriöser Pullover aus 100% Merinowolle. Temperaturregulierend und geruchsresistent. Ein Premiumprodukt für höchste Ansprüche.',
    descriptionEn: 'Luxurious sweater made from 100% merino wool. Temperature regulating and odor resistant. A premium product for the highest standards.',
    price: 189.99,
    salePrice: null,
    currency: 'EUR',
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center'
    ],
    category: 'pullover',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Anthrazit', 'Camel', 'Dunkelgrün'],
    stock: 12,
    featured: false,
    onSale: false,
    sku: 'ATB-MD-008',
    weight: 0.6,
    tags: ['Merinowolle', 'Luxus', 'Premium'],
    metaTitle: 'Pullover Merino Deluxe - Attireburg',
    metaDescription: 'Luxuriöser Pullover aus 100% Merinowolle. Temperaturregulierend.',
    isActive: true,
    avgRating: 4.9,
    reviewCount: 8
  }
];

export const sampleReviews = [
  {
    id: '1',
    productId: '1',
    userId: '1',
    rating: 5,
    title: 'Hervorragende Qualität',
    comment: 'Dieser Pullover ist jeden Cent wert. Die Wolle ist unglaublich weich und warm. Perfekte Passform!',
    isVerified: true,
    createdAt: new Date('2024-01-15').toISOString(),
    user: {
      name: 'Michael Schmidt',
      firstName: 'Michael'
    }
  },
  {
    id: '2',
    productId: '1',
    userId: '2',
    rating: 4,
    title: 'Sehr zufrieden',
    comment: 'Toller Pullover, läuft nicht ein beim Waschen. Nur die Lieferung hätte schneller sein können.',
    isVerified: true,
    createdAt: new Date('2024-01-20').toISOString(),
    user: {
      name: 'Anna Weber',
      firstName: 'Anna'
    }
  },
  {
    id: '3',
    productId: '2',
    userId: '3',
    rating: 5,
    title: 'Perfekt für den Winter',
    comment: 'Diese Jacke hält wirklich warm und trocken. Bin sehr beeindruckt von der Qualität.',
    isVerified: true,
    createdAt: new Date('2024-01-25').toISOString(),
    user: {
      name: 'Thomas Müller',
      firstName: 'Thomas'
    }
  }
];

export const sampleCategories = [
  {
    id: '1',
    name: 'Pullover',
    nameEn: 'Sweaters',
    slug: 'pullover',
    description: 'Hochwertige Pullover und Strickwaren',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=300&fit=crop&crop=center',
    isActive: true,
    sortOrder: 1
  },
  {
    id: '2',
    name: 'Jacken',
    nameEn: 'Jackets',
    slug: 'jacken',
    description: 'Warme und stylische Jacken für jede Jahreszeit',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop&crop=center',
    isActive: true,
    sortOrder: 2
  },
  {
    id: '3',
    name: 'Hoodies',
    nameEn: 'Hoodies',
    slug: 'hoodies',
    description: 'Lässige Hoodies für entspannte Momente',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop&crop=center',
    isActive: true,
    sortOrder: 3
  },
  {
    id: '4',
    name: 'Shirts',
    nameEn: 'Shirts',
    slug: 'shirts',
    description: 'Vielseitige Shirts für jeden Anlass',
    image: 'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=400&h=300&fit=crop&crop=center',
    isActive: true,
    sortOrder: 4
  }
];