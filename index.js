// ============================================================
// SUVTEKIN — Telegram-бот для поиска и продажи автомобилей
// Языки интерфейса: русский, o'zbekcha, english
// ============================================================
require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const COMPANY_NAME = process.env.COMPANY_NAME || 'SUVTEKIN';

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Ошибка: заполните BOT_TOKEN, SUPABASE_URL и SUPABASE_ANON_KEY в файле .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const bot = new Telegraf(BOT_TOKEN);

// ------------------------------------------------------------
// ОЧЕРЕДЬ ОБНОВЛЕНИЙ НА КАЖДЫЙ ЧАТ
// Если пользователь быстро тапает по кнопкам (смена марки/модели,
// "След./Пред." и т.п.), Telegram может прислать несколько апдейтов
// почти одновременно. Без сериализации два обработчика выполнялись
// параллельно: каждый удалял/менял session.listingMessageIds
// независимо, из-за чего одно из старых объявлений оставалось
// "висеть" в чате не удалённым, а пользователь в итоге видел только
// последнее отправленное. Эта очередь гарантирует, что апдейты одного
// и того же чата обрабатываются строго по очереди, один за другим.
// ------------------------------------------------------------
const chatQueues = new Map();
bot.use((ctx, next) => {
  const chatId = ctx.chat?.id ?? ctx.from?.id ?? 'global';
  const prev = chatQueues.get(chatId) || Promise.resolve();
  const run = prev.then(next).catch((err) => console.error('Ошибка обработки апдейта:', err));
  chatQueues.set(
    chatId,
    run.then(
      () => {},
      () => {}
    )
  );
  return run;
});

// ------------------------------------------------------------
// Мини HTTP-сервер только для того, чтобы Render (бесплатный Web
// Service) видел входящие запросы и не "усыплял" процесс.
// Сам бот работает через long polling, а не через этот сервер.
// Настройте бесплатный пинг (например, UptimeRobot или cron-job.org)
// на URL этого сервиса каждые 10 минут — см. README.
// ------------------------------------------------------------
const http = require('http');
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`${COMPANY_NAME} bot жив и работает`);
  })
  .listen(PORT, () => console.log(`Healthcheck-сервер слушает порт ${PORT}`));

