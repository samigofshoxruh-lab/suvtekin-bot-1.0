// ============================================================
// SUVTEKIN — Telegram-бот для поиска и продажи автомобилей
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


// Простое хранилище состояния диалога в памяти (chatId -> state)
const sessions = new Map();
function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { categoryId: null, brandId: null, modelId: null, results: [], index: 0 });
  }
  return sessions.get(chatId);
}

// -------------------- ГЛАВНОЕ МЕНЮ --------------------
bot.start(async (ctx) => {
  await ctx.reply(
    `👋 Добро пожаловать в ${COMPANY_NAME}!\n\nЗдесь вы можете подобрать автомобиль по категории, марке и модели.`,
    Markup.inlineKeyboard([
      [Markup.button.callback('🔍 Найти автомобиль', 'search:start')],
    ])
  );
});

bot.action('search:start', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.chat.id);
  session.categoryId = null;
  session.brandId = null;
  session.modelId = null;
  await showCategories(ctx);
});

// -------------------- ШАГ 1: КАТЕГОРИЯ --------------------
async function showCategories(ctx) {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order', { ascending: true });

  if (error || !categories || categories.length === 0) {
    return editOrReply(ctx, 'Пока нет доступных категорий. Загляните позже.');
  }

  const buttons = categories.map((c) => [Markup.button.callback(c.name, `cat:${c.id}`)]);
  await editOrReply(ctx, '📂 Выберите категорию автомобиля:', Markup.inlineKeyboard(buttons));
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
  const session = getSession(ctx.chat.id);

  const { data: rows, error } = await supabase
    .from('listings')
    .select('brand_id, brands(id, name)')
    .eq('category_id', session.categoryId)
    .eq('is_active', true);

  if (error) {
    return editOrReply(ctx, 'Произошла ошибка при загрузке марок. Попробуйте ещё раз.');
  }

  const seen = new Map();
  (rows || []).forEach((r) => {
    if (r.brands) seen.set(r.brands.id, r.brands.name);
  });

  if (seen.size === 0) {
    return editOrReply(
      ctx,
      'В этой категории пока нет объявлений.',
      Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад к категориям', 'back:categories')]])
    );
  }

  const buttons = Array.from(seen.entries()).map(([id, name]) => [
    Markup.button.callback(name, `brand:${id}`),
  ]);
  buttons.push([Markup.button.callback('🚗 Все марки', 'brand:all')]);
  buttons.push([Markup.button.callback('⬅️ Назад к категориям', 'back:categories')]);

  await editOrReply(ctx, '🏷 Выберите марку:', Markup.inlineKeyboard(buttons));
}

bot.action('back:categories', async (ctx) => {
  await ctx.answerCbQuery();
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
  const session = getSession(ctx.chat.id);

  let query = supabase
    .from('listings')
    .select('model_id, models(id, name)')
    .eq('category_id', session.categoryId)
    .eq('is_active', true);

  if (session.brandId) query = query.eq('brand_id', session.brandId);

  const { data: rows, error } = await query;

  if (error) {
    return editOrReply(ctx, 'Произошла ошибка при загрузке моделей. Попробуйте ещё раз.');
  }

  const seen = new Map();
  (rows || []).forEach((r) => {
    if (r.models) seen.set(r.models.id, r.models.name);
  });

  if (seen.size === 0) {
    return editOrReply(
      ctx,
      'По этому выбору пока нет объявлений.',
      Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад к маркам', 'back:brands')]])
    );
  }

  const buttons = Array.from(seen.entries()).map(([id, name]) => [
    Markup.button.callback(name, `model:${id}`),
  ]);
  buttons.push([Markup.button.callback('🚘 Все модели', 'model:all')]);
  buttons.push([Markup.button.callback('⬅️ Назад к маркам', 'back:brands')]);

  await editOrReply(ctx, '📋 Выберите модель:', Markup.inlineKeyboard(buttons));
}

bot.action('back:brands', async (ctx) => {
  await ctx.answerCbQuery();
  await showBrands(ctx);
});

bot.action(/^model:(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const modelId = ctx.match[1];
  const session = getSession(ctx.chat.id);
  session.modelId = modelId === 'all' ? null : modelId;
  await runSearch(ctx);
});

// -------------------- ПОИСК И ПОКАЗ ОБЪЯВЛЕНИЙ --------------------
async function runSearch(ctx) {
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

  if (error) {
    return editOrReply(ctx, 'Произошла ошибка поиска. Попробуйте ещё раз.');
  }

  session.results = (data || []).map((r) => r.id);
  session.index = 0;

  if (session.results.length === 0) {
    return editOrReply(
      ctx,
      'По вашему запросу ничего не найдено. Попробуйте другую категорию.',
      Markup.inlineKeyboard([[Markup.button.callback('🔍 Новый поиск', 'search:start')]])
    );
  }

  await sendCurrentListing(ctx);
}

async function sendCurrentListing(ctx) {
  const session = getSession(ctx.chat.id);
  const listingId = session.results[session.index];

  const { data: listing, error } = await supabase
    .from('public_listings')
    .select('*')
    .eq('id', listingId)
    .single();

  const { data: photos } = await supabase
    .from('listing_photos')
    .select('url')
    .eq('listing_id', listingId)
    .order('position', { ascending: true })
    .limit(4);

  if (error || !listing) {
    return ctx.reply('Это объявление больше недоступно.');
  }

  const caption =
    `🚗 *${listing.brand_name} ${listing.model_name}* (${listing.year || '—'})\n\n` +
    `📂 Категория: ${listing.category_name}\n` +
    `💰 Цена: *${formatPrice(listing.price)} ${listing.currency}*\n` +
    (listing.mileage_km ? `🛣 Пробег: ${listing.mileage_km.toLocaleString('ru-RU')} км\n` : '') +
    (listing.engine ? `⚙️ Двигатель: ${listing.engine}\n` : '') +
    (listing.transmission ? `🔧 Коробка передач: ${listing.transmission}\n` : '') +
    (listing.drive_type ? `🛞 Привод: ${listing.drive_type}\n` : '') +
    (listing.color ? `🎨 Цвет: ${listing.color}\n` : '') +
    (listing.description ? `\n📝 ${listing.description}\n` : '') +
    `\n📞 Телефон для связи: ${listing.phone}`;

  const navButtons = [];
  if (session.results.length > 1) {
    navButtons.push(
      Markup.button.callback('◀️ Пред.', 'nav:prev'),
      Markup.button.callback(`${session.index + 1}/${session.results.length}`, 'noop'),
      Markup.button.callback('След. ▶️', 'nav:next')
    );
  }

  const keyboardRows = [];
  if (navButtons.length) keyboardRows.push(navButtons);
  keyboardRows.push([Markup.button.url('📞 Позвонить', `tel:${listing.phone.replace(/[^\d+]/g, '')}`)]);
  keyboardRows.push([Markup.button.callback('🔍 Новый поиск', 'search:start')]);

  const urls = (photos || []).map((p) => p.url).filter(Boolean).slice(0, 4);

  try {
    if (urls.length > 0) {
      const media = urls.map((url, i) => ({
        type: 'photo',
        media: url,
        ...(i === 0 ? { caption, parse_mode: 'Markdown' } : {}),
      }));
      await ctx.replyWithMediaGroup(media);
      await ctx.reply('Действия:', Markup.inlineKeyboard(keyboardRows));
    } else {
      await ctx.reply(caption, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboardRows) });
    }
  } catch (e) {
    console.error('Ошибка отправки объявления:', e);
    await ctx.reply(caption, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboardRows) });
  }
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
