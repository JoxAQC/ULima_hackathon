
import { PlaceHolderImages } from './placeholder-images';
import type { ImagePlaceholder } from './placeholder-images';
import { IntiIcon, YakuIcon, SachaIcon, WayraIcon } from '@/components/icons/hiri-icons';

const getImage = (id: string): ImagePlaceholder => 
  PlaceHolderImages.find(img => img.id === id) || PlaceHolderImages[0];

export interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  badgeId?: string;
  cardId?: string;
  image: ImagePlaceholder;
  icon: React.ElementType;
  upgradeImageId?: string;
  quiz: {
    question: string;
    options: string[];
    answer: string;
  };
  materials: string[];
  instructions: string[];
}

export interface KnowledgeCard {
  id: string;
  title: string;
  fact: string;
  image: ImagePlaceholder;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

export const missions: Mission[] = [
  {
    id: 'solar-lamp',
    title: 'Construir Lámpara Solar',
    description: 'Usa materiales caseros para construir una lámpara solar simple pero efectiva.',
    points: 100,
    badgeId: 'sun-guardian',
    cardId: 'solar',
    image: getImage('mission-solar-lamp'),
    icon: IntiIcon,
    upgradeImageId: 'upgrade-solar-lamp',
    quiz: {
      question: '¿Cuál es el principal beneficio de la energía solar?',
      options: ['Es cara', 'Funciona de noche', 'Es un recurso renovable', 'No es confiable'],
      answer: 'Es un recurso renovable',
    },
    materials: ['Panel solar pequeño', 'Batería recargable', 'Luz LED', 'Cables', 'Frasco de vidrio'],
    instructions: [
        'Conecta el panel solar a la batería para cargarla durante el día.',
        'Conecta la batería a la luz LED.',
        'Monta la luz dentro del frasco para protegerla.',
        'Coloca el panel a la luz directa del sol para cargar.'
    ]
  },
  {
    id: 'mud-stove',
    title: 'Crear Estufa de Barro Eficiente',
    description: 'Construye una estufa de barro y arcilla que use menos leña y produzca menos humo.',
    points: 150,
    badgeId: 'jungle-hero',
    image: getImage('mission-mud-stove'),
    icon: SachaIcon,
    upgradeImageId: 'upgrade-mud-stove',
    quiz: {
        question: '¿Por qué es importante una estufa eficiente?',
        options: ['Cocina la comida más lento', 'Usa más leña', 'Reduce la deforestación y la inhalación de humo', 'Se ve moderna'],
        answer: 'Reduce la deforestación y la inhalación de humo',
    },
    materials: ['Arcilla', 'Arena', 'Agua', 'Paja o hierba seca'],
    instructions: [
        'Mezcla arcilla, arena y agua para crear una mezcla espesa de barro.',
        'Forma la base y las paredes de la estufa, dejando una abertura para la leña.',
        'Crea una cámara para el fuego y una parte superior plana para cocinar.',
        'Añade una pequeña chimenea para dirigir el humo hacia afuera.',
        'Deja que la estufa se seque completamente al sol antes de usarla.'
    ]
  },
  {
    id: 'water-filter',
    title: 'Filtro de Agua Casero',
    description: 'Ensambla un filtro de agua de varias capas para purificar el agua de lluvia recolectada.',
    points: 100,
    badgeId: 'water-ally',
    cardId: 'water',
    image: getImage('mission-water-filter'),
    icon: YakuIcon,
    upgradeImageId: 'upgrade-water-filter',
    quiz: {
        question: '¿Qué material se usa comúnmente en los filtros de agua para eliminar impurezas?',
        options: ['Arena', 'Carbón', 'Grava', 'Todos los anteriores'],
        answer: 'Todos los anteriores',
    },
    materials: ['Botella de plástico grande', 'Algodón', 'Arena', 'Carbón activado', 'Grava'],
    instructions: [
        'Toma una botella de plástico y córtale el fondo.',
        'Coloca capas de materiales adentro: comienza con algodón, luego arena, carbón y finalmente grava.',
        'Vierte agua por la parte superior y recoge el agua filtrada por la tapa de la botella.',
        'Por seguridad, siempre hierve el agua filtrada antes de beberla.',
    ]
  },
  {
    id: 'composting',
    title: 'Iniciar una Pila de Compost',
    description: 'Convierte los desechos orgánicos en tierra rica en nutrientes para el jardín de tu aldea.',
    points: 75,
    cardId: 'recycling',
    image: getImage('mission-composting'),
    icon: SachaIcon,
    upgradeImageId: 'upgrade-compost-bin',
    quiz: {
        question: '¿Qué NO debe ir en una pila de compost?',
        options: ['Restos de vegetales', 'Carne y lácteos', 'Cáscaras de huevo', 'Restos de café'],
        answer: 'Carne y lácteos',
    },
    materials: ['Materiales "verdes" (restos de cocina, césped fresco)', 'Materiales "marrones" (hojas secas, cartón)'],
    instructions: [
        'Elige un lugar seco y sombreado cerca de una fuente de agua para tu pila.',
        'Añade una mezcla de materiales "verdes" (como restos de vegetales) y "marrones" (como hojas secas).',
        'Mantén la pila húmeda añadiendo agua ocasionalmente.',
        'Remueve el compost cada una o dos semanas para airearlo.',
        'Tu compost está listo cuando está oscuro, rico y desmenuzable.'
    ]
  },
];

export const featuredMissions = missions.slice(0, 2);

export const knowledgeCards: KnowledgeCard[] = [
  {
    id: 'solar',
    title: 'El Poder del Sol',
    fact: 'El sol proporciona más energía a la Tierra en una hora de la que la humanidad usa en un año entero. Los paneles solares convierten esta luz solar directamente en electricidad.',
    image: getImage('card-solar'),
  },
  {
    id: 'water',
    title: 'Agua Preciosa',
    fact: 'Menos del 1% del agua en la Tierra es dulce y accesible. Conservar el agua es crucial para un futuro sostenible y ecosistemas saludables.',
    image: getImage('card-water'),
  },
  {
    id: 'wind',
    title: 'Dominando el Viento',
    fact: 'Las turbinas eólicas pueden generar electricidad 24/7 mientras sople el viento. Una sola turbina grande puede alimentar cientos de hogares.',
    image: getImage('card-wind'),
  },
  {
    id: 'recycling',
    title: 'El Ciclo del Reciclaje',
    fact: 'Reciclar latas de aluminio ahorra el 95% de la energía necesaria para hacer nuevas a partir de materias primas. El compostaje de restos de comida reduce las emisiones de metano de los vertederos.',
    image: getImage('card-recycling'),
  },
];

export const badges: Badge[] = [
  {
    id: 'sun-guardian',
    name: 'Guardián del Sol',
    description: 'Otorgado por dominar proyectos de energía solar.',
    icon: IntiIcon,
  },
  {
    id: 'water-ally',
    name: 'Aliado del Agua',
    description: 'Otorgado por conservar y purificar los recursos hídricos.',
    icon: YakuIcon,
  },
  {
    id: 'jungle-hero',
    name: 'Héroe de la Selva',
    description: 'Otorgado por proteger y utilizar sabiamente los recursos forestales.',
    icon: SachaIcon,
  },
  {
    id: 'wind-whisperer',
    name: 'Susurrador del Viento',
    description: 'Otorgado por completar un proyecto de energía eólica.',
    icon: WayraIcon,
  },
];