// ============================================================
// ПЕРЕВОДЫ ИНТЕРФЕЙСА
// ============================================================
const T = {
  ru: {
    chooseLanguage: 'Выберите язык интерфейса:',
    welcome: (name) => `👋 Добро пожаловать в ${name}!\n\nЗдесь вы можете подобрать автомобиль по категории, марке и модели.`,
    searchBtn: '🔍 Найти автомобиль',
    chooseCategory: '📂 Выберите категорию автомобиля:',
    chooseBrand: '🏷 Выберите марку:',
    chooseModel: '📋 Выберите модель:',
    allBrands: '🚗 Все марки',
    allModels: '🚘 Все модели',
    backToCategories: '⬅️ Назад к категориям',
    backToBrands: '⬅️ Назад к маркам',
    noCategories: 'Пока нет доступных категорий. Загляните позже.',
    noListingsCategory: 'В этой категории пока нет объявлений.',
    noListingsSelection: 'По этому выбору пока нет объявлений.',
    noListingsFound: 'По вашему запросу ничего не найдено. Попробуйте другую категорию.',
    loadError: 'Произошла ошибка загрузки. Попробуйте ещё раз.',
    listingGone: 'Это объявление больше недоступно.',
    newSearch: '🔍 Новый поиск',
    changeModel: '🔁 Другая модель',
    call: '📞 Позвонить',
    prev: '◀️ Пред.',
    next: 'След. ▶️',
    actions: 'Действия:',
    year: 'Год',
    category: 'Категория',
    price: 'Цена',
    mileage: 'Пробег',
    km: 'км',
    engine: 'Двигатель',
    transmission: 'Коробка передач',
    drive: 'Привод',
    color: 'Цвет',
    phone: 'Телефон для связи',
    sellBtn: '📝 Оставить заявку на продажу авто',
    sell: {
      category: '📂 Выберите категорию вашего автомобиля:',
      brand: '🏷 Введите марку автомобиля (например: Toyota):',
      model: '📋 Введите модель автомобиля (например: Camry):',
      year: '📅 Введите год выпуска (например: 2018). Если не хотите указывать — отправьте «-»:',
      price: '💰 Введите желаемую цену числом (например: 12000). Если не хотите указывать — отправьте «-»:',
      currency: '💱 В какой валюте цена?',
      mileage: '🛣 Введите пробег в км (например: 85000). Если не хотите указывать — отправьте «-»:',
      engine: '⚙️ Введите двигатель (например: 2.0 л, бензин). Если не хотите указывать — отправьте «-»:',
      transmission: '🔧 Введите коробку передач (например: Автомат). Если не хотите указывать — отправьте «-»:',
      drive: '🛞 Введите привод (например: Полный). Если не хотите указывать — отправьте «-»:',
      color: '🎨 Введите цвет автомобиля. Если не хотите указывать — отправьте «-»:',
      description: '📝 Напишите короткое описание автомобиля. Если не хотите указывать — отправьте «-»:',
      phone: '📞 Введите ваш номер телефона для связи:',
      name: '🙋 Как к вам обращаться? Введите ваше имя:',
      confirmTitle: '✅ Проверьте вашу заявку:',
      send: '📨 Отправить заявку',
      cancelBtn: '❌ Отмена',
      cancelled: 'Заявка отменена.',
      thanks: '✅ Спасибо! Ваша заявка принята. Наш менеджер свяжется с вами в ближайшее время.',
      invalidNumber: 'Пожалуйста, введите число или «-», если не хотите указывать.',
      emptyRequired: 'Это поле обязательно. Пожалуйста, введите значение.',
      notActive: 'Сейчас нет активной заявки. Нажмите «📝 Оставить заявку на продажу авто», чтобы начать.',
      skip: '—',
    },
  },
  uz: {
    chooseLanguage: 'Interfeys tilini tanlang:',
    welcome: (name) => `👋 ${name} ga xush kelibsiz!\n\nBu yerda siz kategoriya, marka va model bo'yicha avtomobil tanlashingiz mumkin.`,
    searchBtn: '🔍 Avtomobil qidirish',
    chooseCategory: '📂 Avtomobil kategoriyasini tanlang:',
    chooseBrand: '🏷 Markani tanlang:',
    chooseModel: '📋 Modelni tanlang:',
    allBrands: '🚗 Barcha markalar',
    allModels: '🚘 Barcha modellar',
    backToCategories: '⬅️ Kategoriyalarga qaytish',
    backToBrands: '⬅️ Markalarga qaytish',
    noCategories: "Hozircha kategoriyalar mavjud emas. Keyinroq qayta urinib ko'ring.",
    noListingsCategory: "Bu kategoriyada hozircha e'lonlar yo'q.",
    noListingsSelection: "Bu tanlov bo'yicha hozircha e'lonlar yo'q.",
    noListingsFound: "So'rovingiz bo'yicha hech narsa topilmadi. Boshqa kategoriyani sinab ko'ring.",
    loadError: "Yuklashda xatolik yuz berdi. Qayta urinib ko'ring.",
    listingGone: "Bu e'lon endi mavjud emas.",
    newSearch: '🔍 Yangi qidiruv',
    changeModel: '🔁 Boshqa model',
    call: "📞 Qo'ng'iroq qilish",
    prev: '◀️ Oldingi',
    next: 'Keyingi ▶️',
    actions: 'Amallar:',
    year: 'Yili',
    category: 'Kategoriya',
    price: 'Narxi',
    mileage: 'Probeg',
    km: 'km',
    engine: 'Dvigatel',
    transmission: 'Uzatmalar qutisi',
    drive: 'Privod',
    color: 'Rangi',
    phone: "Bog'lanish uchun telefon",
    sellBtn: "📝 Avtomobil sotish uchun ariza qoldirish",
    sell: {
      category: "📂 Avtomobilingiz kategoriyasini tanlang:",
      brand: "🏷 Avtomobil markasini kiriting (masalan: Toyota):",
      model: "📋 Avtomobil modelini kiriting (masalan: Camry):",
      year: "📅 Ishlab chiqarilgan yilini kiriting (masalan: 2018). Ko'rsatmoqchi bo'lmasangiz — «-» yuboring:",
      price: "💰 Narxni raqamda kiriting (masalan: 12000). Ko'rsatmoqchi bo'lmasangiz — «-» yuboring:",
      currency: "💱 Narx qaysi valyutada?",
      mileage: "🛣 Probegni km da kiriting (masalan: 85000). Ko'rsatmoqchi bo'lmasangiz — «-» yuboring:",
      engine: "⚙️ Dvigatelni kiriting (masalan: 2.0 l, benzin). Ko'rsatmoqchi bo'lmasangiz — «-» yuboring:",
      transmission: "🔧 Uzatmalar qutisini kiriting (masalan: Avtomat). Ko'rsatmoqchi bo'lmasangiz — «-» yuboring:",
      drive: "🛞 Privodni kiriting (masalan: Toʻliq). Ko'rsatmoqchi bo'lmasangiz — «-» yuboring:",
      color: "🎨 Avtomobil rangini kiriting. Ko'rsatmoqchi bo'lmasangiz — «-» yuboring:",
      description: "📝 Avtomobil haqida qisqacha yozing. Ko'rsatmoqchi bo'lmasangiz — «-» yuboring:",
      phone: "📞 Bog'lanish uchun telefon raqamingizni kiriting:",
      name: "🙋 Sizga qanday murojaat qilsak bo'ladi? Ismingizni kiriting:",
      confirmTitle: "✅ Arizangizni tekshiring:",
      send: "📨 Arizani yuborish",
      cancelBtn: "❌ Bekor qilish",
      cancelled: "Ariza bekor qilindi.",
      thanks: "✅ Rahmat! Arizangiz qabul qilindi. Menejerimiz tez orada siz bilan bog'lanadi.",
      invalidNumber: "Iltimos, raqam kiriting yoki ko'rsatmoqchi bo'lmasangiz «-» yuboring.",
      emptyRequired: "Bu maydon majburiy. Iltimos, qiymat kiriting.",
      notActive: "Hozircha faol ariza yo'q. Boshlash uchun «📝 Avtomobil sotish uchun ariza qoldirish» tugmasini bosing.",
      skip: '—',
    },
  },
  en: {
    chooseLanguage: 'Choose interface language:',
    welcome: (name) => `👋 Welcome to ${name}!\n\nHere you can find a car by category, brand and model.`,
    searchBtn: '🔍 Find a car',
    chooseCategory: '📂 Choose a car category:',
    chooseBrand: '🏷 Choose a brand:',
    chooseModel: '📋 Choose a model:',
    allBrands: '🚗 All brands',
    allModels: '🚘 All models',
    backToCategories: '⬅️ Back to categories',
    backToBrands: '⬅️ Back to brands',
    noCategories: 'No categories available yet. Please check back later.',
    noListingsCategory: 'There are no listings in this category yet.',
    noListingsSelection: 'There are no listings for this selection yet.',
    noListingsFound: 'Nothing found for your search. Try another category.',
    loadError: 'Something went wrong while loading. Please try again.',
    listingGone: 'This listing is no longer available.',
    newSearch: '🔍 New search',
    changeModel: '🔁 Change model',
    call: '📞 Call',
    prev: '◀️ Prev',
    next: 'Next ▶️',
    actions: 'Actions:',
    year: 'Year',
    category: 'Category',
    price: 'Price',
    mileage: 'Mileage',
    km: 'km',
    engine: 'Engine',
    transmission: 'Transmission',
    drive: 'Drivetrain',
    color: 'Color',
    phone: 'Contact phone',
    sellBtn: '📝 Submit a car for sale',
    sell: {
      category: '📂 Choose your car\'s category:',
      brand: '🏷 Enter the car brand (e.g. Toyota):',
      model: '📋 Enter the car model (e.g. Camry):',
      year: '📅 Enter the year (e.g. 2018). Send "-" to skip:',
      price: '💰 Enter the asking price as a number (e.g. 12000). Send "-" to skip:',
      currency: '💱 Which currency is the price in?',
      mileage: '🛣 Enter the mileage in km (e.g. 85000). Send "-" to skip:',
      engine: '⚙️ Enter the engine (e.g. 2.0 L, petrol). Send "-" to skip:',
      transmission: '🔧 Enter the transmission (e.g. Automatic). Send "-" to skip:',
      drive: '🛞 Enter the drivetrain (e.g. AWD). Send "-" to skip:',
      color: '🎨 Enter the car color. Send "-" to skip:',
      description: '📝 Write a short description of the car. Send "-" to skip:',
      phone: '📞 Enter your contact phone number:',
      name: '🙋 What should we call you? Enter your name:',
      confirmTitle: '✅ Please check your request:',
      send: '📨 Send request',
      cancelBtn: '❌ Cancel',
      cancelled: 'Request cancelled.',
      thanks: '✅ Thank you! Your request has been received. Our manager will contact you shortly.',
      invalidNumber: 'Please enter a number, or send "-" to skip.',
      emptyRequired: 'This field is required. Please enter a value.',
      notActive: 'There is no active request right now. Tap "📝 Submit a car for sale" to start.',
      skip: '—',
    },
  },
};

