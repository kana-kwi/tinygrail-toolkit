/**
 * 小圣杯工具箱 · Bangumi 超合金组件 v2.3.34
 * 说明与更新记录：https://github.com/kana-kwi/tinygrail-toolkit
 */
(function () {
  'use strict';

  const HOST = (() => {
    try {
      const t = window.top;
      if (t && t !== window && t.document && t.document.body) {
        return { doc: t.document, win: t, outer: true };
      }
    } catch (e) {}
    return { doc: document, win: window, outer: false };
  })();
  const HDOC = HOST.doc;
  const HWIN = HOST.win;
  const DOCS = HDOC === document ? [HDOC] : [HDOC, document];
  const WINS = HWIN === window ? [HWIN] : [HWIN, window];

  if (window.__TGTK__) return;
  window.__TGTK__ = true;

  const HOST_TOKEN = String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8);

  const API = 'https://tinygrail.com/api/';
  const LS_KEY = 'tgtk:settings:v1';
  const LS_FAV = 'tgtk:favs:v1';
  const LS_SNAP = 'tgtk:snap:v1';
  const LS_NOTE = 'tgtk:note:v1';
  const LS_TPIN = 'tgtk:templepin:v1';
  const LS_TUI = 'tgtk:templeui:v1';
  const PAGE_SIZE = 100;

  let pinApiDepth = 0;

  const VALHALLA_USER = 'tinygrail';
  const GENSOKYO_USER = 'blueleaf';

  const LV_BASE = 7500;
  const LV_RATE = 1.3;

  const LOG_TYPE = {
    1: 'scratch',
    2: 'ico',
    3: 'ico',
    4: 'buy',
    5: 'buy',
    6: 'sell',
    7: 'other',
    8: 'sell',
    9: 'sacrifice',
    10: 'auction',
    11: 'auction',
    12: 'auction',
    13: 'ico',
    14: 'tax',
    15: 'other',
    16: 'packet',
    17: 'packet',
    18: 'item',
  };

  const FLOW_RULES = [
    { key: 'aucbonus', label: '竞拍分红', kw: ['竞拍分红', '竞拍分成', '拍卖分红'] },
    { key: 'scratch', label: '刮刮乐', kw: ['刮刮乐', '抽奖', '转盘'] },
    {
      key: 'item',
      label: '道具',
      kw: ['混沌魔方', '虚空道标', '星光碎片', '闪光结晶', '鲤鱼之眼', '道具', '转移'],
    },
    { key: 'ico', label: 'ICO', kw: ['ICO', 'ico', '中签', '配售', '申购'] },
    { key: 'auction', label: '竞拍', kw: ['竞拍', '拍卖', '中标', '出价'] },
    { key: 'packet', label: '红包', kw: ['红包'] },
    { key: 'dividend', label: '股息', kw: ['股息'] },
    { key: 'bonus', label: '分红', kw: ['分红', '奖励'] },
    { key: 'sacrifice', label: '献祭', kw: ['献祭', '资产重组', '融资'] },
    { key: 'sell', label: '卖出', kw: ['卖出'] },
    { key: 'buy', label: '买入', kw: ['买入'] },
  ];
  const FLOW_LABEL = Object.create(null);
  FLOW_RULES.forEach((r) => (FLOW_LABEL[r.key] = r.label));
  FLOW_LABEL.other = '其他';
  FLOW_LABEL.tax = '股息税';

  const FUND_IN_KINDS = ['sell', 'dividend', 'bonus', 'aucbonus', 'sacrifice', 'ico', 'packet', 'other'];
  const FUND_OUT_KINDS = ['buy', 'auction', 'ico', 'packet', 'scratch', 'other'];
  const STOCK_IN_KINDS = ['buy', 'auction', 'ico', 'item', 'scratch', 'other'];
  const STOCK_OUT_KINDS = ['sell', 'sacrifice', 'item', 'other'];

  const FIXED_RULES = [
    {
      key: 'guidepost',
      label: '被道标命中',
      test: (s) => s.includes('虚空道标') && !/获得/.test(s) && /受到|被|你的圣殿/.test(s),
    },
    { key: 'star', label: '转化星之力', test: (s) => s.includes('星之力') || s.includes('灌注') },
    {
      key: 'item',
      label: '使用道具',
      test: (s) => s.includes('使用') && /魔方|道标|碎片|结晶|鲤鱼|道具/.test(s),
    },
  ];

  const TABS = ['temple', 'hold', 'fantasy', 'fav', 'magic', 'ico', 'cover', 'log'];
  const S = {
    tab: 'temple',
    theme: 'dark',
    threshold: 250,
    field: 'Assets',
    source: 'current',
    username: '',
    chars: '',
    filAssets: true,
    filCover: false,
    cover: 'default',
    holdQuery: '',
    lvMin: '',
    lvMax: '',
    minAmount: '',
    sortBy: 'levelDesc',
    fchars: '',
    favSort: 'added',
    magic: 'chaos',
    mFrom: '',
    mTo: '',
    mTimesBy: { chaos: 1, guidepost: 1, fisheye: 1 },
    mStop: true,
    mFill: false, // 固资不足时自动献祭补充
    mFillMax: 300, // 每次自动补充时一次性献祭多少股（不再当上限用）
    starChar: '',
    starAmount: 100,
    starStep: 500, // 旧设置，仅作「读不到塔上限」时的兜底
    starFill: false,
    starEndFill: 'full',
    sdTarget: '', // 目标圣殿角色（自己的塔）
    sdLevel: '', // 只看这个等级的角色（'' = 全部等级；0 = 只筛 Lv0 / ST）
    sdFroms: [], // 燃料队列：按点选顺序依次消耗，总共扣「数量」那么多股
    sdAmount: 100,
    sdQuery: '',
    sdSortAsc: false, // 燃料候选排序：false = 持股从多到少，true = 从少到多
    icoCfg: {}, // { [icoId]: { lv, on, cid, name, end, res, at } } 自动注资计划（含 ICO 元信息，换页面/重启也能独立判断）
    icoAdvance: 1, // 结束前多少分钟开始自动补款（提前设大一点，关机也不怕）
    gxAuction: true, // 角色页显示拍卖底价 / 数量 / 我的出价
    gxTempleCount: true, // 角色页显示各级圣殿数量
    gxMyTemple: true, // 角色页高亮自己的圣殿
    gxPinMyTemple: true, // 自己的圣殿置顶
    gxTempleSize: 'm', // 圣殿尺寸 s / m / l
    gxBidAmount: 1, // 竞拍默认数量
    gxBidWarn: false, // 竞拍数量低于已拍数量时二次确认
    gxHideBonus: true, // 股息高于低保时隐藏超展开首页签到
    gxHideGrail: false, // 个人主页隐藏小圣杯
    gxTopWeek: true, // 萌王榜显示综合得分
    gxDedupe: true, // 隐藏旧版角色页里被重复注入的多余交易框
    seamlessLink: true, // 无缝 link 图（关掉恢复小圣杯原版斜切样式）
    templeCols: 4, // 新版个人圣殿页：一行显示几个圣殿（4 / 5 / 6）
    templePins: [],
    templePinOn: true,
    logDays: 7, // 数字 = 近 N 天；'custom' = 用下面两个日期
    logFrom: '', // 自定义起始日 YYYY-MM-DD（含当天 0:00）
    logTo: '', // 自定义结束日 YYYY-MM-DD（含当天 24:00）
    logSort: 'active',
    logTop: 20,
    ledgerView: 'fund',
    panelPos: null,
    fabPos: null,
    fabHidden: false,
    panelOpen: false, // 面板是否打开：iframe 重载后据此自动恢复
    syncMode: 'code', // code = 仅同步码 / url = 自定义 GET·PUT 接口 / gist = GitHub 私密 Gist
    syncUrl: '',
    syncToken: '',
    syncGist: '',
    syncAuto: false,
    syncLast: 0,
    favFolder: 'all',
    favPopFolder: 'all',
  };

  let SAVED = {};
  try {
    SAVED = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {};
  } catch (e) {
    SAVED = {};
  }
  if (!SAVED || typeof SAVED !== 'object') SAVED = {};
  Object.assign(S, SAVED);
  if (!TABS.includes(S.tab)) S.tab = 'temple';
  if (!Array.isArray(SAVED.sdFroms)) {
    const old = parseCharId(SAVED.sdFrom);
    S.sdFroms = old ? [old] : [];
  }
  delete S.sdFrom;
  if (S.starTarget !== undefined) {
    const oldTarget = Number(S.starTarget);
    S.starAmount = Number.isFinite(oldTarget) && oldTarget > 0 ? Math.min(500, Math.floor(oldTarget)) : 100;
    delete S.starTarget;
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
  }
  if (Number(S.gxBidAmount) === 50) S.gxBidAmount = 1;
  if (!SAVED.mTimesBy || typeof SAVED.mTimesBy !== 'object') {
    const legacy = Math.max(1, Math.min(50, Math.floor(Number(SAVED.mTimes) || 1)));
    S.mTimesBy = { chaos: legacy, guidepost: legacy, fisheye: legacy };
  }
  {
    const by = S.mTimesBy && typeof S.mTimesBy === 'object' ? S.mTimesBy : {};
    S.mTimesBy = {
      chaos: Math.max(1, Math.min(50, Math.floor(Number(by.chaos) || 1))),
      guidepost: Math.max(1, Math.min(50, Math.floor(Number(by.guidepost) || 1))),
      fisheye: Math.max(1, Math.min(50, Math.floor(Number(by.fisheye) || 1))),
    };
  }
  delete S.mTimes;
  if (SAVED.filAssets === undefined) S.filAssets = !SAVED.showAll;
  if (SAVED.filCover === undefined) S.filCover = SAVED.cover === 'default' || SAVED.cover === 'custom';
  if (S.cover !== 'custom') S.cover = 'default';
  if (S.showAll !== undefined) delete S.showAll;

  const persist = () => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(S));
    } catch (e) {}
  };

  const UI_KEY = 'tgtk:ui:v1';
  function readUI() {
    try {
      const live = HWIN.__TGTK_UI__;
      if (live && typeof live === 'object') return live;
    } catch (e) {}
    let raw = '';
    try { raw = HWIN.localStorage.getItem(UI_KEY) || ''; } catch (e) {}
    if (!raw) { try { raw = localStorage.getItem(UI_KEY) || ''; } catch (e) {} }
    let saved = {};
    try { saved = JSON.parse(raw) || {}; } catch (e) { saved = {}; }
    if (!saved || typeof saved !== 'object') saved = {};
    if (saved.open === undefined) saved.open = !!S.panelOpen;
    if (!TABS.includes(saved.tab)) saved.tab = S.tab;
    try { HWIN.__TGTK_UI__ = saved; } catch (e) {}
    return saved;
  }
  function writeUI(patch) {
    const st = Object.assign(readUI(), patch);
    try { HWIN.__TGTK_UI__ = st; } catch (e) {}
    const txt = JSON.stringify(st);
    try { HWIN.localStorage.setItem(UI_KEY, txt); } catch (e) {}
    try { localStorage.setItem(UI_KEY, txt); } catch (e) {}
    return st;
  }

  const UI_SYNC_MSG = 'tgtk:ui:sync';
  function applyRemoteOpen(open) {
    const show = !!open;
    try {
      const st = Object.assign(readUI(), { open: show });
      HWIN.__TGTK_UI__ = st;
    } catch (e) {}
    S.panelOpen = show;
    if (!els || !els.panel) return;
    if (els.panel.hidden === !show) return;
    els.panel.hidden = !show;
    if (show) {
      applyPos(els.panel, 'panelPos');
      clearFavAddAutofill();
    } else {
      hideCharaSuggest();
      hideFavPop();
      hideStarPop();
    }
  }
  function broadcastOpen(open) {
    const msg = { __tgtk_ui: UI_SYNC_MSG, open: !!open, from: HOST_TOKEN };
    try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*'); } catch (e) {}
    try { if (window.opener && !window.opener.closed) window.opener.postMessage(msg, '*'); } catch (e) {}
    try { for (let i = 0; i < window.frames.length; i++) window.frames[i].postMessage(msg, '*'); } catch (e) {}
  }
  const onUISync = (st) => {
    if (st && typeof st.open === 'boolean') applyRemoteOpen(st.open);
  };
  try {
    window.addEventListener('storage', (e) => {
      if (e.key !== UI_KEY || !e.newValue) return;
      try { onUISync(JSON.parse(e.newValue)); } catch (err) {}
    });
  } catch (e) {}
  try {
    window.addEventListener('message', (e) => {
      const d = e.data;
      if (!d || d.__tgtk_ui !== UI_SYNC_MSG || d.from === HOST_TOKEN) return;
      onUISync(d);
    });
  } catch (e) {}

  let busy = false;
  let templeAll = [];
  let holdAll = [];
  let holdAt = 0; // 上次扫完的时间
  const HOLD_TTL = 5 * 60 * 1000; // 5 分钟内直接复用
  const HOLD_RENDER_MAX = 300; // 持股页一次最多渲染多少行（3700 行 DOM 会卡）
  let fantasyRows = [];
  let favRows = [];
  let logAll = [];
  let logWindow = null;
  let magicRunning = false;
  let starRunning = false;
  const starCapCache = Object.create(null); // 角色 → 塔的固资上限（读过一次就记住，用于消耗估算）
  const starAssetCache = Object.create(null); // 角色 → 塔当前的固定资产（同上，估算用）
  let starEstimateRefresh = null; // buildUI 里注入：跑完一轮后重算「预计消耗」
  let sdHold = []; // 星光碎片：自己的全部持仓（候选燃料）
  let sdTargetInfo = null; // 星光碎片：目标塔 { cid, lv, assets, cap }，用于「预计增加固资」
  let sdCacheNote = ''; // 复用了「持股」页缓存时的小提示
  let sdBusy = false;
  let sdRunning = false;
  let icoRows = []; // ICO：我参与的、还在募集的 ICO（按剩余时间排序）
  let icoBusy = false;
  let icoLoaded = false;
  let favNameLoading = false;
  const favNameTried = new Set();
  const nameCache = Object.create(null);
  const totalCache = Object.create(null); // 角色ID -> 总股本（等级进度用）
  const metaTried = new Set(); // 已尝试拉过 meta 的角色ID，避免反复请求
  let snaps = []; // 每日资产快照 [{d:'YYYY-MM-DD', cc, mv}]
  let els = null;

  try {
    const arr = JSON.parse(localStorage.getItem(LS_SNAP) || '[]');
    if (Array.isArray(arr)) {
      snaps = arr
        .filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(String(x.d)))
        .map((x) => ({ d: String(x.d), cc: num0(x.cc), mv: num0(x.mv) }))
        .sort((a, b) => (a.d < b.d ? -1 : 1))
        .slice(-180);
    }
  } catch (e) {}

  const LS_FAV2 = 'tgtk:favs:v2';
  const SYNC_FILE = 'tinygrail-favs.json';
  let favRaw = { v: 2, ts: 0, folders: [], items: [] };
  let folders = []; // [{id,name,parent,at}]
  let favs = [];    // [{id,name,folder,at}]
  let syncTimer = null;
  let syncBusy = false;
  let syncSuppress = false;

  function num0(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  const nowMs = () => Date.now();
  const uid = (p) => p + '_' + nowMs().toString(36) + Math.random().toString(36).slice(2, 6);

  const itemKey = (folder, id) => String(folder || 'root') + ':' + String(id);
  function ensureItemKeys() {
    const seen = new Set();
    favRaw.items.forEach((x, i) => {
      let k = x.key;
      if (!k || String(k).indexOf(':') < 0) k = itemKey(x.folder, x.id);
      if (seen.has(k)) k = k + '#' + i;
      x.key = k;
      seen.add(k);
    });
  }

  function loadFavRaw() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(LS_FAV2) || 'null'); } catch (e) {}
    if (raw && typeof raw === 'object' && (Array.isArray(raw.items) || Array.isArray(raw.folders))) {
      favRaw = {
        v: 2,
        ts: num0(raw.ts),
        folders: (Array.isArray(raw.folders) ? raw.folders : []).filter((f) => f && f.id),
        items: (Array.isArray(raw.items) ? raw.items : []).filter((x) => x && x.id),
      };
    } else {
      let old = [];
      try { old = JSON.parse(localStorage.getItem(LS_FAV) || '[]'); } catch (e) {}
      favRaw = {
        v: 2,
        ts: 0,
        folders: [{ id: 'root', name: '默认收藏夹', parent: '', at: 0 }],
        items: (Array.isArray(old) ? old : [])
          .map((x) => (typeof x === 'number' || typeof x === 'string' ? { id: String(x), at: 0 } : x))
          .filter((x) => x && /^\d+$/.test(String(x.id)))
          .map((x) => ({ id: String(x.id), name: x.name || '', folder: 'root', at: num0(x.at) })),
      };
    }
    ensureItemKeys();
    normalizeFav();
    try { localStorage.setItem(LS_FAV2, JSON.stringify(favRaw)); } catch (e) {}
  }

  function normalizeFav() {
    if (!favRaw.folders.some((f) => f.id === 'root' && !f.del)) {
      favRaw.folders.unshift({ id: 'root', name: '默认收藏夹', parent: '', at: 0 });
    }
    folders = favRaw.folders.filter((f) => !f.del && f.id);
    folders.forEach((f) => { if (f.parent) f.parent = ''; });
    const seen = new Set();
    favs = favRaw.items
      .filter((x) => !x.del && /^\d+$/.test(String(x.id)))
      .map((x) => ({
        id: String(x.id),
        name: x.name || '',
        folder: x.folder || 'root',
        at: num0(x.at),
        key: x.key || itemKey(x.folder, x.id),
        src: x.src || '',
      }))
      .filter((x) => {
        if (seen.has(x.key)) return false;
        seen.add(x.key);
        return true;
      });
    const valid = new Set(folders.map((f) => f.id));
    favs.forEach((x) => { if (!valid.has(x.folder)) x.folder = 'root'; });
  }

  function saveFavs() {
    try {
      favRaw.ts = nowMs();
      localStorage.setItem(LS_FAV2, JSON.stringify(favRaw));
    } catch (e) {}
    scheduleSync();
  }

  function upsertRaw(kind, obj) {
    const arr = favRaw[kind];
    if (kind === 'items') {
      obj = { ...obj, key: obj.key || itemKey(obj.folder, obj.id) };
      const i = arr.findIndex((x) => (x.key || itemKey(x.folder, x.id)) === obj.key);
      if (i >= 0) arr[i] = obj;
      else arr.push(obj);
      return;
    }
    const i = arr.findIndex((x) => String(x.id) === String(obj.id));
    if (i >= 0) arr[i] = obj;
    else arr.push(obj);
  }
  function rawOf(kind, key) {
    if (kind === 'items') return favRaw[kind].find((x) => (x.key || itemKey(x.folder, x.id)) === key);
    return favRaw[kind].find((x) => String(x.id) === String(key));
  }

  function folderPath(id) {
    const f = folders.find((x) => x.id === id);
    return f ? f.name : '';
  }
  function folderTree(id) {
    return [id];
  }
  function folderOptions(withAll, withNone, mark) {
    const out = [];
    if (withAll) out.push(['all', '全部收藏夹']);
    if (withNone) out.push(['none', '未分类']);
    folders.slice().sort((a, b) => num0(a.at) - num0(b.at)).forEach((f) => {
      out.push([f.id, mark ? '▸ ' + f.name : f.name]);
    });
    return out;
  }

  function b64enc(str) {
    const bytes = new TextEncoder().encode(str);
    let out = '';
    for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(out);
  }
  function b64dec(b64) {
    const s = atob(String(b64).replace(/\s+/g, ''));
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function syncPayload(includeCloud) {
    const p = {
      v: 2, app: 'tgtk', ts: nowMs(),
      folders: favRaw.folders, items: favRaw.items,
      pins: pinList(), bots: botList(),
    };
    if (includeCloud) {
      p.sync = {
        mode: S.syncMode || 'code', url: S.syncUrl || '', token: S.syncToken || '',
        gist: S.syncGist || '', auto: !!S.syncAuto,
      };
    }
    return p;
  }
  function exportSyncCode(includeCloud) {
    return 'TG2.' + b64enc(JSON.stringify(syncPayload(includeCloud)));
  }
  function parseSyncCode(text) {
    const t = String(text || '').trim().replace(/^TG2\./i, '').replace(/\s+/g, '');
    if (!t) throw new Error('同步码是空的');
    return JSON.parse(b64dec(t));
  }

  function mergeOne(kind, incoming) {
    let n = 0;
    (Array.isArray(incoming) ? incoming : []).forEach((item) => {
      if (!item || !item.id) return;
      const key = kind === 'items'
        ? (item.key || itemKey(item.folder, item.id))
        : String(item.id);
      const cur = rawOf(kind, key);
      if (!cur && item.del) return;
      if (!cur || num0(item.at) > num0(cur.at)) {
        upsertRaw(kind, item);
        if (!item.del) n++;
      }
    });
    return n;
  }
  function mergeFavData(data) {
    if (!data || typeof data !== 'object') return { items: 0, folders: 0 };
    const src = Array.isArray(data) ? data : Array.isArray(data.favs) ? data.favs : [];
    const rItems = (Array.isArray(data.items) ? data.items : src)
      .map((x) => (typeof x === 'number' || typeof x === 'string' ? { id: String(x), at: 0 } : x))
      .filter((x) => x && /^\d+$/.test(String(x.id)))
      .map((x) => ({ ...x, id: String(x.id), folder: x.folder || 'root', at: num0(x.at) }));
    const a = mergeOne('folders', Array.isArray(data.folders) ? data.folders : []);
    const b = mergeOne('items', rItems);
    normalizeFav();
    return { items: b, folders: a };
  }

  const FAV_ID_KEYS = [
    'CharacterId', 'characterId', 'CharacterID', 'CharaId', 'charaId', 'cid', 'CID',
    'crtId', 'crt_id', 'character_id', 'chara_id', 'Id', 'id', 'ID',
    'RoleId', 'roleId', 'subjectId', 'subject_id',
  ];
  const FAV_LIST_KEYS = [
    'characters', 'Characters', 'items', 'Items', 'list', 'List', 'favorites', 'Favorites',
    'favs', 'Favs', 'chars', 'Chara', 'ids', 'Ids', 'data', 'Data', 'Value', 'value',
    'children', 'records', 'Records',
  ];
  const FAV_NAME_KEYS = ['Name', 'name', 'NickName', 'Nickname', 'nickname', 'title', 'Title', 'label'];
  const FAV_FOLDER_KEYS = ['folderName', 'groupName', 'name', 'Name', 'title', 'Title', 'label', 'Label'];

  function favId(v) {
    if (typeof v === 'number' || typeof v === 'string') {
      const s = String(v).trim();
      return /^[1-9]\d{0,9}$/.test(s) ? s : '';
    }
    if (!v || typeof v !== 'object') return '';
    for (let i = 0; i < FAV_ID_KEYS.length; i++) {
      const s = String(v[FAV_ID_KEYS[i]] == null ? '' : v[FAV_ID_KEYS[i]]).trim();
      if (/^[1-9]\d{0,9}$/.test(s)) return s;
    }
    const nest = ['Character', 'character', 'Chara', 'chara', 'Role', 'role'];
    for (let i = 0; i < nest.length; i++) {
      if (v[nest[i]] && typeof v[nest[i]] === 'object') {
        const s = favId(v[nest[i]]);
        if (s) return s;
      }
    }
    return '';
  }
  function favStr(v, keys) {
    if (!v || typeof v !== 'object') return '';
    for (let i = 0; i < keys.length; i++) {
      const s = v[keys[i]];
      if (typeof s === 'string' && s.trim()) return s.trim();
    }
    return '';
  }
  function favMapIds(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    const ks = Object.keys(o);
    return ks.length && ks.every((k) => /^[1-9]\d{0,9}$/.test(k)) ? ks : null;
  }
  function favListOf(v) {
    if (Array.isArray(v)) return v;
    if (!v || typeof v !== 'object') return null;
    for (let i = 0; i < FAV_LIST_KEYS.length; i++) {
      const x = v[FAV_LIST_KEYS[i]];
      if (Array.isArray(x)) return x;
      const ids = favMapIds(x); // { "12345": true, "67890": true }
      if (ids) return ids;
    }
    return favMapIds(v);
  }
  const favFolderOf = (v) => favStr(v, FAV_FOLDER_KEYS);
  const favLooksFolder = (v) => !!(v && typeof v === 'object' && !Array.isArray(v) && favListOf(v) && favFolderOf(v));

  function favParseText(text) {
    const out = [];
    let folder = '';
    String(text || '').split(/\r?\n/).forEach((line) => {
      const s = line.trim();
      if (!s) return;
      const ids = s.match(/\d{2,9}/g) || [];
      if (!ids.length) { folder = s.replace(/[:：]$/, '').slice(0, 40); return; }
      ids.forEach((id) => out.push({ id, name: '', folder }));
    });
    return out;
  }

  function favParse(value) {
    const out = [];
    const seen = new Set();
    const push = (id, name, folder) => {
      id = String(id || '').trim();
      folder = String(folder || '').trim().slice(0, 40);
      if (!/^[1-9]\d{0,9}$/.test(id)) return; // 0 / 负数 / 超长都不是角色 ID
      const k = folder + ':' + id;
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ id, name: String(name || '').slice(0, 60), folder });
    };
    const scanList = (arr, folder, depth) => {
      if (!Array.isArray(arr) || depth > 3) return;
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i];
        if (it == null) continue;
        if (Array.isArray(it)) { scanList(it, folder, depth + 1); continue; }
        const id = favId(it);
        if (id) { push(id, typeof it === 'object' ? favStr(it, FAV_NAME_KEYS) : '', folder); continue; }
        if (typeof it === 'object') {
          const sub = favListOf(it);
          if (sub) scanList(sub, folder, depth + 1);
        }
      }
    };
    const scanFolderObj = (f) => {
      const nm = favFolderOf(f) || '';
      const list = favListOf(f);
      if (list) scanList(list, nm, 0);
    };

    let root = value;
    if (root && typeof root === 'object' && !Array.isArray(root)) {
      const wraps = ['Value', 'value', 'Data', 'data', 'favorites', 'Favorites', 'result', 'Result'];
      for (let i = 0; i < wraps.length; i++) {
        const v = root[wraps[i]];
        if (v && typeof v === 'object' && v !== root) { root = v; break; }
      }
    }
    if (typeof root === 'string') return favParseText(root);
    if (Array.isArray(root)) {
      if (root.some(favLooksFolder)) root.forEach(scanFolderObj);
      else scanList(root, '', 0);
      return out;
    }
    if (!root || typeof root !== 'object') return out;

    const fa = Array.isArray(root.folders) ? root.folders : Array.isArray(root.Folders) ? root.Folders : null;
    if (fa) {
      const names = new Map();
      fa.forEach((f) => {
        if (f && typeof f === 'object') {
          const fid = String(f.id == null ? f.Id == null ? '' : f.Id : f.id);
          const nm = favFolderOf(f);
          if (fid && nm) names.set(fid, nm);
          scanFolderObj(f);
        }
      });
      const ia = Array.isArray(root.items) ? root.items : Array.isArray(root.Items) ? root.Items : null;
      if (ia) {
        ia.forEach((it) => {
          const id = favId(it);
          if (!id) return;
          let f = '';
          if (it && typeof it === 'object') {
            f = String(it.folder || it.folderName || it.group || it.folderId || it.groupId || '');
            if (names.has(f)) f = names.get(f);
            if (/^\d+$/.test(f)) f = ''; // 夹 id 不是夹名
          }
          push(id, typeof it === 'object' ? favStr(it, FAV_NAME_KEYS) : '', f);
        });
      }
      return out;
    }

    Object.keys(root).forEach((k) => {
      const v = root[k];
      if (v == null) return;
      const nm = /^\d+$/.test(k) ? '' : k;
      if (Array.isArray(v)) { scanList(v, nm, 0); return; }
      if (typeof v === 'object') {
        const list = favListOf(v);
        if (list) { scanList(list, favFolderOf(v) || nm, 0); return; }
        const id = favId(v);
        if (id) { push(id, favStr(v, FAV_NAME_KEYS), nm); return; }
        const ks = Object.keys(v);
        if (ks.length && ks.every((x) => /^\d+$/.test(x))) ks.forEach((x) => push(x, typeof v[x] === 'string' ? v[x] : '', nm));
        return;
      }
      const id = favId(v);
      if (id) { push(id, '', nm); return; }
      if (/^[1-9]\d{0,9}$/.test(k)) {
        const fn = typeof v === 'string' && !/^\d+$/.test(v.trim()) ? v.trim() : '';
        push(k, fn ? '' : (typeof v === 'string' ? v : ''), fn);
        return;
      }
      if (typeof v === 'string' && /^[\d\s,，、;；]+$/.test(v)) {
        (v.match(/\d{1,9}/g) || []).forEach((x) => push(x, '', nm));
      }
    });
    return out;
  }

  function favScanLocal() {
    const found = [];
    const seen = new Set();
    const PRIMARY = /^tinygrail:(favorites|favorite|favs|collections|collection)(:v?\d+)?$/i;
    const LOOSE = /fav|收藏|collect|star|book|like|mark|关注|分组|夹|wish|folder/i;
    let primaryHit = false;
    for (const d of allDocs()) {
      let ls = null;
      try { ls = d.defaultView && d.defaultView.localStorage; } catch (e) { continue; }
      if (!ls) continue;
      let keys = [];
      try { keys = Object.keys(ls); } catch (e) {}
      if (!keys.length) {
        try {
          for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k) keys.push(k); }
        } catch (e) {}
      }
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (seen.has(k) || /^tgtk:/.test(k)) continue;
        const primary = PRIMARY.test(k);
        if (!primary && !LOOSE.test(k)) continue;
        seen.add(k);
        let raw = '';
        try { raw = ls.getItem(k) || ''; } catch (e) { continue; }
        if (!raw || raw.length > 400000) continue;
        let val = null;
        let parsed = false;
        try { val = JSON.parse(raw); parsed = true; } catch (e) {}
        const entries = parsed ? favParse(val) : favParseText(raw);
        if (!entries.length) continue;
        if (!primary && !entries.some((e) => e.folder)) continue;
        if (primary) primaryHit = true;
        found.push({ key: k, entries, primary });
      }
    }
    return primaryHit ? found.filter((f) => f.primary) : found;
  }

  function favMerge(entries) {
    const res = { added: 0, folders: 0, dup: 0, renamed: 0, invalid: 0 };
    const now = nowMs();
    const byName = new Map(folders.map((f) => [String(f.name), String(f.id)]));
    const targets = new Map();
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const id = String(e.id || '');
      if (!/^[1-9]\d{0,9}$/.test(id)) continue;
      let fid = 'root';
      const fname = String(e.folder || '').trim().slice(0, 40);
      if (fname && !/^\d+$/.test(fname)) {
        fid = byName.get(fname) || '';
        if (!fid) {
          fid = uid('f');
          favRaw.folders.push({ id: fid, name: fname, parent: '', at: now });
          byName.set(fname, fid);
          res.folders++;
        }
      }
      const key = itemKey(fid, id);
      if (!targets.has(key)) {
        targets.set(key, { id, name: String(e.name || '').slice(0, 60), folder: fid, key });
      }
    }
    const active = new Map();
    favRaw.items.forEach((x) => {
      if (x.del) return;
      const k = x.key || itemKey(x.folder, x.id);
      active.set(k, x);
    });
    favRaw.items.forEach((x) => {
      if (!x.del && String(x.id) === '0') { upsertRaw('items', { ...x, del: true, at: now }); res.invalid++; }
    });
    targets.forEach((t, key) => {
      const cur = active.get(key);
      if (cur) {
        res.dup++;
        if (!cur.name && t.name) { cur.name = t.name; res.renamed++; }
        return;
      }
      favRaw.items.push({ ...t, at: now, src: 'tg' });
      res.added++;
    });
    if (res.added || res.folders || res.invalid || res.renamed) {
      normalizeFav();
      saveFavs();
    }
    return res;
  }

  async function favFilterListed(entries, forceOk) {
    const ids = Array.from(new Set(entries.map((e) => String(e.id))));
    const names = new Map();
    const ok = new Set();
    const blank = (why) => ({ entries, skipped: 0, checked: false, names, ok, bad: [], why });
    if (!ids.length) return blank('empty');
    const protect = new Set();
    if (forceOk && forceOk.size) forceOk.forEach((id) => { if (ids.includes(String(id))) protect.add(String(id)); });
    let networkOk = false;
    let seen = 0;
    let probeOk = 0;
    try {
      for (let i = 0; i < ids.length; i += 50) {
        const arr = await api('chara/list', {
          method: 'POST', body: JSON.stringify(ids.slice(i, i + 50).map(Number)),
        });
        networkOk = true;
        (Array.isArray(arr) ? arr : []).forEach((c) => {
          if (!c) return;
          seen++;
          const id = String(c.Id != null ? c.Id : c.id != null ? c.id : '');
          if (!/^\d+$/.test(id) || ok.has(id)) return;
          if (c.Name) { names.set(id, String(c.Name)); nameCache[id] = String(c.Name); }
          if (num(c.ZeroCount) > 0) { ok.add(id); return; }
          const unlisted = c.End && !num(c.Level) && !c.ListedDate;
          if (!unlisted && (num(c.Level) > 0 || num(c.Current) > 0 || num(c.Total) > 0 || c.Name)) ok.add(id);
        });
      }
    } catch (e) {}
    if (!networkOk) return blank('network');
    const unsure = ids.filter((id) => !ok.has(id));
    if (unsure.length) {
      await mapLimit(unsure, 4, async (id) => {
        try {
          const v = await api('chara/' + id);
          probeOk++;
          if (!v) return;
          if (v.Name) { names.set(id, String(v.Name)); nameCache[id] = String(v.Name); }
          if (num(v.ZeroCount) > 0 || !v.End || num(v.Level) || v.ListedDate) ok.add(id);
        } catch (e) {}
      });
    }
    if (!seen && !probeOk) return blank('network');
    if (!ok.size) return blank('unreliable');
    const alive = (id) => ok.has(id) || protect.has(id);
    const kept = entries.filter((e) => alive(String(e.id)));
    const bad = ids.filter((id) => !alive(id));
    return { entries: kept, skipped: entries.length - kept.length, checked: true, names, ok, bad };
  }

  async function favPruneDelisted() {
    const ids = Array.from(new Set(favs.map((f) => String(f.id))));
    const empty = { checked: false, removed: 0, rows: 0, kept: 0, ids: [], why: 'empty' };
    if (!ids.length) return empty;
    const stWhite = new Set();
    try {
      for (let p = 1; p <= 12; p++) {
        const v = await api(`chara/delist/chara/${p}/100`);
        const items = v && (v.Items || v.items);
        if (!Array.isArray(items) || !items.length) break;
        items.forEach((x) => {
          const id = String((x && (x.Id != null ? x.Id : x.CharacterId)) || '');
          if (/^\d+$/.test(id)) stWhite.add(id);
        });
        if (!v.TotalPages || p >= num(v.TotalPages)) break;
      }
    } catch (e) {}
    const r = await favFilterListed(ids.map((id) => ({ id, name: '', folder: '' })), stWhite);
    if (!r.checked) return { ...empty, why: r.why };
    if (r.bad.length > ids.length / 2) return { ...empty, why: 'tooMany' };
    const bad = new Set(r.bad.map(String));
    if (!bad.size) return { checked: true, removed: 0, rows: 0, kept: r.ok.size, ids: [] };
    const now = nowMs();
    let rows = 0;
    favRaw.items.forEach((x) => {
      if (x.del || !bad.has(String(x.id))) return;
      upsertRaw('items', { ...x, del: true, at: now });
      rows++;
    });
    if (rows) { normalizeFav(); saveFavs(); }
    return { checked: true, removed: bad.size, rows, kept: r.ok.size, ids: Array.from(bad) };
  }

  function cloudConfigured() {
    try {
      if (S.syncMode === 'gist') return !!(S.syncToken && S.syncGist);
      if (S.syncMode === 'url') return !!S.syncUrl;
    } catch (e) {}
    return false;
  }
  async function cloudGet() {
    if (S.syncMode === 'url') {
      const r = await fetch(S.syncUrl, { method: 'GET', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('下载失败 HTTP ' + r.status);
      const txt = await r.text();
      return txt ? JSON.parse(txt) : null;
    }
    if (S.syncMode === 'gist') {
      const r = await fetch('https://api.github.com/gists/' + encodeURIComponent(S.syncGist), {
        headers: { Authorization: 'Bearer ' + S.syncToken, Accept: 'application/vnd.github+json' },
      });
      if (!r.ok) throw new Error('读取 Gist 失败 HTTP ' + r.status + (r.status === 401 ? '（token 无效）' : ''));
      const g = await r.json();
      const f = g.files && g.files[SYNC_FILE];
      if (!f) throw new Error('Gist 里没有 ' + SYNC_FILE);
      const txt = f.truncated ? await (await fetch(f.raw_url)).text() : f.content;
      return JSON.parse(txt);
    }
    throw new Error('还没有配置云同步');
  }
  async function cloudPut(payload) {
    const json = JSON.stringify(payload);
    if (S.syncMode === 'url') {
      const r = await fetch(S.syncUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: json });
      if (!r.ok) throw new Error('上传失败 HTTP ' + r.status);
      return;
    }
    if (S.syncMode === 'gist') {
      const r = await fetch('https://api.github.com/gists/' + encodeURIComponent(S.syncGist), {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer ' + S.syncToken, Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: { [SYNC_FILE]: { content: json } } }),
      });
      if (!r.ok) throw new Error('写入 Gist 失败 HTTP ' + r.status + (r.status === 401 ? '（token 无效）' : ''));
      return;
    }
    throw new Error('还没有配置云同步');
  }
  async function cloudCreateGist(token) {
    const r = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'tinygrail toolkit favorites', public: false,
        files: { [SYNC_FILE]: { content: JSON.stringify(syncPayload(false)) } },
      }),
    });
    if (!r.ok) throw new Error('创建 Gist 失败 HTTP ' + r.status + (r.status === 401 ? '（token 无效或缺少 gist 权限）' : ''));
    const g = await r.json();
    return g.id;
  }
  async function cloudPull(manual) {
    if (syncBusy || !cloudConfigured()) return null;
    syncBusy = true;
    try {
      const data = await cloudGet();
      if (!data) return null;
      syncSuppress = true;
      const m = mergeFavData(data);
      const pm = mergePinList(data && data.pins);
      const bm = mergeBotList(data && data.bots);
      favRaw.ts = nowMs();
      try { localStorage.setItem(LS_FAV2, JSON.stringify(favRaw)); } catch (e) {}
      syncSuppress = false;
      if (els) { renderFavs(); syncFavPick(); refreshStarBadge(); }
      if (pinUiRefresh) pinUiRefresh();
      if (pm.added || bm.added) pinRefreshSnaps();
      if (manual) {
        setSyncStatus(
          (m.folders + m.items ? `已下载并合并：${m.folders} 个文件夹 / ${m.items} 个角色` : '已下载，收藏数据已是最新') +
            (pm.added ? ` · 置顶 +${pm.added}` : '') +
            (bm.added ? ` · 置底 +${bm.added}` : '')
        );
      }
      return m;
    } finally { syncBusy = false; syncSuppress = false; }
  }
  async function cloudPush(manual) {
    if (syncBusy || !cloudConfigured()) return false;
    syncBusy = true;
    try {
      await cloudPut(syncPayload(false));
      S.syncLast = nowMs();
      persist();
      if (manual) setSyncStatus('已上传到云端 · ' + new Date().toLocaleTimeString());
      return true;
    } finally { syncBusy = false; }
  }
  function scheduleSync() {
    if (!S.syncAuto || !cloudConfigured() || syncSuppress) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { cloudPush(false).catch(() => {}); }, 3500);
  }

  loadFavRaw();

  function h(tag, attrs, ...kids) {
    const el = HDOC.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.appendChild(typeof kid === 'string' || typeof kid === 'number' ? HDOC.createTextNode(String(kid)) : kid);
    }
    return el;
  }

  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);  const fmt = (v, d = 0) =>
    num(v).toLocaleString('zh-CN', d ? { minimumFractionDigits: d, maximumFractionDigits: d } : undefined);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function mapLimit(list, limit, fn) {
    let i = 0;
    const n = Math.max(1, Math.min(limit, list.length));
    const workers = new Array(n).fill(0).map(async () => {
      while (i < list.length) {
        const idx = i++;
        await fn(list[idx], idx);
      }
    });
    await Promise.all(workers);
  }

  function frameOffset(win) {
    if (!HOST.outer) return { x: 0, y: 0 };
    let x = 0;
    let y = 0;
    let w = win || window;
    try {
      let guard = 0;
      while (w && w !== HWIN && w.frameElement && guard++ < 6) {
        const r = w.frameElement.getBoundingClientRect();
        x += r.left;
        y += r.top;
        w = w.parent;
      }
    } catch (e) {}
    return { x, y };
  }

  function absRect(el) {
    if (!el) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
    const r = el.getBoundingClientRect();
    const w = (el.ownerDocument && el.ownerDocument.defaultView) || HWIN;
    const o = HOST.outer && w !== HWIN ? frameOffset(w) : { x: 0, y: 0 };
    return {
      left: r.left + o.x, right: r.right + o.x,
      top: r.top + o.y, bottom: r.bottom + o.y,
      width: r.width, height: r.height,
    };
  }

  function clampPos(left, top, w, h) {
    const vw = HWIN.innerWidth || window.innerWidth || 1280;
    const vh = HWIN.innerHeight || window.innerHeight || 800;
    const ww = Math.min(w || 430, vw);
    const hh = Math.min(h || 400, vh);
    return {
      left: Math.max(0, Math.min(Math.max(0, vw - ww), num(left))),
      top: Math.max(0, Math.min(Math.max(0, vh - hh), num(top))),
    };
  }

  function applyPos(el, key) {
    if (!el) return;
    const p = S[key];
    if (!p || !Number.isFinite(Number(p.left)) || !Number.isFinite(Number(p.top))) return;
    const r = el.getBoundingClientRect();
    const w = r.width || (key === 'fabPos' ? 90 : 430);
    const h = r.height || (key === 'fabPos' ? 34 : 400);
    const c = clampPos(p.left, p.top, w, h);
    el.style.left = c.left + 'px';
    el.style.top = c.top + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  }

  function clearPos(el, key) {
    if (!el) return;
    el.style.left = el.style.top = el.style.right = el.style.bottom = '';
    if (key) {
      S[key] = null;
      persist();
      if (key === 'panelPos') writeUI({ left: undefined, top: undefined });
    }
  }

  function makeDraggable(el, handle, opts = {}) {
    if (!el || !handle) return () => {};
    let dragging = false;
    let moved = false;
    let ox = 0;
    let oy = 0;
    let sl = 0;
    let st = 0;
    let sw = 0;
    let sh = 0;

    const evtXY = (e) => {
      const w =
        e.view ||
        (e.currentTarget && e.currentTarget.defaultView) ||
        (e.target && e.target.ownerDocument && e.target.ownerDocument.defaultView) ||
        HWIN;
      const o = HOST.outer && w !== HWIN ? frameOffset(w) : { x: 0, y: 0 };
      return { x: e.clientX + o.x, y: e.clientY + o.y };
    };
    const listen = () => {
      DOCS.forEach((d) => {
        d.addEventListener('pointermove', onMove);
        d.addEventListener('pointerup', onUp);
        d.addEventListener('pointercancel', onUp);
      });
    };
    const unlisten = () => {
      DOCS.forEach((d) => {
        d.removeEventListener('pointermove', onMove);
        d.removeEventListener('pointerup', onUp);
        d.removeEventListener('pointercancel', onUp);
      });
    };

    const reset = () => {
      clearPos(el, opts.key);
      if (opts.onEnd) opts.onEnd(false);
    };

    const onMove = (e) => {
      if (!dragging) return;
      const p = evtXY(e);
      const dx = p.x - ox;
      const dy = p.y - oy;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const c = clampPos(sl + dx, st + dy, sw, sh);
      el.style.left = c.left + 'px';
      el.style.top = c.top + 'px';
      if (opts.onMove) opts.onMove();
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      DOCS.forEach((d) => {
        d.body.style.userSelect = '';
      });
      el.classList.remove('tgtk-dragging');
      unlisten();
      if (opts.key && moved) {
        S[opts.key] = { left: parseFloat(el.style.left) || 0, top: parseFloat(el.style.top) || 0 };
        persist();
        if (opts.key === 'panelPos') writeUI({ left: S.panelPos.left, top: S.panelPos.top });
      }
      el.dataset.tgtkDragged = moved ? '1' : '';
      if (opts.onEnd) opts.onEnd(moved);
      setTimeout(() => {
        el.dataset.tgtkDragged = '';
      }, 0);
    };

    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (opts.ignore && e.target && e.target.closest && e.target.closest(opts.ignore)) return;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      dragging = true;
      moved = false;
      const p = evtXY(e);
      ox = p.x;
      oy = p.y;
      sl = r.left;
      st = r.top;
      sw = r.width;
      sh = r.height;
      el.style.left = sl + 'px';
      el.style.top = st + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.classList.add('tgtk-dragging');
      DOCS.forEach((d) => {
        d.body.style.userSelect = 'none';
      });
      try {
        if (handle.setPointerCapture && e.pointerId !== undefined) handle.setPointerCapture(e.pointerId);
      } catch (err) {}
      listen();
    });
    handle.addEventListener('dblclick', (e) => {
      if (opts.ignore && e.target && e.target.closest && e.target.closest(opts.ignore)) return;
      reset();
    });
    WINS.forEach((w) =>
      w.addEventListener('resize', () => {
        if (!S[opts.key] || dragging) return;
        applyPos(el, opts.key);
      })
    );
    applyPos(el, opts.key);
    return reset;
  }

  const sugCache = new Map();
  const SUG_SHOW_MAX = 16;
  let sugBox = null;
  let sugInput = null;
  let sugItems = [];
  let sugKw = '';
  let sugIndex = -1;
  let sugTimer = 0;
  let sugSeq = 0;
  let sugById = false;
  let sugTempleReady = false;
  let sugLoading = false;

  function fireEl(el, type) {
    const w = (el.ownerDocument && el.ownerDocument.defaultView) || HWIN;
    const Ctor = w.Event || Event;
    el.dispatchEvent(new Ctor(type, { bubbles: true }));
  }

  function hideCharaSuggest() {
    clearTimeout(sugTimer);
    if (sugBox) {
      sugBox.remove();
      sugBox = null;
    }
    sugInput = null;
    sugItems = [];
    sugIndex = -1;
    sugById = false;
    sugTempleReady = false;
    sugLoading = false;
  }

  const charaLvCache = Object.create(null);
  const charaLvTried = new Set();

  function knownLvOf(id) {
    const k = String(id || '');
    if (!/^\d+$/.test(k)) return null;
    if (charaLvCache[k] != null) return charaLvCache[k];
    try {
      if (favLvCache[k] != null) return num(favLvCache[k]);
    } catch (e) {}
    return null;
  }

  function fillSugLevels(seq, inp) {
    if (charaLvTried.size > 600) charaLvTried.clear();
    const todo = [];
    let filled = false;
    sugItems.forEach((it) => {
      if (!it || !/^\d+$/.test(String(it.id))) return;
      const id = String(it.id);
      if (it.lv != null) return;
      const known = knownLvOf(id);
      if (known != null) {
        it.lv = known;
        filled = true;
      } else if (!charaLvTried.has(id) && todo.indexOf(id) < 0) todo.push(id);
    });
    if (!todo.length) {
      if (filled && sugBox && seq === sugSeq && sugInput === inp) renderSug();
      return;
    }
    todo.forEach((id) => charaLvTried.add(id));
    (async () => {
      try {
        for (let i = 0; i < todo.length; i += 50) {
          const arr = await api('chara/list', {
            method: 'POST',
            body: JSON.stringify(todo.slice(i, i + 50).map(Number)),
          });
          (Array.isArray(arr) ? arr : []).forEach((c) => {
            if (c && c.Id != null && c.Level != null) charaLvCache[String(c.Id)] = num(c.Level);
          });
        }
        todo.forEach((id) => {
          if (charaLvCache[id] === undefined) charaLvCache[id] = null;
        });
      } catch (e) {
        todo.forEach((id) => charaLvTried.delete(id));
      }
      if (!sugBox || seq !== sugSeq || sugInput !== inp) return;
      sugItems.forEach((it) => {
        if (it && it.lv == null) {
          const v = knownLvOf(it.id);
          if (v != null) it.lv = v;
        }
      });
      localPoolCache.at = 0; // 让本机角色池重建时带上新等级
      const keep = sugIndex >= 0 && sugItems[sugIndex] ? String(sugItems[sugIndex].id) : '';
      sugItems = rankCharaHits(sugItems, sugKw);
      sugIndex = keep ? sugItems.findIndex((x) => String(x.id) === keep) : -1;
      renderSug();
    })();
  }

  function rankCharaHits(list, kw) {
    const q = String(kw || '').trim().toLowerCase();
    if (!q || !Array.isArray(list) || list.length < 2) return list;
    const score = (it) => {
      const n = String((it && it.name) || '').toLowerCase();
      if (n === q) return 0;
      if (n.indexOf(q) === 0) return 1;
      if (n.indexOf(q) > 0) return 2;
      return 3; // 服务端带回来的相关角色（名字里没这几个字），垫底
    };
    const lvOf = (it) => num(it && (it.lv != null ? it.lv : it.Level)) || 0;
    return list
      .map((it, i) => ({ it, i, s: score(it) }))
      .sort((a, b) => a.s - b.s || lvOf(b.it) - lvOf(a.it) || a.i - b.i)
      .map((x) => x.it);
  }

  function pickCharaCandidate(items, kw, owned) {
    const list = rankCharaHits(items || [], kw);
    if (!list.length) return null;
    const q = String(kw || '').trim().toLowerCase();
    const exact = list.filter((x) => String((x && x.name) || '').toLowerCase() === q);
    const pool = exact.length ? exact : list;
    if (owned && pool.length > 1) {
      const mine = pool.find((x) => owned.has(String(x.id)));
      if (mine) return mine;
    }
    return pool[0] || null;
  }

  let localPoolCache = { at: 0, key: '', out: [] };
  function localCharaPool() {
    const sig = [sdHold.length, holdAll.length, favs.length, Object.keys(nameCache).length,
      Object.keys(pinNames || {}).length].join('/');
    const now = Date.now();
    if (localPoolCache.key === sig && now - localPoolCache.at < 1500) return localPoolCache.out;
    const seen = Object.create(null);
    const out = [];
    const add = (id, name, lv) => {
      const i = String(id || '');
      const n = String(name || '');
      if (!/^\d+$/.test(i) || !n || seen[i]) return;
      seen[i] = 1;
      const L = lv === undefined || lv === null ? knownLvOf(i) : num(lv);
      out.push({ id: i, name: n, lv: L });
    };
    for (const d of allDocs()) {
      try {
        const txt = String((d.body && d.body.textContent) || d.title || '').slice(0, 2000);
        const re = /#\s*(\d{2,9})\s*[-–—]?\s*[「『"“]([^」』"”]{1,60})[」』"”]/g;
        let m;
        while ((m = re.exec(txt))) {
          nameCache[m[1]] = m[2];
          add(m[1], m[2]);
        }
      } catch (e) {}
    }
    const cur = currentCharacterId();
    if (cur) add(cur, nameCache[cur]);
    (sdHold || []).forEach((x) => add(x.CharacterId, x.Name, x.Level != null ? x.Level : x.CharacterLevel));
    (holdAll || []).forEach((x) => add(x.CharacterId, x.Name, x.Level != null ? x.Level : x.CharacterLevel));
    (favs || []).forEach((f) => add(f.id, f.name, favLvCache[String(f.id)]));
    Object.keys(nameCache || {}).forEach((id) => add(id, nameCache[id]));
    try {
      const all = pinAllGet();
      (all || []).forEach((t) => add(t.CharacterId, t.Name || t.CharacterName || pinNameGet(t.CharacterId), t.CharacterLevel != null ? t.CharacterLevel : t.Level));
    } catch (e) {}
    try {
      Object.keys(pinNames || {}).forEach((id) => add(id, pinNames[id]));
    } catch (e) {}
    localPoolCache = { at: now, key: sig, out };
    return out;
  }

  async function searchCharaRemote(key) {
    if (sugCache.has(key)) return sugCache.get(key);
    let out = [];
    try {
      const v = await api('chara/search/character?keyword=' + encodeURIComponent(key));
      const arr = Array.isArray(v) ? v : (v && (v.Items || v.Value || v.Characters)) || [];
      const seen = new Set();
      (arr || []).forEach((x) => {
        const id = String((x && (x.Id || x.CharacterId || x.id)) || '');
        const name = String((x && (x.Name || x.CharacterName || x.name)) || '');
        if (!/^\d+$/.test(id) || !name || seen.has(id)) return;
        seen.add(id);
        const raw = x && (x.Level != null ? x.Level : x.CharacterLevel);
        const lv = raw == null || num(raw) === 0 ? knownLvOf(id) : num(raw);
        out.push({ id, name, lv });
      });
    } catch (e) {}
    sugCache.set(key, out);
    return out;
  }

  async function searchChara(kw) {
    const key = String(kw || '').trim();
    const out = (await searchCharaRemote(key)).slice();
    const seen = new Set(out.map((x) => x.id));
    const k = key.toLowerCase();
    localCharaPool().forEach((x) => {
      if (seen.has(x.id) || !String(x.name).toLowerCase().includes(k)) return;
      seen.add(x.id);
      out.push(x);
    });
    return rankCharaHits(out, key).slice(0, 30);
  }

  const sugIdCache = new Map();
  async function searchCharaByIdPrefix(kw) {
    const prefix = String(kw || '').replace(/^#/, '').trim();
    if (!/^\d+$/.test(prefix)) return [];
    const key = 'id:' + prefix;
    if (sugIdCache.has(key)) return sugIdCache.get(key);

    const seen = new Map();
    const add = (id, name, lv) => {
      const i = String(id || '');
      if (!/^\d+$/.test(i) || !i.startsWith(prefix) || seen.has(i)) return;
      const n = (name && String(name)) || nameCache[i] || '';
      if (!n) return;
      const L = lv === undefined || lv === null ? knownLvOf(i) : num(lv);
      const prev = seen.get(i);
      if (prev) {
        if (prev.lv == null && L != null) prev.lv = L;
        return;
      }
      seen.set(i, { id: i, name: n, lv: L });
    };
    (sdHold || []).forEach((x) => add(x.CharacterId, x.Name, x.Level));
    (holdAll || []).forEach((x) => add(x.CharacterId, x.Name, x.Level));
    (favs || []).forEach((f) => add(f.id, f.name, favLvCache[String(f.id)]));
    Object.keys(nameCache || {}).forEach((id) => add(id, nameCache[id]));

    if (seen.size < 8) {
      try {
        const arr = await searchChara(prefix);
        (arr || []).forEach((x) => add(x.id, x.name, x.lv));
      } catch (e) {}
    }

    if (seen.size < 8 && prefix.length >= 3) {
      const probe = [prefix];
      for (let d = 0; d < 10; d++) probe.push(prefix + d);
      if (prefix.length <= 4) for (let d = 0; d < 100; d++) probe.push(prefix + String(d).padStart(2, '0'));
      const chunks = [];
      for (let i = 0; i < probe.length; i += 50) chunks.push(probe.slice(i, i + 50));
      await Promise.all(
        chunks.map(async (batch) => {
          try {
            const arr = await api('chara/list', {
              method: 'POST',
              body: JSON.stringify(batch.map(Number)),
            });
            (arr || []).forEach((c) => c && add(c.Id, c.Name, c.Level));
          } catch (e) {}
        })
      );
    }

    const out = Array.from(seen.values()).sort((a, b) => Number(a.id) - Number(b.id));
    if (sugIdCache.size > 60) sugIdCache.clear();
    sugIdCache.set(key, out);
    return out;
  }

  function templeSugItems(kw) {
    const all = pinAllGet();
    if (!all) return null;
    const raw = String(kw || '').trim();
    const digits = raw.replace(/^#/, '');
    const q = raw.toLowerCase();
    const byId = /^\d+$/.test(digits);
    const out = [];
    const seen = Object.create(null);
    for (let i = 0; i < all.length; i++) {
      const it = all[i];
      if (!it || it.CharacterId == null) continue;
      const id = String(it.CharacterId);
      if (seen[id]) continue;
      const nm = String(it.Name || it.CharacterName || pinNameGet(id) || '');
      const hit = byId ? id.indexOf(digits) === 0 : !q || nm.toLowerCase().includes(q);
      if (!hit) continue;
      seen[id] = 1;
      out.push({ id, name: nm || '#' + id, lv: num(it.CharacterLevel || it.Level) });
      if (out.length >= 60) break;
    }
    if (byId) return out.sort((a, b) => Number(a.id) - Number(b.id));
    return rankCharaHits(out, q);
  }

  function positionSug() {
    if (!sugBox || !sugInput) return;
    const r = sugInput.getBoundingClientRect();
    if (!r.width || !r.height) {
      hideCharaSuggest();
      return;
    }
    const w = 236;
    const h = sugBox.offsetHeight || 200;
    const vw = HWIN.innerWidth || 1280;
    const vh = HWIN.innerHeight || 800;
    let left;
    let top;
    if (r.right + 8 + w <= vw - 6) {
      left = r.right + 8;
      top = Math.max(6, Math.min(r.top, Math.max(6, vh - h - 6)));
    } else {
      left = Math.max(6, Math.min(r.right - w, vw - w - 6));
      top = r.bottom + 4;
      if (top + h > vh - 6) top = Math.max(6, r.top - h - 4);
    }
    sugBox.style.left = left + 'px';
    sugBox.style.top = top + 'px';
  }

  function renderSug() {
    if (!sugBox) {
      sugBox = h('div', {
        class: 'tgtk-sug',
        'data-theme': S.theme === 'light' ? 'light' : 'dark',
      });
      HDOC.body.appendChild(sugBox);
    }
    sugBox.textContent = '';
    const templeMode = !!(sugInput && sugInput._tgtkSugOpts && sugInput._tgtkSugOpts.temple);
    const owned = templeMode && !sugTempleReady ? pinOwnedSetNow() : null;
    if (sugLoading) {
      sugBox.appendChild(
        h('div', { class: 'tgtk-sugempty' }, '正在读取你的圣殿，只显示你建过塔的角色…')
      );
      positionSug();
      return;
    }
    if (!sugItems.length) {
      sugBox.appendChild(
        h(
          'div',
          { class: 'tgtk-sugempty' },
          templeMode && sugTempleReady
            ? sugById
              ? `你的圣殿里没有 ID 以「${sugKw.replace(/^#/, '')}」开头的角色`
              : `你的圣殿里没有名字含「${sugKw}」的角色`
            : templeMode
              ? '暂时读不到你的圣殿列表，可以直接填完整角色 ID 后点「添加」'
              : sugById
                ? `没有 ID 以「${sugKw.replace(/^#/, '')}」开头的角色，直接点「添加」也可以`
                : `没搜到「${sugKw}」，可以直接填角色 ID`
        )
      );
    } else {
      sugBox.appendChild(
        h(
          'div',
          { class: 'tgtk-sughead' },
          templeMode && sugTempleReady
            ? `你建过塔的角色（${sugItems.length}）`
            : sugById
              ? `ID 以「${sugKw.replace(/^#/, '')}」开头（${sugItems.length}）`
              : `选一个角色填入 ID（${sugItems.length}）`
        )
      );
      sugItems.forEach((it, i) => {
        const noTower = owned && !owned.has(String(it.id));
        const row = h(
          'div',
          {
            class: 'tgtk-sugrow' + (i === sugIndex ? ' tgtk-sugon' : '') + (noTower ? ' tgtk-sugmiss' : ''),
            title: noTower ? '你没有这个角色的圣殿，选它不会生效' : it.name,
          },
          h('span', { class: 'tgtk-sugname' }, it.name),
          noTower ? h('span', { class: 'tgtk-sugtag' }, '无塔') : null,
          h('span', { class: 'tgtk-sugid' }, '#' + it.id + (it.lv != null ? ' · Lv' + it.lv : ''))
        );
        row.addEventListener('mousedown', (e) => e.preventDefault());
        row.addEventListener('click', () => pickSug(i));
        sugBox.appendChild(row);
      });
    }
    positionSug();
  }

  function pickSug(i) {
    if (!sugInput || !sugItems[i]) return;
    const inp = sugInput;
    const it = sugItems[i];
    const opts = inp._tgtkSugOpts || {};
    if (opts.append) {
      const parts = inp.value.trim().split(/[\s,，]+/).filter(Boolean);
      if (parts.length) parts[parts.length - 1] = it.id;
      else parts.push(it.id);
      inp.value = parts.join(' ');
    } else {
      inp.value = it.id;
    }
    try {
      nameCache[it.id] = it.name;
    } catch (e) {}
    hideCharaSuggest();
    inp._tgtkSkipSug = true;
    inp._tgtkPickedAt = Date.now();
    fireEl(inp, 'input');
    fireEl(inp, 'change');
    if (opts.blur) fireEl(inp, 'blur');
    try {
      inp.focus();
    } catch (e) {}
    if (typeof opts.onPick === 'function') opts.onPick(it);
  }

  function attachCharaSuggest(inp, opts) {
    if (!inp) return;
    inp._tgtkSugOpts = opts || {};
    if (!inp.getAttribute('autocomplete')) inp.setAttribute('autocomplete', 'off');
    inp.addEventListener('input', () => {
      const raw = String(inp.value || '').trim();
      const kw = inp._tgtkSugOpts.append ? raw.split(/[\s,，]+/).pop() : raw;
      clearTimeout(sugTimer);
      sugLoading = false;
      sugTempleReady = false;
      if (inp._tgtkSkipSug) {
        inp._tgtkSkipSug = false;
        hideCharaSuggest();
        return;
      }
      if (/@|https?:\/\/|^www\./i.test(kw)) { hideCharaSuggest(); return; }
      sugSeq++;
      const seq = sugSeq;
      const isId = /^#?\d+$/.test(kw);
      const byId = isId && !!inp._tgtkSugOpts.numId && kw.replace(/^#/, '').length >= 2;
      if (!kw || (isId && !byId)) {
        hideCharaSuggest();
        return;
      }
      sugInput = inp;
      sugKw = kw;
      sugById = byId;
      sugTimer = setTimeout(async () => {
        if (inp._tgtkSugOpts.temple) {
          sugTempleReady = false;
          sugLoading = true;
          sugItems = [];
          sugIndex = -1;
          if (!pinAllGet()) {
            renderSug(); // 先给个「正在读取」，别让输入框看起来没反应
            await pinAllLoad().catch(() => null);
            if (seq !== sugSeq || sugInput !== inp) return;
          }
          sugLoading = false;
          const list = templeSugItems(kw);
          if (seq !== sugSeq || sugInput !== inp) return;
          sugTempleReady = !!list;
          sugItems = list ? list.slice(0, SUG_SHOW_MAX) : [];
          sugIndex = -1;
          renderSug();
          return;
        }
        const items = byId ? await searchCharaByIdPrefix(kw) : await searchChara(kw);
        if (seq !== sugSeq || sugInput !== inp) return;
        sugItems = items.slice(0, SUG_SHOW_MAX);
        sugIndex = -1;
        renderSug();
        fillSugLevels(seq, inp);
      }, 260);
    });
    const reopenSug = () => {
      if (!String(inp.value || '').trim()) return;
      if (sugBox && sugInput === inp) return;
      if (inp._tgtkSkipSug) return;
      if (inp._tgtkPickedAt && Date.now() - inp._tgtkPickedAt < 600) return;
      clearTimeout(sugTimer);
      sugTimer = setTimeout(() => {
        try {
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (e) {}
      }, 20);
    };
    inp.addEventListener('focus', reopenSug);
    inp.addEventListener('click', reopenSug);
    if (inp._tgtkSugOpts.temple) {
      const primeTemple = () => {
        if (!pinAllGet()) pinAllLoad().catch(() => {});
      };
      inp.addEventListener('focus', primeTemple);
      inp.addEventListener('click', primeTemple);
    }

    inp.addEventListener('keydown', (e) => {
      if (!sugBox || sugInput !== inp) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        hideCharaSuggest();
        return;
      }
      if (inp._tgtkSugOpts.noKeys || !sugItems.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sugIndex = (sugIndex + 1) % sugItems.length;
        renderSug();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sugIndex = (sugIndex - 1 + sugItems.length) % sugItems.length;
        renderSug();
      } else if (e.key === 'Enter' && sugIndex >= 0 && !inp._tgtkSugOpts.noEnter) {
        e.preventDefault();
        pickSug(sugIndex);
      }
    });
    inp.addEventListener('blur', () => {
      setTimeout(() => {
        const active = inp.ownerDocument.activeElement;
        if (sugBox && !sugBox.contains(active) && sugInput === inp) hideCharaSuggest();
      }, 180);
    });
  }

  const dismissOnOutside = (e) => {
    if (!sugBox) return;
    if (sugBox.contains(e.target)) return;
    if (sugInput && sugInput.contains(e.target)) return;
    hideCharaSuggest();
  };
  function bindDismissHandlers() {
    if (bindDismissHandlers.done) return;
    bindDismissHandlers.done = true;
    DOCS.forEach((d) => d.addEventListener('pointerdown', dismissOnOutside, true));
    WINS.forEach((w) => {
      w.addEventListener('scroll', () => sugBox && positionSug(), true);
      w.addEventListener('resize', () => sugBox && positionSug());
    });
    DOCS.forEach((d) => d.addEventListener('pointerdown', dismissFavOutside, true));
  }

  let favPop = null;
  let favPopBtn = null;

  function hideFavPop() {
    if (favPop) favPop.remove();
    favPop = null;
    favPopBtn = null;
  }

  const favLvCache = Object.create(null);
  const favLvTried = new Set();
  let favLvLoading = false;

  function favEntries() {
    const meta = new Map();
    (favRows || []).forEach((r) => meta.set(String(r.id), r));
    const used = new Set();
    return favs
      .slice()
      .reverse()
      .filter((f) => {
        if (used.has(String(f.id))) return false;
        used.add(String(f.id));
        return true;
      })
      .map((f) => {
        const m = meta.get(String(f.id)) || {};
        return {
          id: String(f.id),
          name: f.name || m.name || '',
          lv: num(m.level) || num(favLvCache[String(f.id)]) || 0,
          folder: f.folder || 'root',
        };
      });
  }

  async function ensureFavLevels(onDone) {
    if (favLvLoading || !favs.length) return;
    const have = new Map((favRows || []).map((r) => [String(r.id), num(r.level)]));
    const missing = favs
      .map((f) => String(f.id))
      .filter((id) => !favLvCache[id] && !favLvTried.has(id) && !have.get(id));
    if (!missing.length) return;
    missing.forEach((id) => favLvTried.add(id));
    favLvLoading = true;
    try {
      for (let i = 0; i < missing.length; i += 50) {
        const arr = await api('chara/list', {
          method: 'POST',
          body: JSON.stringify(missing.slice(i, i + 50).map(Number)),
        });
        (arr || []).forEach((c) => {
          if (!c || !c.Id) return;
          favLvCache[String(c.Id)] = num(c.Level);
          if (c.Level != null) charaLvCache[String(c.Id)] = num(c.Level);
          if (c.Name) nameCache[c.Id] = c.Name;
        });
        if (i + 50 < missing.length) await sleep(120);
      }
    } catch (e) {}
    favLvLoading = false;
    if (onDone) onDone();
  }

  function positionFavPop(pop, btn) {
    const r = btn.getBoundingClientRect();
    const vw = HWIN.innerWidth || 1280;
    const vh = HWIN.innerHeight || 800;
    const space = vw - r.right - 12;
    const side = space >= 176;
    const w = side ? Math.max(176, Math.min(250, Math.floor(space - 8))) : 250;
    pop.style.width = w + 'px';
    const h = pop.offsetHeight || 260;
    let left;
    let top;
    if (side) {
      left = r.right + 8;
      top = Math.max(6, Math.min(r.top, Math.max(6, vh - h - 6)));
    } else {
      left = Math.max(6, Math.min(r.right - w, vw - w - 6));
      top = r.bottom + 6;
      if (top + h > vh - 6) top = Math.max(6, r.top - h - 6);
    }
    left = Math.max(6, Math.min(left, vw - w - 6));
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  function applyFavPick(inp, id, multi) {
    if (multi) {
      const parts = String(inp.value || '')
        .trim()
        .split(/[\s,，、]+/)
        .filter(Boolean);
      if (!parts.includes(id)) parts.push(id);
      inp.value = parts.join(' ');
    } else {
      inp.value = id;
    }
    fireEl(inp, 'input');
    fireEl(inp, 'change');
    fireEl(inp, 'blur');
    try {
      inp.focus();
    } catch (e) {}
  }

  function openFavPop(btn, inp, opts) {
    if (favPop && favPopBtn === btn) {
      hideFavPop();
      return;
    }
    hideFavPop();
    hideCharaSuggest();
    favPopBtn = btn;
    const multi = !!(opts && opts.multi);
    const pop = h('div', { class: 'tgtk-favpop', 'data-theme': S.theme === 'light' ? 'light' : 'dark' });
    favPop = pop;

    const close = h('button', { class: 'tgtk-favclose', type: 'button', title: '关闭' }, '×');
    const done = h('button', { class: 'tgtk-btn tgtk-mini', type: 'button' }, '完成');
    const head = h('div', { class: 'tgtk-favhead' }, h('span', null, `★ 收藏夹 · ${favs.length}`), close);
    const folderSel = h('select', { class: 'tgtk-favfolder', title: '按收藏夹筛选' });
    const fillFolderSel = () => {
      folderSel.textContent = '';
      folderOptions(true, false, true).forEach(([v, t]) => folderSel.appendChild(h('option', { value: v }, t)));
      if (!folderOptions(true, false, true).some(([v]) => v === S.favPopFolder)) S.favPopFolder = 'all';
      folderSel.value = S.favPopFolder || 'all';
    };
    fillFolderSel();
    const search = h('input', { type: 'text', autocomplete: 'off', placeholder: '搜收藏的角色名 / ID' });
    const list = h('div', { class: 'tgtk-favpoplist' });
    const footTxt = h('span', null, multi ? '可连续点多个角色（点一下追加一个）' : '点一下填入左侧输入框');
    const foot = h('div', { class: 'tgtk-favfoot' }, footTxt, done);

    const chosen = new Set(
      multi
        ? String(inp.value || '')
            .trim()
            .split(/[\s,，、]+/)
            .filter(Boolean)
        : []
    );

    const render = () => {
      list.textContent = '';
      const q = String(search.value || '').trim().toLowerCase();
      const fId = S.favPopFolder || 'all';
      const tree = fId === 'all' ? null : folderTree(fId);
      const rows = favEntries().filter(
        (x) =>
          (!q || (x.name && x.name.toLowerCase().includes(q)) || x.id.includes(q)) &&
          (!tree || tree.includes(x.folder))
      );
      if (!favs.length) {
        list.appendChild(h('div', { class: 'tgtk-favempty' }, '收藏夹是空的，去「收藏」页添加角色'));
      } else if (!rows.length) {
        list.appendChild(h('div', { class: 'tgtk-favempty' }, '这个收藏夹里没有匹配的收藏角色'));
      } else {
        const groups = new Map();
        rows.forEach((x) => {
          const k = x.folder || 'root';
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k).push(x);
        });
        const folderOrder = new Map(folderOptions(false, false).map(([id], i) => [id, i]));
        const orderedKeys = [...groups.keys()].sort(
          (a, b) => (folderOrder.has(a) ? folderOrder.get(a) : 9999) - (folderOrder.has(b) ? folderOrder.get(b) : 9999)
        );
        orderedKeys.forEach((fid) => {
          const arr = groups.get(fid);
          if (fId === 'all') {
            list.appendChild(
              h(
                'div',
                { class: 'tgtk-favgrp' },
                h('span', null, folderPath(fid) || '默认收藏夹'),
                h('i', null, `${arr.length} 个角色`)
              )
            );
          }
          arr.forEach((x) => {
            const on = chosen.has(x.id);
            const row = h(
              'div',
              { class: 'tgtk-favrow' + (on ? ' tgtk-on' : ''), 'data-favid': x.id },
              h('span', { class: 'tgtk-favname', title: x.name || '#' + x.id }, x.name || '#' + x.id),
              h('span', { class: 'tgtk-favid' }, '#' + x.id + (x.lv ? ' · Lv' + x.lv : ''))
            );
            row.addEventListener('mousedown', (e) => e.preventDefault());
            row.addEventListener('click', () => {
              applyFavPick(inp, x.id, multi);
              if (!multi) {
                hideFavPop();
                return;
              }
              chosen.add(x.id);
              footTxt.textContent = `已加入 ${chosen.size} 个角色，可继续点`;
              render();
            });
            list.appendChild(row);
          });
        });
      }
      positionFavPop(pop, btn);
    };
    folderSel.addEventListener('change', () => {
      S.favPopFolder = folderSel.value;
      persist();
      render();
    });

    close.addEventListener('click', hideFavPop);
    done.addEventListener('click', hideFavPop);
    search.addEventListener('input', render);
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        hideFavPop();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const first = list.querySelector('.tgtk-favrow');
        if (first) first.click();
      }
    });
    pop.appendChild(head);
    pop.appendChild(folderSel);
    pop.appendChild(search);
    pop.appendChild(list);
    pop.appendChild(foot);
    HDOC.body.appendChild(pop);
    render();
    ensureFavLevels(() => {
      if (favPop === pop) render();
    });
    try {
      search.focus();
    } catch (e) {}
  }

  function favBtn() {
    return h('button', { class: 'tgtk-favbtn', type: 'button', title: '从收藏夹选角色' }, '★');
  }

  function clearBtn(inp, title) {
    const b = h('button', { class: 'tgtk-clearbtn', type: 'button', title: title || '清空输入框' }, '清空');
    b.addEventListener('click', () => {
      inp.value = '';
      try {
        const V = inp.ownerDocument.defaultView || HWIN;
        inp.dispatchEvent(new V.Event('input', { bubbles: true }));
      } catch (e) {}
      try {
        inp.focus();
      } catch (e) {}
    });
    return b;
  }
  function bindFavPicker(btn, inp, opts) {
    if (!btn || !inp) return;
    btn.addEventListener('click', () => openFavPop(btn, inp, opts));
  }

  const dismissFavOutside = (e) => {
    if (starPop) {
      if (starPop.contains(e.target)) return;
      if (starBadge && starBadge.contains(e.target)) return;
      hideStarPop();
    }
    if (histPop && !histPop.contains(e.target) && !(histBtn && histBtn.contains(e.target))) hideHistPop();
    if (!favPop) return;
    if (favPop.contains(e.target)) return;
    if (favPopBtn && favPopBtn.contains(e.target)) return;
    hideFavPop();
  };

  async function api(path, opt = {}) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), Math.max(5000, num(opt.timeout) || 20000));
    try {
      let pending;
      pinApiDepth++;
      try {
        pending = fetch(API + path, {
          ...opt,
          credentials: 'include',
          signal: ctl.signal,
          headers: {
            Accept: 'application/json',
            ...(opt.body ? { 'Content-Type': 'application/json' } : {}),
            ...(opt.headers || {}),
          },
        });
      } finally {
        pinApiDepth--;
      }
      const res = await pending;
      if (!res.ok) {
        if ([401, 403, 404].includes(res.status)) throw new Error('请求失败（HTTP ' + res.status + '），可能未登录小圣杯');
        throw new Error('HTTP ' + res.status);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) throw new Error('未登录小圣杯或会话已过期（接口返回了网页）');
      const data = await res.json();
      if (data.State !== 0) throw new Error(data.Message || '接口返回 State=' + data.State);
      return data.Value;
    } finally {
      clearTimeout(timer);
    }
  }

  function allDocs() {
    const out = [];
    const push = (d) => { if (d && !out.includes(d)) out.push(d); };
    push(HDOC);
    push(document);
    const scan = (w, depth) => {
      if (!w || depth > 4) return;
      let fs;
      try { fs = w.frames; } catch (e) { return; }
      for (let i = 0; i < fs.length; i++) {
        try {
          const f = fs[i];
          push(f.document);
          scan(f, depth + 1);
        } catch (e) {}
      }
      try {
        const ifr = w.document && w.document.querySelectorAll ? w.document.querySelectorAll('iframe') : [];
        for (let i = 0; i < ifr.length; i++) {
          const fd = ifr[i].contentDocument;
          if (!fd) continue;
          push(fd);
          try { scan(fd.defaultView, depth + 1); } catch (e) {}
        }
      } catch (e) {}
    };
    try { scan(HWIN, 0); scan(window, 0); } catch (e) {}
    return out;
  }

  function tgCharaFromTitle(t, strict) {
    const s = String(t || '').slice(0, 500);
    const m = /#\s*(\d{2,9})\s*[-–—]?\s*[「『"“]/.exec(s) || (strict ? null : /#\s*(\d{2,9})/.exec(s));
    if (!m) return '';
    const nm = /[「『"“]([^」』"”]{1,60})[」』"”]/.exec(s);
    if (nm && nm[1]) nameCache[m[1]] = nm[1];
    return m[1];
  }

  function tgNodeVisible(el) {
    let p = el;
    for (let i = 0; p && p.nodeType === 1 && i < 14; i++, p = p.parentElement) {
      try {
        const w = p.ownerDocument && p.ownerDocument.defaultView;
        const cs = w && w.getComputedStyle(p);
        if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
      } catch (e) {}
    }
    return true;
  }

  function currentCharacterId() {
    for (const d of allDocs()) {
      let modals = [];
      try {
        modals = Array.prototype.slice.call(d.querySelectorAll(
          '#tg-modal-body, [id^="tg-modal-body"], #tg-modal, dialog.tinygrail, [id*="character-modal" i]'
        ));
      } catch (e) { continue; }
      for (let i = modals.length - 1; i >= 0; i--) {
        const b = modals[i];
        if (!b || !b.isConnected || !tgNodeVisible(b)) continue;
        const inner = b.querySelector ? b.querySelector(
          '#tg-trade-box-section[data-character-id], #tg-ico-box[data-character-id], ' +
          '#tg-ico-box-init[data-character-id], #tg-character-box[data-character-id]'
        ) : null;
        const titleCid = tgCharaFromTitle(b.textContent, true);
        const innerCid = inner && /^\d+$/.test(String(inner.getAttribute('data-character-id') || ''))
          ? String(inner.getAttribute('data-character-id')) : '';
        const cid = innerCid || titleCid;
        if (cid) return cid;
      }
    }
    for (const d of allDocs()) {
      let href = '';
      try { href = (d.defaultView && d.defaultView.location && d.defaultView.location.href) || ''; } catch (e) {}
      const mu = String(href).match(/\/(?:character|chara)\/(\d+)/i) ||
        String(href).match(/#\/(?:character|chara)\/(\d+)/i) ||
        String(href).match(/[?&#](?:character|chara|id)[=_/]?(\d+)/i);
      if (mu) return mu[1];
    }
    for (const d of allDocs()) {
      let nodes = [];
      try { nodes = d.querySelectorAll('[data-character-id]'); } catch (e) { continue; }
      let stale = '';
      for (const node of nodes) {
        const v = node.getAttribute('data-character-id');
        if (!/^\d+$/.test(v || '')) continue;
        const isBox = /^(tg-trade-box-section|tg-ico-box|tg-ico-box-init|tg-character-box|tg-temple-detail)$/.test(node.id || '');
        if (isBox && tgNodeVisible(node)) return v;
        if (isBox && !stale) stale = v;
      }
      if (stale) return stale;
      for (const node of nodes) {
        const v = node.getAttribute('data-character-id');
        if (/^\d+$/.test(v || '') && tgNodeVisible(node)) return v;
      }
      for (const node of nodes) {
        const v = node.getAttribute('data-character-id');
        if (/^\d+$/.test(v || '')) return v;
      }
      try {
        const gbs = d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox');
        for (const gb of gbs) {
          const cm = String(gb.className || '').match(/(?:^|\s)chara(\d+)(?:\s|$)/);
          if (cm) return cm[1];
          const nm = gb.querySelector('.title .info .name,.info .name,.title .name,.name');
          const mm = nm && String(nm.textContent || '').slice(0, 160).match(/#\s*(\d{2,7})/);
          if (mm) return mm[1];
        }
      } catch (e) {}
      let href = '';
      try { href = (d.defaultView && d.defaultView.location && d.defaultView.location.href) || ''; } catch (e) {}
      let m = String(href).match(/\/(?:character|chara)\/(\d+)/i) || String(href).match(/#\/(?:character|chara)\/(\d+)/i);
      if (m) return m[1];
      m = String(href).match(/[?&#](?:character|chara|id)[=_/]?(\d+)/i);
      if (m) return m[1];
      let onCharaPage = /\/(?:character|chara)\/\d+/i.test(href) || /#\/(?:character|chara)\/\d+/i.test(href);
      if (!onCharaPage) {
        try { onCharaPage = !!d.querySelector('#tg-star-level-icons,#tg-trade-box-header-badges'); } catch (e) {}
      }
      if (!onCharaPage) {
        try {
          for (const gb of d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox')) {
            if (/(?:^|\s)chara(\d+)(?:\s|$)/.test(String(gb.className || ''))) { onCharaPage = true; break; }
          }
        } catch (e) {}
      }
      if (!onCharaPage) continue;
      let link = null;
      try { link = d.querySelector('a[href*="/character/"]'); } catch (e) {}
      if (link) {
        m = String(link.getAttribute('href') || '').match(/\/character\/(\d+)/);
        if (m) return m[1];
      }
      try {
        const box = d.querySelector('[id*="character-box"],[id*="trade-box"],[id*="chara-"],#grailBox,[id^="grailBox"],.grailBox');
        if (box) {
          const mm = String(box.textContent || '').slice(0, 160).match(/#\s*(\d{2,7})/);
          if (mm) return mm[1];
        }
      } catch (e) {}
    }
    return '';
  }

  function guessedUsername() {
    try {
      const raw = localStorage.getItem('tinygrail:user-assets');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.name) return String(obj.name);
      }
    } catch (e) {}
    let a = null;
    for (const d of allDocs()) {
      a = d.querySelector('#badgeUserPanel a[href*="/user/"]');
      if (a) break;
    }
    if (a) {
      const m = (a.getAttribute('href') || '').match(/\/user\/([^/?#]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
    return '';
  }

  async function loadNames(ids, force, opts) {
    const always = !!(opts && opts.always);
    const uniq = [...new Set(ids)].filter(Boolean);
    const todo = uniq.filter(
      (id) => force || !nameCache[id] || (!metaTried.has(String(id)) && totalCache[id] === undefined)
    );
    for (let i = 0; i < todo.length; i += 50) {
      if (!busy && !force && !always) return;
      const batch = todo.slice(i, i + 50);
      batch.forEach((id) => metaTried.add(String(id)));
      try {
        const arr = await api('chara/list', {
          method: 'POST', body: JSON.stringify(batch.map(Number)),
        });
        (arr || []).forEach((c) => {
          nameCache[String(c.Id)] = c.Name;
          if (c.Total !== undefined && c.Total !== null) totalCache[c.Id] = num(c.Total);
          if (c.Level != null) charaLvCache[String(c.Id)] = num(c.Level);
        });
      } catch (e) {}
      await sleep(120);
    }
  }

  const lvFloor = (lv) => Math.round(LV_BASE * Math.pow(LV_RATE, Math.max(0, num(lv) - 1)));

  function levelInfo(lv, total) {
    const l = Math.max(1, Math.floor(num(lv)) || 1);
    const cur = lvFloor(l);
    const next = lvFloor(l + 1);
    const t = num(total);
    const span = Math.max(1, next - cur);
    return {
      lv: l,
      cur,
      next,
      need: Math.max(0, next - t),
      pct: Math.min(1, Math.max(0, (t - cur) / span)),
      stale: t >= next,
    };
  }

  const todayKey = () => {
    const d = new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  };

  function recordSnapshot(cc, mv) {
    const d = todayKey();
    const c = num(cc);
    const m = num(mv);
    if (c <= 0 && m <= 0) return;
    const i = snaps.findIndex((x) => x.d === d);
    const rec = { d, cc: c || (i >= 0 ? snaps[i].cc : 0), mv: m || (i >= 0 ? snaps[i].mv : 0) };
    if (i >= 0) snaps[i] = rec;
    else snaps.push(rec);
    snaps.sort((a, b) => (a.d < b.d ? -1 : 1));
    if (snaps.length > 180) snaps = snaps.slice(-180);
    try {
      localStorage.setItem(LS_SNAP, JSON.stringify(snaps));
    } catch (e) {}
  }

  const charaName = (id) => nameCache[id] || '#' + id;

  function charaLink(id, fallback) {
    const nm = fallback || charaName(id) || '';
    return h(
      'a',
      {
        class: 'tgtk-name',
        href: `https://bgm.tv/character/${id}`,
        target: '_blank',
        rel: 'noopener noreferrer',
        title: nm ? `${nm}（#${id}）` : `#${id}`,
      },
      nm || `#${id}`
    );
  }

  const TEMPLE_MIN_CAP = 500;
  const templeBuilt = (t) => !!t && num(t.Sacrifices) >= TEMPLE_MIN_CAP;
  let templeExcluded = 0; // 本轮扫描里被排除的未建成塔数量

  function dedupe(list) {
    const seen = new Set();
    return list.filter((t) => {
      if (!t || seen.has(t.Id)) return false;
      seen.add(t.Id);
      return true;
    });
  }

  function coverInfo(t) {
    const c = String(t.Cover || '').trim();
    if (!c) return { isDefault: true, cover: '' };
    if (/lain\.bgm\.tv\//i.test(c) || /\/pic\/crt\//i.test(c)) return { isDefault: true, cover: c };
    return { isDefault: false, cover: c };
  }

  async function collectTemples() {
    if (S.source === 'current') {
      const id = currentCharacterId();
      if (!id) throw new Error('没检测到当前角色，请打开角色页，或换用「我的塔 / 角色列表」');
      setTempleStatus('读取角色 #' + id + ' 的塔…');
      return await api('chara/temple/' + id);
    }

    if (S.source === 'user') {
      const u = (S.username || '').trim();
      if (!u) throw new Error('请先填 bgm 用户名');
      const K = encodeURIComponent(u);
      const first = await api(`chara/user/temple/${K}/1/${PAGE_SIZE}`, { timeout: 30000 });
      const out = ((first && first.Items) || []).slice();
      const total = num(first && first.TotalItems) || out.length;
      const pages = Math.max(1, num(first && first.TotalPages) || 1);
      const prog = () => setTempleStatus(`读取 ${u} 的塔 ${out.length} / ${total}…`);
      prog();
      if (pages > 1) {
        const list = [];
        for (let p = 2; p <= pages; p++) list.push(p);
        await mapLimit(list, 5, async (p) => {
          if (!busy) return;
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const v = await api(`chara/user/temple/${K}/${p}/${PAGE_SIZE}`, { timeout: 30000 });
              out.push(...((v && v.Items) || []));
              prog();
              return;
            } catch (e) {
              if (attempt) return; // 这一页实在拿不到就跳过，别让整轮白跑
              await sleep(220);
            }
          }
        });
      }
      return out;
    }

    const ids = (S.chars || '')
      .split(/[\s,，、]+/)
      .map((x) => x.trim())
      .filter((x) => /^\d+$/.test(x));
    if (!ids.length) throw new Error('请填写至少一个角色 ID');

    const out = [];
    for (let i = 0; i < ids.length; i++) {
      if (!busy) break;
      setTempleStatus(`扫描角色 ${i + 1} / ${ids.length}（#${ids[i]}）…`);
      try {
        const arr = await api('chara/temple/' + ids[i]);
        if (Array.isArray(arr)) out.push(...arr);
      } catch (e) {}
      await sleep(180);
    }
    return out;
  }

  async function scanTemples() {
    if (busy) return;
    busy = true;
    setButtonsDisabled(true);
    templeAll = [];
    templeExcluded = 0;
    templeNameTried = Object.create(null);
    els.templeList.textContent = '';
    try {
      const data = await collectTemples();
      const all = dedupe(Array.isArray(data) ? data : []);
      templeAll = all.filter(templeBuilt);
      templeExcluded = all.length - templeAll.length;
      renderTemples();
      if (!templeAll.length) {
        setTempleStatus(templeExcluded
          ? `只找到 ${fmt(templeExcluded)} 座未建成塔（上限 < ${TEMPLE_MIN_CAP}），已全部排除`
          : '没有读到塔（该角色可能还没有人建塔）');
      }
    } catch (err) {
      setTempleStatus('出错：' + (err && err.message ? err.message : err));
    } finally {
      busy = false;
      setButtonsDisabled(false);
    }
  }

  const templeUseAssets = () => S.filAssets !== false;
  const templeUseCover = () => !!S.filCover;

  function templeRows() {
    const key = S.field;
    const useA = templeUseAssets();
    const useC = templeUseCover();
    const rows = templeAll.filter((t) => {
      if (!templeBuilt(t)) return false; // 硬前提：兜一层，别让别处塞进来的未建成塔混进结果
      if (useA && !(num(t[key]) < num(S.threshold))) return false;
      if (useC) {
        const isDef = coverInfo(t).isDefault;
        if (S.cover === 'custom' ? isDef : !isDef) return false;
      }
      return true;
    });
    rows.sort((a, b) => num(a[key]) - num(b[key]));
    return rows;
  }

  const TEMPLE_RENDER_MAX = 300;
  let templeNameTried = Object.create(null);

  function renderTemples() {
    const list = els.templeList;
    list.textContent = '';
    if (!templeAll.length) return;

    const key = S.field;
    const rows = templeRows();
    let under = 0;
    for (let i = 0; i < templeAll.length; i++) {
      if (num(templeAll[i][key]) < num(S.threshold)) under++;
    }
    const useA = templeUseAssets();
    const useC = templeUseCover();
    const coverName = S.cover === 'custom' ? '已换过塔图' : '未换塔图';
    let head = `共 ${templeAll.length} 座塔`;
    if (templeExcluded) head += ` · 已排除 ${fmt(templeExcluded)} 座未建成（上限 < ${TEMPLE_MIN_CAP}）`;
    if (useA && useC) head += ` · 固定资产 < ${num(S.threshold)} ${coverName}：${rows.length} 座`;
    else if (useA) head += ` · 固定资产 < ${num(S.threshold)}：${under} 座`;
    else if (useC) head += ` · ${coverName}：${rows.length} 座`;
    else head += ' · 未勾选筛选条件（全部显示）';
    els.templeStat.textContent = head;

    if (!rows.length) {
      list.appendChild(h('div', { class: 'tgtk-empty' }, '没有符合条件的塔'));
      return;
    }

    const shown = rows.length > TEMPLE_RENDER_MAX ? rows.slice(0, TEMPLE_RENDER_MAX) : rows;
    const frag = HDOC.createDocumentFragment();
    const need = [];
    shown.forEach((t) => {
      const hitRow = num(t[key]) < num(S.threshold);
      const ci = coverInfo(t);
      const cid = String(t.CharacterId || '');
      if (cid && !t.CharacterName && !nameCache[cid] && !templeNameTried[cid]) {
        templeNameTried[cid] = 1;
        need.push(cid);
      }
      frag.appendChild(
        h(
          'div',
          { class: 'tgtk-row' + (hitRow ? ' tgtk-hit' : ''), title: ci.cover ? `塔图：${ci.cover}` : '塔图：未设置' },
          h(
            'div',
            { class: 'tgtk-main' },
            charaLink(t.CharacterId, t.CharacterName),
            h(
              'span',
              { class: 'tgtk-sub' },
              `${t.Nickname || t.Name || '未知'} · 塔Lv${gxTempleLv(t)}` +
                (t.CharacterLevel ? ` · 角色Lv${t.CharacterLevel}` : '') +
                (ci.isDefault ? ' · 默认图' : ' · 已换图')
            )
          ),
          h(
            'div',
            { class: 'tgtk-val', title: `当前 / 上限：${fmt(t.Assets)} / ${fmt(t.Sacrifices)}` },
            h('b', null, fmt(t.Assets)),
            h('span', null, ' / ' + fmt(t.Sacrifices))
          )
        )
      );
    });
    list.appendChild(frag);
    if (shown.length < rows.length) {
      list.appendChild(
        h(
          'div',
          { class: 'tgtk-empty' },
          `只画了前 ${fmt(shown.length)} 座（共 ${fmt(rows.length)} 座）· 用上面的条件缩小范围，或点「复制」导出全部角色 ID`
        )
      );
    }
    if (need.length) {
      loadNames(need, false, { always: true })
        .then(() => {
          if (els && templeAll.length) renderTemples();
        })
        .catch(() => {});
    }
  }

  const SORTS = {
    levelDesc: (a, b) => num(b.Level) - num(a.Level) || num(b.UserAmount) - num(a.UserAmount),
    levelAsc: (a, b) => num(a.Level) - num(b.Level) || num(b.UserAmount) - num(a.UserAmount),
    amountDesc: (a, b) => num(b.UserAmount) - num(a.UserAmount),
    valueDesc: (a, b) => num(b.UserAmount) * num(b.Current) - num(a.UserAmount) * num(a.Current),
  };

  async function fetchAllHoldings(key, opt) {
    const alive = (opt && opt.alive) || (() => true);
    const onProgress = (opt && opt.onProgress) || (() => {});
    const K = encodeURIComponent(key);
    const first = await api(`chara/user/chara/${K}/1/${PAGE_SIZE}`);
    const got = ((first && first.Items) || []).slice();
    const total = num(first && first.TotalItems) || got.length;
    const pages = Math.max(1, num(first && first.TotalPages) || 1);
    onProgress(got.length, total);
    if (pages > 1) {
      const list = [];
      for (let p = 2; p <= pages; p++) list.push(p);
      await mapLimit(list, 5, async (p) => {
        if (!alive()) return;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const v = await api(`chara/user/chara/${K}/${p}/${PAGE_SIZE}`);
            got.push(...((v && v.Items) || []));
            onProgress(got.length, total);
            return;
          } catch (e) {
            if (attempt) return;
            await sleep(250);
          }
        }
      });
    }
    const seen = new Set();
    const items = [];
    for (let i = 0; i < got.length; i++) {
      const it = got[i];
      const id = String((it && it.CharacterId) || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      items.push(it);
    }
    return { items, total };
  }

  async function scanHoldings() {
    if (busy) return;

    if (holdAll.length && nowMs() - holdAt < 60000) {
      renderHoldings();
      if (els) els.holdStat.textContent += ' · 沿用 1 分钟内的扫描（要重读请稍等再点）';
      return;
    }

    busy = true;
    setButtonsDisabled(true);
    holdAll = [];
    els.holdList.textContent = '';

    try {
      const me = guessedUsername();
      let key = me || '';
      try {
        const r = await api('account/recommend');
        if (r && r.Hash) key = r.Hash;
      } catch (e) {
      }
      if (!key) {
        setHoldStatus('读不到登录用户名（未登录小圣杯？），登录后重新扫描');
        return;
      }

      let r = await fetchAllHoldings(key, {
        alive: () => busy,
        onProgress: (n, total) => setHoldStatus(`读取持仓 ${n} / ${total || '?'}…`),
      });
      if (!r.items.length && me && key !== me) {
        r = await fetchAllHoldings(me, {
          alive: () => busy,
          onProgress: (n, total) => setHoldStatus(`读取持仓 ${n} / ${total || '?'}…`),
        });
        if (r.items.length) key = me;
      }
      holdAll = r.items;
      holdAt = nowMs();
      sugCache.clear();
      sugIdCache.clear();
      renderHoldings();

      if (holdAll.length && holdAll.every((x) => num(x.UserAmount) === 0)) {
        setHoldStatus(`持仓 ${holdAll.length} 只，但数量全是 0：可能未登录小圣杯，或浏览器拦截了第三方 cookie`);
      }
    } catch (err) {
      setHoldStatus('出错：' + (err && err.message ? err.message : err));
    } finally {
      busy = false;
      setButtonsDisabled(false);
    }
  }

  function charQueryHit(x, q) {
    if (!q) return true;
    const digits = String(q).replace(/^#/, '');
    if (/^\d+$/.test(digits)) return String(x.CharacterId) === digits;
    return String(x.Name || '')
      .toLowerCase()
      .includes(q);
  }

  function queryTokens(q) {
    return String(q || '')
      .trim()
      .toLowerCase()
      .split(/[\s,，、;；]+/)
      .filter(Boolean);
  }

  function holdRows() {
    const lo = S.lvMin === '' ? -Infinity : num(S.lvMin);
    const hi = S.lvMax === '' ? Infinity : num(S.lvMax);
    const minAmt = S.minAmount === '' ? 0 : num(S.minAmount);
    const sort = SORTS[S.sortBy] || SORTS.levelDesc;
    const toks = queryTokens(S.holdQuery);
    return holdAll
      .filter((x) => {
        if (toks.length) {
          if (!toks.some((t) => charQueryHit(x, t))) return false;
          return true;
        }
        const lv = num(x.Level);
        return lv >= lo && lv <= hi && num(x.UserAmount) >= minAmt;
      })
      .sort(sort);
  }

  function renderHoldings() {
    const list = els.holdList;
    list.textContent = '';
    if (!holdAll.length) {
      setHoldStatus('该用户没有持仓');
      return;
    }
    const rows = holdRows();
    const shown = rows.length > HOLD_RENDER_MAX ? rows.slice(0, HOLD_RENDER_MAX) : rows;
    els.holdStat.textContent =
      `持仓 ${fmt(holdAll.length)} 只 · 符合条件 ${fmt(rows.length)} 只` +
      (shown.length < rows.length ? ` · 只渲染前 ${fmt(HOLD_RENDER_MAX)} 条` : '');

    if (!rows.length) {
      list.appendChild(h('div', { class: 'tgtk-empty' }, '没有符合条件的持股'));
      return;
    }

    const frag = HDOC.createDocumentFragment();
    shown.forEach((x) => {
      const value = num(x.UserAmount) * num(x.Current);
      const total = totalCache[x.CharacterId] || num(x.Total) || 0;
      const li = levelInfo(x.Level, total);
      const kid = [
        charaLink(x.CharacterId, x.Name),
        h(
          'span',
          { class: 'tgtk-sub' },
          `Lv${x.Level ?? 0} · 现价 ₵${fmt(x.Current, num(x.Current) % 1 ? 2 : 0)} · 市值 ₵${fmt(value)}`
        ),
      ];
      if (total > 0) {
        kid.push(
          h(
            'div',
            { class: 'tgtk-lv', title: `总股本 ${fmt(total)} · Lv${li.lv} 门槛 ${fmt(li.cur)} · Lv${li.lv + 1} 门槛 ${fmt(li.next)}` },
            h('span', { class: 'tgtk-lvbar' }, h('i', { style: `width:${Math.round(li.pct * 100)}%` })),
            h(
              'span',
              { class: 'tgtk-lvtxt' },
              li.stale ? `Lv${li.lv + 1} 已过线，等次日刷新` : `距 Lv${li.lv + 1} 还差 ${fmt(li.need)} 股`
            )
          )
        );
      }
      frag.appendChild(
        h(
          'div',
          { class: 'tgtk-row' },
          h('div', { class: 'tgtk-main' }, kid),
          h(
            'div',
            { class: 'tgtk-val', title: '持股数' },
            h('b', null, fmt(x.UserAmount)),
            h('span', null, ' 股')
          )
        )
      );
    });
    if (rows.length > shown.length) {
      frag.appendChild(
        h(
          'div',
          { class: 'tgtk-empty' },
          `还有 ${fmt(rows.length - shown.length)} 只没显示：用「角色」搜名字 / ID，或在等级、最少持股上缩小范围`
        )
      );
    }
    list.appendChild(frag);
  }

  async function queryFantasy() {
    if (busy) return;
    const ids = (S.fchars || '')
      .split(/[\s,，、]+/)
      .map((x) => x.trim())
      .filter((x) => /^\d+$/.test(x));
    if (!ids.length) {
      setFantasyStatus('请填角色 ID（可从角色页自动带入）');
      return;
    }

    busy = true;
    setButtonsDisabled(true);
    fantasyRows = [];
    els.fList.textContent = '';

    try {
      for (let i = 0; i < ids.length; i++) {
        if (!busy) break;
        const id = ids[i];
        setFantasyStatus(`查询 ${i + 1} / ${ids.length}（#${id}）…`);
        try {
          const [hold, chara] = await Promise.all([
            api(`chara/user/${id}/blueleaf/false`),
            api(`chara/${id}`).catch(() => null),
          ]);
          fantasyRows.push({
            id,
            name: (chara && chara.Name) || null,
            amount: num(hold && hold.Amount),
            price: num(hold && hold.Price),
            sacrifices: num(hold && hold.Sacrifices),
            total: num(chara && chara.Total),
            current: num(chara && chara.Current),
          });
          if (chara && chara.Name) nameCache[id] = chara.Name;
        } catch (err) {
          fantasyRows.push({ id, error: err && err.message ? err.message : String(err) });
        }
        renderFantasy();
        if (i < ids.length - 1) await sleep(200);
      }
      setFantasyStatus(`查询完成，共 ${ids.length} 个角色`);
    } finally {
      busy = false;
      setButtonsDisabled(false);
    }
  }

  function renderFantasy() {
    const list = els.fList;
    list.textContent = '';
    if (!fantasyRows.length) return;

    const frag = HDOC.createDocumentFragment();
    fantasyRows.forEach((r) => {
      if (r.error) {
        frag.appendChild(
          h('div', { class: 'tgtk-row' }, h('div', { class: 'tgtk-main' }, charaLink(r.id), h('span', { class: 'tgtk-sub' }, '查询失败：' + r.error)))
        );
        return;
      }
      const pct = r.total > 0 ? (r.amount / r.total) * 100 : 0;
      frag.appendChild(
        h(
          'div',
          { class: 'tgtk-row' },
          h(
            'div',
            { class: 'tgtk-main' },
            charaLink(r.id, r.name),
            h(
              'span',
              { class: 'tgtk-sub' },
              `总股本 ${fmt(r.total)} · 幻想乡价 ₵${fmt(r.price, 2)} · 献祭 ${fmt(r.sacrifices)}`
            )
          ),
          h(
            'div',
            { class: 'tgtk-val', title: `占比 ${pct.toFixed(2)}%` },
            h('b', null, fmt(r.amount)),
            h('span', null, ` 股 · ${pct.toFixed(2)}%`)
          )
        )
      );
    });
    list.appendChild(frag);
  }

  const isFav = (id) => favs.some((f) => String(f.id) === String(id));
  const favItem = (id) => favs.find((f) => String(f.id) === String(id)) || null;
  const favFoldersOf = (id) => favs.filter((f) => String(f.id) === String(id)).map((f) => f.folder);

  function addFav(id, name, folder) {
    id = String(id);
    if (!/^\d+$/.test(id)) return null;
    const fid = folder || 'root';
    const key = itemKey(fid, id);
    const old = rawOf('items', key);
    const obj = {
      ...(old || {}),
      id,
      name: name || (old && old.name) || (favItem(id) && favItem(id).name) || nameCache[id] || '',
      folder: fid,
      key,
      at: nowMs(),
    };
    delete obj.del;
    if (!old) obj.src = '';
    upsertRaw('items', obj);
    normalizeFav();
    saveFavs();
    refreshStarBadge();
    return obj;
  }
  function favSetNames(map) {
    let changed = false;
    favRaw.items.forEach((x) => {
      if (!x || x.del) return;
      const nm = map[String(x.id)];
      if (!nm || x.name === nm) return;
      x.name = nm;
      changed = true;
    });
    if (changed) {
      normalizeFav();
      saveFavs();
    }
  }
  function favSetName(id, name) {
    const nm = String(name || '').trim();
    if (!nm) return;
    favSetNames({ [String(id)]: nm });
  }
  function removeFavKey(key) {
    const old = rawOf('items', key);
    if (!old) return false;
    upsertRaw('items', { ...old, key, del: true, at: nowMs() });
    normalizeFav();
    saveFavs();
    refreshStarBadge();
    return true;
  }
  function removeFav(id) {
    id = String(id);
    const keys = favs.filter((f) => String(f.id) === id).map((f) => f.key);
    if (!keys.length) return false;
    keys.forEach(removeFavKey);
    return true;
  }
  function toggleFav(id, name, folder) {
    id = String(id);
    if (!/^\d+$/.test(id)) return false;
    if (isFav(id)) { removeFav(id); return false; }
    addFav(id, name, folder);
    return true;
  }
  function moveFav(key, folder) {
    const it = favs.find((f) => f.key === key);
    if (!it) return;
    const fid = folder || 'root';
    if (fid === it.folder) return;
    const nk = itemKey(fid, it.id);
    removeFavKey(key);
    if (!rawOf('items', nk) || rawOf('items', nk).del) {
      upsertRaw('items', {
        id: it.id, name: it.name, folder: fid, key: nk, src: it.src || '', at: nowMs(),
      });
      normalizeFav();
      saveFavs();
    }
  }
  function addFolder(name) {
    const f = {
      id: uid('f'), name: String(name || '').trim() || '新收藏夹',
      parent: '', at: nowMs(),
    };
    upsertRaw('folders', f);
    normalizeFav();
    saveFavs();
    return f;
  }
  function renameFolder(id, name) {
    const f = folders.find((x) => x.id === id);
    if (!f) return;
    upsertRaw('folders', { ...f, name: String(name || '').trim() || f.name, at: nowMs() });
    normalizeFav();
    saveFavs();
  }
  function deleteFolder(id) {
    if (!id || id === 'root') return false;
    const tree = folderTree(id);
    tree.forEach((fid) => {
      const f = folders.find((x) => x.id === fid) || { id: fid };
      upsertRaw('folders', { ...f, del: true, at: nowMs() });
    });
    favs.forEach((x) => {
      if (tree.includes(x.folder)) removeFavKey(x.key);
    });
    normalizeFav();
    saveFavs();
    return true;
  }

  function clearFolderItems(fid) {
    const list = favs.filter((f) => f.folder === fid);
    list.forEach((f) => {
      const old = rawOf('items', f.key);
      if (old) upsertRaw('items', { ...old, key: f.key, del: true, at: nowMs() });
    });
    normalizeFav();
    saveFavs();
    refreshStarBadge();
    return list.length;
  }

  async function refreshFavs() {
    if (busy) return;

    if (!favs.length) {
      favRows = [];
      els.favList.textContent = '';
      setFavStatus('还没有收藏。打开角色页后点上面的「★ 收藏当前角色」');
      syncFavPick();
      return;
    }

    busy = true;
    setButtonsDisabled(true);
    favRows = [];
    els.favList.textContent = '';

    const me = guessedUsername();
    try {
      const ids = Array.from(new Set(favs.map((f) => f.id)));
      const info = Object.create(null);
      for (let i = 0; i < ids.length; i += 50) {
        if (!busy) break;
        setFavStatus(`读取角色信息 ${Math.min(i + 50, ids.length)} / ${ids.length}…`);
        try {
          const arr = await api('chara/list', {
            method: 'POST',
            body: JSON.stringify(ids.slice(i, i + 50).map(Number)),
          });
          const got = Object.create(null);
          (arr || []).forEach((c) => {
            info[c.Id] = c;
            if (c.Name) { nameCache[c.Id] = c.Name; got[c.Id] = c.Name; }
          });
          favSetNames(got);
        } catch (e) {}
        await sleep(120);
      }

      const rows = new Array(ids.length);
      let done = 0;
      await mapLimit(ids, 3, async (id, i) => {
        if (!busy) return;
        const c = info[id] || {};
        const [mine, valhalla, temple] = await Promise.all([
          me ? api(`chara/user/${id}/${encodeURIComponent(me)}/false`).catch(() => null) : Promise.resolve(null),
          api(`chara/user/${id}/${VALHALLA_USER}/false`).catch(() => null),
          me
            ? api(`chara/user/temple/${encodeURIComponent(me)}/1/100?keyword=${id}`).catch(() => null)
            : Promise.resolve(null),
        ]);
        const own = temple ? ((temple.Items || []).find((x) => String(x.CharacterId) === String(id)) || null) : null;

        const meta = favs.find((f) => f.id === id) || {};
        rows[i] = {
          id,
          at: meta.at || 0,
          name: c.Name || meta.name || nameCache[id] || '',
          level: num(c.Level),
          current: num(c.Current),
          total: num(c.Total),
          sacrifices: num(c.Sacrifices),
          fixed: own ? num(own.Assets) : null,
          fixedMax: own ? num(own.Sacrifices) : null,
          mine: mine ? num(mine.Amount) : null,
          valhalla: valhalla ? num(valhalla.Amount) : null,
        };
        done++;
        favRows = rows.filter(Boolean);
        renderFavs();
        setFavStatus(`读取持股与英灵殿 ${done} / ${ids.length}…`);
      });

      const filled = rows.filter(Boolean);
      const noMine = filled.length && filled.every((r) => r.mine === null);
      setFavStatus(
        favCountText() +
          (noMine ? ' · 读不到持股数（未识别到登录名，可先打开一次小圣杯）' : '') +
          (me ? '' : ' · 提示：登录后可显示你的持股数')
      );
    } catch (err) {
      setFavStatus('出错：' + (err && err.message ? err.message : err));
    } finally {
      busy = false;
      setButtonsDisabled(false);
      syncFavPick();
    }
  }

  async function refreshOneFav(id) {
    id = String(id);
    const me = guessedUsername();
    try {
      const [info, mine, valhalla, temple] = await Promise.all([
        api('chara/list', { method: 'POST', body: JSON.stringify([Number(id)]) }).catch(() => null),
        me ? api(`chara/user/${id}/${encodeURIComponent(me)}/false`).catch(() => null) : Promise.resolve(null),
        api(`chara/user/${id}/${VALHALLA_USER}/false`).catch(() => null),
        me
          ? api(`chara/user/temple/${encodeURIComponent(me)}/1/100?keyword=${id}`).catch(() => null)
          : Promise.resolve(null),
      ]);
      let c = (info || []).find((x) => x && String(x.Id) === id) || {};
      if (!c.Name) {
        const one = await api('chara/' + encodeURIComponent(id)).catch(() => null);
        if (one && one.Name) c = one;
      }
      if (c.Name) nameCache[id] = c.Name;
      if (c.Name) favSetName(id, c.Name);
      const own = temple ? ((temple.Items || []).find((x) => String(x.CharacterId) === id) || null) : null;
      const meta = favs.find((f) => String(f.id) === id) || {};
      const row = {
        id,
        at: meta.at || nowMs(),
        name: c.Name || meta.name || nameCache[id] || '',
        level: num(c.Level),
        current: num(c.Current),
        total: num(c.Total),
        sacrifices: num(c.Sacrifices),
        fixed: own ? num(own.Assets) : null,
        fixedMax: own ? num(own.Sacrifices) : null,
        mine: mine ? num(mine.Amount) : null,
        valhalla: valhalla ? num(valhalla.Amount) : null,
      };
      const i = favRows.findIndex((x) => String(x.id) === id);
      if (i >= 0) favRows[i] = { ...favRows[i], ...row };
      else favRows = favRows.concat(row);
      if (els) {
        renderFavs();
        setFavStatus(favCountText());
      }
    } catch (e) {
      setFavStatus(favCountText() + ' · 这个角色的数据没读全，可点「刷新全部」再试');
    }
  }

  function favCountText() {
    const fid = S.favFolder || 'all';
    if (fid === 'all') {
      const uniq = new Set(favs.map((f) => String(f.id))).size;
      return `共 ${uniq} 个收藏`;
    }
    const n = favs.filter((f) => f.folder === fid).length;
    return `共 ${n} 个收藏` + ` · 「${folderPath(fid) || '默认收藏夹'}」`;
  }

  function favCmp(ra, rb, aa, ab) {
    const A = ra || {}, B = rb || {};
    if (S.favSort === 'mine') return (B.mine || 0) - (A.mine || 0);
    if (S.favSort === 'sacrifices') return (B.fixed || 0) - (A.fixed || 0);
    if (S.favSort === 'valhalla') return (B.valhalla || 0) - (A.valhalla || 0);
    if (S.favSort === 'price') return (B.current || 0) - (A.current || 0);
    return (num0(ab) || num0(B.at) || 0) - (num0(aa) || num0(A.at) || 0);
  }

  function favRowsSorted() {
    const rows = favRows.slice();
    rows.sort((a, b) => favCmp(a, b, a.at, b.at));
    return rows;
  }

  let movePop = null;
  let movePopBound = false;

  function hideMovePop() {
    if (movePop) movePop.remove();
    movePop = null;
    if (movePopBound) {
      DOCS.forEach((d) => d.removeEventListener('pointerdown', moveOutside, true));
      WINS.forEach((w) => w.removeEventListener('scroll', hideMovePop, true));
      movePopBound = false;
    }
  }
  const moveOutside = (e) => {
    if (!movePop) return;
    if (movePop.contains(e.target)) return;
    if (movePop._anchor && movePop._anchor.contains(e.target)) return;
    hideMovePop();
  };

  function openMovePop(anchor, opt) {
    if (movePop && movePop._anchor === anchor) {
      hideMovePop();
      return;
    }
    hideMovePop();
    const { id, charName = '', key, folder, mode = 'move' } = opt || {};
    const add = mode === 'add';
    const have = new Set(favFoldersOf(id));
    const cands = folderOptions(false, false).filter(([fid]) => !have.has(fid));
    const pop = h('div', { class: 'tgtk-movepop', 'data-theme': S.theme === 'light' ? 'light' : 'dark' });
    pop.appendChild(
      h(
        'div',
        { class: 'tgtk-movehead' },
        add ? '再收藏到' : `把「${folderPath(folder) || '默认收藏夹'}」的这条移到`
      )
    );
    if (!cands.length) {
      pop.appendChild(
        h('div', { class: 'tgtk-moveempty' }, add ? '所有收藏夹里都有它了' : '没有别的收藏夹可移入了')
      );
    } else {
      const box = h('div', { class: 'tgtk-movelist' });
      cands.forEach(([fid, name]) => {
        box.appendChild(
          h(
            'button',
            {
              class: 'tgtk-moverow',
              type: 'button',
              title: add ? `收藏到「${name}」` : `移到「${name}」`,
              onclick: () => {
                hideMovePop();
                if (add) {
                  addFav(id, charName, fid);
                  if (!favRows.some((x) => String(x.id) === String(id))) refreshOneFav(id);
                  panelToast(`已收藏到「${name}」`);
                } else {
                  moveFav(key, fid);
                  panelToast(`已移到「${name}」`);
                }
                renderFavs();
                syncFavPick();
                setFavStatus(favCountText());
              },
            },
            name
          )
        );
      });
      pop.appendChild(box);
    }
    pop._anchor = anchor;
    HDOC.body.appendChild(pop);
    movePop = pop;
    const r = anchor.getBoundingClientRect();
    const w = pop.offsetWidth || 186;
    const hh = pop.offsetHeight || 150;
    const vw = HWIN.innerWidth || 1280;
    const vh = HWIN.innerHeight || 800;
    const below = vh - r.bottom - 6;
    const above = r.top - 6;
    const top = below >= hh + 4 || above <= below ? r.bottom + 4 : Math.max(6, r.top - hh - 4);
    pop.style.left = Math.max(6, Math.min(r.left, vw - w - 6)) + 'px';
    pop.style.top = top + 'px';
    if (!movePopBound) {
      movePopBound = true;
      DOCS.forEach((d) => d.addEventListener('pointerdown', moveOutside, true));
      WINS.forEach((w2) => w2.addEventListener('scroll', hideMovePop, true));
    }
  }

  const favNameAt = Object.create(null); // 名字自动补拉过的 id → 时间戳（2 分钟内不重复拉）

  function renderFavs() {
    const list = els.favList;
    list.textContent = '';
    const fid = S.favFolder || 'all';
    const tree = fid === 'all' ? null : folderTree(fid);
    const byId = new Map(favRows.map((x) => [String(x.id), x]));
    const stub = (f) =>
      byId.get(String(f.id)) || {
        id: f.id, name: f.name || nameCache[f.id] || '', at: f.at,
        level: 0, current: 0, total: 0,
        mine: null, fixed: null, fixedMax: null, valhalla: null,
      };
    const inView = favs.filter((f) => !tree || tree.includes(f.folder));
    let rows;
    if (fid === 'all') {
      const groups = new Map();
      inView.forEach((f) => {
        const k = String(f.id);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(f);
      });
      rows = Array.from(groups.values()).map((items) => ({
        f: items[items.length - 1],
        r: stub(items[items.length - 1]),
        items,
      }));
    } else {
      rows = inView.map((f) => ({ f, r: stub(f), items: [f] }));
    }
    rows.sort((a, b) => favCmp(a.r, b.r, a.f.at, b.f.at));
    const noName = [];
    const nowName = Date.now();
    rows.forEach(({ r }) => {
      const id = String(r.id);
      if (r.name || nameCache[id]) return;
      const tried = favNameAt[id];
      if (tried && nowName - tried < 120000) return;
      favNameAt[id] = nowName;
      noName.push(id);
    });
    if (noName.length) {
      loadNames(noName, false, { always: true })
        .then(() => {
          const got = Object.create(null);
          noName.forEach((id) => { if (nameCache[id]) got[id] = nameCache[id]; });
          favSetNames(got);
          if (els && els.favList) renderFavs();
        })
        .catch(() => {});
    }
    if (!rows.length) {
      list.appendChild(h('div', { class: 'tgtk-empty' }, favs.length ? '这个收藏夹里还没有角色' : '还没有收藏'));
      return;
    }

    const frag = HDOC.createDocumentFragment();
    rows.forEach(({ f, r, items }) => {
      const pct = r.total > 0 && r.valhalla !== null ? (r.valhalla / r.total) * 100 : null;
      const multi = items.length > 1;
      const chips = h('div', { class: 'tgtk-fchips' }, h('i', null, '收藏夹 '));
      items.forEach((it) => {
        const nm = folderPath(it.folder) || '默认收藏夹';
        const label = h(
          'button',
          {
            class: 'tgtk-fchiplabel',
            type: 'button',
            title: '点一下：把这条收藏移到别的收藏夹',
            onclick: (ev) => {
              ev.stopPropagation();
              openMovePop(label, { id: r.id, key: it.key, folder: it.folder, mode: 'move' });
            },
          },
          nm
        );
        chips.appendChild(
          h(
            'span',
            { class: 'tgtk-fchip' },
            label,
            h(
              'button',
              {
                class: 'tgtk-fchipx',
                type: 'button',
                title: multi ? `从「${nm}」移出` : '取消收藏',
                onclick: () => {
                  hideMovePop();
                  removeFavKey(it.key);
                  if (!favs.some((x) => String(x.id) === String(r.id))) {
                    favRows = favRows.filter((x) => String(x.id) !== String(r.id));
                  }
                  renderFavs();
                  syncFavPick();
                  setFavStatus(favCountText());
                },
              },
              '×'
            )
          )
        );
      });
      const addChip = h(
        'button',
        {
          class: 'tgtk-fchipadd',
          type: 'button',
          title: '再收藏到别的收藏夹',
          onclick: (ev) => {
            ev.stopPropagation();
            openMovePop(addChip, { id: r.id, charName: r.name || '', mode: 'add' });
          },
        },
        '＋'
      );
      chips.appendChild(addChip);
      const folderLine = chips;
      const row = h(
        'div',
        { class: 'tgtk-row' },
        h(
          'div',
          { class: 'tgtk-main' },
          charaLink(r.id, r.name || nameCache[r.id] || undefined),
          h(
            'span',
            { class: 'tgtk-sub' },
            `Lv${num(r.level)} · 现价 ₵${fmt(num(r.current), r.current % 1 ? 2 : 0)}` +
              (r.total ? ` · 流通 ${fmt(r.total)}` : '')
          ),
          h(
            'span',
            {
              class: 'tgtk-kv',
              title: '持股 = 你持有的股数；固定资产 = 你自己这座塔的当前值 / 献祭上限（没有塔显示 --）；英灵殿 = tinygrail 账号持股',
            },
            h('i', null, '持股 '),
            h('b', null, r.mine === null ? '--' : fmt(r.mine)),
            h('i', null, ' · 固定资产 '),
            h('b', null, r.fixed === null ? '--' : r.fixedMax ? `${fmt(r.fixed)} / ${fmt(r.fixedMax)}` : fmt(r.fixed)),
            h('i', null, ' · 英灵殿 '),
            h('b', null, r.valhalla === null ? '--' : fmt(r.valhalla)),
            pct === null ? null : h('i', null, ` (${pct.toFixed(1)}%)`)
          ),
          folderLine
        ),
        h(
          'button',
          {
            class: 'tgtk-x',
            type: 'button',
            title: multi ? `取消收藏（从 ${items.length} 个收藏夹一起移出）` : '取消收藏',
            onclick: () => {
              if (multi) items.forEach((it) => removeFavKey(it.key));
              else removeFavKey(f.key);
              if (!favs.some((x) => String(x.id) === String(r.id))) {
                favRows = favRows.filter((x) => String(x.id) !== String(r.id));
              }
              renderFavs();
              syncFavPick();
              setFavStatus(favCountText());
              if (multi) panelToast(`已从 ${items.length} 个收藏夹移出`);
            },
          },
          '×'
        )
      );
      frag.appendChild(row);
    });
    list.appendChild(frag);
  }

  function syncFavPick() {
    if (!els) return;
    const id = currentCharacterId();
    const box = els.favPick;
    box.textContent = '';
    if (!id) {
      box.appendChild(h('span', { class: 'tgtk-label' }, '当前不在角色页'));
      return;
    }
    const name = nameCache[id] || '';
    const on = isFav(id);
    box.appendChild(h('span', { class: 'tgtk-label' }, `当前角色 #${id}${name ? ' ' + name : ''}`));
    box.appendChild(
      h(
        'button',
        {
          class: 'tgtk-btn' + (on ? '' : ' tgtk-primary'),
          type: 'button',
          onclick: () => openStarPop(box.querySelector('button')),
        },
        on ? '★ 已收藏（点开管理）' : '☆ 收藏当前角色'
      )
    );
    if (!name && !favNameLoading && !favNameTried.has(id)) {
      favNameLoading = true;
      favNameTried.add(id);
      api('chara/list', { method: 'POST', body: JSON.stringify([Number(id)]) })
        .then((arr) => {
          if (arr && arr[0] && arr[0].Name) {
            nameCache[id] = arr[0].Name;
            if (els) syncFavPick();
          }
        })
        .catch(() => {})
        .finally(() => {
          favNameLoading = false;
        });
    }
  }

  const MAGIC_DEFS = {
    chaos: {
      name: '混沌魔方',
      label: '混沌魔方',
      tip: '随机抢其他玩家 20-200 股（目标流通 ≥ 200），每次消耗 10 固定资产 + 1 魔方，每日 3 次',
      needTarget: false,
      cost: 10,
      daily: 3,
    },
    guidepost: {
      name: '虚空道标',
      label: '虚空道标',
      tip: '指定抢目标角色 10-100 股，每次消耗 100 固定资产 + 1 道标，每日 5 次；目标等级 ≤ 你的塔等级 + 2',
      needTarget: true,
      cost: 100,
      daily: 5,
    },
    fisheye: {
      name: '鲤鱼之眼',
      label: '鲤鱼之眼',
      tip: '把幻想乡持有的目标角色股份转到英灵殿（部分转星之力），消耗 100 固定资产 + 1 鲤鱼之眼，每日 1 次，周六禁用；塔等级需 ≥ 目标等级',
      needTarget: true,
      cost: 100,
      daily: 1,
    },
  };

  function magicTimes(mode) {
    const by = S.mTimesBy || {};
    return Math.max(1, Math.min(50, Math.floor(num(by[mode]) || 1)));
  }

  const magicNameTried = new Map(); // id → 上次补名时间；失败时限流重试，不永久放弃
  function refreshMagicPreview() {
    if (!els || !els.mPreview) return;
    const def = MAGIC_DEFS[S.magic];
    const n = magicTimes(S.magic);
    const cost = def.cost;
    const from = parseCharId(S.mFrom);
    const to = def.needTarget ? parseCharId(S.mTo) : from;
    const label = (id) => (nameCache[id] ? nameCache[id] : '#' + id);
    const route = from
      ? def.needTarget
        ? `「${label(from)}」→「${to ? label(to) : '?'}」 `
        : `「${label(from)}」 `
      : '';
    els.mPreview.textContent =
      route +
      `预计消耗 ${fmt(cost * n)} 固定资产 + ${n} 个「${def.name}」` +
      (n > def.daily ? `（每日上限 ${def.daily} 次，超出会失败）` : '');

    const now = Date.now();
    const miss = [from, to].filter(
      (id) => id && !nameCache[id] && now - (magicNameTried.get(id) || 0) > 15000
    );
    if (!miss.length) return;
    miss.forEach((id) => magicNameTried.set(id, now));
    loadNames(miss, true).then(() => {
      if (els && els.mPreview && miss.some((id) => nameCache[id])) refreshMagicPreview();
    }).catch(() => {});
  }

  async function loadItemCounts() {
    try {
      const v = await api('chara/user/item/0/1/50');
      const out = Object.create(null);
      (v.Items || []).forEach((it) => {
        out[it.Name] = num(it.Amount);
      });
      return out;
    } catch (e) {
      return null;
    }
  }

  function parseCharId(v) {
    const s = String(v || '').trim();
    const m = s.match(/^#?(\d+)$/);
    return m ? m[1] : '';
  }

  function parseCharIds(v) {
    const out = [];
    String(v || '')
      .split(/[\s,，、;；]+/)
      .forEach((part) => {
        const id = parseCharId(part);
        if (id && out.indexOf(id) < 0) out.push(id);
      });
    return out;
  }

  let selfKeyCache = '';

  async function selfKey() {
    if (selfKeyCache) return selfKeyCache;
    const g = guessedUsername();
    if (g) {
      selfKeyCache = g;
      return g;
    }
    try {
      const r = await api('account/recommend');
      if (r && r.Name) selfKeyCache = String(r.Name);
    } catch (e) {}
    return selfKeyCache;
  }

  async function myTemple(cid) {
    const u = await selfKey();
    if (!u) return null;
    const v = await api(`chara/user/temple/${encodeURIComponent(u)}/1/100?keyword=${cid}`);
    const list = (v && v.Items) || [];
    return list.find((x) => String(x.CharacterId) === String(cid)) || null;
  }

  async function findMyTemple(cid) {
    const id = String(cid || '');
    if (!/^\d+$/.test(id)) return null;
    const one = await myTemple(id).catch(() => null);
    if (one) return one;
    const all = await pinAllLoad().catch(() => null);
    if (all) {
      const hit = all.find((x) => x && String(x.CharacterId) === id);
      if (hit) return hit;
    }
    return null;
  }

  async function myShares(cid) {
    const u = await selfKey();
    if (!u) return 0;
    const v = await api(`chara/user/${cid}/${encodeURIComponent(u)}/false`);
    return num(v && v.Amount);
  }

  const MAGIC_MIN_FA = 250;

  function sharesForGap(gap, assets, ceiling) {
    const g = Math.floor(num(gap));
    const a = Math.floor(num(assets));
    const c = Math.floor(num(ceiling));
    if (g <= 0) return 0;
    if (!(c > 0)) return Math.ceil(g / 2); // 上限读不到：当没上限，按 2 固资/股
    if (a >= c) return 0; // 已到上限：再献就是拿 2 股换 2 固资 2 上限，亏，不补
    const room = c - a; // 还能涨多少固资而不破限
    const usable = room - (room % 2); // 2 固资一档，奇数那 1 点宁可留着
    return Math.ceil(Math.min(g, usable) / 2);
  }

  function maxSharesBeforeCap(assets, ceiling) {
    const a = Math.floor(num(assets));
    const c = Math.floor(num(ceiling));
    if (!(c > 0)) return Infinity;
    const room = c - a;
    if (!(room > 1)) return 0; // 已到上限，或只差 1 点（再献就破限）
    return Math.floor(room / 2);
  }

  async function fillAssets(cid, need, log) {
    const name = charaName(cid);
    const rawPer = Math.floor(num(S.mFillMax) || 0);
    const auto = !(rawPer > 0); // 留空 / 0 → 按缺口算股数
    let temple = await myTemple(cid);
    if (!temple) {
      log('warn', (await selfKey()) ? '读取不到你的这座圣殿，跳过自动补充' : '读不到登录用户名（未登录小圣杯？），跳过自动补充');
      return null;
    }

    let assets = num(temple.Assets);
    let ceiling = num(temple.Sacrifices);
    if (assets >= need) {
      log('info', `「${name}」固资 ${fmt(assets)} ≥ 本批所需 ${fmt(need)}（站点要求至少 ${fmt(MAGIC_MIN_FA)}），无需献祭`);
      return assets;
    }

    if (ceiling > 0 && assets >= ceiling) {
      log(
        'warn',
        `「${name}」固资 ${fmt(assets)} 已到塔上限 ${fmt(ceiling)}，不再献祭` +
          '（到上限后 1 股只换 1 固资 + 1 上限，不划算；要补只能先提高上限）'
      );
      return assets;
    }

    log(
      'info',
      `「${name}」固资 ${fmt(assets)} / 上限 ${fmt(ceiling)}，低于本批所需 ${fmt(need)}，开始自动献祭` +
        (auto ? '（单次献祭留空：按缺口算股数，1 股补 2 固资）' : `（每轮 ${fmt(rawPer)} 股）`)
    );

    for (let round = 1; round <= 10 && assets < need; round++) {
      if (!magicRunning) return assets;
      const gap = need - assets;

      let hold = 0;
      try {
        hold = await myShares(cid);
      } catch (e) {
        log('warn', '读取持股失败，停止补充');
        return assets;
      }
      if (hold <= 0) {
        log('fail', `没有「${name}」的持股了，无法继续补充`);
        return assets;
      }

      const capAmt = maxSharesBeforeCap(assets, ceiling);
      if (capAmt <= 0) {
        log(
          'warn',
          `固资 ${fmt(assets)} / 上限 ${fmt(ceiling)}：再献祭就会把上限顶高，已停在原地不再补充` +
            '（上限涨上去以后每股只值 1 固资）'
        );
        return assets;
      }

      const want = auto ? sharesForGap(gap, assets, ceiling) : rawPer;
      if (want <= 0) {
        log('warn', `固资 ${fmt(assets)} 距上限 ${fmt(ceiling)} 已不足 2 点，再献就会破限，停止补充`);
        return assets;
      }
      const amt = Math.min(want, capAmt, hold);
      if (amt < want) {
        log(
          'info',
          `按塔上限 ${fmt(ceiling)} 收着补：本轮最多 ${fmt(capAmt)} 股（原计划 ${fmt(want)} 股，` +
            '多献会把上限一起顶高）'
        );
      }

      log('info', `第 ${round} 轮：还差 ${fmt(gap)} 固资 → 献祭「${name}」${fmt(amt)} 股（持有 ${fmt(hold)} 股）`);
      try {
        const r = await api(`chara/sacrifice/${cid}/${amt}/false`, { method: 'POST', body: '{}' });
        const back = num(r && r.Balance);
        const drops = Array.isArray(r && r.Items) ? r.Items : [];
        log(
          'ok',
          `献祭 ${fmt(amt)} 股` +
            (back ? `，获得 ₵${fmt(back, back % 1 ? 2 : 0)}` : '') +
            (drops.length ? `，掉落 ${drops.map((d) => `${d.Name}×${num(d.Count) || 1}`).join('、')}` : '')
        );
      } catch (e) {
        log('fail', `献祭失败：${e && e.message ? e.message : e}`);
        return assets;
      }

      await sleep(600);
      temple = await myTemple(cid);
      if (!temple) return assets;
      const before = assets;
      const beforeCeil = ceiling;
      assets = num(temple.Assets);
      const ceil2 = num(temple.Sacrifices);
      if (ceil2 > 0) ceiling = ceil2;
      log(
        'info',
        `固资 ${fmt(before)} → ${fmt(assets)}` +
          (ceiling !== beforeCeil ? `，上限 ${fmt(beforeCeil)} → ${fmt(ceiling)}` : '')
      );
      if (assets <= before) {
        log('warn', '献祭后固资没有增加，已停止自动补充（请手动确认献祭规则）');
        return assets;
      }
    }

    if (assets < need) {
      if (ceiling > 0 && assets >= ceiling - 1) {
        log(
          'info',
          `已补到固资 ${fmt(assets)}（上限 ${fmt(ceiling)}），受上限限制不再往上补——` +
            '再献祭虽然能凑够，但会把上限一起撑高，不划算'
        );
      } else {
        log('warn', `固资仍不足（${fmt(assets)} < ${fmt(need)}），继续执行可能会失败`);
      }
    }
    return assets;
  }

  function pushMagicLog(node) {
    if (!els) return;
    els.mLog.appendChild(node);
    els.mLog.scrollTop = els.mLog.scrollHeight;
  }

  const MAGIC_GAP = 1500;
  const MAGIC_JITTER = 500;

  function isQuotaMagicError(msg) {
    return /次数|上限|限制/.test(String(msg || ''));
  }

  async function postMagic(path, attempt) {
    try {
      return await api(path, { method: 'POST', body: '{}' });
    } catch (err) {
      const msg = String((err && err.message) || err);
      if ((attempt || 0) < 1 && !isQuotaMagicError(msg) && !/不足/.test(msg)) {
        await sleep(2000);
        return postMagic(path, (attempt || 0) + 1);
      }
      throw err;
    }
  }

  async function runMagic() {
    if (magicRunning) return;

    const mode = S.magic;
    const def = MAGIC_DEFS[mode];
    const from = parseCharId(S.mFrom);
    const to = def.needTarget ? parseCharId(S.mTo) : from;

    if (!from) return setMagicStatus('请填炮塔角色 ID');
    if (def.needTarget && !to) return setMagicStatus('请填目标角色 ID');
    if (from === to && def.needTarget) return setMagicStatus('炮塔和目标不能是同一个角色');

    const times = magicTimes(mode);
    S.mTimesBy[mode] = times;
    if (els.mTimes) els.mTimes.value = String(times);

    magicRunning = true;
    busy = true;
    setButtonsDisabled(true);
    setMagicStatus(`准备执行 ${def.name} × ${times}…`);
    els.mLog.textContent = '';
    els.mStopBtn.hidden = false;

    await loadNames([from, to].filter(Boolean));
    const fromName = charaName(from);
    const toName = def.needTarget ? charaName(to) : fromName;

    if (def.needTarget) {
      pushMagicLog(h('div', { class: 'tgtk-log tgtk-log-info' }, `炮塔「${fromName}」→ 目标「${toName}」`));
    } else {
      pushMagicLog(h('div', { class: 'tgtk-log tgtk-log-info' }, `炮塔「${fromName}」（目标即该角色）`));
    }

    const log = (level, msg) => pushMagicLog(h('div', { class: `tgtk-log tgtk-log-${level}` }, msg));
    let assetsLeft = null; // 本地估算的炮塔固资，执行前不足才真查

    try {
      const items = await loadItemCounts();
      if (items) {
        const left = items[def.name];
        pushMagicLog(
          h(
            'div',
            { class: 'tgtk-log tgtk-log-info' },
            left === undefined ? `未找到道具「${def.name}」` : `道具「${def.name}」剩余 ${fmt(left)} 个`
          )
        );
      }

      let ok = 0;
      let fail = 0;
      let gain = 0;
      let value = 0;
      let stopped = false;
      let retryLeft = 3; // 整批最多「补充后重试」3 次，防止任何异常状态下打转

      for (let i = 1; i <= times; i++) {
        if (!magicRunning) {
          stopped = true;
          break;
        }
        setMagicStatus(`第 ${i} / ${times} 次…`);

        if (S.mFill && (assetsLeft === null || assetsLeft < MAGIC_MIN_FA)) {
          const remain = times - i + 1;
          const need = MAGIC_MIN_FA + def.cost * Math.min(remain, def.daily || remain);
          if (assetsLeft !== null) log('warn', `炮塔固资预计只剩 ${fmt(assetsLeft)}（低于 ${fmt(MAGIC_MIN_FA)} 或不够本批），先自动补充（本批还差 ${remain} 次）`);
          const filled = await fillAssets(from, need, log);
          if (filled !== null) assetsLeft = filled;
        }

        try {
          const path = def.needTarget ? `magic/${mode}/${from}/${to}` : `magic/${mode}/${from}`;
          const v = await postMagic(path);
          if (assetsLeft !== null) assetsLeft = Math.max(0, assetsLeft - def.cost);
          const amount = num(v && (v.Amount ?? v.amount));
          const price = num(v && (v.CurrentPrice ?? v.Current));
          const name = (v && v.Name) || toName;
          const detail = typeof v === 'string' ? v : v && typeof v.Message === 'string' ? v.Message : '';
          ok++;
          gain += amount;
          value += amount * price;
          if (v && v.Name) nameCache[to] = v.Name;
          pushMagicLog(
            h(
              'div',
              { class: 'tgtk-log tgtk-log-ok' },
              `#${i}  ` +
                (amount
                  ? `${name}  +${fmt(amount)} 股` + (price ? `（₵${fmt(price, price % 1 ? 2 : 0)}/股）` : '')
                  : detail || '成功')
            )
          );
        } catch (err) {
          const msg = err && err.message ? err.message : String(err);
          let realAssets = null;
          if (/次数|上限|限制|资产不足/.test(msg)) {
            try {
              const t = await myTemple(from);
              if (t) realAssets = num(t.Assets);
            } catch (e) {}
          }
          const shortOfAssets = realAssets !== null && realAssets < MAGIC_MIN_FA;

          if (shortOfAssets && S.mFill && retryLeft > 0) {
            retryLeft--;
            assetsLeft = realAssets;
            pushMagicLog(
              h('div', { class: 'tgtk-log tgtk-log-warn' },
                `#${i}  固资只有 ${fmt(realAssets)}（低于站点要求的 ${fmt(MAGIC_MIN_FA)}），不是次数上限；补充后重试这一次`)
            );
            const filled = await fillAssets(from, MAGIC_MIN_FA + def.cost, log);
            if (filled !== null) assetsLeft = filled;
            if (filled !== null && filled >= MAGIC_MIN_FA) {
              i--;
              continue;
            }
          }

          fail++;
          pushMagicLog(h('div', { class: 'tgtk-log tgtk-log-fail' }, `#${i}  失败：${msg}`));
          if (shortOfAssets) {
            pushMagicLog(
              h('div', { class: 'tgtk-log tgtk-log-warn' },
                `已核对：固资不足（${fmt(realAssets)} < ${fmt(MAGIC_MIN_FA)}，站点要求炮塔固资至少 ${fmt(MAGIC_MIN_FA)} 才能用道具）` +
                  (S.mFill ? '，补充后仍然不够' : '，可勾选「固资不足时自动献祭补充」'))
            );
          } else if (realAssets !== null) {
            pushMagicLog(
              h('div', { class: 'tgtk-log tgtk-log-info' },
                `已核对：固资 ${fmt(realAssets)} ≥ ${fmt(MAGIC_MIN_FA)}，够用，是今日次数用完`)
            );
          }
          if (isQuotaMagicError(msg)) {
            pushMagicLog(
              h('div', { class: 'tgtk-log tgtk-log-warn' },
                shortOfAssets ? '已中断整批：固资补不上，继续跑只会重复失败' : '今日次数可能已达上限，已中断整批（明天再试）')
            );
            stopped = true;
            break;
          }
          if (S.mStop) {
            pushMagicLog(h('div', { class: 'tgtk-log tgtk-log-warn' }, '已按「失败即停」中断'));
            break;
          }
        }

        if (i < times && magicRunning) await sleep(MAGIC_GAP + Math.floor(Math.random() * MAGIC_JITTER));
      }

      const summary =
        `成功 ${ok} 次 / 失败 ${fail} 次` + (gain ? ` · 共获得 ${fmt(gain)} 股` : '') + (value ? ` · 约 ₵${fmt(value)}` : '');
      pushMagicLog(h('div', { class: 'tgtk-log tgtk-log-sum' }, (stopped ? '已停止 · ' : '') + summary));
      setMagicStatus(summary);

      const after = await loadItemCounts();
      if (after && els) {
        const left = after[def.name];
        if (left !== undefined) pushMagicLog(h('div', { class: 'tgtk-log tgtk-log-info' }, `剩余「${def.name}」${fmt(left)} 个`));
      }
    } finally {
      magicRunning = false;
      busy = false;
      setButtonsDisabled(false);
      if (els) els.mStopBtn.hidden = true;
      refreshMagicPreview();
    }
  }

  async function readStar(cid) {
    const t = await myTemple(cid);
    if (!t) return null;
    const raw = t.StarForces ?? t.StarForce ?? t.Star;
    const ceiling = num(t.Sacrifices) || 0;
    const assets = num(t.Assets ?? t.Sacrifices) || 0;
    if (ceiling > 0) starCapCache[String(cid)] = ceiling;
    starAssetCache[String(cid)] = assets;
    return {
      cur: num(raw) || 0,
      known: raw !== undefined && raw !== null,
      assets,
      ceiling,
      name: t.Name || charaName(cid),
    };
  }

  async function starCacheLoad(ids) {
    let got = 0;
    await mapLimit(ids, 3, async (id) => {
      try {
        const t = await myTemple(id);
        if (!t) return;
        const cap = num(t.Sacrifices) || 0;
        if (cap > 0) starCapCache[String(id)] = cap;
        starAssetCache[String(id)] = num(t.Assets ?? t.Sacrifices) || 0;
        got++;
      } catch (e) {}
    });
    return got;
  }

  async function fillStarAssets(cid, need, log) {
    const name = charaName(cid);
    let temple = await myTemple(cid);
    if (!temple) {
      log('warn', '读不到你的这座圣殿，跳过献祭补充');
      return null;
    }
    let assets = num(temple.Assets);
    if (assets >= need) {
      log('info', `「${name}」固资 ${fmt(assets)} ≥ 本批所需 ${fmt(need)}，无需献祭`);
      return assets;
    }
    const ceiling = Math.max(0, Math.floor(num(temple.Sacrifices) || 0));
    for (let round = 1; round <= 12 && assets < need; round++) {
      if (!starRunning) return assets;
      let hold = 0;
      try { hold = await myShares(cid); } catch (e) {
        log('warn', '读取持股失败，停止补充');
        return assets;
      }
      if (hold <= 0) { log('fail', `没有「${name}」的持股了，无法继续补充`); return assets; }
      const gap = need - assets;
      const capAmt = maxSharesBeforeCap(assets, ceiling);
      if (capAmt <= 0) {
        log(
          'warn',
          `固资 ${fmt(assets)} / 上限 ${fmt(ceiling)}：再献祭就会把上限顶高，停在原地不再补` +
            '（宁可差 1 点，也不让上限多 1）'
        );
        return assets;
      }
      const want = Math.ceil(gap / 2);
      const amt = Math.min(want, hold, capAmt);
      if (amt <= 0) return assets;
      log('info', `第 ${round} 轮：还差 ${fmt(gap)} 固资 → 献祭「${name}」${fmt(amt)} 股（持有 ${fmt(hold)} 股）`);
      try {
        const r = await api(`chara/sacrifice/${cid}/${amt}/false`, { method: 'POST', body: '{}' });
        const back = num(r && r.Balance);
        const drops = Array.isArray(r && r.Items) ? r.Items : [];
        log('ok', `献祭 ${fmt(amt)} 股` +
          (back ? `，获得 ₵${fmt(back, back % 1 ? 2 : 0)}` : '') +
          (drops.length ? `，掉落 ${drops.map((d) => `${d.Name}×${num(d.Count) || 1}`).join('、')}` : ''));
      } catch (e) {
        log('fail', `献祭失败：${e && e.message ? e.message : e}`);
        return assets;
      }
      await sleep(600);
      temple = await myTemple(cid);
      if (!temple) return assets;
      const before = assets;
      assets = num(temple.Assets);
      log('info', `固资 ${fmt(before)} → ${fmt(assets)}`);
      if (assets <= before) {
        log('warn', '献祭后固资没有增加，已停止自动补充（请手动确认献祭规则）');
        return assets;
      }
    }
    if (assets < need) {
      if (ceiling > 0 && assets >= ceiling - 1) {
        log('info', `已补到固资 ${fmt(assets)}（上限 ${fmt(ceiling)}），受上限限制不再往上补`);
      } else {
        log('warn', `固资仍不足（${fmt(assets)} < ${fmt(need)}），本批可能无法完成`);
      }
    }
    return assets;
  }

  function starEndTarget(ceiling) {
    const cap = Math.max(0, Math.floor(num(ceiling) || 0));
    const mode = S.starEndFill === '250' || S.starEndFill === 'none' ? S.starEndFill : 'full';
    if (mode === 'none') return 0;
    if (mode === '250') return cap > 0 ? Math.min(250, cap) : 250;
    return cap;
  }

  function setStarStatus(msg) {
    if (els && els.sStat) els.sStat.textContent = msg;
  }

  function pushStarLog(node) {
    if (!els || !els.sLog) return;
    els.sLog.appendChild(node);
    els.sLog.scrollTop = els.sLog.scrollHeight;
  }

  async function runStar() {
    if (starRunning) return;

    const ids = String(S.starChar || '')
      .split(/[\s,，、;；]+/)
      .map(parseCharId)
      .filter(Boolean)
      .slice(0, 20);
    if (!ids.length) return setStarStatus('请填角色 ID（可填多个，空格分隔）');

    const amount = Math.max(1, Math.min(1000000, Math.floor(num(S.starAmount) || 100)));

    starRunning = true;
    busy = true;
    setButtonsDisabled(true);
    if (els) {
      els.sLog.textContent = '';
      els.sStop.hidden = false;
    }
    const log = (level, msg) => pushStarLog(h('div', { class: `tgtk-log tgtk-log-${level}` }, msg));

    let total = 0;
    try {
      await loadNames(ids);
      for (let k = 0; k < ids.length; k++) {
        if (!starRunning) break;
        const cid = ids[k];
        const st0 = await readStar(cid);
        if (!st0) {
          log('fail', `#${cid} 读不到你的圣殿（未登录 / 没有这座塔），跳过`);
          continue;
        }
        let cur = st0.cur;
        let assets = st0.assets;
        let done = 0;
        const ceiling = st0.ceiling > 0 ? st0.ceiling : Math.max(1, Math.floor(num(S.starStep) || 500));
        log('info', `「${st0.name}」当前 ${fmt(cur)} 星之力 / 固资 ${fmt(assets)} / 上限 ${fmt(ceiling)}，本次贡献 ${fmt(amount)}`);

        let guard = 0;
        while (starRunning && done < amount && guard++ < 500) {
          let count = Math.min(ceiling, amount - done);
          if (assets < count) {
            if (!S.starFill) {
              log('warn', `固资只剩 ${fmt(assets)}，不够转一次 ${fmt(count)}`);
              break;
            }
            const filled = await fillStarAssets(cid, count, log);
            if (filled === null) {
              log('warn', '固资补不上，这座塔先停');
              break;
            }
            assets = filled;
            if (assets < count) {
              if (ceiling > 0 && assets >= ceiling - 1 && assets > 0) {
                log('info', `固资最多补到 ${fmt(assets)}（再补会把上限 ${fmt(ceiling)} 撑高），这一批按 ${fmt(assets)} 转`);
                count = assets;
              } else {
                log('warn', `补完固资仍只有 ${fmt(assets)}，不够 ${fmt(count)}`);
                break;
              }
            }
          }

          try {
            const v = await api(`chara/star/${cid}/${count}`, { method: 'POST', body: '{}' });
            assets -= count;
            cur += count;
            done += count;
            total += count;
            const detail = typeof v === 'string' ? v : v && typeof v.Message === 'string' ? v.Message : '';
            log('ok', `+${fmt(count)}（本次 ${fmt(done)} / ${fmt(amount)}，累计 ${fmt(cur)} 星之力）` + (detail ? ` · ${detail}` : ''));
            setStarStatus(`「${st0.name}」已贡献 ${fmt(done)} / ${fmt(amount)} 星之力`);
          } catch (err) {
            log('fail', `转化失败：${err && err.message ? err.message : err}`);
            break;
          }

          if (done < amount && starRunning) await sleep(320);
        }

        if (done >= amount) {
          log('ok', `「${st0.name}」已贡献 ${fmt(done)} 星之力`);
          const endTarget = starEndTarget(ceiling);
          if (S.starFill && starRunning && endTarget > 0) {
            const left = await fillStarAssets(cid, endTarget, log);
            if (left !== null) {
              assets = left;
              log('sum',
                `收尾${endTarget >= ceiling ? '补满' : `补到 ${fmt(endTarget)}`}「${st0.name}」：` +
                `固资 ${fmt(left)}（仅补塔，不计入本次 ${fmt(amount)} 星之力）`);
            }
          }
        } else if (starRunning) {
          log('warn', `「${st0.name}」停在 ${fmt(done)} / ${fmt(amount)}，未做收尾补资`);
        }
        starAssetCache[String(cid)] = assets;
        if (st0.ceiling > 0) starCapCache[String(cid)] = st0.ceiling;
      }

      const summary = `完成 · 共转化 ${fmt(total)} 星之力`;
      if (!starRunning) log('sum', '已停止 · 共转化 ' + fmt(total) + ' 星之力');
      setStarStatus(summary);
    } catch (err) {
      setStarStatus('出错：' + (err && err.message ? err.message : err));
    } finally {
      starRunning = false;
      busy = false;
      setButtonsDisabled(false);
      if (els) els.sStop.hidden = true;
      if (starEstimateRefresh) {
        try { starEstimateRefresh(); } catch (e) {}
      }
    }
  }

  function sdLevel(x) {
    if (!x) return 0;
    const keys = ['Level', 'CharacterLevel', 'CharaLevel'];
    for (let i = 0; i < keys.length; i++) {
      const raw = x[keys[i]];
      if (raw === undefined || raw === null || raw === '') continue;
      const v = Math.floor(num(raw));
      return Number.isFinite(v) && v >= 0 ? v : 0;
    }
    return 0;
  }

  const SD_LIST_MAX = 100;
  const SD_SEARCH_MAX = 300; // 搜索结果上限：别让 0 活股角色被「持股前 100 只」截掉

  function setSdStatus(msg) {
    if (els && els.sdStat) els.sdStat.textContent = msg;
  }

  function pushSdLog(node) {
    if (!els || !els.sdLog) return;
    els.sdLog.appendChild(node);
    els.sdLog.scrollTop = els.sdLog.scrollHeight;
  }

  async function loadFuel() {
    if (sdBusy) return;
    if (holdAll.length && nowMs() - holdAt < HOLD_TTL) {
      sdHold = holdAll.slice();
      const age = Math.max(0, Math.round((nowMs() - holdAt) / 1000));
      sdCacheNote = age < 60 ? '沿用刚刚的扫描' : `沿用 ${Math.round(age / 60)} 分钟前的扫描`;
      renderFuel();
      return;
    }
    sdBusy = true;
    if (els) {
      els.sdList.textContent = '';
      els.sdLoad.disabled = true;
      els.sdLoad.textContent = '读取中…';
    }
    sdHold = [];
    sdCacheNote = '';
    setSdStatus('正在读取你的持股…');

    try {
      let key = await selfKey();
      if (!key) {
        try {
          const r = await api('account/recommend');
          if (r && r.Hash) key = r.Hash;
        } catch (e) {}
      }
      if (!key) {
        setSdStatus('读不到登录用户名（未登录小圣杯？），无法读取持股');
        return;
      }

      const r = await fetchAllHoldings(key, {
        alive: () => sdBusy,
        onProgress: (n, total) => setSdStatus(`读取持股 ${n} / ${total || '?'}…`),
      });
      sdHold = r.items;
      sugCache.clear();
      sugIdCache.clear();
      if (sdHold.length) {
        holdAll = sdHold.slice();
        holdAt = nowMs();
      }

      if (!sdHold.length) {
        setSdStatus('没有读到持股，检查是否登录小圣杯');
        return;
      }
      const complete = r.total > 0 && sdHold.length >= r.total;
      let pruned = 0;
      if (complete) {
        const have = new Set(sdHold.map((x) => String(x.CharacterId)));
        const q = sdQueue();
        const kept = q.filter((id) => have.has(id));
        pruned = q.length - kept.length;
        if (pruned) {
          S.sdFroms = kept;
          persist();
        }
      }
      renderFuel();
      if (pruned) setSdStatus(`已从燃料队列移除 ${pruned} 个不在持仓里的历史 ID（旧版设置残留）`);
      if (r.total && sdHold.length < r.total) {
        pushSdLog(
          h(
            'div',
            { class: 'tgtk-log tgtk-log-warn' },
            `持股共 ${fmt(r.total)} 只，只读到前 ${fmt(sdHold.length)} 只（分页上限），列表可能不完整`
          )
        );
      }
    } catch (err) {
      setSdStatus('读取持股失败：' + (err && err.message ? err.message : err));
    } finally {
      sdBusy = false;
      if (els) {
        els.sdLoad.disabled = false;
        els.sdLoad.textContent = '读取持股';
      }
    }
  }

  function sdCandidates() {
    const toks = queryTokens(S.sdQuery);
    const lvOnly = S.sdLevel === '' || S.sdLevel === null || S.sdLevel === undefined
      ? null
      : Math.max(0, Math.floor(num(S.sdLevel)));
    return sdHold
      .filter((x) => {
        if (toks.length) return toks.some((t) => charQueryHit(x, t));
        return lvOnly === null || sdLevel(x) === lvOnly;
      })
      .sort((a, b) => {
        const da = num(a.UserAmount) <= 0 ? 1 : 0;
        const db = num(b.UserAmount) <= 0 ? 1 : 0;
        if (da !== db) return da - db;
        const d = S.sdSortAsc
          ? num(a.UserAmount) - num(b.UserAmount)
          : num(b.UserAmount) - num(a.UserAmount);
        return d || String(a.CharacterId).localeCompare(String(b.CharacterId));
      })
      .slice(0, toks.length ? SD_SEARCH_MAX : SD_LIST_MAX);
  }

  function sdQueue() {
    const src = Array.isArray(S.sdFroms) ? S.sdFroms : [];
    const seen = Object.create(null);
    const out = [];
    src.forEach((v) => {
      const id = parseCharId(v);
      if (id && !seen[id]) {
        seen[id] = 1;
        out.push(id);
      }
    });
    return out;
  }

  function sdPickText() {
    const q = sdQueue();
    if (!q.length) return '还没选燃料：点列表里的「选」加入队列（可多选，按点选顺序依次消耗）';
    if (!sdHold.length) return `燃料队列 ${q.length} 只（点「读取持股」后可看每只可用股数）`;
    let sum = 0;
    q.forEach((id) => {
      const it = sdHold.find((x) => String(x.CharacterId) === id);
      if (it) sum += Math.max(0, num(it.UserAmount));
    });
    return `燃料队列 ${q.length} 只 · 可用合计 ${fmt(sum)} 股 · 按点选顺序消耗`;
  }

  function sdShortName(nm) {
    const s = String(nm || '');
    return s.length > 6 ? s.slice(0, 6) + '…' : s;
  }

  function sdTargetLineText() {
    const to = parseCharId(S.sdTarget);
    if (!to) return '目标：还没填（填角色 ID 或点名，充能前读回等级 / 固资 / 上限）';
    const nm = (sdTargetInfo && sdTargetInfo.name) || charaName(to);
    if (!sdTargetInfo || String(sdTargetInfo.cid) !== String(to)) {
      return `目标 #${to}「${nm}」· 正在读取等级 / 固资…`;
    }
    if (!sdTargetInfo.lv) return `目标 #${to}「${nm}」· 没读到等级，等会儿会自动重试`;
    const cap = num(sdTargetInfo.cap);
    const assets = num(sdTargetInfo.assets);
    return `目标「${nm}」Lv${sdTargetInfo.lv} · 固资 ${fmt(assets)} / 上限 ${fmt(cap)}` +
      (cap > 0 && assets >= cap ? ' · 已到上限' : '');
  }

  function renderSdPick() {
    if (!els || !els.sdPick) return;
    const box = els.sdPick;
    box.textContent = '';
    box.appendChild(h('span', { class: 'tgtk-picktxt tgtk-sdtline' }, sdTargetLineText()));
    const q = sdQueue();
    if (!q.length) {
      renderSdEstimate();
      return;
    }
    box.appendChild(h('span', { class: 'tgtk-picktxt' }, sdPickText()));
    const wrap = h('div', { class: 'tgtk-sdpicks' });
    q.forEach((id, i) => {
      const it = sdHold.find((x) => String(x.CharacterId) === id);
      const nm = (it && it.Name) || charaName(id);
      wrap.appendChild(
        h(
          'span',
          { class: 'tgtk-sdpick', title: `燃料队列第 ${i + 1} 只 ·「${nm}」#${id}` },
          h('span', null, `${i + 1}. ${sdShortName(nm)}`),
          h(
            'button',
            { class: 'tgtk-sdpick-x', type: 'button', 'data-sdremove': id, title: `从队列移出 #${id}` },
            '×'
          )
        )
      );
    });
    wrap.appendChild(
      h('button', { class: 'tgtk-sdpick-clear', type: 'button', 'data-sdclear': '1' }, '清空队列')
    );
    box.appendChild(wrap);
    renderSdEstimate();
  }

  function renderFuel() {
    if (!els) return;
    const list = els.sdList;
    list.textContent = '';
    const rows = sdCandidates();
    const lvOnly = S.sdLevel === '' || S.sdLevel === null || S.sdLevel === undefined
      ? null
      : Math.max(0, Math.floor(num(S.sdLevel)));

    if (!sdHold.length) {
      list.appendChild(h('div', { class: 'tgtk-empty' }, '点「读取持股」加载候选'));
    } else if (!rows.length) {
      list.appendChild(h('div', { class: 'tgtk-empty' }, '没有符合条件的持股（换个等级或清空搜索）'));
    } else {
      const frag = HDOC.createDocumentFragment();
      const q = sdQueue();
      rows.forEach((x) => {
        const id = String(x.CharacterId);
        const at = q.indexOf(id);
        const name = x.Name || charaName(x.CharacterId);
        const shares = num(x.UserAmount);
        const dead = shares <= 0;
        const label = at >= 0 ? `第 ${at + 1} · 移出` : dead ? '无活股' : '选';
        const pick = h('button', { class: 'tgtk-btn tgtk-mini', type: 'button' }, label);
        if (at >= 0) {
          pick.classList.add('tgtk-picked');
          pick.title = `队列第 ${at + 1} 只，点一下移出队列`;
        } else if (dead) {
          pick.disabled = true;
          pick.classList.add('tgtk-off');
          pick.title = '没有可用活股：持股可能都挂了卖单';
        } else {
          pick.title = '加入燃料队列（排在已有燃料后面）';
        }
        const lnk = charaLink(id, name);
        lnk.title = dead
          ? `${name}（#${id}）· 没有可用活股，点这里打开角色页取消挂单`
          : `${name}（#${id}）· 点这里打开角色页`;
        frag.appendChild(
          h(
            'div',
            { class: 'tgtk-sdrow' + (at >= 0 ? ' tgtk-on' : '') + (dead ? ' tgtk-sdzero' : ''), 'data-sdid': id },
            h(
              'div',
              { class: 'tgtk-sdmain' },
              lnk,
              h('span', { class: 'tgtk-sub' }, `Lv${sdLevel(x)} · 持股 ${fmt(shares)}` + (dead ? '（全挂了卖单？）' : ''))
            ),
            pick
          )
        );
      });
      list.appendChild(frag);
    }

    const sum = rows.reduce((s, x) => s + num(x.UserAmount), 0);
    const dead = rows.filter((x) => num(x.UserAmount) <= 0).length;
    const dir = S.sdSortAsc ? '少到多' : '多到少';
    if (els.sdSort) {
      els.sdSort.textContent = S.sdSortAsc ? '少→多' : '多→少';
      els.sdSort.title = `燃料候选按持股${dir}排列（点一下切换）`;
    }
    setSdStatus(
      sdHold.length
        ? `持仓 ${fmt(sdHold.length)} 只 · 显示 ${fmt(rows.length)} 只${lvOnly !== null ? ` · Lv${lvOnly}` : ''} · 合计 ${fmt(sum)} 股` +
            (dead ? ` · 其中 ${fmt(dead)} 只无活股` : '') +
            (sdCacheNote ? ` · ${sdCacheNote}` : '')
        : `读取自己的全部持仓，按持股从${dir}排列，最多显示 100 只`
    );
    renderSdPick();
  }

  function pickFuel(id) {
    const q = sdQueue();
    const at = q.indexOf(String(id));
    if (at >= 0) q.splice(at, 1);
    else {
      const it = sdHold.find((x) => String(x.CharacterId) === String(id));
      if (it && num(it.UserAmount) <= 0) {
        setSdStatus(`「${it.Name || charaName(id)}」没有可用活股（全挂了卖单？），不能当燃料；点名字可去取消挂单`);
        return;
      }
      q.push(String(id));
    }
    S.sdFroms = q;
    persist();
    renderFuel();
  }

  async function fetchTargetLevel(cid) {
    try {
      const arr = await api('chara/list', { method: 'POST', body: JSON.stringify([Number(cid)]) });
      const c = (arr || [])[0];
      return c ? Math.max(0, Math.floor(num(c.Level))) : 0;
    } catch (e) {
      return 0;
    }
  }

  async function refreshSdTarget() {
    const to = parseCharId(S.sdTarget);
    if (!to) return;
    try {
      await loadNames([to]);
      const lv = await fetchTargetLevel(to);
      const t = await myTemple(to);
      if (!t) {
        sdTargetInfo = null;
        setSdStatus(`#${to}「${charaName(to)}」不是你的圣殿（或未登录），无法作为目标`);
        renderSdPick();
        return;
      }
      sdTargetInfo = {
        cid: String(to), lv: lv || 0,
        name: t.Name || charaName(to),
        assets: num(t.Assets), cap: num(t.Sacrifices),
      };
      renderSdPick();
    } catch (e) {
    }
  }

  function sdGain(take, a, b) {
    if (!(take > 0)) return 0;
    if (a >= b - 1) return take;
    const per = Math.min(32, Math.pow(2, b - a - 1));
    return take / per;
  }

  function sdEstimate() {
    const info = sdTargetInfo;
    const q = sdQueue();
    if (!info || !info.lv || !q.length) return null;
    const b = Math.floor(info.lv);
    const cap = num(info.cap);
    const assets = num(info.assets);
    let left = Math.max(1, Math.floor(num(S.sdAmount) || 1));
    let gain = 0;
    let used = 0;
    const parts = [];
    let blocked = 0; // 因为已经冲过上限而用不上的后续燃料只数
    let hitCap = false;
    for (let i = 0; i < q.length; i++) {
      if (left <= 0) break;
      const id = q[i];
      const it = sdHold.find((x) => String(x.CharacterId) === id);
      if (!it) continue;
      const hold = Math.max(0, Math.floor(num(it.UserAmount)));
      if (hold <= 0) continue;
      const take = Math.min(left, hold);
      const a = sdLevel(it);
      const g = sdGain(take, a, b);
      gain += g;
      used += take;
      left -= take;
      parts.push({ id, name: it.Name || charaName(id), take, gain: g, lv: a });
      if (cap > 0 && assets + gain >= cap) {
        hitCap = true;
        blocked = q.slice(i + 1).length;
        break;
      }
    }
    const atCap = cap > 0 && assets >= cap;
    return { gain, used, left, lv: b, atCap, hitCap, blocked, parts, assets, cap };
  }

  function renderSdEstimate() {
    if (!els || !els.sdEst) return;
    const el = els.sdEst;
    const to = parseCharId(S.sdTarget);
    if (!to) {
      el.textContent = '';
      el.title = '';
      return;
    }
    if (!sdTargetInfo || !sdTargetInfo.lv) {
      el.textContent = '预计 +?';
      el.title = '填好目标后会自动读回塔的等级 / 固资 / 上限，再给出估算';
      return;
    }
    const e = sdEstimate();
    if (!e) {
      el.textContent = '预计 +0';
      el.title = '先在列表里点「选」加几只燃料';
      return;
    }
    if (e.atCap) {
      el.textContent = '已到上限';
      el.title = `目标固资 ${fmt(sdTargetInfo.assets)} / 上限 ${fmt(sdTargetInfo.cap)}：` +
        '已经到/超过上限，补不进去了（超充只在「一次冲到上限之上」时有效）';
      return;
    }
    el.textContent = `预计 +${fmt(e.gain)} 固资`;
    const detail = e.parts.map((p) => `「${p.name}」Lv${p.lv} ${fmt(p.take)} 股 → +${fmt(p.gain)}`);
    el.title = `目标 Lv${e.lv} · 预计消耗 ${fmt(e.used)} 股` +
      (e.left > 0 ? `（燃料只够 ${fmt(e.used)} 股，还差 ${fmt(e.left)} 股）` : '') +
      ` · 目标固资 ${fmt(e.assets)} / 上限 ${fmt(e.cap)}\n` +
      (detail.length ? '逐只：' + detail.join('；') : '') +
      (e.hitCap
        ? `\n这一只充完就已经到/超过上限 ${fmt(e.cap)}，后面 ${fmt(e.blocked)} 只燃料用不上`
        : '');
  }

  async function runStardust() {
    if (sdRunning) return;

    const need = (msg) => {
      setSdStatus(msg);
      pushSdLog(h('div', { class: 'tgtk-log tgtk-log-warn' }, msg));
    };

    const queue = sdQueue();
    const to = parseCharId(S.sdTarget);
    if (!queue.length) return need('请先在列表里点「选」加入燃料（可多选，按点选顺序依次消耗）');
    if (!to) return need('请填目标圣殿角色 ID');

    const amt = Math.max(1, Math.floor(num(S.sdAmount) || 0));
    S.sdAmount = amt;
    if (els.sdAmount) els.sdAmount.value = String(amt);

    sdRunning = true;
    busy = true;
    setButtonsDisabled(true);
    if (els) els.sdLog.textContent = '';
    const log = (level, msg) => pushSdLog(h('div', { class: `tgtk-log tgtk-log-${level}` }, msg));

    let left = amt;
    let used = 0;
    let failed = '';
    let capStop = false; // 因为已经冲过上限而提前停（不是燃料不够）
    const touched = [];
    const lvB = sdTargetInfo && sdTargetInfo.lv ? Math.floor(sdTargetInfo.lv) : 0;
    const capNow = sdTargetInfo ? num(sdTargetInfo.cap) : 0;
    let assetsNow = sdTargetInfo ? num(sdTargetInfo.assets) : 0;

    try {
      await loadNames(queue.concat([to]));
      if (!sdTargetInfo || String(sdTargetInfo.cid) !== String(to)) await refreshSdTarget();
      const toName = charaName(to);
      log('info', `本次共消耗 ${fmt(amt)} 股 → 补充「${toName}」的固定资产 · 燃料队列 ${queue.length} 只，按顺序扣`);

      for (let i = 0; i < queue.length && left > 0; i++) {
        const from = queue[i];
        const it = sdHold.find((x) => String(x.CharacterId) === from);
        const fromName = (it && it.Name) || charaName(from);
        if (from === to) {
          log('warn', `第 ${i + 1} 只「${fromName}」就是目标角色，跳过`);
          continue;
        }
        let hold = it ? num(it.UserAmount) : 0;
        try {
          const fresh = num(await myShares(from));
          hold = fresh;
          if (it) it.UserAmount = fresh;
        } catch (e) {}
        if (hold <= 0) {
          log('warn', `第 ${i + 1} 只「${fromName}」没有可用活股（可能都挂了卖单），跳过`);
          continue;
        }
        const take = Math.min(left, Math.floor(hold));
        if (take <= 0) continue;

        try {
          log('info', `第 ${i + 1} 只「${fromName}」#${from} 扣 ${fmt(take)} 股（还差 ${fmt(left - take)} 股）`);
          const v = await api(`magic/stardust/${from}/${to}/${take}/false`, { method: 'POST', body: '{}' });
          const msg = typeof v === 'string' ? v : (v && (typeof v.Value === 'string' ? v.Value : v.Message)) || '';
          log('ok', msg || `「${fromName}」已扣 ${fmt(take)} 股`);
          left -= take;
          used += take;
          touched.push({ from, it, name: fromName });
          await sleep(350);
          if (lvB && capNow > 0) {
            assetsNow += sdGain(take, sdLevel(it), lvB);
            if (assetsNow >= capNow && left > 0) {
              capStop = true;
              log('warn', `「${toName}」固资已经到/超过上限 ${fmt(capNow)}，后面的燃料用不上了，已停止`);
              break;
            }
          }
        } catch (err) {
          failed = `第 ${i + 1} 只「${fromName}」失败：${err && err.message ? err.message : err}`;
          log('fail', failed + ' · 已停止，请核对后再继续');
          break;
        }
      }

      await sleep(500);
      try {
        const t = await myTemple(to);
        if (t) {
          log('info', `「${toName}」固资 ${fmt(num(t.Assets))} / 上限 ${fmt(num(t.Sacrifices))}`);
          sdTargetInfo = {
            cid: String(to), lv: (sdTargetInfo && sdTargetInfo.cid === String(to) && sdTargetInfo.lv) || 0,
            name: (sdTargetInfo && sdTargetInfo.name) || t.Name || charaName(to),
            assets: num(t.Assets), cap: num(t.Sacrifices),
          };
          renderSdEstimate();
        }
      } catch (e) {}
      for (let k = 0; k < touched.length; k++) {
        const s = touched[k];
        try {
          const remain = await myShares(s.from);
          if (s.it) s.it.UserAmount = remain;
          if (remain <= 0) log('warn', `「${s.name}」已经没股了`);
        } catch (e) {}
      }
      persist();
      renderFuel();

      if (failed) {
        setSdStatus(`已消耗 ${fmt(used)} 股，中途停止：${failed}`);
      } else if (capStop) {
        log('ok', `本次合计消耗 ${fmt(used)} 股（已冲过上限，剩下的燃料未使用）`);
        setSdStatus(`已充能「${toName}」：消耗 ${fmt(used)} 股，固资已到/超过上限`);
      } else if (left > 0) {
        log('warn', `队列里的燃料都用完了，还差 ${fmt(left)} 股：可以再多选几只燃料`);
        setSdStatus(`已充能「${toName}」：消耗 ${fmt(used)} 股（还差 ${fmt(left)} 股，燃料不够）`);
      } else {
        log('ok', `本次合计消耗 ${fmt(used)} 股`);
        setSdStatus(`已充能「${toName}」：共消耗 ${fmt(used)} 股`);
      }
    } catch (err) {
      log('fail', '失败：' + (err && err.message ? err.message : err));
      setSdStatus('充能失败：' + (err && err.message ? err.message : err));
    } finally {
      sdRunning = false;
      busy = false;
      setButtonsDisabled(false);
    }
  }

  const ICO_TAX = 500000;
  const ICO_MIN_JOIN = 5000; // 单次注资下限
  const icoNeedNet = (lv) => (lv * (lv + 1) * (2 * lv + 1) * 100000) / 6;
  const icoNeedTotal = (lv) => icoNeedNet(lv) + ICO_TAX;
  const icoNeedUsers = (lv) => 10 + 5 * lv;

  function icoLevel(total, users) {
    const net = num(total) - ICO_TAX;
    let lv = 0;
    for (let n = 1; n <= 30; n++) {
      if (net < icoNeedNet(n) || num(users) < icoNeedUsers(n)) break;
      lv = n;
    }
    return lv;
  }

  const ICO_LISTED_LV = [2, 4, 5, 6, 7, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 11, 12, 12, 12];
  function icoListedLevel(lv) {
    const n = Math.max(1, Math.min(ICO_LISTED_LV.length, Math.floor(num(lv)) || 1));
    return ICO_LISTED_LV[n - 1];
  }

  function icoEndMs(r) {
    const t = Date.parse(String((r && r.end) || '').replace(/(\.\d{3})\d+/, '$1'));
    return Number.isFinite(t) ? t : 0;
  }

  function icoLeftText(end) {
    const t = Date.parse(String(end || '').replace(/(\.\d{3})\d+/, '$1'));
    if (!Number.isFinite(t)) return '';
    const ms = t - Date.now();
    if (ms <= 0) return '已结束';
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const p = (n) => String(n).padStart(2, '0');
    const hms = `${p(Math.floor((s % 86400) / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
    return d ? `${d}天 ${hms}` : hms;
  }

  function icoCfgOf(id) {
    const c = (S.icoCfg || {})[String(id)];
    return c && typeof c === 'object' ? c : null;
  }

  function setIcoStatus(msg) {
    if (els && els.icoStat) els.icoStat.textContent = msg;
  }

  function pushIcoLog(level, msg) {
    if (!els || !els.icoLog) return;
    const t = new Date().toTimeString().slice(0, 8);
    els.icoLog.appendChild(h('div', { class: `tgtk-log tgtk-log-${level}` }, `${t}  ${msg}`));
    els.icoLog.scrollTop = els.icoLog.scrollHeight;
  }

  async function loadIco(silent) {
    if (icoBusy) return;
    icoBusy = true;
    if (els && els.icoLoad) {
      els.icoLoad.disabled = true;
      if (!silent) els.icoLoad.textContent = '读取中…';
    }
    if (!silent) setIcoStatus('正在读取你参与注资的 ICO…');
    try {
      let arr = [];
      try {
        const a = await api('chara/user/assets/0/true');
        arr = (a && a.Initials) || [];
      } catch (e) {}
      if (!arr.length) {
        try {
          const key = await selfKey();
          if (key) {
            const v = await api(`chara/user/initial/${encodeURIComponent(key)}/1/48`);
            arr = (v && (v.Items || v)) || [];
          }
        } catch (e) {}
      }
      let market = [];
      try {
        const mv = await api('chara/mri/1/200');
        market = (mv && (mv.Items || mv)) || [];
      } catch (e) {}
      const byId = new Map();
      market.forEach((x) => {
        if (x && x.Id !== undefined && x.Id !== null) byId.set(String(x.Id), x);
      });
      const now = Date.now();
      icoRows = arr
        .map((x) => {
          const m = byId.get(String(x.Id)) || {};
          return {
            icoId: String(x.Id || m.Id || ''),
            cid: String(x.CharacterId || m.CharacterId || ''),
            name: x.Name || m.Name || '',
            end: x.End || m.End || '',
            total: num(m.Total) || num(x.Total),
            users: num(m.Users) || num(x.Users),
            mine: num(x.Amount || x.UserAmount || 0),
          };
        })
        .filter((r) => r.icoId && r.cid && icoEndMs(r) > now)
        .sort((a, b) => icoEndMs(a) - icoEndMs(b));
      icoLoaded = true;
      let patched = false;
      Object.keys(S.icoCfg || {}).forEach((id) => {
        const c = S.icoCfg[id] || {};
        const r = icoRows.find((x) => x.icoId === String(id));
        if (!r) return;
        if (c.cid === r.cid && c.end === r.end && c.name === (r.name || c.name)) return;
        S.icoCfg[id] = Object.assign({}, c, { cid: r.cid, end: r.end, name: r.name || c.name || '' });
        patched = true;
      });
      if (patched) persist();
      renderIco();
      setIcoStatus(
        icoRows.length
          ? `进行中 ${icoRows.length} 个 · 按剩余时间从少到多排列`
          : '没有进行中的 ICO（只列出还在募集期的）'
      );
    } catch (e) {
      setIcoStatus('读取失败：' + (e && e.message ? e.message : e));
    } finally {
      icoBusy = false;
      if (els && els.icoLoad) {
        els.icoLoad.disabled = false;
        els.icoLoad.textContent = '读取 ICO';
      }
    }
  }

  function renderIco() {
    if (!els || !els.icoList) return;
    const list = els.icoList;
    list.textContent = '';
    if (!icoRows.length) {
      list.appendChild(h('div', { class: 'tgtk-empty' }, '点「读取 ICO」拉取你参与注资的 ICO'));
      return;
    }
    const frag = HDOC.createDocumentFragment();
    icoRows.forEach((r) => {
      const lv = icoLevel(r.total, r.users);
      const cfg = icoCfgOf(r.icoId) || {};
      const on = !!cfg.on;
      const target = Math.max(1, Math.min(20, num(cfg.lv) || lv + 1));
      const sel = h('select', { class: 'tgtk-icosel', 'data-ico': r.icoId, title: '到最后一分钟还没到这个等级就自动补钱' });
      for (let n = 1; n <= 20; n++) sel.appendChild(h('option', { value: String(n) }, `Lv${n}`));
      sel.value = String(target);
      frag.appendChild(
        h(
          'div',
          { class: 'tgtk-icorow' + (on ? ' tgtk-on' : ''), 'data-ico': r.icoId },
          h(
            'div',
            { class: 'tgtk-icotop' },
            h('span', { class: 'tgtk-name', title: `#${r.cid}` }, r.name || charaName(r.cid)),
            h('span', { class: 'tgtk-ico-left', 'data-end': r.end }, icoLeftText(r.end))
          ),
          h(
            'div',
            { class: 'tgtk-icosub' },
            `Lv${lv} · ₵${fmt(r.total)} · ${fmt(r.users)} 人${r.mine ? ` · 我 ₵${fmt(r.mine)}` : ''}`
          ),
          !on && cfg.res ? h('div', { class: 'tgtk-icores' }, cfg.res) : null,
          h(
            'div',
            { class: 'tgtk-icoline' },
            h('span', { class: 'tgtk-mute' }, '目标'),
            sel,
            h(
              'span',
              { class: 'tgtk-icohint', title: '按官方对照表推算：这是该 ICO 等级上市后的角色等级' },
              `上市 Lv${icoListedLevel(target)}`
            ),
            h(
              'button',
              {
                class: 'tgtk-btn tgtk-mini' + (on ? ' tgtk-danger' : ''),
                type: 'button',
                'data-ico': r.icoId,
                'data-act': on ? 'off' : 'on',
              },
              on ? '停止' : '自动注资'
            )
          )
        )
      );
    });
    list.appendChild(frag);
  }

  function icoAdvMs() {
    return Math.max(1, Math.min(180, Math.floor(num(S.icoAdvance) || 1))) * 60000;
  }

  function icoPlans() {
    const out = [];
    const cfg = S.icoCfg || {};
    Object.keys(cfg).forEach((id) => {
      const c = cfg[id];
      if (!c || !c.on) return;
      const claim = num(c.claimAt);
      if (claim && Date.now() - claim < 20000) return;
      const r = icoRows.find((x) => x.icoId === String(id)) || {};
      const cid = String(r.cid || c.cid || '');
      out.push({
        id: String(id),
        cid: cid,
        lv: Math.max(1, Math.min(20, num(c.lv) || 1)),
        end: r.end || c.end || '',
        name: r.name || c.name || (cid ? charaName(cid) : '#' + id),
      });
    });
    return out;
  }

  function icoFinish(id, level, msg) {
    const cfg = icoCfgOf(id) || {};
    S.icoCfg[String(id)] = Object.assign({}, cfg, { on: false, res: msg, doneAt: Date.now(), claimAt: 0 });
    icoDone.add(String(id));
    persist();
    pushIcoLog(level, msg);
    if (S.tab === 'ico') renderIco();
  }

  function toggleIcoAuto(id) {
    const r = icoRows.find((x) => x.icoId === String(id));
    const cfg = icoCfgOf(id) || {};
    const name = (r && (r.name || charaName(r.cid))) || cfg.name || '#' + id;
    if (cfg.on) {
      S.icoCfg[String(id)] = Object.assign({}, cfg, { on: false, res: '' });
      persist();
      renderIco();
      pushIcoLog('warn', `已停止「${name}」的自动注资`);
      return;
    }
    const sel = els.icoList.querySelector(`.tgtk-icosel[data-ico="${id}"]`);
    const fallback = r ? icoLevel(r.total, r.users) + 1 : 1;
    const lv = Math.max(1, Math.min(20, num(sel && sel.value) || fallback));
    S.icoCfg[String(id)] = {
      lv: lv,
      on: true,
      cid: String((r && r.cid) || cfg.cid || ''),
      name: (r && r.name) || cfg.name || '',
      end: (r && r.end) || cfg.end || '',
      res: '',
      at: Date.now(),
    };
    persist();
    icoDone.delete(String(id));
    renderIco();
    startIcoTicker();
    pushIcoLog('ok', `「${name}」自动注资已开启：结束前 ${Math.round(icoAdvMs() / 60000)} 分钟若未达 Lv${lv}，自动补到该等级`);
    icoAutoCheck(); // 「提前」设得比较久时，刚开启可能就已经在窗口里了
  }

  async function icoBalance() {
    try {
      const v = await api('chara/user/assets/0/true');
      return num(v && v.Balance);
    } catch (e) {
      return null;
    }
  }

  let icoTimer = null;
  let icoAutoRunning = false;
  const icoDone = new Set(); // 本次会话里已经处理过的 ICO，避免重复注资
  const icoCool = new Map(); // 余额不足 / 请求失败时的冷却时间，别每秒都去查
  const icoLiveAt = new Map(); // 上一次拉服务端状态的时间：窗口期内最多 5 秒查一次

  function startIcoTicker() {
    if (icoTimer) return;
    icoTimer = setInterval(() => {
      try {
        HDOC.querySelectorAll('.tgtk-ico-left').forEach((el) => {
          el.textContent = icoLeftText(el.getAttribute('data-end'));
        });
      } catch (e) {}
      icoAutoCheck();
    }, 1000);
    setTimeout(() => icoAutoCheck(), 1200);
    WINS.forEach((w) => {
      try {
        w.addEventListener('focus', () => icoAutoCheck());
      } catch (e) {}
    });
    DOCS.forEach((d) => {
      try {
        d.addEventListener('visibilitychange', () => {
          if (!d.hidden) icoAutoCheck();
        });
      } catch (e) {}
    });
  }

  async function icoLive(cid) {
    if (!cid) return null;
    try {
      const v = await api('chara/' + cid);
      if (!v) return null;
      if (!v.End || num(v.Level) || v.ListedDate) return { listed: true };
      return {
        listed: false,
        icoId: String(v.Id || ''),
        total: num(v.Total),
        users: num(v.Users),
        end: v.End,
      };
    } catch (e) {
      return null;
    }
  }

  async function icoAutoCheck() {
    if (icoAutoRunning) return;
    const plans = icoPlans();
    if (!plans.length) return;
    const now = Date.now();
    const adv = icoAdvMs();
    const due = [];
    const stale = [];
    plans.forEach((p) => {
      if (icoDone.has(p.id)) return;
      if (num(icoCool.get(p.id)) > now) return;
      if (now - num(icoLiveAt.get(p.id)) < 5000) return;
      const t = icoEndMs({ end: p.end });
      if (!t) return; // 没有结束时间（旧版计划且没打开过 ICO 页），等 loadIco 补齐
      const leftTime = t - now;
      if (leftTime <= 0) stale.push(p);
      else if (leftTime <= adv) due.push(p);
    });
    if (!due.length && !stale.length) return;
    icoAutoRunning = true;
    try {
      const live = new Map();
      for (const p of due.concat(stale)) {
        icoLiveAt.set(p.id, Date.now());
        live.set(p.id, await icoLive(p.cid));
      }
      for (const p of stale) {
        if (icoDone.has(p.id)) continue;
        const v = live.get(p.id);
        if (!v) {
          icoCool.set(p.id, Date.now() + 30000);
          continue;
        }
        if (v.listed) {
          icoFinish(p.id, 'warn', `「${p.name}」ICO 已结束（结束前页面没开着，没能自动补款）`);
          continue;
        }
        const cfg = icoCfgOf(p.id) || {};
        S.icoCfg[p.id] = Object.assign({}, cfg, { end: v.end });
        persist();
        if (icoEndMs({ end: v.end }) - Date.now() <= adv) {
          const i = due.findIndex((x) => x.id === p.id);
          const np = Object.assign({}, p, { end: v.end });
          if (i >= 0) due[i] = np;
          else due.push(np);
        } else {
          pushIcoLog('info', `「${p.name}」结束时间更新为 ${v.end}，继续等待`);
        }
      }
      if (!due.length) return;

      const bal = await icoBalance();
      if (bal === null) {
        pushIcoLog('warn', '读不到账户余额，本轮先跳过自动注资');
        due.forEach((p) => icoCool.set(p.id, Date.now() + 10000));
        return;
      }
      let leftBal = bal;
      for (const p of due) {
        if (icoDone.has(p.id)) continue;
        const v = live.get(p.id);
        if (!v || v.listed) {
          if (v && v.listed) icoFinish(p.id, 'warn', `「${p.name}」ICO 已结束，没能自动补款`);
          else icoCool.set(p.id, Date.now() + 10000);
          continue;
        }
        const cur = icoLevel(v.total, v.users);
        if (cur >= p.lv) {
          icoFinish(p.id, 'info', `「${p.name}」已到 Lv${cur}，无需注资`);
          continue;
        }
        if (v.users < icoNeedUsers(p.lv)) {
          icoFinish(p.id, 'warn', `「${p.name}」人数 ${fmt(v.users)} < ${icoNeedUsers(p.lv)}，注资也到不了 Lv${p.lv}`);
          continue;
        }
        let need = Math.ceil(icoNeedTotal(p.lv) - v.total);
        if (need <= 0) {
          icoFinish(p.id, 'info', `「${p.name}」资金已够 Lv${p.lv}，无需注资`);
          continue;
        }
        need = Math.max(need, ICO_MIN_JOIN);
        if (leftBal < need) {
          icoCool.set(p.id, Date.now() + 15000);
          pushIcoLog('warn', `「${p.name}」补到 Lv${p.lv} 需要 ₵${fmt(need)}，可用余额只剩 ₵${fmt(leftBal)}`);
          continue;
        }
        const cur2 = icoCfgOf(p.id) || {};
        S.icoCfg[p.id] = Object.assign({}, cur2, { claimAt: Date.now() });
        persist();
        try {
          await api(`chara/join/${v.icoId || p.id}/${need}`, { method: 'POST', body: '{}' });
          leftBal -= need;
          icoFinish(p.id, 'ok', `「${p.name}」自动注资 ₵${fmt(need)} → 目标 Lv${p.lv}`);
        } catch (e) {
          icoFinish(p.id, 'fail', `「${p.name}」注资失败：${e && e.message ? e.message : e}`);
        }
      }
      if (S.tab === 'ico') await loadIco(true);
    } catch (e) {
      pushIcoLog('fail', '自动注资出错：' + (e && e.message ? e.message : e));
    } finally {
      icoAutoRunning = false;
    }
  }

  const LOG_PAGE = 200;
  const LOG_MAX_PAGE = 40;
  const TAX_RE = /个人所得税|所得税|股息税/;

  function logTs(v) {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    const s = String(v).trim();
    const t = Date.parse(s.replace(/(\.\d{3})\d+/, '$1'));
    return Number.isNaN(t) ? 0 : t;
  }

  function dayStartMs(offset) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (offset || 0));
    return d.getTime();
  }

  function fmtDay(ms) {
    const d = new Date(num(ms));
    return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
  }

  function parseDayMs(v) {
    const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function dayStr(ms) {
    const d = new Date(num(ms));
    return (
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    );
  }

  function logRange() {
    if (String(S.logDays) === 'custom') {
      const f = parseDayMs(S.logFrom);
      const t = parseDayMs(S.logTo);
      if (f != null || t != null) {
        const from = f != null ? f : t - 6 * 86400000;
        let to = (t != null ? t : from) + 86400000;
        if (to <= from) to = from + 86400000; // 起止填反了也给一天
        return { from, to, days: Math.round((to - from) / 86400000), custom: true };
      }
    }
    const days = Math.max(1, Math.min(90, Math.floor(num(S.logDays) || 7)));
    return { from: dayStartMs(days - 1), to: dayStartMs(-1), days, custom: false };
  }

  function logRangeLabel(r) {
    const g = r || logRange();
    return g.custom ? `${fmtDay(g.from)} ~ ${fmtDay(g.to - 1)}（${g.days} 天）` : `近 ${g.days} 天`;
  }

  function descCharaId(desc) {
    const m = String(desc || '').match(/#(\d+)/);
    return m ? num(m[1]) : 0;
  }

  function descAmount(desc) {
    const m = String(desc || '').match(/([\d,]+(?:\.\d+)?)\s*股/);
    return m ? num(m[1].replace(/,/g, '')) : 0;
  }

  function fmtCc(v) {
    const n = num(v);
    if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + ' 亿';
    if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(2) + ' 万';
    return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  }

  function logStats() {
    let income = 0;
    let expense = 0;
    let inN = 0;
    let outN = 0;
    const map = new Map();

    logAll.forEach((x) => {
      const ch = num(x.Change);
      if (ch > 0) {
        income += ch;
        inN++;
      } else if (ch < 0) {
        expense += -ch;
        outN++;
      }

      let amt = x.Amount === undefined || x.Amount === null ? descAmount(x.Description) : num(x.Amount);
      if (!amt) return;

      let id = x.RelatedId === undefined || x.RelatedId === null ? descCharaId(x.Description) : num(x.RelatedId);
      if (!id) return;

      const kind = classifyKind(x.Description, amt, ch, x.Type);
      if (/星之力/.test(String(x.Description || ''))) return;
      if (kind === 'sell' && ch <= 0) return;

      let rec = map.get(id);
      if (!rec) {
        rec = { id, gain: 0, loss: 0 };
        map.set(id, rec);
      }
      if (kind === 'sell' || kind === 'sacrifice') rec.loss += Math.abs(amt);
      else if (amt > 0) rec.gain += amt;
      else rec.loss += -amt;
    });

    return { income, expense, inN, outN, chars: [...map.values()] };
  }

  function classifyKind(desc, amt, ch, type) {
    const s = String(desc || '');
    if (TAX_RE.test(s)) return 'tax';
    if (/竞拍|拍卖/.test(s) && /分红|分成/.test(s)) return 'aucbonus';
    if (/股息/.test(s)) return 'dividend';
    if (/刮刮乐|彩票/.test(s)) return 'scratch';
    const t = LOG_TYPE[num(type)];
    if (t && t !== 'other') return t;
    if (!s) return 'other';
    for (let i = 0; i < FLOW_RULES.length; i++) {
      const r = FLOW_RULES[i];
      for (let j = 0; j < r.kw.length; j++) {
        if (s.includes(r.kw[j])) return r.key;
      }
    }
    if (/ico/i.test(s)) return 'ico';
    const a = num(amt);
    const c = num(ch);
    if (a > 0 && c < 0) return 'buy'; // 花 cc 换到股
    if (a < 0 && c > 0) return 'sell'; // 出股换回 cc
    return 'other';
  }

  function fixedKind(desc) {
    const s = String(desc || '');
    if (!s) return null;
    for (let i = 0; i < FIXED_RULES.length; i++) {
      if (FIXED_RULES[i].test(s)) return FIXED_RULES[i];
    }
    if (s.includes('固定资产') || s.includes('固资') || s.includes('圣殿')) return { key: 'other', label: '其他' };
    return null;
  }

  function parseFixed(desc) {
    const s = String(desc || '');
    let m = s.match(/([\d,]+(?:\.\d+)?)\s*(?:股|点)?\s*固定资产/) || s.match(/固定资产[^\d\-−]{0,12}([\d,]+(?:\.\d+)?)/);
    if (m) return num(String(m[1]).replace(/,/g, ''));
    m = s.match(/([\d,]+(?:\.\d+)?)\s*点/);
    if (m) return num(String(m[1]).replace(/,/g, ''));
    return 0;
  }

  function parseFixedShares(desc) {
    const s = String(desc || '');
    if (/固定资产/.test(s)) return 0;
    const m = s.match(/([\d,]+(?:\.\d+)?)\s*股/);
    return m ? num(String(m[1]).replace(/,/g, '')) : 0;
  }

  function ledgerStats() {
    const buckets = {
      fundIn: new Map(),
      fundOut: new Map(),
      stockIn: new Map(),
      stockOut: new Map(),
      fixedIn: new Map(),
      fixedOut: new Map(),
    };
    let cc = 0;
    let ccTs = 0;
    const tax = { sum: 0, n: 0 };
    const hitMap = new Map();
    const auctionBack = { sum: 0, n: 0 }; // 竞拍失败返还，最后从「竞拍」支出里扣
    const buyBack = { sum: 0, n: 0 }; // 取消买入 / 冰山撤回的返还，最后从「买入」支出里扣
    let scratchBuys = 0; // 刮刮乐「购买」次数（每次 -1000 cc 一条），用来当次数，别用奖励行数

    const add = (map, key, label, val, desc) => {
      let r = map.get(key);
      if (!r) {
        r = { key, label, sum: 0, n: 0, samples: [] };
        map.set(key, r);
      }
      r.sum += Math.abs(val);
      r.n++;
      if (key === 'other' && r.samples.length < 4 && desc) {
        const s = String(desc).slice(0, 32);
        if (!r.samples.includes(s)) r.samples.push(s);
      }
    };

    logAll.forEach((x) => {
      const desc = x.Description;
      const ch = num(x.Change);
      const rawAmt = x.Amount === undefined || x.Amount === null ? descAmount(desc) : x.Amount;
      const amt = num(rawAmt);
      const kind = classifyKind(desc, amt, ch, x.Type);
      if (kind === 'scratch' && ch < 0) scratchBuys++;

      const put = (map, allowed, val) => {
        const k = allowed.includes(kind) ? kind : 'other';
        add(map, k, FLOW_LABEL[k] || '其他', val, desc);
      };

      if (ch > 0) {
        if (kind === 'auction') {
          auctionBack.sum += ch;
          auctionBack.n++;
        } else if (kind === 'buy') {
          buyBack.sum += ch;
          buyBack.n++;
        } else put(buckets.fundIn, FUND_IN_KINDS, ch);
      } else if (ch < 0) {
        if (kind === 'tax' || TAX_RE.test(String(desc || ''))) {
          tax.sum += -ch;
          tax.n++;
        } else put(buckets.fundOut, FUND_OUT_KINDS, -ch);
      }

      const ds = String(desc || '');
      const isGuideHit = /虚空道标/.test(ds) && !/获得/.test(ds) && /受到|被|你的圣殿/.test(ds);

      if (/星之力/.test(ds)) {
      } else if (isGuideHit) {
      } else if (kind === 'sell') {
        if (ch > 0 && amt) put(buckets.stockOut, STOCK_OUT_KINDS, Math.abs(amt));
      } else if (kind === 'sacrifice' && amt) {
        put(buckets.stockOut, STOCK_OUT_KINDS, Math.abs(amt));
      } else if (amt > 0) put(buckets.stockIn, STOCK_IN_KINDS, amt);
      else if (amt < 0) put(buckets.stockOut, STOCK_OUT_KINDS, -amt);

      const fk = fixedKind(desc);
      const fAmt = isGuideHit ? Math.abs(num(x.Amount)) || parseFixed(desc) : parseFixed(desc);
      if (fk && fAmt > 0) {
        const sAmt = isGuideHit ? 0 : parseFixedShares(desc);
        const gain = /获得|增加|补充|恢复|注入/.test(String(desc || ''));
        add(gain ? buckets.fixedIn : buckets.fixedOut, fk.key, fk.label, fAmt, desc);
        if (!gain && fk.key === 'guidepost') {
          const hid = descCharaId(desc) || num(x.RelatedId);
          if (hid) {
            const rec = hitMap.get(hid) || { id: hid, sum: 0, shares: 0, n: 0 };
            rec.sum += fAmt;
            rec.shares += sAmt;
            rec.n++;
            hitMap.set(hid, rec);
          }
        }
      }

      const b = num(x.Balance);
      const ts = logTs(x.LogTime);
      if (b > 0 && ts >= ccTs) {
        cc = b;
        ccTs = ts;
      }
    });

    if (scratchBuys > 0) {
      const scRow = buckets.stockIn.get('scratch');
      if (scRow) {
        scRow.n = scratchBuys;
        scRow.countBy = 'buy';
      }
    }

    const div = buckets.fundIn.get('dividend');
    if (tax.sum > 0 && div) {
      div.gross = div.sum;
      div.tax = tax.sum;
      div.taxN = tax.n;
      div.sum = Math.max(0, div.sum - tax.sum);
    }

    if (auctionBack.sum > 0) {
      const r = buckets.fundOut.get('auction');
      if (r && r.sum > 0) {
        r.refund = auctionBack.sum;
        r.refundN = auctionBack.n;
        r.sum = Math.max(0, r.sum - auctionBack.sum);
      } else {
        add(buckets.fundIn, 'auction', FLOW_LABEL.auction, auctionBack.sum, '竞拍失败返还');
        const row = buckets.fundIn.get('auction');
        if (row) row.n = auctionBack.n;
      }
    }

    if (buyBack.sum > 0) {
      const r = buckets.fundOut.get('buy');
      if (r && r.sum > 0) {
        r.refund = buyBack.sum;
        r.refundN = buyBack.n;
        r.sum = Math.max(0, r.sum - buyBack.sum);
      } else {
        add(buckets.fundIn, 'buy', FLOW_LABEL.buy, buyBack.sum, '买入退回');
        const row = buckets.fundIn.get('buy');
        if (row) row.n = buyBack.n;
      }
    }

    const pack = (map, keepZero) => {
      const rows = [...map.values()].filter((r) => (keepZero ? r.n > 0 : r.sum > 0 || r.tax > 0));
      rows.sort((a, b) => b.sum - a.sum);
      const total = rows.reduce((s, r) => s + r.sum, 0);
      rows.forEach((r) => {
        r.pct = total ? r.sum / total : 0;
        r.blind = r.sum <= 0; // 有次数但没抠出数值
      });
      return { rows, total, n: rows.reduce((s, r) => s + r.n, 0) };
    };

    return {
      fundIn: pack(buckets.fundIn),
      fundOut: pack(buckets.fundOut),
      stockIn: pack(buckets.stockIn),
      stockOut: pack(buckets.stockOut),
      fixedIn: pack(buckets.fixedIn, true),
      fixedOut: pack(buckets.fixedOut, true),
      hits: [...hitMap.values()]
        .filter((x) => x.sum > 0 || x.shares > 0)
        .sort((a, b) => b.sum - a.sum || b.shares - a.shares),
      tax,
      auctionBack,
      cc,
    };
  }

  function balanceSeries(days) {
    const cut = Date.now() - Math.max(1, num(days) || 30) * 86400000;
    const byDay = new Map();
    logAll.forEach((x) => {
      const ts = logTs(x.LogTime);
      const v = num(x.Balance);
      if (!ts || ts < cut || v <= 0) return;
      const d = new Date(ts);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const prev = byDay.get(key);
      if (!prev || ts >= prev.t) byDay.set(key, { d: key, t: ts, v });
    });
    return [...byDay.values()].sort((a, b) => (a.d < b.d ? -1 : 1));
  }

  function assetSeries() {
    const series = balanceSeries(9999);
    if (series.length >= 2) return { pts: series, label: '账户余额' };
    const pts = snaps.map((s) => ({ d: s.d, v: s.cc + (s.mv || 0) }));
    return { pts, label: '总资产' };
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgNode(tag, attrs) {
    const el = HDOC.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined) continue;
        el.setAttribute(k, v);
      }
    }
    return el;
  }

  function sparkline(pts, color) {
    const wrap = h('div', { class: 'tgtk-sparkwrap' });
    if (!pts || !pts.length) {
      wrap.appendChild(h('div', { class: 'tgtk-sparkempty' }, '暂无走势数据'));
      return wrap;
    }
    if (pts.length === 1) {
      wrap.appendChild(h('div', { class: 'tgtk-sparkempty' }, `仅 1 天数据（${pts[0].d}）· 攒几天就能看趋势`));
      return wrap;
    }
    const W = 100;
    const H = 34;
    const PAD = 3;
    const vals = pts.map((p) => num(p.v));
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    if (max - min < 1e-9) max = min + Math.max(1, Math.abs(min) * 0.01);
    const span = max - min;
    const step = W / (pts.length - 1);
    const xy = vals.map((v, i) => [i * step, H - PAD - ((v - min) / span) * (H - PAD * 2)]);
    const line = xy.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(2)},${c[1].toFixed(2)}`).join('');
    const svg = svgNode('svg', {
      class: 'tgtk-spark',
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: 'none',
    });
    svg.appendChild(svgNode('path', { d: `${line}L${W},${H}L0,${H}Z`, class: 'tgtk-spark-area', fill: color }));
    svg.appendChild(
      svgNode('path', {
        d: line,
        class: 'tgtk-spark-line',
        stroke: color,
        'vector-effect': 'non-scaling-stroke',
      })
    );
    wrap.appendChild(svg);
    return wrap;
  }

  function logCharRows(st) {
    const rows = st.chars.slice();
    const net = (x) => x.gain - x.loss;
    if (S.logSort === 'gain') rows.sort((a, b) => b.gain - a.gain);
    else if (S.logSort === 'loss') rows.sort((a, b) => b.loss - a.loss);
    else if (S.logSort === 'netUp') rows.sort((a, b) => net(b) - net(a));
    else if (S.logSort === 'netDown') rows.sort((a, b) => net(a) - net(b));
    else rows.sort((a, b) => b.gain + b.loss - (a.gain + a.loss));
    const top = Math.max(1, Math.floor(num(S.logTop) || 20));
    return { rows: rows.slice(0, top), count: rows.length };
  }

  async function scanLogs() {
    if (busy) return;
    busy = true;
    setButtonsDisabled(true);
    logAll = [];
    els.logList.textContent = '';

    try {
      const range = logRange();
      const winFrom = range.from;
      const winTo = range.to;
      logWindow = range;
      const cutoff = winFrom;
      let page = 1;
      let pages = 1;
      let reached = false;

      do {
        if (!busy) break;
        const v = await api(`chara/user/balance/${page}/${LOG_PAGE}`);
        const items = v.Items || [];
        pages = num(v.TotalPages) || 1;

        for (let i = 0; i < items.length; i++) {
          const ts = logTs(items[i].LogTime);
          if (ts && ts < cutoff) {
            reached = true;
            break;
          }
          if (ts && winTo && ts >= winTo) continue;
          logAll.push(items[i]);
        }

        setLogStatus(`读取 ${logAll.length} 条…（第 ${page} / ${pages} 页）`);
        if (reached) break;

        page++;
        if (page <= pages && page <= LOG_MAX_PAGE) await sleep(140);
      } while (page <= pages && page <= LOG_MAX_PAGE);

      const nameIds = [];
      logAll.forEach((x) => {
        const id = num(x.RelatedId);
        if (id) nameIds.push(id);
        if (/虚空道标/.test(String(x.Description || ''))) {
          const did = descCharaId(x.Description);
          if (did) nameIds.push(did);
        }
      });
      await loadNames([...new Set(nameIds)]);
      const st = ledgerStats();
      if (st.cc > 0) {
        const mv = holdAll.reduce((s, x) => s + num(x.UserAmount) * num(x.Current), 0);
        recordSnapshot(st.cc, mv);
      }
      renderLedger();

      if (!logAll.length) setLogStatus('这段时间没有资金日志');
      else if (!logStats().chars.length) {
        setLogStatus(`${logAll.length} 条日志，但接口没给出股数变化（Amount），无法统计角色`);
      }
    } catch (err) {
      setLogStatus('出错：' + (err && err.message ? err.message : err));
    } finally {
      busy = false;
      setButtonsDisabled(false);
    }
  }

  function flowRow(r, unit, dir) {
    const hasSamples = r.key === 'other' && r.samples && r.samples.length;
    const detail = hasSamples ? '其他明细：' + r.samples.join(' / ') : '';
    const tip = detail || r.label;
    const val =
      unit === 'fx'
        ? r.blind
          ? '—'
          : fmt(r.sum) + ' 点'
        : unit === 'cc'
          ? '₵' + fmtCc(r.sum)
          : fmt(r.sum);
    return h(
      'div',
      {
        class: 'tgtk-flowrow',
        title: tip,
      },
      h(
        'span',
        {
          class: 'tgtk-flowname' + (hasSamples ? ' tgtk-hasdetail' : ''),
          title: r.tax
            ? `税前 ₵${fmtCc(r.gross)}，已扣税 ₵${fmtCc(r.tax)}`
            : r.refund
              ? `已扣除竞拍失败返还 ₵${fmtCc(r.refund)}（${r.refundN} 笔）`
              : detail || null,
        },
        r.label
      ),
      h(
        'span',
        { class: 'tgtk-flowbar' },
        h('i', { class: dir === 'in' ? 'up' : 'down', style: `width:${Math.max(3, Math.round(r.pct * 100))}%` })
      ),
      h('b', { class: 'tgtk-flowval' }, val),
      h('span', { class: 'tgtk-flown' }, r.n + ' 次')
    );
  }

  function flowBlock(title, unit, dir, data, note) {
    const total = data.total > 0 ? (unit === 'cc' ? '₵' + fmtCc(data.total) : fmt(data.total) + (unit === 'fx' ? ' 点' : ' 股')) : '—';
    const kids = [
      h(
        'div',
        { class: 'tgtk-flowhead' },
        h('span', null, title),
        data.total > 0
          ? h('b', { class: dir === 'in' ? 'tgtk-up' : 'tgtk-down' }, (dir === 'in' ? '+' : '-') + total)
          : null,
        data.n > 0 ? h('i', null, data.n + ' 次') : null
      ),
    ];
    if (!data.rows.length) kids.push(h('div', { class: 'tgtk-flowempty' }, '暂无'));
    else data.rows.forEach((r) => kids.push(flowRow(r, unit, dir)));
    if (note) kids.push(h('div', { class: 'tgtk-flownote' }, note));
    return h('div', { class: 'tgtk-flowblk' }, kids);
  }

  function renderLedger() {
    const st = ledgerStats();
    const cls = logStats();
    const { rows, count } = logCharRows(cls);
    const view = S.ledgerView === 'stock' || S.ledgerView === 'fixed' ? S.ledgerView : 'fund';
    const isFund = view === 'fund';
    const isFixed = view === 'fixed';
    const mv = holdAll.reduce((s, x) => s + num(x.UserAmount) * num(x.Current), 0);
    const cc = st.cc || (snaps.length ? snaps[snaps.length - 1].cc : 0);

    const win = logWindow;
    const span = win
      ? `${fmtDay(win.from)} 0:00 ~ ${fmtDay(win.to - 1)} 24:00`
      : (() => {
          const times = logAll.map((x) => logTs(x.LogTime)).filter(Boolean);
          return times.length
            ? `${fmtDay(Math.min(...times))} ~ ${fmtDay(Math.max(...times))}`
            : '';
        })();

    const { pts, label } = assetSeries();
    const first = pts.length ? num(pts[0].v) : 0;
    const last = pts.length ? num(pts[pts.length - 1].v) : 0;
    const diff = last - first;
    const rate = first > 0 ? (diff / first) * 100 : 0;

    els.assetBox.textContent = '';
    els.assetBox.appendChild(
      h(
        'div',
        { class: 'tgtk-assettop' },
        h('div', { class: 'tgtk-assetcell' }, h('i', null, '账户余额'), h('b', null, cc > 0 ? '₵' + fmtCc(cc) : '—')),
        h('div', { class: 'tgtk-assetcell' }, h('i', null, '持仓市值'), h('b', null, mv > 0 ? '₵' + fmtCc(mv) : '—')),
        h(
          'div',
          { class: 'tgtk-assetcell' },
          h('i', null, '合计'),
          h('b', null, mv > 0 ? '₵' + fmtCc(cc + mv) : '—')
        )
      )
    );
    els.assetBox.appendChild(sparkline(pts, diff >= 0 ? 'var(--tg-up)' : 'var(--tg-down)'));
    if (pts.length >= 2) {
      els.assetBox.appendChild(
        h(
          'div',
          { class: 'tgtk-assetfoot' },
          h('span', null, `${pts.length} 天 · ${label}`),
          h(
            'b',
            { class: diff >= 0 ? 'tgtk-up' : 'tgtk-down' },
            `${diff >= 0 ? '+' : '-'}₵${fmtCc(Math.abs(diff))}（${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%）`
          )
        )
      );
    }

    const fundNote = (() => {
      const d = st.fundIn.rows.find((r) => r.key === 'dividend');
      return d && d.tax ? `股息已按税后计，扣个人所得税 ₵${fmtCc(d.tax)}（${d.taxN} 笔）` : '';
    })();
    const aucRow = st.fundOut.rows.find((r) => r.key === 'auction' && r.refund);
    const buyRow = st.fundOut.rows.find((r) => r.key === 'buy' && r.refund);
    const outNote = [
      aucRow ? `竞拍已扣除失败返还 ₵${fmtCc(aucRow.refund)}（${aucRow.refundN} 笔）` : '',
      buyRow ? `买入已扣除撤单 / 冰山退回 ₵${fmtCc(buyRow.refund)}（${buyRow.refundN} 笔）` : '',
    ]
      .filter(Boolean)
      .join('；');
    els.flowBox.textContent = '';
    els.flowBox.appendChild(
      h(
        'div',
        { class: 'tgtk-flowgrid' },
        view === 'fund'
          ? [flowBlock('资金收入', 'cc', 'in', st.fundIn, fundNote), flowBlock('资金支出', 'cc', 'out', st.fundOut, outNote)]
          : view === 'stock'
            ? [flowBlock('股数获得', 'sh', 'in', st.stockIn), flowBlock('股数损失', 'sh', 'out', st.stockOut)]
            : [flowBlock('固资损失', 'fx', 'out', st.fixedOut), flowBlock('固资获得', 'fx', 'in', st.fixedIn)]
      )
    );

    els.segBtns.forEach((b) => b.classList.toggle('tgtk-on', b.dataset.view === view));

    els.logStat.textContent =
      `${logAll.length} 条记录` +
      (span ? ` · ${span}` : '') +
      (view === 'stock' ? ` · ${count} 个角色有股数变动` : '') +
      (isFixed ? ' · 固资数值按日志描述解析' : '');

    els.logList.textContent = '';
    els.logList.hidden = view === 'fund';
    els.sortWrap.hidden = view !== 'stock';

    if (isFixed) {
      if (!st.hits.length) {
        if (logAll.length) els.logList.appendChild(h('div', { class: 'tgtk-empty' }, logRangeLabel() + '没有被虚空道标命中的记录'));
        return;
      }
      els.logList.appendChild(
        h('div', { class: 'tgtk-blocktitle' }, `被道标命中 · 按角色（${st.hits.length}）`)
      );
      const frag = HDOC.createDocumentFragment();
      st.hits.forEach((x) => {
        frag.appendChild(
          h(
            'div',
            { class: 'tgtk-row' },
            h(
              'div',
              { class: 'tgtk-main' },
              charaLink(x.id, charaName(x.id)),
              h(
                'span',
                { class: 'tgtk-sub' },
                `命中 ${x.n} 次` + (x.shares > 0 ? ` · 另扣股 ${fmt(x.shares)}` : '')
              )
            ),
            x.sum > 0
              ? h('div', { class: 'tgtk-val' }, h('b', { class: 'tgtk-down' }, '-' + fmt(x.sum)), h('span', null, ' 点'))
              : h('div', { class: 'tgtk-val' }, h('span', { class: 'tgtk-mutev' }, '仅扣股'))
          )
        );
      });
      els.logList.appendChild(frag);
      return;
    }

    if (view !== 'stock') return;

    if (!rows.length) {
      if (logAll.length) els.logList.appendChild(h('div', { class: 'tgtk-empty' }, '没有统计到角色股数变化'));
      return;
    }

    const frag = HDOC.createDocumentFragment();
    rows.forEach((x) => {
      const name = charaName(x.id) || `#${x.id}`;
      const net = x.gain - x.loss;
      frag.appendChild(
        h(
          'div',
          { class: 'tgtk-row' },
          h(
            'div',
            { class: 'tgtk-main' },
            charaLink(x.id, name),
            h('span', { class: 'tgtk-sub' }, `净 ${net >= 0 ? '+' : ''}${fmt(net)} 股`)
          ),
          h(
            'div',
            { class: 'tgtk-val tgtk-dual' },
            h('b', { class: 'tgtk-up', title: '获得' }, '+' + fmt(x.gain)),
            h('span', { class: 'tgtk-down', title: '失去' }, '-' + fmt(x.loss))
          )
        )
      );
    });
    els.logList.appendChild(frag);
  }

  function copyLogs() {
    if (!logAll.length) return setLogStatus('没有可复制的数据');
    const st = ledgerStats();
    const view = S.ledgerView === 'stock' || S.ledgerView === 'fixed' ? S.ledgerView : 'fund';
    const lines = [];

    if (view === 'fund') {
      lines.push(`资金收支（${logRangeLabel()}）`, '方向\t来源\t金额\t笔数');
      [
        ['收入', st.fundIn],
        ['支出', st.fundOut],
      ].forEach(([d, data]) => {
        lines.push([d, '合计', data.total.toFixed(2), data.n].join('\t'));
        data.rows.forEach((r) => lines.push([d, r.label, r.sum.toFixed(2), r.n].join('\t')));
      });
      const dv = st.fundIn.rows.find((r) => r.key === 'dividend');
      if (dv && dv.tax) lines.push('', `股息为税后值：税前 ${dv.gross.toFixed(2)}，个人所得税 ${dv.tax.toFixed(2)}（${dv.taxN} 笔）`);
      const ar = st.fundOut.rows.find((r) => r.key === 'auction' && r.refund);
      if (ar) lines.push(`竞拍为净额：已扣除失败返还 ${ar.refund.toFixed(2)}（${ar.refundN} 笔）`);
      const br = st.fundOut.rows.find((r) => r.key === 'buy' && r.refund);
      if (br) lines.push(`买入为净额：已扣除撤单 / 冰山退回 ${br.refund.toFixed(2)}（${br.refundN} 笔）`);
    } else if (view === 'stock') {
      lines.push(`股数增减（${logRangeLabel()}）`, '方向\t来源\t股数\t次数');
      [
        ['获得', st.stockIn],
        ['损失', st.stockOut],
      ].forEach(([d, data]) => {
        lines.push([d, '合计', data.total, data.n].join('\t'));
        data.rows.forEach((r) => lines.push([d, r.label, r.sum, r.n].join('\t')));
      });
      const { rows } = logCharRows(logStats());
      lines.push('', '角色\t获得股\t失去股\t净变化');
      rows.forEach((x) => {
        lines.push([charaName(x.id) || '#' + x.id, x.gain, x.loss, x.gain - x.loss].join('\t'));
      });
    } else {
      lines.push(`圣殿固资变动（${logRangeLabel()}）`, '方向\t来源\t固资\t次数');
      [
        ['损失', st.fixedOut],
        ['获得', st.fixedIn],
      ].forEach(([d, data]) => {
        lines.push([d, '合计', data.total, data.n].join('\t'));
        data.rows.forEach((r) => lines.push([d, r.label, r.sum, r.n].join('\t')));
      });
      if (st.hits.length) {
        lines.push('', '被道标命中\t角色\t损失固资\t扣股\t次数');
        st.hits.forEach((x) => lines.push(['', charaName(x.id), x.sum, x.shares || 0, x.n].join('\t')));
      }
    }

    copyText(lines.join('\n'), (m) => setLogStatus(m + ' ' + (lines.length - 1) + ' 行'));
  }

  function line(label, ...nodes) {
    return h('div', { class: 'tgtk-line' }, h('span', { class: 'tgtk-label' }, label), ...nodes);
  }

  function input(id, value, attrs) {
    return h('input', {
      id,
      type: 'text',
      autocomplete: 'off',
      name: 'tgtk-f-' + String(id).replace(/[^a-z0-9-]/gi, '') + '-' + HOST_TOKEN.slice(-6),
      value: value === undefined || value === null ? '' : String(value),
      ...(attrs || {}),
    });
  }

  function select(id, options, value) {
    const el = h('select', { id }, options.map(([v, t]) => h('option', { value: v }, t)));
    el.value = value;
    return el;
  }

  function buildUI() {
    const fab = HDOC.getElementById('tgtk-fab');

    const tabDefs = [
      ['temple', '筛塔'],
      ['hold', '持股'],
      ['fantasy', '幻想乡'],
      ['fav', '收藏'],
      ['magic', '道具'],
      ['ico', 'ICO'],
      ['cover', '圣殿'],
      ['log', '账本'],
    ];
    const tabBtns = tabDefs.map(([k, t]) =>
      h('button', { class: 'tgtk-tab', type: 'button', 'data-tab': k }, t)
    );

    const thr = h('input', { id: 'tgtk-thr', type: 'number', min: '0', step: '10', value: String(S.threshold) });
    const field = select(
      'tgtk-field',
      [
        ['Assets', '当前固定资产'],
        ['Sacrifices', '固定资产上限'],
      ],
      S.field
    );
    const coverSel = select(
      'tgtk-cover',
      [
        ['default', '未换过塔图'],
        ['custom', '已换过塔图'],
      ],
      S.cover === 'custom' ? 'custom' : 'default'
    );
    const chkAssets = h('input', { id: 'tgtk-filassets', type: 'checkbox' });
    chkAssets.checked = S.filAssets !== false;
    const chkCover = h('input', { id: 'tgtk-filcover', type: 'checkbox' });
    chkCover.checked = !!S.filCover;
    const srcBtns = ['current', 'user', 'chars'].map((m) =>
      h(
        'button',
        { class: 'tgtk-tab tgtk-subtab', type: 'button', 'data-source': m },
        m === 'current' ? '当前角色' : m === 'user' ? '我的塔' : '角色列表'
      )
    );
    const tUser = input('tgtk-user', S.username, { placeholder: 'bgm 用户名，例如 sai' });
    const tChars = h('textarea', {
      id: 'tgtk-chars',
      rows: '3',
      placeholder: '角色 ID，逗号或换行分隔，例如 1,2,32',
    });
    tChars.value = S.chars;
    const tCtxChars = h('div', { class: 'tgtk-ctx', 'data-ctx': 'chars' }, tChars);
    const tRun = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '扫描');
    const tCopy = h('button', {
      class: 'tgtk-btn', type: 'button', title: '复制当前筛出的全部角色 ID（空格分隔）',
    }, '复制');
    const templeStat = h('div', { class: 'tgtk-stat' }, '设置阈值后点扫描');
    const templeList = h('div', { class: 'tgtk-list' });

    const ensureTempleUser = () => {
      if (String(tUser.value || '').trim()) return;
      const g = guessedUsername();
      if (!g) return;
      tUser.value = g;
      S.username = g;
      persist();
    };
    ensureTempleUser();

    const templeView = h(
      'div',
      { class: 'tgtk-view', 'data-view': 'temple' },
      h(
        'div',
        { class: 'tgtk-line' },
        h('span', { class: 'tgtk-label' }, '固定资产 <'),
        thr,
        field,
        h(
          'label',
          { class: 'tgtk-chk tgtk-chkend', title: '勾上 = 按这个条件筛选；不勾 = 这个条件不参与（两个都不勾 = 显示全部）' },
          chkAssets
        )
      ),
      h(
        'div',
        { class: 'tgtk-line' },
        h('span', { class: 'tgtk-label' }, '塔图'),
        coverSel,
        h(
          'label',
          { class: 'tgtk-chk tgtk-chkend', title: '勾上 = 按这个条件筛选；不勾 = 这个条件不参与（两个都不勾 = 显示全部）' },
          chkCover
        ),
        h(
          'span',
          { class: 'tgtk-userwrap' },
          h('span', { class: 'tgtk-label' }, '用户名'),
          tUser
        )
      ),
      h('div', { class: 'tgtk-tabs' }, srcBtns),
      tCtxChars,
      h('div', { class: 'tgtk-line tgtk-actions' }, tRun, tCopy),
      h('div', { class: 'tgtk-note' },
        `筛选前提：只统计已建成圣殿（固定资产上限 ≥ ${TEMPLE_MIN_CAP}）；上限不足的未建成塔会自动排除`),
      templeStat,
      templeList
    );

    const hSearch = input('tgtk-holdsearch', S.holdQuery || '', {
      placeholder: '角色名 / 完整 ID，多个用空格隔开',
    });
    const hSearchFav = favBtn();
    const lvMin = h('input', { id: 'tgtk-lvmin', type: 'number', min: '0', placeholder: '最低', value: S.lvMin });
    const lvMax = h('input', { id: 'tgtk-lvmax', type: 'number', min: '0', placeholder: '最高', value: S.lvMax });
    const minAmt = h('input', { id: 'tgtk-minamt', type: 'number', min: '0', placeholder: '0', value: S.minAmount });
    const sortSel = select(
      'tgtk-sort',
      [
        ['levelDesc', '等级从高到低'],
        ['levelAsc', '等级从低到高'],
        ['amountDesc', '持股数从多到少'],
        ['valueDesc', '市值从高到低'],
      ],
      S.sortBy
    );
    const hRun = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '扫描');
    const hCopy = h('button', {
      class: 'tgtk-btn', type: 'button', title: '复制当前筛出的全部角色 ID（空格分隔）',
    }, '复制');
    const holdStat = h('div', { class: 'tgtk-stat' }, '读取自己的全部持仓，可按角色名 / ID、等级区间筛选');
    const holdList = h('div', { class: 'tgtk-list' });

    const holdView = h(
      'div',
      { class: 'tgtk-view', 'data-view': 'hold' },
      line('角色', hSearch, hSearchFav, clearBtn(hSearch)),
      h(
        'div',
        { class: 'tgtk-line' },
        h('span', { class: 'tgtk-label' }, '等级'),
        lvMin,
        h('span', { class: 'tgtk-dash' }, '—'),
        lvMax,
        h('span', { class: 'tgtk-label' }, '最少持股'),
        minAmt
      ),
      line('排序', sortSel),
      h('div', { class: 'tgtk-line tgtk-actions' }, hRun, hCopy),
      holdStat,
      holdList
    );

    const fInput = input('tgtk-fchars', S.fchars || currentCharacterId(), {
      placeholder: '角色 ID，可多个（逗号分隔）',
    });
    if (!S.fchars && fInput.value) S.fchars = fInput.value;
    const fInputFav = favBtn();
    const fRun = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '查询');
    const fStat = h('div', { class: 'tgtk-stat' }, '查询「幻想乡」持有该角色的股数与占比');
    const fList = h('div', { class: 'tgtk-list' });

    const fantasyView = h(
      'div',
      { class: 'tgtk-view', 'data-view': 'fantasy' },
      line('角色 ID', fInput, fInputFav, clearBtn(fInput)),
      h('div', { class: 'tgtk-line tgtk-actions' }, fRun),
      fStat,
      fList
    );

    const favPick = h('div', { class: 'tgtk-line tgtk-favpick' });
    const favSortSel = select(
      'tgtk-favsort',
      [
        ['added', '收藏时间'],
        ['mine', '持股数'],
        ['sacrifices', '固定资产'],
        ['valhalla', '英灵殿'],
        ['price', '现价'],
      ],
      S.favSort
    );
    const favRun = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '刷新全部');
    const favCopy = h('button', {
      class: 'tgtk-btn', type: 'button', title: '只复制当前收藏夹里的角色 ID（空格分隔）',
    }, '复制');
    const bFavPrune = h('button', {
      class: 'tgtk-btn tgtk-danger', type: 'button',
      title: '核对全部收藏，移除已退市（在小圣杯里显示为「未上市」/ #0）的角色；ST 角色会保留',
    }, '清理已退市角色');
    const favAddInput = input('tgtk-favadd', '', {
      type: 'search',
      class: 'tgtk-noautofill',
      placeholder: '角色 ID / 名字，多个用空格隔开',
      name: 'tgtk-favadd-' + HOST_TOKEN.slice(-6),
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      'data-lpignore': 'true',
      'data-1p-ignore': 'true',
      'data-form-type': 'other',
    });
    ['input', 'change', 'blur', 'animationstart'].forEach((ev) =>
      favAddInput.addEventListener(ev, () => clearFavAddAutofill()));
    const favAddBtn = h('button', { class: 'tgtk-btn', type: 'button' }, '添加');
    const favStat = h('div', { class: 'tgtk-stat' }, '收藏角色后，在这里看持股 / 固定资产 / 英灵殿');
    const favList = h('div', { class: 'tgtk-list' });

    const favFolderSel = select('tgtk-favfolder', folderOptions(true, false), S.favFolder || 'all');
    const bFolderNew = h('button', { class: 'tgtk-btn', type: 'button' }, '＋ 新建');
    const bFolderRename = h('button', { class: 'tgtk-btn', type: 'button' }, '重命名');
    const bFolderDel = h(
      'button',
      { class: 'tgtk-btn tgtk-danger', type: 'button', title: '删除该收藏夹及夹里的角色；其它收藏夹里的同名角色保留' },
      '删除'
    );
    const folderEdit = h('div', { class: 'tgtk-line tgtk-actions tgtk-allowwrap', hidden: 'hidden' });
    const folderNameInput = input('tgtk-folder-name', '', { placeholder: '收藏夹名称' });
    const bFolderSave = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '创建');
    const bFolderCancel = h('button', { class: 'tgtk-btn', type: 'button' }, '取消');
    folderEdit.appendChild(h('span', { class: 'tgtk-label' }, '名称'));
    folderEdit.appendChild(folderNameInput);
    folderEdit.appendChild(bFolderSave);
    folderEdit.appendChild(bFolderCancel);
    const favAddFolderSel = select(
      'tgtk-favaddfolder', folderOptions(false, false),
      S.favFolder && S.favFolder !== 'all' ? S.favFolder : 'root'
    );

    const syncModeSel = select(
      'tgtk-syncmode',
      [['code', '仅同步码'], ['url', '自定义接口 (GET/PUT)'], ['gist', 'GitHub 私密 Gist']],
      S.syncMode || 'code'
    );
    const syncUrlInput = input('tgtk-syncurl', S.syncUrl || '', { placeholder: '支持 GET 读 / PUT 写 JSON 的地址' });
    const syncTokenInput = input('tgtk-synctoken', S.syncToken || '', {
      type: 'password', autocomplete: 'new-password', 'data-lpignore': 'true',
      placeholder: 'GitHub token（仅需 gist 权限）',
    });
    const syncGistInput = input('tgtk-syncgist', S.syncGist || '', { placeholder: 'Gist ID' });
    const syncCode = h('textarea', {
      id: 'tgtk-synccode', rows: '3',
      placeholder: '点「导出」生成同步码；把另一台设备的同步码粘贴到这里点「导入」',
    });
    const syncStat = h('div', { class: 'tgtk-stat' }, '收藏与置顶名单默认存在本机；用同步码或云同步把它们带到别的设备');
    const bSyncExport = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '导出同步码');
    const bSyncImport = h('button', { class: 'tgtk-btn', type: 'button' }, '导入同步码');
    const bSyncCreate = h('button', { class: 'tgtk-btn', type: 'button' }, '创建 Gist');
    const bSyncUpload = h('button', { class: 'tgtk-btn', type: 'button' }, '上传');
    const bSyncDownload = h('button', { class: 'tgtk-btn', type: 'button' }, '下载');
    const bFavImport = h(
      'button',
      {
        class: 'tgtk-btn', type: 'button',
        title: '只补充工具箱里还没有的角色；不会删掉任何已有收藏（要清理已退市角色请用「清理已退市」按钮）',
      },
      '导入小圣杯收藏'
    );
    const favImportText = h('textarea', {
      id: 'tgtk-favimport', rows: '3',
      placeholder: '把新版小圣杯收藏夹导出的 JSON，或角色 ID 列表（逗号 / 空格 / 换行分隔）粘贴到这里',
    });
    const bFavImportPaste = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '导入这段数据');
    const favImportBox = h(
      'div',
      { class: 'tgtk-importbox', hidden: 'hidden' },
      favImportText,
      h('div', { class: 'tgtk-line tgtk-actions' }, bFavImportPaste)
    );
    const syncAutoChk = h('input', { id: 'tgtk-syncauto', type: 'checkbox' });
    syncAutoChk.checked = !!S.syncAuto;
    const syncUrlRow = line('接口地址', syncUrlInput);
    const syncTokenRow = line('Token', syncTokenInput);
    const syncGistRow = h('div', { class: 'tgtk-line tgtk-actions' }, h('span', { class: 'tgtk-label' }, 'Gist ID'), syncGistInput, bSyncCreate);
    const syncAutoRow = h('div', { class: 'tgtk-line tgtk-chkline' }, h('label', { class: 'tgtk-chk' }, syncAutoChk, ' 自动同步（改动后上传、打开时下载）'));
    const syncCloudBtns = h('div', { class: 'tgtk-line tgtk-actions' }, bSyncUpload, bSyncDownload);
    const refreshSyncFields = () => {
      syncUrlRow.hidden = S.syncMode !== 'url';
      syncTokenRow.hidden = S.syncMode !== 'gist';
      syncGistRow.hidden = S.syncMode !== 'gist';
      syncAutoRow.hidden = S.syncMode === 'code';
      syncCloudBtns.hidden = S.syncMode === 'code';
    };
    const syncBox = h('details', { class: 'tgtk-syncbox' });
    syncBox.appendChild(h('summary', null, '跨设备同步（同步码 / 云同步）'));
    syncBox.appendChild(syncStat);
    cldStatEl = h(
      'div',
      { class: 'tgtk-stat' },
      cldStatMsg || (cldApi() ? '云设置：连接中…' : '云设置：当前环境不可用（不在 Bangumi 组件里，改动只存本机）')
    );
    syncBox.appendChild(cldStatEl);
    syncBox.appendChild(line('方式', syncModeSel));
    syncBox.appendChild(syncUrlRow);
    syncBox.appendChild(syncTokenRow);
    syncBox.appendChild(syncGistRow);
    syncBox.appendChild(syncAutoRow);
    syncBox.appendChild(syncCloudBtns);
    syncBox.appendChild(syncCode);
    syncBox.appendChild(h('div', { class: 'tgtk-line tgtk-actions' }, bSyncExport, bSyncImport, bFavImport));
    syncBox.appendChild(favImportBox);
    syncBox.appendChild(h('div', { class: 'tgtk-note' },
      '同步码含收藏、置顶名单与云配置 / token，只走自己的渠道、别公开；Gist 模式需自备只勾 gist 权限的 GitHub token。' +
      '在 Bangumi 组件里，置顶名单与每行个数还会自动存进组件云设置（停用组件会一并删除）。'));

    const favView = h(
      'div',
      { class: 'tgtk-view tgtk-favtools', 'data-view': 'fav' },
      favPick,
      h('div', { class: 'tgtk-line' },
        h('span', { class: 'tgtk-label' }, '收藏夹'), favFolderSel,
        h('span', { class: 'tgtk-spacer' }), bFolderNew, bFolderRename, bFolderDel),
      folderEdit,
      h('div', { class: 'tgtk-line' },
        h('span', { class: 'tgtk-label' }, '排序'), favSortSel,
        h('span', { class: 'tgtk-spacer' }), favRun, favCopy),
      h('div', { class: 'tgtk-line tgtk-favaddline' },
        h('span', { class: 'tgtk-label' }, '手动添加'), favAddInput, favAddFolderSel, favAddBtn),
      h('div', { class: 'tgtk-line' },
        h('span', { class: 'tgtk-label' }, '清理'),
        bFavPrune,
        h('span', { class: 'tgtk-note' }, '移除已退市角色，ST 保留')),
      syncBox,
      favStat,
      favList
    );

    const mModes = ['chaos', 'guidepost', 'fisheye'].map((m) =>
      h(
        'button',
        { class: 'tgtk-tab tgtk-subtab', type: 'button', 'data-magic': m },
        MAGIC_DEFS[m].label
      )
    );
    const mFrom = input('tgtk-mfrom', S.mFrom || currentCharacterId(), { placeholder: '炮塔角色 ID 或角色名' });
    if (!S.mFrom && mFrom.value) S.mFrom = mFrom.value;
    const mFromFav = favBtn();
    const mTo = input('tgtk-mto', S.mTo, { placeholder: '目标角色 ID 或角色名' });
    const mToFav = favBtn();
    const mToWrap = h(
      'div',
      { class: 'tgtk-line tgtk-ctx', 'data-ctx': 'mto' },
      h('span', { class: 'tgtk-label' }, '目标'),
      mTo,
      mToFav
    );
    const mTimes = h('input', {
      id: 'tgtk-mtimes',
      type: 'number',
      min: '1',
      max: '50',
      step: '1',
      value: String(magicTimes(S.magic)),
      title: `本次执行次数；${MAGIC_DEFS[S.magic].name}每日上限 ${MAGIC_DEFS[S.magic].daily} 次`,
    });
    const mStop = h('input', { id: 'tgtk-mstop', type: 'checkbox' });
    mStop.checked = S.mStop;
    const mRun = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '执行');
    const mStopBtn = h('button', { class: 'tgtk-btn tgtk-danger', type: 'button', hidden: 'hidden' }, '停止');
    const mStat = h('div', { class: 'tgtk-stat' }, MAGIC_DEFS[S.magic].tip);
    const mTip = h('div', { class: 'tgtk-note' }, MAGIC_DEFS[S.magic].tip);
    const mLog = h('div', { class: 'tgtk-logbox' });
    const mPreview = h('div', { class: 'tgtk-preview' }, '炮塔与目标可填角色 ID 或角色名，输入名字后点候选即可');

    const mFill = h('input', { id: 'tgtk-mfill', type: 'checkbox' });
    mFill.checked = !!S.mFill;
    const mFillMax = h('input', {
      id: 'tgtk-mfillmax',
      type: 'number',
      min: '0',
      step: '1',
      value: S.mFillMax === '' || S.mFillMax === undefined ? '' : String(num(S.mFillMax) || 300),
      placeholder: '留空=按缺口',
      title: '每轮一次性献祭多少股；留空 = 按缺口自动算（1 股补 2 固资），不够会再来一轮。两种模式都不会越过塔上限，到上限就停，宁可差 1 点也不撑高上限',
    });
    const mFillMaxWrap = h('span', { class: 'tgtk-inline' }, h('i', null, '单次献祭'), mFillMax, h('i', null, '股'));
    const mFillRow = h(
      'div',
      { class: 'tgtk-line tgtk-chkline' },
      h('label', { class: 'tgtk-chk' }, mFill, ' 固资不足时自动献祭补充'),
      mFillMaxWrap
    );

    const sChar = input('tgtk-schar', S.starChar || '', { placeholder: '角色 ID / 角色名，多个用空格 / 逗号分隔' });
    const sCharFav = favBtn();
    const sAmount = h('input', {
      id: 'tgtk-samount',
      type: 'number',
      min: '1',
      step: '10',
      value: String(num(S.starAmount) || 100),
      title: '每个角色这次贡献多少星之力，默认 100',
    });
    const sEndModes = [
      ['full', '补满', '收尾把塔补回固资上限（默认）。不会越过上限：差 1 点补不上就停在 499，宁可差一点也不让上限 +1'],
      ['250', '补到 250', '收尾只补到 250 固资，避免被虚空道标打中'],
      ['none', '不补', '收尾不补，塔内固资保持转化后的剩余量'],
    ].map(([v, t, tip]) =>
      h('button', { class: 'tgtk-tab tgtk-subtab', type: 'button', 'data-endfill': v, title: tip }, t)
    );
    const sEndWrap = h('div', { class: 'tgtk-tabs tgtk-endwrap' }, sEndModes);
    const syncStarEnd = () => {
      const v = S.starEndFill === '250' || S.starEndFill === 'none' ? S.starEndFill : 'full';
      S.starEndFill = v;
      sEndModes.forEach((b) => b.classList.toggle('tgtk-on', b.dataset.endfill === v));
    };
    const sFill = h('input', { id: 'tgtk-sfill', type: 'checkbox' });
    sFill.checked = !!S.starFill;
    const sRun = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '一键冲星');
    const sStop = h('button', { class: 'tgtk-btn tgtk-danger', type: 'button', hidden: 'hidden' }, '停止');
    const sEstimate = h('span', {
      class: 'tgtk-inline tgtk-estimate',
      title: '按 1 股活股 ≈ 2 固资 = 2 星之力估算：主体是「数量」要烧的股数，另加收尾补资（按塔上限估，执行过一次就用真实上限）；未扣除塔内已有固资，实际以执行日志为准',
    }, '预计消耗 0 股活股');
    const refreshStarEstimate = () => {
      const ids = String(S.starChar || '')
        .split(/[\s,，、;；]+/)
        .map(parseCharId)
        .filter(Boolean)
        .slice(0, 20);
      const n = Math.max(1, ids.length);
      const amount = Math.max(1, Math.min(1000000, Math.floor(num(S.starAmount) || 100)));
      if (!S.starFill) {
        sEstimate.textContent = '未开启自动献祭 · 只用塔内固资，不消耗活股';
        return;
      }
      let body = 0;
      let tail = 0;
      let known = 0;
      for (let i = 0; i < n; i++) {
        const id = ids[i];
        const cap = starCapCache[id] || 500;
        const target = starEndTarget(cap);
        const hasAssets = starAssetCache[id] !== undefined;
        const assets = hasAssets ? starAssetCache[id] : 0;
        const used = Math.min(assets, amount); // 这一次能用掉的塔内固资
        body += Math.ceil((amount - used) / 2); // 不够的部分才要献祭
        const left = assets - used; // 转化完还剩多少固资
        tail += Math.ceil(Math.max(0, target - left) / 2);
        if (hasAssets) known++;
      }
      const total = body + tail;
      if (total <= 0) {
        sEstimate.textContent = '塔内固资足够，本次不需要献祭活股';
        return;
      }
      sEstimate.textContent =
        `预计消耗${known < n ? '约 ' : ' '}${fmt(total)} 股活股` +
        (tail > 0 ? `（含收尾补资 ${fmt(tail)} 股）` : '') +
        (n > 1 ? `（${n} 个角色）` : '');
    };
    let starCacheTimer = 0;
    const scheduleStarCache = () => {
      clearTimeout(starCacheTimer);
      starCacheTimer = setTimeout(() => {
        const ids = String(S.starChar || '')
          .split(/[\s,，、;；]+/)
          .map(parseCharId)
          .filter(Boolean)
          .slice(0, 20);
        const miss = ids.filter((id) => starAssetCache[id] === undefined);
        if (!miss.length) return;
        starCacheLoad(miss)
          .then((got) => { if (got) refreshStarEstimate(); })
          .catch(() => {});
      }, 600);
    };
    starEstimateRefresh = refreshStarEstimate;
    const sStat = h('div', { class: 'tgtk-stat' }, '给每个角色贡献指定数量的星之力（1 固资 = 1 星之力）；每批自动按这座塔的固资上限切分，不用手填单次');
    const sLog = h('div', { class: 'tgtk-logbox' });
    const starBox = h(
      'div',
      { class: 'tgtk-starbox' },
      h('div', { class: 'tgtk-blocktitle' }, '一键冲星'),
      line('角色', sChar, sCharFav, clearBtn(sChar)),
      line('数量', sAmount, h('span', { class: 'tgtk-inline' }, h('i', null, '星之力 / 每个角色'))),
      line('结束补资', sEndWrap),
      h('div', { class: 'tgtk-line tgtk-chkline' }, h('label', { class: 'tgtk-chk' }, sFill, ' 固资不足时自动献祭补充')),
      h('div', { class: 'tgtk-line tgtk-actions' }, sRun, sEstimate, sStop),
      sStat,
      sLog
    );

    const sdTarget = input('tgtk-sdtarget', S.sdTarget || '', { placeholder: '目标角色 ID 或角色名（自己的塔）' });
    const sdTargetFav = favBtn();
    const sdQuery = input('tgtk-sdquery', S.sdQuery || '', { placeholder: '角色名 / ID，多个用空格隔开' });
    const sdQueryFav = favBtn();
    const sdLoad = h('button', { class: 'tgtk-btn', type: 'button' }, '读取持股');
    const sdSort = h(
      'button',
      { id: 'tgtk-sdsort', class: 'tgtk-btn tgtk-mini tgtk-sdsort', type: 'button', title: '切换燃料候选的排序' },
      '多→少'
    );
    const sdLevel = h('input', {
      id: 'tgtk-sdlevel',
      type: 'number',
      min: '0',
      step: '1',
      value: S.sdLevel === '' || S.sdLevel === null || S.sdLevel === undefined ? '' : String(S.sdLevel),
      placeholder: '全部等级',
      title: '只看这个等级的角色；留空 = 全部等级，填 0 = 只看 Lv0（ST / 退市重组）',
    });
    const sdPick = h('div', { id: 'tgtk-sdpick', class: 'tgtk-pick' });
    const sdList = h('div', { class: 'tgtk-sdlist' });
    const sdStat = h('div', { id: 'tgtk-sdstat', class: 'tgtk-stat' }, '读取自己的全部持仓，按持股从多到少排列，搜索 / 多选燃料都按点选顺序消耗');
    const sdAmount = h('input', {
      id: 'tgtk-sdamount',
      type: 'number',
      min: '1',
      step: '100',
      value: String(num(S.sdAmount) || 100),
      title: '这次合计消耗多少股；按燃料队列顺序依次扣，凑够就停',
    });
    const sdRun = h('button', { id: 'tgtk-sdrun', class: 'tgtk-btn tgtk-primary', type: 'button' }, '充能');
    const sdEst = h('span', { id: 'tgtk-sdest', class: 'tgtk-sdest' }, '预计 +?');
    const sdLog = h('div', { class: 'tgtk-logbox' });
    const sdBox = h(
      'div',
      { class: 'tgtk-starbox' },
      h('div', { class: 'tgtk-blocktitle' }, '星光碎片'),
      line('目标', sdTarget, sdTargetFav, h('span', { class: 'tgtk-inline' }, h('i', null, '自己的圣殿'))),
      line('等级', sdLevel, h('span', { class: 'tgtk-inline' }, h('i', null, '留空 = 全部'))),
      h('div', { class: 'tgtk-line' }, h('span', { class: 'tgtk-label' }, '燃料'), sdQuery, sdQueryFav, sdLoad, sdSort),
      line('数量', sdAmount, h('span', { class: 'tgtk-inline' }, h('i', null, '股 · 依次扣')), sdRun, sdEst),
      sdPick,
      sdStat,
      sdList,
      sdLog
    );

    const magicView = h(
      'div',
      { class: 'tgtk-view', 'data-view': 'magic' },
      h('div', { class: 'tgtk-tabs' }, mModes),
      line('炮塔', mFrom, mFromFav),
      mToWrap,
      line(
        '次数',
        mTimes,
        h('label', { class: 'tgtk-chk' }, mStop, ' 失败即停')
      ),
      mFillRow,
      h('div', { class: 'tgtk-line tgtk-actions' }, mRun, mStopBtn),
      mPreview,
      mStat,
      mTip,
      mLog,
      starBox,
      sdBox
    );

    const icoLoad = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button', style: 'margin-left:auto' }, '读取 ICO');
    const icoAdv = h('input', {
      id: 'tgtk-icoadv',
      type: 'number',
      min: '1',
      max: '180',
      step: '1',
      value: String(Math.floor(num(S.icoAdvance) || 1)),
      title: 'ICO 结束前多少分钟开始补款；设大一点，到点前关机也来得及',
      style: 'width:52px',
    });
    const icoStat = h('div', { class: 'tgtk-stat' }, '读取你参与注资的 ICO，按剩余时间从少到多排列');
    const icoList = h('div', { class: 'tgtk-icolist' });
    const icoLog = h('div', { class: 'tgtk-logbox' });
    const icoView = h(
      'div',
      { class: 'tgtk-view', 'data-view': 'ico' },
      h(
        'div',
        { class: 'tgtk-line' },
        h('span', { class: 'tgtk-label' }, '补款'),
        h('span', { class: 'tgtk-inline' }, h('i', null, '结束前'), icoAdv, h('i', null, '分钟')),
        icoLoad
      ),
      icoStat,
      icoList,
      h(
        'div',
        { class: 'tgtk-note' },
        '自动注资：结束前 N 分钟若还没到目标等级，按缺口一次性补钱（补到该等级为止）。' +
          'ICO 升级要同时满足「资金」和「人数(10+5×等级)」，人数不够时补钱也升不上去。' +
          '计划存在本机：关掉小圣杯页、切到别的 bgm 页面、重开浏览器后都还在，' +
          '只要还有任意一个 bgm 页面开着就会继续执行；把「结束前」设成 30 分钟，' +
          '就算到点前关机也不怕。'
      ),
      icoLog
    );

    const colBtns = [4, 5, 6].map((n) =>
      h('button', { class: 'tgtk-tab tgtk-subtab', type: 'button', 'data-cols': String(n), title: `一行 ${n} 个圣殿` }, String(n))
    );
    const colStat = h('div', { class: 'tgtk-stat' }, '');
    const syncCols = () => {
      const n = TUI.cols;
      colBtns.forEach((b) => b.classList.toggle('tgtk-on', Number(b.dataset.cols) === n));
      colStat.textContent =
        n === 4 ? '当前：一行 4 个（小圣杯默认大小）' : `当前：一行 ${n} 个，圣殿按比例缩小、每行排满`;
    };
    colBtns.forEach((b) =>
      b.addEventListener('click', () => {
        TUI.cols = Number(b.dataset.cols) || 4;
        tuiSave();
        applyTempleCols();
        syncCols();
      })
    );

    const pinSwitch = h('button', { class: 'tgtk-pintoggle', type: 'button' });
    const pinAdd = input('tgtk-pinadd', '', { placeholder: '角色名 / ID，可多个' });
    const pinAddBtn = h('button', { class: 'tgtk-btn', type: 'button' }, '置顶');
    const pinStat = h('div', { class: 'tgtk-stat tgtk-pinstat' }, '');
    const pinListBox = h('div', { class: 'tgtk-pinlist' });

    const resolveAddList = async (raw, statEl) => {
      const parts = String(raw || '')
        .split(/[\s,，、;；]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      const ids = [];
      const nameOf = Object.create(null);
      const miss = [];
      if (!parts.length) return { ids, noTower: [], miss, nameOf };
      if (statEl) statEl.textContent = '正在确认你有没有对应的圣殿…';
      const owned = await pinOwnedSet();
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (/^#?\d+$/.test(p)) {
          const id = p.replace(/^#/, '');
          ids.push(id);
          if (nameCache[id]) nameOf[id] = nameCache[id];
          continue;
        }
        if (statEl) {
          statEl.textContent =
            parts.length > 1 ? `正在找「${p}」（${i + 1} / ${parts.length}）…` : `正在找「${p}」…`;
        }
        const mine = templeSugItems(p);
        const items = mine && mine.length ? mine : await searchChara(p).catch(() => []);
        const it = pickCharaCandidate(items, p, owned);
        if (it) {
          ids.push(String(it.id));
          if (it.name) {
            nameOf[it.id] = it.name;
            pinNameSet(it.id, it.name);
          }
        } else miss.push(p);
      }
      const uniq = [...new Set(ids)];
      const ok = [];
      const noTower = [];
      for (let i = 0; i < uniq.length; i++) {
        const id = uniq[i];
        if (owned && !owned.has(id)) {
          const t = await findMyTemple(id).catch(() => null);
          if (t) {
            pinSnapSet(id, t);
            ok.push(id);
          } else noTower.push(id);
        } else ok.push(id);
      }
      return { ids: ok, noTower, miss, nameOf };
    };
    const addTroubleText = (noTower, miss) => {
      const bits = [];
      if (noTower.length) {
        bits.push(
          '没有你的塔：' + noTower.map((id) => pinNameGet(id) || '#' + id).join('、')
        );
      }
      if (miss.length) bits.push('没找到：' + miss.join('、'));
      return bits.join(' · ');
    };

    const botHeadCount = h('span', { class: 'tgtk-sectcount' }, '');
    const botCaret = h('span', { class: 'tgtk-caret' }, '▸');
    const botHead = h(
      'button',
      { class: 'tgtk-secthead', type: 'button', title: '点一下展开 / 收起置底设置' },
      botCaret,
      h('span', { class: 'tgtk-colname' }, '个人页圣殿置底'),
      botHeadCount
    );
    const botInput = input('tgtk-botadd', '', { placeholder: '角色名 / ID，可多个' });
    const botAddBtn = h('button', { class: 'tgtk-btn', type: 'button' }, '添加');
    const botStat = h('div', { class: 'tgtk-stat' }, '');
    const botListBox = h('div', { class: 'tgtk-pinlist tgtk-botlist' });
    const botBody = h(
      'div',
      { class: 'tgtk-sectbody', hidden: 'hidden' },
      h('div', { class: 'tgtk-line' }, botInput, botAddBtn, clearBtn(botInput)),
      botStat,
      botListBox,
      h('div', { class: 'tgtk-note' }, '置底的角色会排在个人页最后一页的最后一个，不需要调顺序。')
    );
    const setBotOpen = (v) => {
      const open = !!v;
      botBody.hidden = !open;
      botCaret.textContent = open ? '▾' : '▸';
      botHead.classList.toggle('tgtk-secton', open);
    };
    botHead.addEventListener('click', () => {
      setBotOpen(botBody.hidden);
      hideCharaSuggest();
    });

    const renderBotList = () => {
      const bots = botList();
      botListBox.textContent = '';
      botHeadCount.textContent = bots.length ? `已置底 ${bots.length} 座` : '';
      if (!bots.length) {
        botStat.textContent = '还没有置底的角色。展开后输入角色名或完整 ID，点「添加」。';
        return;
      }
      botStat.textContent =
        `已置底 ${bots.length} 座 · 排在最后一页的最后一个` + (pinSnapBusy ? ' · 正在同步塔数据…' : '');
      bots.forEach((cid) => {
        const snap = pinSnapGet(cid);
        const nm = (snap && snap.Name) || pinNameGet(cid);
        botListBox.appendChild(
          h(
            'div',
            { class: 'tgtk-pinrow tgtk-botrow' },
            h('div', { class: 'tgtk-pinmain' }, charaLink(cid, nm || undefined)),
            h(
              'span',
              { class: 'tgtk-pinactions' },
              h(
                'button',
                {
                  class: 'tgtk-botx',
                  type: 'button',
                  title: '取消置底，恢复本站原来的位置',
                  onclick: () => botToggle(cid),
                },
                '取消置底'
              )
            )
          )
        );
      });
      const todo = bots.filter((cid) => !pinNameGet(cid) && !pinNameTried[cid]);
      if (todo.length) {
        todo.forEach((cid) => (pinNameTried[cid] = 1));
        loadNames(todo, false, { always: true })
          .then(() => {
            todo.forEach((cid) => {
              if (nameCache[cid]) pinNameSet(cid, nameCache[cid]);
            });
            if (pinUiRefresh) pinUiRefresh();
          })
          .catch(() => {});
      }
      if (bots.some((cid) => !pinSnapGet(cid)) && Date.now() - pinKickAt > 60000) {
        pinKickAt = Date.now();
        setTimeout(() => {
          try { pinRefreshSnaps(true); } catch (e) {}
        }, 400);
      }
    };

    const addBotNow = async () => {
      const raw = String(botInput.value || '').trim();
      if (!raw) {
        botStat.textContent = '先填角色名或角色 ID';
        return;
      }
      const r = await resolveAddList(raw, botStat);
      if (!r.ids.length && !r.noTower.length) {
        botStat.textContent = addTroubleText([], r.miss) || '没找到对应的角色';
        return;
      }
      r.ids.forEach((cid) => {
        if (r.nameOf[cid]) pinNameSet(cid, r.nameOf[cid]);
        delete pinNameTried[cid];
      });
      const added = [];
      r.ids.forEach((cid) => {
        if (botHas(cid)) return;
        if (botToggle(cid)) added.push(cid);
      });
      botInput.value = '';
      hideCharaSuggest();
      renderBotList();
      const dup = r.ids.length - added.length;
      const trouble = addTroubleText(r.noTower, r.miss);
      pinToast(
        added.length
          ? `已置底 ${added.length} 座${dup ? `（${dup} 座本来就在）` : ''}，刷新个人页生效`
          : trouble
            ? '没有可添加的角色'
            : '这些角色都已经在置底名单里了'
      );
      botStat.textContent =
        (added.length ? `已置底 ${added.length} 座。` : '') +
        (trouble || (added.length ? '刷新个人页生效' : '这些角色都已经在置底名单里了，不用重复添加'));
    };
    botAddBtn.addEventListener('click', () => {
      addBotNow().catch(() => {});
    });
    attachCharaSuggest(botInput, {
      numId: true,
      temple: true,
      onPick: (it) => {
        if (it && it.id) pinNameSet(it.id, it.name);
        addBotNow().catch(() => {});
      },
    });

    const renderPinList = () => {
      const pins = pinList();
      const on = TUI.on;
      pinSwitch.textContent = on ? '已开启' : '已关闭';
      pinSwitch.classList.toggle('tgtk-off', !on);
      pinSwitch.title = on ? '点一下临时关掉，个人页恢复站点原来的顺序' : '点一下开启置顶';
      pinListBox.textContent = '';
      if (!pins.length) {
        pinStat.textContent = '还没有置顶的圣殿。在上面输入角色名或完整 ID，点「置顶」加一个。';
        return;
      }
      pinStat.textContent =
        `已置顶 ${pins.length} 座` +
        (on ? ' · 第 1 页按此顺序最前 · 按住 ⋮⋮ 拖动排序' : ' · 当前已关闭，个人页按站点原顺序显示') +
        (pinSnapBusy ? ' · 正在同步塔数据…' : '');
      pins.forEach((cid, i) => {
        const snap = pinSnapGet(cid);
        const nm = (snap && snap.Name) || pinNameGet(cid);
        const row = h(
          'div',
          { class: 'tgtk-pinrow', draggable: 'true', title: '按住右侧 ⋮⋮ 拖动可换顺序' },
          h('span', { class: 'tgtk-pinno' }, String(i + 1)),
          h('div', { class: 'tgtk-pinmain' }, charaLink(cid, nm || undefined)),
          h(
            'span',
            { class: 'tgtk-pinactions' },
            h('button', { class: 'tgtk-grip', type: 'button', title: '按住拖动排序', 'aria-label': '拖动排序' }, '⋮⋮'),
            h(
              'button',
              {
                class: 'tgtk-mini',
                type: 'button',
                title: '上移一位',
                disabled: i === 0 ? 'disabled' : null,
                onclick: () => pinMove(cid, -1),
              },
              '↑'
            ),
            h(
              'button',
              {
                class: 'tgtk-mini',
                type: 'button',
                title: '下移一位',
                disabled: i === pins.length - 1 ? 'disabled' : null,
                onclick: () => pinMove(cid, 1),
              },
              '↓'
            ),
            h(
              'button',
              {
                class: 'tgtk-mini tgtk-mini-x',
                type: 'button',
                title: '取消置顶',
                onclick: () => pinToggle(cid),
              },
              '×'
            )
          )
        );
        pinDragBind(row, cid, pinListBox);
        pinListBox.appendChild(row);
      });
      const todo = pins.filter((cid) => !pinNameGet(cid) && !pinNameTried[cid]);
      if (todo.length) {
        todo.forEach((cid) => (pinNameTried[cid] = 1));
        loadNames(todo, false, { always: true })
          .then(() => {
            todo.forEach((cid) => {
              if (nameCache[cid]) pinNameSet(cid, nameCache[cid]);
            });
            if (pinUiRefresh) pinUiRefresh();
          })
          .catch(() => {});
      }
      if (pins.some((cid) => !pinSnapGet(cid)) && Date.now() - pinKickAt > 60000) {
        pinKickAt = Date.now();
        setTimeout(() => {
          try { pinRefreshSnaps(true); } catch (e) {}
        }, 400);
      }
    };
    pinUiRefresh = () => {
      renderPinList();
      renderBotList();
    };

    pinSwitch.addEventListener('click', () => {
      TUI.on = !TUI.on;
      tuiSave();
      renderPinList();
      if (TUI.on) pinRefreshSnaps();
      pinToast(TUI.on ? '圣殿置顶已开启' : '圣殿置顶已关闭');
    });

    const pinAddNow = async () => {
      const raw = String(pinAdd.value || '').trim();
      if (!raw) {
        pinStat.textContent = '先填角色名或角色 ID';
        return;
      }
      const r = await resolveAddList(raw, pinStat);
      if (!r.ids.length && !r.noTower.length) {
        pinStat.textContent = addTroubleText([], r.miss) || '没找到对应的角色';
        return;
      }
      r.ids.forEach((cid) => {
        if (r.nameOf[cid]) pinNameSet(cid, r.nameOf[cid]);
        delete pinNameTried[cid];
      });
      const added = [];
      r.ids.forEach((cid) => {
        if (pinHas(cid)) return;
        if (pinToggle(cid)) added.push(cid);
      });
      pinAdd.value = '';
      hideCharaSuggest();
      renderPinList();
      if (added.length) {
        const need = added.filter((cid) => !pinSnapGet(cid));
        if (need.length) {
          pinStat.textContent = `已置顶 ${added.length} 座，正在读取塔数据…`;
          await mapLimit(need, 3, async (cid) => {
            try {
              const t = await findMyTemple(cid);
              if (t) pinSnapSet(cid, t);
            } catch (e) {}
          });
          renderPinList();
        }
      }
      const dup = r.ids.length - added.length;
      const trouble = addTroubleText(r.noTower, r.miss);
      pinToast(
        added.length
          ? `已置顶 ${added.length} 座${dup ? `（${dup} 座本来就在）` : ''}，刷新个人页生效`
          : trouble
            ? '没有可置顶的角色'
            : '这些角色都已经在置顶名单里了'
      );
      if (trouble && (added.length || r.noTower.length)) {
        pinStat.textContent = (added.length ? `已置顶 ${added.length} 座。` : '') + trouble;
      } else if (!added.length) {
        pinStat.textContent = '这些角色都已经在置顶名单里了，不用重复添加';
      }
    };
    pinAddBtn.addEventListener('click', () => {
      pinAddNow().catch(() => {});
    });
    attachCharaSuggest(pinAdd, {
      numId: true,
      temple: true, // 候选只列「我建过塔」的角色，同名但没塔的不再出现
      onPick: (it) => {
        if (it && it.id) pinNameSet(it.id, it.name);
        pinAddNow().catch(() => {});
      },
    });

    const seamlessChk = h('input', { id: 'tgtk-seamless', type: 'checkbox' });
    const seamlessStat = h('div', { class: 'tgtk-stat' }, '');
    const syncSeamless = () => {
      const on = S.seamlessLink !== false;
      seamlessChk.checked = on;
      seamlessStat.textContent = on
        ? '已开启：LINK 圣殿是一整张连续的图，中间没有白线'
        : '已关闭：恢复小圣杯原版（左右两半斜切，中间有一条白线）';
    };
    seamlessChk.addEventListener('change', () => {
      S.seamlessLink = !!seamlessChk.checked;
      persist();
      applySeamless();
      syncSeamless();
    });
    const coverView = h(
      'div',
      { class: 'tgtk-view', 'data-view': 'cover' },
      h(
        'div',
        { class: 'tgtk-line' },
        h('span', { class: 'tgtk-colname' }, '个人页圣殿显示'),
        h('span', { class: 'tgtk-label' }, '每行'),
        h('span', { class: 'tgtk-inline tgtk-cols' }, colBtns),
        h('i', { class: 'tgtk-colunit' }, '个圣殿')
      ),
      colStat,
      h(
        'div',
        { class: 'tgtk-note' },
        '只影响新版小圣杯的个人页。默认 4 个；' +
          '选 5 / 6 个时圣殿会按比例缩小，每行排满、不会留空。'
      ),
      h('div', { class: 'tgtk-sep' }),
      h(
        'div',
        { class: 'tgtk-line tgtk-chkline' },
        h('label', { class: 'tgtk-chk' }, seamlessChk, ' 无缝 link 图')
      ),
      seamlessStat,
      h(
        'div',
        { class: 'tgtk-note' },
        '可配合link塔图裁剪功能使用（爱心标）'
      ),
      h('div', { class: 'tgtk-sep' }),
      botHead,
      botBody,
      h('div', { class: 'tgtk-sep' }),
      h(
        'div',
        { class: 'tgtk-line tgtk-pinline' },
        h('span', { class: 'tgtk-colname' }, '个人页圣殿置顶'),
        pinSwitch
      ),
      h('div', { class: 'tgtk-line' }, pinAdd, pinAddBtn, clearBtn(pinAdd)),
      pinStat,
      pinListBox
    );
    syncCols();
    syncSeamless();
    setBotOpen(false);
    renderBotList();
    renderPinList();
    tuiUiRefresh = () => {
      syncCols();
      renderBotList();
      renderPinList();
    };

    const lDays = select(
      'tgtk-ldays',
      [
        ['3', '近 3 天'],
        ['7', '近 7 天'],
        ['14', '近 14 天'],
        ['30', '近 30 天'],
        ['custom', '自定义'],
      ],
      String(S.logDays)
    );
    const lFrom = h('input', {
      id: 'tgtk-lfrom',
      type: 'date',
      value: S.logFrom || dayStr(dayStartMs(6)),
      title: '起始日（含当天 0:00）',
    });
    const lTo = h('input', {
      id: 'tgtk-lto',
      type: 'date',
      value: S.logTo || dayStr(dayStartMs(0)),
      title: '结束日（含当天 24:00）',
    });
    const lRangeWrap = h('span', { class: 'tgtk-inline' }, lFrom, h('i', null, '~'), lTo);
    const syncRange = () => {
      lRangeWrap.hidden = String(S.logDays) !== 'custom';
    };
    syncRange();
    const lSort = select(
      'tgtk-lsort',
      [
        ['active', '变动总量'],
        ['gain', '获得最多'],
        ['loss', '失去最多'],
        ['netUp', '净增最多'],
        ['netDown', '净减最多'],
      ],
      S.logSort
    );
    const lTop = select(
      'tgtk-ltop',
      [
        ['10', '10 个'],
        ['20', '20 个'],
        ['30', '30 个'],
      ],
      String(S.logTop)
    );
    const lRun = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '统计');
    const lCopy = h('button', { class: 'tgtk-btn', type: 'button' }, '复制');
    const assetBox = h('div', { class: 'tgtk-asset' }, h('div', { class: 'tgtk-stat' }, '点「统计」读取资金日志，生成资产走势'));
    const flowBox = h('div', { class: 'tgtk-flow' });
    const logStat = h('div', { class: 'tgtk-stat' }, '读取自己的资金日志，按资金 / 股数 / 固资三个维度归类');
    const logList = h('div', { class: 'tgtk-list' });
    const segBtns = [
      ['fund', '资金'],
      ['stock', '股数'],
      ['fixed', '圣殿'],
    ].map(([k, t]) => h('button', { class: 'tgtk-segbtn', type: 'button', 'data-view': k }, t));
    const segWrap = h('div', { class: 'tgtk-seg' }, segBtns);
    const sortWrap = h(
      'div',
      { class: 'tgtk-line' },
      h('span', { class: 'tgtk-label' }, '排序'),
      lSort,
      h('span', { class: 'tgtk-label' }, '显示'),
      lTop
    );

    const logView = h(
      'div',
      { class: 'tgtk-view', 'data-view': 'log' },
      assetBox,
      line('范围', lDays, lRangeWrap),
      segWrap,
      h('div', { class: 'tgtk-line tgtk-actions' }, lRun, lCopy),
      flowBox,
      logStat,
      sortWrap,
      logList,
      h(
        'div',
        { class: 'tgtk-note' },
        '按资金日志统计，来源按接口 Type 字段归类；只能统计自己的账号。' +
          '竞拍 / 买入记净额（扣掉返还、撤单），股息记税后，卖出只算成交的；固资数值按日志描述解析'
      )
    );

    const closeBtn = h('button', { class: 'tgtk-close', type: 'button', title: '关闭' }, '×');
    const themeBtn = h(
      'button',
      { class: 'tgtk-ico', type: 'button', title: '切换日间 / 夜间模式' },
      S.theme === 'light' ? '☾' : '☀'
    );
    const posBtn = h(
      'button',
      { class: 'tgtk-ico', type: 'button', title: '复位窗口位置（也可以双击标题栏）' },
      '⌖'
    );

    const noteBtn = h(
      'button',
      { class: 'tgtk-ico tgtk-notebtn', type: 'button', title: '随手记（再点一下回到工具箱，Esc 也行）' },
      ''
    );
    noteBtn.innerHTML =
      '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M2.6 3.1c1.8-.6 3.5-.4 5.4.7 1.9-1.1 3.6-1.3 5.4-.7v9.2c-1.8-.6-3.5-.4-5.4.7-1.9-1.1-3.6-1.3-5.4-.7z"/>' +
      '<path d="M8 3.8v9.3"/></svg>';
    const noteText = h('textarea', {
      class: 'tgtk-notebody',
      rows: '10',
      spellcheck: 'false',
      placeholder: '随手写点什么……内容自动存在这台设备上（不联网、不同步）',
    });
    const noteStat = h('span', { class: 'tgtk-notestat' }, '0 字');
    const noteCopy = h('button', { class: 'tgtk-btn', type: 'button', title: '复制全部内容' }, '复制');
    const noteClear = h('button', { class: 'tgtk-btn tgtk-danger', type: 'button' }, '清空');
    const noteView = h(
      'div',
      { class: 'tgtk-noteview', hidden: 'hidden' },
      noteText,
      h('div', { class: 'tgtk-notefoot' }, noteStat, h('span', { class: 'tgtk-spacer' }), noteCopy, noteClear)
    );

    const titleEl = h('span', { class: 'tgtk-title' }, '小圣杯工具箱');
    const tabbar = h('div', { class: 'tgtk-tabbar' }, tabBtns);
    const bodyEl = h(
      'div',
      { class: 'tgtk-body' },
      templeView, holdView, fantasyView, favView, magicView, icoView, coverView, logView
    );
    const panel = h(
      'section',
      { id: 'tgtk-panel', hidden: 'hidden', 'data-theme': S.theme === 'light' ? 'light' : 'dark' },
      h(
        'header',
        { class: 'tgtk-head', title: '按住可拖动窗口 · 双击复位到右下角' },
        titleEl,
        h('span', { class: 'tgtk-headtools' }, noteBtn, posBtn, themeBtn, closeBtn)
      ),
      tabbar,
      bodyEl,
      noteView
    );

    HDOC.body.appendChild(panel);
    const resetPanelPos = makeDraggable(panel, panel.querySelector('.tgtk-head'), {
      key: 'panelPos',
      ignore: 'button',
      onMove: () => {
        hideCharaSuggest();
        hideFavPop();
      },
    });
    posBtn.addEventListener('click', resetPanelPos);

    els = {
      fab,
      panel,
      tabBtns,
      titleEl,
      noteBtn,
      noteView,
      noteText,
      noteStat,
      tabbar,
      bodyEl,
      views: { temple: templeView, hold: holdView, fantasy: fantasyView, fav: favView, magic: magicView, ico: icoView, cover: coverView, log: logView },
      thr,
      field,
      coverSel,
      chkAssets,
      chkCover,
      srcBtns,
      tUser,
      tChars,
      tCtxChars,
      tRun,
      tCopy,
      templeStat,
      templeList,
      hSearch,
      lvMin,
      lvMax,
      minAmt,
      sortSel,
      hRun,
      hCopy,
      holdStat,
      holdList,
      fInput,
      fInputFav,
      fRun,
      fStat,
      fList,
      favPick,
      favSortSel,
      favRun,
      favCopy,
      favAddInput,
      favAddBtn,
      favStat,
      favList,
      favFolderSel, folderEdit, folderNameInput, bFolderSave, bFolderCancel,
      bFolderNew, bFolderRename, bFolderDel, favAddFolderSel,
      syncModeSel, syncUrlInput, syncTokenInput, syncGistInput, syncCode, syncStat, syncAutoChk,
      syncUrlRow, syncTokenRow, syncGistRow,
      mModes,
      mFrom,
      mFromFav,
      mTo,
      mToFav,
      mToWrap,
      mTimes,
      mStop,
      mRun,
      mStopBtn,
      mStat,
      mTip,
      mLog,
      mPreview,
      mFill,
      mFillMax,
      mFillMaxWrap,
      mFillRow,
      sChar,
      sCharFav,
      sAmount,
      sEndModes,
      sFill,
      sRun,
      sStop,
      sStat,
      sLog,
      sdTarget,
      sdTargetFav,
      sdLevel,
      sdQuery,
      sdQueryFav,
      sdLoad,
      sdSort,
      sdPick,
      sdList,
      sdStat,
      sdAmount,
      sdRun,
      sdEst,
      sdLog,
      icoLoad,
      icoStat,
      icoList,
      icoLog,
      lDays,
      lSort,
      lTop,
      lRun,
      lCopy,
      assetBox,
      flowBox,
      segBtns,
      sortWrap,
      logStat,
      logList,
    };

    const syncTab = () => {
      hideCharaSuggest();
      hideFavPop();
      tabBtns.forEach((b) => b.classList.toggle('tgtk-on', b.dataset.tab === S.tab));
      Object.keys(els.views).forEach((k) => {
        els.views[k].hidden = k !== S.tab;
      });
      if (S.tab === 'temple') ensureTempleUser();
      if (S.tab === 'fav') {
        clearFavAddAutofill();
        syncFavPick();
        if (els.favList && !els.favList.childElementCount) {
          renderFavs();
          setFavStatus(favCountText());
        }
      }
      if (S.tab === 'ico' && !icoLoaded) loadIco();
    };

    const syncSource = () => {
      hideCharaSuggest();
      hideFavPop();
      srcBtns.forEach((b) => b.classList.toggle('tgtk-on', b.dataset.source === S.source));
      tCtxChars.hidden = S.source !== 'chars';
      if (S.source === 'user') ensureTempleUser();
    };

    tabBtns.forEach((b) =>
      b.addEventListener('click', () => {
        S.tab = b.dataset.tab;
        persist();
        writeUI({ tab: S.tab });
        syncTab();
      })
    );

    srcBtns.forEach((b) =>
      b.addEventListener('click', () => {
        S.source = b.dataset.source;
        persist();
        syncSource();
        templeAll = [];
        templeList.textContent = '';
        setTempleStatus('已切换数据源，点「扫描」重新读取');
      })
    );

    thr.addEventListener('change', () => {
      S.threshold = Math.max(0, num(thr.value));
      thr.value = String(S.threshold);
      persist();
      renderTemples();
    });
    field.addEventListener('change', () => {
      S.field = field.value;
      persist();
      renderTemples();
    });
    coverSel.addEventListener('change', () => {
      S.cover = coverSel.value;
      persist();
      renderTemples();
    });
    tUser.addEventListener('input', () => {
      S.username = tUser.value;
      persist();
    });
    tChars.addEventListener('input', () => {
      S.chars = tChars.value;
      persist();
    });
    chkAssets.addEventListener('change', () => {
      S.filAssets = !!chkAssets.checked;
      persist();
      renderTemples();
    });
    chkCover.addEventListener('change', () => {
      S.filCover = !!chkCover.checked;
      persist();
      renderTemples();
    });

    hSearch.addEventListener('input', () => {
      S.holdQuery = hSearch.value;
      persist();
      if (holdAll.length) renderHoldings();
    });
    [lvMin, lvMax, minAmt].forEach((el, i) => {
      el.addEventListener('input', () => {
        S[['lvMin', 'lvMax', 'minAmount'][i]] = el.value;
        persist();
        if (holdAll.length) renderHoldings();
      });
    });
    sortSel.addEventListener('change', () => {
      S.sortBy = sortSel.value;
      persist();
      if (holdAll.length) renderHoldings();
    });

    fInput.addEventListener('input', () => {
      S.fchars = fInput.value;
      persist();
    });

    tRun.addEventListener('click', scanTemples);
    tCopy.addEventListener('click', () => copyTemple());
    hRun.addEventListener('click', scanHoldings);
    hCopy.addEventListener('click', () => copyHolding());
    fRun.addEventListener('click', queryFantasy);

    favRun.addEventListener('click', refreshFavs);
    favCopy.addEventListener('click', () => copyFavs());

    let pruneArmed = false;
    let pruneBusy = false;
    const pruneReset = () => {
      pruneArmed = false;
      pruneBusy = false;
      bFavPrune.textContent = '清理已退市角色';
      bFavPrune.disabled = false;
    };
    bFavPrune.addEventListener('click', async () => {
      if (pruneBusy) return;
      if (!pruneArmed) {
        pruneArmed = true;
        bFavPrune.textContent = '再点一次确认';
        setFavStatus('将核对全部收藏并移除已退市角色（ST 保留）；再点一次按钮确认，3 秒内有效');
        setTimeout(() => { if (pruneArmed && !pruneBusy) pruneReset(); }, 3500);
        return;
      }
      pruneBusy = true;
      bFavPrune.disabled = true;
      bFavPrune.textContent = '核对中…';
      setFavStatus('正在核对角色是否已上市…');
      try {
        const r = await favPruneDelisted();
        if (r.removed) {
          favRows = favRows.filter((x) => !r.ids.includes(String(x.id)));
          renderFavs();
          syncFavPick();
          refreshStarBadge();
          setFavStatus(favCountText() + ` · 已清理 ${r.removed} 个已退市角色（${r.rows} 条收藏记录）`);
          setSyncStatus(`已清理 ${r.removed} 个已退市角色 / ${r.rows} 条收藏记录；ST 角色已保留`);
        } else if (!r.checked) {
          const why = r.why === 'tooMany'
            ? '一次有超过一半收藏查不到角色资料，可能是接口 / 登录异常，本次未删除任何收藏'
            : '接口没连上或核对不可靠，本次没有删除任何收藏（避免误删）';
          setFavStatus(why);
          setSyncStatus('清理已取消：' + why);
        } else {
          setFavStatus(favCountText() + ' · 核对完成，没有发现已退市角色');
          setSyncStatus('核对完成：没有发现已退市角色，收藏未改动');
        }
      } catch (e) {
        setFavStatus('清理失败：' + ((e && e.message) || e));
      } finally {
        pruneReset();
      }
    });
    favAddBtn.addEventListener('click', () => {
      const ids = parseCharIds(favAddInput.value);
      if (!ids.length) return setFavStatus('请输入数字角色 ID（多个用空格隔开）');
      const fid = favAddFolderSel.value || 'root';
      const fresh = [];
      let dup = 0;
      ids.forEach((id) => {
        if (favs.some((f) => String(f.id) === id && f.folder === fid)) {
          dup++;
          return;
        }
        addFav(id, '', fid);
        fresh.push(id);
      });
      favAddInput.value = '';
      hideCharaSuggest();
      if (!fresh.length) {
        return setFavStatus(
          ids.length > 1 ? `${ids.length} 个角色都已经在这个收藏夹里了` : `#${ids[0]} 已经在这个收藏夹里了`
        );
      }
      fresh.forEach((id) => { favNameAt[id] = Date.now(); });
      if (els) {
        renderFavs();
        syncFavPick();
        setFavStatus(
          favCountText() +
            (fresh.length > 1 ? ` · 已加入 ${fresh.length} 个，正在读取数据…` : ' · 正在读取这个角色的数据…') +
            (dup ? `（${dup} 个已在夹里，跳过）` : '')
        );
      }
      panelToast(
        fresh.length > 1
          ? `已收藏 ${fresh.length} 个角色`
          : `收藏成功${nameCache[fresh[0]] ? '「' + nameCache[fresh[0]] + '」' : ''}`
      );
      (async () => {
        for (const id of fresh) {
          try {
            await refreshOneFav(id);
          } catch (e) {}
        }
      })();
    });

    let folderEditMode = '';
    let delArmed = false;
    const setFolderEdit = (mode) => {
      folderEditMode = mode;
      folderEdit.hidden = !mode;
      if (!mode) return;
      const cur = favFolderSel.value;
      const curF = folders.find((x) => x.id === cur);
      folderNameInput.value = mode === 'rename' && curF ? curF.name : '';
      bFolderSave.textContent = mode === 'rename' ? '保存' : '创建';
      if (mode === 'new') folderNameInput.focus();
    };
    bFolderNew.addEventListener('click', () => setFolderEdit('new'));
    bFolderRename.addEventListener('click', () => {
      if (!favFolderSel.value || favFolderSel.value === 'all') return setFavStatus('先在上面选一个具体的收藏夹');
      setFolderEdit('rename');
    });
    bFolderCancel.addEventListener('click', () => setFolderEdit(''));
    bFolderSave.addEventListener('click', () => {
      const name = folderNameInput.value.trim();
      if (!name) return setFavStatus('请填收藏夹名称');
      if (folderEditMode === 'rename') {
        renameFolder(favFolderSel.value, name);
        setFavStatus('已重命名');
      } else {
        addFolder(name);
        setFavStatus(`已创建「${name}」，可在上方下拉切换到它`);
      }
      setFolderEdit('');
      refreshFolderUI();
      favFolderSel.value = S.favFolder;
      favAddFolderSel.value = S.favFolder === 'all' ? 'root' : S.favFolder;
      renderFavs();
      syncFavPick();
    });
    const delLabel = () => (favFolderSel.value === 'root' ? '清空' : '删除');
    const syncFolderBtns = () => {
      const id = favFolderSel.value;
      bFolderDel.textContent = id === 'root' ? '清空' : '删除';
      bFolderDel.title =
        id === 'root'
          ? '清空默认收藏夹里的角色（收藏夹本身保留，其它收藏夹不受影响）'
          : '删除该收藏夹及夹里的角色；其它收藏夹里的同名角色保留';
      bFolderDel.disabled = !id || id === 'all';
      bFolderRename.disabled = !id || id === 'all';
    };
    els.syncFolderBtns = syncFolderBtns; // els 在前面已经建好，这里补挂（refreshFolderUI 也要用）
    bFolderDel.addEventListener('click', () => {
      const id = favFolderSel.value;
      if (!id || id === 'all') return setFavStatus('先选一个具体的收藏夹');
      const isRoot = id === 'root';
      if (!delArmed) {
        delArmed = true;
        bFolderDel.textContent = isRoot ? '再点一次清空' : '再点一次确认';
        if (isRoot) {
          const n = favs.filter((f) => f.folder === 'root').length;
          setFavStatus(`将把「默认收藏夹」里的 ${n} 个角色全部移出（收藏夹保留）；再点一次确认，3 秒内有效`);
        }
        setTimeout(() => { delArmed = false; bFolderDel.textContent = delLabel(); }, 3500);
        return;
      }
      delArmed = false;
      bFolderDel.textContent = delLabel();
      if (isRoot) {
        const n = clearFolderItems('root');
        renderFavs();
        syncFavPick();
        setFavStatus(`已清空「默认收藏夹」（移出 ${n} 个角色，收藏夹保留）`);
        return;
      }
      const name = folderPath(id);
      deleteFolder(id);
      S.favFolder = 'all';
      persist();
      refreshFolderUI();
      favFolderSel.value = 'all';
      syncFolderBtns();
      setFavStatus(`已删除「${name}」及夹里的角色（其它收藏夹中的同名角色保留）`);
      renderFavs();
      syncFavPick();
    });
    favFolderSel.addEventListener('change', () => {
      S.favFolder = favFolderSel.value || 'all';
      persist();
      favAddFolderSel.value = S.favFolder === 'all' ? 'root' : S.favFolder;
      syncFolderBtns();
      renderFavs();
      setFavStatus(favCountText());
    });
    syncFolderBtns();

    const readSyncFields = () => {
      S.syncUrl = syncUrlInput.value.trim();
      S.syncToken = syncTokenInput.value.trim();
      S.syncGist = syncGistInput.value.trim();
      persist();
    };
    refreshSyncFields();
    syncModeSel.addEventListener('change', () => {
      S.syncMode = syncModeSel.value;
      persist();
      refreshSyncFields();
    });
    syncAutoChk.addEventListener('change', () => {
      S.syncAuto = syncAutoChk.checked;
      persist();
      if (S.syncAuto && cloudConfigured()) cloudPull(false).catch(() => {});
    });
    bSyncExport.addEventListener('click', () => {
      readSyncFields();
      const code = exportSyncCode(true);
      syncCode.value = code;
      copyText(code, (m) => setSyncStatus(`${m} · 同步码已复制，粘到另一台设备点「导入」`));
    });
    bSyncImport.addEventListener('click', () => {
      try {
        const data = parseSyncCode(syncCode.value);
        syncSuppress = true;
        const mg = mergeFavData(data);
        const pm = mergePinList(data.pins);
        const bm = mergeBotList(data.bots);
        if (data.sync) {
          if (data.sync.mode) S.syncMode = data.sync.mode;
          if (data.sync.url) S.syncUrl = data.sync.url;
          if (data.sync.token) S.syncToken = data.sync.token;
          if (data.sync.gist) S.syncGist = data.sync.gist;
          if (data.sync.auto !== undefined) S.syncAuto = !!data.sync.auto;
          syncUrlInput.value = S.syncUrl || '';
          syncTokenInput.value = S.syncToken || '';
          syncGistInput.value = S.syncGist || '';
          syncModeSel.value = S.syncMode;
          syncAutoChk.checked = !!S.syncAuto;
          refreshSyncFields();
        }
        favRaw.ts = nowMs();
        try { localStorage.setItem(LS_FAV2, JSON.stringify(favRaw)); } catch (e) {}
        syncSuppress = false;
        persist();
        refreshFolderUI();
        favFolderSel.value = folderOptions(true, false).some(([v]) => v === S.favFolder) ? S.favFolder : 'all';
        renderFavs();
        syncFavPick();
        refreshStarBadge();
        if (pinUiRefresh) pinUiRefresh();
        if (pm.added || bm.added) pinRefreshSnaps();
        setSyncStatus(
          (mg.folders + mg.items ? `已导入并合并：${mg.folders} 个文件夹 / ${mg.items} 个角色` : '已导入同步码，收藏数据已是最新') +
            (pm.added ? ` · 置顶 +${pm.added}` : '') +
            (bm.added ? ` · 置底 +${bm.added}` : '')
        );
      } catch (e) {
        syncSuppress = false;
        setSyncStatus('导入失败：' + (e && e.message ? e.message : e));
      }
    });
    const afterFavImport = (r, from, filtered) => {
      refreshFolderUI();
      renderFavs();
      syncFavPick();
      refreshStarBadge();
      setFavStatus(favCountText());
      setSyncStatus(
        `已${from}：新增 ${r.added} 个角色 / 新建 ${r.folders} 个收藏夹，保留 ${r.dup} 个已有收藏` +
          (filtered && filtered.skipped ? `，跳过 ${filtered.skipped} 个未上市 / 查不到的角色` : '') +
          (filtered && !filtered.checked ? '（接口没连上，本次未做上市校验）' : '')
      );
      refreshFavs();
    };
    const runFavImport = async (entries, from) => {
      if (!entries.length) { setSyncStatus('没读到角色 ID'); return; }
      setSyncStatus('正在核对角色是否已上市…');
      const filtered = await favFilterListed(entries);
      if (!filtered.entries.length) {
        setSyncStatus('这些角色都未上市或查不到，已全部跳过');
        return;
      }
      const named = filtered.entries.map((e) => {
        const nm = filtered.names && filtered.names.get(String(e.id));
        return e.name || !nm ? e : { ...e, name: nm };
      });
      const r = favMerge(named);
      favImportBox.hidden = true;
      afterFavImport(r, from, filtered);
    };
    bFavImport.addEventListener('click', () => {
      try {
        const found = favScanLocal();
        if (found.length) {
          let entries = [];
          for (let i = 0; i < found.length; i++) entries = entries.concat(found[i].entries);
          runFavImport(entries, `从本机新版小圣杯收藏（${found.map((f) => f.key).join('、')}）导入`)
            .catch((e) => setSyncStatus('导入失败：' + ((e && e.message) || e)));
        } else {
          favImportBox.hidden = false;
          setSyncStatus('本机没找到新版小圣杯的收藏数据：把新版收藏夹导出的 JSON 或角色 ID 粘到下面，再点「导入这段数据」');
        }
      } catch (e) {
        setSyncStatus('导入失败：' + ((e && e.message) || e));
      }
    });
    bFavImportPaste.addEventListener('click', () => {
      try {
        const raw = String(favImportText.value || '').trim();
        if (!raw) return setSyncStatus('粘贴内容是空的');
        let val = null;
        let parsed = false;
        try { val = JSON.parse(raw); parsed = true; } catch (e) {}
        const entries = parsed ? favParse(val) : favParseText(raw);
        if (!entries.length) return setSyncStatus('没从这段内容里读到角色 ID');
        favImportText.value = '';
        runFavImport(entries, '导入粘贴的收藏数据')
          .catch((e) => setSyncStatus('导入失败：' + ((e && e.message) || e)));
      } catch (e) {
        setSyncStatus('导入失败：' + ((e && e.message) || e));
      }
    });
    bSyncCreate.addEventListener('click', async () => {
      readSyncFields();
      if (!S.syncToken) return setSyncStatus('先填 GitHub token（创建时只需 gist 权限）');
      setSyncStatus('正在创建私密 Gist…');
      try {
        S.syncGist = await cloudCreateGist(S.syncToken);
        S.syncMode = 'gist';
        syncGistInput.value = S.syncGist;
        syncModeSel.value = 'gist';
        persist();
        refreshSyncFields();
        setSyncStatus(`已创建 Gist ${S.syncGist} · 导出同步码带到另一台设备即可`);
      } catch (e) { setSyncStatus('创建失败：' + (e && e.message ? e.message : e)); }
    });
    bSyncUpload.addEventListener('click', async () => {
      readSyncFields();
      if (!cloudConfigured()) return setSyncStatus('先配置云同步（接口地址，或 GitHub token + Gist ID）');
      setSyncStatus('正在上传…');
      try { await cloudPush(true); } catch (e) { setSyncStatus('上传失败：' + (e && e.message ? e.message : e)); }
    });
    bSyncDownload.addEventListener('click', async () => {
      readSyncFields();
      if (!cloudConfigured()) return setSyncStatus('先配置云同步');
      setSyncStatus('正在下载…');
      try { await cloudPull(true); } catch (e) { setSyncStatus('下载失败：' + (e && e.message ? e.message : e)); }
    });

    favAddInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') favAddBtn.click();
    });
    favSortSel.addEventListener('change', () => {
      S.favSort = favSortSel.value;
      persist();
      renderFavs();
    });

    const syncMagic = () => {
      hideCharaSuggest();
      hideFavPop();
      mModes.forEach((b) => b.classList.toggle('tgtk-on', b.dataset.magic === S.magic));
      const def = MAGIC_DEFS[S.magic];
      mToWrap.hidden = !def.needTarget;
      mFillMaxWrap.hidden = !S.mFill;
      mTip.textContent = def.tip;
      mTimes.value = String(magicTimes(S.magic));
      mTimes.title = `本次执行次数；${def.name}每日上限 ${def.daily} 次`;
      setMagicStatus('');
      refreshMagicPreview();
    };

    mModes.forEach((b) =>
      b.addEventListener('click', () => {
        S.magic = b.dataset.magic;
        persist();
        syncMagic();
      })
    );

    mFrom.addEventListener('input', () => {
      S.mFrom = mFrom.value;
      persist();
      refreshMagicPreview();
    });
    mFrom.addEventListener('blur', () => {
      const id = parseCharId(mFrom.value);
      if (id) loadNames([id], true).then(() => els && refreshMagicPreview());
    });
    mTo.addEventListener('input', () => {
      S.mTo = mTo.value;
      persist();
      refreshMagicPreview();
    });
    mTo.addEventListener('blur', () => {
      const id = parseCharId(mTo.value);
      if (id) loadNames([id], true).then(() => els && refreshMagicPreview());
    });
    mTimes.addEventListener('input', () => {
      S.mTimesBy[S.magic] = Math.max(1, Math.min(50, Math.floor(num(mTimes.value) || 1)));
      persist();
      refreshMagicPreview();
    });
    mTimes.addEventListener('blur', () => {
      mTimes.value = String(magicTimes(S.magic));
    });
    mStop.addEventListener('change', () => {
      S.mStop = mStop.checked;
      persist();
    });
    mFill.addEventListener('change', () => {
      S.mFill = mFill.checked;
      persist();
      syncMagic();
    });
    mFillMax.addEventListener('input', () => {
      const raw = String(mFillMax.value == null ? '' : mFillMax.value).trim();
      S.mFillMax = raw === '' ? '' : Math.max(1, Math.floor(num(raw) || 1));
      persist();
    });
    mFillMax.addEventListener('blur', () => {
      mFillMax.value = S.mFillMax === '' || S.mFillMax === undefined ? '' : String(Math.max(1, Math.floor(num(S.mFillMax) || 300)));
    });
    mRun.addEventListener('click', runMagic);
    mStopBtn.addEventListener('click', () => {
      magicRunning = false;
      setMagicStatus('正在停止…（当前这一发会执行完）');
    });

    sChar.addEventListener('input', () => {
      S.starChar = sChar.value;
      persist();
      refreshStarEstimate();
      scheduleStarCache();
    });
    sAmount.addEventListener('input', () => {
      S.starAmount = Math.max(1, Math.min(1000000, Math.floor(num(sAmount.value) || 100)));
      persist();
      refreshStarEstimate();
    });
    sAmount.addEventListener('blur', () => {
      sAmount.value = String(Math.max(1, Math.min(1000000, Math.floor(num(S.starAmount) || 100))));
    });
    sEndModes.forEach((b) =>
      b.addEventListener('click', () => {
        S.starEndFill = b.dataset.endfill === '250' || b.dataset.endfill === 'none' ? b.dataset.endfill : 'full';
        persist();
        syncStarEnd();
        refreshStarEstimate();
      })
    );
    sFill.addEventListener('change', () => {
      S.starFill = sFill.checked;
      persist();
      refreshStarEstimate();
      scheduleStarCache();
    });
    refreshStarEstimate();
    syncStarEnd();
    scheduleStarCache();
    sRun.addEventListener('click', runStar);
    sStop.addEventListener('click', () => {
      starRunning = false;
      setStarStatus('正在停止…（当前这一次会执行完）');
    });

    sdTarget.addEventListener('input', () => {
      S.sdTarget = sdTarget.value;
      if (String((sdTargetInfo && sdTargetInfo.cid) || '') !== String(parseCharId(sdTarget.value) || '')) {
        sdTargetInfo = null;
      }
      persist();
      renderSdPick();
    });
    sdTarget.addEventListener('blur', async () => {
      const id = parseCharId(sdTarget.value);
      if (!id) return;
      S.sdTarget = id;
      sdTarget.value = id;
      persist();
      if (!sdHold.length) await loadFuel();
      else renderFuel();
      await refreshSdTarget();
    });
    sdQuery.addEventListener('input', () => {
      S.sdQuery = sdQuery.value;
      persist();
      if (sdHold.length) renderFuel();
    });
    sdLoad.addEventListener('click', loadFuel);
    sdSort.addEventListener('click', () => {
      S.sdSortAsc = !S.sdSortAsc;
      persist();
      renderFuel();
    });
    sdLevel.addEventListener('input', () => {
      const raw = String(sdLevel.value || '').trim();
      S.sdLevel = raw === '' ? '' : Math.max(0, Math.floor(num(raw)));
      persist();
      if (sdHold.length) renderFuel();
    });
    sdList.addEventListener('click', (e) => {
      if (e.target && e.target.closest && e.target.closest('a')) return;
      const row = e.target && e.target.closest ? e.target.closest('.tgtk-sdrow') : null;
      const id = row && row.getAttribute('data-sdid');
      if (!id) return;
      const queued = sdQueue().indexOf(String(id)) >= 0;
      if (!queued) {
        const it = sdHold.find((x) => String(x.CharacterId) === String(id));
        if (it && num(it.UserAmount) <= 0) {
          setSdStatus(`「${it.Name || charaName(id)}」没有可用活股（全挂了卖单？），不能当燃料；点名字可打开角色页取消挂单`);
          return;
        }
      }
      pickFuel(id);
    });
    sdPick.addEventListener('click', (e) => {
      const t = e.target && e.target.closest ? e.target : null;
      const rm = t && t.closest ? t.closest('[data-sdremove]') : null;
      const clr = t && t.closest ? t.closest('[data-sdclear]') : null;
      if (!rm && !clr) return;
      const q = sdQueue();
      if (clr) S.sdFroms = [];
      else {
        const id = String(rm.getAttribute('data-sdremove'));
        S.sdFroms = q.filter((x) => x !== id);
      }
      persist();
      renderFuel();
    });
    sdAmount.addEventListener('input', () => {
      S.sdAmount = Math.max(1, Math.floor(num(sdAmount.value) || 1));
      persist();
      renderSdEstimate();
    });
    sdAmount.addEventListener('blur', () => {
      sdAmount.value = String(Math.max(1, Math.floor(num(S.sdAmount) || 1)));
      renderSdEstimate();
    });
    sdRun.addEventListener('click', runStardust);

    icoLoad.addEventListener('click', () => loadIco());
    icoAdv.addEventListener('input', () => {
      S.icoAdvance = Math.max(1, Math.min(180, Math.floor(num(icoAdv.value) || 1)));
      persist();
    });
    icoAdv.addEventListener('blur', () => {
      icoAdv.value = String(Math.floor(num(S.icoAdvance) || 1));
    });
    icoList.addEventListener('click', (e) => {
      const b = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
      if (!b) return;
      toggleIcoAuto(b.getAttribute('data-ico'));
    });
    icoList.addEventListener('change', (e) => {
      const sel = e.target && e.target.closest ? e.target.closest('.tgtk-icosel') : null;
      if (!sel) return;
      const id = String(sel.getAttribute('data-ico'));
      const cfg = icoCfgOf(id) || {};
      const lv = Math.max(1, Math.min(20, num(sel.value) || 1));
      S.icoCfg[id] = Object.assign({}, cfg, { lv: lv });
      persist();
      if (cfg.on) {
        pushIcoLog('info', `目标等级改为 Lv${lv}`);
        icoAutoCheck();
      }
      renderIco();
    });
    startIcoTicker();

    lDays.addEventListener('change', () => {
      if (lDays.value === 'custom') {
        S.logDays = 'custom';
        if (!S.logFrom) S.logFrom = dayStr(dayStartMs(6));
        if (!S.logTo) S.logTo = dayStr(dayStartMs(0));
        lFrom.value = S.logFrom;
        lTo.value = S.logTo;
        syncRange();
      } else {
        S.logDays = num(lDays.value) || 7;
      }
      persist();
      if (logAll.length) scanLogs();
    });
    [lFrom, lTo].forEach((inp) =>
      inp.addEventListener('change', () => {
        S.logFrom = lFrom.value || '';
        S.logTo = lTo.value || '';
        persist();
        if (logAll.length) scanLogs();
      })
    );
    lSort.addEventListener('change', () => {
      S.logSort = lSort.value;
      persist();
      if (logAll.length) renderLedger();
    });
    lTop.addEventListener('change', () => {
      S.logTop = num(lTop.value) || 20;
      persist();
      if (logAll.length) renderLedger();
    });
    segBtns.forEach((b) =>
      b.addEventListener('click', () => {
        S.ledgerView = b.dataset.view || 'fund';
        persist();
        if (logAll.length) renderLedger();
      })
    );
    lRun.addEventListener('click', scanLogs);
    lCopy.addEventListener('click', copyLogs);

    attachCharaSuggest(tChars, { append: true, noKeys: true });
    attachCharaSuggest(fInput, { append: true, noKeys: true, numId: true });
    attachCharaSuggest(mFrom, { blur: true, numId: true });
    attachCharaSuggest(mTo, { blur: true, numId: true });
    attachCharaSuggest(sChar, { append: true, numId: true });
    attachCharaSuggest(hSearch, { append: true, numId: true, noEnter: true });
    attachCharaSuggest(sdTarget, { blur: true, numId: true });
    attachCharaSuggest(sdQuery, { blur: true, numId: true, append: true });
    attachCharaSuggest(favAddInput, {
      noEnter: true,
      numId: true,
      append: true,
      onPick: () => favAddBtn.click(),
    });

    bindFavPicker(mFromFav, mFrom);
    bindFavPicker(mToFav, mTo);
    bindFavPicker(sCharFav, sChar, { multi: true });
    bindFavPicker(hSearchFav, hSearch);
    bindFavPicker(sdTargetFav, sdTarget);
    bindFavPicker(sdQueryFav, sdQuery);
    bindFavPicker(fInputFav, fInput, { multi: true });

    els.noteBtn.addEventListener('click', () => setNoteMode(els.noteView.hidden));
    els.noteText.value = loadNote();
    els.noteText.addEventListener('input', () => {
      noteDirty = true;
      setNoteStat(noteStatLine('编辑中…'));
      clearTimeout(noteSaveTimer);
      noteSaveTimer = setTimeout(noteFlush, 280);
    });
    els.noteText.addEventListener('blur', noteFlush);
    noteCopy.addEventListener('click', () => {
      const txt = String(els.noteText.value || '');
      if (!txt.trim()) return setNoteStat(noteStatLine('还是空的'));
      copyText(txt, () => setNoteStat(noteStatLine('已复制')));
    });
    noteClear.addEventListener('click', () => {
      if (!noteClearArmed) {
        noteClearArmed = true;
        noteClear.textContent = '再点一次确认';
        setTimeout(() => {
          noteClearArmed = false;
          noteClear.textContent = '清空';
        }, 3500);
        return;
      }
      noteClearArmed = false;
      noteClear.textContent = '清空';
      els.noteText.value = '';
      noteDirty = true;
      noteFlush();
      setNoteStat(noteStatLine('已清空'));
      try { els.noteText.focus(); } catch (e) {}
    });

    closeBtn.addEventListener('click', () => togglePanel(false));
    themeBtn.addEventListener('click', () => {
      S.theme = S.theme === 'light' ? 'dark' : 'light';
      panel.dataset.theme = S.theme;
      if (favPop) favPop.dataset.theme = S.theme;
      if (starPop) starPop.dataset.theme = S.theme;
      if (starBadge) starBadge.dataset.theme = S.theme;
      themeBtn.textContent = S.theme === 'light' ? '☾' : '☀';
      persist();
    });

    const onKey = (e) => {
      if (e.isComposing) return;
      if (e.key === 'Escape' && noteMode) {
        e.stopPropagation();
        setNoteMode(false);
        return;
      }
      if (e.key === 'Escape' && movePop) {
        e.stopPropagation();
        hideMovePop();
        return;
      }
      if (e.key === 'Escape' && starPop) {
        e.stopPropagation();
        hideStarPop();
        return;
      }
      if (e.key === 'Escape' && favPop) {
        e.stopPropagation();
        hideFavPop();
        return;
      }
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        if (S.fabHidden) toggleFab(false);
        togglePanel();
      } else if (e.key === 'Escape' && !panel.hidden) {
        togglePanel(false);
      }
    };
    DOCS.forEach((d) => d.addEventListener('keydown', onKey));

    sortWrap.hidden = S.ledgerView !== 'stock';
    syncTab();
    syncSource();
    syncMagic();
    renderSdPick();
    if (S.sdTarget && !sdTargetInfo) {
      try { refreshSdTarget(); } catch (e) {}
    }
    if (icoRows.length) renderIco();
  }

  function setTempleStatus(msg) {
    if (els) els.templeStat.textContent = msg;
  }
  function setHoldStatus(msg) {
    if (els) els.holdStat.textContent = msg;
  }
  function setFantasyStatus(msg) {
    if (els) els.fStat.textContent = msg;
  }
  function setFavStatus(msg) {
    if (els) els.favStat.textContent = msg;
  }
  let toastTimer = 0;
  function panelToast(text) {
    if (!els || !els.panel) return;
    let box = els.panel.querySelector('.tgtk-toast');
    if (!box) {
      box = h('div', { class: 'tgtk-toast' });
      els.panel.appendChild(box);
    }
    box.textContent = text;
    box.classList.add('tgtk-toast-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('tgtk-toast-on'), 1600);
  }

  let noteMode = false;
  let noteDirty = false;
  let noteSaveTimer = 0;
  let noteClearArmed = false;

  const noteTextValue = () => (els && els.noteText ? String(els.noteText.value || '') : '');
  const noteClock = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  function setNoteStat(msg) {
    if (els && els.noteStat) els.noteStat.textContent = msg;
  }
  const noteStatLine = (tail) => `${noteTextValue().length} 字` + (tail ? ' · ' + tail : '');

  function loadNote() {
    try {
      const v = JSON.parse(localStorage.getItem(LS_NOTE) || 'null');
      if (v && typeof v.text === 'string') return v.text;
    } catch (e) {}
    return '';
  }
  function noteFlush() {
    clearTimeout(noteSaveTimer);
    if (!noteDirty || !els || !els.noteText) return;
    noteDirty = false;
    try {
      localStorage.setItem(LS_NOTE, JSON.stringify({ text: noteTextValue(), at: nowMs() }));
      setNoteStat(noteStatLine('已保存 ' + noteClock()));
    } catch (e) {
      setNoteStat(noteStatLine('保存失败：内容可能太大，或浏览器禁用了本地存储'));
    }
  }
  function setNoteMode(on) {
    if (!els || !els.noteView) return;
    noteMode = !!on;
    els.tabbar.hidden = noteMode;
    els.bodyEl.hidden = noteMode;
    els.noteView.hidden = !noteMode;
    if (els.noteBtn) els.noteBtn.classList.toggle('tgtk-on', noteMode);
    if (els.titleEl) els.titleEl.textContent = noteMode ? '随手记' : '小圣杯工具箱';
    if (noteMode) {
      if (!els.noteText.value) els.noteText.value = loadNote();
      setNoteStat(noteStatLine('自动保存'));
      setTimeout(() => {
        try {
          els.noteText.focus();
        } catch (e) {}
      }, 30);
    } else {
      noteFlush();
      hideMovePop();
      hideCharaSuggest();
    }
  }
  function clearFavAddAutofill() {
    const el = (els && els.favAddInput && els.favAddInput.isConnected)
      ? els.favAddInput
      : (HDOC && HDOC.getElementById('tgtk-favadd'));
    if (!el) return;
    const v = String(el.value || '').trim();
    if (/@|https?:\/\/|^www\./i.test(v)) {
      el.value = '';
      try { el.setAttribute('autocomplete', 'off'); } catch (e) {}
      hideCharaSuggest();
    }
  }
  function setSyncStatus(msg) {
    if (els && els.syncStat) els.syncStat.textContent = msg;
  }
  const STAR_CSS = `
#tgtk-starbox{
  position:relative;display:inline-block;flex:none;box-sizing:border-box;
  width:19px;height:19px;min-width:19px;margin:0 0 0 6px;vertical-align:middle;line-height:0}
#tgtk-starbox.tgtk-has-hist{width:0;min-width:0;margin:0;left:0;overflow:visible}
#tgtk-starbox.tgtk-has-hist>#tgtk-star.tgtk-star-inline{left:-4px}
#tgtk-starbox.tgtk-has-hist>#tgtk-hist.tgtk-hist-inline{left:19px}
#tgtk-star.tgtk-star-inline{
  display:inline-flex;align-items:center;justify-content:center;
  box-sizing:border-box;width:19px;height:19px;min-width:19px;padding:0;margin:0;
  vertical-align:middle;border:1px solid #d9cbd4;border-radius:5px;background:transparent;
  color:#9b8d97;font-family:inherit;font-size:12px;line-height:1;cursor:pointer;
  box-shadow:none;outline:none;transition:color .15s,border-color .15s,background .15s}
#tgtk-starbox>#tgtk-star.tgtk-star-inline{position:absolute;left:0;top:0}
#tgtk-star.tgtk-star-inline:hover{color:#d4568e;border-color:#d4568e;background:rgba(212,86,142,.08)}
#tgtk-star.tgtk-star-inline.tgtk-star-on{color:#b8790d;border-color:#e0a938;background:#fff3d6}
#tgtk-star[data-theme="dark"].tgtk-star-inline{border-color:#3b4150;color:#727b8d}
#tgtk-star[data-theme="dark"].tgtk-star-inline:hover{color:#e46fa1;border-color:#e46fa1;background:rgba(228,111,161,.12)}
#tgtk-star[data-theme="dark"].tgtk-star-inline.tgtk-star-on{color:#f5b73d;border-color:#a97c22;background:#3a2c14}
#tgtk-hist.tgtk-hist-inline{
  display:inline-flex;align-items:center;justify-content:center;
  box-sizing:border-box;width:19px;height:19px;min-width:19px;padding:0;margin:0;
  vertical-align:middle;border:1px solid #d9cbd4;border-radius:5px;background:transparent;
  color:#9b8d97;font-family:inherit;font-size:12px;font-weight:700;line-height:1;cursor:pointer;
  text-decoration:none;box-shadow:none;outline:none;
  transition:color .15s,border-color .15s,background .15s}
#tgtk-starbox>#tgtk-hist.tgtk-hist-inline{position:absolute;left:23px;top:0}
#tgtk-hist.tgtk-hist-inline:hover{color:#3f7cc9;border-color:#3f7cc9;background:rgba(63,124,201,.08)}
#tgtk-hist[data-theme="dark"].tgtk-hist-inline{border-color:#3b4150;color:#727b8d}
#tgtk-hist[data-theme="dark"].tgtk-hist-inline:hover{color:#6fa8e6;border-color:#6fa8e6;background:rgba(111,168,230,.12)}
`;

  let starBadge = null;
  let starBox = null; // 星标 + 「$」的 19×19 定位容器
  let starPop = null;
  let starCharId = '';
  let lastFavPickId = ''; // 收藏页「当前角色」上一次显示的 ID，弹窗换角色时立刻跟着变
  let starAnchorAfter = null;
  let starTimer = null;
  let starFavCache = { at: 0, el: null }; // 新版「收藏」按钮的查找缓存
  let starListenersBound = false;
  let histBtn = null;
  let histPop = null;

  function isHoverCardNode(el) {
    let p = el;
    for (let i = 0; p && p.nodeType === 1 && i < 10; i++, p = p.parentElement) {
      const pid = String(p.id || '');
      if (/babel-tower|rakuen-home|tg-tooltip|hover-card|character-card/i.test(pid)) return true;
      const cls = String(p.className || '');
      if (/\babsolute\b/.test(cls) && (/\bhidden\b/.test(cls) || /\bw-48\b/.test(cls))) return true;
      const role = p.getAttribute && String(p.getAttribute('role') || '');
      if (/^(tooltip|popover)$/i.test(role)) return true;
    }
    return false;
  }

  function isCharacterPage() {
    for (const d of allDocs()) {
      try {
        const badges = d.querySelector('#tg-trade-box-header-badges');
        if (badges && !isHoverCardNode(badges)) return true;
        const icons = d.querySelectorAll('#tg-star-level-icons');
        for (let i = 0; i < icons.length; i++) {
          if (!isHoverCardNode(icons[i]) && tgNodeVisible(icons[i])) return true;
        }
        for (const gb of d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox')) {
          if (/(?:^|\s)chara(\d+)(?:\s|$)/.test(String(gb.className || ''))) return true;
        }
        const href = (d.defaultView && d.defaultView.location && d.defaultView.location.href) || '';
        if (/\/(?:character|chara)\/\d+/i.test(href) || /#\/(?:character|chara)\/\d+/i.test(href)) return true;
      } catch (e) {}
    }
    return false;
  }

  const icoPageMemo = Object.create(null); // cid → true（ICO）/ false（已上市）
  let icoPageProbing = '';

  function icoByDom() {
    const re = /ICO\s*进行中|已筹集|下一等级还需/;
    for (const d of allDocs()) {
      try {
        for (const gb of d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox')) {
          if (!/(?:^|\s)chara(\d+)(?:\s|$)/.test(String(gb.className || ''))) continue;
          return re.test(String(gb.textContent || '').slice(0, 4000)) ? 'ico' : 'trade';
        }
        for (const box of d.querySelectorAll('#tg-trade-box,[id^="tg-trade-box"],[class*="tradeBox"]')) {
          const t = String(box.textContent || '').slice(0, 4000);
          if (/ICO\s*进行中|已筹集|下一等级还需/.test(t)) return 'ico';
        }
      } catch (e) {}
    }
    return '';
  }

  function probeIcoPage(cid) {
    if (!cid || icoPageProbing === cid || cid in icoPageMemo) return;
    icoPageProbing = cid;
    api('chara/' + cid)
      .then((v) => {
        icoPageMemo[cid] = !!(v && v.End && !num(v.Level) && !v.ListedDate);
      })
      .catch(() => {
        icoPageMemo[cid] = false;
      })
      .then(() => {
        if (icoPageProbing === cid) icoPageProbing = '';
      });
  }

  function isIcoPage(cid) {
    const dom = icoByDom();
    if (dom === 'trade') return false;
    if (dom === 'ico') return true;
    if (cid && icoPageMemo[cid] === true) return true;
    if (cid && !(cid in icoPageMemo)) probeIcoPage(cid);
    return false;
  }

  function findStarAnchor() {
    if (!isCharacterPage()) return null;
    const newSels = [
      '#tg-star-level-icons',
      '#tg-trade-box-header-badges',
      '[id*="star-level"]',
      '[class*="star-level"]',
      '[id*="star-count"]',
    ];
    const starText = /^[⭐★☆🌟✦✧\s\uFE0F\u200D]{1,14}$/;
    const starLoose = /[⭐★☆🌟✦✧]/;
    const hasStar = /[⭐★☆🌟✦✧]/;
    for (const d of allDocs()) {
      const favb = gxNewFavBtn(d);
      if (favb && favb.parentElement) {
        return { doc: d, parent: favb.parentElement, after: favb, append: false, fav: true };
      }
      for (const sel of newSels) {
        let el;
        try { el = d.querySelector(sel); } catch (e) { continue; }
        if (!el || !el.isConnected || !el.parentElement) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        return { doc: d, parent: el.parentElement, after: el, append: false };
      }
      let box = null;
      try {
        for (const gb of d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox')) {
          if (gb.hasAttribute && gb.hasAttribute('data-tgtk-dup')) continue; // 被去重隐藏的副本
          if (/(?:^|\s)chara(\d+)(?:\s|$)/.test(String(gb.className || ''))) { box = gb; break; }
        }
      } catch (e) {}
      if (box && box.isConnected) {
        try {
          let kline = null;
          for (const el of box.querySelectorAll('a,.text_button,span,em,b,i,button,div')) {
            if (el.id === 'tgtk-star' || !el.parentElement) continue;
            const t = String(el.textContent || '').trim();
            if (!/^\[?\s*K\s*线(?:图)?\s*\]?$/.test(t)) continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            if (!kline || el.contains(kline)) kline = el;
          }
          if (kline) {
            return { doc: d, parent: kline.parentElement, after: kline, append: false, legacy: true, kline: true };
          }
        } catch (e) {}
        try {
          let best = null, bestLen = Infinity;
          for (const el of box.querySelectorAll('div,span,small,em,b,i,font')) {
            const t = String(el.textContent || '').trim();
            if (!/上市等级/.test(t) || t.length > 120 || el.id === 'tgtk-star') continue;
            if (t.length < bestLen) { best = el; bestLen = t.length; }
          }
          if (best && best.parentElement) {
            const r = best.getBoundingClientRect();
            if (r.width && r.height) {
              const isRow = bestLen > 20 || best.children.length >= 2;
              if (isRow) {
                return { doc: d, parent: best, after: best.lastElementChild || best, append: true, legacy: true };
              }
              return { doc: d, parent: best.parentElement, after: best, append: false, legacy: true };
            }
          }
        } catch (e) {}
        try {
          const cand = box.querySelectorAll('span,div,i,b,em,img');
          for (let i = 0; i < cand.length; i++) {
            const el = cand[i];
            if (el.id === 'tgtk-star' || !el.parentElement) continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height || r.width > 200) continue;
            const t = String(el.textContent || '').trim();
            const isTxt = (starText.test(t) || (t.length <= 12 && starLoose.test(t))) && hasStar.test(t);
            const isImg = el.tagName === 'IMG' &&
              /star|level|rank/i.test((el.getAttribute('src') || '') + ' ' + (el.getAttribute('class') || ''));
            if (isTxt || isImg) return { doc: d, parent: el.parentElement, after: el, append: false, legacy: true };
          }
        } catch (e) {}
        try {
          const texts = box.querySelectorAll('.title .info .text,.info .text,.title .text');
          for (let i = 0; i < texts.length; i++) {
            const el = texts[i];
            if (el.children.length > 12 || !el.parentElement) continue;
            if (!el.querySelector('.tag,.badge,[class*="badge"],[class*="star"]')) continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            return { doc: d, parent: el, after: el.lastElementChild || el, append: true, legacy: true };
          }
        } catch (e) {}
        try {
          const btns = box.querySelectorAll('.text_button');
          if (btns.length >= 2) {
            const row = btns[0].parentElement;
            const r = row && row.getBoundingClientRect();
            if (row && r.width && r.height) {
              return { doc: d, parent: row, after: row.lastElementChild || row, append: true, legacy: true };
            }
          }
        } catch (e) {}
        try {
          const info = box.querySelector('.title .info,.title') || box;
          const r = info.getBoundingClientRect();
          if (r.width && r.height) {
            return { doc: d, parent: info, after: info.lastElementChild || info, append: true, legacy: true };
          }
        } catch (e) {}
      }
      try {
        const cand = d.querySelectorAll('div,span');
        for (let i = 0; i < cand.length; i++) {
          const el = cand[i];
          if (el.id === 'tgtk-star' || el.children.length > 10 || !el.parentElement) continue;
          const t = String(el.textContent || '').trim();
          if (!starText.test(t) || !hasStar.test(t)) continue;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height || r.width > 260) continue;
          return { doc: d, parent: el.parentElement, after: el, append: false };
        }
      } catch (e) {}
    }
    return null;
  }

  function starBesideFav(box, btn) {
    if (!box) return;
    const doc = box.ownerDocument;
    const win = (doc && doc.defaultView) || window;
    const reset = () => {
      box.style.position = '';
      box.style.left = '';
      box.style.top = '';
      box.style.margin = '';
    };
    if (!btn || !btn.parentElement) {
      reset();
      return;
    }
    const flexOf = (el) => {
      let cs = null;
      try {
        cs = win.getComputedStyle(el);
      } catch (e) {}
      const dir = String((cs && cs.flexDirection) || (el.style && el.style.flexDirection) || '');
      if (/column/.test(dir)) return 'col';
      if (/row/.test(dir)) return 'row';
      const cls = String(el.className || '').split(' ');
      if (cls.indexOf('flex-col') >= 0) return 'col';
      if (cls.indexOf('flex-row') >= 0) return 'row';
      if (cls.indexOf('flex') >= 0) return 'row';
      if (cs && /flex/.test(String(cs.display || ''))) return 'row';
      return '';
    };
    let par = btn.parentElement;
    let host = null;
    for (let i = 0; i < 2 && par; i++, par = par.parentElement) {
      const kind = flexOf(par);
      if (kind === 'col') {
        host = par;
        break;
      }
      if (kind === 'row') break;
    }
    if (!host) {
      reset();
      return;
    }
    try {
      let cs = null;
      try {
        cs = win.getComputedStyle(host);
      } catch (e) {}
      if (!cs || cs.position === 'static') host.style.position = 'relative';
      box.style.position = 'absolute';
      box.style.margin = '0';
      box.style.left = btn.offsetLeft + btn.offsetWidth + 6 + 'px';
      box.style.top = btn.offsetTop + 'px';
    } catch (e) {}
  }

  function ensureStarStyle(doc) {
    if (!doc || doc.getElementById('tgtk-star-style')) return;
    try {
      const st = doc.createElement('style');
      st.id = 'tgtk-star-style';
      st.textContent = STAR_CSS;
      (doc.head || doc.documentElement).appendChild(st);
    } catch (e) {}
  }

  const HIST_SPAN_DAYS = 120;

  function histFrom(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T00:00:00+08:00`;
  }

  function hideHistPop() {
    if (histPop) {
      histPop.remove();
      histPop = null;
    }
  }

  function positionHistPop(pop, anchor) {
    const r = absRect(anchor || histBtn);
    const vw = HWIN.innerWidth || 1280;
    const vh = HWIN.innerHeight || 800;
    const w = pop.offsetWidth || 430;
    const h = pop.offsetHeight || 360;
    const left = Math.min(Math.max(6, r.left), Math.max(6, vw - w - 6));
    let top = r.bottom + 6;
    if (top + h > vh - 6) top = r.top - h - 6;
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(Math.max(6, top)) + 'px';
  }

  function openHistPop(anchor, cid) {
    hideHistPop();
    hideStarPop();
    hideFavPop();
    if (!cid) return;
    const pop = h('div', { class: 'tgtk-histpop tgtk-gxcenter', 'data-theme': S.theme === 'light' ? 'light' : 'dark' });
    histPop = pop;
    const close = h('button', { class: 'tgtk-favclose', type: 'button', title: '关闭' }, '×');
    close.addEventListener('click', hideHistPop);
    const title = h('span', null, nameCache[cid] ? `「${nameCache[cid]}」历史交易` : `#${cid} 历史交易`);
    const head = h('div', { class: 'tgtk-favhead' }, title, close);
    const sum = h('div', { class: 'tgtk-histsum' }, '读取中…');
    const list = h('div', { class: 'tgtk-histlist' });
    const more = h('button', { class: 'tgtk-btn', type: 'button' }, '加载更早');
    const stat = h('span', { class: 'tgtk-histstat' }, '');
    const foot = h('div', { class: 'tgtk-histfoot' }, stat, more);
    pop.appendChild(head);
    pop.appendChild(sum);
    pop.appendChild(list);
    pop.appendChild(foot);
    HDOC.body.appendChild(pop);
    if (!nameCache[cid]) {
      api(`chara/${cid}`)
        .then((c) => {
          if (!c || !c.Name) return;
          nameCache[cid] = c.Name;
          if (histPop === pop) title.textContent = `「${c.Name}」历史交易`;
        })
        .catch(() => {});
    }

    let span = HIST_SPAN_DAYS;
    const rows = [];
    const seen = new Set();

    const draw = () => {
      list.textContent = '';
      list.appendChild(
        h(
          'div',
          { class: 'tgtk-histrow tgtk-histhd' },
          h('i', null, '时间'),
          h('i', null, '均价'),
          h('i', null, '数量'),
          h('i', null, '金额')
        )
      );
      if (!rows.length) {
        list.appendChild(h('div', { class: 'tgtk-histempty' }, '这段时间里没有成交记录'));
        return;
      }
      rows.forEach((r) => {
        const amt = num(r.Amount);
        const money = num(r.Price);
        list.appendChild(
          h(
            'div',
            {
              class: 'tgtk-histrow',
              title: `开 ₵${fmt(r.Begin, 2)} → 收 ₵${fmt(r.End, 2)}｜最低 ₵${fmt(r.Low, 2)}｜最高 ₵${fmt(r.High, 2)}`,
            },
            h('i', null, String(r.Time || '').replace('T', ' ').slice(5, 16)),
            h('i', null, '₵' + fmt(amt > 0 ? money / amt : 0, 2)),
            h('i', null, fmt(amt)),
            h('i', null, '₵' + fmt(money, 2))
          )
        );
      });
    };

    const load = async (step) => {
      more.disabled = true;
      sum.textContent = '读取中…';
      if (step) span += step;
      const before = rows.length;
      try {
        const value = await api(`chara/charts/${cid}/${encodeURIComponent(histFrom(span))}`);
        const items = Array.isArray(value) ? value : (value && value.Items) || [];
        items.forEach((r) => {
          if (!r || seen.has(r.Id)) return;
          seen.add(r.Id);
          rows.push(r);
        });
        rows.sort((a, b) => String(b.Time || '').localeCompare(String(a.Time || '')));
        const totalAmt = rows.reduce((s, r) => s + num(r.Amount), 0);
        const totalMoney = rows.reduce((s, r) => s + num(r.Price), 0);
        sum.textContent = rows.length
          ? `近 ${span} 天 · ${rows.length} 条 · 成交 ${fmt(totalAmt)} 股 · 金额 ₵${fmt(totalMoney, 2)}`
          : `近 ${span} 天 · 暂无成交`;
        const oldest = rows.length
          ? String(rows[rows.length - 1].Time || '').replace('T', ' ').slice(0, 10)
          : '';
        stat.textContent = oldest ? `最早 ${oldest}` : '';
        draw();
        if (rows.length === before) {
          more.disabled = true;
          more.textContent = '已到最早';
        } else {
          more.disabled = false;
          more.textContent = '加载更早';
        }
      } catch (e) {
        sum.textContent = '读取失败：' + (e && e.message ? e.message : String(e));
        if (!rows.length) draw();
        more.disabled = false;
        more.textContent = '重试';
      }
    };
    more.addEventListener('click', () => load(HIST_SPAN_DAYS));
    load(0);
  }

  function hideStarPop() {
    if (starPop) starPop.remove();
    starPop = null;
  }

  function refreshStarBadge() {
    if (!starBadge || !starBadge.isConnected) return;
    const id = currentCharacterId();
    const on = !!id && isFav(id);
    starBadge.classList.toggle('tgtk-star-on', on);
    starBadge.textContent = on ? '★' : '☆';
    starBadge.title = on
      ? `已收藏 #${id}${nameCache[id] ? ' ' + nameCache[id] : ''} · 点开可换收藏夹 / 移出`
      : id ? `收藏当前角色 #${id} 到收藏夹` : '当前不是角色页';
  }

  function positionStarPop(pop, anchor) {
    const r = absRect(anchor || starBadge);
    const vw = HWIN.innerWidth || 1280;
    const vh = HWIN.innerHeight || 800;
    const w = pop.offsetWidth || 240;
    const h = pop.offsetHeight || 260;
    let left = r.right + 6;
    if (left + w > vw - 6) left = Math.max(6, r.left - w - 6);
    const top = Math.max(6, Math.min(r.top, vh - h - 6));
    pop.style.left = Math.max(6, Math.min(left, vw - w - 6)) + 'px';
    pop.style.top = top + 'px';
  }

  function openStarPop(anchor) {
    const id = currentCharacterId();
    if (!id) { setFavStatus('当前页面没识别到角色 ID，可在「收藏」页手动添加'); return; }
    hideStarPop();
    hideFavPop();
    hideCharaSuggest();
    const btn = anchor || starBadge;
    const pop = h('div', { class: 'tgtk-starpop', 'data-theme': S.theme === 'light' ? 'light' : 'dark' });
    starPop = pop;
    const close = h('button', { class: 'tgtk-favclose', type: 'button', title: '关闭' }, '×');
    const head = h('div', { class: 'tgtk-favhead' },
      h('span', null, `#${id}${nameCache[id] ? ' ' + nameCache[id] : ''}`), close);
    close.addEventListener('click', hideStarPop);
    const tip = h('div', { class: 'tgtk-startip' }, '勾选要加入的收藏夹（可多选），点右下角「确定」后生效');
    const list = h('div', { class: 'tgtk-favpoplist' });
    const pending = new Set(favFoldersOf(id));
    const renderList = () => {
      list.textContent = '';
      folderOptions(false, false).forEach(([fid, label]) => {
        const on = pending.has(fid);
        const row = h('div', { class: 'tgtk-favrow' + (on ? ' tgtk-on' : '') },
          h('span', { class: 'tgtk-favname', title: folderPath(fid) }, label),
          h('span', { class: 'tgtk-favid' }, on ? '✓ 已选' : '未选'));
        row.addEventListener('click', () => {
          if (pending.has(fid)) pending.delete(fid);
          else pending.add(fid);
          renderList();
        });
        list.appendChild(row);
      });
      if (favFoldersOf(id).length) {
        const rm = h('button', { class: 'tgtk-btn tgtk-danger tgtk-starremove', type: 'button' }, '全部不选（移出所有夹）');
        rm.addEventListener('click', () => { pending.clear(); renderList(); });
        list.appendChild(rm);
      }
    };
    renderList();
    const newName = input('tgtk-star-newname', '', { placeholder: '新收藏夹名称' });
    const createBtn = h('button', { class: 'tgtk-btn', type: 'button' }, '＋ 新建夹');
    createBtn.addEventListener('click', () => {
      const name = newName.value.trim();
      if (!name) { newName.focus(); return; }
      const f = addFolder(name);
      refreshFolderUI();
      pending.add(f.id); // 只勾选，等「确定」一起提交
      newName.value = '';
      renderList();
    });
    const createRow = h('div', { class: 'tgtk-starcreate' },
      h('div', { class: 'tgtk-startip' }, '或新建收藏夹：'),
      h('div', { class: 'tgtk-line tgtk-actions' }, newName, createBtn));
    const cancelBtn = h('button', { class: 'tgtk-btn', type: 'button' }, '取消');
    cancelBtn.addEventListener('click', hideStarPop);
    const okBtn = h('button', { class: 'tgtk-btn tgtk-primary', type: 'button' }, '确定');
    okBtn.addEventListener('click', () => {
      const before = new Set(favFoldersOf(id));
      let addedHere = false;
      folderOptions(false, false).forEach(([fid]) => {
        if (pending.has(fid) && !before.has(fid)) {
          addFav(id, '', fid);
          addedHere = true;
        } else if (!pending.has(fid) && before.has(fid)) removeFavKey(itemKey(fid, id));
      });
      hideStarPop();
      refreshFolderUI();
      syncFavPick();
      refreshStarBadge();
      if (els && els.favList) {
        renderFavs();
        setFavStatus(favCountText());
        if (addedHere) {
          refreshOneFav(id);
          panelToast('收藏成功');
        }
      }
    });
    const foot = h('div', { class: 'tgtk-line tgtk-actions tgtk-starfoot' }, cancelBtn, okBtn);
    pop.appendChild(head);
    pop.appendChild(tip);
    pop.appendChild(list);
    pop.appendChild(createRow);
    pop.appendChild(foot);
    HDOC.body.appendChild(pop);
    positionStarPop(pop, btn);
  }

  function startStarBadge() {
    if (starTimer) clearInterval(starTimer);
    const ensure = () => {
      if (!isCharacterPage()) {
        starAnchorAfter = null;
        if (starBox && starBox.isConnected) starBox.remove();
        if (starBadge && starBadge.isConnected) starBadge.remove();
        if (histBtn && histBtn.isConnected) histBtn.remove();
        hideStarPop();
        hideHistPop();
        return;
      }
      const id = currentCharacterId();
      if (isIcoPage(id)) {
        starAnchorAfter = null;
        if (starBox && starBox.isConnected) starBox.remove();
        if (starBadge && starBadge.isConnected) starBadge.remove();
        if (histBtn && histBtn.isConnected) histBtn.remove();
        hideStarPop();
        hideHistPop();
        return;
      }
      const anchor = findStarAnchor();
      const inHoverCard = !!anchor &&
        (isHoverCardNode(anchor.after) || isHoverCardNode(anchor.parent));
      if (!anchor || inHoverCard) {
        starAnchorAfter = null;
        if (starBox && starBox.isConnected) starBox.remove();
        if (starBadge && starBadge.isConnected) starBadge.remove();
        if (histBtn && histBtn.isConnected) histBtn.remove();
        hideStarPop();
        hideHistPop();
        return;
      }
      if (!starBadge) {
        starBadge = h('button', { id: 'tgtk-star', class: 'tgtk-star', type: 'button', title: '' }, '☆');
        starBadge.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openStarPop(starBadge);
        });
      }
      ensureStarStyle(anchor.doc);
      if (!starBox) starBox = h('span', { id: 'tgtk-starbox' });
      const sameAnchor = starAnchorAfter && starAnchorAfter.isConnected &&
        starAnchorAfter === (anchor.append ? anchor.parent : anchor.after);
      if (!starBox.isConnected || starBox.parentElement !== anchor.parent || !sameAnchor) {
        if (starBox.isConnected) starBox.remove();
        if (anchor.append) {
          anchor.parent.appendChild(starBox);
        } else {
          const ref = anchor.after.nextSibling;
          if (ref) anchor.parent.insertBefore(starBox, ref);
          else anchor.parent.appendChild(starBox);
        }
      }
      starAnchorAfter = anchor.append ? anchor.parent : anchor.after;
      starBesideFav(starBox, anchor.fav ? anchor.after : null);
      if (starBadge.parentElement !== starBox) starBox.appendChild(starBadge);
      starBadge.className = 'tgtk-star tgtk-star-inline';
      starBadge.hidden = false;
      for (const d of allDocs()) {
        try {
          d.querySelectorAll('#tgtk-starbox').forEach((x) => { if (x !== starBox) x.remove(); });
        } catch (e) {}
      }
      starBadge.dataset.theme = S.theme === 'light' ? 'light' : 'dark';
      starBox.classList.toggle('tgtk-has-hist', !!anchor.legacy);
      if (anchor.legacy) {
        if (!histBtn) {
          histBtn = h('button', { id: 'tgtk-hist', class: 'tgtk-hist tgtk-hist-inline', type: 'button' }, '$');
          histBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openHistPop(histBtn, currentCharacterId());
          });
        }
        if (histBtn.parentElement !== starBox) starBox.appendChild(histBtn);
        histBtn.dataset.theme = S.theme === 'light' ? 'light' : 'dark';
        histBtn.title = `查看「${charaName(id)}」的历史交易`;
      } else if (histBtn && histBtn.isConnected) {
        histBtn.remove();
        hideHistPop();
      }
      if (id !== starCharId) {
        hideStarPop();
        hideHistPop();
        starCharId = id;
      }
      if (els && id && id !== lastFavPickId) {
        lastFavPickId = id;
        syncFavPick();
      }
      refreshStarBadge();
    };
    ensure();
    starTimer = setInterval(ensure, 900);
    if (!starListenersBound) {
      starListenersBound = true;
      WINS.forEach((w) => {
        try {
          w.addEventListener('hashchange', ensure);
          w.addEventListener('popstate', ensure);
        } catch (e) {}
      });
      let moTimer = null;
      const mo = (typeof MutationObserver !== 'undefined') ? new MutationObserver(() => {
        clearTimeout(moTimer);
        moTimer = setTimeout(() => {
          const id = currentCharacterId();
          const lost = !starBadge || !starBadge.isConnected ||
            (starAnchorAfter && !starAnchorAfter.isConnected);
          if (id !== starCharId || lost) ensure();
        }, 160);
      }) : null;
      if (mo) {
        const observeDoc = (d) => {
          try {
            if (d && d.body) mo.observe(d.body, { childList: true, subtree: true });
          } catch (e) {}
        };
        DOCS.forEach(observeDoc);
        setInterval(() => allDocs().forEach(observeDoc), 3000);
      }
    }
  }

  const GRAILX_CSS = `
.tgtk-starlog{--tg-bg:#fff;--tg-sunken2:#f4eff3;--tg-surface:#f4eef2;
  --tg-line:rgba(96,64,84,.28);--tg-line-soft:rgba(96,64,84,.12);
  --tg-fg:#332b31;--tg-fg2:#4a4046;--tg-mute:#9b8d97}
html[data-theme="dark"] .tgtk-starlog{--tg-bg:#20242e;--tg-sunken2:#1b1f27;--tg-surface:#262b36;
  --tg-line:#3b4150;--tg-line-soft:rgba(255,255,255,.07);
  --tg-fg:#e6e8ee;--tg-fg2:#cfd4df;--tg-mute:#727b8d}
#starForces .logs > .star_log{display:none !important}
.tgtk-starlog{display:flex;flex-direction:column;font:12px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tgtk-slog-list{display:flex;flex-direction:column}
.tgtk-slog-row{display:flex;gap:8px;align-items:center;padding:6px 2px;border-bottom:1px solid var(--tg-line-soft)}
.tgtk-slog-row:last-child{border-bottom:0}
.tgtk-slog-av{flex:none;width:32px;height:32px;border-radius:4px;overflow:hidden;
  background-color:var(--tg-sunken2);
  background-image:url("//lain.bgm.tv/pic/user/l/icon.jpg");
  background-size:cover;background-position:top center;background-repeat:no-repeat}
.tgtk-slog-av img{display:block;width:100%;height:100%;
  object-fit:cover;object-position:top center;border:0}
.tgtk-slog-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.tgtk-slog-l1,.tgtk-slog-l2{display:flex;align-items:center;gap:6px;min-width:0}
.tgtk-slog-l2{justify-content:space-between}
.tgtk-slog-name{color:var(--tg-fg);font-weight:600;text-decoration:none;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-slog-badge{flex:none;display:inline-flex;align-items:center;gap:5px;
  font-size:10px;font-weight:600;line-height:1.6;padding:0 6px;border-radius:5px;
  background:#757575;color:#fff;white-space:nowrap;text-shadow:0 1px 1px rgba(0,0,0,.22)}
.tgtk-slog-badge.ranked{background:linear-gradient(45deg,#673ab7,#9c27b0)}
.tgtk-slog-bsep{width:1px;height:10px;background:rgba(255,255,255,.45)}
.tgtk-slog-up{color:#ffa7cc;font-size:10px;flex:none}
.tgtk-slog-down{color:#a7e3ff;font-size:10px;flex:none}
.tgtk-slog-act{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:5px;
  color:#d4568e;white-space:nowrap}
.tgtk-slog-user{flex:0 1 auto;min-width:0;max-width:120px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.tgtk-slog-amt{flex:none;white-space:nowrap}
.tgtk-slog-act.bad{color:#4a90e2}
.tgtk-slog-star{color:#e8b93a;flex:none}
.tgtk-slog-time{flex:none;color:var(--tg-mute);font-size:10px}
.tgtk-slog-pager{display:flex;align-items:center;justify-content:center;gap:8px;
  padding:8px 0 4px;font-size:11px;color:var(--tg-mute);
  position:sticky;bottom:0;z-index:1;background:var(--tg-bg)}
.tgtk-slog-pager button{font:inherit;padding:2px 8px;border:1px solid var(--tg-line);
  border-radius:5px;background:var(--tg-surface);color:var(--tg-fg2);cursor:pointer}
.tgtk-slog-pager button:disabled{opacity:.4;cursor:default}
.tgtk-slog-empty{padding:14px 4px;text-align:center;color:var(--tg-mute);font-size:11px}
.tgtk-gxsize-inline{
  box-sizing:border-box;display:inline-block;vertical-align:middle;flex:none;
  min-width:56px;font-family:inherit;font-size:12px;line-height:1.4;
  color:var(--tg-fg2);background:var(--tg-surface);
  border:1px solid var(--tg-line);border-radius:6px;
  padding:2px 4px;margin:0 6px;cursor:pointer;outline:none;
  -webkit-appearance:auto;appearance:auto}
.tgtk-gxsize-inline:hover{border-color:var(--tg-accent);color:var(--tg-accent-fg)}
.tgtk-gxsize-inline option{background:var(--tg-surface);color:var(--tg-fg)}
.tgtk-gxsize-inline.tgtk-gxsize-new{align-self:center;height:26px;margin:0 8px 0 auto;padding:0 6px}
.tgtk-gxsize-inline.tgtk-gxsize-old{height:20px;font-size:11px;line-height:1.2;
  padding:0 2px;margin:0 0 0 6px;border-radius:4px}
.tgtk-gx-auction{display:inline-flex;align-items:center;gap:8px;margin:0 7px 0 3px;
  font-size:13px;line-height:1.6;font-variant-numeric:tabular-nums;vertical-align:middle;white-space:nowrap;
  position:relative;top:2px}
.tgtk-gx-auction[hidden]{display:none}
.tgtk-gx-auction .tgtk-gx-users{color:#4a90e2}
.tgtk-gx-auction .tgtk-gx-mine{color:#e0699b}
.tgtk-gx-nauc{top:0;margin:0 2px 0 6px;font-size:12px;font-family:inherit;font-weight:600;
  line-height:1.5;min-height:22px;letter-spacing:0}
.tgtk-gx-nauc .tgtk-gx-wait{color:var(--tg-mute);font-size:11px;font-weight:400}
.tgtk-gx-temples{color:#a99ba6}
.tgtk-gx-temples-n{color:inherit;font:inherit;white-space:nowrap}
.tgtk-gxkv{display:flex;flex-direction:column;gap:5px;padding:2px 2px 6px;font-size:12px}
.tgtk-gxkvrow{display:flex;align-items:baseline;justify-content:space-between;gap:18px;color:var(--tg-dim)}
.tgtk-gxkvrow b{color:var(--tg-fg);font-weight:600;font-variant-numeric:tabular-nums}
.tgtk-gxkvnote{padding-top:2px;color:var(--tg-mute);font-size:11px}
#lastTemples .item.tgtk-my-temple .name a{color:#d4568e;font-weight:600}
#grailBox #lastTemples{text-align:center}
#lastTemples .item{text-align:left}
#grailBox.tgtk-gx-sz-s #lastTemples{display:flex !important;flex-wrap:wrap !important;gap:6px !important;
  zoom:1;margin-left:0;margin-right:0;justify-content:flex-start}
#grailBox.tgtk-gx-sz-s #lastTemples .item{flex:0 0 calc((100% - 36px) / 7) !important;
  width:calc((100% - 36px) / 7) !important;margin:0 !important;float:none !important;box-sizing:border-box}
#grailBox.tgtk-gx-sz-s #lastTemples .item img{max-width:100% !important;height:auto !important}
#grailBox.tgtk-gx-sz-s #lastTemples .item > *{max-width:100% !important;box-sizing:border-box}
#grailBox.tgtk-gx-sz-l #lastTemples{zoom:1.15}
[data-tgtk-templesz="s"]{display:grid !important;grid-template-columns:repeat(6,minmax(0,1fr)) !important;
  justify-items:center;gap:6px !important;margin-left:0;margin-right:0;zoom:1}
[data-tgtk-templesz="l"]{zoom:1.15;justify-content:center}
#grail .tgtk-foldbtn{float:right;margin-right:4px;line-height:1.7}
#grail .tgtk-foldbtn a{color:#d4568e;cursor:pointer;text-decoration:none}
#grail .tgtk-foldbtn a:hover{text-decoration:underline}
.tgtk-grail-hidden{display:none !important}
#topWeek .assets .item,.tgtk-gx-card{position:relative;overflow:hidden}
.tgtk-gx-ov{position:absolute;left:0;right:0;top:0;bottom:0;z-index:2;display:flex;flex-direction:column;
  justify-content:flex-end;padding:7px 8px 6px;box-sizing:border-box;pointer-events:none;opacity:0;
  background:linear-gradient(180deg,rgba(18,14,20,0) 0%,rgba(18,14,20,.55) 38%,rgba(18,14,20,.9) 100%);
  color:#fff;font-size:12px;line-height:1.7;transition:opacity .13s}
#topWeek .assets .item:hover .tgtk-gx-ov,.tgtk-gx-card:hover .tgtk-gx-ov{opacity:1}
.tgtk-gx-ov dl{display:grid;grid-template-columns:auto 1fr;gap:0 8px;margin:0}
.tgtk-gx-ov dt{margin:0;color:#fff;font-weight:400;white-space:nowrap}
.tgtk-gx-ov dd{margin:0;text-align:right;color:#fff;font-variant-numeric:tabular-nums}
.tgtk-gx-ov .tgtk-gx-ovscore{display:flex;justify-content:space-between;align-items:baseline;margin-top:4px;
  padding-top:4px;border-top:1px solid rgba(255,255,255,.22);color:#ffd76a;font-size:13px;font-weight:600}
.tgtk-auctionpop .tgtk-histrow{grid-template-columns:74px 1fr 76px 58px 46px}
.tgtk-gxquick{display:flex;align-items:center;gap:12px;padding:2px 2px 5px;font-size:12px}
.tgtk-gxquick button{padding:0;border:0;background:transparent;color:#3f7cc9;font:inherit;cursor:pointer}
.tgtk-gxquick button:hover{text-decoration:underline}
.tgtk-gxquick .tgtk-gxnums{margin-left:auto;display:inline-flex;gap:8px;font-variant-numeric:tabular-nums}
.tgtk-gxquick .tgtk-gx-users{color:#4a90e2}
.tgtk-gxquick .tgtk-gx-mine{color:#e0699b}
.tgtk-gxfield{display:flex;align-items:center;gap:8px;padding:3px 2px;font-size:12px;color:var(--tg-dim)}
.tgtk-gxfield input{width:104px}
.tgtk-gxfield .tgtk-gxsum{margin-left:auto;color:var(--tg-mute);font-size:11px;font-variant-numeric:tabular-nums}
.tgtk-gxmsg{padding:4px 2px 0;font-size:11px;line-height:1.5;color:var(--tg-mute);word-break:break-all}
.tgtk-gxmsg.tgtk-gxok{color:#3f9d63}
.tgtk-gxmsg.tgtk-gxbad{color:#cf5a5a}
#tgtk-gxpop .tgtk-gxcancel{background:#e0699b;border-color:#e0699b;color:#fff}
#tgtk-gxpop .tgtk-gxcancel:hover{background:#d4568e;border-color:#d4568e;color:#fff}
.tgtk-ttoolbar{display:inline-flex;align-items:center;gap:5px;margin-left:6px;
  vertical-align:middle;flex-wrap:wrap;font:12px/1.4 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tgtk-tbtn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;
  height:22px;min-width:34px;padding:0 8px;border:1px solid rgba(212,86,142,.55);border-radius:5px;
  background:rgba(255,255,255,.9);color:#d4568e;font:600 11px/1 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
  cursor:pointer;white-space:nowrap;vertical-align:middle}
.tgtk-tbtn:hover{background:#d4568e;border-color:#d4568e;color:#fff}
.tgtk-tbtn:disabled{opacity:.45;cursor:default}
.tgtk-tbtn.tgtk-ticon{min-width:22px;width:22px;height:22px;padding:2px}
.tgtk-tbtn svg{width:15px;height:15px;display:block}
.tgtk-tbtn{height:22px !important;min-width:34px !important;padding:0 8px !important;
  border-width:1px !important;border-style:solid !important;font-size:11px !important;line-height:1 !important}
.tgtk-tbtn.tgtk-ticon{width:22px !important;min-width:22px !important;height:22px !important;padding:2px !important}
.tgtk-tbtn.tgtk-ticon svg{width:15px !important;height:15px !important}
.tgtk-ttoolbar.tgtk-oldmini .tgtk-tbtn{margin:0 2px}
.tgtk-ttoolbar.tgtk-oldmini{display:inline-flex;align-items:center;gap:2px;margin:0 2px;vertical-align:middle}
.tgtk-brk{display:block;flex:0 0 100%;width:100%;height:0;margin:0;padding:0;border:0}
html[data-theme="dark"] .tgtk-tbtn{background:rgba(38,43,54,.92);color:#ffb3cf;border-color:rgba(255,179,207,.5)}
html[data-theme="dark"] .tgtk-tbtn:hover{background:#d4568e;color:#fff}
.tgtk-ttoolbar.tgtk-tfloat{position:absolute;right:10px;bottom:12px;z-index:5;margin:0;
  flex-direction:column;align-items:flex-end;gap:5px;padding:6px;border-radius:8px;
  background:rgba(255,255,255,.86);box-shadow:0 4px 16px rgba(0,0,0,.18)}
html[data-theme="dark"] .tgtk-ttoolbar.tgtk-tfloat{background:rgba(32,36,46,.9)}
.tgtk-swapbtn{position:absolute;right:0;bottom:0;z-index:6;margin:0}
.tgtk-linkwrap{position:relative}
html.tgtk-seamless .chara_link{overflow:hidden;box-sizing:border-box}
html.tgtk-seamless .chara_link .left,
html.tgtk-seamless .chara_link .right{transform:none !important}
html.tgtk-seamless .chara_link .left{width:56.25% !important}
html.tgtk-seamless .chara_link .right{left:43.75% !important;width:56.25% !important}
html.tgtk-seamless .chara_link .left .container,
html.tgtk-seamless .chara_link .right .container{
  transform:none !important;width:100% !important;margin:0 !important;
  box-sizing:border-box !important;
  background-size:100% 100% !important;background-position:top center !important}
html.tgtk-seamless #tg-temple-link-left,
html.tgtk-seamless #tg-temple-link-right{transform:none !important}
html.tgtk-seamless #tg-temple-link-left{width:56.25% !important}
html.tgtk-seamless #tg-temple-link-right{left:43.75% !important;width:56.25% !important}
html.tgtk-seamless #tg-temple-link-left>div,
html.tgtk-seamless #tg-temple-link-right>div{
  transform:none !important;width:100% !important;
  box-sizing:border-box !important;
  background-size:100% 100% !important;background-position:top center !important}
html.tgtk-seamless .chara_link .right .container,
html.tgtk-seamless #tg-temple-link-right>div{
  -webkit-mask-image:linear-gradient(to right,rgba(0,0,0,0) 0,rgba(0,0,0,1) 2px);
  mask-image:linear-gradient(to right,rgba(0,0,0,0) 0,rgba(0,0,0,1) 2px)}
.tgtk-crop-tabs{display:flex;align-items:center;gap:6px;margin:8px 0 2px}
.tgtk-crop-tab{box-sizing:border-box;height:22px;padding:0 10px;border:1px solid rgba(212,86,142,.45);
  border-radius:5px;background:transparent;color:#b07a92;cursor:pointer;
  font:600 11px/1 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tgtk-crop-tab.on{background:#d4568e;border-color:#d4568e;color:#fff}
.tgtk-crop-tab:disabled{opacity:.4;cursor:default}
html[data-theme="dark"] .tgtk-crop-tab{color:#ffb3cf;border-color:rgba(255,179,207,.45)}
.tgtk-crop-chk{display:flex;align-items:center;gap:6px;margin:5px 0 2px;font-size:12px;line-height:1.4}
.tgtk-crop-chk input{margin:0;flex:none}
.tgtk-crop-chk img{width:16px;height:21px;border-radius:3px;object-fit:cover;flex:none}
#TB_window.temple .progress{overflow:hidden}
#TB_window.temple .progress .value{max-width:100% !important}
.tgtk-crop{position:fixed;left:0;right:0;top:0;bottom:0;z-index:2147483647;
  display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);
  font:13px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#332b31}
.tgtk-crop,.tgtk-crop *{pointer-events:auto !important}
dialog.tgtk-crop{position:fixed;left:0;right:0;top:0;bottom:0;margin:0;padding:0;border:0;
  width:auto;height:auto;max-width:none;max-height:none;box-sizing:border-box;
  display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.6);color:#332b31;overflow:visible}
dialog.tgtk-crop::backdrop{background:transparent}
.tgtk-crop-box{width:420px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);overflow:auto;
  padding:12px 14px 14px;border-radius:12px;background:#fff;box-shadow:0 24px 64px rgba(0,0,0,.5)}
html[data-theme="dark"] .tgtk-crop-box{background:#20242e;color:#e6e8ee}
.tgtk-crop-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;
  margin-bottom:8px;font-size:14px;font-weight:600}
.tgtk-crop-x{border:0;background:none;color:inherit;font-size:18px;line-height:1;cursor:pointer;opacity:.6}
.tgtk-crop-stage{position:relative;display:flex;justify-content:center;background:#20242e;border-radius:8px;overflow:hidden}
.tgtk-crop-stage.tgtk-crop-dragover{outline:2px dashed #d4568e;outline-offset:-4px}
.tgtk-crop-drop{position:absolute;inset:0;display:none;align-items:center;justify-content:center;
  color:#ffb3cf;font:600 14px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
  background:rgba(20,22,30,.72);border-radius:8px;pointer-events:none;text-align:center}
.tgtk-crop-stage.tgtk-crop-dragover .tgtk-crop-drop{display:flex}
.tgtk-crop-canvas{display:block;width:360px;max-width:100%;height:auto;touch-action:none;cursor:crosshair}
.tgtk-crop-canvas.tgtk-wide{width:420px}
.tgtk-crop-tip{margin:8px 0;color:#9b8d97;font-size:11px;min-height:17px}
html[data-theme="dark"] .tgtk-crop-tip{color:#727b8d}
.tgtk-crop-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.tgtk-crop-row label{flex:none;color:inherit;opacity:.75;font-size:12px}
.tgtk-crop-row input[type="text"]{flex:1;min-width:150px;box-sizing:border-box;padding:5px 8px;
  border:1px solid #d9cbd4;border-radius:5px;background:#f8f3f6;color:#332b31;font:inherit;font-size:12px}
.tgtk-crop-row input[type="range"]{flex:1;min-width:120px}
.tgtk-crop-row input[type="file"]{max-width:170px;font-size:11px}
.tgtk-crop-sel{flex:none;box-sizing:border-box;padding:4px 6px;border:1px solid #d9cbd4;border-radius:5px;
  background:#f8f3f6;color:#332b31;font:12px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
html[data-theme="dark"] .tgtk-crop-sel{background:#2a2f3b;color:#e6e8ee;border-color:#4a5162}
.tgtk-crop-ft{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:4px}
.tgtk-ttoast{position:fixed;left:50%;bottom:40px;transform:translateX(-50%) translateY(8px);
  z-index:2147483647;padding:8px 16px;border-radius:999px;background:#d4568e;color:#fff;
  font:600 13px/1.4 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
  box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;pointer-events:none;transition:opacity .18s,transform .18s}
.tgtk-ttoast.on{opacity:1;transform:translateX(-50%) translateY(0)}
#grail .link_list .grail_list{justify-content:center !important}
#tg-user-tinygrail div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col),
#tg-modal div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col),
[id^="tg-trade-box"] div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col),
[id^="tg-character"] div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col),
#tinygrail div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col){
  grid-template-columns:repeat(var(--tgtk-tcols,4),minmax(0,1fr)) !important}
[data-tgtk-tcols]{grid-template-columns:repeat(var(--tgtk-tcols,4),minmax(0,1fr)) !important}
html.tgtk-gx-size-s div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col){
  grid-template-columns:repeat(6,minmax(0,1fr)) !important}
html.tgtk-gx-size-s [id^="tg-trade-box-temple"]:has(> [data-user-name]){
  display:grid !important;grid-template-columns:repeat(6,minmax(0,1fr)) !important;
  justify-items:center;gap:6px !important;margin-left:0;margin-right:0;zoom:1}
#grailBox .tgtk-iconext{display:inline-flex;align-items:center;justify-content:center;
  box-sizing:border-box;width:auto !important;min-width:0 !important;height:20px !important;
  margin:0 0 0 8px !important;padding:0 9px !important;
  border:1px solid rgba(212,86,142,.55) !important;border-radius:999px !important;
  background:#fff !important;color:#d4568e !important;letter-spacing:0;cursor:pointer;
  vertical-align:middle;white-space:nowrap;
  font:600 11px/1 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif !important}
#grailBox .tgtk-iconext:hover{background:#d4568e !important;border-color:#d4568e !important;color:#fff !important}
html[data-theme="dark"] #grailBox .tgtk-iconext{background:#2a2f3b !important;color:#ffb3cf !important;
  border-color:rgba(255,179,207,.5) !important}
[data-tgtk-shares]{cursor:help}
dialog.tgtk-div{position:fixed;inset:0;margin:auto;padding:18px 22px 16px;border:0;border-radius:16px;
  width:min(400px,92vw);max-width:92vw;box-sizing:border-box;background:#fff;color:#332b31;
  box-shadow:0 18px 50px rgba(0,0,0,.28);z-index:2147483647;overflow:visible;outline:none;
  font:13px/1.6 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
dialog.tgtk-div:focus,dialog.tgtk-div:focus-visible{outline:none}
dialog.tgtk-div::backdrop{background:rgba(20,16,22,.45)}
.tgtk-div-hd{display:flex;align-items:center;justify-content:space-between;gap:10px}
.tgtk-div-hd b{font-size:15px;font-weight:700;color:#332b31}
.tgtk-div-x{flex:none;border:0;background:transparent;color:#9b8d97;font-size:20px;line-height:1;
  cursor:pointer;padding:0 2px;font-family:inherit}
.tgtk-div-x:hover{color:#332b31}
.tgtk-div-x:focus{outline:none}
.tgtk-div-x:focus-visible{outline:2px solid #e0699b;outline-offset:2px;border-radius:5px}
.tgtk-div-top{display:flex;align-items:center;justify-content:center;gap:28px;padding:14px 0 4px}
.tgtk-div-donut{position:relative;width:126px;height:126px;border-radius:50%;flex:none;
  background:conic-gradient(#ff9dc4 0deg var(--tgtk-deg,0deg),#45b8e8 var(--tgtk-deg,0deg) 360deg)}
.tgtk-div-donut::after{content:"";position:absolute;left:28px;top:28px;right:28px;bottom:28px;
  border-radius:50%;background:#fff}
.tgtk-div-legend{display:flex;flex-direction:column;gap:9px;font-size:12px;color:#4a4046}
.tgtk-div-legend span{display:flex;align-items:center;gap:7px;white-space:nowrap}
.tgtk-div-legend i{width:12px;height:12px;border-radius:3px;flex:none;display:block}
.tgtk-div-legend i.pk{background:#ff9dc4}
.tgtk-div-legend i.bl{background:#45b8e8}
.tgtk-div-rows{margin:12px 0 0;display:flex;flex-direction:column;gap:4px}
.tgtk-div-row{display:flex;align-items:baseline;justify-content:space-between;gap:16px;color:#7d7079}
.tgtk-div-row b{color:#332b31;font-weight:600;font-variant-numeric:tabular-nums}
.tgtk-div-row.tgtk-div-tax b{color:#3aa7d6}
.tgtk-div-net{display:flex;align-items:baseline;justify-content:space-between;gap:16px;
  margin-top:10px;padding-top:12px;border-top:1px solid #f0e6ec;font-weight:700;color:#332b31}
.tgtk-div-net b{color:#e8488b;font-size:20px;font-variant-numeric:tabular-nums}
.tgtk-div-msg{padding:24px 4px;text-align:center;color:#9b8d97;font-size:12px}
html[data-theme="dark"] dialog.tgtk-div{background:#262b36;color:#e6e8ee}
html[data-theme="dark"] .tgtk-div-hd b,html[data-theme="dark"] .tgtk-div-net{color:#e6e8ee}
html[data-theme="dark"] .tgtk-div-row{color:#9aa2b1}
html[data-theme="dark"] .tgtk-div-row b{color:#e6e8ee}
html[data-theme="dark"] .tgtk-div-row.tgtk-div-tax b{color:#6fc8ea}
html[data-theme="dark"] .tgtk-div-donut::after{background:#262b36}
html[data-theme="dark"] .tgtk-div-net{border-top-color:#39404d}
html[data-theme="dark"] .tgtk-div-legend{color:#cfd4df}
html[data-theme="dark"] .tgtk-div-msg{color:#727b8d}
`;

  const GX = {
    cssDocs: new Set(),
    cache: Object.create(null), // cid -> { at, base, bid, temples }
    bonus: null,
    bonusAt: 0,
    bonusState: 0,
    topkey: '',
    top: null,
    topNodes: null,
    topAt: 0,
    templeSig: '',
    busy: '',
    bound: false,
    szAt: 0,
    foldBtn: null,
    applyGrail: null,
  };

  function seamlessFor(doc) {
    try {
      const el = doc && doc.documentElement;
      if (!el) return;
      if (S.seamlessLink !== false) el.classList.add('tgtk-seamless');
      else el.classList.remove('tgtk-seamless');
      templeColsFor(doc); // 每行几个圣殿：跟着同一轮把变量补上
    } catch (e) {}
  }
  function applySeamless() {
    for (const d of allDocs()) seamlessFor(d);
  }

  function templeColsFor(doc) {
    try {
      const el = doc && doc.documentElement;
      if (!el) return;
      const n = TUI.cols;
      if (el.style.getPropertyValue('--tgtk-tcols') !== String(n)) {
        el.style.setProperty('--tgtk-tcols', String(n));
      }
      const hosts = doc.querySelectorAll(
        '#tg-user-tinygrail, #tg-modal, [id^="tg-trade-box"], [id^="tg-character"], #tinygrail'
      );
      for (let i = 0; i < hosts.length; i++) {
        const grids = hosts[i].querySelectorAll('div.grid.w-full.gap-4');
        for (let j = 0; j < grids.length; j++) {
          const g = grids[j];
          const c = g.firstElementChild;
          if (!c || !c.classList || !c.classList.contains('min-w-0') || !c.classList.contains('flex-col')) continue;
          if (!g.hasAttribute('data-tgtk-tcols')) g.setAttribute('data-tgtk-tcols', '1');
        }
      }
    } catch (e) {}
  }

  function applyTempleCols() {
    for (const d of allDocs()) {
      try { gxStyle(d); } catch (e) {}
      templeColsFor(d);
    }
  }

  function gxStyle(doc) {
    if (!doc) return;
    seamlessFor(doc);
    try {
      if (doc.getElementById('tgtk-gx-style')) return;
      const st = doc.createElement('style');
      st.id = 'tgtk-gx-style';
      st.textContent = GRAILX_CSS;
      (doc.head || doc.documentElement).appendChild(st);
    } catch (e) {}
  }

  async function gxApiRaw(path, opt = {}) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    try {
      const res = await fetch(API + path, {
        ...opt,
        credentials: 'include',
        signal: ctl.signal,
        headers: {
          Accept: 'application/json',
          ...(opt.body ? { 'Content-Type': 'application/json' } : {}),
          ...(opt.headers || {}),
        },
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) return { state: -1, value: null };
      const data = await res.json();
      return { state: num(data && data.State), value: data && data.Value };
    } catch (e) {
      return { state: -1, value: null };
    } finally {
      clearTimeout(timer);
    }
  }

  function gxShowBox(b) {
    if (!b || !b.hasAttribute('data-tgtk-dup')) return;
    const prev = b.getAttribute('data-tgtk-prev-display') || '';
    if (prev) b.style.display = prev;
    else b.style.removeProperty('display');
    b.removeAttribute('data-tgtk-dup');
    b.removeAttribute('data-tgtk-prev-display');
  }

  const gxDup = {
    key: '', sig: '', stableAt: 0, keep: null,
    changes: 0, changesAt: 0, giveUp: false,
  };

  function gxBoxSig(b) {
    const cid = (String(b.className || '').match(/chara(\d+)/) || [])[1] || '';
    const t = String(b.textContent || '');
    const par = b.parentElement;
    return [
      cid,
      /开启交易/.test(t) ? 'pre' : 'trade',
      /买入委托|卖出委托/.test(t) ? 'table' : 'plain',
      String((par && (par.id || par.className)) || '').slice(0, 40),
    ].join('|');
  }

  function gxDupRestore(boxes) {
    for (const b of boxes) gxShowBox(b);
  }

  function gxDedupeBoxes() {
    let doc = null;
    let boxes = [];
    for (const d of allDocs()) {
      let list;
      try {
        list = Array.from(d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox'));
      } catch (e) {
        continue;
      }
      list = list.filter((b) => {
        if (!/(?:^|\s)chara\d+(?:\s|$)/.test(String(b.className || ''))) return false;
        if (/^grailBox\d+$/.test(String(b.id || '')) && b.id !== 'grailBox') return false;
        return true;
      });
      if (list.length) {
        doc = d;
        boxes = list;
        break;
      }
    }
    if (!doc) return;

    if (!S.gxDedupe) {
      gxDupRestore(boxes);
      Object.assign(gxDup, { sig: '', stableAt: 0, keep: null, changes: 0, giveUp: false });
      return;
    }

    const now = Date.now();
    let href = '';
    try {
      href = String((HWIN && HWIN.location && HWIN.location.href) || '');
    } catch (e) {}
    const key = href + '#' + ((String(boxes[0].className || '').match(/chara(\d+)/) || [])[1] || '');
    if (key !== gxDup.key) {
      gxDup.key = key;
      Object.assign(gxDup, {
        sig: '', stableAt: 0, keep: null, changes: 0, changesAt: now, giveUp: false,
      });
    }

    const ready = boxes.filter((b) => !/开启交易/.test(String(b.textContent || '')));
    const sig = boxes.length + '#' + boxes.map(gxBoxSig).join('~');

    if (sig !== gxDup.sig) {
      gxDup.sig = sig;
      gxDup.stableAt = now;
      gxDup.keep = null;
      gxDupRestore(boxes);
      if (now - gxDup.changesAt > 10000) {
        gxDup.changes = 0;
        gxDup.changesAt = now;
      }
      gxDup.changes++;
      if (gxDup.changes > 6) gxDup.giveUp = true;
      return;
    }
    if (gxDup.giveUp || now - gxDup.stableAt < 1500) {
      gxDupRestore(boxes);
      return;
    }

    const groups = new Map();
    for (const b of ready) {
      const k = gxBoxSig(b);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(b);
    }
    const hide = new Set();
    for (const arr of groups.values()) {
      if (arr.length < 2) continue;
      let keep = gxDup.keep && gxDup.keep.isConnected && arr.indexOf(gxDup.keep) >= 0
        ? gxDup.keep
        : null;
      if (!keep) {
        keep = arr[0];
        let best = Infinity;
        for (const b of arr) {
          let top = Infinity;
          try {
            top = b.getBoundingClientRect().top + ((doc.defaultView && doc.defaultView.scrollY) || 0);
          } catch (e) {}
          if (top < best) {
            best = top;
            keep = b;
          }
        }
      }
      gxDup.keep = keep;
      for (const b of arr) if (b !== keep) hide.add(b);
    }
    for (const b of boxes) {
      if (hide.has(b)) {
        if (!b.hasAttribute('data-tgtk-dup')) {
          b.setAttribute('data-tgtk-prev-display', b.style.display || '');
          b.setAttribute('data-tgtk-dup', '1');
        }
        if (b.style.display !== 'none') b.style.setProperty('display', 'none', 'important');
      } else {
        gxShowBox(b);
      }
    }
  }

  function gxBox() {
    for (const d of allDocs()) {
      try {
        for (const gb of d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox')) {
          if (gb.hasAttribute && gb.hasAttribute('data-tgtk-dup')) continue;
          const m = String(gb.className || '').match(/(?:^|\s)chara(\d+)(?:\s|$)/);
          if (m) return { doc: d, box: gb, cid: m[1] };
        }
      } catch (e) {}
    }
    return null;
  }

  function gxHidePop() {
    const p = HDOC.getElementById('tgtk-gxpop');
    if (p) p.remove();
  }

  function gxPop(titleText, anchor, opts) {
    const opt = opts || {};
    gxHidePop();
    hideStarPop();
    hideHistPop();
    hideFavPop();
    const pop = h('div', {
      id: 'tgtk-gxpop',
      class:
        'tgtk-histpop tgtk-auctionpop' +
        (opt.center ? ' tgtk-gxmodal' : '') +
        (opt.centerCompact ? ' tgtk-gxcenter' : '') +
        (opt.wide ? ' tgtk-gxbid' : ''),
      'data-theme': S.theme === 'light' ? 'light' : 'dark',
    });
    const close = h('button', { class: 'tgtk-favclose', type: 'button', title: '关闭' }, '×');
    close.addEventListener('click', gxHidePop);
    const right = h('span', { class: 'tgtk-gxheadright' });
    (opt.extra || []).forEach((n) => right.appendChild(n));
    right.appendChild(close);
    const head = h(
      'div',
      { class: 'tgtk-favhead' },
      h('span', { class: 'tgtk-gxheadtitle' }, titleText),
      right
    );
    pop.appendChild(head);
    HDOC.body.appendChild(pop);
    if (!opt.center && !opt.centerCompact) {
      try {
        positionHistPop(pop, anchor);
      } catch (e) {}
    }
    return pop;
  }

  async function gxData(cid, force) {
    const c = GX.cache[cid];
    if (!force && c && Date.now() - c.at < 60000) return c;
    if (GX.busy === cid) return c || null;
    GX.busy = cid;
    const out = { at: Date.now(), base: null, bid: null, temples: null };
    try {
      const v = await api(`chara/user/${cid}/tinygrail/false`);
      if (v) out.base = { price: num(v.Price), amount: num(v.Amount) };
    } catch (e) {}
    try {
      const v = await api('chara/auction/list', { method: 'POST', body: JSON.stringify([Number(cid)]) });
      const arr = Array.isArray(v) ? v : (v && v.Items) || [];
      const row = arr[0] || null;
      out.bid = row
        ? { users: num(row.State), filled: num(row.Type), price: num(row.Price), amount: num(row.Amount) }
        : { users: 0, filled: 0, price: 0, amount: 0 };
    } catch (e) {}
    try {
      const v = await api(`chara/temple/${cid}`);
      out.temples = Array.isArray(v) ? v : (v && v.Items) || [];
    } catch (e) {}
    GX.cache[cid] = out;
    if (GX.busy === cid) GX.busy = '';
    return out;
  }

  function gxTempleLv(t) {
    const cap = num(t && t.Sacrifices);
    if (cap >= 12500) return 3;
    if (cap >= 2500) return 2;
    if (cap > 0) return 1;
    return Math.max(1, Math.min(3, num(t && t.Level) || 1));
  }

  function gxTempleCounts(temples) {
    const cnt = { 1: 0, 2: 0, 3: 0 };
    (temples || []).forEach((t) => {
      cnt[gxTempleLv(t)]++;
    });
    return cnt;
  }

  async function gxTempleList(cid) {
    const out = [];
    const seen = Object.create(null);
    const push = (t) => {
      if (!t) return;
      const k = String(t.Id || (String(t.CharacterId) + '|' + String(t.UserId)));
      if (seen[k]) return;
      seen[k] = 1;
      out.push(t);
    };
    try {
      const v = await api(`chara/temple/${cid}`);
      (Array.isArray(v) ? v : (v && v.Items) || []).forEach(push);
    } catch (e) {}
    try {
      const v = await api(`chara/links/${cid}`);
      (Array.isArray(v) ? v : (v && v.Items) || []).forEach(push);
    } catch (e) {}
    return out;
  }

  function gxCleanName(raw) {
    let t = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    const m = t.match(/「([^」]{1,60})」/);
    if (m) return m[1].trim();
    t = t.replace(/^#?\d+\s*[-–—]?\s*/, '');
    t = t.split('₵')[0].split('[')[0];
    t = t.split(/\s\/\s/)[0];
    return t.trim();
  }

  function gxName(cid) {
    const cached = gxCleanName(nameCache[cid] || '');
    if (cached && !/^#?\d+$/.test(cached)) return cached;
    try {
      const rec = gxBox();
      if (rec) {
        const a = rec.box.querySelector('.title .name a') || rec.box.querySelector('.title a[href^="/character/"]');
        let clean = gxCleanName(a ? a.textContent : '');
        if (!clean || /^#?\d+$/.test(clean)) {
          const t = rec.box.querySelector('.title');
          clean = gxCleanName(t ? t.textContent : '');
        }
        if (clean && !/^#?\d+$/.test(clean)) return clean;
      }
      const nb = gxNewBox();
      if (nb) {
        const a = nb.box.querySelector('a[href*="/character/"]');
        const clean = gxCleanName(a ? a.textContent : '');
        if (clean && !/^#?\d+$/.test(clean)) return clean;
      }
    } catch (e) {}
    return '';
  }

  function gxCharLabel(cid) {
    const n = gxName(cid);
    return n ? `${n} -「#${cid}」` : `「#${cid}」`;
  }

  function gxAuctionAnchor(box) {
    return box.querySelector('#auctionHistoryButton') ||
      box.querySelector('#auctionButton') ||
      box.querySelector('#buildButton');
  }

  function gxDrawAuction(rec, data) {
    const { doc, box } = rec;
    gxStyle(doc);
    const anchor = gxAuctionAnchor(box);
    if (!anchor || !anchor.parentElement) return;
    let bar = box.querySelector('#tgtk-gx-auction');
    if (!S.gxAuction) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) bar = h('span', { id: 'tgtk-gx-auction', class: 'tgtk-gx-auction' });
    if (bar.parentElement !== anchor.parentElement || bar.nextElementSibling !== anchor) {
      try {
        anchor.parentElement.insertBefore(bar, anchor);
      } catch (e) {
        return;
      }
    }
    const base = (data && data.base) || null;
    const bid = (data && data.bid) || null;
    const sig = [
      base ? base.price + ':' + base.amount : '',
      bid ? [bid.users, bid.filled, bid.price, bid.amount].join(',') : '-',
    ].join('|');
    if (bar.dataset.sig === sig) return;
    bar.dataset.sig = sig;

    bar.textContent = '';
    if (bid) {
      bar.appendChild(
        h('span', { class: 'tgtk-gx-users', title: '竞拍人数 / 已拍股数' }, `${fmt(bid.users)} / ${fmt(bid.filled)}`)
      );
      if (bid.price > 0) {
        bar.appendChild(
          h(
            'span',
            { class: 'tgtk-gx-mine', title: '我的出价 / 我的股数' },
            `₵${fmt(bid.price, 2)} / ${fmt(bid.amount)}`
          )
        );
      }
    }
    bar.hidden = !bar.children.length;
  }

  function gxTempleSlot(bold) {
    const kids = bold.childNodes;
    let seen = false;
    for (let i = 0; i < kids.length; i++) {
      const t = String(kids[i].textContent || '');
      if (!seen) {
        if (/固定资产/.test(t)) {
          seen = true;
          if (/\d/.test(t)) return { parent: bold, ref: kids[i].nextSibling };
        }
        continue;
      }
      if (/\d/.test(t)) return { parent: bold, ref: kids[i].nextSibling };
    }
    return null;
  }

  function gxDrawTempleCount(rec, temples) {
    const box = rec.box;
    const bold = box.querySelector('.assets_box .bold') || box.querySelector('.assets_box .title .text');
    if (!bold) return;
    let span = box.querySelector('.tgtk-gx-temples');
    if (!S.gxTempleCount || !temples || !temples.length) {
      if (span) span.remove();
      return;
    }
    const cnt = gxTempleCounts(temples);
    const text = ` (${cnt[3]} + ${cnt[2]} + ${cnt[1]})`;
    if (!span) {
      span = h('span', { class: 'sub tgtk-gx-temples', title: '3级 / 2级 / 1级 圣殿数量' });
      const slot = gxTempleSlot(bold);
      try {
        if (slot) slot.parent.insertBefore(span, slot.ref);
        else bold.appendChild(span);
      } catch (e) {
        return;
      }
    }
    if (span.textContent !== text) span.textContent = text;
  }

  function gxHijack(rec) {
    const { box } = rec;
    const past = box.querySelector('#auctionHistoryButton');
    if (past) {
      if (past.dataset.tgtkPast !== '1') {
        let btn = past;
        try {
          btn = past.cloneNode(true);
          btn.dataset.tgtkPast = '1';
          past.parentElement.replaceChild(btn, past);
        } catch (e) {
          btn = past;
          btn.dataset.tgtkPast = '1';
        }
        btn.setAttribute('title', '查看往期竞拍（成功按出价从高到低）');
        btn.addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            const now = gxBox();
            if (now) gxOpenPast(now, btn);
          },
          true
        );
        if (btn.tagName === 'INPUT') btn.value = '[往期竞拍]';
        else btn.textContent = '[往期竞拍]';
      }
    }
    const bidBtn = box.querySelector('#auctionButton');
    if (bidBtn && bidBtn.dataset.tgtkBid !== '1') {
      let btn = bidBtn;
      try {
        btn = bidBtn.cloneNode(true);
        btn.dataset.tgtkBid = '1';
        bidBtn.parentElement.replaceChild(btn, bidBtn);
      } catch (e) {
        btn = bidBtn;
        btn.dataset.tgtkBid = '1';
      }
      btn.setAttribute('title', '参与竞拍（已拍过时自动带入我的出价与数量）');
      btn.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          const now = gxBox();
          if (now) gxOpenBid(now, btn);
        },
        true
      );
    }
  }

  async function gxMarkTemples(rec) {
    if (!S.gxMyTemple && !S.gxPinMyTemple) return;
    const list = rec.box.querySelector('#lastTemples');
    if (!list) return;
    const sig =
      rec.cid + ':' + list.children.length + ':' +
      (list.firstElementChild ? String(list.firstElementChild.textContent || '').slice(0, 20) : '');
    if (GX.templeSig === sig && list.querySelector('.tgtk-my-temple')) return;
    GX.templeSig = sig;
    const me = await selfKey();
    if (!me) return;
    let mine = null;
    const items = list.querySelectorAll('.item');
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const a = it.querySelector('.name a') || it.querySelector('a[href^="/user/"]');
      const u = a ? String(a.getAttribute('href') || '').split('/').filter(Boolean).pop() : '';
      const hit = !!u && u === me;
      it.classList.toggle('tgtk-my-temple', hit && !!S.gxMyTemple);
      if (hit) mine = it;
    }
    if (mine && S.gxPinMyTemple && list.firstElementChild !== mine) {
      try { list.insertBefore(mine, list.firstElementChild); } catch (e) {}
    }
  }

  function gxTempleGrids() {
    const out = [];
    for (const d of allDocs()) {
      try {
        const list = d.getElementById('tg-trade-box-temple-list');
        if (list && list.isConnected && list.children.length) out.push(list);
      } catch (e) {}
      let cands;
      try {
        cands = d.querySelectorAll('[id*="temple" i],[class*="temple" i]');
      } catch (e) {
        continue;
      }
      for (const el of cands) {
        if (!el.isConnected || out.includes(el)) continue;
        if (el.closest('#grailBox') || el.closest('#tgtk-panel') || el.closest('#topWeek')) continue;
        if (el.closest('#tg-trade-box-temple') || /tgtk-/.test(String(el.className || ''))) continue;
        const kids = el.children;
        if (kids.length < 4) continue;
        let withPic = 0;
        for (const k of kids) {
          if (k.querySelector('img') || k.querySelector('[style*="background-image"]')) withPic++;
        }
        if (withPic < kids.length - 1) continue;
        if (!(el.offsetWidth > 200)) continue;
        out.push(el);
      }
    }
    return out;
  }

  function gxTempleCss(doc) {
    const sz = S.gxTempleSize === 's' ? 's' : S.gxTempleSize === 'l' ? 'l' : '';
    try {
      if (doc.documentElement) doc.documentElement.classList.toggle('tgtk-gx-size-s', sz === 's');
    } catch (e) {}
    let st = null;
    try {
      st = doc.getElementById('tgtk-gx-temple-css');
    } catch (e) {}
    const rules = sz === 's'
      ? '#tg-trade-box-temple-list{display:grid !important;grid-template-columns:repeat(6,minmax(0,1fr)) !important;' +
        'justify-items:center;gap:6px !important;margin-left:0;margin-right:0;zoom:1}'
      : sz === 'l'
      ? '#tg-trade-box-temple-list{zoom:1.15;justify-content:center}'
      : '';
    if (!st) {
      if (!rules) return;
      try {
        st = doc.createElement('style');
        st.id = 'tgtk-gx-temple-css';
        (doc.head || doc.documentElement).appendChild(st);
      } catch (e) {
        return;
      }
    }
    if (st.textContent !== rules) st.textContent = rules;
  }

  function gxTempleSizeFast(onlyCss) {
    const sz = S.gxTempleSize === 's' ? 's' : S.gxTempleSize === 'l' ? 'l' : '';
    for (const d of allDocs()) {
      gxTempleCss(d);
      gxStyle(d);
    }
    if (onlyCss) return;
    gxTempleGrids().forEach((g) => {
      if (sz) {
        if (g.getAttribute('data-tgtk-templesz') !== sz) g.setAttribute('data-tgtk-templesz', sz);
      } else if (g.hasAttribute('data-tgtk-templesz')) {
        g.removeAttribute('data-tgtk-templesz');
      }
    });
  }

  function gxTempleSize(rec) {
    if (rec && rec.box) {
      ['s', 'm', 'l'].forEach((k) => rec.box.classList.remove('tgtk-gx-sz-' + k));
      const sz = S.gxTempleSize === 's' || S.gxTempleSize === 'l' ? S.gxTempleSize : 'm';
      if (sz !== 'm') rec.box.classList.add('tgtk-gx-sz-' + sz);
    }
    const now = Date.now();
    if (GX.szAt && now - GX.szAt < 4000) return;
    GX.szAt = now;
    gxTempleSizeFast(false);
  }

  let gxSizeEl = null;

  function gxSizeControl() {
    if (gxSizeEl) return gxSizeEl;
    const sel = h(
      'select',
      {
        id: 'tgtk-gxsize-inline',
        class: 'tgtk-gxsize-inline',
        'data-tgtk': '1',
        title: '圣殿尺寸：小 / 中 / 大',
      },
      h('option', { value: 's' }, '小'),
      h('option', { value: 'm' }, '中'),
      h('option', { value: 'l' }, '大')
    );
    sel.value = S.gxTempleSize === 's' || S.gxTempleSize === 'l' ? S.gxTempleSize : 'm';
    sel.addEventListener('change', () => {
      S.gxTempleSize = sel.value;
      persist();
      try {
        gxTempleSize(gxBox());
      } catch (e) {}
      try {
        gxTempleSizeFast(false);
      } catch (e) {}
    });
    ['click', 'mousedown', 'mouseup'].forEach((ev) =>
      sel.addEventListener(ev, (e) => e.stopPropagation())
    );
    gxSizeEl = sel;
    return sel;
  }

  function gxPlaceSize(parent, before, mode) {
    const sel = gxSizeControl();
    if (sel.getAttribute('data-tgtk-mode') !== mode) {
      sel.classList.remove('tgtk-gxsize-new', 'tgtk-gxsize-old');
      sel.classList.add('tgtk-gxsize-' + mode);
      sel.setAttribute('data-tgtk-mode', mode);
    }
    if (sel.isConnected && sel.parentElement === parent) return;
    try {
      parent.insertBefore(sel, before || null);
    } catch (e) {}
  }

  function gxMountSize() {
    let placed = false;
    for (const d of allDocs()) {
      try {
        let header = d.getElementById && d.getElementById('tg-trade-box-temple-header');
        if (!header) header = d.querySelector && d.querySelector('[id^="tg-trade-box-temple"][id*="header" i]');
        if (header && header.isConnected) {
          let filter = null;
          for (const el of Array.from(header.children)) {
            if (el.id === 'tgtk-gxsize-inline') continue;
            const t = String(el.textContent || '').replace(/\s+/g, '');
            if (/筛选|隐藏重复|显示重复/.test(t) || el.tagName === 'SELECT') {
              filter = el;
              break;
            }
          }
          gxPlaceSize(header, filter, 'new');
          placed = true;
          break;
        }
      } catch (e) {}
      try {
        for (const gb of d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox')) {
          if (gb.hasAttribute && gb.hasAttribute('data-tgtk-dup')) continue;
          if (!/(?:^|\s)chara\d+(?:\s|$)/.test(String(gb.className || ''))) continue;
          let showAll = null;
          for (const el of gb.querySelectorAll('a,button,span,small,em,b')) {
            if (el.children.length) continue;
            const t = String(el.textContent || '').replace(/[\s\[\]（）()]/g, '');
            if (t === '显示全部' || t === '显示重复' || t === '显示全部圣殿') {
              showAll = el;
              break;
            }
          }
          let host = showAll ? showAll.parentElement : null;
          let before = showAll ? showAll.nextSibling : null;
          if (!host) {
            for (const el of gb.querySelectorAll('div,span,p')) {
              const t = String(el.textContent || '');
              if (t.length > 160 || !/固定资产/.test(t)) continue;
              if (!/显示全部|往期竞拍|萌王投票|资产重组/.test(t)) continue;
              if (!host || host.contains(el)) host = el;
            }
          }
          if (host) {
            gxPlaceSize(host, before, 'old');
            placed = true;
            break;
          }
        }
      } catch (e) {}
      if (placed) break;
    }
    if (!placed && gxSizeEl && gxSizeEl.parentElement) gxSizeEl.remove();
  }

  let gxNewHeadCache = { at: 0, doc: null, box: null, cid: '' };

  function gxNewClimb(from) {
    let up = from;
    let best = null;
    for (let i = 0; i < 7 && up; i++, up = up.parentElement) {
      const s = String(up.textContent || '');
      if (s.length > 1200) break;
      if (!/固定资产|持股|可用/.test(s)) continue;
      best = up;
      if (/交易记录|资产重组|参与竞拍|萌王投票/.test(s)) break;
    }
    return best;
  }

  function gxNewBox() {
    const now = Date.now();
    if (gxNewHeadCache.box && gxNewHeadCache.box.isConnected && now - gxNewHeadCache.at < 1000) {
      return gxNewHeadCache;
    }
    for (const d of allDocs()) {
      let box = null;
      let cid = '';
      try {
        box =
          d.getElementById('tg-trade-box') ||
          d.getElementById('tg-trade-box-header') ||
          d.getElementById('tg-trade-box-header-info');
      } catch (e) {}
      if (!box) {
        try {
          for (const a of d.querySelectorAll('a[href*="/character/"]')) {
            const m = String(a.getAttribute('href') || '').match(/\/character\/(\d+)/);
            if (!m) continue;
            if (!/#\s*\d+/.test(String(a.textContent || ''))) continue;
            const up = gxNewClimb(a);
            if (!up) continue;
            if (!/交易记录|资产重组|参与竞拍|萌王投票/.test(String(up.textContent || ''))) continue;
            const cls = String(up.className || '');
            let hasTg = false;
            try {
              hasTg = /(?:^|\s)tg-(?!tk)/.test(cls) || !!up.querySelector('[id^="tg-"]');
            } catch (e) {}
            if (!hasTg) continue;
            box = up;
            cid = m[1];
            break;
          }
        } catch (e) {}
      }
      if (!box || !box.isConnected) continue;
      if (!cid) {
        try {
          const a = box.querySelector('a[href*="/character/"]');
          const m = a && String(a.getAttribute('href') || '').match(/\/character\/(\d+)/);
          if (m) cid = m[1];
        } catch (e) {}
      }
      if (!cid) {
        try {
          const n = box.querySelector('[data-character-id]');
          const v = n && n.getAttribute('data-character-id');
          if (/^\d+$/.test(String(v || ''))) cid = String(v);
        } catch (e) {}
      }
      if (!cid) cid = currentCharacterId();
      if (!/^\d+$/.test(String(cid || ''))) continue;
      gxNewHeadCache = { at: now, doc: d, box, cid: String(cid) };
      return gxNewHeadCache;
    }
    gxNewHeadCache = { at: now, doc: null, box: null, cid: '' };
    return null;
  }

  function gxSetInput(el, v) {
    if (!el) return;
    try {
      el.value = String(v);
      const w = (el.ownerDocument && el.ownerDocument.defaultView) || window;
      el.dispatchEvent(new w.Event('input', { bubbles: true }));
    } catch (e) {}
  }

  function gxCloneLabel(src, label) {
    const b = src.cloneNode(true);
    try {
      ['id', 'onclick', 'disabled', 'title', 'href', 'aria-label'].forEach((k) => b.removeAttribute(k));
    } catch (e) {}
    const texts = [];
    const walk = (n) => {
      for (const c of Array.from(n.childNodes || [])) {
        if (c.nodeType === 3) {
          if (String(c.textContent || '').trim()) texts.push(c);
        } else if (c.nodeType === 1 && c.tagName !== 'svg' && c.tagName !== 'SVG') {
          walk(c);
        }
      }
    };
    walk(b);
    if (texts.length) texts[texts.length - 1].textContent = label;
    else b.textContent = label;
    return b;
  }

  async function gxNewData(cid, force) {
    const key = 'n' + cid;
    const c = GX.cache[key];
    if (!force && c && Date.now() - c.at < 60000) return c;
    if (GX.busy === key) return c || null;
    GX.busy = key;
    const out = { at: Date.now(), bid: null, sac: 0, price: 0, name: '', temples: null };
    try {
      const v = await api('chara/auction/list', { method: 'POST', body: JSON.stringify([Number(cid)]) });
      const arr = Array.isArray(v) ? v : (v && v.Items) || [];
      const row = arr[0] || null;
      out.bid = row
        ? { users: num(row.State), filled: num(row.Type), price: num(row.Price), amount: num(row.Amount) }
        : { users: 0, filled: 0, price: 0, amount: 0 };
    } catch (e) {}
    if (!out.bid) {
      try {
        const v = await api('chara/user/auction/1/200');
        const arr2 = (v && v.Items) || (Array.isArray(v) ? v : []);
        const row2 = (arr2 || []).find((x) => String(x.CharacterId) === String(cid));
        if (row2) out.bid = { users: 0, filled: 0, price: num(row2.Price), amount: num(row2.Amount) };
      } catch (e) {}
    }
    if (!out.bid) out.bid = { users: 0, filled: 0, price: 0, amount: 0 };
    if (!out.bid.users && !out.bid.filled) out.at -= 45000;
    try {
      const arr = await api('chara/list', { method: 'POST', body: JSON.stringify([Number(cid)]) });
      const r = (arr || [])[0];
      if (r) {
        out.sac = num(r.Sacrifices);
        out.price = num(r.Price);
        out.name = String(r.Name || '');
      }
    } catch (e) {}
    try {
      out.temples = await gxTempleList(cid);
    } catch (e) {}
    GX.cache[key] = out;
    if (GX.busy === key) GX.busy = '';
    return out;
  }

  function gxNewTradeBtn(doc) {
    const rec = gxNewBox();
    const scopes = [];
    if (rec && rec.doc === doc && rec.box) scopes.push(rec.box);
    try {
      const roots = [doc.getElementById('tinygrail'), doc.body];
      for (const r of roots) if (r && !scopes.includes(r)) scopes.push(r);
    } catch (e) {}
    const seen = new Set();
    let fallback = null;
    for (const scope of scopes) {
      let nodes;
      try {
        nodes = scope.querySelectorAll('button,a,[role="button"]');
      } catch (e) {
        continue;
      }
      for (const el of nodes) {
        if (seen.has(el)) continue;
        seen.add(el);
        const t = String(el.textContent || '').replace(/\s+/g, '');
        if (!/交易记录/.test(t) || t.length > 12 || /\(gm\)|（gm）/i.test(t)) continue;
        if (el.closest && el.closest('#tgtk-panel,#tgtk-fab,#tgtk-gxpop,[id^="tgtk-"]')) continue;
        let r = null;
        try {
          r = el.getBoundingClientRect();
        } catch (e) {}
        if (!r || !r.width || !r.height) continue;
        const row = el.parentElement;
        if (row && /资产重组|参与竞拍|萌王投票/.test(String(row.textContent || ''))) return el;
        if (!fallback) fallback = el;
      }
    }
    return fallback;
  }

  function gxNewAuctionInfo(rec, data) {
    const { doc } = rec;
    try {
      doc.querySelectorAll('#tgtk-gx-aucbtn').forEach((n) => n.remove());
    } catch (e) {}
    const trade = gxNewTradeBtn(doc);
    let bar = null;
    try {
      bar = doc.getElementById('tgtk-gx-nauc');
    } catch (e) {}
    if (!trade || !trade.parentElement || !S.gxAuction) {
      if (bar) bar.hidden = true;
      return;
    }
    gxStyle(doc);
    if (!bar) {
      bar = h('span', {
        id: 'tgtk-gx-nauc',
        class: 'tgtk-gx-auction tgtk-gx-nauc',
        'data-tgtk': '1',
        title: '本周拍卖：竞拍人数 / 竞拍数量，我的出价 / 我的数量',
      });
    }
    try {
      doc.querySelectorAll('#tgtk-gx-nauc').forEach((x) => { if (x !== bar) x.remove(); });
    } catch (e) {}
    if (bar.parentElement !== trade.parentElement || bar.previousElementSibling !== trade) {
      try {
        trade.parentElement.insertBefore(bar, trade.nextSibling);
      } catch (e) {
        return;
      }
    }
    bar.hidden = false;
    const bid = (data && data.bid) || null;
    if (!bid) {
      if (bar.dataset.sig !== 'wait') {
        bar.dataset.sig = 'wait';
        bar.textContent = '';
        bar.appendChild(h('span', { class: 'tgtk-gx-wait' }, '拍卖信息读取中…'));
      }
      return;
    }
    const sig = [bid.users, bid.filled, bid.price, bid.amount].join(',');
    if (bar.dataset.sig === sig) return;
    bar.dataset.sig = sig;
    bar.textContent = '';
    bar.appendChild(
      h('span', { class: 'tgtk-gx-users', title: '竞拍人数 / 竞拍数量' }, `${fmt(bid.users)} / ${fmt(bid.filled)}`)
    );
    if (bid.price > 0) {
      bar.appendChild(
        h('span', { class: 'tgtk-gx-mine', title: '我的出价 / 我的数量' }, `₵${fmt(bid.price, 2)} / ${fmt(bid.amount)}`)
      );
    }
  }

  let gxTempleScanAt = 0;

  function gxNewTempleCount(rec, temples) {
    const { box, doc } = rec;
    let span = null;
    try {
      span = doc.querySelector('.tgtk-gx-temples-n');
    } catch (e) {}
    let host = (span && span.isConnected && span.parentElement) || null;
    if (!host) {
      let scope = null;
      try {
        scope =
          doc.getElementById('tg-trade-box-temple-header') ||
          doc.getElementById('tg-trade-box-temple') ||
          doc.querySelector('[id^="tg-trade-box-temple"]');
      } catch (e) {}
      if (scope) {
        try {
          for (const el of scope.querySelectorAll('span,div,p')) {
            const t = String(el.textContent || '').trim();
            if (!/^固定资产\s*[\d,]+$/.test(t)) continue;
            host = el;
            break;
          }
        } catch (e) {}
      }
    }
    if (!host && Date.now() - gxTempleScanAt > 5000) {
      gxTempleScanAt = Date.now();
      try {
        for (const el of doc.querySelectorAll('span,div,strong,b')) {
          if (el.children.length) continue;
          if (!/^固定资产\s*[\d,]+$/.test(String(el.textContent || '').trim())) continue;
          if (!el.closest || !el.closest('[id^="tg-"]')) continue;
          host = el;
          break;
        }
      } catch (e) {}
    }
    if (!host) {
      try {
        let best = null;
        for (const el of box.querySelectorAll('div,span,p')) {
          const t = String(el.textContent || '').trim();
          if (!/固定资产/.test(t) || t.length > 80) continue;
          if (!/[\d,.]\s*(?:\/\s*[\d,.]+)?$/.test(t)) continue;
          if (!best || best.contains(el)) best = el;
        }
        if (best && best.children.length <= 3) host = best;
      } catch (e) {}
    }
    const on = !!(S.gxTempleCount && temples && temples.length);
    if (!host || !on) {
      if (span) span.remove();
      return;
    }
    const cnt = gxTempleCounts(temples);
    const text = ` (${cnt[3]} + ${cnt[2]} + ${cnt[1]})`;
    if (!span) span = h('span', { class: 'tgtk-gx-temples-n', 'data-tgtk': '1', title: '3级 / 2级 / 1级 圣殿数量' });
    if (span.parentElement !== host) {
      try {
        host.appendChild(span);
      } catch (e) {
        return;
      }
    }
    if (span.textContent !== text) span.textContent = text;
  }

  function gxBidCid(modal) {
    try {
      const head = String(modal.textContent || '').slice(0, 120);
      const m = head.match(/#\s*(\d{2,9})/);
      if (m) return m[1];
    } catch (e) {}
    return String(currentCharacterId() || '');
  }

  function gxNewBidModal() {
    for (const doc of allDocs()) {
      let modal = null;
      try {
        modal = doc.getElementById('tg-auction');
      } catch (e) {}
      if (!modal || !modal.isConnected) continue;
      const stale = modal.querySelector('#tgtk-gxq');
      if (stale) stale.remove();
      const amountIn = modal.querySelector('#tg-auction-amount-input');
      if (!amountIn || amountIn.dataset.tgtkInit) continue;

      amountIn.dataset.tgtkInit = '1';
      const cid = gxBidCid(modal);
      const cached = cid ? GX.cache['n' + cid] : null;
      const mine = cached && cached.bid ? Math.max(0, Math.floor(num(cached.bid.amount))) : 0;
      const dft = mine > 0 ? mine : Math.max(1, Math.floor(num(S.gxBidAmount) || 1));
      amountIn.dataset.tgtkDft = String(dft);
      if (Number(amountIn.value) !== dft) gxSetInput(amountIn, String(dft));

      if (!cached && cid) {
        gxNewData(cid)
          .then((d) => {
            const m2 = d && d.bid ? Math.max(0, Math.floor(num(d.bid.amount))) : 0;
            if (m2 <= 0 || !amountIn.isConnected) return;
            if (String(amountIn.value) !== String(amountIn.dataset.tgtkDft || '')) return;
            amountIn.dataset.tgtkDft = String(m2);
            gxSetInput(amountIn, String(m2));
          })
          .catch(() => {});
      }
    }
  }

  function gxNewFavBtn(doc) {
    if (starFavCache.el && starFavCache.el.isConnected && Date.now() - starFavCache.at < 1500) {
      return starFavCache.el;
    }
    const pick = (root) => {
      let best = null;
      let cands;
      try {
        cands = root.querySelectorAll('button,a,[role="button"],span,div');
      } catch (e) {
        return null;
      }
      for (const el of cands) {
        if (el.id === 'tgtk-starbox' || el.id === 'tgtk-star') continue;
        if (el.closest && el.closest('#tgtk-panel,#tgtk-starbox,#tgtk-gxpop')) continue;
        const t = String(el.textContent || '').replace(/\s+/g, '');
        if (t !== '收藏' && t !== '+收藏' && t !== '＋收藏') continue;
        let r;
        try {
          r = el.getBoundingClientRect();
        } catch (e) {
          continue;
        }
        if (!r.width || !r.height || r.width > 220 || r.height > 48) continue;
        if (best && !best.contains(el)) continue;
        best = el;
      }
      if (!best) return null;
      return (best.closest && best.closest('button,a,[role="button"]')) || best;
    };
    const rec = gxNewBox();
    if (!rec || rec.doc !== doc || !rec.box) {
      starFavCache = { at: Date.now(), el: null };
      return null;
    }
    const roots = [rec.box];
    try {
      let up = rec.box.parentElement;
      for (let i = 0; i < 3 && up; i++, up = up.parentElement) {
        roots.push(up);
        if (up.id === 'tinygrail') break;
      }
    } catch (e) {}
    for (const root of roots) {
      try {
        if (String(root.textContent || '').length > 1600) continue;
        if (!root.querySelector(`a[href*="/character/${rec.cid}"]`)) continue;
      } catch (e) {
        continue;
      }
      const hit = pick(root);
      if (hit) {
        starFavCache = { at: Date.now(), el: hit };
        return hit;
      }
    }
    starFavCache = { at: Date.now(), el: null };
    return null;
  }

  function gxBonusBtn() {
    for (const d of allDocs()) {
      try {
        const hit = d.getElementById('bonusButton') || d.getElementById('tg-rakuen-home-bonus-button');
        if (hit) return hit;
        for (const el of d.querySelectorAll('[id$="bonus-button"],[id$="bonusButton"]')) {
          if (/签到|已领取|已签到/.test(String(el.textContent || ''))) return el;
        }
      } catch (e) {}
    }
    return null;
  }

  function gxHideBonusBtn(btn, on) {
    if (!btn) return;
    const doc = btn.ownerDocument;
    if (!doc) return;
    let st = null;
    try {
      st = doc.getElementById('tgtk-bonus-css');
    } catch (e) {}
    if (!on) {
      if (st) st.remove();
      try { btn.classList.remove('tgtk-bonus-off'); } catch (e) {}
      return;
    }
    const id = String(btn.id || '');
    if (!st) {
      try {
        st = doc.createElement('style');
        st.id = 'tgtk-bonus-css';
        st.textContent = (id ? `#${id}` : '.tgtk-bonus-off') + '{display:none !important}';
        (doc.head || doc.documentElement).appendChild(st);
      } catch (e) {}
    }
    try { btn.classList.add('tgtk-bonus-off'); } catch (e) {}
  }

  async function gxBonus() {
    const btn = gxBonusBtn();
    if (!btn) return;
    if (!S.gxHideBonus) {
      gxHideBonusBtn(btn, false);
      return;
    }
    const claimed = /已领取|已签到|明天再来/.test(String(btn.textContent || ''));
    if (claimed) {
      gxHideBonusBtn(btn, true);
      return;
    }
    const now = Date.now();
    if (GX.bonus === null || now - GX.bonusAt > 30 * 60000) {
      GX.bonusAt = now;
      const r = await gxApiRaw('event/share/bonus/test');
      const v = r.value;
      const share = v && typeof v === 'object' ? num(v.Share) : num(v);
      GX.bonus = share > 0 ? share : 0;
      GX.bonusState = r.state;
    }
    if (GX.bonus > 0) {
      const x = GX.bonus / 10000;
      const allowance = Math.log10(x + 1) * 30 - x;
      if (allowance < 0) {
        gxHideBonusBtn(btn, true);
        return;
      }
    }
    gxHideBonusBtn(btn, false);
  }

  function gxIsRakuenHome() {
    for (const d of allDocs()) {
      let href = '';
      try {
        href = String((d.defaultView && d.defaultView.location && d.defaultView.location.href) || '');
      } catch (e) {}
      if (/\/rakuen(?:\/|\?|$)/i.test(href)) return true;
    }
    return false;
  }

  function gxUserHome() {
    if (gxIsRakuenHome()) {
      for (const d of allDocs()) {
        try {
          d.querySelectorAll('.tgtk-foldbtn').forEach((x) => x.remove());
          d.querySelectorAll('.tgtk-grail-hidden').forEach((x) => x.classList.remove('tgtk-grail-hidden'));
        } catch (e) {}
      }
      GX.foldBtn = null;
      GX.applyGrail = null;
      return;
    }
    let doc = null;
    let title = null;
    for (const d of allDocs()) {
      try {
        const t = d.querySelector('#grail li.title') || d.querySelector('#grail .title');
        if (t) {
          doc = d;
          title = t;
          break;
        }
      } catch (e) {}
    }
    if (!title) return;
    gxStyle(doc || title.ownerDocument);

    const wrap = title.closest('.horizontalOptions') || title.closest('ul') || title.parentElement;
    const contentOf = () => {
      let el = wrap && wrap.nextElementSibling;
      if (el && !el.contains(title)) return el;
      for (const d of allDocs()) {
        try {
          const b = d.querySelector('div.grail.page_inner');
          if (b && !b.contains(title)) return b;
        } catch (e) {}
      }
      return null;
    };
    const apply = () => {
      const hidden = !!S.gxHideGrail;
      const el = contentOf();
      if (el) el.classList.toggle('tgtk-grail-hidden', hidden);
      const root = title.closest('#grail') || (wrap && wrap.parentElement);
      const bar = title.closest('.horizontalOptions') || wrap;
      if (root && bar) {
        for (const child of Array.from(root.children)) {
          if (child === bar || child.contains(bar) || bar.contains(child)) continue;
          child.classList.toggle('tgtk-grail-hidden', hidden);
        }
      }
      if (root && root.parentElement) {
        for (const sib of Array.from(root.parentElement.children)) {
          if (sib === root || sib.contains(root)) continue;
          const isPager = /^pager\d+$/.test(String(sib.id || '')) ||
            (sib.classList && sib.classList.contains('page_inner') &&
              sib.querySelector && sib.querySelector('a.p[data-page]'));
          if (isPager) sib.classList.toggle('tgtk-grail-hidden', hidden);
        }
      }
      for (const d of allDocs()) {
        try {
          for (const p of d.querySelectorAll('div.grail.page_inner')) {
            if (!p.querySelector('a.p[data-page]')) continue;
            if (p.closest && p.closest('#tgtk-panel')) continue;
            p.classList.toggle('tgtk-grail-hidden', hidden);
          }
        } catch (e) {}
      }
      const a = GX.foldBtn && GX.foldBtn.querySelector('a');
      if (a) a.textContent = S.gxHideGrail ? '[展开]' : '[折叠]';
    };
    GX.applyGrail = apply;

    if (title.dataset.tgtkGx !== '1') {
      title.dataset.tgtkGx = '1';
      title.title = '显示 / 隐藏小圣杯';
      title.style.cursor = 'pointer';
      title.addEventListener(
        'click',
        (e) => {
          if (gxIsRakuenHome()) return;
          if (e.target && e.target.closest && e.target.closest('.tgtk-foldbtn')) return;
          S.gxHideGrail = !S.gxHideGrail;
          persist();
          apply();
        },
        true
      );
    }
    const host = title.parentElement;
    if (host && !host.querySelector('.tgtk-foldbtn')) {
      const li = h('li', { class: 'tgtk-foldbtn' }, h('a', { role: 'button' }, '[折叠]'));
      li.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          S.gxHideGrail = !S.gxHideGrail;
          persist();
          apply();
        },
        true
      );
      try { host.appendChild(li); } catch (e) {}
      GX.foldBtn = li;
    } else if (host) {
      GX.foldBtn = host.querySelector('.tgtk-foldbtn');
    }
    apply();
  }

  const GXLOG = { host: null, box: null, page: 1, data: null, at: 0, busy: false, err: '' };
  const SLOG_CDN = 'https://tinygrail.mange.cn';
  const SLOG_OSS = 'https://tinygrail.oss-cn-hangzhou.aliyuncs.com/';
  const SLOG_OSS_HOST = SLOG_OSS.replace(/^https?:\/\//i, '');
  const SLOG_AV = '//lain.bgm.tv/pic/user/l/icon.jpg';

  function gxLogAvatar(icon) {
    let a = String(icon || '').trim();
    if (!a) return SLOG_AV;
    const i = a.indexOf(SLOG_OSS_HOST);
    if (i >= 0 && i <= 8) return SLOG_CDN + '/' + a.slice(i + SLOG_OSS_HOST.length) + '!w120';
    if (a.indexOf('/avatar') === 0) return SLOG_CDN + a + '!w120';
    return a.replace(/^http:\/\//i, '//');
  }

  function gxLogTime(t) {
    const s = String(t || '');
    const ms = Date.parse(s.replace(' ', 'T'));
    if (!isFinite(ms)) return s.slice(5, 16).replace('T', ' ');
    const min = Math.floor(Math.max(0, Date.now() - ms) / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return min + 'm ago';
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h ago';
    const day = Math.floor(hr / 24);
    if (day < 30) return day + 'd ago';
    return s.slice(0, 10);
  }

  function gxLogAction(log) {
    const user = String(log.Nickname || log.UserName || '');
    const amt = fmt(num(log.Amount), 0);
    switch (num(log.Type)) {
      case 0: return { user, label: '+' + amt, star: false, bad: false };
      case 2: return { user, label: '鲤鱼之眼 +' + amt, star: false, bad: false };
      case 3: return { user, label: '精炼成功 +' + amt, star: false, bad: false };
      case 4: return { user, label: '精炼失败 +' + amt, star: false, bad: true };
      case 5: return { user, label: '+' + amt, star: true, bad: false };
      default: return { user: '', label: '受到攻击 -' + amt, star: false, bad: true };
    }
  }

  function gxLogRow(log) {
    const act = gxLogAction(log);
    const rank = num(log.Rank);
    const sf = num(log.StarForces);
    const old = num(log.OldRank);
    let delta = null;
    if (rank > old) delta = h('span', { class: 'tgtk-slog-down' }, '↓' + (rank - old));
    else if (rank < old) delta = h('span', { class: 'tgtk-slog-up' }, '↑' + (old - rank));
    const badge = h(
      'span', {
        class: 'tgtk-slog-badge' + (rank > 0 && rank <= 500 ? ' ranked' : ''),
        title: `通天塔排名第${rank}位 / 星之力 +${fmt(sf, 0)}`,
      },
      h('span', null, '#' + rank),
      h('i', { class: 'tgtk-slog-bsep' }),
      h('span', null, '✦' + fmt(sf, 0))
    );
    const av = h('span', { class: 'tgtk-slog-av' },
      h('img', {
        src: gxLogAvatar(log.Icon), alt: '', loading: 'lazy',
        onerror: (e) => {
          const im = e && e.currentTarget;
          if (im && !im.getAttribute('data-tgtk-fb')) {
            im.setAttribute('data-tgtk-fb', '1');
            im.src = SLOG_AV;
          }
        },
      })
    );
    const parts = [];
    if (act.user) parts.push(h('span', {
      class: 'tgtk-slog-user', title: '@' + act.user,
    }, '@' + act.user));
    parts.push(h('span', { class: 'tgtk-slog-amt' }, act.label));
    if (act.star) parts.push(h('span', { class: 'tgtk-slog-star' }, '★'));
    return h(
      'div', { class: 'tgtk-slog-row', 'data-tgtk': '1' },
      av,
      h('div', { class: 'tgtk-slog-main' },
        h('div', { class: 'tgtk-slog-l1' },
          h('a', {
            class: 'tgtk-slog-name',
            href: 'https://bgm.tv/character/' + num(log.CharacterId),
            target: '_blank', rel: 'noreferrer',
          }, String(log.CharacterName || '')),
          badge,
          delta
        ),
        h('div', { class: 'tgtk-slog-l2' },
          h('span', { class: 'tgtk-slog-act' + (act.bad ? ' bad' : '') }, parts),
          h('span', { class: 'tgtk-slog-time' }, gxLogTime(log.LogTime))
        )
      )
    );
  }

  function gxFindStarLogHost() {
    for (const d of allDocs()) {
      try {
        if (d.getElementById('tg-rakuen-home-babel-tower-log-list') ||
            d.querySelector('[id^="tg-rakuen-home-babel"]')) continue;
      } catch (e) {}
      let tower = null;
      let host = null;
      try {
        tower = d.getElementById('starForces');
        if (tower && /通天塔/.test(String(tower.textContent || ''))) {
          host = tower.querySelector('.logs') || null;
        }
      } catch (e) {}
      if (!host) {
        let t = null;
        try {
          for (const el of d.querySelectorAll('div,span,h2,h3,h4,li,b,strong')) {
            if (el.children.length) continue;
            if (!/通天塔/.test(String(el.textContent || ''))) continue;
            t = el;
            break;
          }
        } catch (e) { continue; }
        if (!t) continue;
        let up = t.parentElement;
        for (let i = 0; i < 4 && up; i++, up = up.parentElement) {
          const l = up.querySelector && up.querySelector('.logs');
          if (l) { host = l; tower = up; break; }
        }
      }
      if (!host) continue;
      if (host.closest && host.closest('#tgtk-starlog')) continue;
      if (host.id === 'tgtk-starlog' || /tgtk-slog/.test(String(host.className || ''))) continue;
      return { doc: d, host };
    }
    return null;
  }

  function gxStarLogClean(doc) {
    try {
      const host = doc && doc.querySelector && doc.querySelector('#starForces .logs');
      if (!host) return;
      for (const child of Array.from(host.children)) {
        if (child.classList && child.classList.contains('star_log')) child.remove();
      }
    } catch (e) {}
  }

  function gxStarLogDraw() {
    const box = GXLOG.box;
    if (!box || !box.isConnected) return;
    const list = box.querySelector('.tgtk-slog-list');
    const pager = box.querySelector('.tgtk-slog-pager');
    if (!list || !pager) return;
    const data = GXLOG.data;
    const items = (data && (Array.isArray(data) ? data : data.Items)) || [];
    list.textContent = '';
    if (!items.length) {
      list.appendChild(h('div', { class: 'tgtk-slog-empty' },
        GXLOG.busy ? '读取中…' : (GXLOG.err || '暂无日志')));
    } else {
      for (const it of items) list.appendChild(gxLogRow(it));
    }
    pager.textContent = '';
    const prev = h('button', { type: 'button', 'data-tgtk': '1' }, '上一页');
    prev.disabled = GXLOG.busy || GXLOG.page <= 1;
    prev.addEventListener('click', () => gxStarLogLoad(GXLOG.page - 1));
    const next = h('button', { type: 'button', 'data-tgtk': '1' }, '下一页');
    next.disabled = GXLOG.busy || items.length < 30;
    next.addEventListener('click', () => gxStarLogLoad(GXLOG.page + 1));
    const refresh = h('button', { type: 'button', 'data-tgtk': '1', title: '重新读取本页' }, '刷新');
    refresh.disabled = GXLOG.busy;
    refresh.addEventListener('click', () => gxStarLogLoad(GXLOG.page, true));
    pager.appendChild(prev);
    pager.appendChild(h('span', null, '第 ' + GXLOG.page + ' 页'));
    pager.appendChild(next);
    pager.appendChild(refresh);
  }

  async function gxStarLogLoad(page, force) {
    if (GXLOG.busy) return;
    const p = Math.max(1, Math.floor(num(page) || 1));
    if (!force && GXLOG.at && GXLOG.data && GXLOG.page === p && Date.now() - GXLOG.at < 30000) {
      gxStarLogDraw();
      return;
    }
    GXLOG.busy = true;
    GXLOG.err = '';
    gxStarLogDraw();
    try {
      GXLOG.data = await api('chara/star/log/' + p + '/30');
      GXLOG.page = p;
      GXLOG.at = Date.now();
    } catch (e) {
      GXLOG.err = '读取失败：' + (e && e.message ? e.message : String(e));
    } finally {
      GXLOG.busy = false;
      gxStarLogDraw();
    }
  }

  function gxStarLog() {
    const found = gxFindStarLogHost();
    if (!found) return;
    const { doc, host } = found;
    try {
      for (const old of Array.from(doc.querySelectorAll('#tgtk-starlog'))) {
        if (old !== GXLOG.box || old.parentElement !== host) old.remove();
      }
    } catch (e) {}
    try {
      for (const child of Array.from(host.children)) {
        if (child === GXLOG.box) continue;
        if (child.id === 'tgtk-starlog' ||
            (child.classList && (child.classList.contains('star_log') ||
                                child.classList.contains('tgtk-starlog')))) child.remove();
      }
    } catch (e) {}
    if (GXLOG.host === host && GXLOG.box && GXLOG.box.isConnected &&
        GXLOG.box.parentElement === host) {
      if (GXLOG.at && Date.now() - GXLOG.at > 60000) gxStarLogLoad(GXLOG.page, true);
      return;
    }
    if (GXLOG.box && GXLOG.box.isConnected && GXLOG.host !== host) {
      try {
        host.textContent = '';
        host.appendChild(GXLOG.box);
        GXLOG.host = host;
        gxStarLogDraw();
        return;
      } catch (e) {}
    }
    if (GXLOG.host !== host) {
      GXLOG.data = null;
      GXLOG.at = 0;
      GXLOG.page = 1;
    }
    try { host.textContent = ''; } catch (e) { return; }
    const box = h('div', { id: 'tgtk-starlog', class: 'tgtk-starlog', 'data-tgtk': '1' },
      h('div', { class: 'tgtk-slog-list' }),
      h('div', { class: 'tgtk-slog-pager' })
    );
    host.appendChild(box);
    GXLOG.host = host;
    GXLOG.box = box;
    gxStarLogLoad(GXLOG.page);
  }

  function gxTopWeekCards() {
    const re = /^\d+\s*\/\s*[\d,]+\s*\/\s*[\d,]+$/;
    const found = [];
    for (const d of allDocs()) {
      let nodes;
      try {
        nodes = d.querySelectorAll('div,span,small,b,i,p,em');
      } catch (e) {
        continue;
      }
      for (const n of nodes) {
        if (n.children.length) continue;
        const t = String(n.textContent || '').trim();
        if (!t || t.length > 40 || !re.test(t)) continue;
        let card = n.parentElement;
        for (let i = 0; i < 4 && card; i++) {
          if (card.querySelector('img') && card.offsetWidth > 90 && card.offsetHeight > 90) break;
          card = card.parentElement;
        }
        if (!card || !card.parentElement) continue;
        if (/tgtk-/.test(String(card.className || ''))) continue;
        found.push(card);
      }
    }
    const groups = new Map();
    found.forEach((c) => {
      const p = c.parentElement;
      if (!p) return;
      if (!groups.has(p)) groups.set(p, []);
      const arr = groups.get(p);
      if (!arr.includes(c)) arr.push(c);
    });
    let best = [];
    groups.forEach((arr) => {
      if (arr.length > best.length) best = arr;
    });
    return best.length >= 4 ? best : [];
  }

  async function gxTopWeek() {
    if (!S.gxTopWeek) return;
    if (GX.topNodes && GX.topNodes.length) {
      const alive = GX.topNodes.every(
        (n) => n.isConnected && n.querySelector('.tgtk-gx-ov') && n.querySelector('.tgtk-gx-ovscore')
      );
      if (alive) return;
    }
    const now = Date.now();
    if (GX.topAt && now - GX.topAt < 1500) return;
    GX.topAt = now;

    let cards = [];
    let root = null;
    for (const d of allDocs()) {
      try {
        root = d.getElementById('topWeek');
        if (root) break;
      } catch (e) {}
    }
    if (root) {
      cards = Array.from(root.querySelectorAll('.assets .item')).map((el) => ({ card: el, host: el }));
    }
    if (!cards.length) {
      for (const d of allDocs()) {
        let list = null;
        try { list = d.getElementById('tg-rakuen-home-top-week-list'); } catch (e) {}
        if (!list) continue;
        for (const el of list.children) {
          if (!el || !el.children || !el.children.length) continue;
          let host = el.firstElementChild;
          for (const k of el.children) {
            if (/aspect-/.test(String(k.className || ''))) { host = k; break; }
          }
          cards.push({ card: el, host: host || el });
        }
        if (cards.length) break;
      }
    }
    if (!cards.length) cards = gxTopWeekCards().map((el) => ({ card: el, host: el }));
    if (!cards.length) return;

    let allDone = true;
    for (const it of cards) {
      if (!it.host.querySelector('.tgtk-gx-ov')) {
        allDone = false;
        break;
      }
    }
    const key =
      (root ? 'old:' : 'new:') + cards.length + ':' +
      String(cards[0].card.textContent || '').slice(0, 40);
    if (GX.topkey === key && allDone) return;
    let arr = GX.topkey === key ? GX.top || [] : [];
    if (!arr.length) {
      try {
        const v = await api('chara/topweek');
        arr = Array.isArray(v) ? v : [];
      } catch (e) {
        return;
      }
      if (!arr.length) return;
      GX.topkey = key;
      GX.top = arr;
    }
    let totalExtra = 0;
    let totalPeople = 0;
    arr.forEach((x) => {
      totalExtra += num(x.Extra);
      totalPeople += num(x.Type);
    });
    const hosts = [];
    arr.forEach((x, i) => {
      const it = cards[i];
      if (!it) return;
      gxStyle(it.card.ownerDocument);
      it.card.classList.add('tgtk-gx-card');
      it.card.querySelectorAll('.tgtk-gx-score').forEach((n) => {
        if (!n.closest('.tgtk-gx-ov')) n.remove();
      });
      const assets = num(x.Assets);
      const sac = num(x.Sacrifices);
      const extra = num(x.Extra);
      const price = num(x.Price);
      const people = num(x.Type);
      const avg = assets ? (extra + price * sac) / assets : 0;
      const score = extra + (totalPeople ? (people * totalExtra) / totalPeople : 0);
      const scoreShow = Math.floor(score / 100);
      let ov = it.host.querySelector('.tgtk-gx-ov');
      if (!ov) {
        ov = h('div', { class: 'tgtk-gx-ov' });
        it.host.appendChild(ov);
      }
      hosts.push(it.host);
      const sig = [people, avg, assets, sac, scoreShow].join('|');
      if (ov.dataset.sig === sig) return;
      ov.dataset.sig = sig;
      ov.textContent = '';
      ov.appendChild(
        h(
          'dl',
          null,
          h('dt', null, '人数'), h('dd', null, fmt(people)),
          h('dt', null, '均价₵'), h('dd', null, fmt(avg, 2)),
          h('dt', null, '拍卖数'), h('dd', null, fmt(assets)),
          h('dt', null, '英灵殿'), h('dd', null, fmt(sac))
        )
      );
      ov.appendChild(
        h('div', { class: 'tgtk-gx-ovscore' }, h('span', null, '评分'), h('span', null, fmt(scoreShow)))
      );
    });
    GX.topNodes = hosts;
  }

  function gxOpenBid(rec, anchor) {
    const cid = rec.cid;
    const data = GX.cache[cid] || {};
    const base = (data.base && data.base.price) || 0;
    const pop = gxPop(`股权拍卖 · ${gxCharLabel(cid)}`, anchor, { center: true, wide: true });

    const hint = h('div', { class: 'tgtk-histsum' }, '读取中…');
    pop.appendChild(hint);

    const numSpan = h('span', { class: 'tgtk-gxnums' });
    const mine = data.bid && data.bid.price > 0 && data.bid.amount > 0 ? data.bid : null;
    const initPrice = mine ? mine.price : base;
    const initAmount = mine ? mine.amount : Math.max(1, Math.floor(num(S.gxBidAmount) || 1));
    const priceIn = h('input', {
      type: 'number',
      min: String(base || 0),
      step: '0.01',
      value: initPrice ? String(initPrice) : '',
      title: '出价（不能低于底价）',
    });
    const amountIn = h('input', {
      type: 'number',
      min: '1',
      step: '1',
      value: String(initAmount),
      title: '竞拍数量',
    });
    const sum = h('span', { class: 'tgtk-gxsum' }, '');
    const upd = () => {
      sum.textContent = '合计 -₵' + fmt(num(priceIn.value) * num(amountIn.value), 2);
    };

    const fill = () => {
      const d = GX.cache[cid] || {};
      const b = d.bid || null;
      const t = (d.base && d.base.amount) || 0;
      const baseP = (d.base && d.base.price) || 0;
      if (baseP) priceIn.setAttribute('min', String(baseP));
      numSpan.textContent = '';
      if (b) {
        numSpan.appendChild(
          h('span', { class: 'tgtk-gx-users', title: '竞拍人数 / 已拍股数' }, `${fmt(b.users)} / ${fmt(b.filled)}`)
        );
        if (b.price > 0) {
          numSpan.appendChild(
            h('span', { class: 'tgtk-gx-mine', title: '我的出价 / 我的股数' }, `₵${fmt(b.price, 2)} / ${fmt(b.amount)}`)
          );
        }
      }
      hint.textContent = t
        ? `底价 ₵${fmt(baseP, 2)} · 拍卖总量 ${fmt(t)} 股 · 待拍 ${fmt(Math.max(0, t - ((b && b.filled) || 0)))} 股`
        : `底价 ₵${fmt(baseP, 2)} · 可拍 0 股 · 萌王投票仍可直接出价`;
      if (b && b.price > 0 && b.amount > 0) {
        priceIn.value = String(b.price);
        amountIn.value = String(b.amount);
        upd();
      }
    };
    fill();

    const quick = h(
      'div',
      { class: 'tgtk-gxquick' },
      h('button', { type: 'button', 'data-q': 'full' }, '[补满]'),
      h('button', { type: 'button', 'data-q': 'amount' }, '[改量]'),
      h('button', { type: 'button', 'data-q': 'price' }, '[改价]'),
      numSpan
    );
    pop.appendChild(quick);

    quick.addEventListener('click', (e) => {
      const b = e.target && e.target.closest ? e.target.closest('[data-q]') : null;
      if (!b) return;
      e.preventDefault();
      const q = b.getAttribute('data-q');
      const d = GX.cache[cid] || {};
      const baseP = (d.base && d.base.price) || 0;
      const tot = (d.base && d.base.amount) || 0;
      const bd = d.bid || { users: 0, filled: 0, price: 0, amount: 0 };
      const myAll = bd.price > 0 && bd.amount > 0 ? bd.price * bd.amount : 0;
      const curP = Number(priceIn.value) || 0;
      const curA = Math.floor(Number(amountIn.value) || 0);
      if (q === 'full') {
        if (baseP) priceIn.value = String(baseP);
        amountIn.value = String(Math.max(1, tot - bd.filled + bd.amount));
      } else if (q === 'amount') {
        const money = myAll || curP * curA;
        if (curP > 0 && money > 0) amountIn.value = String(Math.max(1, Math.ceil(money / curP)));
      } else if (q === 'price') {
        const money = myAll || curP * curA;
        if (curA > 0 && money > 0) priceIn.value = String(Math.ceil((money / curA) * 100) / 100);
      }
      upd();
    });

    priceIn.addEventListener('input', upd);
    amountIn.addEventListener('input', upd);
    upd();

    const msg = h('div', { class: 'tgtk-gxmsg' }, '');
    const ok = h('button', { class: 'tgtk-btn tgtk-primary tgtk-gxok', type: 'button' }, '确定');
    const cancel = h('button', { class: 'tgtk-btn tgtk-gxcancel', type: 'button' }, '取消竞拍');
    cancel.hidden = !(data.bid && data.bid.price > 0);

    const warnChk = h('input', { type: 'checkbox' });
    warnChk.checked = !!S.gxBidWarn;
    warnChk.addEventListener('change', () => {
      S.gxBidWarn = !!warnChk.checked;
      persist();
    });
    const warnLab = h(
      'label',
      { class: 'tgtk-gxwarn', title: '勾选后：这次的数量低于我已拍的数量时，先确认一次再提交' },
      warnChk,
      h('span', null, '数量降低提醒')
    );

    pop.appendChild(
      h('div', { class: 'tgtk-gxlabels' }, h('span', null, '价格'), h('span', null, '数量'), sum)
    );
    pop.appendChild(h('div', { class: 'tgtk-gxrow' }, priceIn, amountIn, ok));
    pop.appendChild(h('div', { class: 'tgtk-histfoot tgtk-gxfoot' }, cancel, msg, warnLab));

    const refresh = async () => {
      await gxData(cid, true);
      fill();
      const now = gxBox();
      if (now && String(now.cid) === String(cid)) {
        gxDrawAuction(now, GX.cache[cid] || {});
        gxDrawTempleCount(now, (GX.cache[cid] || {}).temples);
      }
      const b = (GX.cache[cid] || {}).bid;
      cancel.hidden = !(b && b.price > 0);
    };
    if (!data.base || !data.bid) refresh();

    ok.addEventListener('click', async () => {
      const price = Number(priceIn.value) || 0;
      const amount = Math.floor(Number(amountIn.value) || 0);
      if (!(price > 0) || !(amount > 0)) {
        msg.className = 'tgtk-gxmsg tgtk-gxbad';
        msg.textContent = '价格和数量都要填大于 0 的数字。';
        return;
      }
      const baseNow = ((GX.cache[cid] || {}).base || {}).price || base;
      if (baseNow && price < baseNow) {
        msg.className = 'tgtk-gxmsg tgtk-gxbad';
        msg.textContent = `出价不能低于底价 ₵${fmt(baseNow, 2)}。`;
        return;
      }
      if (S.gxBidWarn) {
        ok.disabled = true; // 等接口期间先锁住，避免连点提交两次
        try {
          await gxData(cid, true);
        } catch (e) {}
        const b = (GX.cache[cid] || {}).bid;
        if (b && b.amount > 0 && amount < b.amount) {
          const cut = b.amount - amount;
          const okGo = window.confirm(
            `这次数量是 ${fmt(amount)} 股，比你已拍的 ${fmt(b.amount)} 股少 ${fmt(cut)} 股。\n` +
              `提交后会撤掉这 ${fmt(cut)} 股（周六取消竞拍会扣资金），确定继续吗？`
          );
          if (!okGo) {
            ok.disabled = false;
            return;
          }
        }
      }
      ok.disabled = true;
      ok.textContent = '提交中…';
      try {
        const v = await api(`chara/auction/${cid}/${price}/${amount}`, { method: 'POST', body: '{}' });
        msg.className = 'tgtk-gxmsg tgtk-gxok';
        msg.textContent = typeof v === 'string' && v ? v : `已出价 ₵${fmt(price, 2)} × ${fmt(amount)} 股`;
        await refresh();
      } catch (e) {
        msg.className = 'tgtk-gxmsg tgtk-gxbad';
        msg.textContent = '竞拍失败：' + (e && e.message ? e.message : e);
      } finally {
        ok.disabled = false;
        ok.textContent = '确定';
      }
    });

    cancel.addEventListener('click', async () => {
      if (!window.confirm('确定取消这条竞拍？')) return;
      cancel.disabled = true;
      try {
        const list = await api('chara/user/auction/1/200');
        const arr = (list && list.Items) || (Array.isArray(list) ? list : []);
        const row = (arr || []).find((x) => String(x.CharacterId) === String(cid));
        if (!row || !row.Id) throw new Error('没找到你的竞拍记录');
        await api(`chara/auction/cancel/${row.Id}`, { method: 'POST', body: '{}' });
        msg.className = 'tgtk-gxmsg tgtk-gxok';
        msg.textContent = '已取消竞拍';
        await refresh();
      } catch (e) {
        msg.className = 'tgtk-gxmsg tgtk-gxbad';
        msg.textContent = '取消失败：' + (e && e.message ? e.message : e);
      } finally {
        cancel.disabled = false;
      }
    });
  }

  function gxOpenPast(rec, anchor) {
    const cid = rec.cid;
    const sum = h('div', { class: 'tgtk-histsum' }, '读取中…');
    const list = h('div', { class: 'tgtk-histlist' });
    const stat = h('span', { class: 'tgtk-histstat' }, '');
    const prev = h('button', { class: 'tgtk-btn tgtk-gxnav', type: 'button', title: '往前翻更早的一周' }, '前一周');
    const next = h('button', { class: 'tgtk-btn tgtk-gxnav', type: 'button', title: '回到更近的一周' }, '后一周');
    const pop = gxPop(`往期拍卖 · ${gxCharLabel(cid)}`, anchor, { centerCompact: true, extra: [next, prev] });
    pop.appendChild(sum);
    pop.appendChild(list);
    pop.appendChild(h('div', { class: 'tgtk-histfoot tgtk-gxfoot' }, stat));

    let page = 1;
    const load = async () => {
      sum.textContent = '读取中…';
      list.textContent = '';
      stat.textContent = `第 ${page} 周`;
      next.hidden = page <= 1;
      prev.hidden = false;
      try {
        const v = await api(`chara/auction/list/${cid}/${page}`);
        const rows = (Array.isArray(v) ? v : (v && v.Items) || []).slice();
        if (!rows.length) {
          sum.textContent = '这一周没有拍卖记录';
          list.appendChild(
            h('div', { class: 'tgtk-histempty' }, page === 1 ? '本周暂无拍卖数据' : '这一周没有记录，可继续点「前一周」往前找')
          );
          return;
        }
        const wins = rows.filter((a) => num(a.State) === 1).sort((a, b) => num(b.Price) - num(a.Price));
        const loses = rows.filter((a) => num(a.State) !== 1);
        const okAmount = wins.reduce((s, a) => s + num(a.Amount), 0);
        const money = wins.reduce((s, a) => s + num(a.Amount) * num(a.Price), 0);
        const avg = okAmount ? money / okAmount : 0;
        const ps = wins.map((a) => num(a.Price)).sort((x, y) => x - y);
        const median = ps.length
          ? ps.length % 2
            ? ps[(ps.length - 1) / 2]
            : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2
          : 0;
        sum.textContent =
          `${rows.length} 人参与 · 成功 ${wins.length} 人 / ${fmt(okAmount)} 股` +
          (wins.length ? ` · 均价 ₵${fmt(avg, 2)} · 中位 ₵${fmt(median, 2)}` : '');
        list.appendChild(
          h(
            'div',
            { class: 'tgtk-histrow tgtk-histhd' },
            h('i', null, '时间'),
            h('i', null, '竞拍者'),
            h('i', null, '出价'),
            h('i', null, '数量'),
            h('i', null, '结果')
          )
        );
        wins.concat(loses).forEach((a) => {
          const win = num(a.State) === 1;
          const when = String(a.Bid || a.Time || '').replace('T', ' ').slice(5, 16);
          list.appendChild(
            h(
              'div',
              { class: 'tgtk-histrow', title: String(a.Bid || a.Time || '') },
              h('i', null, when),
              h(
                'i',
                null,
                a.Username
                  ? h('a', { href: `/user/${a.Username}`, target: '_blank', rel: 'noreferrer' }, a.Nickname || a.Username)
                  : a.Nickname || '-'
              ),
              h('i', null, '₵' + fmt(a.Price, 2)),
              h('i', null, fmt(a.Amount)),
              h('i', { style: win ? 'color:#c0392b' : 'color:#8a7f88' }, win ? '成功' : '失败')
            )
          );
        });
      } catch (e) {
        sum.textContent = '读取失败';
        list.appendChild(h('div', { class: 'tgtk-histempty' }, '接口返回：' + (e && e.message ? e.message : e)));
      }
    };
    next.addEventListener('click', () => {
      if (page > 1) {
        page--;
        load();
      }
    });
    prev.addEventListener('click', () => {
      page++;
      load();
    });
    load();
  }

  let gxTimer = null;

  const gxWatch = new WeakMap();
  let gxReapplyBusy = false;

  function gxReapply(doc, templeDirty) {
    if (gxReapplyBusy) return;
    gxReapplyBusy = true;
    try {
      applySeamless(); // iframe 重载 / 新文档出现时把「无缝 link 图」开关补上
      gxStarLogClean(doc); // signalR 推来的旧格式日志条目，40ms 内清掉
      tgTempleTools(); // 塔图弹窗重绘后 40ms 内把裁剪/复制/修改按钮挂回
      gxDedupeBoxes(); // 插件重绘 / 又插入一份重复框时，40ms 内收掉
      gxMountSize(); // React 换掉圣殿表头后，40ms 内把尺寸开关挂回去
      const rec = gxNewBox();
      if (rec && rec.doc === doc) {
        const d = GX.cache['n' + rec.cid] || null;
        gxNewAuctionInfo(rec, d);
        if (d) gxNewTempleCount(rec, d.temples);
      }
      gxTempleSizeFast(!templeDirty);
    } catch (e) {}
    gxReapplyBusy = false;
  }

  function gxStartWatch() {
    for (const doc of allDocs()) {
      if (gxWatch.has(doc)) continue;
      const win = doc.defaultView;
      const MO = win && win.MutationObserver;
      if (!MO || !doc.body) continue;
      const state = { timer: null };
      let mo = null;
      try {
        mo = new MO((records) => {
          let hit = false;
          let templeDirty = false;
          let linkTouched = false;
          const templeish = (n) => {
            if (!n || n.nodeType !== 1) return false;
            try {
              if (n.hasAttribute && n.hasAttribute('data-user-name')) return true;
              if (/temple/i.test(String(n.id || ''))) return true;
              if (n.querySelector && n.querySelector('[data-user-name]')) return true;
            } catch (e) {}
            return false;
          };
          for (const r of records) {
            if (r.type === 'attributes') {
              const at = r.target;
              if (at && at.nodeType === 1 && at.closest &&
                at.closest('#tg-temple-link,.chara_link')) linkTouched = true;
              continue;
            }
            if (r.type !== 'childList') continue;
            const tgt = r.target;
            if (tgt && tgt.nodeType === 1 && tgt.closest &&
              (tgt.closest('[id*="temple" i]') || tgt.closest('[class*="temple" i]'))) templeDirty = true;
            if (tgt && tgt.nodeType === 1 && tgt.closest &&
              tgt.closest('#tgtk-gx-nauc,#tgtk-starbox,#tgtk-gxpop,#tgtk-panel,#tgtk-fab,[data-tgtk]')) continue;
            for (const n of Array.from(r.removedNodes || [])) {
              if (n.nodeType !== 1) continue;
              if (n.hasAttribute && n.hasAttribute('data-tgtk')) continue;
              if (templeish(n)) templeDirty = true;
              hit = true;
              break;
            }
            if (hit) break;
            for (const n of Array.from(r.addedNodes || [])) {
              if (n.nodeType !== 1) continue;
              if (/^tgtk-/.test(String(n.id || ''))) continue;
              if (n.hasAttribute && n.hasAttribute('data-tgtk')) continue;
              if (templeish(n)) templeDirty = true;
              hit = true;
              break;
            }
            if (hit) break;
          }
          tgLinkPassSoon();
          if (templeDirty) {
            if (state.timer) { clearTimeout(state.timer); state.timer = null; }
            try { gxReapply(doc, true); } catch (e) {}
            return;
          }
          if (!hit || state.timer) return;
          state.timer = setTimeout(() => {
            state.timer = null;
            gxReapply(doc, false);
          }, 40);
        });
        mo.observe(doc.body, {
          childList: true, subtree: true,
          attributes: true, attributeFilter: ['style', 'class'],
        });
      } catch (e) {
        continue;
      }
      gxWatch.set(doc, { mo, state });
    }
  }

  const TGT = {
    last: null, crop: null, toastTimer: 0, uidCache: {}, paste: null,
    me: null, meAsked: false, meRetryAt: 0, popSig: '', popAt: 0,
    linkInfo: {}, linkAsked: {}, owner: {},
  };
  const TGT_OSS = 'https://tinygrail.oss-cn-hangzhou.aliyuncs.com/';
  const TGT_CDN = 'https://tinygrail.mange.cn/';
  const TGT_HIDE_CSS = 'html.tgtk-crop-open #tg-modal,' +
    'html.tgtk-crop-open [data-tgtk-crop-hide]' +
    '{visibility:hidden !important;opacity:0 !important;pointer-events:none !important}' +
    'html.tgtk-crop-open iframe{z-index:1 !important}';

  function tgCropHideCss(d) {
    try {
      if (d.getElementById('tgtk-crop-hide-style')) return;
      const st = d.createElement('style');
      st.id = 'tgtk-crop-hide-style';
      st.textContent = TGT_HIDE_CSS;
      (d.head || d.documentElement).appendChild(st);
    } catch (e) {}
  }

  function tgHidePopups() {
    if (!TGT.crop) return;
    for (const d of allDocs()) {
      tgCropHideCss(d);
      try { d.documentElement.classList.add('tgtk-crop-open'); } catch (e) {}
      for (const sel of ['#tg-modal', '#tg-modal-background', '[id^="tg-modal-"]',
        '.tg-bg-mask', '.tg-modal-mask', '.tg-modal-backdrop']) {
        try {
          const els = d.querySelectorAll(sel);
          for (let i = 0; i < els.length; i++) {
            try { els[i].setAttribute('data-tgtk-crop-hide', '1'); } catch (e) {}
          }
        } catch (e) {}
      }
      const det = d.getElementById && d.getElementById('tg-temple-detail');
      if (det) {
        let up = det;
        while (up && up !== d.body && up !== d.documentElement) {
          try { up.setAttribute('data-tgtk-crop-hide', '1'); } catch (e) {}
          up = up.parentElement;
        }
      }
      const b = d.body;
      if (!b) continue;
      const kids = Array.prototype.slice.call(b.children);
      for (let i = 0; i < kids.length; i++) {
        const el = kids[i];
        if (!el || el.id === 'tgtk-crop' || el.id === 'tgtk-ttoast') continue;
        try {
          if (!el.hasAttribute('data-tgtk-crop-pe')) {
            el.setAttribute('data-tgtk-crop-pe-prev', el.style.pointerEvents || '');
            el.setAttribute('data-tgtk-crop-pe', '1');
          }
          el.style.setProperty('pointer-events', 'none', 'important');
        } catch (e) {}
      }
    }
  }

  function tgShowPopups() {
    for (const d of allDocs()) {
      try { d.documentElement.classList.remove('tgtk-crop-open'); } catch (e) {}
      try {
        for (const el of d.querySelectorAll('[data-tgtk-crop-hide]')) el.removeAttribute('data-tgtk-crop-hide');
      } catch (e) {}
      try {
        for (const el of d.querySelectorAll('[data-tgtk-crop-pe]')) {
          const prev = el.getAttribute('data-tgtk-crop-pe-prev') || '';
          if (prev) el.style.pointerEvents = prev; else el.style.removeProperty('pointer-events');
          el.removeAttribute('data-tgtk-crop-pe');
          el.removeAttribute('data-tgtk-crop-pe-prev');
        }
      } catch (e) {}
    }
  }
  const TGT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/>' +
    '<path d="M21 16l-5.5-5.5L7 19"/></svg>';

  function tgToast(msg) {
    try {
      const d = (TGT.crop && TGT.crop.doc) || HDOC;
      gxStyle(d);
      let t = d.getElementById('tgtk-ttoast');
      if (!t) {
        t = h('div', { id: 'tgtk-ttoast', class: 'tgtk-ttoast', 'data-tgtk': '1' });
        d.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add('on');
      clearTimeout(TGT.toastTimer);
      TGT.toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
    } catch (e) {}
  }

  function tgBtn(text, title, fn, icon) {
    const b = h('button', {
      type: 'button', class: 'tgtk-tbtn' + (icon ? ' tgtk-ticon' : ''),
      title, 'data-tgtk': '1',
    });
    if (icon) b.innerHTML = typeof icon === 'string' ? icon : TGT_SVG;
    else b.textContent = text;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { fn(e); } catch (err) { tgToast('操作失败：' + (err && err.message ? err.message : err)); }
    });
    return b;
  }

  const LS_LINKSWAP = 'tgtk:linkswap:v1';
  const TGT_HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20.8 8.6a5 5 0 0 0-8.8-3 5 5 0 0 0-8.8 3c0 5 8.8 10 8.8 10s8.8-5 8.8-10z"/></svg>';
  const TGT_SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3.6 8.4h13.2"/><path d="M13.9 5.3l3.1 3.1-3.1 3.1"/>' +
    '<path d="M20.4 15.6H7.2"/><path d="M10.1 12.5l-3.1 3.1 3.1 3.1"/></svg>';
  const TGT_PLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M8.2 5.6a1.1 1.1 0 0 1 1.7-.9l8.4 6.4a1.1 1.1 0 0 1 0 1.8l-8.4 6.4a1.1 1.1 0 0 1-1.7-.9z" ' +
    'fill="currentColor"/></svg>';
  const TGT_COVERLINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M10.2 13.8l3.6-3.6"/>' +
    '<path d="M9.1 10.6L7.4 12.3a3 3 0 0 0 4.3 4.3l1.7-1.7"/>' +
    '<path d="M14.9 13.4l1.7-1.7a3 3 0 0 0-4.3-4.3l-1.7 1.7"/></svg>';

  function tgSwapList() {
    try {
      const v = JSON.parse(localStorage.getItem(LS_LINKSWAP) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function tgSwapSave(list) {
    try { localStorage.setItem(LS_LINKSWAP, JSON.stringify(list)); } catch (e) {}
  }
  function tgPairKey(a, b) {
    const x = String(a || ''), y = String(b || '');
    if (!/^\d+$/.test(x) || !/^\d+$/.test(y) || x === y) return '';
    return x < y ? x + '#' + y : y + '#' + x;
  }
  function tgSwapWant(a, b) {
    const k = tgPairKey(a, b);
    if (!k) return '';
    const it = tgSwapList().find((x) => x && x.k === k);
    return it ? String(it.left || '') : '';
  }
  function tgSwapToggle(leftCid, rightCid) {
    const k = tgPairKey(leftCid, rightCid);
    if (!k) return;
    const list = tgSwapList().filter((x) => x && x.k !== k);
    list.push({ k, left: String(rightCid) }); // 把当前右边的换到左边
    tgSwapSave(list);
  }

  function tgIsPersonalLinkPage(card) {
    try {
      if (card.closest('#tg-user-tinygrail')) return true;
      if (card.closest('.link_list')) return true;
    } catch (e) {}
    return false;
  }

  function tgLinkSides(card, kind) {
    if (kind === 'new') {
      const L = card.querySelector('#tg-temple-link-left');
      const R = card.querySelector('#tg-temple-link-right');
      if (!L || !R) return null;
      return {
        L, R,
        cidL: String(L.getAttribute('data-character-id') || ''),
        cidR: String(R.getAttribute('data-character-id') || ''),
        iL: L.firstElementChild, iR: R.firstElementChild,
      };
    }
    const L = card.querySelector('.left');
    const R = card.querySelector('.right');
    if (!L || !R) return null;
    const cidOf = (el) => {
      const c = el.querySelector('.card');
      return c ? String(c.getAttribute('data-id') || '').split('_')[0] : '';
    };
    return { L, R, cidL: cidOf(L), cidR: cidOf(R) };
  }

  function tgSwapNameSpans(card, kind) {
    if (kind === 'new') {
      const nm = card.querySelector('#tg-temple-link-names');
      return nm ? nm.querySelectorAll('span') : [];
    }
    let cn = null;
    try { cn = (card.parentElement && card.parentElement.querySelector('.content')) || null; } catch (e) {}
    if (!cn) cn = card.querySelector('.content');
    return cn ? cn.querySelectorAll('span') : [];
  }

  function tgLinkCanvas(el) {
    if (!el) return null;
    try {
      const c = el.querySelector('canvas');
      if (c && c.width && c.height) return c;
    } catch (e) {}
    return null;
  }

  function tgSnapCanvas(cv) {
    if (!cv) return null;
    try {
      const doc = cv.ownerDocument || HDOC;
      const c = doc.createElement('canvas');
      c.width = cv.width;
      c.height = cv.height;
      c.getContext('2d').drawImage(cv, 0, 0);
      return c;
    } catch (e) { return null; }
  }

  function tgPaintCanvas(cv, src) {
    if (!cv || !src) return;
    try {
      if (cv.width !== src.width || cv.height !== src.height) return; // 尺寸对不上就别硬拉伸
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(src, 0, 0);
    } catch (e) {}
  }

  function tgSwapCanvasNodes(cvA, cvB) {
    try {
      if (!cvA || !cvB || cvA === cvB || !cvA.parentNode || !cvB.parentNode) return false;
      const doc = cvA.ownerDocument || HDOC;
      const mark = doc.createComment('tgtk-swap');
      cvA.parentNode.insertBefore(mark, cvA); // 先占住 A 的位置
      cvB.parentNode.insertBefore(cvA, cvB);  // A 挪到 B 处
      mark.parentNode.replaceChild(cvB, mark); // B 挪到 A 原来的位置
      return true;
    } catch (e) { return false; }
  }

  function tgSwapHalfContents(L, R) {
    try {
      if (!L || !R || L === R) return false;
      const doc = L.ownerDocument || HDOC;
      const a = Array.prototype.slice.call(L.childNodes);
      const b = Array.prototype.slice.call(R.childNodes);
      const frag = doc.createDocumentFragment();
      for (let i = 0; i < a.length; i++) frag.appendChild(a[i]);
      for (let i = 0; i < b.length; i++) L.appendChild(b[i]);
      R.appendChild(frag);
      return true;
    } catch (e) { return false; }
  }

  const TG_LINK_ATTRS = ['data-character-id', 'data-user-id', 'data-name'];
  function tgReadAttrs(el) {
    const out = {};
    if (!el) return out;
    TG_LINK_ATTRS.forEach((k) => {
      const v = el.getAttribute(k);
      if (v != null) out[k] = v;
    });
    return out;
  }
  function tgWriteAttrs(el, attrs) {
    if (!el || !attrs) return;
    TG_LINK_ATTRS.forEach((k) => {
      const v = attrs[k];
      if (v == null) return;
      if (el.getAttribute(k) !== v) el.setAttribute(k, v);
    });
  }

  function tgApplyLinkSwap(card, kind) {
    const s = tgLinkSides(card, kind);
    if (!s || !s.cidL || !s.cidR) return;

    if (kind === 'new') {
      if (!card.__tgtkLink) {
        const sp = tgSwapNameSpans(card, 'new');
        let bL = '', bR = '';
        try {
          const w = (card.ownerDocument && card.ownerDocument.defaultView) || HDOC.defaultView;
          if (s.iL) bL = w.getComputedStyle(s.iL).borderTopColor || '';
          if (s.iR) bR = w.getComputedStyle(s.iR).borderTopColor || '';
        } catch (e) {}
        const cvL = tgLinkCanvas(s.L);
        const cvR = tgLinkCanvas(s.R);
        const imL0 = s.L.querySelector('img');
        const imR0 = s.R.querySelector('img');
        card.__tgtkLink = {
          cidL: s.cidL, cidR: s.cidR,
          aL: tgReadAttrs(s.L), aR: tgReadAttrs(s.R),
          cvL, cvR,
          imgL: tgSnapCanvas(cvL), imgR: tgSnapCanvas(cvR),
          vL: s.L.firstElementChild, vR: s.R.firstElementChild,
          srcL: imL0 ? String(imL0.getAttribute('src') || '') : '',
          srcR: imR0 ? String(imR0.getAttribute('src') || '') : '',
          ssL: imL0 ? String(imL0.getAttribute('srcset') || '') : '',
          ssR: imR0 ? String(imR0.getAttribute('srcset') || '') : '',
          dsL: imL0 ? String(imL0.getAttribute('data-src') || '') : '',
          dsR: imR0 ? String(imR0.getAttribute('data-src') || '') : '',
          alL: imL0 ? String(imL0.getAttribute('alt') || '') : '',
          alR: imR0 ? String(imR0.getAttribute('alt') || '') : '',
          bgL: s.iL ? s.iL.style.backgroundImage : '',
          bgR: s.iR ? s.iR.style.backgroundImage : '',
          bL, bR,
          n1: sp && sp.length >= 2 ? sp[0].textContent : '',
          n2: sp && sp.length >= 2 ? sp[1].textContent : '',
        };
      }
      const nat = card.__tgtkLink;
      const want = tgSwapWant(nat.cidL, nat.cidR);
      const need = !!want && want !== nat.cidL;

      const cvL = tgLinkCanvas(s.L) || nat.cvL;
      const cvR = tgLinkCanvas(s.R) || nat.cvR;
      if (cvL && cvR && cvL !== cvR) {
        const known = (cvL === nat.cvL && cvR === nat.cvR) || (cvL === nat.cvR && cvR === nat.cvL);
        if (!known) { nat.cvL = cvL; nat.cvR = cvR; }
        const isSwapped = cvL === nat.cvR && cvR === nat.cvL;
        if (need !== isSwapped) tgSwapCanvasNodes(cvL, cvR);
      } else {
        const imL = s.L.querySelector('img'), imR = s.R.querySelector('img');
        if (imL && imR) {
          const srcL = String(imL.getAttribute('src') || '');
          const srcR = String(imR.getAttribute('src') || '');
          const known = (srcL === nat.srcL && srcR === nat.srcR) ||
            (srcL === nat.srcR && srcR === nat.srcL);
          if (!known) { nat.srcL = srcL; nat.srcR = srcR; }
          const wL = need ? nat.srcR : nat.srcL;
          const wR = need ? nat.srcL : nat.srcR;
          if (imL.getAttribute('src') !== wL) imL.setAttribute('src', wL);
          if (imR.getAttribute('src') !== wR) imR.setAttribute('src', wR);
          ['srcset', 'data-src', 'alt'].forEach((k) => {
            const keyL = k === 'srcset' ? 'ssL' : k === 'data-src' ? 'dsL' : 'alL';
            const keyR = k === 'srcset' ? 'ssR' : k === 'data-src' ? 'dsR' : 'alR';
            let kl = nat[keyL], kr = nat[keyR];
            const a = String(imL.getAttribute(k) || '');
            const b = String(imR.getAttribute(k) || '');
            const known = (a === kl && b === kr) || (a === kr && b === kl);
            if (!known) { kl = a; kr = b; nat[keyL] = a; nat[keyR] = b; }
            const wantL = need ? kr : kl;
            const wantR = need ? kl : kr;
            if (String(imL.getAttribute(k) || '') !== wantL) imL.setAttribute(k, wantL);
            if (String(imR.getAttribute(k) || '') !== wantR) imR.setAttribute(k, wantR);
          });
        } else {
          const bgEl = (half) => {
            const all = half.querySelectorAll('*');
            for (let i = 0; i < all.length; i++) {
              const st = all[i].style && all[i].style.backgroundImage;
              if (st && st !== 'none') return all[i];
            }
            return null;
          };
          const eL = bgEl(s.L), eR = bgEl(s.R);
          if (eL && eR) {
            const vL = eL.style.backgroundImage, vR = eR.style.backgroundImage;
            const known = (vL === nat.bgL && vR === nat.bgR) ||
              (vL === nat.bgR && vR === nat.bgL);
            if (!known) { nat.bgL = vL; nat.bgR = vR; }
            const wL = need ? nat.bgR : nat.bgL;
            const wR = need ? nat.bgL : nat.bgR;
            if (eL.style.backgroundImage !== wL) eL.style.backgroundImage = wL;
            if (eR.style.backgroundImage !== wR) eR.style.backgroundImage = wR;
          } else {
            const vL = s.L.firstElementChild, vR = s.R.firstElementChild;
            if (vL && vR && vL !== vR) {
              const known = (vL === nat.vL && vR === nat.vR) ||
                (vL === nat.vR && vR === nat.vL);
              if (!known) { nat.vL = vL; nat.vR = vR; }
              const isSwapped = vL === nat.vR && vR === nat.vL;
              if (need !== isSwapped) tgSwapHalfContents(s.L, s.R);
            } else {
              const putBg = (el, v) => {
                if (!v || !el) return;
                if (el.style.backgroundImage !== v) el.style.backgroundImage = v;
              };
              putBg(s.L, need ? nat.bgR : nat.bgL);
              putBg(s.R, need ? nat.bgL : nat.bgR);
            }
          }
        }
      }
      tgWriteAttrs(s.L, need ? nat.aR : nat.aL);
      tgWriteAttrs(s.R, need ? nat.aL : nat.aR);
      const iL = s.L.firstElementChild || s.iL;
      const iR = s.R.firstElementChild || s.iR;
      const setBd = (el, c) => {
        if (!el) return;
        if (c) {
          if (el.style.borderTopColor !== c) el.style.borderTopColor = c;
          if (el.style.borderBottomColor !== c) el.style.borderBottomColor = c;
          if (el.style.borderLeftColor !== c) el.style.borderLeftColor = c;
          if (el.style.borderRightColor !== c) el.style.borderRightColor = c;
        } else {
          ['border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color']
            .forEach((p) => el.style.removeProperty(p));
        }
      };
      setBd(iL, need ? nat.bR : '');
      setBd(iR, need ? nat.bL : '');
      const sp = tgSwapNameSpans(card, 'new');
      if (sp && sp.length >= 2 && nat.n1 && nat.n2) {
        const w1 = need ? nat.n2 : nat.n1;
        const w2 = need ? nat.n1 : nat.n2;
        if (sp[0].textContent !== w1) sp[0].textContent = w1;
        if (sp[1].textContent !== w2) sp[1].textContent = w2;
      }
      if (need) {
        if (card.getAttribute('data-tgtk-swapped') !== '1') card.setAttribute('data-tgtk-swapped', '1');
      } else if (card.hasAttribute('data-tgtk-swapped')) {
        card.removeAttribute('data-tgtk-swapped');
      }
      return;
    }

    if (!card.__tgtkLinkO) {
      const sp = tgSwapNameSpans(card, 'old');
      card.__tgtkLinkO = {
        nL: s.cidL, nR: s.cidR,
        t1: sp && sp.length >= 2 ? sp[0].textContent : '',
        t2: sp && sp.length >= 2 ? sp[1].textContent : '',
        d1: sp && sp.length >= 2 ? (sp[0].getAttribute('data-id') || '') : '',
        d2: sp && sp.length >= 2 ? (sp[1].getAttribute('data-id') || '') : '',
      };
    }
    const nat = card.__tgtkLinkO;
    if (!nat.nL || !nat.nR) return;
    const wantO = tgSwapWant(nat.nL, nat.nR);
    const needO = !!wantO && wantO !== nat.nL;
    const desired = needO ? nat.nR : nat.nL;
    if (s.cidL !== desired) {
      s.L.classList.replace('left', 'right');
      s.R.classList.replace('right', 'left');
    }
    const sp = tgSwapNameSpans(card, 'old');
    if (sp && sp.length >= 2 && nat.t1 && nat.t2) {
      const w1 = needO ? nat.t2 : nat.t1;
      const w2 = needO ? nat.t1 : nat.t2;
      if (sp[0].textContent !== w1) sp[0].textContent = w1;
      if (sp[1].textContent !== w2) sp[1].textContent = w2;
      if (nat.d1 && nat.d2) {
        const id1 = needO ? nat.d2 : nat.d1;
        const id2 = needO ? nat.d1 : nat.d2;
        if (sp[0].getAttribute('data-id') !== id1) sp[0].setAttribute('data-id', id1);
        if (sp[1].getAttribute('data-id') !== id2) sp[1].setAttribute('data-id', id2);
      }
    }
    const flag = needO ? '1' : '0';
    if (card.getAttribute('data-tgtk-swapped') !== flag) card.setAttribute('data-tgtk-swapped', flag);
  }

  function tgEnsureSwapBtn(card, kind) {
    if (!tgIsPersonalLinkPage(card)) {
      if (card.__tgtkSwapBtn) {
        try { card.__tgtkSwapBtn.remove(); } catch (e) {}
        card.__tgtkSwapBtn = null;
      }
      return;
    }
    let btn = card.__tgtkSwapBtn;
    if (btn && btn.isConnected) return;
    const s = tgLinkSides(card, kind);
    if (!s || !s.cidL || !s.cidR) return;
    const host = kind === 'new' ? card.parentElement : (card.closest('.link.item') || card.parentElement);
    if (!host) return;
    try {
      const w = (host.ownerDocument && host.ownerDocument.defaultView) || HDOC.defaultView;
      if (w.getComputedStyle(host).position === 'static') host.style.position = 'relative';
    } catch (e) { host.style.position = 'relative'; }
    host.classList.add('tgtk-linkwrap');
    btn = tgBtn('', '交换这两座 LINK 圣殿的左右顺序（本地记忆，角色页同步生效）', () => {
      const cur = tgLinkSides(card, kind);
      if (!cur || !cur.cidL || !cur.cidR) return;
      tgSwapToggle(cur.cidL, cur.cidR); // 记录「把现在的右边换到左边」
      tgLinkPass();
      tgToast('已交换 LINK 顺序（角色页同步生效）');
    }, TGT_SWAP);
    btn.classList.add('tgtk-swapbtn');
    host.appendChild(btn);
    card.__tgtkSwapBtn = btn;
  }

  let tgLinkBusy = false;
  let tgLinkRaf = 0;
  function tgLinkPassSoon() {
    if (tgLinkBusy) return;
    tgLinkBusy = true;
    try { tgLinkPass(); } catch (e) {}
    tgLinkBusy = false;
    if (tgLinkRaf) return;
    const raf = HWIN && HWIN.requestAnimationFrame;
    if (!raf) return;
    try {
      tgLinkRaf = raf(() => {
        tgLinkRaf = 0;
        if (tgLinkBusy) return;
        tgLinkBusy = true;
        try { tgLinkPass(); } catch (e) {}
        tgLinkBusy = false;
      });
    } catch (e) {}
  }

  function tgLinkPass() {
    for (const d of allDocs()) {
      let news = [], olds = [];
      try { news = d.querySelectorAll('#tg-temple-link'); } catch (e) {}
      try { olds = d.querySelectorAll('.chara_link'); } catch (e) {}
      for (let i = 0; i < news.length; i++) {
        tgApplyLinkSwap(news[i], 'new');
        tgEnsureSwapBtn(news[i], 'new');
      }
      for (let i = 0; i < olds.length; i++) {
        tgApplyLinkSwap(olds[i], 'old');
        tgEnsureSwapBtn(olds[i], 'old');
      }
    }
  }

  async function tgLinkInfo(cid) {
    const key = String(cid || '');
    if (!/^\d+$/.test(key)) return null;
    const hit = TGT.linkInfo[key];
    if (hit && Date.now() - hit.at < 60000) return hit.info;
    let info = null;
    try {
      const v = await api('chara/links/' + key);
      const items = Array.isArray(v) ? v
        : ((v && (v.Items || v.items || v.Value)) || []);
      const meId = String((TGT.me && TGT.me.id) || '');
      if (!meId) return null; // 还没拿到自己的 uid：本轮先不判定，也别写缓存，下轮再试
      const linked = items.filter((x) => x && x.Link);
      const mine = linked.filter((x) => String(x.UserId || '') === meId &&
        (!x.CharacterId || String(x.CharacterId) === key));
      const it = mine[0] || null;
      if (it) {
        const lk = it.Link || {};
        const lcid = String(it.LinkId || lk.CharacterId || '');
        if (/^\d+$/.test(lcid) && lcid !== key) {
          info = {
            linkCid: lcid,
            linkUid: String(lk.UserId || ''),
            linkName: String(lk.CharacterName || lk.Name || ''),
            linkCover: String(lk.Cover || ''),
          };
          if (!info.linkUid) {
            try {
              const list = await api('chara/temple/' + lcid);
              const arr = Array.isArray(list) ? list : ((list && list.Items) || []);
              const t = arr.filter((x) => String(x.LinkId || '') === key)[0];
              if (t && t.UserId) info.linkUid = String(t.UserId);
            } catch (e) {}
          }
          if (!info.linkUid && info.linkName) {
            try {
              const uid = await tgResolveUid(lcid, info.linkName);
              if (uid) info.linkUid = uid;
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
    TGT.linkInfo[key] = { at: Date.now(), info };
    return info;
  }

  function tgCoverUrl(root) {
    if (!root) return '';
    const re = /cover\/[A-Za-z0-9_-]+\.(?:jpe?g|png|gif|webp)/i;
    const abs = (v) => {
      const s = String(v || '').trim();
      if (!s) return '';
      if (/^data:/i.test(s)) return ''; // 我们上传后的本地预览，不算
      if (/^\/\//.test(s)) return 'https:' + s;
      if (/^https?:\/\//i.test(s)) return s;
      if (/^cover\//.test(s)) return TGT_OSS + s;
      return '';
    };
    try {
      for (const im of root.querySelectorAll('img')) {
        const raw = abs(im.getAttribute('src')) || abs(im.currentSrc);
        if (raw && re.test(raw)) return raw;
      }
      for (const im of root.querySelectorAll('img[data-src]')) {
        const raw = abs(im.getAttribute('data-src'));
        if (raw && re.test(raw)) return raw;
      }
      for (const el of root.querySelectorAll('[style*="background"]')) {
        const m = String(el.style.backgroundImage || '').match(re);
        if (m) return TGT_OSS + m[0];
      }
      const m = String((root.style && root.style.backgroundImage) || '').match(re);
      if (m) return TGT_OSS + m[0];
    } catch (e) {}
    return '';
  }

  function tgWire(doc) {
    if (!doc || doc.__tgtkTgt) return;
    doc.__tgtkTgt = true;
    try {
      doc.addEventListener('click', (e) => {
        const el = e.target;
        if (!el || !el.closest) return;
        const lk = el.closest('#tg-temple-link');
        if (lk && lk.getAttribute('data-tgtk-swapped') === '1' && !e.__tgtkSwapDisp) {
          const half = el.closest('#tg-temple-link-left,#tg-temple-link-right');
          if (half) {
            const other = lk.querySelector(half.id === 'tg-temple-link-left'
              ? '#tg-temple-link-right' : '#tg-temple-link-left');
            e.preventDefault();
            e.stopPropagation();
            if (other) {
              try {
                TGT.last = {
                  cid: String(other.getAttribute('data-character-id') || ''),
                  uid: '', userName: String(other.getAttribute('data-user-name') || ''),
                  cover: tgCoverUrl(other), link: true,
                };
              } catch (err) {}
              try {
                const w = (el.ownerDocument && el.ownerDocument.defaultView) || window;
                const ev = new w.MouseEvent('click', {
                  bubbles: true, cancelable: true, view: w,
                  clientX: e.clientX, clientY: e.clientY,
                });
                ev.__tgtkSwapDisp = 1;
                other.dispatchEvent(ev);
              } catch (err) {}
            }
            return;
          }
        }
        const card = el.closest('[data-id],[data-character-id],[data-temple-character-id],#tg-temple-image,.card,.item');
        if (!card) return;
        const raw = String(card.getAttribute('data-id') || '');
        const isCard = /^\d+#\d+$/.test(raw) || /^\d+_\d+$/.test(raw) ||
          card.hasAttribute('data-user-name') ||
          /cover\//.test(String((card.style && card.style.backgroundImage) || '')) ||
          !!(card.querySelector && card.querySelector('[data-id],[data-user-name],[style*="cover"]'));
        if (!isCard) return;
        if (card.id === 'tg-temple-detail' ||
            (card.closest && card.closest('#tg-temple-detail,#TB_window.temple,#tgtk-crop,#tgtk-panel'))) return;
        const info = { cid: '', uid: '', userName: '', cover: '' };
        let m = raw.match(/^(\d+)#(\d+)$/);
        if (m) { info.uid = m[1]; info.cid = m[2]; }
        else {
          m = raw.match(/^(\d+)_(\d+)$/);   // LINK 卡片：cid_uid
          if (m) { info.cid = m[1]; info.uid = m[2]; }
        }
        let up = card;
        for (let i = 0; i < 4 && up; i++, up = up.parentElement) {
          if (!up.getAttribute) continue;
          if (!info.userName) info.userName = up.getAttribute('data-user-name') || '';
          if (!info.cover) info.cover = tgCoverUrl(up);
          if (!info.cid) {
            const v = up.getAttribute('data-character-id') || up.getAttribute('data-temple-character-id');
            if (/^\d+$/.test(v || '')) info.cid = v;
          }
          if (info.cid && info.userName && info.cover) break;
        }
        if (!info.cid || !info.uid) {
          try {
            const w = (card.ownerDocument && card.ownerDocument.defaultView) || doc.defaultView;
            const jq = w && (w.jQuery || w.$);
            const tpl = jq && jq(card).data && jq(card).data('temple');
            if (tpl) {
              if (!info.cid && tpl.CharacterId) info.cid = String(tpl.CharacterId);
              if (!info.uid && tpl.UserId) info.uid = String(tpl.UserId);
              if (!info.userName && tpl.Name) info.userName = String(tpl.Name);
            }
          } catch (err) {}
        }
        if (info.cid || info.cover) {
          info.link = !!(card.closest && card.closest('.chara_link,#tg-temple-link'));
          TGT.last = info;
        }
      }, true);
    } catch (e) {}
  }

  function tgCidByCover(cover) {
    const key = String(cover || '').match(/cover\/[A-Za-z0-9_-]+\.(?:jpe?g|png|gif|webp)/i);
    if (!key) return '';
    for (const d of allDocs()) {
      let els = [];
      try { els = d.querySelectorAll('[data-id],[data-character-id],[style*="cover"],img[src*="cover"]'); }
      catch (e) { continue; }
      for (const el of els) {
        const st = String((el.style && el.style.backgroundImage) || '') + ' ' +
          String(el.getAttribute('style') || '') + ' ' + String(el.getAttribute('src') || '');
        if (!st.includes(key[0])) continue;
        for (let up = el, i = 0; i < 4 && up; i++, up = up.parentElement) {
          if (!up.getAttribute) break;
          const v = String(up.getAttribute('data-id') || '');
          let m = v.match(/^(\d+)#(\d+)$/);
          if (m) return m[2];
          m = v.match(/^(\d+)_(\d+)$/);
          if (m) return m[1];
          const c = up.getAttribute('data-character-id');
          if (/^\d+$/.test(c || '')) return c;
        }
      }
    }
    return '';
  }

  function tgTarget(doc) {
    const tb = doc.querySelector && doc.querySelector('#TB_window.temple');
    if (tb) {
      const host = tb.querySelector('.action');
      const cv = tgCoverUrl(tb) || (TGT.last && TGT.last.cover) || '';
      let cid = /^\d+$/.test((TGT.last && TGT.last.cid) || '') ? TGT.last.cid : '';
      if (!cid) {
        cid = tgCidByCover(cv);
        if (cid && TGT.last) TGT.last.cid = cid;
      }
      if (!cid) cid = String(currentCharacterId() || '');
      if (!host || !/^\d+$/.test(cid)) return null;
      return {
        doc, kind: 'old', root: tb, host, cid,
        uid: (TGT.last && TGT.last.uid) || '',
        userName: (TGT.last && TGT.last.userName) || '',
        cover: cv,
        link: !!(TGT.last && TGT.last.link && String(TGT.last.cid || '') === String(cid)),
      };
    }
    const det = doc.querySelector && doc.querySelector('#tg-temple-detail');
    if (det) {
      let cid = String(det.getAttribute('data-character-id') ||
        (TGT.last && TGT.last.cid) || '');
      if (!/^\d+$/.test(cid)) cid = tgCidByCover(tgCoverUrl(det) || (TGT.last && TGT.last.cover) || '');
      if (!/^\d+$/.test(cid)) return null;
      const row = det.querySelector('#tg-temple-info-progress > div');
      let uName = String(det.getAttribute('data-user-name') || '');
      let uId = String(det.getAttribute('data-user-id') || '');
      if (!uName || !uId) {
        try {
          const ue = det.querySelector('[data-user-name],[data-user-id]');
          if (ue) {
            if (!uName) uName = String(ue.getAttribute('data-user-name') || '');
            if (!uId) uId = String(ue.getAttribute('data-user-id') || '');
          }
        } catch (e) {}
      }
      return {
        doc, kind: 'new', root: det, host: row || det, cid,
        uid: uId || (TGT.last && TGT.last.uid) || '',
        userName: uName || (TGT.last && TGT.last.userName) || '',
        cover: tgCoverUrl(det) || (TGT.last && TGT.last.cover) || '',
        link: !!(TGT.last && TGT.last.link && String(TGT.last.cid || '') === String(cid)),
      };
    }
    return null;
  }

  async function tgResolveUid(cid, name) {
    if (!name) return '';
    const key = cid + '|' + name;
    if (Object.prototype.hasOwnProperty.call(TGT.uidCache, key)) return TGT.uidCache[key];
    try {
      const v = await api('chara/temple/' + cid);
      const list = Array.isArray(v) ? v : (v && v.Items) || [];
      const t = list.find((x) => String(x.Name || x.Username || '').toLowerCase() === String(name).toLowerCase());
      const uid = t && t.UserId ? String(t.UserId) : '';
      TGT.uidCache[key] = uid;
      return uid;
    } catch (e) { return ''; }
  }

  function tgCurrent() {
    for (const d of allDocs()) {
      const t = tgTarget(d);
      if (t) return t;
    }
    return null;
  }

  function tgEnsureMe() {
    if (TGT.meAsked || Date.now() < (TGT.meRetryAt || 0)) return;
    TGT.meAsked = true;
    api('chara/user/assets/0/true').then((v) => {
      TGT.me = {
        id: String((v && (v.Id || v.id)) || ''),
        name: String((v && (v.Name || v.name)) || ''),
      };
    }).catch(() => {
      TGT.meAsked = false;
      TGT.meRetryAt = Date.now() + 30000; // 未登录 / 接口异常时别每 1.2 秒重试
    });
  }
  function tgCachedMe() {
    for (const w of WINS) {
      try {
        const raw = w.localStorage && w.localStorage.getItem('tinygrail:user-assets');
        if (!raw) continue;
        const v = JSON.parse(raw);
        return {
          id: String((v && (v.Id || v.id)) || ''),
          name: String((v && (v.Name || v.name)) || ''),
        };
      } catch (e) {}
    }
    return { id: '', name: '' };
  }

  function tgPopupAge(t) {
    const sig = t.kind + '|' + t.cid + '|' + t.cover;
    if (TGT.popSig !== sig) { TGT.popSig = sig; TGT.popAt = Date.now(); }
    return Date.now() - TGT.popAt;
  }

  function tgOwnerState(t) {
    const cidKey = String(t.cid || '');
    const whoKey = String(t.uid || '') || String(t.userName || '').toLowerCase();
    const memKey = cidKey + '|' + whoKey;
    const put = (v) => {
      if (v !== 'pending') {
        try { t.root.__tgtkOwner = { key: memKey, state: v }; } catch (e) {}
        if (cidKey && whoKey) TGT.owner[memKey] = v;
      }
      return v;
    };
    try {
      if (t.kind === 'new' && t.root && t.root.querySelector) {
        const acts = t.root.querySelector('#tg-temple-actions');
        if (acts && acts.querySelector('button')) {
          t.root.__tgtkOwner = { key: memKey, state: 'own' };
          return 'own';
        }
      }
    } catch (e) {}
    const g = whoKey && TGT.owner[memKey];
    if (g) return g;
    const memo = t.root && t.root.__tgtkOwner;
    if (memo && memo.key === memKey) return memo.state;
    const me = TGT.me || tgCachedMe();
    let ownerName = '';
    try {
      const a = t.root.querySelector && t.root.querySelector('.detail .name a[href*="/user/"]');
      if (a) ownerName = decodeURIComponent(String(a.getAttribute('href') || '').split('/user/')[1].split(/[?#]/)[0] || '');
    } catch (e) {}
    const name = ownerName || t.userName || (TGT.last && TGT.last.userName) || '';
    const domOther = !!(ownerName && me.name && ownerName.toLowerCase() !== me.name.toLowerCase());
    const cachedOwn = (me.id && t.uid && String(t.uid) === me.id) ||
      (me.name && name && me.name.toLowerCase() === name.toLowerCase());
    try {
      if (t.kind === 'new') {
        if (domOther) return put('other');
        if (cachedOwn) return put('own');
        const age = t.root.__tgtkBornAt ? Date.now() - t.root.__tgtkBornAt : tgPopupAge(t);
        if (age < 600) return 'pending';
        return put('other');
      }
      const ids = ['changeCoverButton', 'resetCoverButton', 'linkButton', 'editLineButton',
        'refineButton', 'chargeButton', 'attackButton', 'fishButton', 'starButton'];
      let hasNative = false;
      for (const id of ids) {
        const el = t.root.querySelector && t.root.querySelector('#' + id);
        if (!el) continue;
        hasNative = true;
        if (el.style && el.style.display === 'none') continue;
        try {
          const g = t.doc.defaultView && t.doc.defaultView.getComputedStyle;
          if (g && g(el).display === 'none') continue;
        } catch (e) {}
        return put('own');
      }
      const age = t.root.__tgtkBornAt ? Date.now() - t.root.__tgtkBornAt : tgPopupAge(t);
      if (hasNative && age < 900) return (!domOther && cachedOwn) ? put('own') : 'pending';
      return (!domOther && cachedOwn) ? put('own') : put('other');
    } catch (e) { return (!domOther && cachedOwn) ? put('own') : put('other'); }
  }

  function tgOldSlot(host) {
    if (!host || !host.children) return null;
    const kids = Array.prototype.slice.call(host.children);
    for (const el of kids) {
      if (el.id === 'tgtk-ttoolbar' || el.id === 'tgtk-tlinkbar') continue;
      if (/闪光结晶/.test(String(el.textContent || ''))) return el;
    }
    for (const el of kids) {
      if (el.id === 'tgtk-ttoolbar' || el.id === 'tgtk-tlinkbar') continue;
      if (/^\s*\[?塔图\]?\s*$/.test(String(el.textContent || '')) || /星之力/.test(String(el.textContent || ''))) return el;
    }
    return null;
  }

  function tgTempleTools() {
    tgHidePopups(); // 裁剪开着时，站点弹窗重绘后也要继续压住
    tgLinkPass();   // LINK 卡：应用换序偏好 + 个人页补换序按钮（白缝已由 CSS 处理）
    let found = null;
    for (const d of allDocs()) {
      tgWire(d);
      const t = tgTarget(d);
      if (t) { found = t; break; }
    }
    for (const d of allDocs()) {
      const stale = d.getElementById('tgtk-ttoolbar');
      if (stale && (!found || found.doc !== d || stale.parentElement !== found.host)) stale.remove();
      const staleL = d.getElementById('tgtk-tlinkbar');
      if (staleL && (!found || found.doc !== d || staleL.parentElement !== found.host)) staleL.remove();
      const staleB = d.getElementById('tgtk-tbrk');
      if (staleB && (!found || found.doc !== d || staleB.parentElement !== found.host)) staleB.remove();
    }
    if (!found) return;
    tgEnsureMe();
    gxStyle(found.doc);
    const { doc, host, root, kind } = found;
    const state = tgOwnerState(found);
    const mode = state === 'own' ? 'own' : (found.link ? 'pending' : state);
    let bar = doc.getElementById('tgtk-ttoolbar');
    if (!bar) bar = h('span', { id: 'tgtk-ttoolbar', class: 'tgtk-ttoolbar', 'data-tgtk': '1' });
    bar.classList.toggle('tgtk-oldmini', kind === 'old');
    if (bar.dataset.tgtkMode !== mode) {
      bar.textContent = '';
      bar.dataset.tgtkMode = mode;
      if (mode === 'own') {
        bar.appendChild(tgBtn('', '复制当前塔图地址（.gif 会连动图一起带过去，可粘到别的塔的「图片地址」）', () => {
          const t = tgCurrent() || found;
          tgCopyCoverUrl(t);
        }, TGT_COVERLINK));
        if (kind === 'new') {
          bar.appendChild(tgBtn('', '视频裁剪：把视频转成 GIF 动图（外部工具，新标签打开）', () => {
            const w = (doc.defaultView || window);
            try { w.open('https://fuyuake.top/xsb/link/crop', '_blank', 'noopener'); }
            catch (e) { try { w.location.href = 'https://fuyuake.top/xsb/link/crop'; } catch (err) {} }
          }, TGT_PLAY));
        }
        bar.appendChild(tgBtn('', '自由裁剪后更换塔图（固定 3:4 竖图）', () => {
          const t = tgCurrent() || found;
          tgCropOpen({ doc: t.doc, kind: t.kind, cid: t.cid, uid: '', label: '我的圣殿' });
        }, true));
      } else if (mode === 'other') {
        bar.appendChild(tgBtn('复制', '把当前塔图复制到我的圣殿', () => {
          const t = tgCurrent();
          if (t) tgCopy(t);
        }));
        bar.appendChild(tgBtn('修改', '修改当前这座塔的塔图（可裁剪或填图片地址）', () => {
          const t = tgCurrent();
          if (t) tgModify(t);
        }));
        bar.appendChild(tgBtn('', '复制当前塔图地址（.gif 会连动图一起带过去，可粘到别的塔的「图片地址」）', () => {
          const t = tgCurrent();
          if (t) tgCopyCoverUrl(t);
        }, TGT_COVERLINK));
      }
    }
    bar.style.display = mode === 'pending' ? 'none' : '';
    let brk = doc.getElementById('tgtk-tbrk');
    if (kind === 'old' && mode === 'own') {
      const slot = tgOldSlot(host);
      if (slot && slot.parentElement === host) {
        if (!brk) brk = h('span', { id: 'tgtk-tbrk', class: 'tgtk-brk', 'data-tgtk': '1' });
        if (brk.nextElementSibling !== bar || bar.nextElementSibling !== slot) {
          host.insertBefore(brk, slot);
          host.insertBefore(bar, slot);
        }
      } else {
        host.appendChild(bar);
      }
      bar.style.marginLeft = '';
      bar.classList.remove('tgtk-tfloat');
    } else if (kind === 'old') {
      host.appendChild(bar);
      bar.style.marginLeft = '';
      bar.classList.remove('tgtk-tfloat');
    } else if (bar.parentElement !== host) {
      host.appendChild(bar);
    }
    if (kind === 'new') {
      if (host !== root) {
        host.style.display = 'flex';
        host.style.alignItems = 'center';
        host.style.gap = '6px';
        bar.style.marginLeft = 'auto';
        bar.classList.remove('tgtk-tfloat');
      } else {
        root.style.position = 'relative';
        bar.classList.add('tgtk-tfloat');
        bar.style.marginLeft = '';
      }
    }

    const cidKey = String(found.cid || '');
    const linkHit = TGT.linkInfo[cidKey] || {};
    const linkInfo = state === 'own' ? (linkHit.info || null) : null;
    if (state === 'own' && linkHit.info === undefined && !TGT.linkAsked[cidKey]) {
      TGT.linkAsked[cidKey] = 1;
      tgLinkInfo(cidKey).then(() => {
        TGT.linkAsked[cidKey] = 0;
        try { tgTempleTools(); } catch (e) {}
      });
    }
    if (state !== 'own') {
      for (const d of allDocs()) {
        const lb = d.getElementById('tgtk-tlinkbar');
        if (lb) lb.remove();
        const hb = d.querySelector('.tgtk-heartbtn');
        if (hb) hb.remove();
      }
    } else if (linkInfo) {
      const openLinkCrop = () => {
        const t = tgCurrent() || found;
        const me = (TGT.me && TGT.me.id) || '';
        const partnerMine = !!(me && linkInfo.linkUid && String(linkInfo.linkUid) === String(me));
        tgCropOpen({ doc: t.doc, kind: t.kind, cid: t.cid, uid: '', label: '我的圣殿' },
          { link: linkInfo, partnerMine });
      };
      const sig = linkInfo.linkCid + '|' + linkInfo.linkUid;
      if (kind === 'new') {
        let hb = bar.querySelector('.tgtk-heartbtn');
        if (hb && hb.dataset.tgtkSig !== sig) { hb.remove(); hb = null; }
        if (!hb) {
          hb = tgBtn('', '自由裁剪 LINK 塔图（可同时更换 LINK 圣殿的塔图）', openLinkCrop, TGT_HEART);
          hb.classList.add('tgtk-heartbtn');
          hb.dataset.tgtkSig = sig;
          bar.insertBefore(hb, bar.firstChild); // 新版：放在自由裁剪塔图左边
        }
      } else {
        let lb = doc.getElementById('tgtk-tlinkbar');
        let hb = lb && lb.querySelector('.tgtk-heartbtn');
        if (hb && hb.dataset.tgtkSig !== sig) { lb.remove(); lb = null; hb = null; }
        if (!lb) {
          lb = h('span', { id: 'tgtk-tlinkbar', class: 'tgtk-ttoolbar tgtk-oldmini', 'data-tgtk': '1' });
          hb = tgBtn('', '自由裁剪 LINK 塔图（可同时更换 LINK 圣殿的塔图）', openLinkCrop, TGT_HEART);
          hb.classList.add('tgtk-heartbtn');
          hb.dataset.tgtkSig = sig;
          lb.appendChild(hb);
        }
        if (lb.parentElement !== host) host.appendChild(lb); // 旧版：行尾，与行首的裁剪键对称
      }
    }
  }

  function tgNormCover(u) {
    let s = String(u || '').trim();
    if (!s) return '';
    if (/^cover\//.test(s)) s = TGT_OSS + s;
    else if (/^\/\//.test(s)) s = 'https:' + s;
    return s;
  }

  function tgCanonCover(u) {
    const m = String(u || '').match(/cover\/[A-Za-z0-9_-]+\.(?:jpe?g|png|gif|webp)/i);
    return m ? TGT_OSS + m[0] : '';
  }

  function tgCdnCover(u) {
    const m = String(u || '').match(/cover\/[A-Za-z0-9_-]+\.(?:jpe?g|png|gif|webp)/i);
    return m ? TGT_CDN + m[0] : '';
  }

  async function tgTempleCover(t) {
    const cid = String((t && t.cid) || '');
    if (!/^\d+$/.test(cid)) return '';
    try {
      const v = await api('chara/temple/' + cid);
      const arr = Array.isArray(v) ? v : ((v && v.Items) || []);
      if (!arr.length) return '';
      const uid = String((t && t.uid) || (TGT.last && TGT.last.uid) || '');
      const name = String((t && t.userName) || (TGT.last && TGT.last.userName) || '').toLowerCase();
      let hit = null;
      if (uid) hit = arr.filter((x) => String(x.UserId || '') === uid)[0] || null;
      if (!hit && name) {
        hit = arr.filter((x) => String(x.Name || x.Nickname || '').toLowerCase() === name)[0] || null;
      }
      if (!hit && arr.length === 1) hit = arr[0];
      return hit ? String(hit.Cover || '') : '';
    } catch (e) { return ''; }
  }

  async function tgPostCover(cid, uid, cover) {
    const path = uid ? `chara/temple/cover/${cid}/${uid}` : `chara/temple/cover/${cid}`;
    await api(path, { method: 'POST', body: JSON.stringify(cover) });
  }

  async function tgCopyText(text) {
    const s = String(text || '');
    if (!s) return false;
    const w = HDOC.defaultView || window;
    try {
      if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
        await w.navigator.clipboard.writeText(s);
        return true;
      }
    } catch (e) {}
    try {
      const ta = HDOC.createElement('textarea');
      ta.value = s;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
      (HDOC.body || HDOC.documentElement).appendChild(ta);
      ta.select();
      try { ta.setSelectionRange(0, s.length); } catch (e) {}
      const ok = HDOC.execCommand('copy');
      ta.remove();
      return !!ok;
    } catch (e) { return false; }
  }

  async function tgCopyCoverUrl(t) {
    let cover = tgNormCover(t.cover || (TGT.last && TGT.last.cover) || '');
    if (!cover) {
      tgToast('正在读取塔图地址…');
      cover = tgNormCover(await tgTempleCover(t));
    }
    if (!cover) return tgToast('没读到塔图地址，请重新点开这座塔');
    cover = tgCdnCover(cover) || cover;
    const ok = await tgCopyText(cover);
    const tail = String(cover).split('/').pop() || cover;
    tgToast(ok
      ? `塔图地址已复制（${tail}）· 换塔时粘进「图片地址」就行`
      : `复制失败，请手动复制：${cover}`);
  }

  async function tgCopy(t) {
    if (!(HDOC.defaultView && HDOC.defaultView.confirm('把当前塔图复制到我的圣殿？'))) return;
    let cover = tgNormCover(t.cover || (TGT.last && TGT.last.cover) || '');
    if (!cover) {
      tgToast('正在读取塔图地址…');
      cover = tgNormCover(await tgTempleCover(t));
    }
    if (!cover) return tgToast('没读到塔图地址，请重新点开这座塔');
    cover = tgCanonCover(cover) || cover;
    try {
      await tgPostCover(t.cid, '', cover);
      tgToast('已复制到我的圣殿，刷新后生效');
    } catch (e) { tgToast('复制失败：' + (e && e.message ? e.message : e)); }
  }

  async function tgModify(t) {
    let uid = t.uid;
    if (!uid && t.userName) uid = await tgResolveUid(t.cid, t.userName);
    tgCropOpen({
      doc: t.doc, kind: t.kind, cid: t.cid, uid,
      label: uid ? '这座塔（指定塔主）' : '我的圣殿',
    });
    if (!uid) tgToast('未识别塔主，将按「我的圣殿」提交');
  }

  function tgHash() {
    try {
      const c = (HDOC.defaultView && HDOC.defaultView.crypto) || window.crypto;
      const a = new Uint8Array(16);
      c.getRandomValues(a);
      return Array.from(a, (x) => ('0' + x.toString(16)).slice(-2)).join('');
    } catch (e) {
      return Date.now().toString(16) + Math.floor(Math.random() * 1e9).toString(16);
    }
  }

  function tgBlob(dataUrl) {
    const p = String(dataUrl).split(',');
    const mime = (p[0].match(/:(.*?);/) || [null, 'image/jpeg'])[1];
    const bin = atob(p[1]);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  function tgOutMime(m) {
    const v = String(m || '').toLowerCase();
    if (v === 'image/png' || v === 'image/apng' || v === 'image/gif' ||
        v === 'image/bmp' || v === 'image/avif' || v === 'image/svg+xml') return 'image/png';
    if (v === 'image/webp') return 'image/webp';
    return 'image/jpeg';
  }

  function tgDataUrlFile(dataUrl, mime, name) {
    const p = String(dataUrl).split(',');
    const bin = atob(p[1] || '');
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], name || 'tower.gif', { type: mime || 'image/gif' });
  }

  function tgHookFilePicker(win, file, state) {
    const P = win && win.HTMLInputElement && win.HTMLInputElement.prototype;
    if (!P || P.__tgtkPick) return false;
    const origClick = P.click;
    const origShow = P.showPicker;
    const put = (input) => {
      try {
        const DT = win.DataTransfer;
        if (!DT) return false;
        const dt = new DT();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new win.Event('input', { bubbles: true }));
        input.dispatchEvent(new win.Event('change', { bubbles: true }));
        state.done = true;
        return true;
      } catch (e) { return false; }
    };
    const restore = () => {
      try {
        P.click = origClick;
        if (origShow) P.showPicker = origShow;
        delete P.__tgtkPick;
      } catch (e) {}
    };
    P.click = function () {
      if (this && String(this.type || '').toLowerCase() === 'file' && put(this)) {
        win.setTimeout(restore, 0);
        return;
      }
      return origClick.apply(this, arguments);
    };
    if (origShow) {
      P.showPicker = function () {
        if (this && String(this.type || '').toLowerCase() === 'file' && put(this)) {
          win.setTimeout(restore, 0);
          return;
        }
        return origShow.apply(this, arguments);
      };
    }
    P.__tgtkPick = 1;
    state.restore = restore;
    return true;
  }

  function tgSiteGifUpload(target, out) {
    const docs = [];
    const td = (target && target.doc) || null;
    if (td) docs.push(td);
    for (const d of allDocs()) if (!docs.includes(d)) docs.push(d);
    let input = null, btn = null;
    const ours = (el) => !!(el && el.closest &&
      el.closest('#tgtk-panel,#tgtk-crop,#tgtk-fab,#tgtk-ttoolbar,#tgtk-tlinkbar,[id^="tgtk-"]'));
    for (const doc of docs) {
      let det = null;
      try { det = doc.querySelector('#tg-temple-detail') || doc.querySelector('#TB_window.temple'); } catch (e) {}
      const scopes = det ? [det, doc] : [doc];
      for (const s of scopes) {
        if (!input) {
          const list = s.querySelectorAll('input[type="file"]');
          for (let i = 0; i < list.length; i++) {
            const el = list[i];
            if (ours(el)) continue;
            input = el;
            break;
          }
        }
        if (!btn) {
          const list = s.querySelectorAll('button');
          for (let i = 0; i < list.length; i++) {
            const el = list[i];
            if (ours(el)) continue;
            const txt = String(el.textContent || '').replace(/\s+/g, '');
            if (!/修改|更换|上传|选择图片/.test(txt)) continue;
            if (det && !det.contains(el) && !el.closest('#tg-temple-actions,.action')) continue;
            btn = el;
            break;
          }
        }
      }
      if (input || btn) break;
    }
    if (!input && !btn) return false; // 找不到站点入口：留给工具箱兜底，浮层先别关
    tgCropClose();
    const file = out.file || tgDataUrlFile(out.dataUrl, out.mime, 'tower.gif');
    if (input) {
      try {
        const w = input.ownerDocument.defaultView || window;
        const DT = w.DataTransfer;
        if (DT) {
          const dt = new DT();
          dt.items.add(file);
          input.files = dt.files;
          input.dispatchEvent(new w.Event('input', { bubbles: true }));
          input.dispatchEvent(new w.Event('change', { bubbles: true }));
          tgToast('已交给小圣杯上传 GIF（会保留动画）');
          return true;
        }
      } catch (e) {}
    }
    if (btn) {
      const w = btn.ownerDocument.defaultView || window;
      const state = { done: false, restore: null };
      try { tgHookFilePicker(w, file, state); } catch (e) {}
      try {
        btn.click(); // 用户手势内触发；站点弹出的文件框会被上面的钩子接住
      } catch (e) {}
      w.setTimeout(() => {
        if (state.restore) state.restore();
        if (!state.done) tgToast('请在小圣杯弹出的选图框里再选一次这张 GIF（站点上传才会保留动画）');
      }, 2500);
      return true;
    }
    return false;
  }

  async function tgUpload(cid, uid, dataUrl, mime) {
    const hash = tgHash();
    const type = encodeURIComponent(mime || 'image/jpeg');
    const sig = await api(`chara/oss/sign/cover/${hash}/${type}`, {
      method: 'POST', body: '{}',
    });
    if (!sig || !sig.Key) throw new Error('获取上传签名失败');
    const ossUrl = TGT_OSS + 'cover/' + hash + '.jpg';
    const res = await fetch(ossUrl, {
      method: 'PUT',
      body: tgBlob(dataUrl),
      headers: { Authorization: `OSS ${sig.Key}:${sig.Sign}`, 'x-oss-date': sig.Date },
    });
    if (!res.ok) throw new Error('图片上传失败（HTTP ' + res.status + '）');
    const path = uid ? `chara/temple/cover/${cid}/${uid}` : `chara/temple/cover/${cid}`;
    await api(path, { method: 'POST', body: JSON.stringify(ossUrl) });
    return ossUrl;
  }

  function tgH(doc, tag, attrs, ...kids) {
    const d = doc || HDOC;
    const el = d.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.appendChild(typeof kid === 'string' || typeof kid === 'number' ? d.createTextNode(String(kid)) : kid);
    }
    return el;
  }

  function tgCropClose() {
    for (const d of allDocs()) {
      const p = d.getElementById && d.getElementById('tgtk-crop');
      if (!p) continue;
      try { if (p.open && p.close) p.close(); } catch (e) {}
      p.remove();
    }
    TGT.crop = null;
    if (TGT.paste) {
      try { TGT.paste.doc.removeEventListener('paste', TGT.paste.fn, true); } catch (e) {}
      TGT.paste = null;
    }
    tgShowPopups(); // 恢复站点弹窗
  }

  function tgCropOpen(target, opts) {
    tgCropClose();
    const link = (opts && opts.link) || null; // 有值 = LINK 图裁剪模式（本塔 + LINK 塔）
    const partnerMine = !!(opts && opts.partnerMine) && !!link;
    const cropDoc = HDOC;
    gxStyle(cropDoc);
    const mkSt = () => ({
      img: null, fit: null, box: null, drag: null,
      outMime: 'image/jpeg', rawDataUrl: '', rawMime: '', rawFile: null,
      animated: false, rawUrl: '',
      srcUrl: '', srcRaw: '',
      touched: false,
      urlOnly: false,
    });
    const SIDES = { self: mkSt(), link: mkSt() };
    const st = SIDES.self;
    const RATIO = link ? 432 / 320 : 0.75; // 宽 / 高
    let curHalf = 'left';            // 本塔用左半还是右半

    const normCover = (u) => {
      const raw = String(u || '');
      const m = raw.match(/cover\/[A-Za-z0-9_-]+\.(?:jpe?g|png|gif|webp)/i);
      if (m) return TGT_OSS + m[0];
      return raw.replace(/^\/\//, 'https://');
    };

    const tabL = tgH(cropDoc, 'button', { type: 'button', class: 'tgtk-crop-tab on', 'data-tgtk': '1' }, '本塔用左半');
    const tabR = tgH(cropDoc, 'button', { type: 'button', class: 'tgtk-crop-tab', 'data-tgtk': '1' }, '本塔用右半');
    const tabs = tgH(cropDoc, 'div', { class: 'tgtk-crop-tabs' }, tabL, tabR);
    const chk = tgH(cropDoc, 'input', { type: 'checkbox', 'data-tgtk': '1' });
    const chkRow = tgH(cropDoc, 'label', { class: 'tgtk-crop-chk' }, chk,
      tgH(cropDoc, 'span', null, '另一半给 LINK 圣殿' + (link && link.linkName ? '（' + link.linkName + '）' : ''))
    );
    const cvs = tgH(cropDoc, 'canvas', {
      class: 'tgtk-crop-canvas' + (link ? ' tgtk-wide' : ''),
      width: link ? '420' : '360', height: link ? '311' : '480',
    });
    const ctx = cvs.getContext && cvs.getContext('2d');
    const file = tgH(cropDoc, 'input', { type: 'file', accept: 'image/*', class: 'tgtk-crop-file', 'data-tgtk': '1' });
    const urlIn = tgH(cropDoc, 'input', { type: 'text', placeholder: '或粘贴图片地址后回车', 'data-tgtk': '1' });
    const range = tgH(cropDoc, 'input', { type: 'range', min: '15', max: '100', value: '100', 'data-tgtk': '1' });
    const qSel = tgH(cropDoc, 'select', { class: 'tgtk-crop-sel', 'data-tgtk': '1' },
      tgH(cropDoc, 'option', { value: 'full' }, '原图画质（推荐）'),
      tgH(cropDoc, 'option', { value: '480' }, '标准 480×640')
    );
    const stage = tgH(cropDoc, 'div', { class: 'tgtk-crop-stage' }, cvs,
      tgH(cropDoc, 'div', { class: 'tgtk-crop-drop' }, '松开即可载入这张图片'));
    const tip = tgH(cropDoc, 'div', { class: 'tgtk-crop-tip' },
      '把图片拖进上面的黑色区域，或点「选择文件」；也可直接 Ctrl+V 粘贴截图');

    const outSize = (s) => {
      s = s || st;
      if (!s.img || !s.fit || !s.box) return null;
      const iw = s.img.naturalWidth, ih = s.img.naturalHeight;
      const k0 = iw / s.fit.w;
      const sx = Math.max(0, Math.min((s.box.x - s.fit.x) * k0, iw));
      const sy = Math.max(0, Math.min((s.box.y - s.fit.y) * k0, ih));
      const sw = Math.max(2, Math.min(s.box.w * k0, iw - sx));
      const sh = Math.max(1, Math.min(s.box.h * k0, ih - sy));
      if (link) {
        const halfW = Math.max(2, sw * (9 / 16));
        let w = Math.max(1, Math.round(halfW));
        let h = Math.max(1, Math.round(sh));
        const cap = 3000;
        const k = Math.min(1, cap / Math.max(w, h));
        w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
        return { sx, sy, sw, sh, w, h, raw: false, halfW };
      }
      let w, h, raw = false;
      if (qSel.value === '480') { w = 480; h = 640; }
      else {
        w = Math.max(1, Math.round(sw)); h = Math.max(1, Math.round(sh));
        const cap = 3000; // 超大原图兜个上限，免得上传几十 MB
        const k = Math.min(1, cap / Math.max(w, h));
        w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
        raw = !!(s.rawDataUrl && k === 1 &&
          sx <= 1 && sy <= 1 && sw >= iw - 2 && sh >= ih - 2);
        if (raw) { w = iw; h = ih; }
      }
      return { sx, sy, sw, sh, w, h, raw };
    };
    const mimeOf = (s) => (s || st).outMime === 'image/png' ? 'PNG 无损' :
      (s || st).outMime === 'image/webp' ? 'WebP' :
      (s || st).outMime === 'image/gif' ? 'GIF 动图（走小圣杯上传）' : 'JPEG 质量 100';
    const refreshTip = () => {
      if (st.animated) {
        tip.textContent = 'GIF 动图无法裁剪，将交给小圣杯自己的上传通道（保留动画）' +
          (st.rawUrl ? ' · 按原地址提交' : ' · 原文件直交') +
          (link ? '；LINK 拼图不支持动图，请换静态图' : '');
        return;
      }
      if (st.urlOnly) {
        tip.textContent = '这是小圣杯自己的封面地址：点「确定并更换」会按原地址提交（不重编码、画质不损失）' +
          (link ? '；LINK 拼图要切成两半，请改用本地图片' : '');
        return;
      }
      const o = outSize();
      if (!o) return;
      const which = curHalf === 'right' ? '右半' : '左半';
      tip.textContent = (link ? '两张各 ' + o.w + '×' + o.h + '（' + which + '给本塔，重叠约 12.5%），' : '') +
        '拖动裁剪框移动，拉右下角或滑杆缩放；输出 ' + o.w + '×' + o.h + ' · ' +
        mimeOf() + (o.raw ? ' · 原文件直传' : '') +
        (link ? (chk.checked && partnerMine ? ' · 另一半给 ' + (link.linkName || 'LINK 圣殿') : ' · 只换本塔') : '');
    };

    const setHalf = (h) => {
      curHalf = h === 'right' ? 'right' : 'left';
      tabL.classList.toggle('on', curHalf === 'left');
      tabR.classList.toggle('on', curHalf === 'right');
      draw();
      if (st.img) refreshTip();
    };
    tabL.addEventListener('click', () => setHalf('left'));
    tabR.addEventListener('click', () => setHalf('right'));
    chk.addEventListener('change', () => { draw(); if (st.img) refreshTip(); });

    const draw = () => {
      if (!ctx || !st.img || !st.fit) return;
      const W = cvs.width, H = cvs.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#20242e';
      ctx.fillRect(0, 0, W, H);
      const f = st.fit;
      ctx.drawImage(st.img, f.x, f.y, f.w, f.h);
      if (st.animated) return; // 动图不画裁剪框：框了也裁不出来
      const b = st.box;
      if (!b) return;
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(0, 0, W, b.y);
      ctx.fillRect(0, b.y + b.h, W, H - b.y - b.h);
      ctx.fillRect(0, b.y, b.x, b.h);
      ctx.fillRect(b.x + b.w, b.y, W - b.x - b.w, b.h);
      if (link) {
        const cut = b.x + b.w * (curHalf === 'right' ? 7 / 16 : 9 / 16);
        ctx.save();
        ctx.strokeStyle = '#ff6fa8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cut, b.y);
        ctx.lineTo(cut, b.y + b.h);
        ctx.stroke();
        ctx.restore();
        return;
      }
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(b.x + b.w * i / 3, b.y);
        ctx.lineTo(b.x + b.w * i / 3, b.y + b.h);
        ctx.moveTo(b.x, b.y + b.h * i / 3);
        ctx.lineTo(b.x + b.w, b.y + b.h * i / 3);
        ctx.stroke();
      }
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(b.x + b.w - 6, b.y + b.h - 6, 12, 12);
    };

    const clampBox = () => {
      const f = st.fit, b = st.box;
      if (!f || !b) return;
      b.w = Math.max(24, Math.min(b.w, f.w, f.h * RATIO));
      b.h = b.w / RATIO;
      if (b.h > f.h) { b.h = f.h; b.w = b.h * RATIO; }
      b.x = Math.max(f.x, Math.min(b.x, f.x + f.w - b.w));
      b.y = Math.max(f.y, Math.min(b.y, f.y + f.h - b.h));
    };

    const sizeBox = (pct) => {
      const f = st.fit;
      if (!f) return;
      let w = Math.min(f.w, f.h * RATIO) * pct;
      let h = w / RATIO;
      const cx = st.box ? st.box.x + st.box.w / 2 : f.x + f.w / 2;
      const cy = st.box ? st.box.y + st.box.h / 2 : f.y + f.h / 2;
      st.box = { x: cx - w / 2, y: cy - h / 2, w, h };
      clampBox();
      draw();
    };

    const load = (src, cross, side) => new Promise((resolve) => {
      const dst = side || st; // 记下这一次要写入哪一侧，避免切页签后把图写到另一边
      const Img = (cropDoc.defaultView && cropDoc.defaultView.Image) ||
        (HDOC.defaultView && HDOC.defaultView.Image) || window.Image;
      const im = new Img();
      if (cross) {
        im.crossOrigin = 'anonymous';
        try { im.referrerPolicy = 'no-referrer'; } catch (e) {}
      }
      im.onload = () => {
        const iw = im.naturalWidth || im.width || 0;
        const ih = im.naturalHeight || im.height || 0;
        if (!iw || !ih) { tip.textContent = '图片尺寸读取失败'; resolve(false); return; }
        const W = cvs.width, H = cvs.height;
        const scale = Math.min(W / iw, H / ih);
        const dw = iw * scale, dh = ih * scale;
        dst.img = im;
        dst.fit = { x: (W - dw) / 2, y: (H - dh) / 2, w: dw, h: dh };
        dst.box = null;
        dst.touched = false; // 新图进来算「没动过裁剪框」
        if (dst !== st) { resolve(true); return; } // 已经切到另一侧：静默存下即可
        range.disabled = !!st.animated || !!st.urlOnly;
        if (st.animated) { draw(); refreshTip(); resolve(true); return; }
        if (st.urlOnly) { draw(); refreshTip(); resolve(true); return; }
        sizeBox(Number(range.value || 100) / 100);
        refreshTip();
        resolve(true);
      };
      im.onerror = () => {
        if (dst.animated && dst.rawUrl) {
          tip.textContent = '预览被跨域拦住了，地址已记录，可以直接点「确定并更换」';
          resolve(false);
          return;
        }
        tip.textContent = dst.srcUrl
          ? '这串地址在本地读不到像素（小圣杯封面只对自家站点开放），' +
            '但地址已记下，点「确定并更换」会直接按原地址提交'
          : '图片加载失败，换一张或改用本地文件';
        resolve(false);
      };
      im.src = src;
      if (im.complete && im.naturalWidth && im.onload) im.onload();
    });

    const applyUrl = (v, wait) => {
      const raw = tgNormCover(String(v || '').trim());
      if (!raw) return Promise.resolve(false);
      const dst = st;
      const canon = tgCanonCover(raw);
      const u = canon || raw;
      dst.srcUrl = u;
      dst.srcRaw = raw;
      dst.urlOnly = !!canon;
      const gif = isGifUrl(u);
      dst.animated = gif;
      dst.rawUrl = gif && !/^data:/i.test(u) ? u : '';
      dst.rawDataUrl = gif && /^data:/i.test(u) ? u : '';
      dst.rawFile = null;
      dst.rawMime = gif ? 'image/gif' : '';
      dst.outMime = gif ? 'image/gif' : tgOutMime(guessMime(u));
      const preview = canon ? tgCdnCover(canon) : raw;
      const p = load(preview, canon ? false : !/^data:/i.test(raw), dst);
      return (gif || canon) ? Promise.resolve(false) : p;
    };

    const ensureUrl = async () => {
      const raw = String(urlIn.value || '').trim();
      if (!raw) return false;
      if (!/^(https?:)?\/\//i.test(raw) && !/^data:image\//i.test(raw) && !/^cover\//.test(raw)) return false;
      const norm = tgCanonCover(tgNormCover(raw)) || tgNormCover(raw);
      if (norm === st.srcUrl && (st.img || st.animated)) return !!st.img;
      return await applyUrl(raw, true);
    };

    const guessMime = (u) => /\.(png|apng)(\?|#|$)/i.test(String(u)) ? 'image/png' :
      /\.(webp)(\?|#|$)/i.test(String(u)) ? 'image/webp' : 'image/jpeg';
    const isGifUrl = (u) => /^data:image\/gif[;,]/.test(String(u)) || /\.gif(?:[?#]|$)/i.test(String(u));
    const isImageFile = (f) => !!f && (/^image\//.test(String(f.type || '')) ||
      /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(String(f.name || '')));

    const useLocalFile = (f) => {
      if (!isImageFile(f)) return tgToast('请拖入 / 选择图片文件');
      const dst = st;
      const gif = /^image\/gif$/i.test(String(f.type || '')) || /\.gif$/i.test(String(f.name || ''));
      const FR = (cropDoc.defaultView && cropDoc.defaultView.FileReader) || FileReader;
      const rd = new FR();
      rd.onload = () => {
        const raw = String(rd.result);
        dst.rawDataUrl = raw;
        dst.rawMime = (raw.match(/^data:([^;]+);/) || [null, 'image/jpeg'])[1];
        dst.rawFile = f;
        dst.animated = gif;
        dst.rawUrl = '';
        dst.srcUrl = '';
        dst.srcRaw = '';
        dst.outMime = gif ? 'image/gif' : tgOutMime(f.type || dst.rawMime);
        load(raw, false, dst);
      };
      rd.onerror = () => tgToast('图片读取失败');
      try { rd.readAsDataURL(f); } catch (e) { tgToast('图片读取失败'); }
    };

    const useDrop = (dt) => {
      if (!dt) return;
      let f = dt.files && dt.files[0];
      if (!f && dt.items) {
        for (let i = 0; i < dt.items.length && !f; i++) {
          const it = dt.items[i];
          if (it && it.kind === 'file' && it.getAsFile) f = it.getAsFile();
        }
      }
      if (f) return useLocalFile(f);
      let u = '';
      try { u = String((dt.getData && (dt.getData('text/uri-list') || dt.getData('text/plain'))) || ''); }
      catch (e) {}
      u = u.trim().split('\n')[0].trim();
      if (/^(https?:)?\/\//i.test(u) || /^data:image\//i.test(u)) {
        urlIn.value = u;
        applyUrl(u);
      } else tgToast('没读到图片，试试直接拖本地图片文件');
    };

    file.addEventListener('change', () => useLocalFile(file.files && file.files[0]));
    urlIn.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      applyUrl(urlIn.value);
    });
    const urlOk = (v) => /^(https?:)?\/\//i.test(v) || /^data:image\//i.test(v) || /^cover\//.test(v);
    urlIn.addEventListener('paste', () => {
      (cropDoc.defaultView || window).setTimeout(() => {
        const v = String(urlIn.value || '').trim();
        if (urlOk(v)) applyUrl(v);
      }, 0);
    });
    urlIn.addEventListener('blur', () => {
      const v = tgNormCover(String(urlIn.value || '').trim());
      if (!v || v === st.srcRaw) return;
      if (urlOk(v)) applyUrl(v);
    });
    range.addEventListener('input', () => {
      if (st.fit) sizeBox(Number(range.value || 100) / 100);
      refreshTip();
    });
    qSel.addEventListener('change', refreshTip);

    const pos = (e) => {
      const r = cvs.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (cvs.width / (r.width || cvs.width)),
        y: (e.clientY - r.top) * (cvs.height / (r.height || cvs.height)),
      };
    };
    cvs.addEventListener('pointerdown', (e) => {
      if (st.animated || st.urlOnly || !st.box) return;
      const p = pos(e), b = st.box;
      const corner = Math.abs(p.x - (b.x + b.w)) < 16 && Math.abs(p.y - (b.y + b.h)) < 16;
      if (corner) st.drag = { mode: 'size', sx: p.x, w: b.w };
      else if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h)
        st.drag = { mode: 'move', sx: p.x, sy: p.y, x: b.x, y: b.y };
      else return;
      try { cvs.setPointerCapture(e.pointerId); } catch (err) {}
    });
    cvs.addEventListener('pointermove', (e) => {
      const d = st.drag, b = st.box;
      if (!d || !b || !st.fit) return;
      const p = pos(e);
      if (d.mode === 'move') { b.x = d.x + (p.x - d.sx); b.y = d.y + (p.y - d.sy); }
      else b.w = d.w + (p.x - d.sx);
      clampBox();
      draw();
      refreshTip();
    });
    ['pointerup', 'pointercancel'].forEach((ev) =>
      cvs.addEventListener(ev, () => { st.drag = null; })
    );

    const renderRegion = (s, rx, ry, rw, rh, ow, oh) => {
      const out = cropDoc.createElement('canvas');
      out.width = ow; out.height = oh;
      const octx = out.getContext && out.getContext('2d');
      if (!octx) throw new Error('浏览器不支持 canvas');
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(s.img, rx, ry, rw, rh, 0, 0, ow, oh);
      const du = s.outMime === 'image/jpeg'
        ? out.toDataURL('image/jpeg', 1)
        : out.toDataURL(s.outMime);
      const realMime = (du.match(/^data:([^;]+);/) || [null, s.outMime])[1];
      return { dataUrl: du, mime: realMime, w: ow, h: oh };
    };

    const exportData = (s) => {
      s = s || st;
      if (s.animated) {
        const iw = (s.img && (s.img.naturalWidth || s.img.width)) || 0;
        const ih = (s.img && (s.img.naturalHeight || s.img.height)) || 0;
        if (s.rawDataUrl) {
          return {
            dataUrl: s.rawDataUrl, mime: s.rawMime || 'image/gif',
            w: iw, h: ih, animated: true, file: s.rawFile || null,
          };
        }
        if (s.rawUrl) return { url: s.rawUrl, mime: 'image/gif', w: iw, h: ih, animated: true };
        throw new Error('GIF 读取失败，请重新选择文件');
      }
      if (!s.img || !s.fit) throw new Error('请先选择图片');
      if (!s.box) throw new Error('请先选择图片');
      const o = outSize(s);
      if (!o) throw new Error('请先选择图片');
      if (o.raw) return { dataUrl: s.rawDataUrl, mime: s.rawMime, w: o.w, h: o.h };
      return renderRegion(s, o.sx, o.sy, o.sw, o.sh, o.w, o.h);
    };

    const exportHalf = (s, which) => {
      s = s || st;
      if (!s.img || !s.fit || !s.box) throw new Error('请先选择图片');
      const o = outSize(s);
      if (!o) throw new Error('请先选择图片');
      const hw = o.halfW || o.sw * (9 / 16);
      const rx = which === 'right' ? Math.round(o.sx + o.sw - hw) : Math.round(o.sx);
      const rw = Math.max(2, Math.round(hw));
      return renderRegion(s, rx, Math.round(o.sy), rw, Math.round(o.sh), rw, Math.round(o.sh));
    };

    const ok = tgBtn('确定并更换', '按所选画质导出后上传', async () => {
      ok.disabled = true;
      try {
        try { await ensureUrl(); } catch (e) {}
        if (link) {
          if (!st.img) throw new Error('请先选择一张拼图');
          if (st.urlOnly) throw new Error('LINK 拼图要切成两半，小圣杯封面地址没法切，请改用本地图片');
          if (st.animated) throw new Error('LINK 拼图要切成两半，GIF 动图做不到，请换静态图片');
          const other = curHalf === 'left' ? 'right' : 'left';
          const wantOther = !!(chk.checked && partnerMine);
          const a = exportHalf(st, curHalf);
          let b = null;
          if (wantOther) {
            if (!link.linkUid) throw new Error('没识别到 LINK 圣殿的塔主，只能换本塔');
            b = exportHalf(st, other);
          }
          tip.textContent = '正在上传本塔…（' + a.w + '×' + a.h + '）';
          await tgUpload(target.cid, target.uid, a.dataUrl, a.mime);
          if (b) {
            tip.textContent = '正在上传 LINK 塔…（' + b.w + '×' + b.h + '）';
            await tgUpload(link.linkCid, link.linkUid, b.dataUrl, b.mime);
          }
          try {
            const im = target.kind === 'old'
              ? target.doc.querySelector('#TB_window.temple img.cover')
              : target.doc.querySelector('#tg-temple-detail img');
            if (im) im.src = a.dataUrl;
          } catch (e) {}
          tgToast(b ? '本塔与 LINK 塔的塔图都已更换，刷新后完全生效' : '塔图已更换，刷新后完全生效');
          tgCropClose();
          ok.disabled = false;
          return;
        }

        const selfSide = SIDES.self;
        const canonSelf = tgCanonCover(selfSide.srcUrl);
        if (canonSelf && !selfSide.animated) {
          tip.textContent = '正在按原地址提交…';
          await tgPostCover(target.cid, target.uid, canonSelf);
          tgToast('塔图已更换（原地址提交），刷新页面就能看到新图');
          tgCropClose();
          ok.disabled = false;
          return;
        }
        if (!selfSide.img && !(selfSide.animated && selfSide.rawUrl)) {
          throw new Error('还没选图：点左边「选择文件」，或在「图片地址」里粘链接');
        }
        const out = exportData(SIDES.self);
        let ownActs = false;
        try {
          ownActs = !!(
            (target.root && target.root.querySelector &&
              target.root.querySelector('#tg-temple-actions')) ||
            (target.doc && target.doc.querySelector &&
              target.doc.querySelector('#tg-temple-detail #tg-temple-actions')) ||
            (target.kind === 'old' && target.doc && target.doc.querySelector &&
              target.doc.querySelector('#TB_window.temple input[type="file"],#TB_window.temple .modify'))
          );
        } catch (e) {}
        if (out.url) {
          tip.textContent = '正在提交原图地址…（' + (out.w ? out.w + '×' + out.h : '原图') + '）';
          await tgPostCover(target.cid, target.uid, out.url);
        } else if (out.animated && tgSiteGifUpload(target, out)) {
          ok.disabled = false;
          return;
        } else if (out.animated && target.uid && !ownActs) {
          throw new Error('小圣杯没给别人的塔留 GIF 上传入口（只有自己塔上的「修改」才能传动图），请改用静态图');
        } else if (out.animated) {
          tip.textContent = 'GIF 上传入口没接住，改按静态图上传（只保留第一帧）…';
          await tgUpload(target.cid, target.uid, out.dataUrl, out.mime);
          tgToast('已按静态图上传：GIF 动图请用站点自己的「修改」换');
          tgCropClose();
          ok.disabled = false;
          return;
        } else {
          tip.textContent = out.animated
            ? '站点上传入口没找到，改用工具箱直传…'
            : '正在上传…（' + out.w + '×' + out.h + '）';
          await tgUpload(target.cid, target.uid, out.dataUrl, out.mime);
        }
        try {
          const im = target.kind === 'old'
            ? target.doc.querySelector('#TB_window.temple img.cover')
            : target.doc.querySelector('#tg-temple-detail img');
          if (im && out.dataUrl) im.src = out.dataUrl;
        } catch (e) {}
        tgToast('塔图已更换，刷新后完全生效');
        tgCropClose();
        ok.disabled = false;
      } catch (e) {
        tip.textContent = '更换失败：' + (e && e.message ? e.message : e);
        ok.disabled = false;
      }
    });
    const cancel = tgBtn('取消', '关闭', tgCropClose);
    cancel.classList.add('tgtk-tcancel');

    const box = tgH(cropDoc, 'div', { class: 'tgtk-crop-box', 'data-tgtk': '1' },
      tgH(cropDoc, 'div', { class: 'tgtk-crop-hd' },
        tgH(cropDoc, 'span', null, (link ? '裁剪 LINK 塔图 · ' : '裁剪塔图 · ') + (target.label || '我的圣殿')),
        tgH(cropDoc, 'button', { class: 'tgtk-crop-x', type: 'button', 'data-tgtk': '1', title: '关闭' }, '×')
      ),
      stage,
      link ? tabs : null,
      partnerMine ? chkRow : null,
      tip,
      tgH(cropDoc, 'div', { class: 'tgtk-crop-row' },
        tgH(cropDoc, 'label', null, '本地图片'), file,
        tgH(cropDoc, 'label', null, '裁剪大小'), range,
        tgH(cropDoc, 'label', null, '输出画质'), qSel
      ),
      tgH(cropDoc, 'div', { class: 'tgtk-crop-row' }, tgH(cropDoc, 'label', null, '图片地址'), urlIn),
      tgH(cropDoc, 'div', { class: 'tgtk-crop-ft' }, cancel, ok)
    );
    const overlay = tgH(cropDoc, 'dialog', { id: 'tgtk-crop', class: 'tgtk-crop', 'data-tgtk': '1' }, box);
    if (partnerMine) {
      tip.textContent = '把整张拼图拖进上面的黑色区域，框选范围（与 LINK 卡同比例 27:20）；点「确定并更换」会切成两张等大的 3:4 ——' +
        '本塔拿你选的那一半，勾选后另一半给 LINK 圣殿。';
    } else if (link) {
      tip.textContent = '把整张拼图拖进上面的黑色区域，框选范围（与 LINK 卡同比例 27:20）后取一半换本塔；' +
        'LINK 另一半不是你的圣殿，不会去动它。';
    }
    overlay.style.setProperty('position', 'fixed', 'important');
    overlay.style.setProperty('z-index', '2147483647', 'important');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) tgCropClose(); });
    overlay.addEventListener('cancel', (e) => { e.preventDefault(); tgCropClose(); }); // ESC 也走统一关闭
    box.querySelector('.tgtk-crop-x').addEventListener('click', tgCropClose);

    let dragDepth = 0;
    const dragOn = () => stage.classList.add('tgtk-crop-dragover');
    const dragOff = () => { dragDepth = 0; stage.classList.remove('tgtk-crop-dragover'); };
    box.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; dragOn(); });
    box.addEventListener('dragover', (e) => {
      e.preventDefault();
      try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; } catch (err) {}
    });
    box.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) stage.classList.remove('tgtk-crop-dragover');
    });
    box.addEventListener('drop', (e) => {
      e.preventDefault(); e.stopPropagation();
      dragOff();
      try { useDrop(e.dataTransfer); } catch (err) { tgToast('图片载入失败'); }
    });
    overlay.addEventListener('dragover', (e) => e.preventDefault());
    overlay.addEventListener('drop', (e) => { e.preventDefault(); dragOff(); });

    const onPaste = (e) => {
      if (!TGT.crop) return;
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it && it.kind === 'file' && /^image\//.test(String(it.type || '')) && it.getAsFile) {
          const f = it.getAsFile();
          if (f) { e.preventDefault(); useLocalFile(f); tgToast('已粘贴剪贴板图片'); }
          break;
        }
      }
    };
    TGT.paste = { doc: cropDoc, fn: onPaste };
    cropDoc.addEventListener('paste', onPaste, true);

    cropDoc.body.appendChild(overlay);
    try {
      if (typeof overlay.showModal === 'function') overlay.showModal();
      else overlay.setAttribute('open', '');
    } catch (e) {
      try { overlay.setAttribute('open', ''); } catch (err) {}
    }
    try { overlay.inert = false; overlay.removeAttribute('inert'); } catch (e) {}
    TGT.crop = { overlay, st, doc: cropDoc };
    tgHidePopups();
    if (!ctx) tip.textContent = '当前环境无法绘制画布，请换个浏览器';
  }

  function gxUserPerPage(win) {
    try {
      const d = win.document;
      const grail = d.querySelector('#grail');
      if (!grail) return 0;
      if (grail.__tgtkPer != null) return grail.__tgtkPer; // 同一个弹窗里只算一次，翻页不会变
      const list = grail.querySelector('.temple_list');
      if (!list) return 0;
      const w = Math.max(list.clientWidth || 0, grail.clientWidth || 0);
      if (w < 240) return 0;
      let cw = 114; // 站点：.item 宽 99 + 右外边距 15
      const item = list.querySelector('.item');
      if (item) {
        const r = item.getBoundingClientRect();
        const cs = win.getComputedStyle(item);
        const gap = num(parseFloat(cs.marginLeft || 0) + parseFloat(cs.marginRight || 0));
        if (r.width > 20) cw = r.width + gap;
      }
      const per = Math.max(2, Math.floor((w - 1) / cw));
      const size = per * Math.ceil(24 / per);
      grail.__tgtkPer = size;
      return size;
    } catch (e) {
      return 0;
    }
  }

  function gxUserTempleFill() {
    for (const d of allDocs()) {
      const win = d && d.defaultView;
      if (!win) continue;
      let $ = null;
      try { $ = win.jQuery; } catch (e) { continue; }
      if (!$ || !$.ajaxPrefilter || $.__tgtkTempleFill) continue;
      try {
        $.__tgtkTempleFill = true;
        $.ajaxPrefilter(function (opts) {
          try {
            const url = String((opts && opts.url) || '');
            const m = /(chara\/user\/temple\/[^/?#]+\/\d+)\/24$/.exec(url);
            if (!m) return;
            const size = gxUserPerPage(win);
            if (!size || size === 24) return;
            opts.url = url.replace(m[0], m[1] + '/' + size);
          } catch (e) {}
        });
      } catch (e) {}
    }
  }

  const TUI = { pins: [], bots: [], on: true, cols: 4, ts: 0 };
  let tuiUiRefresh = null; // buildUI 里挂上：名单 / 列数从别处变了就刷新面板
  let cldReady = false; // 拉过一次之后才允许往回写，避免启动时把云端盖成空
  let cldPushTimer = 0;
  let cldStatEl = null;
  let cldStatMsg = '';

  function tuiIds(list) {
    const out = [];
    (Array.isArray(list) ? list : []).forEach((x) => {
      const id = String(x == null ? '' : x).replace(/^#/, '').trim();
      if (/^[1-9]\d{0,9}$/.test(id) && out.indexOf(id) < 0) out.push(id);
    });
    return out;
  }
  function tuiApply(raw) {
    if (!raw || typeof raw !== 'object') return false;
    TUI.pins = tuiIds(raw.pins);
    TUI.bots = tuiIds(raw.bots).filter((x) => TUI.pins.indexOf(x) < 0);
    TUI.on = raw.on !== false;
    TUI.cols = [4, 5, 6].includes(Number(raw.cols)) ? Number(raw.cols) : 4;
    TUI.ts = num0(raw.ts);
    return true;
  }
  function tuiRead() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(LS_TUI) || 'null');
    } catch (e) {}
    return tuiApply(raw);
  }
  function tuiSave(bump) {
    if (bump !== false) TUI.ts = Date.now();
    try {
      localStorage.setItem(LS_TUI, JSON.stringify(TUI));
    } catch (e) {}
    if (bump !== false) cldPushSoon();
  }
  if (!tuiRead()) {
    tuiApply({ pins: S.templePins, on: S.templePinOn, cols: S.templeCols });
    tuiSave(false);
  }
  try {
    window.addEventListener('storage', (e) => {
      if (!e || e.key !== LS_TUI) return;
      if (tuiRead() && tuiUiRefresh) tuiUiRefresh();
    });
  } catch (e) {}

  const CLD_KEY = 'tgtk_templeui';

  function cldFrameList() {
    const list = [];
    const push = (w) => {
      try {
        if (w && list.indexOf(w) < 0) list.push(w);
      } catch (e) {}
    };
    push(window);
    push(HWIN);
    WINS.forEach(push);
    for (let i = 0; i < list.length && i < 10; i++) {
      try {
        const fr = list[i].frames;
        for (let k = 0; k < fr.length && k < 12; k++) push(fr[k]);
      } catch (e) {}
    }
    return list;
  }

  function cldFromApp(app) {
    try {
      const cs = app && app.cloud_settings;
      if (!cs || typeof cs.update !== 'function') return null;
      if (typeof cs.getAll === 'function' || typeof cs.get === 'function') return cs;
    } catch (e) {}
    return null;
  }

  let cldWhere = '';
  function cldPick() {
    try {
      if (typeof chiiApp !== 'undefined') {
        const cs = cldFromApp(chiiApp);
        if (cs) {
          cldWhere = 'chiiApp';
          return cs;
        }
      }
    } catch (e) {}
    const frames = cldFrameList();
    for (let i = 0; i < frames.length; i++) {
      const w = frames[i];
      try {
        const cs = cldFromApp(w.chiiApp);
        if (cs) {
          cldWhere = w === window ? 'self.chiiApp' : w === HWIN ? 'top.chiiApp' : 'frame.chiiApp';
          return cs;
        }
      } catch (e) {}
    }
    return null;
  }
  function cldApi() {
    return cldPick();
  }

  function cldDiag() {
    const safe = (fn) => {
      try {
        return fn();
      } catch (e) {
        return 'ERR:' + ((e && e.message) || e);
      }
    };
    const frames = cldFrameList();
    const detail = frames.map((w, i) => {
      const tag = w === window ? 'self' : w === HWIN ? 'top' : 'frame#' + i;
      return safe(() => {
        const app = w.chiiApp;
        if (!app) return tag + ':无';
        const cs = app.cloud_settings;
        if (cs) return tag + ':cloud_settings[' + Object.keys(cs).join('/') + ']';
        return tag + ':chiiApp 存在但没有 cloud_settings';
      });
    });
    return {
      host: HOST.outer ? 'iframe（组件）' : '顶层（可能是油猴脚本）',
      frames: frames.length,
      作用域里有没有chiiApp: safe(() => (typeof chiiApp !== 'undefined' ? '有' : '无')),
      detail,
    };
  }
  function cldSetStat(text) {
    cldStatMsg = text;
    if (cldStatEl) cldStatEl.textContent = text;
  }
  function cldSnapshot() {
    return {
      v: 1, ts: TUI.ts || 0,
      pins: TUI.pins.slice(), bots: TUI.bots.slice(),
      on: !!TUI.on, cols: TUI.cols,
    };
  }
  function cldPushSoon() {
    if (!cldReady || !cldApi()) return;
    clearTimeout(cldPushTimer);
    cldPushTimer = setTimeout(() => {
      cldPush().catch(() => {});
    }, 700);
  }
  async function cldPush() {
    const cs = cldApi();
    if (!cs) return false;
    if (!TUI.ts) {
      TUI.ts = Date.now();
      tuiSave(false);
    }
    try {
      await Promise.resolve(cs.update({ [CLD_KEY]: JSON.stringify(cldSnapshot()) }));
      try {
        if (typeof cs.save === 'function') await Promise.resolve(cs.save());
      } catch (e) {}
      return true;
    } catch (e) {
      cldSetStat('云设置：写入失败（改动已存在本机，本地照常生效）');
      return false;
    }
  }
  let cldTry = 0;
  let cldLastTry = 0;
  let cldPulled = false; // 成功读到过云端就不再重复拉（避免状态行被「已连接」覆盖）

  function cldRetrySilent() {
    if (cldTry >= 3) {
      const d = cldDiag();
      try {
        console.log('[小圣杯工具箱] 云设置不可用：', d);
      } catch (e) {}
      return false;
    }
    cldTry++;
    setTimeout(() => {
      cldPull().catch(() => {});
    }, 1500 * cldTry);
    return true;
  }

  async function cldPull() {
    if (cldPulled) return false;
    const cs = cldApi();
    cldLastTry = Date.now();
    if (!cs) {
      cldSetStat(
        HOST.outer
          ? '云设置：组件里没找到 chiiApp（改动只存本机）'
          : '云设置：当前不是组件环境，用不了云设置（改动只存本机）'
      );
      cldRetrySilent();
      return false;
    }
    cldTry = 0;
    try {
      console.log('[小圣杯工具箱] 云设置已接上：' + cldWhere);
    } catch (e) {}
    let raw = null;
    try {
      let bag;
      if (typeof cs.getAll === 'function') {
        const all = await Promise.resolve(cs.getAll());
        bag = typeof all === 'string' ? JSON.parse(all || '{}') : all || {};
        raw = bag[CLD_KEY];
      } else {
        raw = await Promise.resolve(cs.get(CLD_KEY));
      }
      if (typeof raw === 'string') raw = JSON.parse(raw);
    } catch (e) {
      cldSetStat('云设置：读取失败，先按本机来（稍后自动重试）');
      cldRetrySilent();
      return false;
    }
    cldPulled = true;
    cldReady = true;
    const remoteTs = num0(raw && raw.ts);
    const localTs = num0(TUI.ts);
    if (raw && Array.isArray(raw.pins) && remoteTs > localTs) {
      TUI.pins = tuiIds(raw.pins);
      TUI.bots = tuiIds(raw.bots).filter((x) => TUI.pins.indexOf(x) < 0);
      TUI.on = raw.on !== false;
      TUI.cols = [4, 5, 6].includes(Number(raw.cols)) ? Number(raw.cols) : 4;
      TUI.ts = remoteTs;
      tuiSave(false);
      if (tuiUiRefresh) tuiUiRefresh();
      if (pinUiRefresh) pinUiRefresh();
      pinRefreshSnaps();
      cldSetStat(
        `云设置：已从云端同步（${TUI.pins.length} 座置顶` +
          (TUI.bots.length ? ` · ${TUI.bots.length} 座置底` : '') +
          ` · 每行 ${TUI.cols} 个）`
      );
      return true;
    }
    cldSetStat(
      `云设置：已连接` +
        (TUI.pins.length || TUI.bots.length
          ? `（${TUI.pins.length} 座置顶${TUI.bots.length ? ` · ${TUI.bots.length} 座置底` : ''}）`
          : '')
    );
    if (!raw || remoteTs < localTs) cldPushSoon();
    return false;
  }

  let pinSnap = Object.create(null); // { cid: { at, obj } } 置顶塔的快照（工具箱列表显示用）
  let pinNames = Object.create(null); // cid → 角色名（快照里没名字时兜底，刷新后不会退回 #id）
  try {
    const raw = JSON.parse(localStorage.getItem(LS_TPIN) || '{}');
    if (raw && raw.snaps && typeof raw.snaps === 'object') pinSnap = raw.snaps;
    if (raw && raw.names && typeof raw.names === 'object') pinNames = raw.names;
  } catch (e) {}

  function pinSaveSnaps() {
    try {
      localStorage.setItem(LS_TPIN, JSON.stringify({ snaps: pinSnap, names: pinNames }));
    } catch (e) {}
  }
  function pinNameSet(cid, name) {
    const id = String(cid || '');
    const nm = String(name || '').trim();
    if (!/^\d+$/.test(id) || !nm || pinNames[id] === nm) return;
    pinNames[id] = nm;
    pinSaveSnaps();
  }
  const pinNameGet = (cid) => pinNames[String(cid)] || nameCache[String(cid)] || '';

  function pinList() {
    return TUI.pins.slice();
  }
  function pinHas(cid) {
    return TUI.pins.indexOf(String(cid)) >= 0;
  }
  function botList() {
    return TUI.bots.slice();
  }
  function botHas(cid) {
    return TUI.bots.indexOf(String(cid)) >= 0;
  }

  function mergeIdList(incoming, which) {
    const bots = which === 'bots';
    const src = tuiIds(incoming).filter((x) => !bots || TUI.pins.indexOf(x) < 0);
    const cur = (bots ? TUI.bots : TUI.pins).slice();
    if (!src.length) return { added: 0, total: cur.length };
    let next;
    let added;
    if (!cur.length) {
      next = src.slice();
      added = src.length;
    } else {
      const have = new Set(cur);
      const add = src.filter((x) => !have.has(x));
      added = add.length;
      next = add.length ? cur.concat(add) : cur;
    }
    if (added) {
      if (bots) TUI.bots = next;
      else TUI.pins = next;
      if (!bots) TUI.bots = TUI.bots.filter((x) => TUI.pins.indexOf(x) < 0);
      tuiSave();
    }
    return { added, total: next.length };
  }
  function mergePinList(incoming) {
    return mergeIdList(incoming, 'pins');
  }
  function mergeBotList(incoming) {
    return mergeIdList(incoming, 'bots');
  }
  function pinOn() {
    return (TUI.on && TUI.pins.length > 0) || TUI.bots.length > 0;
  }
  function pinOwnedSetNow() {
    const all = pinAllGet();
    if (!all) return null;
    const set = new Set();
    for (let i = 0; i < all.length; i++) {
      if (all[i] && all[i].CharacterId != null) set.add(String(all[i].CharacterId));
    }
    return set;
  }
  async function pinOwnedSet() {
    const hit = pinOwnedSetNow();
    if (hit) return hit;
    const all = await pinAllLoad().catch(() => null);
    if (!all) return null;
    const set = new Set();
    for (let i = 0; i < all.length; i++) {
      if (all[i] && all[i].CharacterId != null) set.add(String(all[i].CharacterId));
    }
    return set;
  }

  function pinSnapGet(cid) {
    const s = pinSnap[String(cid)];
    if (!s || !s.obj) return null;
    return String(s.obj.CharacterId || '') === String(cid) ? s.obj : null;
  }

  function pinSnapSet(cid, obj) {
    const id = String(cid || '');
    if (!/^\d+$/.test(id) || !obj || !obj.CharacterId) return;
    pinNameSet(id, obj.Name || obj.CharacterName);
    const prev = pinSnap[id] && pinSnap[id].obj;
    const same =
      prev &&
      prev.Assets === obj.Assets &&
      prev.Sacrifices === obj.Sacrifices &&
      prev.Level === obj.Level &&
      prev.Name === obj.Name &&
      prev.Cover === obj.Cover;
    if (same) return;
    pinSnap[id] = { at: Date.now(), obj };
    pinSaveSnaps();
  }

  const pinAll = { user: '', at: 0, items: null, busy: null, busyUser: '', failAt: 0 };
  const PIN_ALL_TTL = 5 * 60 * 1000;

  function pinAllGet() {
    if (!pinAll.items) return null;
    const me = selfKeyCache || guessedUsername();
    if (me && pinAll.user !== String(me).toLowerCase()) return null;
    if (Date.now() - pinAll.at > PIN_ALL_TTL) return null;
    return pinAll.items;
  }

  async function pinLoadPaged(key, total) {
    const size = 100;
    const pages = Math.min(300, Math.max(1, Math.ceil((total || 0) / size) || 1));
    const list = [];
    for (let p = 1; p <= pages; p++) list.push(p);
    const out = [];
    await mapLimit(list, 5, async (p) => {
      try {
        const v = await api(`chara/user/temple/${key}/${p}/${size}`, { timeout: 30000 });
        const arr = (v && v.Items) || [];
        if (arr.length) out.push.apply(out, arr);
      } catch (e) {}
    });
    return out;
  }

  function pinAllLoad(force) {
    if (!force) {
      const hit = pinAllGet();
      if (hit) return Promise.resolve(hit);
      if (pinAll.failAt && Date.now() - pinAll.failAt < 60000) return Promise.resolve(null);
    }
    if (pinAll.busy) return pinAll.busy;
    const p = (async () => {
      let me = selfKeyCache || guessedUsername();
      if (!me) {
        try { me = (await selfKey()) || ''; } catch (e) { me = ''; }
      }
      if (!me) {
        pinAll.failAt = Date.now();
        return null;
      }
      const key = encodeURIComponent(me);
      try {
        const v = await api('chara/user/temple/' + key + '/1/10000', { timeout: 45000 });
        let items = ((v && v.Items) || []).slice();
        const total = num(v && v.TotalItems);
        const pages = Math.min(5, num(v && v.TotalPages) || 1);
        if (pages > 1) {
          const list = [];
          for (let k = 2; k <= pages; k++) list.push(k);
          await mapLimit(list, 3, async (k) => {
            try {
              const more = await api('chara/user/temple/' + key + '/' + k + '/10000', { timeout: 45000 });
              const arr = (more && more.Items) || [];
              if (arr.length) items.push.apply(items, arr);
            } catch (e) {}
          });
        }
        if (total && items.length < total) {
          const full = await pinLoadPaged(key, total);
          if (full.length > items.length) items = full;
        }
        const seen = new Set();
        const uniq = [];
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const cid = it && it.CharacterId != null ? String(it.CharacterId) : '';
          if (!cid || seen.has(cid)) continue;
          seen.add(cid);
          uniq.push(it);
        }
        items = uniq;
        pinAll.user = String(me).toLowerCase();
        pinAll.items = items;
        pinAll.at = Date.now();
        pinAll.failAt = 0;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (!it) continue;
          const cid = String(it.CharacterId);
          if (TUI.pins.indexOf(cid) >= 0 || TUI.bots.indexOf(cid) >= 0) pinSnapSet(cid, it);
        }
        if (pinUiRefresh) pinUiRefresh();
        return items;
      } catch (e) {
        pinAll.failAt = Date.now();
        return null;
      } finally {
        pinAll.busy = null;
        pinAll.busyUser = '';
      }
    })();
    pinAll.busy = p;
    return p;
  }

  function pinOrdered(all) {
    const used = Object.create(null);
    const head = [];
    if (TUI.on) {
      for (let i = 0; i < TUI.pins.length; i++) {
        const cid = TUI.pins[i];
        if (used[cid]) continue;
        const it = all.find((x) => x && String(x.CharacterId) === cid) || pinSnapGet(cid);
        if (!it) continue;
        used[cid] = 1;
        head.push(it);
      }
    }
    const rest = [];
    for (let i = 0; i < all.length; i++) {
      const it = all[i];
      if (!it) continue;
      const cid = String(it.CharacterId);
      if (used[cid]) continue;
      used[cid] = 1;
      rest.push(it);
    }
    if (TUI.bots.length) {
      const tail = [];
      TUI.bots.forEach((cid) => {
        const at = rest.findIndex((x) => x && String(x.CharacterId) === cid);
        if (at >= 0) {
          tail.push(rest[at]);
          rest.splice(at, 1);
          return;
        }
        const snap = pinSnapGet(cid);
        if (snap) tail.push(snap);
      });
      return head.concat(rest, tail);
    }
    return head.concat(rest);
  }

  function pinParseUrl(url) {
    const s = String(url || '');
    if (!/chara\/user\/temple\//.test(s)) return null;
    if (/[?&]keyword=/.test(s)) return null;
    const m = /chara\/user\/temple\/([^/?#]+)\/(\d+)\/(\d+)/.exec(s);
    if (!m) return null;
    let u = m[1];
    try {
      u = decodeURIComponent(u);
    } catch (e) {}
    return { user: u, page: Number(m[2]) || 1, size: Number(m[3]) || 24 };
  }

  function pinIsMe(u) {
    if (!u) return false;
    const me = selfKeyCache || guessedUsername();
    if (me) return String(u).toLowerCase() === String(me).toLowerCase();
    return !!pinAll.user && String(u).toLowerCase() === pinAll.user;
  }

  const pinPages = Object.create(null); // { [page]: { items, at } }
  function pinRemember(value, info) {
    try {
      if (value && Array.isArray(value.Items) && info) {
        pinPages[info.page] = { items: value.Items.slice(), at: Date.now() };
      }
    } catch (e) {}
  }

  function pinRewriteValue(value, info, ordered) {
    if (!info || !value || !Array.isArray(value.Items) || !ordered || !ordered.length) return false;
    const size = Math.max(1, info.size || value.Items.length || 24);
    const start = (Math.max(1, info.page) - 1) * size;
    const pageItems = ordered.slice(start, start + size);
    if (!pageItems.length) {
      value.Items = [];
      value.TotalItems = ordered.length;
      value.CurrentPage = info.page;
      value.ItemsPerPage = size;
      value.TotalPages = Math.max(1, Math.ceil(ordered.length / size));
      return true;
    }
    const same =
      pageItems.length === value.Items.length &&
      pageItems.every((x, i) => x && value.Items[i] && x.CharacterId === value.Items[i].CharacterId);
    if (same) return false;
    value.Items = pageItems;
    value.TotalItems = ordered.length;
    value.CurrentPage = info.page;
    value.ItemsPerPage = size;
    value.TotalPages = Math.max(1, Math.ceil(ordered.length / size));
    return true;
  }

  function pinRewriteObj(obj, url) {
    try {
      const info = pinParseUrl(url);
      if (!info || !pinIsMe(info.user)) return null;
      if (!obj || !obj.Value) return null;
      const copy = Object.assign({}, obj, { Value: Object.assign({}, obj.Value) });
      if (!pinOn()) {
        pinRemember(copy.Value, info); // 没开置顶也要记：卡片上的按钮要认人
        return null;
      }
      const all = pinAllGet();
      if (!all) {
        pinRemember(copy.Value, info);
        pinAllLoad();
        return null;
      }
      const changed = pinRewriteValue(copy.Value, info, pinOrdered(all));
      pinRemember(copy.Value, info);
      return changed ? copy : null;
    } catch (e) {
      return null;
    }
  }

  function pinRewriteText(raw, url) {
    try {
      const info = pinParseUrl(url);
      if (!info || !pinIsMe(info.user)) return null;
      if (typeof raw !== 'string' || raw.indexOf('Items') < 0) return null;
      const data = JSON.parse(raw);
      if (!data || !data.Value) return null;
      if (!pinOn()) {
        pinRemember(data.Value, info);
        return null;
      }
      const all = pinAllGet();
      if (!all) {
        pinRemember(data.Value, info);
        pinAllLoad(); // 后台补，下一页就准了；这一页先不动，免得出现空洞
        return null;
      }
      const changed = pinRewriteValue(data.Value, info, pinOrdered(all));
      pinRemember(data.Value, info);
      return changed ? JSON.stringify(data) : null;
    } catch (e) {
      return null;
    }
  }

  function pinHookXhr(xhr, P, url) {
    const wrap = (desc) =>
      function () {
        const raw = desc.get.call(this);
        if (typeof raw === 'string') {
          if (this.__tgtkPinRaw === raw) return this.__tgtkPinOut;
          const out = pinRewriteText(raw, url);
          this.__tgtkPinRaw = raw;
          this.__tgtkPinOut = out === null ? raw : out;
          return this.__tgtkPinOut;
        }
        if (raw && typeof raw === 'object') {
          if (this.__tgtkPinRaw === raw) return this.__tgtkPinOut;
          const out = pinRewriteObj(raw, url);
          this.__tgtkPinRaw = raw;
          this.__tgtkPinOut = out === null ? raw : out;
          return this.__tgtkPinOut;
        }
        return raw;
      };
    try {
      const dT = Object.getOwnPropertyDescriptor(P, 'responseText');
      const dR = Object.getOwnPropertyDescriptor(P, 'response');
      if (dT && dT.get) Object.defineProperty(xhr, 'responseText', { configurable: true, get: wrap(dT) });
      if (dR && dR.get) Object.defineProperty(xhr, 'response', { configurable: true, get: wrap(dR) });
    } catch (e) {}
  }

  function pinInstallWin(win) {
    if (!win) return;
    try {
      if (win.__tgtkPinHooked) return;
      win.__tgtkPinHooked = true;
    } catch (e) {
      return;
    }

    try {
      const orig = win.fetch;
      if (typeof orig === 'function') {
        win.fetch = function (input) {
          const res = orig.apply(this, arguments);
          try {
            if (pinApiDepth > 0) return res; // 自己发的请求，别自己改自己
            const url = typeof input === 'string' ? input : (input && input.url) || '';
            if (!pinParseUrl(url)) return res;
            return res.then((r) => {
              try {
                if (!r || !r.ok || typeof r.clone !== 'function') return r;
                return r
                  .clone()
                  .text()
                  .then(async (txt) => {
                    if (pinOn() && !pinAllGet()) {
                      try {
                        await pinAllLoad();
                      } catch (e) {}
                    }
                    const out = pinRewriteText(txt, url);
                    if (out === null || typeof win.Response !== 'function') return r;
                    return new win.Response(out, { status: r.status, statusText: r.statusText, headers: r.headers });
                  })
                  .catch(() => r);
              } catch (e) {
                return r;
              }
            });
          } catch (e) {
            return res;
          }
        };
      }
    } catch (e) {}

    try {
      const P = win.XMLHttpRequest && win.XMLHttpRequest.prototype;
      if (!P || !P.open || !P.send) return;
      const open = P.open;
      const send = P.send;
      P.open = function (m, u) {
        try {
          this.__tgtkUrl = String(u || '');
        } catch (e) {}
        return open.apply(this, arguments);
      };
      P.send = function () {
        const args = arguments;
        const self = this;
        let defer = false;
        try {
          const u = self.__tgtkUrl || '';
          const info = u ? pinParseUrl(u) : null;
          if (info && pinApiDepth === 0 && pinIsMe(info.user)) {
            pinHookXhr(self, P, u);
            if (pinOn() && !pinAllGet()) defer = true;
          }
        } catch (e) {}
        if (!defer) return send.apply(self, args);
        let done = false;
        const go = () => {
          if (done) return;
          done = true;
          try {
            send.apply(self, args);
          } catch (e) {}
        };
        setTimeout(go, 2500);
        pinAllLoad().then(go, go);
        return undefined;
      };
    } catch (e) {}
  }

  function pinInstallAll() {
    for (const d of allDocs()) {
      try {
        pinInstallWin(d.defaultView);
      } catch (e) {}
    }
  }

  let pinSnapBusy = false;
  let pinSnapAt = 0;
  let pinKickAt = 0; // 「快照缺失就补一次」的节流，1 分钟最多一次
  const pinTried = Object.create(null); // 查过一次没查到就歇 5 分钟，免得一直空转
  function pinRefreshSnaps(force) {
    const pins = pinList().concat(botList());
    if (!pins.length || pinSnapBusy) return;
    const now = Date.now();
    if (!force && pinSnapAt && now - pinSnapAt < 30000) return;
    const stale = pins.filter((cid) => {
      const s = pinSnap[cid];
      if (!force && pinTried[cid] && now - pinTried[cid] < 5 * 60 * 1000) return false;
      return force || !s || !s.obj || now - (s.at || 0) > 10 * 60 * 1000;
    });
    if (!stale.length) return;
    pinSnapAt = now;
    pinSnapBusy = true;
    mapLimit(stale, 3, async (cid) => {
      pinTried[cid] = Date.now();
      try {
        const t = await findMyTemple(cid);
        if (t) {
          pinSnapSet(cid, t);
          delete pinTried[cid];
        }
      } catch (e) {}
    })
      .catch(() => {})
      .then(() => {
        pinSnapBusy = false;
        if (pinUiRefresh) pinUiRefresh();
      });
  }

  let pinUiRefresh = null; // buildUI 里挂上，操作后刷新「置顶顺序」列表
  const pinNameTried = Object.create(null); // 名字只补一次，补不到就算了

  function pinToggle(cid, obj) {
    const id = String(cid || '');
    if (!/^\d+$/.test(id)) return false;
    const list = pinList();
    const at = list.indexOf(id);
    let on;
    if (at >= 0) {
      list.splice(at, 1);
      on = false;
    } else {
      list.push(id);
      on = true;
    }
    if (on && obj) pinSnapSet(id, obj);
    TUI.pins = list;
    if (on && TUI.bots.indexOf(id) >= 0) TUI.bots = TUI.bots.filter((x) => x !== id);
    tuiSave();
    if (on) pinRefreshSnaps();
    if (pinUiRefresh) pinUiRefresh();
    return on;
  }

  function botToggle(cid, obj) {
    const id = String(cid || '');
    if (!/^\d+$/.test(id)) return false;
    const list = botList();
    const at = list.indexOf(id);
    let on;
    if (at >= 0) {
      list.splice(at, 1);
      on = false;
    } else {
      list.push(id);
      on = true;
    }
    if (on && obj) pinSnapSet(id, obj);
    TUI.bots = list;
    if (on && TUI.pins.indexOf(id) >= 0) TUI.pins = TUI.pins.filter((x) => x !== id);
    tuiSave();
    if (on) pinRefreshSnaps();
    if (pinUiRefresh) pinUiRefresh();
    return on;
  }

  function pinMove(cid, delta) {
    const list = pinList();
    const i = list.indexOf(String(cid));
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
    TUI.pins = list;
    tuiSave();
    if (pinUiRefresh) pinUiRefresh();
  }

  function pinReorder(from, to, before) {
    const a = String(from);
    const b = String(to);
    if (!a || !b || a === b) return;
    const list = pinList();
    const i = list.indexOf(a);
    let j = list.indexOf(b);
    if (i < 0 || j < 0) return;
    const who = list.splice(i, 1)[0];
    if (i < j) j -= 1; // 自己先被抽走了，目标下标要前移一位
    list.splice(before ? j : j + 1, 0, who);
    TUI.pins = list;
    tuiSave();
    if (pinUiRefresh) pinUiRefresh();
  }

  let pinDragFrom = '';
  function pinClearDrop() {
    try {
      HDOC.querySelectorAll('.tgtk-drop-before,.tgtk-drop-after').forEach((el) => {
        el.classList.remove('tgtk-drop-before', 'tgtk-drop-after');
      });
    } catch (e) {}
  }

  function pinDragBind(row, cid, box) {
    const grip = row.querySelector && row.querySelector('.tgtk-grip');
    let armed = false;
    if (grip) {
      grip.addEventListener('pointerdown', () => {
        armed = true;
      });
      grip.addEventListener('pointerup', () => {
        armed = false;
      });
      grip.addEventListener('pointercancel', () => {
        armed = false;
      });
    }
    row.addEventListener('dragstart', (e) => {
      if (!armed) {
        e.preventDefault();
        return;
      }
      pinDragFrom = String(cid);
      row.classList.add('tgtk-pindragging');
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(cid));
      } catch (err) {}
    });
    row.addEventListener('dragend', () => {
      armed = false;
      pinDragFrom = '';
      row.classList.remove('tgtk-pindragging');
      pinClearDrop();
    });
    row.addEventListener('dragover', (e) => {
      if (!pinDragFrom || pinDragFrom === String(cid)) return;
      e.preventDefault();
      try {
        e.dataTransfer.dropEffect = 'move';
      } catch (err) {}
      const r = row.getBoundingClientRect();
      const before = e.clientY < r.top + r.height / 2;
      pinClearDrop();
      row.classList.add(before ? 'tgtk-drop-before' : 'tgtk-drop-after');
      if (box) {
        const br = box.getBoundingClientRect();
        if (e.clientY < br.top + 18) box.scrollTop -= 9;
        else if (e.clientY > br.bottom - 18) box.scrollTop += 9;
      }
    });
    row.addEventListener('dragleave', () => {
      row.classList.remove('tgtk-drop-before', 'tgtk-drop-after');
    });
    row.addEventListener('drop', (e) => {
      if (!pinDragFrom) return;
      e.preventDefault();
      const r = row.getBoundingClientRect();
      const before = e.clientY < r.top + r.height / 2;
      const from = pinDragFrom;
      pinDragFrom = '';
      row.classList.remove('tgtk-pindragging');
      pinClearDrop();
      pinReorder(from, cid, before);
    });
  }

  const PIN_CSS =
    'button.tgtk-pinpill{opacity:0 !important;pointer-events:none !important;transition:opacity .12s ease}\n' +
    '.tgtk-pincard:hover button.tgtk-pinpill,button.tgtk-pinpill:focus-visible{opacity:1 !important;pointer-events:auto !important}\n' +
    'button.tgtk-pinpill svg{display:block;pointer-events:none}';

  function pinStyleFor(doc) {
    if (!doc || doc.__tgtkPinCss) return;
    try {
      doc.__tgtkPinCss = true;
      const st = doc.createElement('style');
      st.id = 'tgtk-pin-css';
      st.textContent = PIN_CSS;
      (doc.head || doc.documentElement).appendChild(st);
    } catch (e) {}
  }

  const PIN_SVG =
    '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">' +
    '<path d="M9.7 1.4 14.6 6.3l-1.4 1.4-1-.2-2.9 2.9.2 1.9-1.3 1.3-2.6-2.6-2.6-2.6L4.3 9.4l1.9.2L9.1 6.7l-.2-1z" fill="currentColor"/>' +
    '<path d="M4.9 11.1 2.2 13.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg>';

  function pinCoverKey(url) {
    const m = /\/cover\/([0-9a-zA-Z]+)\.(?:jpe?g|png|webp|gif)/i.exec(String(url || ''));
    return m ? m[1].toLowerCase() : '';
  }

  function pinCardCover(card) {
    try {
      const bg = card.style && card.style.backgroundImage;
      if (bg && /url\(/.test(bg)) return bg;
      const kids = card.querySelectorAll ? card.querySelectorAll('*') : [];
      for (let i = 0; i < kids.length && i < 14; i++) {
        const st = kids[i].style && kids[i].style.backgroundImage;
        if (st && /cover\//.test(st)) return st;
      }
      const img = card.querySelector && card.querySelector('img');
      if (img) return img.getAttribute('src') || img.currentSrc || img.src || '';
    } catch (e) {}
    return '';
  }

  let pinCoverIdx = { at: 0, map: null };
  function pinCoverIndex() {
    const all = pinAllGet();
    if (!all) return null;
    if (pinCoverIdx.at === pinAll.at && pinCoverIdx.map) return pinCoverIdx.map;
    const m = Object.create(null);
    for (let i = 0; i < all.length; i++) {
      const it = all[i];
      const k = it && pinCoverKey(it.Cover);
      if (k) m[k] = String(it.CharacterId);
    }
    pinCoverIdx = { at: pinAll.at, map: m };
    return m;
  }

  function pinCidByCover(key) {
    if (!key) return '';
    for (const p in pinPages) {
      const arr = (pinPages[p] && pinPages[p].items) || [];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] && pinCoverKey(arr[i].Cover) === key) return String(arr[i].CharacterId);
      }
    }
    const idx = pinCoverIndex();
    if (idx && idx[key]) return idx[key];
    for (const cid in pinSnap) {
      const o = pinSnap[cid] && pinSnap[cid].obj;
      if (o && pinCoverKey(o.Cover) === key) return String(cid);
    }
    return '';
  }

  function pinCidByIndex(grid, card) {
    const kids = grid && grid.children;
    if (!kids) return '';
    const idx = Array.prototype.indexOf.call(kids, card);
    if (idx < 0) return '';
    let best = null;
    for (const p in pinPages) {
      const rec = pinPages[p];
      if (!rec || !rec.items) continue;
      if (rec.items.length !== kids.length) continue;
      if (!best || rec.at > best.at) best = rec;
    }
    return best && best.items[idx] ? String(best.items[idx].CharacterId) : '';
  }

  function pinCardCid(card) {
    if (!card || !card.getAttribute) return '';
    const raw = String(card.getAttribute('data-id') || '');
    let m = raw.match(/^\d+#(\d+)$/);
    if (m) return m[1];
    m = raw.match(/^(\d+)_(\d+)$/); // LINK 卡片：cid_uid
    if (m) return m[1];
    const v = card.getAttribute('data-character-id') || card.getAttribute('data-temple-character-id');
    if (/^\d+$/.test(v || '')) return v;
    const a = card.querySelector && card.querySelector('a[href*="/character/"]');
    if (a) {
      const mm = (a.getAttribute('href') || '').match(/\/character\/(\d+)/);
      if (mm) return mm[1];
    }
    return '';
  }

  function pinCoverBox(card) {
    try {
      const cr = card.getBoundingClientRect();
      if (!cr.width || !cr.height) return null;
      const minArea = cr.width * cr.height * 0.22;
      const kids = card.querySelectorAll ? card.querySelectorAll('div,a,span,img,picture,canvas') : [];
      let best = null;
      let bestArea = 0;
      for (let i = 0; i < kids.length && i < 32; i++) {
        const el = kids[i];
        if (!el || (el.classList && el.classList.contains('tgtk-pinpill'))) continue;
        const isImg = el.tagName === 'IMG';
        const isCv = el.tagName === 'CANVAS';
        const st = el.style && el.style.backgroundImage;
        const cls = String((el && el.className) || '');
        const hinted = (st && st !== 'none') || isImg || isCv || /(^|\s)(cover|poster|art|thumb)/i.test(cls);
        if (!hinted) continue;
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        if (area >= minArea && area > bestArea) {
          bestArea = area;
          best = el;
        }
      }
      if (best) {
        return (best.tagName === 'IMG' || best.tagName === 'CANVAS')
          ? best.parentElement || best : best;
      }
      const boxes = card.querySelectorAll ? card.querySelectorAll('div') : [];
      for (let i = 0; i < boxes.length && i < 14; i++) {
        const el = boxes[i];
        const r = el.getBoundingClientRect();
        if (r.width * r.height < minArea) continue;
        const view = (el.ownerDocument && el.ownerDocument.defaultView) || window;
        const bg = view.getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none' && /url\(/.test(bg)) return el;
      }
    } catch (e) {}
    return null;
  }

  function pinNameBox(card) {
    try {
      const el = card.querySelector && card.querySelector('a[href*="/character/"], .name, .title');
      if (!el || !el.getBoundingClientRect) return null;
      const r = el.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      if (!r.height || r.height > cr.height * 0.5) return null;
      return r;
    } catch (e) {}
    return null;
  }

  function pinCanvasIn(box) {
    try {
      if (!box || !box.querySelector) return null;
      const cv = box.querySelector('canvas');
      return (cv && cv.width && cv.height) ? cv : null;
    } catch (e) { return null; }
  }

  function pinPillFor(card, cid) {
    let pill = card.querySelector ? card.querySelector('button.tgtk-pinpill') : null;
    let box = null;
    try {
      box = card.__tgtkPinHost || null;
    } catch (e) {}
    if (!box || !box.isConnected) {
      const cooling = card.__tgtkPinAt && Date.now() - card.__tgtkPinAt < 5000;
      box = cooling ? null : pinCoverBox(card);
      try {
        card.__tgtkPinHost = box || null;
        card.__tgtkPinAt = Date.now();
      } catch (e) {}
    }
    const host = box || card;
    if (!pill) {
      const doc = card.ownerDocument || HDOC;
      pinStyleFor(doc);
      pill = doc.createElement('button');
      pill.type = 'button';
      pill.className = 'tgtk-pinpill';
      pill.style.cssText =
        'position:absolute;left:5px;bottom:5px;z-index:9;display:inline-flex;align-items:center;' +
        'justify-content:center;width:20px;height:20px;min-width:0;min-height:0;padding:0;margin:0;' +
        'border-radius:50%;border:1px solid rgba(255,255,255,.62);background:rgba(22,16,24,.62);' +
        'color:#fff;line-height:0;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.28);' +
        '-webkit-appearance:none;appearance:none;box-sizing:border-box;font-size:0';
      pill.innerHTML = PIN_SVG;
      pill.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          const on = pinToggle(cid, null);
          pinToast(on ? '已置顶，刷新个人页生效' : '已取消置顶，刷新个人页生效');
        },
        true
      );
      pill.addEventListener('pointerdown', (e) => e.stopPropagation(), true);
      pill.addEventListener('mousedown', (e) => e.stopPropagation(), true);
    }
    if (pill.parentNode !== host) {
      try {
        host.appendChild(pill);
      } catch (e) {}
    }
    if (card.classList) card.classList.add('tgtk-pincard');
    try {
      const doc = card.ownerDocument || HDOC;
      const cs = (doc.defaultView || window).getComputedStyle(host);
      if (cs.position === 'static') host.style.position = 'relative';
    } catch (e) {}
    try {
      if (box) {
        const cv = pinCanvasIn(box);
        if (cv) {
          const br = box.getBoundingClientRect();
          const r = cv.getBoundingClientRect();
          const db = Math.max(0, Math.round(br.bottom - r.bottom));
          const dr = Math.max(0, Math.round(br.right - r.right));
          pill.style.top = 'auto';
          pill.style.bottom = (db + 4) + 'px';
          pill.style.left = 'auto';
          pill.style.right = (dr + 4) + 'px';
          pill.style.marginLeft = '0';
          pill.style.marginRight = '0';
        } else {
          pill.style.top = 'auto';
          pill.style.bottom = '4px';
          pill.style.left = '4px';
          pill.style.right = 'auto';
          pill.style.marginLeft = '0';
          pill.style.marginRight = '0';
        }
      } else {
        const nb = pinNameBox(card);
        let top = 0;
        if (nb) {
          const cr = card.getBoundingClientRect();
          top = Math.max(2, Math.round(nb.top - cr.top) - 24);
        }
        if (nb && top > 2) {
          pill.style.left = '4px';
          pill.style.right = 'auto';
          pill.style.marginLeft = '0';
          pill.style.marginRight = '0';
          pill.style.top = top + 'px';
          pill.style.bottom = 'auto';
        } else {
          pill.style.left = '4px';
          pill.style.right = 'auto';
          pill.style.marginLeft = '0';
          pill.style.marginRight = '0';
          pill.style.top = 'auto';
          pill.style.bottom = '30px';
        }
      }
    } catch (e) {}
    const on = pinHas(cid);
    pill.style.background = on ? 'rgba(214,86,142,.95)' : 'rgba(22,16,24,.62)';
    pill.style.borderColor = on ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.62)';
    const tip = on ? '取消置顶' : '置顶';
    if (pill.title !== tip) pill.title = tip;
    if (pill.getAttribute('aria-label') !== tip) pill.setAttribute('aria-label', tip);
  }

  let pinDecorAt = 0;
  function pinDecorTick() {
    const now = Date.now();
    if (now - pinDecorAt < 900) return; // 站点每次重绘都会把按钮冲掉，慢一点补，别每轮都扫
    pinDecorAt = now;
    for (const d of allDocs()) {
      try {
        d.querySelectorAll('#grail .temple_list .item').forEach((card) => {
          const cid = pinCardCid(card) || pinCidByCover(pinCoverKey(pinCardCover(card)));
          if (cid) pinPillFor(card, cid);
        });
      } catch (e) {}
      try {
        for (const host of d.querySelectorAll('#tg-user-tinygrail, #tg-modal')) {
          for (const g of host.querySelectorAll('div.grid.w-full.gap-4')) {
            const first = g.firstElementChild;
            if (!first || !first.classList || !first.classList.contains('min-w-0')) continue;
            const n = g.children.length;
            let okByCount = false;
            for (const p in pinPages) {
              if (pinPages[p] && pinPages[p].items && pinPages[p].items.length === n) {
                okByCount = true;
                break;
              }
            }
            for (const card of g.children) {
              if (!card || !card.hasAttribute) continue;
              if (!okByCount && !card.hasAttribute('data-user-name') && !card.hasAttribute('data-character-id')) {
                continue;
              }
              const cid =
                pinCardCid(card) ||
                pinCidByCover(pinCoverKey(pinCardCover(card))) ||
                (okByCount ? pinCidByIndex(g, card) : '');
              if (cid) pinPillFor(card, cid);
            }
          }
        }
      } catch (e) {}
    }
  }

  let pinToastEl = null;
  let pinToastTimer = 0;
  function pinToast(text) {
    try {
      if (!pinToastEl || !pinToastEl.isConnected) {
        pinToastEl = h('div', {
          class: 'tgtk-pintoast',
          'data-theme': S.theme === 'light' ? 'light' : 'dark',
        });
        (HDOC.body || HDOC.documentElement).appendChild(pinToastEl);
      }
      pinToastEl.textContent = text;
      pinToastEl.classList.add('tgtk-toast-on');
      clearTimeout(pinToastTimer);
      pinToastTimer = setTimeout(() => pinToastEl.classList.remove('tgtk-toast-on'), 1600);
    } catch (e) {}
  }

  function gxDivHook() {
    for (const d of allDocs()) {
      if (!d || !d.querySelector || d.__tgtkDivBound) continue;
      try {
        d.__tgtkDivBound = true;
        d.addEventListener(
          'click',
          function (e) {
            const t = e.target;
            if (!t || !t.closest) return;
            const btn = t.closest('#testButton');
            if (!btn || !d.querySelector('#grailBox2 .user_info')) return;
            e.preventDefault();
            e.stopPropagation();
            gxDivShow(d);
          },
          true
        );
      } catch (e) {}
    }
  }

  function gxDivRow(doc, label, value, cls) {
    return tgH(
      doc,
      'div',
      { class: 'tgtk-div-row' + (cls ? ' ' + cls : '') },
      tgH(doc, 'span', null, label),
      tgH(doc, 'b', null, value)
    );
  }

  function gxDivShow(doc) {
    let old = null;
    try { old = doc.getElementById('tgtk-div'); } catch (e) {}
    if (old) old.remove();
    const dlg = tgH(doc, 'dialog', { id: 'tgtk-div', class: 'tgtk-div', 'data-tgtk': '1' });
    const close = () => {
      try { if (dlg.close) dlg.close(); } catch (e) {}
      try { dlg.remove(); } catch (e) {}
    };
    const body = tgH(doc, 'div', { class: 'tgtk-div-body' }, tgH(doc, 'div', { class: 'tgtk-div-msg' }, '读取中…'));
    dlg.appendChild(
      tgH(
        doc,
        'div',
        { class: 'tgtk-div-hd' },
        tgH(doc, 'b', null, '股息预测'),
        tgH(doc, 'button', { class: 'tgtk-div-x', type: 'button', title: '关闭', onclick: close }, '×')
      )
    );
    dlg.appendChild(body);
    (doc.body || doc.documentElement).appendChild(dlg);
    try {
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    } catch (e) {
      try { dlg.setAttribute('open', ''); } catch (err) {}
    }
    try { dlg.focus({ preventScroll: true }); } catch (e) {}
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) close();
    });

    api('event/share/bonus/test')
      .then((v) => {
        const share = num(v && v.Share);
        const tax = num(v && v.Tax);
        const net = Math.max(0, share - tax);
        const deg = share > 0 ? Math.round((net / share) * 3600) / 10 : 0;
        const donut = tgH(doc, 'div', { class: 'tgtk-div-donut' });
        try { donut.style.setProperty('--tgtk-deg', deg + 'deg'); } catch (e) {}
        body.textContent = '';
        body.appendChild(
          tgH(
            doc,
            'div',
            { class: 'tgtk-div-top' },
            donut,
            tgH(
              doc,
              'div',
              { class: 'tgtk-div-legend' },
              tgH(doc, 'span', null, tgH(doc, 'i', { class: 'pk' }), '税后收入'),
              tgH(doc, 'span', null, tgH(doc, 'i', { class: 'bl' }), '个人所得税')
            )
          )
        );
        body.appendChild(
          tgH(
            doc,
            'div',
            { class: 'tgtk-div-rows' },
            gxDivRow(doc, '计息股份', fmt(num(v && v.Total)) + ' 股'),
            gxDivRow(doc, '圣殿数量', fmt(num(v && v.Temples)) + ' 座'),
            gxDivRow(doc, '预期股息', '₵' + fmt(share, 2)),
            gxDivRow(doc, '个人所得税', '₵' + fmt(tax, 2), 'tgtk-div-tax'),
            gxDivRow(doc, '税率', (share > 0 ? Math.round((tax / share) * 100) : 0) + '%')
          )
        );
        body.appendChild(
          tgH(
            doc,
            'div',
            { class: 'tgtk-div-net' },
            tgH(doc, 'span', null, '税后收入'),
            tgH(doc, 'b', null, '₵' + fmt(net, 2))
          )
        );
      })
      .catch((err) => {
        body.textContent = '';
        body.appendChild(
          tgH(doc, 'div', { class: 'tgtk-div-msg' }, '读取失败：' + String((err && err.message) || err || '未知错误'))
        );
      });
  }

  function gxIcoNextNeed(box) {
    const bold = box.querySelector('.desc .bold');
    const t = (bold && bold.textContent) || '';
    const m = /投入\s*[₵¥]?\s*([\d,]+)/.exec(t);
    if (m) return num(String(m[1]).replace(/,/g, ''));
    const tm = /已筹集\s*[₵¥]?\s*([\d,]+)/.exec(t);
    if (!tm) return 0;
    const total = num(String(tm[1]).replace(/,/g, ''));
    const pre = box.querySelector('.predicted .tag');
    const lm = /level\s*(\d+)/i.exec((pre && pre.textContent) || '');
    const lv = lm ? num(lm[1]) : 0;
    let next = 600000;
    for (let i = 1; i <= lv; i++) next += Math.pow(i + 1, 2) * 100000;
    return Math.max(0, next - total);
  }

  function gxIcoNextBtn() {
    for (const d of allDocs()) {
      let box = null;
      try { box = d.getElementById('grailBox'); } catch (e) { continue; }
      if (!box || !box.querySelector || !box.querySelector('.predicted')) continue; // 只认 ICO 页
      const descs = box.querySelectorAll('.desc');
      let desc = null;
      for (let i = 0; i < descs.length; i++) {
        if (/追加注资请在下方输入金额/.test(descs[i].textContent || '')) { desc = descs[i]; break; }
      }
      if (!desc || desc.querySelector('.tgtk-iconext')) continue;
      const btn = tgH(
        d,
        'button',
        { class: 'tgtk-iconext', type: 'button', title: '自动填入「升到下一等级」还差的金额' },
        '下一级'
      );
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const trade = box.querySelector('.trade');
        const input = trade && trade.querySelector('input.money');
        if (!input) return;
        const need = gxIcoNextNeed(box);
        input.value = String(Math.max(5000, Math.ceil(need > 0 ? need : 0)));
        const win = d.defaultView || window;
        try { input.dispatchEvent(new win.Event('input', { bubbles: true })); } catch (err) {}
        try { input.dispatchEvent(new win.Event('change', { bubbles: true })); } catch (err) {}
      });
      desc.appendChild(btn);
    }
  }

  function gxIcoListedTag() {
    for (const d of allDocs()) {
      let box = null;
      try {
        box = d.getElementById('grailBox');
      } catch (e) {
        continue;
      }
      if (!box || !box.querySelector) continue;
      const pred = box.querySelector('.predicted');
      if (!pred) continue;
      const tagEl = pred.querySelector('.tag');
      const lm = /level\s*(\d+)/i.exec((tagEl && tagEl.textContent) || '');
      const lv = lm ? num(lm[1]) : 0;
      if (!lv) continue;
      const want = '上市 Lv' + icoListedLevel(lv);
      let tag = pred.querySelector('.tgtk-icolv');
      if (!tag) {
        tag = tgH(d, 'span', { class: 'tgtk-icolv', title: '按 ICO 等级推算的上市后角色等级' }, want);
        let host = pred;
        let len = Infinity;
        for (const el of pred.querySelectorAll('div,span,em,p,b,i')) {
          const t = el.textContent || '';
          if (!/发行价/.test(t)) continue;
          if (t.length < len) {
            len = t.length;
            host = el;
          }
        }
        try {
          host.appendChild(tag);
        } catch (e) {
          continue;
        }
      }
      if (tag.textContent !== want) tag.textContent = want;
    }
  }

  function gxIcoPrice(box) {
    let t = '';
    const head = box.querySelector('#tg-ico-box-header') || box.querySelector('.predicted');
    if (head) t = head.textContent || '';
    if (!/发行价/.test(t)) t = box.textContent || '';
    const m = /发行价\s*[：:]?\s*[₵¥]?\s*([\d,]+(?:\.\d+)?)/.exec(t);
    const p = m ? num(String(m[1]).replace(/,/g, '')) : 0;
    return p > 0 ? p : 0;
  }

  function tgHovering(el) {
    try {
      if (!el || !el.matches) return true;
      return !!el.matches(':hover');
    } catch (e) {
      return true;
    }
  }

  function tgMarkShares(el, money, shareText) {
    try {
      if (!el || !el.getAttribute) return;
      if (!money || /股/.test(money)) return;
      if (el.getAttribute('data-tgtk-money') === money && el.getAttribute('data-tgtk-shares') === shareText) return;
      el.setAttribute('data-tgtk-money', money);
      el.setAttribute('data-tgtk-shares', shareText);
      if (!el.classList.contains('tgtk-share-on')) el.textContent = money;
    } catch (e) {}
  }

  const TG_BADGE_RE = /^[+＋]\s*\d[\d,]*(?:\.\d+)?\s*$/;
  const TG_MONEY_RE = /^[+＋]?\s*[₵¥]?\s*\d[\d,]*(?:\.\d+)?\s*$/;

  const TG_PRICE_RE = /发行价\s*[：:]?\s*[₵¥]?\s*([\d,]+(?:\.\d+)?)/;
  function tgSharePriceFrom(el) {
    let p = el;
    for (let i = 0; p && p.nodeType === 1 && i < 18; i++, p = p.parentElement) {
      const t = String(p.textContent || '');
      if (t.length > 20000 || !/发行价/.test(t)) continue;
      const m = TG_PRICE_RE.exec(t);
      const price = m ? num(String(m[1]).replace(/,/g, '')) : 0;
      if (price > 0) return price;
    }
    try {
      const doc = el.ownerDocument;
      const cands = doc.querySelectorAll('.predicted, [id*="ico-box-header" i], [id*="ico-header" i]');
      for (let i = 0; i < cands.length; i++) {
        const t = String(cands[i].textContent || '');
        if (t.length > 800) continue;
        const m = TG_PRICE_RE.exec(t);
        const price = m ? num(String(m[1]).replace(/,/g, '')) : 0;
        if (price > 0) return price;
      }
    } catch (e) {}
    return 0;
  }

  function tgSharePath(e) {
    const out = [];
    let path = null;
    try { if (typeof e.composedPath === 'function') path = e.composedPath(); } catch (err) {}
    const src = path && path.length ? path : [];
    for (let i = 0; i < src.length && out.length < 32; i++) {
      const n = src[i];
      if (n && n.nodeType === 1) out.push(n);
    }
    let p = e.target;
    while (p && p.nodeType === 1 && out.length < 40) {
      if (!out.includes(p)) out.push(p);
      p = p.parentElement;
    }
    return out;
  }

  function tgShareEnter(el, price, money) {
    if (!el || !price || !money) return;
    if (!TG_MONEY_RE.test(money) || /股/.test(money)) return;
    const amt = num(money.replace(/[^\d.]/g, ''));
    if (!(amt > 0) || !isFinite(amt)) return;
    const s = '+' + fmt(Math.round(amt / price)) + '股';
    el.setAttribute('data-tgtk-money', money);
    el.setAttribute('data-tgtk-shares', s);
    el.textContent = s;
    el.classList.add('tgtk-share-on');
  }

  function tgShareLeave(el) {
    if (!el) return;
    const m = el.getAttribute('data-tgtk-money');
    if (m != null) el.textContent = m;
    el.classList.remove('tgtk-share-on');
  }

  function tgBindShares(doc) {
    if (!doc || doc.__tgtkSharesBound) return;
    try {
      doc.__tgtkSharesBound = true;
      doc.addEventListener('mouseover', function (e) {
        const path = tgSharePath(e);
        for (let i = 0; i < path.length; i++) {
          const el = path[i];
          if (!el.hasAttribute || !el.hasAttribute('data-tgtk-shares')) continue;
          if (el.classList.contains('tgtk-share-on')) return;
          const s = el.getAttribute('data-tgtk-shares');
          const m = el.getAttribute('data-tgtk-money');
          if (!s || !m || String(el.textContent || '').trim() !== m) return;
          el.textContent = s;
          el.classList.add('tgtk-share-on');
          return;
        }
        for (let i = 0; i < path.length; i++) {
          const el = path[i];
          if (!el.children || el.children.length) continue;
          const t = String(el.textContent || '').trim();
          if (!TG_BADGE_RE.test(t)) continue;
          const price = tgSharePriceFrom(el);
          if (price) tgShareEnter(el, price, t);
          return;
        }
      }, true);
      doc.addEventListener('mouseout', function (e) {
        const path = tgSharePath(e);
        let el = null;
        for (let i = 0; i < path.length; i++) {
          if (path[i].hasAttribute && path[i].hasAttribute('data-tgtk-shares')) { el = path[i]; break; }
        }
        if (!el || !el.classList.contains('tgtk-share-on')) return;
        const rt = e.relatedTarget;
        if (rt && el.contains && el.contains(rt)) return;
        tgShareLeave(el);
      }, true);
    } catch (e) {}
  }

  function tgWrapMoney(root, re) {
    try {
      const doc = root.ownerDocument;
      const walker = doc.createTreeWalker(root, 4, null); // 4 = SHOW_TEXT
      let n = null;
      while ((n = walker.nextNode())) {
        const text = n.nodeValue || '';
        const m = re.exec(text);
        if (!m) continue;
        const span = doc.createElement('span');
        span.textContent = m[0];
        const parent = n.parentNode;
        if (!parent) continue;
        const after = text.slice(m.index + m[0].length);
        n.nodeValue = text.slice(0, m.index);
        parent.insertBefore(span, n.nextSibling);
        if (after) parent.insertBefore(doc.createTextNode(after), span.nextSibling);
        return span;
      }
    } catch (e) {}
    return null;
  }

  function tgFindMyInvest(root) {
    try {
      const walker = root.ownerDocument.createTreeWalker(root, 4, null); // 4 = SHOW_TEXT
      let n = null;
      while ((n = walker.nextNode())) {
        if (!/已注资/.test(n.nodeValue || '')) continue;
        const p = n.parentElement;
        if (!p || !/[₵¥]/.test(p.textContent || '')) continue;
        const done = p.querySelector && p.querySelector('[data-tgtk-shares]');
        if (done) return done;
        const span = tgWrapMoney(p, /[₵¥]\s?[\d,]+(?:\.\d+)?/);
        if (span) return span;
      }
    } catch (e) {}
    return null;
  }

  function tgWrapInvestAll(d) {
    if (!d || !d.body || !d.createTreeWalker) return;
    let walker = null;
    try { walker = d.createTreeWalker(d.body, 4, null); } catch (e) { return; }
    let n = null;
    let guard = 0;
    while ((n = walker.nextNode()) && guard++ < 3000) {
      if (!/已注资/.test(n.nodeValue || '')) continue;
      const p = n.parentElement;
      if (!p || !/[₵¥]/.test(String(p.textContent || ''))) continue;
      if (p.querySelector && p.querySelector('[data-tgtk-shares]')) continue;
      const price = tgSharePriceFrom(p);
      if (!price) continue;
      const span = tgWrapMoney(p, /[₵¥]\s?[\d,]+(?:\.\d+)?/);
      if (span) tgShareEnter(span, price, String(span.textContent || '').trim());
      if (span) tgShareLeave(span);
    }
  }

  function tgShareSweep(d) {
    let list = [];
    try { list = d.querySelectorAll('[data-tgtk-shares]'); } catch (e) { return; }
    for (let i = 0; i < list.length; i++) {
      const el = list[i];
      if (!el.isConnected) continue;
      const price = tgSharePriceFrom(el);
      let money = String(el.getAttribute('data-tgtk-money') || '');
      const share = String(el.getAttribute('data-tgtk-shares') || '');
      const txt = String(el.textContent || '').trim();
      if (txt !== money && txt !== share) {
        if (TG_BADGE_RE.test(txt) || TG_MONEY_RE.test(txt)) money = txt;
        else {
          el.removeAttribute('data-tgtk-money');
          el.removeAttribute('data-tgtk-shares');
          el.classList.remove('tgtk-share-on');
          continue;
        }
      }
      const amt = num(money.replace(/[^\d.]/g, ''));
      const s = price && amt > 0 ? '+' + fmt(Math.round(amt / price)) + '股' : '';
      if (s) {
        el.setAttribute('data-tgtk-money', money);
        el.setAttribute('data-tgtk-shares', s);
      }
      const on = el.classList.contains('tgtk-share-on');
      if (on && !tgHovering(el)) tgShareLeave(el);
      else if (on && s) el.textContent = s;
      else if (!on) el.textContent = money;
    }
  }

  function gxIcoRoots(d) {
    const out = [];
    try {
      const ob = d.getElementById('grailBox');
      if (ob && ob.querySelector && ob.querySelector('.predicted')) out.push({ root: ob, kind: 'old' });
    } catch (e) {}
    try {
      let nb = d.getElementById('tg-ico-box');
      if (!nb) {
        try { nb = d.querySelector('[id^="tg-ico-box"], [id*="ico-box" i], [id^="tg-ico-"][data-character-id]'); } catch (e) {}
      }
      if (nb) out.push({ root: nb, kind: 'new' });
      else {
        const row = d.querySelector(
          '[data-amount][data-rank], [data-user-name][data-amount], [data-user-name], ' +
          '#tg-ico-box-user-list > div, [id*="ico-box-user-list" i] > div'
        );
        if (row) {
          let host = row.parentElement;
          while (host && host !== d.body && !/发行价/.test(host.textContent || '')) host = host.parentElement;
          out.push({ root: host && host !== d.body ? host : d.body, kind: 'new' });
        }
      }
    } catch (e) {}
    return out;
  }

  function gxIcoBadge(row) {
    let el = null;
    try { el = row.querySelector('.inline-block'); } catch (e) {}
    if (el && TG_BADGE_RE.test(String(el.textContent || '').trim())) return el;
    const wrap = row.lastElementChild;
    const last = wrap && wrap.lastElementChild;
    if (last && TG_BADGE_RE.test(String(last.textContent || '').trim())) return last;
    if (wrap && TG_BADGE_RE.test(String(wrap.textContent || '').trim())) return wrap;
    const all = row.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      const x = all[i];
      if (!x.children.length && TG_BADGE_RE.test(String(x.textContent || '').trim())) return x;
    }
    return null;
  }

  function gxIcoShares() {
    const me = String((TGT.me && TGT.me.name) || '');
    if (!me) tgEnsureMe();
    for (const d of allDocs()) {
      if (!d || !d.querySelector) continue;
      try { tgBindShares(d); } catch (e) {}
      try { tgWrapInvestAll(d); } catch (e) {}
      const roots = gxIcoRoots(d);
      for (let bi = 0; bi < roots.length; bi++) {
        const box = roots[bi];
        const root = box.root;
        const kind = box.kind;
        const price = gxIcoPrice(root);
        if (!price) continue;
        const rows = kind === 'new'
          ? root.querySelectorAll(
              '[data-amount][data-rank], [data-user-name][data-amount], #tg-ico-box-user-list [data-user-name], ' +
              '#tg-ico-box-user-list > div, [id*="ico-box-user-list" i] > div'
            )
          : root.querySelectorAll('.users .user');
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          let name = '';
          let rank = i + 1;
          let el = null;
          if (kind === 'new') {
            name = String(row.getAttribute('data-user-name') || '');
            rank = num(row.getAttribute('data-rank')) || i + 1;
            el = gxIcoBadge(row);
          } else {
            const a = row.querySelector('a[href*="/user/"]');
            if (a) {
              const href = String(a.getAttribute('href') || '');
              const p = href.indexOf('/user/');
              if (p >= 0) name = href.slice(p + 6).split(/[/?#]/)[0];
            }
            el = row.querySelector('.tag.board');
          }
          if (!el) continue;
          if (rank > 3 && !(me && name === me)) continue;
          const on = el.classList.contains('tgtk-share-on');
          const money = on ? String(el.getAttribute('data-tgtk-money') || '') : String(el.textContent || '').trim();
          if (!money || /股/.test(money)) continue;
          const amt = num(money.replace(/[^\d.]/g, ''));
          if (!(amt > 0) || !isFinite(amt)) continue;
          if (on && !tgHovering(el)) {
            el.textContent = money;
            el.classList.remove('tgtk-share-on');
          }
          tgMarkShares(el, money, '+' + fmt(Math.round(amt / price)) + '股');
        }
        const mine = tgFindMyInvest(root);
        if (mine) {
          const on = mine.classList.contains('tgtk-share-on');
          const money = on ? String(mine.getAttribute('data-tgtk-money') || '') : String(mine.textContent || '').trim();
          if (money && !/股/.test(money)) {
            const amt = num(money.replace(/[^\d.]/g, ''));
            if (on && !tgHovering(mine)) {
              mine.textContent = money;
              mine.classList.remove('tgtk-share-on');
            }
            if (amt > 0) tgMarkShares(mine, money, '+' + fmt(Math.round(amt / price)) + '股');
          }
        }
      }
      try { tgShareSweep(d); } catch (e) {}
    }
  }

  function startGrailExtras() {
    if (gxTimer) return;
    if (!GX.bound) {
      GX.bound = true;
      DOCS.forEach((d) => {
        try {
          d.addEventListener(
            'click',
            (e) => {
              const pop = HDOC.getElementById('tgtk-gxpop');
              if (!pop) return;
              if (pop.contains(e.target)) return;
              if (e.target && e.target.closest && e.target.closest('#auctionHistoryButton,#auctionButton,#tgtk-gx-auction')) return;
              pop.remove();
            },
            true
          );
          d.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') gxHidePop();
          });
        } catch (e) {}
      });
    }
    const tick = () => {
      try {
        gxStartWatch();
        gxDedupeBoxes(); // 每轮兜底：重复框也可能是懒加载之后才出现的
        gxMountSize(); // 角色页内嵌的圣殿尺寸开关，每轮确认还在
        const rec = gxBox();
        if (rec) {
          if (isIcoPage(rec.cid)) {
            const old = rec.box.querySelector('#tgtk-gx-auction');
            if (old) old.remove();
            const tc = rec.box.querySelector('.tgtk-gx-temples');
            if (tc) tc.remove();
            GX.cache[rec.cid] = null;
          } else {
            gxTempleSize(rec);
            gxMarkTemples(rec).catch(() => {});
            gxHijack(rec);
            const cached = GX.cache[rec.cid];
            if (cached) {
              gxDrawAuction(rec, cached);
              gxDrawTempleCount(rec, cached.temples);
            }
            if (!cached || Date.now() - cached.at > 60000) {
              gxData(rec.cid)
                .then((d) => {
                  if (!d) return;
                  const now = gxBox();
                  if (!now || String(now.cid) !== String(rec.cid)) return;
                  gxDrawAuction(now, d);
                  gxDrawTempleCount(now, d.temples);
                })
                .catch(() => {});
            }
          }
        } else {
          gxTempleSize(null);
        }
        let nrec = gxNewBox();
        if (!nrec) {
          const cid = String(currentCharacterId() || '');
          if (/^\d+$/.test(cid)) {
            for (const d of allDocs()) {
              if (!d.querySelector || !d.querySelector('[id^="tg-"]')) continue;
              if (gxNewTradeBtn(d)) {
                nrec = { doc: d, box: d.body, cid };
                break;
              }
            }
          }
        }
        if (nrec) {
          if (isIcoPage(nrec.cid)) {
            const b = nrec.box.querySelector('#tgtk-gx-aucbtn,#tgtk-gx-nauc');
            if (b) b.remove();
            const tc = nrec.box.querySelector('.tgtk-gx-temples-n');
            if (tc) tc.remove();
          } else {
            const nd = GX.cache['n' + nrec.cid];
            if (nd) {
              gxNewAuctionInfo(nrec, nd);
              gxNewTempleCount(nrec, nd.temples);
            }
            if (!nd || Date.now() - nd.at > 60000) {
              gxNewData(nrec.cid)
                .then((d) => {
                  if (!d) return;
                  const now = gxNewBox();
                  if (!now || String(now.cid) !== String(nrec.cid)) return;
                  gxNewAuctionInfo(now, d);
                  gxNewTempleCount(now, d.temples);
                })
                .catch(() => {});
            }
          }
        }
        gxNewBidModal();
        gxBonus().catch(() => {});
        gxUserHome();
        gxStarLog();
        tgTempleTools();
        const safeTick = (fn) => { try { fn(); } catch (e) {} };
        safeTick(gxDivHook);
        safeTick(gxUserTempleFill);
        safeTick(gxIcoNextBtn);
        safeTick(gxIcoListedTag);
        safeTick(gxIcoShares);
        safeTick(applyTempleCols);
        safeTick(pinInstallAll);
        safeTick(pinDecorTick);
        safeTick(pinRefreshSnaps);
        safeTick(mountDockSwitch);
        safeTick(syncFabVisible);
        gxTopWeek().catch(() => {});
      } catch (e) {}
    };
    tick();
    gxTimer = setInterval(tick, 1200);
  }

  function refreshFolderUI() {
    if (!els || !els.favFolderSel) return;
    const fill = (sel, withAll, cur) => {
      if (!sel) return;
      const opts = folderOptions(withAll, false);
      sel.textContent = '';
      opts.forEach(([v, t]) => sel.appendChild(h('option', { value: v }, t)));
      sel.value = opts.some(([v]) => v === cur) ? cur : withAll ? 'all' : 'root';
    };
    fill(els.favFolderSel, true, S.favFolder);
    fill(els.favAddFolderSel, false, S.favFolder === 'all' ? 'root' : S.favFolder);
    if (typeof els.syncFolderBtns === 'function') els.syncFolderBtns();
  }
  function setMagicStatus(msg) {
    if (els) els.mStat.textContent = msg;
  }
  function setLogStatus(msg) {
    if (els) els.logStat.textContent = msg;
  }

  function setButtonsDisabled(v) {
    if (!els) return;
    (els.mModes || []).forEach((b) => {
      b.disabled = v;
      b.classList.toggle('tgtk-off', v);
    });
    (els.sEndModes || []).forEach((b) => {
      b.disabled = v;
      b.classList.toggle('tgtk-off', v);
    });
    if (els.mFill) els.mFill.disabled = v;
    if (els.mFillMax) els.mFillMax.disabled = v;
    [els.tRun, els.hRun, els.fRun, els.favRun, els.mRun, els.lRun, els.sRun, els.sdRun, els.sdLoad].forEach((b) => {
      if (!b) return;
      b.disabled = v;
      if (b === els.tRun) b.textContent = v ? '扫描中…' : '扫描';
      if (b === els.hRun) b.textContent = v ? '扫描中…' : '扫描';
      if (b === els.fRun) b.textContent = v ? '查询中…' : '查询';
      if (b === els.favRun) b.textContent = v ? '读取中…' : '刷新全部';
      if (b === els.mRun) b.textContent = v ? '执行中…' : '执行';
      if (b === els.lRun) b.textContent = v ? '统计中…' : '统计';
      if (b === els.sRun) b.textContent = v ? '冲星中…' : '一键冲星';
      if (b === els.sdRun) b.textContent = v ? '充能中…' : '充能';
    });
  }

  function dockBar() {
    let d = null;
    try {
      d = HDOC.getElementById('dock');
    } catch (e) {
      return null;
    }
    if (!d) return null;
    try {
      const r = d.getBoundingClientRect();
      if (!r.width || !r.height) return null;
    } catch (e) {
      return null;
    }
    return d;
  }

  function syncFabVisible() {
    const fab = HDOC.getElementById('tgtk-fab');
    if (!fab) return;
    const hide = !!S.fabHidden && !!dockBar();
    if (fab.hidden !== hide) fab.hidden = hide;
    if (hide && els && els.panel && !els.panel.hidden) togglePanel(false);
    const sw = HDOC.getElementById('tgtk-docksw');
    if (sw) {
      if (sw.classList.contains('tgtk-on') === hide) {
        sw.classList.toggle('tgtk-on', !hide);
        sw.classList.toggle('tgtk-off', hide);
      }
      const tip = (hide ? '显示' : '隐藏') + '工具箱（Alt+T）';
      if (sw.title !== tip) sw.title = tip;
    }
  }

  function toggleFab(force) {
    S.fabHidden = force === undefined ? !S.fabHidden : !!force;
    persist();
    syncFabVisible();
  }

  function mountDockSwitch() {
    if (HDOC.getElementById('tgtk-docksw')) return;
    const dock = dockBar();
    if (!dock) return;
    const ul = dock.querySelector('ul') || dock;
    const a = HDOC.createElement('a');
    a.id = 'tgtk-docksw';
    a.href = 'javascript:void(0);';
    a.setAttribute('role', 'button');
    a.title = '隐藏工具箱（Alt+T）';
    const NS = 'http://www.w3.org/2000/svg';
    const svg = HDOC.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '17');
    svg.setAttribute('height', '17');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.9');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    [
      ['rect', { x: '3', y: '7.5', width: '18', height: '12', rx: '2.5' }],
      ['path', { d: 'M9 7.5V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6v1.9' }],
      ['path', { d: 'M3 12.5h18' }],
      ['path', { d: 'M10.5 12.5v2.2h3v-2.2' }],
    ].forEach(([tag, attrs]) => {
      const el = HDOC.createElementNS(NS, tag);
      Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
      svg.appendChild(el);
    });
    a.appendChild(svg);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFab();
    });
    const li = HDOC.createElement('li');
    li.className = 'tgtk-dockitem';
    li.appendChild(a);
    const last = ul.querySelector('li.last') || ul.lastElementChild;
    if (last && last.parentNode === ul) ul.insertBefore(li, last);
    else ul.appendChild(li);
    syncFabVisible();
  }

  function togglePanel(force) {
    if (els && els.panel && !els.panel.isConnected) els = null;
    if (!els) buildUI();
    const show = force === undefined ? els.panel.hidden : force;
    els.panel.hidden = !show;
    S.panelOpen = !!show;
    persist();
    writeUI({ open: !!show, tab: S.tab });
    broadcastOpen(!!show);
    if (show) {
      applyPos(els.panel, 'panelPos');
      clearFavAddAutofill();
      setTimeout(clearFavAddAutofill, 160);
      setTimeout(clearFavAddAutofill, 700);
      if (!cldReady && Date.now() - cldLastTry > 30000) {
        cldTry = 0;
        setTimeout(() => { cldPull().catch(() => {}); }, 300);
      }
    } else {
      hideCharaSuggest();
      hideFavPop();
      hideMovePop();
      setNoteMode(false);
    }
  }

  function copyText(text, statusFn) {
    const done = () => statusFn('已复制');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done, statusFn));
    } else {
      fallback(text, done, statusFn);
    }
  }

  function fallback(text, done, statusFn) {
    const ta = HDOC.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
    HDOC.body.appendChild(ta);
    ta.select();
    try {
      HDOC.execCommand('copy');
      done();
    } catch (e) {
      statusFn('复制失败，请手动选择');
    }
    ta.remove();
  }

  function idListText(ids) {
    const out = [];
    const seen = new Set();
    (ids || []).forEach((v) => {
      const s = String(v == null ? '' : v).trim();
      if (!/^\d+$/.test(s) || seen.has(s)) return;
      seen.add(s);
      out.push(s);
    });
    return out;
  }

  function copyTemple() {
    const rows = templeRows();
    if (!rows.length) return setTempleStatus('没有可复制的结果');
    const ids = idListText(rows.map((t) => t.CharacterId));
    copyText(ids.join(' '), (m) => setTempleStatus(`${m} ${fmt(ids.length)} 个角色 ID`));
  }

  function copyHolding() {
    const rows = holdRows();
    if (!rows.length) return setHoldStatus('没有可复制的结果');
    const ids = idListText(rows.map((x) => x.CharacterId));
    copyText(ids.join(' '), (m) => setHoldStatus(`${m} ${fmt(ids.length)} 个角色 ID`));
  }

  function copyFavs() {
    const fid = S.favFolder || 'all';
    const tree = fid === 'all' ? null : folderTree(fid);
    const ids = idListText(
      (favs || [])
        .filter((f) => !tree || tree.includes(f.folder))
        .map((f) => f.id)
    );
    if (!ids.length) return setFavStatus('当前收藏夹里没有可复制的角色');
    const where = fid === 'all' ? '全部收藏夹' : '当前收藏夹';
    copyText(ids.join(' '), (m) => setFavStatus(`${m} ${fmt(ids.length)} 个角色 ID（${where}）`));
  }

  const CSS = `
#tgtk-panel,#tgtk-fab,.tgtk-sug,.tgtk-favpop,#tgtk-star,.tgtk-starpop,.tgtk-histpop,.tgtk-movepop,.tgtk-pintoast{
  --tg-bg:#20242e; --tg-sunken:#181b22; --tg-sunken2:#1b1f27;
  --tg-surface:#262b36; --tg-surface2:#2a2f3b; --tg-surface3:#333947;
  --tg-line:#3b4150; --tg-line-soft:rgba(255,255,255,.07); --tg-bar:rgba(255,255,255,.14);
  --tg-fg:#e6e8ee; --tg-fg2:#cfd4df; --tg-dim:#9aa3b5; --tg-mute:#727b8d;
  --tg-accent:#e46fa1; --tg-accent-fg:#ffd9e8; --tg-hl:#ffb3cf;
  --tg-up:#9fe0b0; --tg-down:#8fb8ff; --tg-link:#8fd3ff;
  --tg-hit:#2d2739; --tg-okbg:#1e2a23; --tg-badbg:#2b1f24;
  --tg-bad:#ff9aa8; --tg-warn:#ffd08a;
}
#tgtk-panel[data-theme="light"],.tgtk-sug[data-theme="light"],.tgtk-favpop[data-theme="light"],#tgtk-star[data-theme="light"],.tgtk-starpop[data-theme="light"],.tgtk-histpop[data-theme="light"],.tgtk-movepop[data-theme="light"],.tgtk-pintoast[data-theme="light"]{
  --tg-bg:#fcfafb; --tg-sunken:#f4eff3; --tg-sunken2:#f8f3f6;
  --tg-surface:#f4eef2; --tg-surface2:#ece4ea; --tg-surface3:#e2d7df;
  --tg-line:#d9cbd4; --tg-line-soft:rgba(96,64,84,.12); --tg-bar:rgba(96,64,84,.16);
  --tg-fg:#332b31; --tg-fg2:#4a4046; --tg-dim:#7b6d77; --tg-mute:#9b8d97;
  --tg-accent:#d4568e; --tg-accent-fg:#a8305f; --tg-hl:#bc4a7c;
  --tg-up:#2c8255; --tg-down:#2f66a8; --tg-link:#2f6bb0;
  --tg-hit:#f9e9f1; --tg-okbg:#e9f5ee; --tg-badbg:#fbeaee;
  --tg-bad:#b83b52; --tg-warn:#95651a;
}
#tgtk-panel[data-theme="light"]{box-shadow:0 18px 50px rgba(90,58,78,.18)}
.tgtk-sug[data-theme="light"]{box-shadow:0 10px 32px rgba(90,58,78,.22)}
.tgtk-favpop[data-theme="light"],.tgtk-starpop[data-theme="light"],.tgtk-histpop[data-theme="light"],.tgtk-movepop[data-theme="light"]{box-shadow:0 12px 36px rgba(90,58,78,.24)}
#tgtk-panel,#tgtk-panel *{box-sizing:border-box}
#tgtk-panel button,#tgtk-fab{font-family:inherit}
.tgtk-line .tgtk-favbtn{margin-left:-2px}
.tgtk-favbtn{flex:none;width:22px;height:22px;padding:0;line-height:1;border:1px solid var(--tg-line);
  border-radius:6px;background:var(--tg-sunken);color:var(--tg-accent);font:inherit;font-size:12px;cursor:pointer}
.tgtk-favbtn:hover,.tgtk-favbtn:focus{background:var(--tg-hit);border-color:var(--tg-accent);outline:none}
.tgtk-clearbtn{flex:none;box-sizing:border-box;height:27px;padding:0 9px;border:1px solid var(--tg-line);
  border-radius:6px;background:var(--tg-sunken);color:var(--tg-mute);font:inherit;font-size:11px;
  line-height:1;cursor:pointer}
.tgtk-clearbtn:hover,.tgtk-clearbtn:focus{color:var(--tg-fg);border-color:var(--tg-accent);background:var(--tg-hit);outline:none}
.tgtk-favpop{position:fixed;z-index:2147483006;width:250px;max-width:calc(100vw - 12px);box-sizing:border-box;
  padding:8px;display:flex;flex-direction:column;gap:6px;background:var(--tg-bg);color:var(--tg-fg);
  border:1px solid var(--tg-line);border-radius:9px;box-shadow:0 12px 36px rgba(0,0,0,.5);
  font:12px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tgtk-favhead{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:0 2px;
  color:var(--tg-accent-fg);font-size:11px;font-weight:600}
.tgtk-favclose{border:0;background:transparent;color:var(--tg-mute);font-size:15px;line-height:1;cursor:pointer;padding:0 3px}
.tgtk-favclose:hover{color:var(--tg-fg)}
.tgtk-favpop input[type=text]{box-sizing:border-box;width:100%;padding:4px 7px;border-radius:6px;
  border:1px solid var(--tg-line);background:var(--tg-sunken);color:var(--tg-fg);font:inherit;font-size:12px;outline:none}
.tgtk-favpop input[type=text]:focus{border-color:var(--tg-accent)}
.tgtk-favpoplist{display:flex;flex-direction:column;gap:2px;max-height:230px;overflow-y:auto}
.tgtk-favrow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 8px 5px 10px;
  border-radius:5px;background:var(--tg-sunken2);border:1px solid transparent;cursor:pointer}
.tgtk-favrow:hover{background:var(--tg-hit);border-color:var(--tg-line)}
.tgtk-favrow.tgtk-on{outline:1px solid var(--tg-accent);color:var(--tg-accent-fg);background:var(--tg-hit)}
.tgtk-favname{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-favid{flex:none;color:var(--tg-mute);font-size:10px;font-variant-numeric:tabular-nums}
.tgtk-favempty{color:var(--tg-mute);font-size:11px;padding:10px 4px;text-align:center;line-height:1.6}
.tgtk-favfoot{display:flex;align-items:center;justify-content:space-between;gap:6px;color:var(--tg-mute);
  font-size:10px;border-top:1px solid var(--tg-line-soft);padding-top:6px}
.tgtk-favfoot span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-favfoot .tgtk-btn{flex:none}
.tgtk-sug{position:fixed;z-index:2147483005;width:236px;max-height:264px;overflow-y:auto;box-sizing:border-box;
  padding:4px;background:var(--tg-bg);color:var(--tg-fg);border:1px solid var(--tg-line);border-radius:8px;
  box-shadow:0 10px 32px rgba(0,0,0,.5);font:12px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tgtk-sughead{padding:3px 6px 5px;color:var(--tg-dim);font-size:10px;border-bottom:1px solid var(--tg-line-soft);margin-bottom:3px}
.tgtk-sugrow{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 6px;border-radius:5px;cursor:pointer}
.tgtk-sugrow:hover,.tgtk-sugrow.tgtk-sugon{background:var(--tg-hit);color:var(--tg-accent-fg)}
.tgtk-sugname{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-sugid{flex:none;color:var(--tg-mute);font-size:10px;font-variant-numeric:tabular-nums}
.tgtk-sugtag{flex:none;padding:0 4px;border-radius:999px;background:var(--tg-sunken2);color:var(--tg-mute);
  font-size:9px;line-height:14px}
.tgtk-sugmiss .tgtk-sugname{color:var(--tg-mute)}
.tgtk-sugempty{padding:6px;color:var(--tg-mute);font-size:11px;line-height:1.5}
#dock .tgtk-dockitem{display:flex;align-items:center;margin:0;padding:0;list-style:none}
#tgtk-docksw{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
  background:none;border:0;color:inherit;opacity:.6;cursor:pointer;text-decoration:none;
  transition:opacity .15s,color .15s}
#tgtk-docksw:hover{opacity:1}
#tgtk-docksw.tgtk-off{opacity:.3}
#tgtk-docksw.tgtk-on{opacity:1;color:var(--tg-accent)}
#tgtk-fab{position:fixed;right:18px;bottom:86px;z-index:2147483000;padding:8px 14px;border:0;border-radius:999px;
  background:var(--tg-accent);color:#fff;font:600 13px/1.4 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
  box-shadow:0 6px 18px rgba(228,111,161,.38);cursor:grab;opacity:.92;transition:transform .15s,opacity .15s;
  touch-action:none;user-select:none}
#tgtk-fab.tgtk-dragging{cursor:grabbing;opacity:1}
#tgtk-fab:hover{transform:translateY(-2px);opacity:1}
#tgtk-fab[hidden]{display:none!important}
#tgtk-panel{position:fixed;right:18px;bottom:132px;z-index:2147483001;width:430px;max-width:calc(100vw - 24px);
  max-height:76vh;display:flex;flex-direction:column;background:var(--tg-bg);color:var(--tg-fg);border-radius:12px;
  box-shadow:0 18px 50px rgba(0,0,0,.45);font:13px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
  overflow:hidden;border:1px solid var(--tg-line-soft)}
#tgtk-panel[hidden]{display:none}
#tgtk-panel.tgtk-dragging{box-shadow:0 24px 64px rgba(0,0,0,.6);cursor:grabbing}
.tgtk-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:10px 14px 6px;
  cursor:move;user-select:none;touch-action:none}
.tgtk-title{font-size:13px;font-weight:600;color:var(--tg-accent-fg);letter-spacing:.02em}
.tgtk-close{background:none;border:0;color:var(--tg-dim);font-size:18px;line-height:1;cursor:pointer;padding:0 2px}
.tgtk-headtools{display:flex;align-items:center;gap:6px}
.tgtk-ico{background:none;border:1px solid transparent;color:var(--tg-dim);font-size:14px;line-height:1;cursor:pointer;padding:2px 5px;border-radius:5px}
.tgtk-ico:hover{background:var(--tg-surface);color:var(--tg-fg)}
.tgtk-close:hover{color:#fff}
.tgtk-tabbar{flex:0 0 auto;display:flex;gap:4px;padding:0 12px 8px;border-bottom:1px solid var(--tg-line-soft);
  flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;overscroll-behavior-x:contain}
.tgtk-tabbar::-webkit-scrollbar{height:4px}
.tgtk-tabbar::-webkit-scrollbar-thumb{background:var(--tg-line);border-radius:2px}
.tgtk-tabbar::-webkit-scrollbar-track{background:transparent}
.tgtk-tab{flex:0 0 auto;min-width:46px;padding:6px 5px;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--tg-dim);
  font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.tgtk-tab:hover{color:var(--tg-fg)}
.tgtk-tab.tgtk-on{background:rgba(228,111,161,.16);border-color:rgba(228,111,161,.45);color:var(--tg-accent-fg);font-weight:600}
.tgtk-subtab{flex:1;background:var(--tg-sunken);border:1px solid var(--tg-line);color:var(--tg-dim)}
.tgtk-subtab.tgtk-on{background:var(--tg-accent);border-color:var(--tg-accent);color:#fff;font-weight:600}
.tgtk-endwrap{flex:1;min-width:0;max-width:230px}
.tgtk-endwrap .tgtk-subtab{display:inline-flex;align-items:center;justify-content:center;
  height:24px;padding:0 6px;border-radius:6px;font-size:11px;line-height:1}
.tgtk-colname{color:var(--tg-accent-fg);font-size:12px;font-weight:600;white-space:nowrap}
.tgtk-inline.tgtk-cols{gap:5px;flex:none}
.tgtk-inline.tgtk-cols .tgtk-subtab{flex:none;display:inline-flex;align-items:center;justify-content:center;
  width:44px;min-width:44px;height:24px;padding:0;border-radius:6px;font-size:11px;line-height:1}
.tgtk-colunit{font-style:normal;color:var(--tg-mute);font-size:11px}
.tgtk-body{flex:1 1 auto;min-height:0;padding:12px 14px 14px;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:9px}
.tgtk-view{display:flex;flex-direction:column;gap:9px}
.tgtk-view[hidden]{display:none}
.tgtk-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tgtk-label{color:var(--tg-dim);font-size:12px;white-space:nowrap}
.tgtk-dash{color:var(--tg-mute)}
#tgtk-panel input[type=text],#tgtk-panel input[type=search],#tgtk-panel input[type=number],#tgtk-panel select,#tgtk-panel textarea{
  box-sizing:border-box;padding:5px 8px;border-radius:6px;border:1px solid var(--tg-line);background:var(--tg-sunken);color:var(--tg-fg);
  font:inherit;font-size:12px}
#tgtk-panel input[type=number]{width:76px}
#tgtk-thr{width:84px!important}
#tgtk-user,#tgtk-fchars,#tgtk-holdsearch{flex:1;min-width:120px}
.tgtk-userwrap{display:flex;align-items:center;gap:6px;flex:1;min-width:150px;margin-left:10px}
#tgtk-user{min-width:80px}
.tgtk-chkend{gap:0;margin-left:-2px}
#tgtk-favadd{width:96px}
#tgtk-favadd::-webkit-search-cancel-button,#tgtk-favadd::-webkit-search-decoration{-webkit-appearance:none;display:none}
#tgtk-favadd:-webkit-autofill,#tgtk-favadd:-webkit-autofill:hover,#tgtk-favadd:-webkit-autofill:focus{
  box-shadow:0 0 0 1000px var(--tg-sunken) inset;-webkit-text-fill-color:var(--tg-fg);
  animation:tgtk-autofill-guard .001s linear}
@keyframes tgtk-autofill-guard{from{outline-color:transparent}to{outline-color:transparent}}
#tgtk-lvmin,#tgtk-lvmax,#tgtk-minamt{width:64px!important}
#tgtk-chars{width:100%;resize:vertical}
#tgtk-panel select{max-width:150px}
.tgtk-tabs{display:flex;gap:6px}
.tgtk-ctx[hidden]{display:none}
.tgtk-actions{justify-content:flex-start}
.tgtk-btn{padding:6px 14px;border-radius:6px;border:1px solid var(--tg-line);background:var(--tg-surface2);color:var(--tg-fg2);font:inherit;
  font-size:12px;cursor:pointer}
.tgtk-btn:disabled{opacity:.45;cursor:default}
.tgtk-btn:hover{background:var(--tg-surface3)}
.tgtk-primary{background:var(--tg-accent);border-color:var(--tg-accent);color:#fff;font-weight:600}
.tgtk-primary:disabled{opacity:.55;cursor:default}
.tgtk-chk{display:flex;align-items:center;gap:4px;color:var(--tg-dim);font-size:12px;cursor:pointer}
.tgtk-subtab.tgtk-off{opacity:.45;cursor:not-allowed}
.tgtk-importbox{display:flex;flex-direction:column;gap:6px;padding:7px 8px;
  border:1px dashed var(--tg-line);border-radius:8px;background:var(--tg-sunken)}
.tgtk-importbox[hidden]{display:none}
.tgtk-importbox textarea{width:100%;box-sizing:border-box;resize:vertical}
.tgtk-importbox .tgtk-actions{margin:0}
.tgtk-chk input[type=checkbox]{width:13px;height:13px;accent-color:var(--tg-accent);cursor:pointer;margin:0}
.tgtk-chkline{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.tgtk-inline{display:flex;align-items:center;gap:4px;color:var(--tg-mute);font-size:11px}
.tgtk-inline[hidden]{display:none}
.tgtk-inline input[type="date"]{font:inherit;color:var(--tg-text);background:var(--tg-sunken);
  border:1px solid var(--tg-line);border-radius:6px;padding:1px 4px;min-width:0;width:7.6em}
.tgtk-estimate{flex:1;min-width:0;justify-content:flex-start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-inline i{font-style:normal}
.tgtk-inline input{width:62px;background:var(--tg-sunken2);border:1px solid var(--tg-line);color:var(--tg-fg);border-radius:5px;padding:3px 5px;font-size:12px;text-align:center;outline:none}
.tgtk-inline input:focus{border-color:var(--tg-accent)}
.tgtk-stat{color:var(--tg-dim);font-size:12px;min-height:18px}
.tgtk-list{display:flex;flex-direction:column;gap:2px}
.tgtk-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 8px;border-radius:6px;
  background:var(--tg-surface)}
.tgtk-row.tgtk-hit{background:var(--tg-hit)}
.tgtk-main{display:flex;flex-direction:column;min-width:0}
.tgtk-name{color:var(--tg-link);text-decoration:none;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-name:hover{text-decoration:underline}
.tgtk-sub{color:var(--tg-dim);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-val{font-variant-numeric:tabular-nums;color:var(--tg-fg2);white-space:nowrap;font-size:12px}
.tgtk-val b{color:var(--tg-hl);font-weight:600}
.tgtk-empty{color:var(--tg-dim);text-align:center;padding:18px 0;font-size:12px}
#tgtk-panel [hidden]{display:none!important}
.tgtk-kv{color:var(--tg-dim);font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-kv b{color:var(--tg-hl);font-weight:600;font-variant-numeric:tabular-nums}
.tgtk-kv i{font-style:normal;color:var(--tg-mute)}
.tgtk-x{border:0;background:transparent;color:var(--tg-mute);font-size:16px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:4px}
.tgtk-x:hover{background:var(--tg-line-soft);color:#ff9ab8}
.tgtk-favpick{min-height:26px}
.tgtk-favpick .tgtk-btn{padding:3px 10px;font-size:12px}
.tgtk-danger{background:#7a2d3a;border-color:#9c3a4a;color:#ffd7df}
.tgtk-danger:hover{background:#8d3444}
.tgtk-note{color:var(--tg-mute);font-size:11px;line-height:1.6;background:var(--tg-sunken2);border-radius:6px;padding:6px 8px}
.tgtk-preview{color:var(--tg-dim);font-size:11px}
.tgtk-sumwrap{display:flex;flex-direction:column;gap:6px}
.tgtk-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.tgtk-sumcell{background:var(--tg-surface);border-radius:6px;padding:6px 8px;display:flex;flex-direction:column;gap:1px;min-width:0}
.tgtk-sumcell i{font-style:normal;color:var(--tg-dim);font-size:11px}
.tgtk-sumcell b{font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-sumcell span{color:var(--tg-mute);font-size:10px}
.tgtk-up{color:var(--tg-up)}
.tgtk-down{color:var(--tg-down)}
.tgtk-dual{display:flex;gap:8px;justify-content:flex-end;min-width:104px}
.tgtk-dual b{color:var(--tg-up);font-weight:600}
.tgtk-dual span{color:var(--tg-down)}
.tgtk-asset{background:var(--tg-surface);border-radius:8px;padding:8px 10px 6px;display:flex;flex-direction:column;gap:4px}
.tgtk-assettop{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.tgtk-assetcell{display:flex;flex-direction:column;gap:1px;min-width:0}
.tgtk-assetcell i{font-style:normal;color:var(--tg-dim);font-size:10px}
.tgtk-assetcell b{font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-sparkwrap{width:100%;height:38px;overflow:hidden}
.tgtk-spark{width:100%;height:38px;display:block}
.tgtk-spark-area{opacity:.13;stroke:none}
.tgtk-spark-line{fill:none;stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}
.tgtk-sparkempty{color:var(--tg-mute);font-size:11px;line-height:38px;text-align:center}
.tgtk-assetfoot{display:flex;justify-content:space-between;align-items:center;color:var(--tg-dim);font-size:11px;gap:8px}
.tgtk-assetfoot b{font-variant-numeric:tabular-nums;white-space:nowrap}
.tgtk-seg{display:flex;gap:4px;background:var(--tg-sunken);border-radius:7px;padding:3px}
.tgtk-segbtn{flex:1;padding:5px 0;border:0;border-radius:5px;background:transparent;color:var(--tg-dim);font-size:12px;cursor:pointer}
.tgtk-segbtn:hover{color:var(--tg-fg)}
.tgtk-segbtn.tgtk-on{background:rgba(228,111,161,.2);color:var(--tg-accent-fg);font-weight:600}
.tgtk-flowgrid{display:flex;flex-direction:column;gap:6px}
.tgtk-flowblk{background:var(--tg-surface);border-radius:7px;padding:6px 8px;display:flex;flex-direction:column;gap:3px}
.tgtk-flowhead{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--tg-dim);padding-bottom:3px;border-bottom:1px solid var(--tg-line-soft)}
.tgtk-flowhead span{flex:1}
.tgtk-flowhead b{font-size:12px;font-variant-numeric:tabular-nums}
.tgtk-flowhead i{font-style:normal;color:var(--tg-mute);font-size:10px}
.tgtk-flowrow{display:flex;align-items:center;gap:6px;font-size:11px;height:17px}
.tgtk-flowrow.tgtk-wide .tgtk-flowname{width:104px}
.tgtk-flowname{width:62px;flex:none;color:var(--tg-fg2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-hasdetail{cursor:help;border-bottom:1px dotted var(--tg-mute)}
.tgtk-flowbar{flex:1;height:5px;background:var(--tg-line-soft);border-radius:3px;overflow:hidden;min-width:20px}
.tgtk-flowbar i{display:block;height:100%;border-radius:3px}
.tgtk-flowbar i.up{background:#5fa878}
.tgtk-flowbar i.down{background:#5f7fa8}
.tgtk-flowval{width:62px;flex:none;text-align:right;font-variant-numeric:tabular-nums;color:var(--tg-fg);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-flown{width:34px;flex:none;text-align:right;color:var(--tg-mute);font-size:10px}
.tgtk-flowempty{color:var(--tg-mute);font-size:11px;padding:2px 0}
.tgtk-flownote{color:var(--tg-mute);font-size:10px;line-height:1.5;padding-top:3px;border-top:1px dashed var(--tg-line-soft);margin-top:2px}
.tgtk-blocktitle{color:var(--tg-dim);font-size:11px;font-weight:600;padding:2px 2px 0}
.tgtk-starbox{margin-top:10px;padding-top:10px;border-top:1px dashed var(--tg-line-soft);display:flex;flex-direction:column;gap:6px}
.tgtk-sdlist{display:flex;flex-direction:column;gap:2px;max-height:236px;overflow-y:auto;padding-right:2px}
.tgtk-sdrow{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:5px;background:var(--tg-sunken2);cursor:pointer}
.tgtk-sdrow:hover{background:var(--tg-surface3)}
.tgtk-sdrow.tgtk-on{outline:1px solid var(--tg-accent);background:var(--tg-surface2)}
.tgtk-mini.tgtk-picked{background:var(--tg-accent);border-color:var(--tg-accent);color:#fff;min-width:64px}
.tgtk-mini.tgtk-picked:hover{filter:brightness(1.1)}
.tgtk-sdzero.tgtk-on .tgtk-mini.tgtk-picked{opacity:1}
.tgtk-sdrow.tgtk-sdzero{opacity:.6;cursor:default}
.tgtk-sdrow.tgtk-sdzero:hover{background:var(--tg-sunken2)}
.tgtk-sdmain{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.tgtk-sdmain .tgtk-name,.tgtk-sdmain a{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-mini{padding:3px 9px;font-size:11px;flex:none}
.tgtk-icolist{display:flex;flex-direction:column;gap:4px;max-height:300px;overflow-y:auto;padding-right:2px}
.tgtk-icorow{display:flex;flex-direction:column;gap:3px;padding:6px 8px;border-radius:6px;
  background:var(--tg-sunken2);border:1px solid transparent}
.tgtk-icorow.tgtk-on{border-color:rgba(228,111,161,.45);background:var(--tg-hit)}
.tgtk-icotop{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tgtk-icotop .tgtk-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.tgtk-ico-left{flex:none;color:var(--tg-mute);font-size:11px;font-variant-numeric:tabular-nums}
.tgtk-icosub{color:var(--tg-dim);font-size:10px;font-variant-numeric:tabular-nums;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-icores{color:var(--tg-mute);font-size:10px;line-height:1.45;word-break:break-all}
.tgtk-icoline{display:flex;align-items:center;gap:6px;margin-top:1px}
.tgtk-icoline .tgtk-mute{color:var(--tg-mute);font-size:11px}
.tgtk-icosel{width:74px;padding:3px 6px;font-size:11px}
.tgtk-icohint{flex:none;font-size:11px;line-height:1.6;color:var(--tg-accent-fg);white-space:nowrap}
.tgtk-icolv{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;
  background:rgba(228,111,161,.16);border:1px solid rgba(228,111,161,.45);
  color:#c9457d;font-size:11px;line-height:16px;vertical-align:1px;white-space:nowrap}
.tgtk-icoline .tgtk-btn{margin-left:auto}
.tgtk-pick{color:var(--tg-dim);font-size:11px;line-height:1.5;padding:2px;word-break:break-all;
  max-height:96px;overflow-y:auto}
.tgtk-picktxt{display:block}
.tgtk-sdpicks{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;align-items:center}
.tgtk-sdpick{display:inline-flex;align-items:center;gap:3px;max-width:100%;padding:1px 2px 1px 6px;
  border:1px solid var(--tg-line);border-radius:9px;background:var(--tg-surface2);color:var(--tg-fg2);font-size:10px;white-space:nowrap}
.tgtk-sdpick>span{overflow:hidden;text-overflow:ellipsis;max-width:112px}
.tgtk-sdpick-x{width:16px;height:16px;line-height:14px;text-align:center;border:0;border-radius:8px;
  background:transparent;color:var(--tg-mute);font-size:13px;cursor:pointer;padding:0}
.tgtk-sdpick-x:hover{background:var(--tg-badbg);color:var(--tg-bad)}
.tgtk-sdpick-clear{border:0;background:transparent;color:var(--tg-link);font-size:10px;cursor:pointer;padding:1px 3px}
.tgtk-sdpick-clear:hover{text-decoration:underline}
.tgtk-picktxt.tgtk-sdtline{color:var(--tg-fg);font-variant-numeric:tabular-nums}
.tgtk-sdsort{min-width:52px;justify-content:center}
.tgtk-sdest{flex:none;color:var(--tg-accent-fg);font-size:11px;font-variant-numeric:tabular-nums;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px}
.tgtk-lv{display:flex;align-items:center;gap:6px;margin-top:3px}
.tgtk-lvbar{flex:1;height:3px;background:var(--tg-bar);border-radius:2px;overflow:hidden;min-width:30px}
.tgtk-lvbar i{display:block;height:100%;background:var(--tg-accent);border-radius:2px}
.tgtk-lvtxt{flex:none;color:var(--tg-mute);font-size:10px;font-variant-numeric:tabular-nums}
.tgtk-logbox{display:flex;flex-direction:column;gap:3px;max-height:190px;overflow-y:auto;font-size:12px;padding-right:2px}
.tgtk-log{padding:3px 6px;border-radius:4px;background:var(--tg-sunken2)}
.tgtk-log-info{color:var(--tg-dim)}
.tgtk-log-ok{color:var(--tg-up);background:var(--tg-okbg)}
.tgtk-log-fail{color:var(--tg-bad);background:var(--tg-badbg)}
.tgtk-log-warn{color:var(--tg-warn)}
.tgtk-log-sum{color:var(--tg-accent-fg);background:var(--tg-hit);font-weight:600}
@media (max-width:520px){
  #tgtk-panel{right:12px;left:12px;width:calc(100vw - 24px);bottom:120px}
  .tgtk-tabbar{gap:2px;padding:0 8px 8px}
  .tgtk-tab{font-size:11px;padding:6px 2px;min-width:46px}
  #tgtk-fab{right:12px;bottom:76px}
}
#tgtk-panel[data-theme="light"] .tgtk-btn:hover{background:var(--tg-surface3)}
#tgtk-panel[data-theme="light"] .tgtk-close:hover{color:var(--tg-fg)}
#tgtk-panel[data-theme="light"] .tgtk-danger{background:#f7dfe5;border-color:#e3b4c1;color:#a83349}
#tgtk-panel[data-theme="light"] .tgtk-danger:hover{background:#f2d2da}
.tgtk-favfolder{box-sizing:border-box;width:100%;padding:4px 7px;border-radius:6px;
  border:1px solid var(--tg-line);background:var(--tg-sunken);color:var(--tg-fg);font:inherit;font-size:12px;outline:none}
.tgtk-favfolder:focus{border-color:var(--tg-accent)}
.tgtk-favgrp{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:6px;
  margin:6px 0 2px;padding:4px 8px 4px 7px;border-radius:5px;border-left:3px solid var(--tg-accent);
  background:var(--tg-surface2);color:var(--tg-accent-fg);
  font-size:11px;font-weight:700;letter-spacing:.02em;line-height:1.45}
.tgtk-favgrp:first-child{margin-top:0}
.tgtk-favgrp i{flex:none;font-style:normal;color:var(--tg-mute);font-size:10px;font-weight:400;
  font-variant-numeric:tabular-nums}
.tgtk-fchips{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:4px}
.tgtk-fchips i{color:var(--tg-mute);font-style:normal;font-size:11px}
.tgtk-fchip{display:inline-flex;align-items:center;gap:1px;padding:1px 2px 1px 1px;border:1px solid var(--tg-line);
  border-radius:999px;background:var(--tg-sunken);color:var(--tg-fg2);font-size:11px;line-height:1.55}
.tgtk-fchipx{border:0;background:transparent;color:var(--tg-mute);font:inherit;font-size:12px;line-height:1;
  padding:0 3px;cursor:pointer;border-radius:50%}
.tgtk-fchipx:hover{color:var(--tg-bad);background:var(--tg-badbg)}
.tgtk-fchipadd{flex:none;display:inline-flex;align-items:center;justify-content:center;height:20px;
  padding:0 7px;border:1px dashed var(--tg-line);border-radius:999px;background:transparent;
  color:var(--tg-mute);font:inherit;font-size:12px;line-height:1;cursor:pointer}
.tgtk-fchipadd:hover,.tgtk-fchipadd:focus{color:var(--tg-accent-fg);border-color:var(--tg-accent);
  background:var(--tg-hit);outline:none}
.tgtk-fchiplabel{border:0;background:transparent;color:inherit;font:inherit;font-size:11px;line-height:1.55;
  max-width:128px;padding:0 3px 0 6px;cursor:pointer;border-radius:999px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-fchiplabel:hover{color:var(--tg-accent-fg)}
.tgtk-fchiplabel:focus-visible{outline:1px solid var(--tg-accent);outline-offset:1px}
.tgtk-movepop{position:fixed;z-index:2147483006;width:186px;max-width:calc(100vw - 12px);box-sizing:border-box;
  padding:6px;display:flex;flex-direction:column;gap:4px;background:var(--tg-bg);color:var(--tg-fg);
  border:1px solid var(--tg-line);border-radius:8px;box-shadow:0 12px 36px rgba(0,0,0,.5);
  font:12px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tgtk-movehead{padding:1px 4px 5px;color:var(--tg-dim);font-size:10px;line-height:1.5;
  border-bottom:1px solid var(--tg-line-soft)}
.tgtk-movelist{display:flex;flex-direction:column;gap:2px;max-height:198px;overflow-y:auto}
.tgtk-moverow{text-align:left;padding:4px 8px;border:0;border-radius:5px;background:var(--tg-sunken2);
  color:var(--tg-fg);font:inherit;font-size:12px;cursor:pointer;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-moverow:hover,.tgtk-moverow:focus{background:var(--tg-hit);color:var(--tg-accent-fg);outline:none}
.tgtk-moveempty{padding:6px 4px;color:var(--tg-mute);font-size:11px;text-align:center;line-height:1.6}
.tgtk-toast{position:absolute;left:50%;bottom:16px;z-index:9;transform:translate(-50%,8px);
  padding:4px 12px;border-radius:999px;background:var(--tg-accent);color:#fff;font-size:11px;
  line-height:1.6;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.35);
  opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease}
.tgtk-toast.tgtk-toast-on{opacity:1;transform:translate(-50%,0)}
.tgtk-sep{height:1px;background:var(--tg-line);margin:1px 0}
.tgtk-pinline{justify-content:space-between}
.tgtk-pintoggle{flex:none;height:24px;padding:0 12px;border-radius:999px;border:1px solid var(--tg-accent);
  background:var(--tg-accent);color:#fff;font:inherit;font-size:11px;line-height:1;cursor:pointer}
.tgtk-pintoggle.tgtk-off{background:var(--tg-sunken);border-color:var(--tg-line);color:var(--tg-mute)}
.tgtk-pinlist{display:flex;flex-direction:column;gap:3px;max-height:320px;overflow-y:auto}
.tgtk-pinlist:empty{display:none}
.tgtk-pinrow{display:flex;align-items:center;gap:5px;padding:1px 4px;border:1px solid var(--tg-line);
  border-radius:6px;background:var(--tg-surface);min-height:22px}
.tgtk-pinrow.tgtk-pindragging{opacity:.4}
.tgtk-pinrow.tgtk-drop-before{border-top-color:var(--tg-accent);box-shadow:inset 0 2px 0 var(--tg-accent)}
.tgtk-pinrow.tgtk-drop-after{border-bottom-color:var(--tg-accent);box-shadow:inset 0 -2px 0 var(--tg-accent)}
.tgtk-pinno{flex:none;width:13px;text-align:center;color:var(--tg-mute);font-size:10px}
.tgtk-pinmain{flex:1 1 auto;min-width:0;display:flex;align-items:center;overflow:hidden}
.tgtk-pinmain .tgtk-name{font-size:12px;line-height:1.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-pinactions{flex:none;display:flex;align-items:center;gap:2px}
.tgtk-grip{width:17px;height:17px;padding:0;display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--tg-line);border-radius:4px;background:var(--tg-sunken);color:var(--tg-mute);
  font:10px/1 -apple-system,"Segoe UI",Arial,sans-serif;letter-spacing:-1px;
  cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none}
.tgtk-grip:hover{color:var(--tg-accent-fg);border-color:rgba(228,111,161,.6);background:rgba(228,111,161,.12)}
.tgtk-grip:active{cursor:grabbing}
.tgtk-pinactions .tgtk-mini{width:17px;height:17px;padding:0;display:inline-flex;align-items:center;
  justify-content:center;font-size:11px;line-height:1;border-radius:4px;
  border:1px solid rgba(228,111,161,.45);background:rgba(228,111,161,.14);color:var(--tg-accent-fg)}
.tgtk-pinactions .tgtk-mini:hover:enabled{background:var(--tg-accent);border-color:var(--tg-accent);color:#fff}
.tgtk-pinactions .tgtk-mini:disabled{opacity:.38;border-color:var(--tg-line);background:var(--tg-sunken);color:var(--tg-mute)}
.tgtk-pinactions .tgtk-mini-x:hover:enabled{background:var(--tg-bad);border-color:var(--tg-bad);color:#fff}
.tgtk-mini-x:hover{color:var(--tg-bad);background:var(--tg-badbg)}
.tgtk-secthead{display:flex;align-items:center;gap:6px;width:100%;padding:2px 0;border:0;background:none;
  color:inherit;font:inherit;text-align:left;cursor:pointer}
.tgtk-secthead:hover .tgtk-caret,.tgtk-secthead:focus-visible .tgtk-caret{color:var(--tg-accent-fg)}
.tgtk-secthead:focus{outline:none}
.tgtk-caret{flex:none;width:12px;color:var(--tg-mute);font-size:10px;line-height:1;transition:transform .12s ease}
.tgtk-sectcount{margin-left:auto;color:var(--tg-mute);font-size:11px;white-space:nowrap}
.tgtk-sectbody{display:flex;flex-direction:column;gap:6px;padding:6px 0 2px}
.tgtk-sectbody[hidden]{display:none}
.tgtk-botrow{cursor:default}
.tgtk-botx{flex:none;height:18px;padding:0 7px;border-radius:999px;border:1px solid rgba(228,111,161,.45);
  background:rgba(228,111,161,.12);color:var(--tg-accent-fg);font:inherit;font-size:10px;line-height:1;cursor:pointer}
.tgtk-botx:hover{background:var(--tg-bad);border-color:var(--tg-bad);color:#fff}
.tgtk-pintoast{position:fixed;left:50%;top:18px;z-index:2147483000;transform:translate(-50%,-6px);
  padding:5px 14px;border-radius:999px;background:var(--tg-accent);color:#fff;font-size:12px;
  line-height:1.7;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.32);
  opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease}
.tgtk-pintoast.tgtk-toast-on{opacity:1;transform:translate(-50%,0)}
.tgtk-notebtn{display:inline-flex;align-items:center;justify-content:center}
.tgtk-notebtn.tgtk-on{background:rgba(228,111,161,.16);border-color:rgba(228,111,161,.45);color:var(--tg-accent-fg)}
.tgtk-noteview{flex:1 1 auto;min-height:260px;display:flex;flex-direction:column;gap:6px;padding:10px 12px 12px}
.tgtk-noteview[hidden]{display:none}
#tgtk-panel .tgtk-notebody{flex:1 1 auto;min-height:150px;width:100%;resize:none;padding:8px 10px;
  border:1px solid var(--tg-line);border-radius:8px;background:var(--tg-sunken);color:var(--tg-fg);
  font-size:13px;line-height:1.75;outline:none}
#tgtk-panel .tgtk-notebody:focus{border-color:var(--tg-accent)}
#tgtk-panel .tgtk-notebody::placeholder{color:var(--tg-mute)}
.tgtk-notefoot{flex:0 0 auto;display:flex;align-items:center;gap:6px;color:var(--tg-mute);font-size:11px}
.tgtk-notefoot .tgtk-spacer{flex:1;min-width:2px}
.tgtk-notefoot .tgtk-btn{flex:none;font-size:11px;padding:3px 9px}
.tgtk-syncbox{margin:4px 0;padding:6px 8px;border:1px solid var(--tg-line);border-radius:8px;background:var(--tg-sunken)}
.tgtk-syncbox summary{cursor:pointer;color:var(--tg-accent-fg);font-size:12px;font-weight:500;outline:none}
.tgtk-syncbox[open] summary{margin-bottom:6px}
.tgtk-syncbox textarea{box-sizing:border-box;width:100%;resize:vertical;min-height:52px;margin-top:4px;
  padding:5px 7px;border-radius:6px;border:1px solid var(--tg-line);background:var(--tg-sunken);
  color:var(--tg-fg);font:11px/1.45 ui-monospace,Menlo,Consolas,monospace;outline:none}
.tgtk-syncbox textarea:focus{border-color:var(--tg-accent)}
.tgtk-syncbox .tgtk-stat{margin:2px 0 6px}
.tgtk-syncbox .tgtk-line{margin:3px 0}
#tgtk-star{position:fixed;right:12px;bottom:12px;z-index:2147483002;width:24px;height:24px;padding:0;
  border-radius:50%;border:1px solid var(--tg-line);background:var(--tg-bg);color:var(--tg-mute);
  font-size:14px;line-height:22px;text-align:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.22)}
#tgtk-star:hover{border-color:var(--tg-accent);color:var(--tg-accent)}
#tgtk-star.tgtk-star-on{color:#f5b73d;border-color:#e6a72c;background:#3a2c14;text-shadow:0 0 8px rgba(245,183,61,.6)}
#tgtk-star[data-theme="light"].tgtk-star-on{background:#fff3d6;color:#b8790d;border-color:#e0a938}
.tgtk-starpop{position:fixed;z-index:2147483007;width:240px;max-width:calc(100vw - 12px);box-sizing:border-box;
  padding:8px;display:flex;flex-direction:column;gap:6px;background:var(--tg-bg);color:var(--tg-fg);
  border:1px solid var(--tg-line);border-radius:9px;box-shadow:0 12px 36px rgba(0,0,0,.5);
  font:12px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tgtk-starpop .tgtk-favpoplist{max-height:210px}
.tgtk-starpop,.tgtk-favpop{max-height:calc(100vh - 12px);overflow-y:auto}
.tgtk-starpop .tgtk-line input,.tgtk-starpop .tgtk-line select{min-width:0;flex:1}
.tgtk-startip{color:var(--tg-dim);font-size:11px}
.tgtk-starcreate{padding-top:6px;border-top:1px solid var(--tg-line-soft);display:flex;flex-direction:column;gap:4px}
.tgtk-starremove{width:100%;margin-top:4px}
.tgtk-starpop .tgtk-starfoot{justify-content:space-between;gap:6px;padding-top:6px;
  border-top:1px solid var(--tg-line-soft)}
.tgtk-starpop .tgtk-starfoot .tgtk-btn{flex:none;min-width:56px}
.tgtk-starpop .tgtk-starcreate .tgtk-line{gap:5px}
#tgtk-panel .tgtk-favtools .tgtk-line{gap:6px;flex-wrap:nowrap}
#tgtk-panel .tgtk-favtools .tgtk-allowwrap{flex-wrap:wrap}
#tgtk-panel .tgtk-favtools .tgtk-label{flex:none;min-width:48px}
#tgtk-panel .tgtk-favtools .tgtk-spacer{flex:1;min-width:2px}
#tgtk-panel .tgtk-favtools .tgtk-btn{
  flex:none;padding:4px 9px;min-height:26px;font-size:11px;font-weight:400;line-height:1.35;
  border:1px solid var(--tg-line);border-radius:6px;background:var(--tg-surface);color:var(--tg-fg2)}
#tgtk-panel .tgtk-favtools .tgtk-btn:hover{border-color:var(--tg-accent);color:var(--tg-accent-fg);background:var(--tg-hit)}
#tgtk-panel .tgtk-favtools .tgtk-btn.tgtk-primary{
  font-weight:400;color:var(--tg-accent-fg);background:var(--tg-surface);border-color:rgba(228,111,161,.45)}
#tgtk-panel .tgtk-favtools .tgtk-btn.tgtk-danger,
#tgtk-panel[data-theme="light"] .tgtk-favtools .tgtk-btn.tgtk-danger{
  font-weight:400;color:var(--tg-bad);background:var(--tg-surface);border-color:var(--tg-line)}
#tgtk-panel .tgtk-favtools .tgtk-btn.tgtk-danger:hover{border-color:var(--tg-bad)}
#tgtk-panel .tgtk-favtools select{flex:1;min-width:0;max-width:none}
#tgtk-panel .tgtk-favtools #tgtk-favfolder,
#tgtk-panel .tgtk-favtools #tgtk-favsort{flex:0 0 138px;width:138px;max-width:138px}
#tgtk-panel .tgtk-favtools .tgtk-favaddline input[type=text],
#tgtk-panel .tgtk-favtools .tgtk-favaddline input[type=search]{flex:1 1 auto;min-width:0;width:auto}
#tgtk-panel .tgtk-favtools .tgtk-favaddline #tgtk-favaddfolder{flex:0 0 104px;width:104px;max-width:104px}
#tgtk-panel .tgtk-favtools input[type=text]{flex:1;min-width:0;width:auto}
#tgtk-panel .tgtk-favtools .tgtk-syncbox .tgtk-line{flex-wrap:wrap}
#tgtk-panel .tgtk-favtools .tgtk-syncbox select{flex:none;width:auto;max-width:190px}
#tgtk-panel .tgtk-favtools .tgtk-syncbox input[type=text]{flex:1;min-width:120px}
#tgtk-panel .tgtk-favtools .tgtk-favpick .tgtk-btn{padding:4px 9px;font-size:11px}
.tgtk-starpop input[type=text],.tgtk-starpop select{
  box-sizing:border-box;min-width:0;flex:1;padding:4px 7px;border-radius:6px;
  border:1px solid var(--tg-line);background:var(--tg-sunken);color:var(--tg-fg);
  font:inherit;font-size:11px;outline:none}
.tgtk-starpop input[type=text]:focus,.tgtk-starpop select:focus{border-color:var(--tg-accent)}
.tgtk-starpop .tgtk-favhead{font-size:11px;font-weight:400;color:var(--tg-dim)}
.tgtk-starpop .tgtk-favhead span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-starpop .tgtk-favrow.tgtk-on{outline:1px solid rgba(228,111,161,.4);background:var(--tg-surface3)}
.tgtk-starpop .tgtk-btn,.tgtk-starpop .tgtk-btn.tgtk-primary,
.tgtk-starpop .tgtk-btn.tgtk-danger,.tgtk-starpop .tgtk-btn.tgtk-starremove{
  padding:5px 10px;font-size:11px;font-weight:400;border-radius:6px;
  border:1px solid var(--tg-line);background:var(--tg-surface);color:var(--tg-fg2)}
.tgtk-starpop .tgtk-btn:hover{border-color:var(--tg-accent);color:var(--tg-accent-fg);background:var(--tg-hit)}
.tgtk-starpop .tgtk-btn.tgtk-primary{color:var(--tg-accent-fg);border-color:rgba(228,111,161,.45)}
.tgtk-starpop .tgtk-starremove,.tgtk-starpop .tgtk-starremove:hover{color:var(--tg-bad);background:transparent}
.tgtk-starpop .tgtk-starremove:hover{border-color:var(--tg-bad)}
.tgtk-histpop{position:fixed;z-index:2147483007;width:432px;max-width:calc(100vw - 12px);box-sizing:border-box;
  padding:8px;display:flex;flex-direction:column;gap:6px;background:var(--tg-bg);color:var(--tg-fg);
  border:1px solid var(--tg-line);border-radius:9px;box-shadow:0 12px 36px rgba(0,0,0,.5);
  font:12px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tgtk-histpop .tgtk-favhead{font-size:11px;font-weight:400;color:var(--tg-dim)}
.tgtk-histpop .tgtk-favhead span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-histsum{color:var(--tg-dim);font-size:10px;font-variant-numeric:tabular-nums}
.tgtk-histlist{display:flex;flex-direction:column;max-height:46vh;overflow-y:auto;box-sizing:border-box;
  border:1px solid var(--tg-line-soft);border-radius:6px}
.tgtk-histrow{display:grid;grid-template-columns:86px 1fr 1fr 1fr;gap:6px;align-items:center;
  padding:4px 8px;border-bottom:1px solid var(--tg-line-soft);font-variant-numeric:tabular-nums}
.tgtk-histrow:last-child{border-bottom:0}
.tgtk-histrow i{font-style:normal;text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-histrow i:first-child{text-align:left;color:var(--tg-fg2)}
.tgtk-histrow:not(.tgtk-histhd):hover{background:var(--tg-hit)}
.tgtk-histhd{position:sticky;top:0;z-index:1;background:var(--tg-sunken2);color:var(--tg-mute);
  font-size:10px;font-weight:600;border-bottom:1px solid var(--tg-line)}
.tgtk-histempty{color:var(--tg-mute);font-size:11px;padding:16px 8px;text-align:center}
.tgtk-histfoot{display:flex;align-items:center;justify-content:space-between;gap:8px;
  border-top:1px solid var(--tg-line-soft);padding-top:6px}
.tgtk-histstat{color:var(--tg-mute);font-size:10px}
.tgtk-histpop .tgtk-btn{flex:none;padding:4px 10px;font-size:11px;font-weight:400;line-height:1.35;
  border:1px solid var(--tg-line);border-radius:6px;background:var(--tg-surface);color:var(--tg-fg2);cursor:pointer}
.tgtk-histpop .tgtk-btn:hover:enabled{border-color:var(--tg-accent);color:var(--tg-accent-fg);background:var(--tg-hit)}
.tgtk-histpop .tgtk-btn:disabled{opacity:.45;cursor:default}
.tgtk-histpop.tgtk-gxmodal{position:fixed !important;left:50% !important;top:50% !important;
  transform:translate(-50%,-50%);width:820px;max-width:calc(100vw - 32px);max-height:86vh;
  z-index:2147483010;padding:12px 14px;gap:8px;font-size:13px;border-radius:12px;
  overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.55)}
.tgtk-histpop.tgtk-gxcenter{position:fixed !important;left:50% !important;
  top:calc(50% - 170px) !important;right:auto !important;bottom:auto !important;
  transform:translateX(-50%);
  z-index:2147483010;max-height:calc(50vh + 154px);
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 20px 52px rgba(0,0,0,.5)}
.tgtk-histpop.tgtk-gxcenter > :not(.tgtk-histlist){flex:none}
.tgtk-histpop.tgtk-gxcenter .tgtk-histsum{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tgtk-histpop.tgtk-gxcenter .tgtk-histlist{flex:0 1 auto;min-height:120px;max-height:none;overflow-y:auto}
.tgtk-histpop.tgtk-gxmodal.tgtk-gxbid{width:465px}
.tgtk-gxmodal .tgtk-favhead{font-size:13px;gap:10px;align-items:center;min-height:24px}
.tgtk-gxmodal .tgtk-gxheadtitle{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;color:var(--tg-fg)}
.tgtk-gxheadright{display:flex;align-items:center;gap:4px;flex:none}
.tgtk-gxmodal .tgtk-gxnav{padding:2px 8px !important;font-size:11px !important;line-height:1.4 !important}
.tgtk-gxmodal .tgtk-favclose{font-size:18px;padding:0 6px}
.tgtk-gxmodal .tgtk-histlist{max-height:56vh}
.tgtk-gxmodal .tgtk-histrow{padding:6px 10px;font-size:12.5px}
.tgtk-gxmodal .tgtk-histsum{font-size:12px;color:var(--tg-fg2)}
.tgtk-gxmodal .tgtk-gxfoot{justify-content:flex-start;gap:10px;border-top:0;padding-top:0}
.tgtk-gxlabels{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;color:var(--tg-mute);font-size:12px}
.tgtk-gxlabels .tgtk-gxsum{text-align:right;color:var(--tg-fg2);font-size:12px;font-variant-numeric:tabular-nums}
.tgtk-gxrow{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:center}
.tgtk-gxrow input{width:100%;height:38px;box-sizing:border-box;padding:0 10px;font-size:15px;
  border:1px solid var(--tg-line);border-radius:8px;background:var(--tg-surface);color:var(--tg-fg);
  font-variant-numeric:tabular-nums}
.tgtk-gxrow input:focus{outline:none;border-color:var(--tg-accent)}
.tgtk-gxrow .tgtk-gxok{height:38px;padding:0 26px;font-size:14px;font-weight:600}
.tgtk-gxbid .tgtk-gxquick{font-size:13px;gap:16px;padding:2px 2px 7px}
.tgtk-gxbid .tgtk-gxmsg{padding-top:2px}
.tgtk-gxfoot .tgtk-gxmsg{flex:1 1 auto;min-width:0}
.tgtk-gxwarn{margin-left:auto;flex:none;display:inline-flex;align-items:center;gap:4px;
  color:var(--tg-mute);font-size:11px;line-height:1.4;cursor:pointer;user-select:none;white-space:nowrap}
.tgtk-gxwarn input{margin:0;width:12px;height:12px;cursor:pointer;accent-color:#d4568e}
`;

  function hostAlive() {
    try {
      return !!(HWIN.__TGTK_HOST__ && Date.now() - num0(HWIN.__TGTK_BEAT__) < 6000);
    } catch (e) { return false; }
  }
  function claimHost() {
    try {
      HWIN.__TGTK_HOST__ = HOST_TOKEN;
      HWIN.__TGTK_BEAT__ = Date.now();
    } catch (e) {}
  }
  function releaseHost() {
    try {
      if (HWIN.__TGTK_HOST__ !== HOST_TOKEN) return;
      cleanupHostUI();
      delete HWIN.__TGTK_HOST__;
      delete HWIN.__TGTK_BEAT__;
    } catch (e) {}
  }
  function cleanupHostUI() {
    try {
      for (const d of allDocs()) {
        ['tgtk-fab', 'tgtk-panel', 'tgtk-star', 'tgtk-starbox', 'tgtk-hist', 'tgtk-starpop', 'tgtk-histpop', 'tgtk-style'].forEach((id) => {
          const x = d.getElementById(id);
          if (x) x.remove();
        });
        d.querySelectorAll('#tgtk-docksw, .tgtk-dockitem').forEach((x) => {
          const li = x.closest ? x.closest('li.tgtk-dockitem') : null;
          if (li) li.remove();
          else x.remove();
        });
        d.querySelectorAll('.tgtk-sug,.tgtk-favpop,.tgtk-starpop,.tgtk-histpop').forEach((x) => x.remove());
      }
    } catch (e) {}
    els = null;
    favPop = null;
    favPopBtn = null;
    sugBox = null;
    sugInput = null;
  }
  let beatStarted = false;
  function startBeat() {
    setInterval(() => {
      try {
        if (HWIN.__TGTK_HOST__ !== HOST_TOKEN) return;
        HWIN.__TGTK_BEAT__ = Date.now();
      } catch (e) {}
    }, 1500);
  }

  function boot() {
    if (!HOST.outer && window.top !== window.self && window.innerWidth < 680) return;
    const alive = hostAlive();
    const mine = HWIN.__TGTK_HOST__ === HOST_TOKEN;
    if (alive && !mine) return; // 已有活的主实例
    if (HDOC.getElementById('tgtk-fab')) cleanupHostUI(); // 残留的僵尸 UI
    claimHost();
    bindDismissHandlers();
    if (!beatStarted) { beatStarted = true; startBeat(); }

    const style = HDOC.createElement('style');
    style.id = 'tgtk-style';
    style.textContent = CSS;
    (HDOC.head || HDOC.documentElement).appendChild(style);

    const fab = h(
      'button',
      { id: 'tgtk-fab', type: 'button', title: '小圣杯工具箱 v2.3.34（Alt+T）· 可拖动，双击复位' },
      '工具箱'
    );
    fab.addEventListener('click', () => {
      if (fab.dataset.tgtkDragged === '1') {
        fab.dataset.tgtkDragged = '';
        return;
      }
      if (!els) buildUI();
      togglePanel();
    });
    HDOC.body.appendChild(fab);
    makeDraggable(fab, fab, {
      key: 'fabPos',
      onMove: () => {
        hideCharaSuggest();
        hideFavPop();
      },
    });
    mountDockSwitch();
    syncFabVisible();
    startStarBadge();
    startGrailExtras();
    startIcoTicker();
    HWIN.__TGTK_AUTOFILL_FN__ = clearFavAddAutofill;
    const guardFn = () => { const f = HWIN.__TGTK_AUTOFILL_FN__; if (typeof f === 'function') f(); };
    if (!HWIN.__TGTK_AUTOFILL_GUARD__) {
      HWIN.__TGTK_AUTOFILL_GUARD__ = true;
      setInterval(guardFn, 600);
      const sweep = () => [0, 120, 500, 1500, 3000].forEach((ms) => setTimeout(guardFn, ms));
      sweep();
      try { HWIN.addEventListener('load', sweep); } catch (e) {}
      try { HWIN.addEventListener('pageshow', sweep); } catch (e) {}
      try { HDOC.addEventListener('visibilitychange', () => { if (!HDOC.hidden) sweep(); }); } catch (e) {}
    } else {
      [0, 120, 500, 1500, 3000].forEach((ms) => setTimeout(guardFn, ms));
    }
    const ui = readUI();
    if (TABS.includes(ui.tab)) S.tab = ui.tab;
    if (ui.left !== null && ui.left !== undefined && ui.top !== null && ui.top !== undefined &&
        Number.isFinite(Number(ui.left)) && Number.isFinite(Number(ui.top))) {
      S.panelPos = { left: Number(ui.left), top: Number(ui.top) };
    }
    if (ui.open) {
      if (!els) buildUI();
      els.panel.hidden = false;
      S.panelOpen = true;
      applyPos(els.panel, 'panelPos');
      writeUI({ open: true, tab: S.tab });
    }
    window.addEventListener('pagehide', releaseHost, { once: true });
    if (S.syncAuto && cloudConfigured()) cloudPull(false).catch(() => {});
    setTimeout(() => { cldPull().catch(() => {}); }, 1200);
  }

  setInterval(() => {
    try {
      if (hostAlive()) return;
      if (!HWIN.__TGTK_HOST__) { boot(); return; }
      cleanupHostUI();
      claimHost();
      boot();
      if (!HDOC.getElementById('tgtk-fab')) {
        try { delete HWIN.__TGTK_HOST__; } catch (e) {}
      }
    } catch (e) {}
  }, 2000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
