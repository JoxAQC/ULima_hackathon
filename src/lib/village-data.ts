
export type MarketItem = {
  key: string;
  name: string;
  cost: number;
  category: string;
  imageUrl: string;
};

export const artifacts: MarketItem[] = [
    { key: 'solar-lamp',   name: 'Lámpara Solar',         cost: 100, category: 'Luz',            imageUrl: '/lamparasolar.png' },
    { key: 'water-filter', name: 'Filtro de Agua Casero', cost: 100, category: 'Agua',           imageUrl: '/filtroagua.png' },
    { key: 'mud-stove',    name: 'Estufa de Barro',       cost: 150, category: 'Cocina',         imageUrl: '/estufabarro.png' },
    { key: 'composting',   name: 'Pila de Compost',       cost: 75,  category: 'Sostenibilidad', imageUrl: '/composta.png' },
    { key: 'casa',         name: 'Casa',                  cost: 200, category: 'Edificios',      imageUrl: '/casa.png' },
    { key: 'jardin-flores',name: 'Jardín de Flores',      cost: 60,  category: 'Jardín',         imageUrl: '/jardinflores.png' },
    { key: 'auquenidos',             name: 'Auquénidos',               cost: 120, category: 'Animales',        imageUrl: '/auquenidos.png' },
    { key: 'caballero',              name: 'Caballero',                cost: 180, category: 'Personajes',      imageUrl: '/caballero.png' },
    { key: 'chaman-inca',            name: 'Chamán Inca',              cost: 160, category: 'Personajes',      imageUrl: '/chaman_inca.png' },
    { key: 'comerciante',            name: 'Comerciante',              cost: 140, category: 'Personajes',      imageUrl: '/comerciante.png' },
    { key: 'comerciante-medico',     name: 'Comerciante Médico',       cost: 150, category: 'Personajes',      imageUrl: '/comerciante_medico.png' },
    { key: 'entrenamiento-inca',     name: 'Entrenamiento Inca',       cost: 130, category: 'Entrenamiento',   imageUrl: '/entrenamiento_inca.png' },
    { key: 'entrenamiento-medieval', name: 'Entrenamiento Medieval',   cost: 130, category: 'Entrenamiento',   imageUrl: '/entrenamiento_medieval.png' },
    { key: 'fuente-agua',            name: 'Fuente de Agua',           cost: 110, category: 'Decoración',      imageUrl: '/fuente_agua.png' },
    { key: 'fuente-chavin',          name: 'Fuente Chavín',            cost: 115, category: 'Decoración',      imageUrl: '/fuente_chavin.png' },
    { key: 'guardian-inca',          name: 'Guardián Inca',            cost: 170, category: 'Personajes',      imageUrl: '/guardian_inca.png' },
    { key: 'mago',                   name: 'Mago',                     cost: 200, category: 'Personajes',      imageUrl: '/mago.png' },
    { key: 'vaca-chanchos',          name: 'Vaca y Chanchos',          cost: 140, category: 'Animales',        imageUrl: '/vaca_chanchos.png' },
    { key: 'hulca',                  name: 'Hulca',                    cost: 150, category: 'Personajes',      imageUrl: '/hulca.png' },
    { key: 'condor',                 name: 'Cóndor',                   cost: 130, category: 'Animales',        imageUrl: '/condor.png' },
    { key: 'estatua-dragon',         name: 'Estatua de Dragón',        cost: 180, category: 'Decoración',      imageUrl: '/estatua_dragon.png' },
    { key: 'balsa-totora',           name: 'Balsa de Totora',          cost: 140, category: 'Transporte',      imageUrl: '/balsa_totora.png' },
    { key: 'mercado',                name: 'Mercado',                  cost: 160, category: 'Edificios',       imageUrl: '/mercado.png' },
    { key: 'templo-inca',            name: 'Templo Inca',              cost: 220, category: 'Edificios',       imageUrl: '/templo_inca.png' },
  ];

    