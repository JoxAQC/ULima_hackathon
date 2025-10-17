
export type MissionStep = {
  title: string;
  description: string;
};

export type Mission = {
  id: number;
  title: string;
  description: string;
  category: 'Iluminación' | 'Climatización' | 'Micro-Generación';
  module: number;
  exp: number;
  credits: number;
  financialSavings: number; // Ahorro en S/
  co2Saved: number; // en kg
  userSegment: 'Adult' | 'Youth' | 'All';
  steps: MissionStep[];
};

export const missions: Mission[] = [
  // Módulo 1: Iluminación Autónoma
  {
    id: 1,
    title: 'Crea tu Lámpara Solar Casera',
    description: 'Aprende a construir una lámpara simple usando energía solar. ¡Ilumina tus noches y ahorra!',
    category: 'Iluminación',
    module: 1,
    exp: 50,
    credits: 10,
    financialSavings: 10,
    co2Saved: 5,
    userSegment: 'Youth',
    steps: [
      { title: 'Reúne los Materiales', description: 'Necesitarás una botella de plástico, un pequeño panel solar, un LED y una batería recargable.' },
      { title: 'Arma el Circuito', description: 'Conecta el panel solar a la batería y la batería al LED. ¡Sigue nuestra guía paso a paso!' },
      { title: 'Monta tu Lámpara', description: 'Coloca los componentes dentro de la botella para protegerlos. ¡Tu lámpara está lista!' },
      { title: '¡A Cargar!', description: 'Deja tu lámpara bajo el sol durante el día para que se cargue y úsala por la noche.' },
    ],
  },
  {
    id: 2,
    title: 'Optimiza la Iluminación de tu Hogar',
    description: 'Reduce tu consumo eléctrico cambiando a tecnología LED y aprovechando la luz natural.',
    category: 'Iluminación',
    module: 1,
    exp: 100,
    credits: 20,
    financialSavings: 40,
    co2Saved: 30,
    userSegment: 'Adult',
    steps: [
        { title: 'Auditoría de Focos', description: 'Revisa todos los focos de tu casa. ¿Cuántos no son LED?' },
        { title: 'Calcula el Ahorro', description: 'Usa nuestra calculadora para estimar cuánto ahorrarías cambiando a LED.' },
        { title: 'Cambio Estratégico', description: 'Reemplaza al menos 5 focos incandescentes por focos LED.' },
        { title: 'Aprovecha la Luz Natural', description: 'Reorganiza un espacio para maximizar el uso de luz solar durante el día.' },
    ],
  },
    // Módulo 2: Climatización Sostenible
  {
    id: 3,
    title: 'Construye un Calentador Solar de Agua',
    description: 'Crea un sistema básico para calentar agua usando el poder del sol. ¡Ideal para experimentos!',
    category: 'Climatización',
    module: 2,
    exp: 80,
    credits: 25,
    financialSavings: 20,
    co2Saved: 15,
    userSegment: 'Youth',
    steps: [
      { title: 'Prepara la Caja', description: 'Busca una caja de cartón y píntala de negro por dentro para absorber más calor.' },
      { title: 'Instala la Tubería', description: 'Coloca una manguera negra enrollada dentro de la caja, dejando los extremos afuera.' },
      { title: 'Crea el Efecto Invernadero', description: 'Cubre la parte superior de la caja con plástico transparente para atrapar el calor.' },
      { title: 'Prueba tu Calentador', description: 'Conecta un extremo a una fuente de agua fría y observa cómo sale tibia por el otro extremo bajo el sol.' },
    ],
  },
    {
    id: 4,
    title: 'Aislamiento Térmico Inteligente',
    description: 'Mejora el confort de tu hogar y reduce costos de climatización con soluciones sencillas.',
    category: 'Climatización',
    module: 2,
    exp: 120,
    credits: 30,
    financialSavings: 60,
    co2Saved: 50,
    userSegment: 'Adult',
    steps: [
      { title: 'Detecta Fugas de Aire', description: 'Inspecciona ventanas y puertas en busca de corrientes de aire. Séllalas con burletes.' },
      { title: 'Usa Cortinas a tu Favor', description: 'Abre las cortinas en invierno para que entre el sol y ciérralas en verano para mantener el frescor.' },
      { title: 'Optimiza la Ventilación', description: 'Aprende técnicas de ventilación cruzada para refrescar tu casa sin usar electricidad.' },
      { title: 'Mide el Impacto', description: 'Registra el antes y el después en tu consumo de energía para ver el ahorro.' },
    ],
  },
    // Módulo 3: Micro-Generación
  {
    id: 5,
    title: 'Molino de Viento Generador',
    description: 'Transforma la energía del viento en luz usando materiales reciclados y un motor de juguete.',
    category: 'Micro-Generación',
    module: 3,
    exp: 150,
    credits: 40,
    financialSavings: 5,
    co2Saved: 2,
    userSegment: 'All',
    steps: [
        { title: 'Consigue un Motor Pequeño', description: 'Recupera un motor DC pequeño de un carro de juguete viejo o un ventilador USB que no funcione.' },
        { title: 'Construye las Aspas', description: 'Crea las aspas de tu molino con una botella de plástico o cartón duro. Dales una forma que pueda atrapar el viento.' },
        { title: 'Ensambla tu Generador', description: 'Une las aspas al eje del motor. Luego, conecta un foquito LED a los terminales del motor.' },
        { title: '¡Genera Luz!', description: 'Expón tu molino al viento (o usa un ventilador) y mira cómo el LED se enciende. ¡Estás creando energía eólica!' },
    ],
  },
];

export type CommunityMember = {
  id: number;
  name: string;
  exp: number;
  avatar: string;
};

export const communityMembers: CommunityMember[] = [
  { id: 1, name: 'Alex', exp: 2450, avatar: 'avatar-1' },
  { id: 2, name: 'Bri', exp: 2100, avatar: 'avatar-2' },
  { id: 3, name: 'Casey', exp: 1850, avatar: 'avatar-3' },
  { id: 4, name: 'Dana', exp: 1500, avatar: 'avatar-4' },
];