// Известные категории по умолчанию — переводим по названию, если совпадает.
// Категории, добавленные админом самостоятельно, показываются как есть на всех языках.
const CATEGORY_TRANSLATIONS = {
  'Внедорожник (SUV)': { ru: 'Внедорожник (SUV)', uz: "Yo'ldan tashqari (SUV)", en: 'SUV' },
  'Кроссовер': { ru: 'Кроссовер', uz: 'Krossover', en: 'Crossover' },
  'Седан': { ru: 'Седан', uz: 'Sedan', en: 'Sedan' },
  'Хэтчбек': { ru: 'Хэтчбек', uz: 'Xetchbek', en: 'Hatchback' },
  'Минивэн': { ru: 'Минивэн', uz: 'Minivan', en: 'Minivan' },
  'Пикап': { ru: 'Пикап', uz: 'Pikap', en: 'Pickup' },
};
function categoryName(name, lang) {
  return CATEGORY_TRANSLATIONS[name]?.[lang] || name;
}

// -------------------- СЕССИИ --------------------
const sessions = new Map();
function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      lang: null,
      categoryId: null,
      brandId: null,
      modelId: null,
      results: [],
      index: 0,
      listingMessageIds: [],
      sell: null, // состояние мастера "заявка на продажу авто", пока активно
    });
  }
  return sessions.get(chatId);
}
function t(ctx) {
  const session = getSession(ctx.chat.id);
  return T[session.lang || 'ru'];
}

