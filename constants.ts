
import { ProductCondition, Category } from './types';

export const UKRAINIAN_CITIES: string[] = [
  'Киев', 'Харьков', 'Одесса', 'Днепр', 'Донецк', 
  'Запорожье', 'Львов', 'Кривой Рог', 'Николаев', 'Мариуполь',
  'Луганск', 'Винница', 'Макеевка', 'Севастополь', 'Симферополь',
  'Херсон', 'Полтава', 'Чернигов', 'Черкассы', 'Хмельницкий',
  'Черновцы', 'Житомир', 'Сумы', 'Ровно', 'Ивано-Франковск',
  'Кропивницкий', 'Тернополь', 'Луцк', 'Белая Церковь', 'Краматорск',
  'Мелитополь', 'Ужгород', 'Бердянск', 'Павлоград', 'Каменец-Подольский'
  // Add more cities as needed
];

export const PRODUCT_CONDITIONS_OPTIONS: ProductCondition[] = [
  ProductCondition.NEW,
  ProductCondition.USED_EXCELLENT,
  ProductCondition.USED_GOOD,
  ProductCondition.USED_FAIR,
  ProductCondition.FOR_PARTS,
];

export const CATEGORIES: Category[] = [
  {
    id: 'clothing',
    name: 'Одежда',
    subcategories: [
      { id: 'hoodies', name: 'Худи' },
      { id: 'longsleeves', name: 'Лонгсливы' },
      { id: 'sweatshirts', name: 'Свитшоты' },
      { id: 'tshirts', name: 'Футболки' },
      { id: 'pants', name: 'Штаны' },
      { id: 'outerwear', name: 'Верхняя одежда' },
    ],
  },
  {
    id: 'vapes',
    name: 'Поды, Вейпы',
    subcategories: [
      { id: 'vape_liquids', name: 'Жидкости для вейпов' },
      { id: 'cartridges', name: 'Картриджи' },
      { id: 'pods', name: 'POD-системы' },
      { id: 'vape_devices', name: 'Вейп устройства' },
      { id: 'coils', name: 'Испарители' },
    ],
  },
  {
    id: 'electronics',
    name: 'Электроника',
    subcategories: [
      { id: 'phones', name: 'Телефоны' },
      { id: 'laptops', name: 'Ноутбуки' },
      { id: 'tablets', name: 'Планшеты' },
      { id: 'accessories', name: 'Аксессуары' },
    ],
  },
  {
    id: 'furniture',
    name: 'Мебель',
    subcategories: [
      { id: 'sofas', name: 'Диваны' },
      { id: 'tables', name: 'Столы' },
      { id: 'chairs', name: 'Стулья' },
      { id: 'beds', name: 'Кровати' },
    ],
  },
   {
    id: 'other',
    name: 'Разное',
    subcategories: [
      { id: 'other_items', name: 'Прочее' },
    ],
  }
];

export const DEFAULT_FILTERS = {
  searchTerm: '',
  priceMin: null,
  priceMax: null,
  city: '',
  condition: '' as ProductCondition | '',
  category: ''
};
    