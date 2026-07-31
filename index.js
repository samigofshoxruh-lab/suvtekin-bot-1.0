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
    Markup.inlineKeyboard([[Markup.button.callback(s.searchBtn, 'search:start')]])
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
    return editOrReply(ctx, s.noListingsFound, Markup.inlineKeyboard([[Markup.button.callback(s.newSearch, 'search:start')]]));
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
  keyboardRows.push([Markup.button.url(s.call, `tel:${listing.phone.replace(/[^\d+]/g, '')}`)]);
  keyboardRows.push([Markup.button.callback(s.changeModel, 'change:model')]);
  keyboardRows.push([Markup.button.callback(s.newSearch, 'search:start')]);

  const urls = (photos || []).map((p) => p.url).filter(Boolean).slice(0, 4);
  const newMessageIds = [];

  try {
    if (urls.length > 0) {
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
  session.index = (session.index + 1) % session.results.length;
  await sendCurrentListing(ctx);
});

bot.action('nav:prev', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  session.index = (session.index - 1 + session.results.length) % session.results.length;
  await sendCurrentListing(ctx);
});

bot.action('noop', async (ctx) => ctx.answerCbQuery());

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