// -------------------- СТАРТ: ВЫБОР ЯЗЫКА --------------------
bot.start(async (ctx) => {
  const session = getSession(ctx.chat.id);
  session.lang = null;
  await ctx.reply(
    'Выберите язык / Tilni tanlang / Choose language:',
    Markup.inlineKeyboard([
      [Markup.button.callback('🇷🇺 Русский', 'lang:ru')],
      [Markup.button.callback("🇺🇿 O'zbekcha", 'lang:uz')],
      [Markup.button.callback('🇬🇧 English', 'lang:en')],
    ])
  );
});

bot.action(/^lang:(ru|uz|en)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  session.lang = ctx.match[1];
  const s = t(ctx);
  await ctx.editMessageText(
    s.welcome(COMPANY_NAME),
    Markup.inlineKeyboard([
      [Markup.button.callback(s.searchBtn, 'search:start')],
      [Markup.button.callback(s.sellBtn, 'sell:start')],
    ])
  );
});

bot.action('search:start', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  await clearListingMessages(ctx, session);
  session.categoryId = null;
  session.brandId = null;
  session.modelId = null;
  await showCategories(ctx);
});

// -------------------- ШАГ 1: КАТЕГОРИЯ --------------------
async function showCategories(ctx) {
  const s = t(ctx);
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order', { ascending: true });

  if (error || !categories || categories.length === 0) {
    return editOrReply(ctx, s.noCategories);
  }

  const session = getSession(ctx.chat.id);
  const buttons = categories.map((c) => [
    Markup.button.callback(categoryName(c.name, session.lang || 'ru'), `cat:${c.id}`),
  ]);
  await editOrReply(ctx, s.chooseCategory, Markup.inlineKeyboard(buttons));
}

bot.action(/^cat:(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const categoryId = ctx.match[1];
  const session = getSession(ctx.chat.id);
  session.categoryId = categoryId;
  session.brandId = null;
  session.modelId = null;
  await showBrands(ctx);
});

// -------------------- ШАГ 2: МАРКА --------------------
async function showBrands(ctx) {
  const s = t(ctx);
  const session = getSession(ctx.chat.id);

  const { data: rows, error } = await supabase
    .from('listings')
    .select('brand_id, brands(id, name)')
    .eq('category_id', session.categoryId)
    .eq('is_active', true);

  if (error) return editOrReply(ctx, s.loadError);

  const seen = new Map();
  (rows || []).forEach((r) => { if (r.brands) seen.set(r.brands.id, r.brands.name); });

  if (seen.size === 0) {
    return editOrReply(ctx, s.noListingsCategory, Markup.inlineKeyboard([[Markup.button.callback(s.backToCategories, 'back:categories')]]));
  }

  const buttons = Array.from(seen.entries()).map(([id, name]) => [Markup.button.callback(name, `brand:${id}`)]);
  buttons.push([Markup.button.callback(s.allBrands, 'brand:all')]);
  buttons.push([Markup.button.callback(s.backToCategories, 'back:categories')]);

  await editOrReply(ctx, s.chooseBrand, Markup.inlineKeyboard(buttons));
}

bot.action('back:categories', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  await clearListingMessages(ctx, session);
  await showCategories(ctx);
});

bot.action(/^brand:(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const brandId = ctx.match[1];
  const session = getSession(ctx.chat.id);
  session.brandId = brandId === 'all' ? null : brandId;
  session.modelId = null;
  await showModels(ctx);
});

// -------------------- ШАГ 3: МОДЕЛЬ --------------------
async function showModels(ctx) {
  const s = t(ctx);
  const session = getSession(ctx.chat.id);

  let query = supabase
    .from('listings')
    .select('model_id, models(id, name)')
    .eq('category_id', session.categoryId)
    .eq('is_active', true);
  if (session.brandId) query = query.eq('brand_id', session.brandId);

  const { data: rows, error } = await query;
  if (error) return editOrReply(ctx, s.loadError);

  const seen = new Map();
  (rows || []).forEach((r) => { if (r.models) seen.set(r.models.id, r.models.name); });

  if (seen.size === 0) {
    return editOrReply(ctx, s.noListingsSelection, Markup.inlineKeyboard([[Markup.button.callback(s.backToBrands, 'back:brands')]]));
  }

  const buttons = Array.from(seen.entries()).map(([id, name]) => [Markup.button.callback(name, `model:${id}`)]);
  buttons.push([Markup.button.callback(s.allModels, 'model:all')]);
  buttons.push([Markup.button.callback(s.backToBrands, 'back:brands')]);

  await editOrReply(ctx, s.chooseModel, Markup.inlineKeyboard(buttons));
}

bot.action('back:brands', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  await clearListingMessages(ctx, session);
  await showBrands(ctx);
});

bot.action(/^model:(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const modelId = ctx.match[1];
  const session = getSession(ctx.chat.id);
  session.modelId = modelId === 'all' ? null : modelId;
  await runSearch(ctx);
});

bot.action('change:model', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  await clearListingMessages(ctx, session);
  await showModels(ctx);
});

// -------------------- ПОИСК И ПОКАЗ ОБЪЯВЛЕНИЙ ПО ОДНОМУ --------------------
async function runSearch(ctx) {
  const s = t(ctx);
  const session = getSession(ctx.chat.id);

  let query = supabase
    .from('listings')
    .select('id')
    .eq('category_id', session.categoryId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (session.brandId) query = query.eq('brand_id', session.brandId);
  if (session.modelId) query = query.eq('model_id', session.modelId);

  const { data, error } = await query;
  if (error) return editOrReply(ctx, s.loadError);

  session.results = (data || []).map((r) => r.id);
  session.index = 0;

  if (session.results.length === 0) {
    return editOrReply(
      ctx,
      s.noListingsFound,
      Markup.inlineKeyboard([
        [Markup.button.callback(s.newSearch, 'search:start')],
        [Markup.button.callback(s.sellBtn, 'sell:start')],
      ])
    );
  }

  await sendCurrentListing(ctx);
}

// Удаляет фото/карточку предыдущего показанного объявления, чтобы чат
// не засорялся, когда клиент листает дальше, меняет модель или возвращается.
async function clearListingMessages(ctx, session) {
  if (session.listingMessageIds && session.listingMessageIds.length) {
    for (const id of session.listingMessageIds) {
      try { await ctx.telegram.deleteMessage(ctx.chat.id, id); } catch (e) { /* уже удалено или слишком старое */ }
    }
  }
  session.listingMessageIds = [];
}

async function sendCurrentListing(ctx) {
  const s = t(ctx);
  const session = getSession(ctx.chat.id);
  await clearListingMessages(ctx, session);

  const listingId = session.results[session.index];

  const { data: listing, error } = await supabase.from('public_listings').select('*').eq('id', listingId).single();
  const { data: photos } = await supabase
    .from('listing_photos')
    .select('url')
    .eq('listing_id', listingId)
    .order('position', { ascending: true })
    .limit(4);

  if (error || !listing) {
    return ctx.reply(s.listingGone);
  }

  const categoryLabel = categoryName(listing.category_name, session.lang || 'ru');

  const caption =
    `🚗 *${listing.brand_name} ${listing.model_name}* (${listing.year || '—'})\n\n` +
    `📂 ${s.category}: ${categoryLabel}\n` +
    `💰 ${s.price}: *${formatPrice(listing.price)} ${listing.currency}*\n` +
    (listing.mileage_km ? `🛣 ${s.mileage}: ${listing.mileage_km.toLocaleString('ru-RU')} ${s.km}\n` : '') +
    (listing.engine ? `⚙️ ${s.engine}: ${listing.engine}\n` : '') +
    (listing.transmission ? `🔧 ${s.transmission}: ${listing.transmission}\n` : '') +
    (listing.drive_type ? `🛞 ${s.drive}: ${listing.drive_type}\n` : '') +
    (listing.color ? `🎨 ${s.color}: ${listing.color}\n` : '') +
    (listing.description ? `\n📝 ${listing.description}\n` : '') +
    `\n📞 ${s.phone}: ${listing.phone}`;

  const navButtons = [];
  if (session.results.length > 1) {
    navButtons.push(
      Markup.button.callback(s.prev, 'nav:prev'),
      Markup.button.callback(`${session.index + 1}/${session.results.length}`, 'noop'),
      Markup.button.callback(s.next, 'nav:next')
    );
  }

  const keyboardRows = [];
  if (navButtons.length) keyboardRows.push(navButtons);
  // Кнопку "url" со схемой tel: Telegram Bot API отклоняет (разрешены только
  // http(s)/tg) — это ломало отправку ВСЕГО сообщения с кнопками, включая
  // листалку. Номер телефона и так показан текстом в самой карточке выше.
  keyboardRows.push([Markup.button.callback(s.changeModel, 'change:model')]);
  keyboardRows.push([Markup.button.callback(s.newSearch, 'search:start')]);
  keyboardRows.push([Markup.button.callback(s.sellBtn, 'sell:start')]);

  const urls = (photos || []).map((p) => p.url).filter(Boolean).slice(0, 4);
  const newMessageIds = [];

  try {
    if (urls.length === 1) {
      // Telegram API отклоняет replyWithMediaGroup из одного элемента —
      // раньше это уходило в catch и объявление отправлялось вовсе без фото.
      const sentPhoto = await ctx.replyWithPhoto(urls[0], { caption, parse_mode: 'Markdown' });
      newMessageIds.push(sentPhoto.message_id);
      const sentActions = await ctx.reply(s.actions, Markup.inlineKeyboard(keyboardRows));
      newMessageIds.push(sentActions.message_id);
    } else if (urls.length > 1) {
      const media = urls.map((url, i) => ({
        type: 'photo',
        media: url,
        ...(i === 0 ? { caption, parse_mode: 'Markdown' } : {}),
      }));
      const sentMedia = await ctx.replyWithMediaGroup(media);
      sentMedia.forEach((m) => newMessageIds.push(m.message_id));
      const sentActions = await ctx.reply(s.actions, Markup.inlineKeyboard(keyboardRows));
      newMessageIds.push(sentActions.message_id);
    } else {
      const sentText = await ctx.reply(caption, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboardRows) });
      newMessageIds.push(sentText.message_id);
    }
  } catch (e) {
    console.error('Ошибка отправки объявления:', e);
    const sentText = await ctx.reply(caption, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboardRows) });
    newMessageIds.push(sentText.message_id);
  }

  session.listingMessageIds = newMessageIds;
}

bot.action('nav:next', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  if (!session.results || session.results.length === 0) return runSearch(ctx);
  session.index = (session.index + 1) % session.results.length;
  await sendCurrentListing(ctx);
});

bot.action('nav:prev', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  if (!session.results || session.results.length === 0) return runSearch(ctx);
  session.index = (session.index - 1 + session.results.length) % session.results.length;
  await sendCurrentListing(ctx);
});

bot.action('noop', async (ctx) => ctx.answerCbQuery());

// ============================================================
// ЗАЯВКА НА ПРОДАЖУ АВТОМОБИЛЯ (от клиента, который хочет продать свою машину)
// Пошаговый мастер: бот задаёт вопросы по одному, клиент отвечает
// текстом. В конце — подтверждение и запись в таблицу sell_requests
// (админ видит и обрабатывает такие заявки в сайте-админке).
// ============================================================

// Порядок текстовых шагов после выбора категории.
const SELL_STEPS = [
  { key: 'brand', required: true, kind: 'text' },
  { key: 'model', required: true, kind: 'text' },
  { key: 'year', required: false, kind: 'number' },
  { key: 'price', required: true, kind: 'number' },
  { key: 'currency', required: true, kind: 'currency' },
  { key: 'mileage', required: false, kind: 'number' },
  { key: 'engine', required: false, kind: 'text' },
  { key: 'transmission', required: false, kind: 'text' },
  { key: 'drive', required: false, kind: 'text' },
  { key: 'color', required: false, kind: 'text' },
  { key: 'description', required: false, kind: 'text' },
  { key: 'phone', required: true, kind: 'text' },
  { key: 'name', required: true, kind: 'text' },
];

function sellCancelKeyboard(s) {
  return Markup.inlineKeyboard([[Markup.button.callback(s.sell.cancelBtn, 'sell:cancel')]]);
}

bot.action('sell:start', async (ctx) => {
  await ctx.answerCbQuery();
  const s = t(ctx);
  const session = getSession(ctx.chat.id);
  await clearListingMessages(ctx, session);

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order', { ascending: true });

  session.sell = { step: 'category', data: {} };

  if (error || !categories || categories.length === 0) {
    // Категорий нет — пропускаем этот шаг, начинаем сразу с марки.
    session.sell.step = 'brand';
    session.sell.stepIndex = 0;
    return ctx.reply(s.sell.brand, sellCancelKeyboard(s));
  }

  const buttons = categories.map((c) => [
    Markup.button.callback(categoryName(c.name, session.lang || 'ru'), `sellcat:${c.id}`),
  ]);
  buttons.push([Markup.button.callback(s.sell.cancelBtn, 'sell:cancel')]);
  await ctx.reply(s.sell.category, Markup.inlineKeyboard(buttons));
});

bot.action(/^sellcat:(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const s = t(ctx);
  const session = getSession(ctx.chat.id);
  if (!session.sell) return; // заявка уже отменена/завершена — игнорируем устаревшую кнопку
  session.sell.data.category_id = ctx.match[1];
  session.sell.step = 'brand';
  session.sell.stepIndex = 0;
  await ctx.reply(s.sell.brand, sellCancelKeyboard(s));
});

bot.action('sell:cancel', async (ctx) => {
  await ctx.answerCbQuery();
  const s = t(ctx);
  const session = getSession(ctx.chat.id);
  session.sell = null;
  await ctx.reply(s.sell.cancelled);
});

bot.action(/^sellcur:(USD|UZS|EUR)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  if (!session.sell || session.sell.step !== 'currency') return;
  session.sell.data.currency = ctx.match[1];
  await advanceSellStep(ctx, session);
});

bot.action('sell:confirm', async (ctx) => {
  await ctx.answerCbQuery();
  const s = t(ctx);
  const session = getSession(ctx.chat.id);
  if (!session.sell) return;
  const d = session.sell.data;

  const { error } = await supabase.from('sell_requests').insert({
    category_id: d.category_id || null,
    brand_name: d.brand,
    model_name: d.model,
    year: d.year ?? null,
    price: d.price ?? null,
    currency: d.currency || 'USD',
    mileage_km: d.mileage ?? null,
    engine: d.engine || null,
    transmission: d.transmission || null,
    drive_type: d.drive || null,
    color: d.color || null,
    description: d.description || null,
    phone: d.phone,
    contact_name: d.name,
  });

  session.sell = null;

  if (error) {
    console.error('Ошибка сохранения заявки на продажу:', error);
    return ctx.reply(s.loadError);
  }

  await ctx.reply(s.sell.thanks);
  await notifyAdminsAboutSellRequest(d, session.lang || 'ru');
});

// Текстовые ответы клиента во время прохождения мастера заявки.
bot.on('text', async (ctx) => {
  const session = getSession(ctx.chat.id);
  if (!session.sell || session.sell.step === 'category' || session.sell.step === 'currency') return;

  const s = t(ctx);
  const stepIndex = SELL_STEPS.findIndex((st) => st.key === session.sell.step);
  if (stepIndex === -1) return;
  const stepDef = SELL_STEPS[stepIndex];
  const raw = ctx.message.text.trim();
  const isSkip = raw === '-' || raw === '—';

  if (!stepDef.required && isSkip) {
    session.sell.data[stepDef.key] = null;
    session.sell.stepIndex = stepIndex;
    return advanceSellStep(ctx, session);
  }

  if (!raw || (stepDef.required && isSkip)) {
    return ctx.reply(s.sell.emptyRequired, sellCancelKeyboard(s));
  }

  if (stepDef.kind === 'number') {
    const num = Number(raw.replace(',', '.'));
    if (Number.isNaN(num)) {
      return ctx.reply(s.sell.invalidNumber, sellCancelKeyboard(s));
    }
    session.sell.data[stepDef.key] = num;
  } else {
    session.sell.data[stepDef.key] = raw;
  }

  session.sell.stepIndex = stepIndex;
  await advanceSellStep(ctx, session);
});

// Переходит к следующему шагу мастера или, если это был последний шаг,
// показывает итоговую заявку для подтверждения.
async function advanceSellStep(ctx, session) {
  const s = t(ctx);
  const currentIndex = SELL_STEPS.findIndex((st) => st.key === session.sell.step);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= SELL_STEPS.length) {
    return showSellConfirmation(ctx, session);
  }

  const nextStep = SELL_STEPS[nextIndex];
  session.sell.step = nextStep.key;

  if (nextStep.kind === 'currency') {
    return ctx.reply(
      s.sell.currency,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('USD', 'sellcur:USD'),
          Markup.button.callback('UZS', 'sellcur:UZS'),
          Markup.button.callback('EUR', 'sellcur:EUR'),
        ],
        [Markup.button.callback(s.sell.cancelBtn, 'sell:cancel')],
      ])
    );
  }

  await ctx.reply(s.sell[nextStep.key], sellCancelKeyboard(s));
}

async function showSellConfirmation(ctx, session) {
  const s = t(ctx);
  const d = session.sell.data;
  session.sell.step = 'confirm';

  const lines = [
    s.sell.confirmTitle,
    '',
    `🚗 ${d.brand} ${d.model}${d.year ? ` (${d.year})` : ''}`,
    d.price ? `💰 ${formatPrice(d.price)} ${d.currency}` : null,
    d.mileage ? `🛣 ${d.mileage.toLocaleString('ru-RU')} ${s.km}` : null,
    d.engine ? `⚙️ ${d.engine}` : null,
    d.transmission ? `🔧 ${d.transmission}` : null,
    d.drive ? `🛞 ${d.drive}` : null,
    d.color ? `🎨 ${d.color}` : null,
    d.description ? `📝 ${d.description}` : null,
    `📞 ${d.phone}`,
    `🙋 ${d.name}`,
  ].filter(Boolean);

  await ctx.reply(
    lines.join('\n'),
    Markup.inlineKeyboard([
      [Markup.button.callback(s.sell.send, 'sell:confirm')],
      [Markup.button.callback(s.sell.cancelBtn, 'sell:cancel')],
    ])
  );
}

// Необязательное уведомление админам в Telegram о новой заявке.
// Задайте в .env / Render → Environment переменную ADMIN_CHAT_IDS —
// один chat_id или несколько через запятую. Если не задано, просто пропускается.
async function notifyAdminsAboutSellRequest(d, lang) {
  const ids = (process.env.ADMIN_CHAT_IDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  if (ids.length === 0) return;

  const text =
    `📩 Новая заявка на продажу авто!\n\n` +
    `🚗 ${d.brand} ${d.model}${d.year ? ` (${d.year})` : ''}\n` +
    (d.price ? `💰 ${formatPrice(d.price)} ${d.currency}\n` : '') +
    (d.mileage ? `🛣 ${d.mileage.toLocaleString('ru-RU')} км\n` : '') +
    (d.engine ? `⚙️ ${d.engine}\n` : '') +
    (d.transmission ? `🔧 ${d.transmission}\n` : '') +
    (d.drive ? `🛞 ${d.drive}\n` : '') +
    (d.color ? `🎨 ${d.color}\n` : '') +
    (d.description ? `📝 ${d.description}\n` : '') +
    `📞 ${d.phone}\n` +
    `🙋 ${d.name}`;

  for (const chatId of ids) {
    try {
      await bot.telegram.sendMessage(chatId, text);
    } catch (e) {
      console.error(`Не удалось уведомить админа ${chatId}:`, e);
    }
  }
}

// -------------------- ВСПОМОГАТЕЛЬНОЕ --------------------
function formatPrice(price) {
  return Number(price).toLocaleString('ru-RU');
}

async function editOrReply(ctx, text, keyboard) {
  try {
    if (ctx.updateType === 'callback_query') {
      await ctx.editMessageText(text, keyboard);
      return;
    }
  } catch (e) {
    // если сообщение нельзя отредактировать — отправим новое
  }
  await ctx.reply(text, keyboard);
}

bot.catch((err, ctx) => {
  console.error(`Ошибка у ${ctx.updateType}:`, err);
});

bot.launch().then(() => console.log(`${COMPANY_NAME} бот запущен`));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
