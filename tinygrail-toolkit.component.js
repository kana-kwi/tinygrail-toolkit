/**
 * 小圣杯工具箱 · Bangumi 超合金组件
 * ------------------------------------------------------------------
 * 功能：
 *   1) 塔筛选：固定资产阈值（默认 < 250）与「塔图是否换过」各带一个勾选，勾哪个就按哪个筛，
 *      两个都勾 = 同时满足，都不勾 = 显示全部（原来的「显示全部」开关已删除，它和阈值会互相打架）
 *      （默认立绘判 URL：lain.bgm.tv / pic/crt 未换，OSS 或外链为已换）
 *      · 我的塔分页并发拉（5 路）、页间不再固定 sleep：九千座塔从一分多钟缩到几秒
 *      · 一次最多画 300 行（九千行 DOM 会把页面和工具箱一起卡死），统计与「复制」仍按全部算
 *      · **筛选前提：固定资产上限 ≥ 500 才算建成 1 级圣殿**；上限 < 500 的未建成塔
 *        在扫描完就剔除，不进列表 / 统计 / 复制，统计行会写明排除了几座
 *      · 筛塔 / 持股 / 收藏的「复制」统一只导出角色数字 ID（空格分隔、去重），
 *        可直接粘进收藏的「手动添加」或角色筛选框；收藏只导当前打开的收藏夹
 *        （选「全部收藏夹」时按角色去重）
 *      · 统计只写当前勾选条件下的结果：「共 9340 座塔 · 未换塔图：4862 座」
 *      · 用户名默认填自己的（空着就自动补，切页回来也会补）
 *   2) 持股筛选：拉取自己的全部持仓，按角色等级区间、最少持股数筛选
 *      （每行附带「距下一级还差多少股」的进度，等级门槛为 7500×1.3^(n-1)）
 *      · 分页并发拉（5 路）、页间不再固定 sleep：几千只持仓从十几秒缩到两三秒
 *      · 扫完的列表缓存 5 分钟，与「星光碎片」共用；搜索 / 换筛选只是本地过滤，不会重扫
 *      · 一次最多渲染 300 行（几千行 DOM 会卡），搜索与筛选仍然覆盖全部持仓
 *      · 搜索框支持数字 ID 候选 + 一次填多个（空格隔开，按「或」匹配）
 *   3) 幻想乡：查询指定角色被「幻想乡」(blueleaf) 持有的数量与占比
 *   4) 收藏：收藏角色，页面内查看持股数 / 自己这座塔的固资（当前 / 上限） / 英灵殿数量；
 *      收藏夹一律同级、支持自定义名称，角色可随时换夹；角色页嵌一枚小 ★：
 *      旧版小圣杯挂「K线图」右侧（容器零宽、不撑标题行，星星再多也不会被挤到行末），
 *      新版挂星级图标行右侧 / 自带「收藏」按钮右边；
 *      点一下就能把当前角色收进指定收藏夹，已收藏时点亮，切角色会自动刷新；
 *      旧版角色页在 ★ 右边并排挂一枚同尺寸「$」按钮，点开自建的历史交易浮层
 *      （页面居中；时间 / 均价 / 数量 / 金额，可往前翻更早；新版 React 页面自带入口，不重复挂）；
 *      旧版插件重复注入的多余交易框，页面稳定后自动只留一份（默认开启；
 *      初始化与「开启交易」换框期间不动 DOM，避免闪烁或把新框藏掉）；
 *      只在角色页出现，首页 / 列表页不显示（右下角不再有兜底圆标）；
 *      同一角色可同时收进多个收藏夹（身份是「夹 + 角色」，列表按当前夹显示与计数）；
 *      默认收藏夹删不掉，那个位置的按钮改成「清空」：只移出夹里的角色，夹子保留；
 *      「收藏」页 →「跨设备同步」里的「导入小圣杯收藏」按 tinygrail:favorites 的夹结构精确解析，
 *      自动跳过未上市与无效角色；同时兼容小圣杯 2.0 之前的旧版组件（#grailBox jQuery 页面）与新版 React 页面
 *   5) 道具：一键连用「混沌魔方」「虚空道标」「鲤鱼之眼」，可设炮塔、目标与执行次数
 *      「次数」三种道具各存各的（每日上限本来就不同：魔方 3 / 道标 5 / 鲤鱼之眼 1），
 *      改一种不会连带改到另外两种，切回来还是上次填的数
 *      两发之间留 1.5 秒以上随机间隔，避免被服务端节流；撞到每日次数上限立刻中断整批
 *      失败后回查圣殿固资，区分「次数用完」与「真的缺钱」（服务端两种情况同一句文案）
 *      固资不足时可自动献祭「炮塔角色自己」的持股补塔（默认关闭），
 *      判「够不够用」按站点门槛：炮塔固资 ≥ 250 才发得动道具（低于 250 服务端也回「次数用完」）
 *      「单次献祭」= 每轮实际烧掉的股数，补不够自动再补一轮，直到够跑完这一批；
 *      留空则按缺口自动算股数（1 股补 2 固资，奇数向上取整）
 *      献祭一律不越过塔上限：到上限就停，宁可差 1 点也不把上限撑高
 *      （上限一涨，之后每献 1 股只能换 1 固资，等于亏一半）
 *      + 一键冲星：给每个角色贡献指定「数量」的星之力（1 固资 = 1 星之力），
 *        与它当前已有多少星之力无关；支持一次填多个角色，固资不够可自动献祭补充。
 *        每批自动按这座塔的固资上限切分（不用手填单次），收尾可选「补满 / 补到 250 / 不补」，
 *        同样不越过上限：237 固资、500 上限时收尾只补到 499（献 131 股），不会撑成 501；
 *        补到 250 是给「只留 250 固资、避免被虚空道标打中」的玩法准备的；
 *        「预计消耗活股」会先读塔里当前的固资，按真实余量算，不是按上限瞎估
 *      + 星光碎片：填目标塔 ID 后自动列出自己的全部持仓，按持股从多到少排列（默认最多 100 只）；
 *        「等级」填几就只看 Lv 几（留空看全部），支持角色名 / ID 一次搜多个（空格分隔）；
 *        活股 = 0（全部挂了卖单）的角色也列在末尾、标「无活股」不能选，不会被过滤掉；
 *        搜索结果不受等级 / 活股 / 100 只上限限制；点燃料名字可打开角色页去取消挂单
 *        · 燃料可多选：点「选」按点选顺序排成队列，行上显示「第 N · 移出」，再点一下移出；
 *          队列摘要里每只也带 × 可单独移出，还有「清空队列」；读全持仓后会自动清掉
 *          旧版单燃料设置遗留的、已不在持仓里的历史 ID。
 *          队列挪到候选列表上面（选得多了不会把「选」按钮挤到很远），小标签只显示
 *          前 6 个字 + …（全名放 title）；队列上面固定一行「目标「…」LvN · 固资 X / 上限 Y」，
 *          不再等到最下面的日志里才看得到
 *          候选列表可按持股「多→少 / 少→多」切换（无活股的始终排最后）
 *          「数量」是本次合计消耗股数，按队列顺序依次扣（第一只不够接着第二只），凑够就停；
 *          某一只失败即停并说明，不会继续往后扣；用完 / 不够时提示再多选几只
 *          充能前会逐只现查活股，列表缓存过期 / 刚挂单的不会被拿去白试
 *        · 「充能」右边直接写「预计 +N 固资」：目标等级 b、燃料等级 a，
 *          a ≥ b−1 时 1 股 = 1 固资；a = b−2 时 1 股 = 0.5 固资，再低一级继续减半
 *          （2^(b−a−1) 股 = 1 固资，股数封顶 32）；注意「1 股 = 2 固资」只适用于
 *          用圣殿角色自己的股做资产重组献祭，且固资不超过上限，星光碎片不适用；
 *          星光碎片可以从上限以下**一次性超充**（如 499/500 用 10000 股 4 级可补到 10499/500），
 *          但冲过上限之后后面的燃料就补不进去了：估算到这一只就截断（603/1250 用 16259 股
 *          补到 16862 后，第二只不能再算），充能循环也在这里停；已经到 / 超过上限直接标「已到上限」
 *          悬停「预计 +N」能看到逐只明细（每只扣多少股、补多少固资）
 *        · 炮塔 / 目标 / 一键冲星 / 星光碎片的目标与燃料，输角色名或数字 ID 都会弹候选，
 *          点一下把 ID 填进去（燃料框以前完全没挂联想）
 *   6) ICO：读取自己参与注资的 ICO，按剩余结束时间从少到多排列
 *      + 每个 ICO 可设「目标等级」并开启自动注资：结束前 N 分钟（默认 1）若还没到该等级，
 *        按缺口一次性补钱；补完即关掉计划并记下结论，刷新不会重复注资
 *      + 计划（ICO id / 角色 id / 结束时间 / 目标等级）存本机：关掉小圣杯页、切到别的
 *        bgm 页面、重开浏览器后都还在，只要任意一个 bgm 页面开着就会继续执行；
 *        结束时间过了还没处理的，会核对一次服务端——真结束就记「错过」，被延期就继续等
 *      + 等级按官方规则推算（扣 50 万税后资金 ≥ n(n+1)(2n+1)/6×10 万，且人数 ≥ 10+5n）
 *      + 「目标 LvN」右边直接写出「上市 LvX」：ICO 等级与上市后的角色等级不再一一对应
 *        （1→2、2→4、3→5、4→6、5→7、6→8、7→8、8→9、9→9、10→9、11→10…18→12），
 *        旧版 ICO 页也会在「发行价」后面补同样的胶囊
 *   7) 账本：资金收支、股数增减、圣殿固资三个维度按来源分类汇总（按日志 Type 字段归类）
 *      + 统计窗口按**自然日**切：第一天 0:00 ~ 最后一天 24:00（范围可选近 3/7/14/30 天，也能自定义起止日；
 *        不是「现在往前推 N×24 小时」，否则首尾两天各被切掉半截，隔几小时再看数就变了）
 *      + 刮刮乐的「次数」按购买次数算（每次 -1000 cc 一条），不按奖励行数（刮一次会掉好几条获奖记录）
 *      + 圣殿固资只统计真有「N 点固定资产」的行，道具奖励那种 0 点的行不再计数
 *      + 账户余额走势 + 按角色股数排行 + 圣殿被道标命中按角色汇总
 *      + 道标文案兼容「71股固定资产」与「34股」两种写法（分别记固资与扣股）
 *      + 竞拍 / 买入记净额（扣掉失败返还、撤单退款），股息按税后计
 *      + 「其他」行只显示「其他」，未识别的具体文案放到悬停提示里
 *      + 股数损失只算真正成交的卖出，献祭按消耗计，星之力转化不计入股数
 *   8) 界面：可切换日间 / 夜间模式；面板与悬浮球都能按住随意拖动，位置记在本机，
 *      双击标题栏或点「⌖」复位；窗口优先挂到最外层页面，能拖出小圣杯区域、盖到页面左侧空白区；
 *      bgm 右下角那条工具条里多一个「工具箱」开关：点一下把胶囊收起来（免得挡页面右下角），
 *      再点一下放出来；收起状态记在本机，Alt+T 也能顺手把胶囊放回来；
 *      主实例心跳 + 看门狗：从左栏 / DD 列表点开角色导致 iframe 重载时也不会卡死，会自动重建；
 *      点角色后工具箱会自动重启，并回到关闭前的标签页与窗口位置；
 *      顶部标签栏可横向滑动，功能再多也不会撑大面板；
 *      炮塔 / 目标 / 冲星 / 星光碎片 / 收藏 / 筛塔角色列表 / 幻想乡等输入框都支持
 *      直接填角色名，右侧弹出候选（名称 + ID），点一下即可填入 ID
 *      多目标输入框（幻想乡 / 一键冲星）最右侧有「清空」，一键清掉整串 ID
 *   9) 收藏夹快选：道具页炮塔 / 目标、一键冲星角色、星光碎片目标 / 燃料、幻想乡角色栏
 *      右侧的「★」按钮，点开浮层可按收藏夹筛选、搜索并单选角色直接填入
 *      （一键冲星 / 幻想乡支持连续点多个）；浮层里的角色等级会自动补拉，不必先去收藏页刷新
 *  10) 跨设备同步：收藏数据默认存本机，但可导出 / 导入「同步码」（含收藏夹 / 置顶名单 / 云配置），
 *      Bangumi 组件环境下还会把置顶名单 / 每行个数自动写进 chiiApp.cloud_settings（按 ts 仲裁，
 *      停用组件会被删，所以它只是自动同步、不是备份）；chiiApp 会依次在「脚本作用域 /
 *      各窗口的 window / 所有同源 iframe」里找（组件跑在 iframe 时它挂在组件自己的 window 上），
 *      都没有就静默跳过、只把探测结果打到控制台，
 *      也可选自动云同步（GitHub 私密 Gist，或任意支持 GET 读 / PUT 写 JSON 的自定义接口）；
 *      合并按时间戳取新，删除带墓碑，两端新增与删除都能对齐
 *  11) 旧版小圣杯页面增强（新版自带，不重复插；功能常驻，默认设置生效；
 *      工具箱不再有「增强」页，圣殿尺寸开关改嵌角色页「[显示全部]」右边）：
 *      + 角色页标题行：拍卖信息直接写在「往期竞拍」左边——蓝=竞拍人数 / 已拍股数，
 *        粉=我的出价 / 我的股数（没参与拍卖就不显示粉的那段）
 *      + 各级圣殿数量 (3级 + 2级 + 1级) 紧跟在「固定资产」数字后面
 *      + 站点的「上期公示」改成「往期竞拍」入口：成功记录按出价从高到低置顶，
 *        顶部汇总里带均价 / 中位价；浮层水平居中、顶部钉住（数据变多只向下延长，
 *        表头 / 翻周按钮不上下跑），保持 432px 紧凑长度，
 *        右上角 [后一周][前一周][×]，空周也不藏「前一周」（能一直往前找）；
 *        标题只留「角色名 -「#id」」
 *      + 「参与竞拍」换成自己的浮层：页面居中（465px），带补满 / 改量 / 改价，
 *        已参与过这一轮时价格 / 数量自动回填「我已拍的值」（站点是整条覆盖，
 *        再拍 1 股会把原来的股数顶掉）；右下角「数量降低提醒」勾选后，
 *        这次数量低于已拍数量会先确认一次；取消竞拍粉底白字；
 *        拍满 / 可拍 0 股（萌王投票）都不再拦，一律允许出价
 *      + 自己的圣殿置顶 + 名字标粉；圣殿区可整体缩放（小 = 一行 7 个 / 中 / 大）
 *      + 通天塔日志照新版 chara/star/log/{page}/30 重画：Type 5「冲星成功」不再
 *        误写成「受到攻击 -N」，补 ★ 与 ✦星之力，带上一页/下一页/刷新；
 *        头像按旧版 normalizeAvatar 转 CDN（OSS / /avatar 路径 + !w120，失败露默认图）；
 *        前 500 名的 #排名 与 ✦星之力 合成深色徽章；用户名过长只省略名字；
 *        宿主钉死旧版真实锚点 #starForces .logs（不再按「带 ago 的列表」猜，
 *        否则会反复接管自己的面板），新版 React 日志不动
 *      + 股息已高于低保、或今天已经领取时隐藏超展开首页的签到按钮
 *        （用 id 规则压住，站点重绘也不会再冒出来；第二天自动恢复）
 *      + 个人主页小圣杯右上角「[折叠] / [展开]」，状态记在本机；
 *        折叠时内容与分页一起收起（loadPager 把 #pagerN 插在 #grail 外面，
 *        是兄弟节点，只遍历 #grail 子节点会漏）；超展开首页（/rakuen）浮层不挂按钮
 *      + 萌王榜鼠标悬停显示信息卡（人数 / 均价 / 拍卖数 / 英灵殿 / 评分），
 *        评分抹掉后两位（17,744,500 → 177,445）；新版 React 页面没有 #topWeek 容器，
 *        按卡片结构反查，一并能用
 *  12) 新版小圣杯（tg-* 页面）增强（功能常驻，默认设置生效；
 *      圣殿尺寸开关嵌在圣殿表头、右侧「筛选」框左边并与之对齐）：
 *      + 角色页「交易记录」右边直接写出拍卖情况：蓝=竞拍人数 / 竞拍数量，
 *        粉=我的出价 / 我的数量（没参与拍卖就不显示粉的那段，和旧版角色页一致）；
 *        按钮行不再靠固定 id / 精确文案找，按可见按钮 + 同行动词定位，
 *        React 重绘立刻重贴，不会被抹掉
 *      + 圣殿列表头「固定资产 N」后面补各级圣殿数量 (3级 + 2级 + 1级)；
 *        等级按「固定资产上限」算（500 / 2500 / 12500），不看当前固资
 *        （接口的 Level 会按当前固资低报，比如上限 2500、当前 487 会回到 Lv1）；
 *        新版角色页的 LINK 圣殿在「LINK」区和「圣殿」网格里各显示一次，统计按 Id 去重、
 *        只算一座（chara/temple 不含 LINK 塔，要并 chara/links）；
 *        旧版圣殿列表本来就不显示 LINK 塔，旧版只取 chara/temple、不合并
 *      + 竞拍弹窗的数量默认「我已经拍过的股数」，没参与过才是 1 股
 *        （站点默认是整座英灵殿）；缓存还没就绪时先按 1 股，数据回来后自动补正；
 *        补满 / 改量 / 改价 新版自己就有，插件不再重复加
 *      + 同一个角色可能同时有「我的塔」和「别人的塔」（站点会把重复的合并成一张卡，点开仍是各自那座）：
 *        归属判定按「角色 + 塔主」缓存，且站点的操作行（修改 / 重置 / LINK…）优先于任何缓存。
 *        以前只按角色 ID 记，先点过别人的塔再点自己的，裁剪键就会变成复制 / 修改
 *      + 圣殿尺寸「小」= 一行 6 个；规则改按 id 注入样式表（不再打在会被
 *        React 换掉的节点属性上），点塔图重绘也不会闪回一行 5 个；
 *        角色页点塔图再关闭那一拍同理：列数 / 尺寸规则都扩到角色页容器，
 *        「小」的 6 列额外挂在 <html> 的持久 class 上；DOM 观察器发现圣殿列表被
 *        整块换掉时**当场同步**补尺寸标记（不再 setTimeout 到下一帧），重绘不闪
 *      + 收藏星标挂到小圣杯自带的「收藏」按钮右边
 *  13) 塔图工具箱（新旧版通用）：自己的塔只挂「自由裁剪」，别人的塔只挂「复制 / 修改」
 *      + 图片图标按钮打开自建裁剪浮层：固定 3:4 竖图，可拖框 / 拉角 / 滑杆缩放、
 *        本地选图或粘贴地址；默认「原图画质」按裁剪框的原图分辨率导出，PNG 走无损、
 *        JPEG 质量 1，3:4 原图拉满框时直接传原文件字节（一次重编码都不做），
 *        也可切「标准 480×640」省流量；签名用真实 MIME，URL 仍 .jpg（与站点一致）
 *      + 复制当前塔图到我的圣殿；修改按激进版接口 chara/temple/cover/{cid}/{uid}，
 *        新版没有数字 uid 时用 data-user-name 从 chara/temple/{cid} 反查
 *      + 新版自己的塔：图片裁剪键左边多一个「视频」图标键（圆润播放三角，与裁剪键同尺寸），
 *        跳到作者做的视频转 GIF 工具（https://fuyuake.top/xsb/link/crop，新标签打开）
 *      + 塔图工具条多一个「复制塔图地址」图标键（两个套环，22×22，与裁剪键同款；
 *        自己的塔排在裁剪/视频左边，别人的塔排在「修改」右边）：
 *        GIF 塔的图是 canvas，右键拿不到链接，这里直接从 Cover 取值塞进剪贴板；
 *        换塔时粘进「图片地址」即可，动图也能整段带过去
 *      + 封面有两个域名：OSS 源站（tinygrail.oss-cn-hangzhou.aliyuncs.com）开了原图保护，
 *        裸地址在浏览器里 403「Forbidden access to the original image」；站点实际显示用的是
 *        CDN（tinygrail.mange.cn），右键「复制图片地址」拿到的就是它。所以
 *        「复制塔图地址」一律给 CDN 那个（能直接打开），提交时再换回站点自己存的裸 cover 路径
 *        —— 反过来会把带样式参数的 URL 存进站点，画质和动画都会出问题
 *      + 「图片地址」框不再只认回车：粘贴、失焦、以及直接点「确定并更换」都会先把地址
 *        记进状态再提交（以前粘完直接点确定会白报「请选择图片」）
 *      + 小圣杯的封面 Bucket 只对自家站点开放：从 bgm 页面（file://、bgm.tv 都算外站）
 *        取 tower cover 一律 403，像素根本读不到。所以静态图也照 GIF 的做法兜一层——
 *        地址读不到像素时不做裁剪，直接把原地址 POST 给站点（站点自己居中裁切 3:4）。
 *        这就是「从动图换回静态图」唯一的通路；能读到像素（本地文件 / data: URL /
 *        开了 CORS 的图床）时仍然正常裁剪。
 *      + 新版 GIF 塔图是 <canvas> 画的，DOM 里没有图片地址：复制时同样从接口取 Cover，
 *        不再报「没读到塔图地址」
 *      + GIF 动图无法用 canvas 裁剪（只能取到一帧），选到 GIF 时交给「小圣杯自己的上传通道」：
 *        本地文件优先塞进站点自己的 file input（借它的「修改」上传）；站点没有现成 input 时，
 *        点「修改」之前先劫持 HTMLInputElement.prototype.click，站点刚创建的文件框一被
 *        click() 就把这张 GIF 塞进去并派发 change —— 不会再弹系统选图框让用户选第二次；
 *        站点自己的上传才会写出 .gif 的 Cover，刷新后仍是动图。
 *        别人的塔：站点完全不渲染「修改」，也就没有 .gif 上传通道 —— 工具箱直传只能写
 *        .jpg（写 .gif 会被 OSS 判签名不匹配 → HTTP 403），所以直接提示「只能换静态图」，
 *        不再传上去变静态图或报错；地址来的 GIF 仍按原地址提交。LINK 拼图要切两半，只收静态图
 *      + 新版按钮贴「固定资产 N / N」那行最右，纯图片弹窗浮在塔图右下；
 *        旧版自己的塔放在 .action 第二行开头（[闪光结晶] 前），别人的塔挂在行末
 *      + LINK 连接卡片 data-id 是 cid_uid，与普通圣殿 uid#cid 相反，两种都认；
 *        读不到 ID 时按封面哈希反查，避免 LINK 过的塔不显示工具按钮
 *      + 裁剪浮层一律挂最外层文档 + z-index 上限；站点弹窗可能在别的文档 / 更高层级
 *        iframe，光调 z-index 压不住，裁剪期间给所有文档打 tgtk-crop-open 让弹窗隐身、
 *        iframe 降层，关闭时还原（React 重绘后每轮重贴）
 *      + 图片可直接拖进浮窗黑色区域（也支持 Ctrl+V 粘贴截图、拖网页图片 URL）
 *      + 裁剪浮层本身用原生 <dialog>.showModal()：站点塔图弹窗是 daisyUI 的
 *        dialog.modal，模态会让对话框外全部 inert、且它在 top layer，普通 div 压不住也点不动
 *      + 旧版固定资产大于上限时绿条 max-width 封到 100%（新版站点已自行处理）
 *  14) LINK 圣殿（新旧版通用）
 *      + 换序：个人 LINK 页每张卡右下角挂「换序」小按钮（沿用自由裁剪那套图标按钮，
 *        图案是互换箭头），互换两座 LINK 圣殿的左右，名字一起换；
 *        偏好存 localStorage（tgtk:linkswap:v1，按两角色 ID 记「谁在左」），
 *        角色页 / 最新连接页读取同一份偏好自动还原（新版把两半的整块子节点互换，
 *        <img> / 背景图 / canvas 哪种渲染都能换、GIF 动画跟着走，data-* 属性同步换；
 *        旧版对调 left/right 布局类，点击仍然对应正确的塔）。
 *        旧版必须按「首次看到的自然顺序」算目标顺序，否则每次心跳都会换回去（来回闪）
 *      + 工具箱「圣殿」页（在 ICO 与账本之间）：「无缝 link 图」开关 + 个人页每行 4/5/6 个，开启后下面这套
 *        去斜切的样式生效；关闭则整体失效、完全回到小圣杯原版（斜切 + 中间白线）
 *      + 个人页圣殿置顶：个人页的圣殿按固定资产上限排序、而且是分页的（每页 24 座），
 *        喜欢的塔容易被挤到第 7 页。工具箱「圣殿」页可加置顶名单（角色名 / ID，一次可填多个、
 *        用空格隔开，可 ↑↓ 调序），
 *        插件先把自己的塔拉成一条完整队列（1 次请求，5 分钟缓存），再按「置顶在前、其余原序」
 *        重排；站点每要一页就切对应的 24 座还给它 —— 每页仍是 24 座，第 1 页不会被撑大，
 *        后面的页也不会出现被挖走的空洞。站点照旧用它的卡片组件渲染，样式 / 点击 / 页码 / 总数都不变。
 *        个人页卡片悬停浮出小图钉（静态图贴塔图内的左下角；GIF 动图左下角是站点的播放键，
 *        按钉改贴右下角），点一下置顶、再点取消；已置顶不带常驻角标（顺序在工具箱里看）。
 *        名单行只有序号 + 角色名，右侧 ⋮⋮ 可拖拽换序（也保留 ↑↓ 精调）。
 *        角色名会跟名单一起存本机：刷新后不会退回 #数字 ID；全量队列里暂时找不到那座塔时
 *        用快照补到最前，避免「置顶了却没反应」。
 *        名单 / 开关 / 每行几个单独存一个键，不和整块设置混放（否则会被另一个页面的旧副本覆盖）；
 *        置顶名单会跟着同步码 / 云同步走（本地为空时照抄，两边都有就取并集、不覆盖本机顺序）。
 *      + 个人页圣殿置底：讨厌的角色一律排到整份名单的最末尾（= 最后一页的最后一个）。
 *        入口在「圣殿」页「无缝 link 图」和「个人页圣殿置顶」之间，平时收成一行、点开才是配置；
 *        只填角色名 / ID 添加，不分顺序、不需要在个人页卡片上挂按钮，每行右侧一个「取消置底」。
 *        置底名单同样跟着同步码 / 云同步走；同一个角色不会既置顶又置底（置顶优先）。
 *      + 角色候选（所有联想框）：完全同名的排最前，其次「以关键字开头」，再次「包含关键字」；
 *        同一档里等级高的排前。官方搜索接口会漏角色（如 #23425「白」）、且常在单字查询时
 *        把 Level 给成 0 或干脆不给，所以本机已知角色（当前页标题 / 持仓 / 收藏 / 名字缓存）
 *        每次都并进候选，等级缺失或为 0 的再用 chara/list 按 ID 批量反查一次并缓存，
 *        补完重排重绘 —— 反查到的才是权威等级（白 = Lv14）。
 *        圣殿置顶 / 置底的联想框更严：候选只从「我的全部圣殿」队列里出（聚焦即预读、
 *        队列没好时浮层提示「正在读取」），同名但自己没建塔的角色压根不会列出来 ——
 *        从根上避免输「白」时选中别人家的同名角色，结果置顶了个空气。
 *        直接敲名字点「添加」也走同一份队列；队列暂时读不到就宁可不列候选
 *        （提示「正在读取 / 暂时读不到」），绝不退回全站搜索把无塔角色放回来，
 *        添加流程仍会复核「你有没有这座塔」，不会静默失败。
 *        其它联想框（收藏 / 道具 / 持股 / 幻想乡 / 筛塔）本来就要能选任意角色，
 *        只统一「完全同名优先」的排序，不过滤是否建过塔。
 *      + 无缝拼接：站点左右两半都是 skewX(-10deg) 的平行四边形，斜边把画面切掉一个三角形
 *        （底部最多 58px），而两半的图片容器都只有 240 宽——被切掉的像素不在任何一半里，
 *        所以「挪位置 / 加宽 / 补边」都拼不回原图（只会错位或重缩放）。这里只去掉斜切：
 *        左半 243 在 x=0 + 右半 243 在 x=189（重叠 54）铺满 432，接缝是干净的竖线，
 *        背景 100% 铺满，两半像素比例完全一致；换算成百分比，三种尺寸共用一套规则
 *      + LINK 图裁剪：识别到「自己这座塔」存在 LINK 圣殿时才在自由裁剪按钮旁挂心形按钮
 *        （新版在裁剪键左边，旧版贴 [闪光结晶] 左边，与换序键同尺寸）。判定只看自己的塔：
 *        chara/links/{cid} 返回的是该角色所有人的连接，按 UserId === 我 过滤。
 *        浮窗按 27:20 框选整张拼图（与 LINK 卡 432×320 同比例），确定时按 9/16、7/16 切成两张
 *        等大的两半：左半取 0~56.25%、右半取 43.75%~100%（重叠 12.5% = 54px），
 *        正好对上站点「左 243 + 右 243 起点 189」的叠加几何；选「本塔用左半/右半」，
 *        另一半可同时给 LINK 圣殿（仅当对方也是自己的塔）。框内只留一条细粉线，
 *        线的位置会随所选的那一半移动到对应的边界上。
 *      + LINK 圣殿一律不给「复制 / 修改」（新旧版一致），判定出来之前也先不显示
 *
 * 安装（组件方式）：
 *   https://bgm.tv/dev/app/create → 应用名随意 → 类型选「组件」→ 创建
 *   → 添加新版本 → 版本号填 2.3.34（每次 +0.0.1，不能重复）→ 把本文件全部内容粘进「脚本」框 → 创建
 *   → 个人设置 - 超合金组件 - 启用
 *
 * 说明：
 *   · 收藏 / 收藏夹存在本机 localStorage（tgtk:favs:v2，自动迁移 v1），换设备用「同步码」
 *     或云同步；组件没有自己的后端，云同步走你自己的 Gist / 自定义接口
 *   · 「英灵殿」= tinygrail 账号持股，「幻想乡」= blueleaf 账号持股
 *   · 道具 / 账本需要登录小圣杯（依赖 cookie），账本只能统计自己的账号
 *   · 资产快照按天存在本机（tgtk:snap:v1），只影响走势图的精度
 *   · 角色等级由总股本决定，门槛 ≈ 7500 × 1.3^(级数-1)，进度条为参考值
 *
 * 数据接口（均为 tinygrail.com 接口，带节流）：
 *   GET  chara/temple/{角色ID}
 *   GET  chara/user/temple/{用户名}/{页}/{数量}?keyword={角色ID}
 *   GET  chara/user/chara/{用户名}/{页}/{数量}
 *   GET  chara/user/{角色ID}/{用户名}/false
 *   GET  chara/user/item/0/1/50
 *   GET  chara/user/balance/{页}/{数量}
 *   GET  chara/user/assets/{hash}
 *   GET  chara/{角色ID}
 *   GET  chara/search/character?keyword={角色名}  ← 角色名联想候选
 *   GET  chara/charts/{角色ID}/{起始日}          ← 历史交易（按成交时段聚合）
 *   GET  chara/user/assets/0/true                ← 我的资产概览（含参与中的 ICO = Initials、余额）
 *   GET  chara/user/initial/{用户名}/{页}         ← 兜底：某用户参与的 ICO 列表
 *   GET  chara/mri/{页}/{数量}                   ← ICO 榜单「即将结束」，用来校准募集额 / 人数
 *   POST chara/join/{ICOID}/{金额}               ← ICO 注资
 *   GET  chara/user/{角色ID}/tinygrail/false     ← 拍卖底价 / 拍卖数量 / 竞拍人数 / 已拍
 *   POST chara/auction/list  [角色ID]            ← 我在这个角色上的竞拍
 *   GET  chara/auction/list/{角色ID}/{周}         ← 往期拍卖（第 1 周最近）
 *   POST chara/auction/{角色ID}/{出价}/{数量}     ← 竞拍
 *   POST chara/auction/cancel/{竞拍ID}           ← 取消竞拍
 *   GET  chara/user/auction/1/200                ← 我的竞拍列表（取消时找 id）
 *   GET  chara/topweek                           ← 萌王榜（算综合得分）
 *   GET  event/share/bonus/test                  ← 股息预测（判断要不要隐藏签到）
 *   POST chara/list  [id,...]
 *   POST magic/chaos/{炮塔角色ID}
 *   POST magic/guidepost/{炮塔角色ID}/{目标角色ID}
 *   POST magic/fisheye/{炮塔角色ID}/{目标角色ID}
 *   POST chara/sacrifice/{角色ID}/{股数}/false
 *   POST chara/star/{角色ID}/{固资数}          ← 一键冲星
 *   POST magic/stardust/{燃料}/{目标}/{股数}/false  ← 星光碎片
 *   GitHub Gist / 自定义接口                        ← 可选自动云同步
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  /**
   * 组件常被塞进 iframe（小圣杯那一块）。此时 position:fixed 的窗口会被 iframe 裁住，
   * 拖不到页面左侧的空白区。尽量把悬浮窗挂到最外层页面，就能在整个浏览器窗口里移动。
   * 跨域 iframe 拿不到顶层 document 时，退回当前文档（行为与旧版一致）。
   */
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
  /** 事件同时挂在当前文档与宿主文档，指针拖过 iframe 边界时才不会「断手」 */
  const DOCS = HDOC === document ? [HDOC] : [HDOC, document];
  const WINS = HWIN === window ? [HWIN] : [HWIN, window];

  if (window.__TGTK__) return;
  window.__TGTK__ = true;

  /** 主实例令牌：谁在维护顶层页面上的心跳，谁负责挂 UI */
  const HOST_TOKEN = String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8);

  const API = 'https://tinygrail.com/api/';
  const LS_KEY = 'tgtk:settings:v1';
  const LS_FAV = 'tgtk:favs:v1';
  const LS_SNAP = 'tgtk:snap:v1';
  const LS_NOTE = 'tgtk:note:v1';
  // 个人页圣殿置顶的「快照缓存」（塔名 / 固资 / 塔图），只存本机，不进同步码
  const LS_TPIN = 'tgtk:templepin:v1';
  // 置顶名单 / 开关 / 每行几个：单独一个键，不跟整块设置混存（否则会被别的页面实例覆盖）
  const LS_TUI = 'tgtk:templeui:v1';
  const PAGE_SIZE = 100;

  /** 「圣殿置顶」的 fetch / XHR 钩子用：>0 说明这次请求是我们自己发的，别改写响应 */
  let pinApiDepth = 0;

  /** 英灵殿 = tinygrail 账号，幻想乡 = blueleaf 账号 */
  const VALHALLA_USER = 'tinygrail';
  const GENSOKYO_USER = 'blueleaf';

  /** 角色等级门槛：Lv1 = 7500 股，之后每级 ×1.3（用 474 个真实角色拟合，误差 <1.5%） */
  const LV_BASE = 7500;
  const LV_RATE = 1.3;

  /**
   * 资金日志的 Type 字段（服务端给的类型码，比解析中文描述靠谱得多）。
   * 0 全部 / 1 刮刮乐 / 2 参与ICO / 3 ICO退款 / 4 买入委托 / 5 取消买入 / 6 卖出委托
   * 7 印花税 / 8 取消卖出 / 9 资产重组 / 10 参与竞拍 / 11 修改竞拍 / 12 竞拍结果
   * 13 ICO结果 / 14 个人所得税 / 15 系统修复 / 16 发出红包 / 17 收到红包 / 18 魔法道具
   */
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

  /** 资金 / 股数变动来源分类。按数组顺序匹配描述，先具体后笼统 */
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

  /** 资金收入 / 支出、股数获得 / 损失各自允许出现的来源（按用户指定的分类口径） */
  const FUND_IN_KINDS = ['sell', 'dividend', 'bonus', 'aucbonus', 'sacrifice', 'ico', 'packet', 'other'];
  const FUND_OUT_KINDS = ['buy', 'auction', 'ico', 'packet', 'scratch', 'other'];
  const STOCK_IN_KINDS = ['buy', 'auction', 'ico', 'item', 'scratch', 'other'];
  const STOCK_OUT_KINDS = ['sell', 'sacrifice', 'item', 'other'];

  /** 固定资产（圣殿）变动来源。日志只有文字描述，按关键词归类，数值从描述里抠 */
  const FIXED_RULES = [
    {
      key: 'guidepost',
      label: '被道标命中',
      // 「受到「虚空道标」攻击损失 #8539「杀生丸」83股」= 自己的塔被打掉固资。
      // 必须排除「使用「虚空道标」获得 …」那种：那是我打别人后掉落的股份，不是我的损失。
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
    // 塔筛选
    threshold: 250,
    field: 'Assets',
    source: 'current',
    username: '',
    chars: '',
    // 塔筛选：两个条件各自一个勾选（都不勾 = 全部显示）
    filAssets: true,
    filCover: false,
    cover: 'default',
    // 持股筛选（只查自己；holdQuery 是「按角色名 / ID 搜索」框的内容）
    holdQuery: '',
    lvMin: '',
    lvMax: '',
    minAmount: '',
    sortBy: 'levelDesc',
    // 幻想乡
    fchars: '',
    // 收藏
    favSort: 'added',
    // 道具 / 道标
    magic: 'chaos',
    mFrom: '',
    mTo: '',
    // 三种道具的每日上限不同（魔方 3 / 道标 5 / 鲤鱼之眼 1），次数各存各的，互不影响
    mTimesBy: { chaos: 1, guidepost: 1, fisheye: 1 },
    mStop: true,
    mFill: false, // 固资不足时自动献祭补充
    mFillMax: 300, // 每次自动补充时一次性献祭多少股（不再当上限用）
    // 一键冲星（starAmount = 本次贡献多少星之力；starTarget 是旧版「目标值」，仅用于迁移）
    starChar: '',
    starAmount: 100,
    starStep: 500, // 旧设置，仅作「读不到塔上限」时的兜底
    starFill: false,
    // 收尾把固资补到哪：'full' 补满上限 / '250' 补到 250（躲虚空道标） / 'none' 不补
    starEndFill: 'full',
    // 星光碎片
    sdTarget: '', // 目标圣殿角色（自己的塔）
    sdLevel: '', // 只看这个等级的角色（'' = 全部等级；0 = 只筛 Lv0 / ST）
    sdFroms: [], // 燃料队列：按点选顺序依次消耗，总共扣「数量」那么多股
    sdAmount: 100,
    sdQuery: '',
    sdSortAsc: false, // 燃料候选排序：false = 持股从多到少，true = 从少到多
    // ICO
    icoCfg: {}, // { [icoId]: { lv, on, cid, name, end, res, at } } 自动注资计划（含 ICO 元信息，换页面/重启也能独立判断）
    icoAdvance: 1, // 结束前多少分钟开始自动补款（提前设大一点，关机也不怕）
    // 旧版小圣杯页面增强
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
    // 个人页圣殿置顶：名单顺序 = 个人页里的显示顺序；只在本机生效，不改站点数据
    templePins: [],
    templePinOn: true,
    // 资金日志 / 账本
    logDays: 7, // 数字 = 近 N 天；'custom' = 用下面两个日期
    logFrom: '', // 自定义起始日 YYYY-MM-DD（含当天 0:00）
    logTo: '', // 自定义结束日 YYYY-MM-DD（含当天 24:00）
    logSort: 'active',
    logTop: 20,
    ledgerView: 'fund',
    // 悬浮窗位置（null = 用默认右下角）
    panelPos: null,
    fabPos: null,
    // 工具箱胶囊是否收起：收进 bgm 右下角工具条的那个开关里（只在有工具条的页面生效）
    fabHidden: false,
    panelOpen: false, // 面板是否打开：iframe 重载后据此自动恢复
    // 跨设备同步
    syncMode: 'code', // code = 仅同步码 / url = 自定义 GET·PUT 接口 / gist = GitHub 私密 Gist
    syncUrl: '',
    syncToken: '',
    syncGist: '',
    syncAuto: false,
    syncLast: 0,
    // 收藏夹筛选
    favFolder: 'all',
    favPopFolder: 'all',
  };

  // 单独留一份「上次存下来的原始设置」，给下面的迁移判断用（S 里已经有新默认值了）
  let SAVED = {};
  try {
    SAVED = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {};
  } catch (e) {
    SAVED = {};
  }
  if (!SAVED || typeof SAVED !== 'object') SAVED = {};
  Object.assign(S, SAVED);
  if (!TABS.includes(S.tab)) S.tab = 'temple';
  // 燃料从「单只」升级成「有序队列」：老设置里选过的那只直接当队列第一只。
  // 注意 S 里已经有 sdFroms:[] 默认值，所以要按「存下来的原始设置」判断是不是老数据
  if (!Array.isArray(SAVED.sdFroms)) {
    const old = parseCharId(SAVED.sdFrom);
    S.sdFroms = old ? [old] : [];
  }
  delete S.sdFrom;
  // v1.9 的 starTarget 是「冲到多少星之力」，新版改成「本次贡献多少星之力」，语义不同，做个温和迁移
  if (S.starTarget !== undefined) {
    const oldTarget = Number(S.starTarget);
    S.starAmount = Number.isFinite(oldTarget) && oldTarget > 0 ? Math.min(500, Math.floor(oldTarget)) : 100;
    delete S.starTarget;
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
  }
  // 竞拍默认数量：旧默认值是 50，站点本身默认 1，统一按 1 走（用户手动改过别的值就不动）
  if (Number(S.gxBidAmount) === 50) S.gxBidAmount = 1;
  // 道具次数：从「三种道具共用一个 mTimes」拆成 mTimesBy 各存各的。
  // 老设置里那个数原样复制给三种道具，之后各改各的，不再互相牵连。
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
  // 筛塔：「显示全部」取消，改成「固定资产」「塔图」两个勾选。
  // 老设置的语义照搬过来：原来没勾显示全部 = 按固定资产筛；塔图选了具体的 = 勾上塔图条件。
  if (SAVED.filAssets === undefined) S.filAssets = !SAVED.showAll;
  if (SAVED.filCover === undefined) S.filCover = SAVED.cover === 'default' || SAVED.cover === 'custom';
  if (S.cover !== 'custom') S.cover = 'default';
  if (S.showAll !== undefined) delete S.showAll;

  const persist = () => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(S));
    } catch (e) {}
  };

  /* 面板开关 / 标签页 / 位置：镜像到最外层 window（同源 iframe 之间共享、不受 iframe 导航
   * 销毁影响），同时写 localStorage，整页刷新后也能恢复。点开角色会重载组件所在的 iframe，
   * 新实例就靠这份状态自动重启工具箱并回到关闭前的标签页与位置。 */
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

  /* ---- 多页面工具箱联动 --------------------------------------------------
   * 主页面与角色页（两个标签页，或 iframe 内外）各跑一份组件时，两个面板都开着。
   * 关掉其中一个，另一个应该跟着关，否则用户要关两次。
   * localStorage 的 storage 事件覆盖同源标签页；postMessage 覆盖 iframe / 由
   * opener 打开的页面（跨域也行）。接收方只改本地 UI，不回写、不广播，避免循环。 */
  const UI_SYNC_MSG = 'tgtk:ui:sync';
  function applyRemoteOpen(open) {
    const show = !!open;
    // 只更新内存镜像，绝不回写 localStorage / 广播，否则会形成事件环
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
  // 持仓缓存时间戳 / 归属用户：持股页与星光碎片共用一份，避免各扫一遍几千条
  let holdAt = 0; // 上次扫完的时间
  const HOLD_TTL = 5 * 60 * 1000; // 5 分钟内直接复用
  const HOLD_RENDER_MAX = 300; // 持股页一次最多渲染多少行（3700 行 DOM 会卡）
  let fantasyRows = [];
  let favRows = [];
  let logAll = [];
  /** 账本当前统计窗口（自然日）：from = 第一天 0:00，to = 最后一天 24:00 */
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

  /** 读本地资产快照 */
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

  /* ---------------------------- 收藏数据 v2 ----------------------------
   * favRaw 保留「墓碑」(del:true)，跨设备合并时删除操作才不会被另一台设备带回来。
   * favs / folders 是过滤掉墓碑后的活跃视图，页面与快选浮层直接用它们。
   */
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

  /* 收藏项的身份是「收藏夹 + 角色」：同一个角色允许同时待在多个收藏夹里。
   * 老数据用角色 ID 当身份，这里补齐 key（历史同步码里没 key 的也一样处理）。 */
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
      // 从 v1 的扁平数组迁移
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
    // 迁移 / 读取后立刻落盘，保证 v2 存储一定存在（也方便同步码读取同一份数据）
    try { localStorage.setItem(LS_FAV2, JSON.stringify(favRaw)); } catch (e) {}
  }

  function normalizeFav() {
    if (!favRaw.folders.some((f) => f.id === 'root' && !f.del)) {
      favRaw.folders.unshift({ id: 'root', name: '默认收藏夹', parent: '', at: 0 });
    }
    folders = favRaw.folders.filter((f) => !f.del && f.id);
    // 旧版本 / 其它设备同步来的带 parent 的收藏夹统一提升为同级，名称与角色归属都不变
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

  /** 收藏项按 (folder,id) 的 key 定位，收藏夹仍按 id */
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

  /** 收藏夹一律同级：名称就是它的完整路径 */
  function folderPath(id) {
    const f = folders.find((x) => x.id === id);
    return f ? f.name : '';
  }
  /** 全部同级，没有后代；选中某个收藏夹只统计它自己 */
  function folderTree(id) {
    return [id];
  }
  function folderOptions(withAll, withNone, mark) {
    const out = [];
    if (withAll) out.push(['all', '全部收藏夹']);
    if (withNone) out.push(['none', '未分类']);
    folders.slice().sort((a, b) => num0(a.at) - num0(b.at)).forEach((f) => {
      // mark=true 时给收藏夹名加个前缀，和角色行区分开（原生 select 没法加样式）
      out.push([f.id, mark ? '▸ ' + f.name : f.name]);
    });
    return out;
  }

  /* ---- 同步码：一段可复制的文本，把收藏夹与云配置一起带走 ---- */
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
    // 置顶 / 置底名单也一起带走（置顶顺序敏感，所以存成数组而不是按 id 合并的集合）
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

  /** 按 id 取 at 较新的版本合并；墓碑 (del) 也参与，所以删除能同步 */
  function mergeOne(kind, incoming) {
    let n = 0;
    (Array.isArray(incoming) ? incoming : []).forEach((item) => {
      if (!item || !item.id) return;
      const key = kind === 'items'
        ? (item.key || itemKey(item.folder, item.id))
        : String(item.id);
      const cur = rawOf(kind, key);
      // 本地压根没有这条、对方给的又是「墓碑」：不必把墓碑搬过来（否则本地凭空多一堆无效记录）
      if (!cur && item.del) return;
      if (!cur || num0(item.at) > num0(cur.at)) {
        upsertRaw(kind, item);
        // 墓碑只用来传「删了」，不算进「合并了 N 个角色」
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

  /* ---- 导入「新版小圣杯」的收藏夹 ------------------------------------
   * 新版不同构建把收藏放在同源 localStorage 里、键名和结构都不统一，
   * 所以这里按「形状」递归认数据（ID 数组 / 角色对象 / 夹名→列表 / folders+items），
   * 再统一落进工具箱的 favRaw。自动扫不到时，面板里还有一处粘贴入口兜底。 */
  /* 新版小圣杯收藏夹（localStorage 键 tinygrail:favorites）里除了角色 ID，
   * 还有 count / Level / LastIndex / Amount / 排序号等一堆数字。v53 的通用递归
   * 把「任何数字」都当角色 ID，于是多出 0（#0）、1（枢木朱雀）这类不存在的角色。
   * 现在只从「明确的角色列表数组」里取 ID，其它数字字段一律不看。 */
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

  /** 纯文本兜底：一行一个 ID 或「123,456」；没有数字的行当作后面几行的收藏夹名 */
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

  /** 按「夹 → 角色列表」的形状解析；不会从 count / Level / 排序号里捡数字 */
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
          // 没有角色 ID 的普通对象（比如带 Name / Icon 的角色卡）不再往下钻，
          // 否则 Level / LastIndex 这类数字会被误当成角色。
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
      // 夹对象数组 / 纯角色列表
      if (root.some(favLooksFolder)) root.forEach(scanFolderObj);
      else scanList(root, '', 0);
      return out;
    }
    if (!root || typeof root !== 'object') return out;

    // {folders:[{id,name,characters}], items:[{id,folder}]}
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

    // 「夹名 → 角色列表 / 角色对象 / ID 串」的映射
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
        // { "12345": true, "67890": true } 这种以 ID 为键的映射
        const ks = Object.keys(v);
        if (ks.length && ks.every((x) => /^\d+$/.test(x))) ks.forEach((x) => push(x, typeof v[x] === 'string' ? v[x] : '', nm));
        return;
      }
      const id = favId(v);
      if (id) { push(id, '', nm); return; }
      if (/^[1-9]\d{0,9}$/.test(k)) {
        // { "12345": "宝宝" } —— 值是收藏夹名
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

  /** 扫所有同源 window 的 localStorage。新版收藏夹固定放在 tinygrail:favorites，
   *  其它「看起来像收藏」的键只在主键找不到时才当兜底（且必须解析出夹名）。 */
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
        // 松匹配只认「带收藏夹名」的数据，避免把一堆无关数字导进来
        if (!primary && !entries.some((e) => e.folder)) continue;
        if (primary) primaryHit = true;
        found.push({ key: k, entries, primary });
      }
    }
    return primaryHit ? found.filter((f) => f.primary) : found;
  }

  /** 导入小圣杯收藏：只补「还没有」的角色，绝不删任何已有收藏。
   *  · 目标里已有的 → 原样保留（计入 dup，不算新增），缺名字的顺手补上
   *  · 目标里全新的 → 新增
   *  同一个角色允许同时存在于多个夹。新版收藏夹里删掉某个角色，
   *  不会连带把这个工具箱里的收藏删掉（要删请自己在列表点 ×）。 */
  function favMerge(entries) {
    const res = { added: 0, folders: 0, dup: 0, renamed: 0, invalid: 0 };
    const now = nowMs();
    const byName = new Map(folders.map((f) => [String(f.name), String(f.id)]));
    // 1. 先把目标解析成 key → 条目，同名夹复用 / 新建
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
    // 2. 现有活跃项按 key 索引
    const active = new Map();
    favRaw.items.forEach((x) => {
      if (x.del) return;
      const k = x.key || itemKey(x.folder, x.id);
      active.set(k, x);
    });
    // 顺手清掉历史误导入的 #0（不是有效角色 ID）
    favRaw.items.forEach((x) => {
      if (!x.del && String(x.id) === '0') { upsertRaw('items', { ...x, del: true, at: now }); res.invalid++; }
    });
    // 3. 只补真正缺的；已有条目不重复插入，只把缺的角色名补上
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

  /** 未上市 / 已退市 / 查不到的角色在工具箱里会显示成 #0。
   *  导入前过滤一次；「清理已退市角色」也复用这一份判定，保证两处口径完全一致。
   *  · ST（Level=0 + ZeroCount>0，退市重组中）还没真正退市，一律算「在市」保留
   *  · 接口整体不可用（未登录 / 断网）时 checked=false，调用方必须放弃过滤 / 删除 */
  async function favFilterListed(entries, forceOk) {
    const ids = Array.from(new Set(entries.map((e) => String(e.id))));
    const names = new Map();
    const ok = new Set();
    const blank = (why) => ({ entries, skipped: 0, checked: false, names, ok, bad: [], why });
    if (!ids.length) return blank('empty');
    // ST / 退市重组名单（chara/delist/chara）里的角色一律保留，见 favPruneDelisted。
    // 只作用于最终去留，不掺进「接口是否可靠」的判断。
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
          // 顺手把角色名带回去，导入后不用等「刷新全部」就能显示名字
          if (c.Name) { names.set(id, String(c.Name)); nameCache[id] = String(c.Name); }
          // ST（Level=0 但 ZeroCount>0，退市重组中）还没真正退市，绝不能当成未上市
          if (num(c.ZeroCount) > 0) { ok.add(id); return; }
          // 未上市（ICO）/ 已退市：带 End、没有等级、没有上市日期
          const unlisted = c.End && !num(c.Level) && !c.ListedDate;
          if (!unlisted && (num(c.Level) > 0 || num(c.Current) > 0 || num(c.Total) > 0 || c.Name)) ok.add(id);
        });
      }
    } catch (e) {}
    if (!networkOk) return blank('network');
    // 批量接口没返回的，再用单角色接口确认一次（限量并发）
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
    // 接口整体不可用（批量一个都没返回 + 单角色也全失败）时放弃过滤与删除，
    // 避免断网 / 未登录把收藏全误删；批量能返回数据就说明接口是通的，
    // 这时「不在返回里」就是角色真的查不到了。
    if (!seen && !probeOk) return blank('network');
    if (!ok.size) return blank('unreliable');
    const alive = (id) => ok.has(id) || protect.has(id);
    const kept = entries.filter((e) => alive(String(e.id)));
    const bad = ids.filter((id) => !alive(id));
    return { entries: kept, skipped: entries.length - kept.length, checked: true, names, ok, bad };
  }

  /** 「清理已退市角色」：核对全部收藏（手动收藏 + 导入的都算），
   *  把判定为未上市 / 已退市 / 查不到的角色从所有收藏夹里一并移除。
   *  同一个角色在多个夹里有多条记录，会一起清掉；ST 角色一律保留。 */
  async function favPruneDelisted() {
    const ids = Array.from(new Set(favs.map((f) => String(f.id))));
    const empty = { checked: false, removed: 0, rows: 0, kept: 0, ids: [], why: 'empty' };
    if (!ids.length) return empty;
    // ST / 退市重组名单：这些角色还没真正退市，接口没给 ZeroCount 时也绝不清理。
    // 接口不通就跳过这层白名单——还有 chara/list 的 ZeroCount 判定兜底。
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
    // 安全阀：一次判定里超过一半收藏都查不到，多半是接口 / 登录态异常，宁可不删
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

  /* ---- 自动云同步：GitHub 私密 Gist 或自定义 GET/PUT 接口 ---- */
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

  /* ------------------------------ 基础工具 ------------------------------ */

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

  /** 限并发执行：mapLimit(list, 3, async (item, i) => {...}) */
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

  /* ------------------------------ 悬浮窗拖动 ------------------------------ */

  /** iframe 在顶层视口里的偏移（可多层嵌套），用于把 iframe 内的指针坐标换算到顶层 */
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

  /** 元素的矩形换算到宿主窗口视口坐标（元素可能在 iframe 文档里） */
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

  /** 把 left/top 限制在可视区域内，尽量让整个窗口都留在屏幕里（按宿主窗口算） */
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

  /** 应用已保存的位置；hidden 元素量不到尺寸时用估计值兜底 */
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

  /** 复位：清掉内联定位，回到 CSS 默认的右下角 */
  function clearPos(el, key) {
    if (!el) return;
    el.style.left = el.style.top = el.style.right = el.style.bottom = '';
    if (key) {
      S[key] = null;
      persist();
      if (key === 'panelPos') writeUI({ left: undefined, top: undefined });
    }
  }

  /**
   * 让元素可拖拽。handle 是把手（默认元素自身），opts:
   *   key     位置在 S 里的字段名
   *   ignore  不触发拖动的选择器（例如 'button'）
   *   onMove  拖动过程回调
   *   onEnd   结束回调 (moved)
   * 双击 handle 或调用返回的 reset 可复位到默认位置。
   */
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

    /** 统一换算到宿主窗口视口坐标：顶层事件直接用，iframe 内事件补上 iframe 偏移 */
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
      // 拖动过的那一下 click 不该再被当成「点开/点选」
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

  /* ------------------------------ 角色名联想 ------------------------------ */

  const sugCache = new Map();
  // 同名角色可能十几个（「白」就有多个），以前只画 8 条会把后面的藏掉；浮层本身可滚动
  const SUG_SHOW_MAX = 16;
  let sugBox = null;
  let sugInput = null;
  let sugItems = [];
  let sugKw = '';
  let sugIndex = -1;
  let sugTimer = 0;
  let sugSeq = 0;
  // 当前这轮候选是「按 ID 前缀」列出来的（收藏页手动添加），提示文案不一样
  let sugById = false;
  // 置顶 / 置底专用：候选只从「我的全部塔」里出，天然不会列出无塔角色
  let sugTempleReady = false;
  let sugLoading = false;

  /** 用元素所属文档的 Event 构造器派发事件（元素可能挂在顶层文档） */
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

  /** 角色等级缓存：官方搜索结果带 Level，但「本机补进来的」角色只有名字
   *  （当前角色页标题、持仓 / 收藏 / 名字缓存），浮层上就只剩一个 #ID。
   *  这里用 chara/list 批量补一次，补完既显示 Lv 也参与「等级高的排前」。
   *  值为 null = 查过但接口没给，避免反复发请求；undefined = 还没查过。 */
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

  /** 候选浮层出来后，把「等级未知」的角色批量补一次；补完重排 + 重绘 */
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
        // 请求失败别把「查不到」写死，下次输入还能再试一次
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

  /** 候选排序：完全同名的排最前，其次「以关键字开头」，再次「包含关键字」；
   *  同一档里等级高的排前面（同名角色挑人时更有用），等级也一样就保持原来的先后顺序。
   *  以前完全照服务端给的顺序摆：输「白」时真正的「白」排在「白穗」后面，
   *  按一下回车（或点第一行）就把别的角色当成它了。所有联想框共用这一份排序。 */
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

  /** 名字 → 唯一角色：同名里优先挑「我有这座塔」的那个，其次才是搜索结果第一条。
   *  owned 为空表示还不知道我有哪些塔（这时只按名字排）。 */
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

  /** 本机已经认识的角色：当前角色页、持仓、收藏、圣殿队列、名字缓存。
   *  官方搜索接口按热度返回，会把冷门 / 低等级的同名角色漏掉（比如 Lv1 的「白」），
   *  所以每次都把这些并进候选，而不是「官方一条都没返回」才拿来兜底。 */
  // 上万只持仓时每敲一个字都重建一遍池子会卡，按数据源长度 + 时间做轻量缓存
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
      // 不传等级 = 未知（交给 chara/list 补），别写成 0：Lv0 是合法等级，
      // 混在一起会让真正 Lv14 的角色永远显示不出等级
      const L = lv === undefined || lv === null ? knownLvOf(i) : num(lv);
      out.push({ id: i, name: n, lv: L });
    };
    // 当前打开的角色页优先：用户多半就是想输这个角色。
    // 页面标题里「#23425 - 「白」」这种格式直接全抓一遍，比只认弹窗 DOM 稳得多
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

  /** 官方搜索接口的结果（只缓存这一段，本机角色池随时会变，不能一起冻住） */
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
        // 搜索接口对不少角色直接不给 Level（或给 0，但角色其实不是 Lv0）：
        // 这两种都当成「等级未知」，交给 chara/list 按 ID 反查，别把错误的 Lv0 摆上去
        const raw = x && (x.Level != null ? x.Level : x.CharacterLevel);
        const lv = raw == null || num(raw) === 0 ? knownLvOf(id) : num(raw);
        out.push({ id, name, lv });
      });
    } catch (e) {}
    sugCache.set(key, out);
    return out;
  }

  /** 搜角色名：官方搜索接口 + 本机已知角色合并去重，再按「同名 > 前缀 > 包含 > 等级」排 */
  async function searchChara(kw) {
    const key = String(kw || '').trim();
    const out = (await searchCharaRemote(key)).slice();
    const seen = new Set(out.map((x) => x.id));
    // 官方结果之外的本机同名角色也补上（关键字不匹配的不加，避免污染候选）
    const k = key.toLowerCase();
    localCharaPool().forEach((x) => {
      if (seen.has(x.id) || !String(x.name).toLowerCase().includes(k)) return;
      seen.add(x.id);
      out.push(x);
    });
    return rankCharaHits(out, key).slice(0, 30);
  }

  /** 按 ID 前缀找角色（收藏页「手动添加」用）：输 1021 就列出 ID 以 1021 开头的角色。
   *  数据来源三个，按代价从低到高排：
   *   1. 本机已知的（持仓 / 收藏 / 名字缓存）—— 不花请求，立刻能给
   *   2. 服务端关键字搜索 —— 如果它也认数字 ID，这里就直接命中
   *   3. chara/list 探同前缀的 ID —— BGM 角色 ID 是纯数字，以 P 开头的 ID 只可能是
   *      P、P0~P9、P00~P99，最多 3 批（50 个一批），当前缀很长时也不会无限扩 */
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
    // 1. 本机已知
    (sdHold || []).forEach((x) => add(x.CharacterId, x.Name, x.Level));
    (holdAll || []).forEach((x) => add(x.CharacterId, x.Name, x.Level));
    (favs || []).forEach((f) => add(f.id, f.name, favLvCache[String(f.id)]));
    Object.keys(nameCache || {}).forEach((id) => add(id, nameCache[id]));

    // 2. 服务端搜索（走 searchChara 的缓存，不会重复发同一个词）
    if (seen.size < 8) {
      try {
        const arr = await searchChara(prefix);
        (arr || []).forEach((x) => add(x.id, x.name, x.lv));
      } catch (e) {}
    }

    // 3. 前缀扩展探 ID：3 位以上才探，2 位数字扩出来太多没意义。
    //    分成的几批并发发出去：以前一批一批等，输到第 3 位要等三轮才出候选，
    //    现在一次就回来（道具页 / 星光碎片也开始按 ID 给候选，等待更明显）
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

  /** 置顶 / 置底专用候选：只从「我的全部圣殿」里挑，不查全站角色库。
   *  同名但自己没建塔的角色压根不会出现，从根上避免「选了个自己没有的『白』」。
   *  返回 null = 全量队列还没读到（调用方负责拉一次）；其余返回按名字相关度排好的候选。 */
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
    // 输入框被隐藏（例如切换道具后目标框不显示）就别把浮层丢到页面左上角
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
      // 右边放得下：直接贴在输入框右侧，和输入框同一水平线
      left = r.right + 8;
      top = Math.max(6, Math.min(r.top, Math.max(6, vh - h - 6)));
    } else {
      // 右边放不下（面板靠屏幕右侧时）：右对齐贴在输入框下方，再不行翻到上方
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
    // 圣殿置顶 / 置底：候选已经只含「我建过塔」的角色，不需要标「无塔」。
    // 万一队列读取失败而退回全站搜索，再按「我的塔」集合标一下，避免又挑错人。
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
        // 阻止 mousedown 抢走输入框焦点，保证 click 能选到
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
      // 多个 ID 用空格 / 逗号分隔时，只把最后那一段（正在输入的名字）换成 ID
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
    // 点选后回填的是 ID，别再让「按 ID 前缀」的候选因为这次赋值又弹出来
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

  /** 给单角色输入框挂上「名字 → 候选 → 点选填 ID」 */
  function attachCharaSuggest(inp, opts) {
    if (!inp) return;
    inp._tgtkSugOpts = opts || {};
    if (!inp.getAttribute('autocomplete')) inp.setAttribute('autocomplete', 'off');
    inp.addEventListener('input', () => {
      const raw = String(inp.value || '').trim();
      const kw = inp._tgtkSugOpts.append ? raw.split(/[\s,，]+/).pop() : raw;
      clearTimeout(sugTimer);
      // 每轮输入都重置，免得上一个输入框残留的「正在读取」状态串到别的候选上
      sugLoading = false;
      sugTempleReady = false;
      // 刚在候选里点过一条（回填的是 ID），这次 input 是程序触发的，不要重新联想
      if (inp._tgtkSkipSug) {
        inp._tgtkSkipSug = false;
        hideCharaSuggest();
        return;
      }
      // 浏览器自动填充的邮箱 / 网址不要触发角色名联想（否则会弹「没搜到 xxx@qq.com」）
      if (/@|https?:\/\/|^www\./i.test(kw)) { hideCharaSuggest(); return; }
      sugSeq++;
      const seq = sugSeq;
      // 纯数字 / #数字 一般已经是 ID，不需要联想；收藏页的「手动添加」例外
      // （numId）：两位以上的数字按 ID 前缀给候选，省得记全整串 ID
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
        // 置顶 / 置底：候选只从「我的全部圣殿」里出，同名但没塔的角色根本不列出来
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
        // 官方结果 / 本机池里没带等级的角色，批量补一次 Lv，补完重排重绘
        fillSugLevels(seq, inp);
      }, 260);
    });
    // 点空白处把候选收起后，再点回输入框（或按 Tab 进来）要能重新弹出来。
    // 以前只有「值变了」才触发，所以再点一次输入框什么都不发生。
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
    // 置顶 / 置底：一点输入框就把「我的全部圣殿」备好，打字时候选能立刻出来
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
        // 只收起候选，不要冒泡到面板的「Esc 关闭整个工具箱」
        e.stopPropagation();
        hideCharaSuggest();
        return;
      }
      // 多行输入框（角色列表）保留 ↑↓ 移动光标、Enter 换行，候选只用鼠标点选
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

  /** 点候选以外的任何地方都收起浮层（当前文档 + 宿主文档都监听） */
  const dismissOnOutside = (e) => {
    if (!sugBox) return;
    if (sugBox.contains(e.target)) return;
    if (sugInput && sugInput.contains(e.target)) return;
    hideCharaSuggest();
  };
  /** 只由主实例调用一次 */
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

  /* ------------------------------ 收藏夹快选 ------------------------------ */

  let favPop = null;
  let favPopBtn = null;

  function hideFavPop() {
    if (favPop) favPop.remove();
    favPop = null;
    favPopBtn = null;
  }

  /** 收藏角色等级缓存（只存 id → Lv，来自 chara/list 的一次批量查询） */
  const favLvCache = Object.create(null);
  const favLvTried = new Set();
  let favLvLoading = false;

  /** 收藏项：[{id, name, lv}]，最近收藏的排前面；有详情时补上等级 */
  function favEntries() {
    const meta = new Map();
    (favRows || []).forEach((r) => meta.set(String(r.id), r));
    // 同一角色可能在多个夹里，快选浮层只列一次
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
          // 等级只在「刷新全部」时才会进 favRows；没刷过就用开浮层时补拉的轻量缓存
          lv: num(m.level) || num(favLvCache[String(f.id)]) || 0,
          folder: f.folder || 'root',
        };
      });
  }

  /**
   * 补齐收藏角色的等级：以前只有点过「刷新全部」才有，导致收藏夹浮层里后面不显示 Lv。
   * 这里只发 1 次 chara/list（最多 50 个一批），拿到 Level + Name 就够列表用了。
   */
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
    // 优先在按钮右侧「展开」：宽度按右边剩余空间收缩，避免盖住下面的表单
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
      // 实在放不下（面板贴着屏幕最右边）：右对齐贴下方，再不行翻到上方
      left = Math.max(6, Math.min(r.right - w, vw - w - 6));
      top = r.bottom + 6;
      if (top + h > vh - 6) top = Math.max(6, r.top - h - 6);
    }
    left = Math.max(6, Math.min(left, vw - w - 6));
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  /** 单选直接覆盖，多选追加一个 ID（可连续点） */
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
        // 分组顺序跟上面的「收藏夹」下拉保持一致（按收藏夹创建顺序），
        // 否则列表一个顺序、下拉另一个顺序，来回对照很容易看花。
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
    // 没在收藏页点过「刷新全部」时，收藏项只有名字没有等级：开浮层时补一次 chara/list
    ensureFavLevels(() => {
      if (favPop === pop) render();
    });
    try {
      search.focus();
    } catch (e) {}
  }

  /** 小星星按钮：接在角色输入框右边，点开收藏夹 */
  function favBtn() {
    return h('button', { class: 'tgtk-favbtn', type: 'button', title: '从收藏夹选角色' }, '★');
  }

  /** 多目标输入框最右边的「清空」：清掉文本并触发一次 input，让上层状态跟着归零 */
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
    // 历史交易浮层：点浮层外（且不是点「$」本身）就收起
    if (histPop && !histPop.contains(e.target) && !(histBtn && histBtn.contains(e.target))) hideHistPop();
    if (!favPop) return;
    if (favPop.contains(e.target)) return;
    if (favPopBtn && favPopBtn.contains(e.target)) return;
    hideFavPop();
  };

  async function api(path, opt = {}) {
    const ctl = new AbortController();
    // 默认 20 秒；拉上万座塔时由调用方放宽（opt.timeout）
    const timer = setTimeout(() => ctl.abort(), Math.max(5000, num(opt.timeout) || 20000));
    try {
      // 自己发的请求不能被「圣殿置顶」的 fetch 钩子改写：钩子在同步阶段读这个计数，
      // 所以只包住 fetch() 这一下，别把整个 await 包进来（否则期间站点的请求会被跳过）
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

  /** 顶层页面 + 所有同源 iframe 的 document（点开角色常会换 iframe，要动态找） */
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
      // window.frames 偶尔枚举不到（跨域嵌套 / 动态插入），再从 iframe 元素补一次
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

  /** 从「#78881 -「哥布林圣骑士」」这种标题里同时取 ID 和名字，顺手记进名字缓存 */
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

  /** 当前页面的角色 ID：遍历顶层与同源 iframe，兼容 URL / 角色链接 / data 属性。
   *  新版小圣杯是「弹窗式」角色详情，关掉的弹窗常留在 DOM 里（display:none），
   *  而且弹窗挂在 body 末尾 —— 直接取第一个 [data-character-id] 会认到上一个角色。
   *  所以优先看「可见的最后一个角色弹窗」，其次才是页面里固定的角色盒。 */
  function currentCharacterId() {
    // 1) 新版角色弹窗（最后打开的那个优先）
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
        // 标题解析顺带把角色名记进缓存，面板「当前角色」就能直接显示名字
        const titleCid = tgCharaFromTitle(b.textContent, true);
        const innerCid = inner && /^\d+$/.test(String(inner.getAttribute('data-character-id') || ''))
          ? String(inner.getAttribute('data-character-id')) : '';
        const cid = innerCid || titleCid;
        if (cid) return cid;
      }
    }
    // 2) 角色页 URL 最可靠：新版 SPA 会残留上一次角色的隐藏 DOM，别让它抢先
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
      // 2) 明确的新版角色盒，且必须是可见的（隐藏的旧盒子不算）
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
      // 旧版小圣杯组件（2.0 前）：交易框是 #grailBox，class 带 chara{ID}。
      // 首页账户区叫 #grailBox2.rakuen_home（[id^="grailBox"] 也会命中它），
      // 所以遍历所有候选、只认 class 带 chara{ID} 的真角色框，避免被账户区抢先。
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
      // 下面两个是「弱兜底」：页面里第一个角色链接 / 标题里的 #数字。
      // 首页「通天塔」列表也满是角色链接，必须先确认这确实是角色页，否则会把列表里
      // 第一个角色误当成本页角色，进而把收藏星星挂到首页账户区。
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
      // 角色页标题常见「#52876 - 「休比」」；SPA / hash 路由下 URL 取不到 ID 时兜底
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

  /** 当前登录用户名：优先读小圣杯自己缓存的 assets */
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
        // chara/list 要的是数字数组：以前直接把 parseCharId 出来的字符串数组丢进去，
        // 接口返回空 → 道具页「预计消耗」里的角色名永远补不上，只能显示 #id。
        const arr = await api('chara/list', {
          method: 'POST', body: JSON.stringify(batch.map(Number)),
        });
        (arr || []).forEach((c) => {
          nameCache[String(c.Id)] = c.Name;
          if (c.Total !== undefined && c.Total !== null) totalCache[c.Id] = num(c.Total);
          // 顺便记下权威等级，联想框不用再为这些角色单独发一次反查
          if (c.Level != null) charaLvCache[String(c.Id)] = num(c.Level);
        });
      } catch (e) {}
      await sleep(120);
    }
  }

  /* ------------------------------ 等级 / 快照 ------------------------------ */

  /** Lv1 门槛 = 7500 股，之后每级 ×1.3 */
  const lvFloor = (lv) => Math.round(LV_BASE * Math.pow(LV_RATE, Math.max(0, num(lv) - 1)));

  /** 等级进度：当前总股本落在本级区间的百分比 + 距下一级还差多少股 */
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
      // 总股本已经越过下一级门槛，但等级还没刷新（服务端等级有滞后）
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

  /** 记录当日资产快照（同一天覆盖，保留最近 180 天） */
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
        // 名字还没读到就先显示 #ID，别留一个点不动的空白
        title: nm ? `${nm}（#${id}）` : `#${id}`,
      },
      nm || `#${id}`
    );
  }

  /* ------------------------------ 塔筛选 ------------------------------ */

  /** 建成判定：固定资产**上限** ≥ 500 才算建成 1 级圣殿。
   *  上限 < 500 的是「未建成的塔」（补资也用不了道具），筛塔里一律不参与统计 / 列表 / 复制。 */
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

  /**
   * 塔图是不是「没换过」。
   * 建塔时系统把角色立绘（lain.bgm.tv/…/pic/crt/…）直接当默认塔图，封面对空的也算；
   * 只要换过，图就会落到 OSS（aliyuncs.com/cover/…）或外链。所以这里只看 URL 形态，
   * 不再按「同角色重复封面」猜默认图 —— 多个人复制同一张图很常见，那样会误判。
   */
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
      // 先拿第 1 页得到总页数，再把剩下的页并发拉（以前是一页一页串行 + 每页 150ms，
      // 九千座塔要 90 轮，等到以为卡死）
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
      // 硬前提：只留下已建成的塔（上限 ≥ 500）；未建成的不进列表、不进统计、不进复制
      const all = dedupe(Array.isArray(data) ? data : []);
      templeAll = all.filter(templeBuilt);
      templeExcluded = all.length - templeAll.length;
      // 先把列表画出来：名字缺的几行再异步补（以前是等全部名字读完才渲染，
      // 九千座塔光名字就要几十批请求，面板一直白屏）
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

  /** 当前勾选的条件：都没勾 = 显示全部 */
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

  // 九千行 DOM 会把页面和工具箱一起卡死，只画前面这些；复制仍然导出全部
  const TEMPLE_RENDER_MAX = 300;
  let templeNameTried = Object.create(null);

  function renderTemples() {
    const list = els.templeList;
    list.textContent = '';
    if (!templeAll.length) return;

    const key = S.field;
    const rows = templeRows();
    // 一次遍历算完阈值命中数，别对九千座塔来回过滤好几遍
    let under = 0;
    for (let i = 0; i < templeAll.length; i++) {
      if (num(templeAll[i][key]) < num(S.threshold)) under++;
    }
    // 统计只写「这座筛选条件下的结果」，不再附带默认立绘 / 已换图的总数
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
    // 只给画出来的行补名字（最多 300 个 → 6 批），补完重画一次
    if (need.length) {
      loadNames(need, false, { always: true })
        .then(() => {
          if (els && templeAll.length) renderTemples();
        })
        .catch(() => {});
    }
  }

  /* ------------------------------ 持股筛选 ------------------------------ */

  const SORTS = {
    levelDesc: (a, b) => num(b.Level) - num(a.Level) || num(b.UserAmount) - num(a.UserAmount),
    levelAsc: (a, b) => num(a.Level) - num(b.Level) || num(b.UserAmount) - num(a.UserAmount),
    amountDesc: (a, b) => num(b.UserAmount) - num(a.UserAmount),
    valueDesc: (a, b) => num(b.UserAmount) * num(b.Current) - num(a.UserAmount) * num(a.Current),
  };

  /**
   * 拉自己的全部持仓。先拉第 1 页拿到总页数，剩下的页并发拉（默认 5 路）。
   * 原来是「一页一页串行 + 每页固定 sleep 140ms」：3700 只 = 38 轮，十几秒才出结果，
   * 老玩家一两万持股更是等到以为卡死。
   */
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
        // 偶发 429 / 断流重试一次；仍失败就跳过这一页，不至于整轮白跑
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
    // 并发完成顺序不定、重试也可能重复，按角色 ID 去重
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

    // 1 分钟内刚读过（比如先点了星光碎片的「读取持股」）就直接复用，上万只持仓不必再拉一遍
    if (holdAll.length && nowMs() - holdAt < 60000) {
      renderHoldings();
      if (els) els.holdStat.textContent += ' · 沿用 1 分钟内的扫描（要重读请稍等再点）';
      return;
    }

    // 别人的持股数不公开（接口只会给 0），所以固定只查自己。
    // 原来的「用户名」框已改成「按角色名 / ID 搜索」，只过滤扫描出来的本地持仓列表。
    busy = true;
    setButtonsDisabled(true);
    holdAll = [];
    els.holdList.textContent = '';

    try {
      const me = guessedUsername();
      let key = me || '';
      // 自己：优先拿 hash（account/recommend），持股数只有本人可见
      try {
        const r = await api('account/recommend');
        if (r && r.Hash) key = r.Hash;
      } catch (e) {
        /* 未登录小圣杯时退回用户名，数量会显示为 0 */
      }
      if (!key) {
        setHoldStatus('读不到登录用户名（未登录小圣杯？），登录后重新扫描');
        return;
      }

      let r = await fetchAllHoldings(key, {
        alive: () => busy,
        onProgress: (n, total) => setHoldStatus(`读取持仓 ${n} / ${total || '?'}…`),
      });
      // hash 读不到东西就退回用户名再试一次
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

  /** 角色名 / ID 搜索的匹配规则（持股、星光碎片共用）
   *  · 纯数字（可带 #）：当成角色 ID，必须完全一致 —— 以前用 includes 做前缀匹配，
   *    输 16703 会把 167031 / 167032 这一串同前缀的角色全列出来
   *  · 其它：按角色名模糊匹配（角色名里不会有纯数字，所以两种规则不会打架） */
  function charQueryHit(x, q) {
    if (!q) return true;
    const digits = String(q).replace(/^#/, '');
    if (/^\d+$/.test(digits)) return String(x.CharacterId) === digits;
    return String(x.Name || '')
      .toLowerCase()
      .includes(q);
  }

  /** 搜索框可以一次填多个：空格 / 逗号 / 顿号 / 分号分隔，命中任意一个就留下 */
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
    // 「角色」搜索框：名字（模糊）或 ID（必须完整一致），支持一次填多个（按「或」匹配）
    const toks = queryTokens(S.holdQuery);
    return holdAll
      .filter((x) => {
        if (toks.length) {
          if (!toks.some((t) => charQueryHit(x, t))) return false;
          // 搜到的角色不受等级 / 最少持股限制：搜一个 Lv5 的角色时，
          // 不该被「等级 0-3」这种区间挡掉（那样会显示 0 条，看着像搜索坏了）
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
    // 4000 行 DOM 一次性建出来会卡顿好几秒，只渲染前 300 条（搜索 / 筛选照样能筛到全部）
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

  /* ------------------------------ 幻想乡 ------------------------------ */

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

  /* ------------------------------ 收藏 ------------------------------ */

  const isFav = (id) => favs.some((f) => String(f.id) === String(id));
  const favItem = (id) => favs.find((f) => String(f.id) === String(id)) || null;
  const favFoldersOf = (id) => favs.filter((f) => String(f.id) === String(id)).map((f) => f.folder);

  /** 收藏某个角色到指定夹（同一角色可以同时进多个夹） */
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
  /**
   * 把读到的角色名写回收藏记录（落盘）。
   * 以前名字只放在内存 nameCache 里：刷新页面后 nameCache 清空，loadNames 又被 busy 守卫
   * 直接挡掉，收藏列表就永远退回 #23425 这种数字 ID。写回记录后哪怕断网也能显示名字。
   */
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
  /** 只移出某一个收藏夹（保留这个角色在别的夹里的收藏） */
  function removeFavKey(key) {
    const old = rawOf('items', key);
    if (!old) return false;
    upsertRaw('items', { ...old, key, del: true, at: nowMs() });
    normalizeFav();
    saveFavs();
    refreshStarBadge();
    return true;
  }
  /** 移出所有收藏夹 */
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
  /** 把某一条收藏（key）移到另一个夹；目标夹里已经有了就只删这一条 */
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
    // 删夹 = 只删这个夹里的角色，不再把它们搬到「默认收藏夹」；
    // 同一个角色在别的夹里还有一份时，那份完全不受影响。
    favs.forEach((x) => {
      if (tree.includes(x.folder)) removeFavKey(x.key);
    });
    normalizeFav();
    saveFavs();
    return true;
  }

  /** 清空某个收藏夹里的角色（收藏夹本身保留）。默认收藏夹删不掉，走这条路。 */
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

  /** 收藏页批量刷新：基础信息 + 我的持股 + 英灵殿 */
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
      // 1. 批量拿角色基础信息（含固定资产上限 Sacrifices、总股本、现价）
      // 同一角色可能在多个夹里，接口只查一次
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

      // 2. 补「我的持股」与「英灵殿数量」（并发 3，收藏多时不至于太慢）
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

  /** 只给「刚收藏的那一个角色」补数据。以前每加一个都调 refreshFavs() 整表重刷：
   *  收藏 100 个就要发 100×3 个请求，加一个等半天。这里只有 4 个轻请求。 */
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
      // chara/list 偶尔回空（会话抖动 / 批量接口抽风）：再单独问一次，别让名字退化成 #ID
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

  /** 「共 N 个收藏」按当前打开的收藏夹算，而不是永远显示全部 */
  function favCountText() {
    const fid = S.favFolder || 'all';
    if (fid === 'all') {
      // 全部收藏夹里同一角色只显示一行，数字按角色去重；不再补「N 条收藏记录」
      //（同一角色进多个夹时的记录数容易让人误以为是多出来的角色）
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

  /* -------------------- 收藏夹标签的小下拉（把这条收藏移到别的夹） -------------------- */

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

  /** 点收藏夹标签 / 「＋」：列出现在这个角色还不在的收藏夹（已经加入的自动过滤）
   *  · mode='move'：把这个夹里的「这一条」收藏移过去（不会变成两边都有）
   *  · mode='add' ：再多加一个收藏夹，原来的保留 */
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
                  // 这个角色的资料可能还没读过，补一次；已经有了就不用再发请求
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
    // 贴标签下方，下面实在放不下才翻到上方；左右别出屏幕
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
    // 刚导入 / 还没刷新过的角色也要显示得干净：不再出现 #ID、Lvundefined
    const stub = (f) =>
      byId.get(String(f.id)) || {
        id: f.id, name: f.name || nameCache[f.id] || '', at: f.at,
        level: 0, current: 0, total: 0,
        mine: null, fixed: null, fixedMax: null, valhalla: null,
      };
    const inView = favs.filter((f) => !tree || tree.includes(f.folder));
    // 「全部收藏夹」= 角色视角：同一角色在多个夹里只显示一行，夹名用下面的标签列出来；
    // 具体某个收藏夹 = 收藏记录视角：一条记录一行，可以直接换夹
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
    // 名字还没读到（刚添加 / 接口抖了一下 / 导入只带 ID）→ 自动补一次，别一直显示 #ID
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
      // always：这里不是扫描流程，别被 loadNames 的 busy 守卫直接挡回来
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
      // 收藏夹一律用圆角标签（比下拉框好读）：标签本身可点 → 把这条收藏移到别的夹，
      // 下拉里会自动过滤掉已经加入的夹；一条角色在多个夹里时，每个标签再带个 × 只移出那个夹
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
                // 只有一个夹时，这个 × 就是「取消收藏」
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
      // 标签列最后的「＋」：把这个角色再收藏到别的收藏夹（原来的都保留）
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
              // 合并行代表这个角色的全部记录，× 就是「整个角色取消收藏」
              if (multi) items.forEach((it) => removeFavKey(it.key));
              else removeFavKey(f.key);
              // 这个角色在所有夹里都没了，才清掉缓存的详情行
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

  /** 同步收藏页顶部的「当前角色」按钮状态 */
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

  /* ------------------------------ 道具（魔方 / 道标） ------------------------------ */

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

  /** 某种道具记着的执行次数（三种道具各存各的：每日上限 3 / 5 / 1 本来就不一样） */
  function magicTimes(mode) {
    const by = S.mTimesBy || {};
    return Math.max(1, Math.min(50, Math.floor(num(by[mode]) || 1)));
  }

  /** 更新「预计消耗」提示。角色名没缓到时异步补一次，补到后重绘，
   *  让炮塔 / 目标直接手打 ID 也能显示名字（不用先去收藏夹里点一遍）。 */
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

    // 只补真正缺名字的 ID；失败也留着 15 秒退避，避免一直打接口又不卡死
    const now = Date.now();
    const miss = [from, to].filter(
      (id) => id && !nameCache[id] && now - (magicNameTried.get(id) || 0) > 15000
    );
    if (!miss.length) return;
    miss.forEach((id) => magicNameTried.set(id, now));
    loadNames(miss, true).then(() => {
      // 只有名字真的补上了才重绘，否则会自己触发自己无限空转
      if (els && els.mPreview && miss.some((id) => nameCache[id])) refreshMagicPreview();
    }).catch(() => {});
  }

  /** 读自己的道具，返回 { 混沌魔方: n, 虚空道标: n } */
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

  /** 一串「ID / #ID」→ 去重后的 ID 数组（空格 / 逗号 / 顿号 / 分号都算分隔） */
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

  /* ---------- 自动献祭补充固定产值 ---------- */

  let selfKeyCache = '';

  /** 自己的用户名：优先读页面缓存，读不到再问 account/recommend */
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

  /** 查自己在某角色上的圣殿（Assets 当前固资 / Sacrifices 献祭上限 / Level 塔等级） */
  async function myTemple(cid) {
    const u = await selfKey();
    if (!u) return null;
    const v = await api(`chara/user/temple/${encodeURIComponent(u)}/1/100?keyword=${cid}`);
    const list = (v && v.Items) || [];
    return list.find((x) => String(x.CharacterId) === String(cid)) || null;
  }

  /** 置顶用：先按 keyword 查那一条，查不到再从「我的全部塔」里捞。
   *  有些账号 / 版本上 keyword 过滤会失效（直接回第 1 页），只靠它会出现
   *  「置顶后没快照 → 名字变 #id、个人页也不生效」。 */
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

  /** 查自己某角色的可用持股（活股） */
  async function myShares(cid) {
    const u = await selfKey();
    if (!u) return 0;
    const v = await api(`chara/user/${cid}/${encodeURIComponent(u)}/false`);
    return num(v && v.Amount);
  }

  /**
   * 站点要求炮塔固资 ≥ 250 才能使用道具：低于 250 时接口统一回
   * 「今日已超过使用次数限制或资产不足」，看着像次数用完，其实一次都没用掉。
   * 所以「够不够用」一律按 250 这个下限判，而不是只看单次消耗（魔方 10 / 道标 100）。
   *
   * 相关前提（用户 2026-11 补充）：塔的固资上限最低是 500——上限到 500 才算建成 1 级圣殿，
   * 只有建成的圣殿才能用道具。所以「上限 < 500」的塔在站点上不存在，
   * 下面的补资也永远够得着 250，不会出现「想补但上限不够用道具门槛」的情况。
   */
  const MAGIC_MIN_FA = 250;

  /**
   * 补 gap 点固资需要献祭多少股。
   * 规则（用户 2026-11 确认）：
   *   · 固资没到上限时，1 股 = +2 固资；差额是奇数就向上取整（献祭不了半股）：差 37 → 19 股；
   *   · **绝不越过上限**：顶到上限后再献 1 股只能换 1 固资 + 1 上限，等于把上限白白撑高，
   *     强迫症玩家受不了（500 上限、237 固资要补满，献 132 股会让上限变 501）。
   *     所以先按 2 固资一档往下退，宁可停在 499，也不去动上限。
   *   · 已经在上限上（或只差 1 点，再献就破限）→ 返回 0，不补。
   */
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

  /** 不破上限的前提下最多能献多少股（上限未知返回 Infinity） */
  function maxSharesBeforeCap(assets, ceiling) {
    const a = Math.floor(num(assets));
    const c = Math.floor(num(ceiling));
    if (!(c > 0)) return Infinity;
    const room = c - a;
    if (!(room > 1)) return 0; // 已到上限，或只差 1 点（再献就破限）
    return Math.floor(room / 2);
  }

  /**
   * 固资不足时献祭「炮塔角色自己的持股」补塔。
   * 献祭只能补同一个角色的圣殿，所以来源固定是炮塔角色本身。
   *
   * 口径（2026-11 用户指定）：
   *   · 「单次献祭」填了数字 = 每轮固定烧这么多股，不够就再来一轮；
   *   · 留空 = 按缺口自动算股数（1 股 ≈ 2 固资），差多少补多少，不会一次多烧一堆；
   *   · 两种模式都**不许越过塔上限**：献祭到「再献就破限」就停，
   *     宁可差 1 点固资，也不把上限撑高 1 点（上限一涨，后面每献 1 股都只值 1 固资）。
   * 返回补充后的固资；失败返回 null。
   */
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
    // 固资够用时不献祭，但要留一行日志：不然用户看不到这段逻辑到底跑没跑，
    // 会误以为「自动献祭补充」没生效。
    // 注意 need 现在至少是 MAGIC_MIN_FA（250）：站点低于 250 一次都用不了，
    // 以前拿「单次消耗」当门槛，213 固资配 10 固资的魔方会被判成「够用」，一发都发不出去。
    if (assets >= need) {
      log('info', `「${name}」固资 ${fmt(assets)} ≥ 本批所需 ${fmt(need)}（站点要求至少 ${fmt(MAGIC_MIN_FA)}），无需献祭`);
      return assets;
    }

    // 已经顶在上限：再献祭 1 股只能换 1 固资 + 1 上限，纯亏，直接不补。
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

      // 不破上限的股数上限：留 1 点时宁可差着，也不献祭（一献上限就 +1）
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
      // 献祭了却没涨，说明口径和预期不一样，宁可停下也不要反复烧股
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

  /** 每次道具请求之间的基础间隔：小圣杯对连续调用有节流，太快会直接被拒 */
  const MAGIC_GAP = 1500;
  /** 间隔随机抖动，固定节奏更容易撞上服务端限流 */
  const MAGIC_JITTER = 500;

  /** 「今日次数已用完 / 资产不足」这类硬性错误：继续跑只会连着失败，看到就整批停 */
  function isQuotaMagicError(msg) {
    return /次数|上限|限制/.test(String(msg || ''));
  }

  /**
   * 发一次道具请求。网络抖动 / 偶发 5xx 自动重试一次（隔 2 秒），
   * 次数上限、资产不足这类硬性错误不重试——重试也只会白烧一次机会。
   */
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
      // 前置：道具余量
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

        // 固资不足时自动献祭炮塔角色自己的持股补塔。
        // 门槛是站点要求的 250（不是单次消耗）：低于 250 一次都用不了，
        // 而且要留出这一批实际要扣的固资，所以补到 250 + 消耗×次数。
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
          // 鲤鱼之眼返回的是一句结果文案，没有股数字段
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
          // 服务端把「今日次数用完」和「资产不足」合并成同一句文案
          //（「今日已超过使用次数限制或资产不足」），光看报错分不出原因。
          // 失败后回查一次圣殿，用真实固资判断，并决定要不要补一次再重试。
          let realAssets = null;
          if (/次数|上限|限制|资产不足/.test(msg)) {
            try {
              const t = await myTemple(from);
              if (t) realAssets = num(t.Assets);
            } catch (e) {}
          }
          const shortOfAssets = realAssets !== null && realAssets < MAGIC_MIN_FA;

          if (shortOfAssets && S.mFill && retryLeft > 0) {
            // 真·缺钱：补一次，然后把这一次重试掉（不计入失败数）
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
          // 次数上限是硬限制：继续跑只会把后面几次也烧成同样的报错，直接中断整批
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

        // 小圣杯对连续道具调用有节流：间隔太短会被判成异常请求。
        // 1.5 秒起步再随机抖动，避免固定节奏。
        if (i < times && magicRunning) await sleep(MAGIC_GAP + Math.floor(Math.random() * MAGIC_JITTER));
      }

      const summary =
        `成功 ${ok} 次 / 失败 ${fail} 次` + (gain ? ` · 共获得 ${fmt(gain)} 股` : '') + (value ? ` · 约 ₵${fmt(value)}` : '');
      pushMagicLog(h('div', { class: 'tgtk-log tgtk-log-sum' }, (stopped ? '已停止 · ' : '') + summary));
      setMagicStatus(summary);

      // 刷新一下道具余量
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


  /* ------------------------------ 一键冲星 ------------------------------ */

  /** 读自己某角色的塔：当前星之力 + 可用固资 + 固资上限 */
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

  /**
   * 预读若干角色的塔（当前固资 + 上限），给「预计消耗活股」用。
   * 只请求缓存里没有的角色，避免每次敲键盘都打接口。
   * 返回读到几条（0 = 没变化，不用重绘）。
   */
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

  /**
   * 一键冲星专用：把本角色活股献祭成固资，补到至少 need。
   * 与道具页的 fillAssets 分开，因为那边是「每次固定献 N 股」，
   * 这里要按缺口反推（1 股活股 = 2 固资，用户 2026-11 确认的固定比例）：
   *   从 0 补满 500 上限 → 250 股；最后一批只要 1000 → 500 股。
   * **不越过上限**：237 固资、500 上限时只献 131 股补到 499；
   * 献 132 股虽然能到 500 以上，但上限会被顶成 501，之后每股只值 1 固资。
   * 每轮重新读塔校准，防止比例有偏差时反复烧股；返回补完后的固资。
   */
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
      // 1 股活股 = 2 固资；但绝不越过上限（越过会让上限 +1，等于之后每股只值 1 固资）
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
      // 献祭了却没涨，宁可停下也不要反复烧股
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

  /** 收尾把固资补到多少：'full' 补满上限 / '250' 只补到 250（躲虚空道标）/ 'none' 不补 */
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

  /**
   * 一键冲星：给每个角色贡献指定「数量」的星之力（1 固资 = 1 星之力）。
   * 每批 = min(塔固资上限, 剩余数量)：上限 1500 冲 10000 → 前 6 批各 1500，
   * 第 7 批只转 1000。所以不再需要手填「单次」，上限直接从圣殿读。
   * 勾了自动献祭时，达到目标后再补满一次塔，避免最后一转化把固资清空。
   */
  async function runStar() {
    if (starRunning) return;

    const ids = String(S.starChar || '')
      .split(/[\s,，、;；]+/)
      .map(parseCharId)
      .filter(Boolean)
      .slice(0, 20);
    if (!ids.length) return setStarStatus('请填角色 ID（可填多个，空格分隔）');

    // 「数量」= 每个角色这次要贡献多少星之力，与它当前已有多少星之力无关
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
        // 读不到上限时退回旧设置 starStep（默认 500），不至于卡死
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
              // 受塔上限所限补不满（例如 237 → 只能到 499，硬补会让上限变 501）：
              // 不再硬凑，这一批就按现有固资转，剩下的留到下一批。
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
          // 收尾补资：最后一次转化会把固资清空，这里按用户选的口径补回去
          // （补满上限 / 只补到 250 躲虚空道标 / 不补）。
          // 这部分固资不再转化为星之力，所以不计入上面的「数量」。
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
        // 记下塔现在的固资，下一次「预计消耗」就能按真实余量算
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

  /* ------------------------------ 星光碎片 ------------------------------ */

  /**
   * 持仓项里的「角色等级」。chara/user/chara 通常给 Level，少数情况下只给
   * CharacterLevel / CharaLevel，这里做一次归一化。
   * 注意 Lv0（ST / 退市重组角色）是合法等级，不能像以前那样用 Math.max(1,…)
   * 把它抬成 Lv1 —— 否则「等级填 0」永远筛不出这些角色。
   */
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

  /** 列表最多显示多少只（按持股从多到少取前 N） */
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

  /** 读取自己的全部持仓，作为燃料候选。
   *  和「持股」页共用缓存：谁先扫过，另一边直接复用，不再重复拉几千条。 */
  async function loadFuel() {
    if (sdBusy) return;
    // 5 分钟内扫过就直接用，搜索 / 换角色都不再打接口
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
      // 候选浮层的搜索缓存要跟着更新：否则刚读到的这些角色不会出现在联想框里
      sugCache.clear();
      sugIdCache.clear();
      // 回填给「持股」页，避免它再扫一遍
      if (sdHold.length) {
        holdAll = sdHold.slice();
        holdAt = nowMs();
      }

      if (!sdHold.length) {
        setSdStatus('没有读到持股，检查是否登录小圣杯');
        return;
      }
      // 旧版「单只燃料」升级成队列时会带进历史 ID；读全持仓后，
      // 把完全不在持仓里的清掉（这种角色不可能有活股，还找不到地方取消）
      // 只在「确实读全了」时清理，分页没读完就别动用户的队列
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

  /** 候选燃料：自己所有的持仓，按等级 / 关键字过滤，按持股数量从多到少排列。
   *  · 搜索支持一次填多个（空格 / 逗号分隔，按「或」匹配），和持股页一致；
   *    命中的角色一律列出来，不再受等级 / 活股限制
   *  · 没搜索时也不再把「活股 = 0」的角色直接丢掉（全挂了卖单的人仍能查到自己的角色），
   *    只是排在最后、行上标「无活股」，按钮禁用不能当燃料 */
  function sdCandidates() {
    const toks = queryTokens(S.sdQuery);
    // 只有「留空」才看全部；填了 0 就只筛 Lv0，不能再用 !lvOnly 把 0 当成假值
    const lvOnly = S.sdLevel === '' || S.sdLevel === null || S.sdLevel === undefined
      ? null
      : Math.max(0, Math.floor(num(S.sdLevel)));
    return sdHold
      .filter((x) => {
        if (toks.length) return toks.some((t) => charQueryHit(x, t));
        return lvOnly === null || sdLevel(x) === lvOnly;
      })
      .sort((a, b) => {
        // 无活股的一律压到最后（不管正序倒序）：它们不能当燃料，排前面只会挡路
        const da = num(a.UserAmount) <= 0 ? 1 : 0;
        const db = num(b.UserAmount) <= 0 ? 1 : 0;
        if (da !== db) return da - db;
        const d = S.sdSortAsc
          ? num(a.UserAmount) - num(b.UserAmount)
          : num(b.UserAmount) - num(a.UserAmount);
        return d || String(a.CharacterId).localeCompare(String(b.CharacterId));
      })
      // 搜索时不能按「持股前 100 只」截断：0 活股的角色排在最末尾，一截就全没了
      .slice(0, toks.length ? SD_SEARCH_MAX : SD_LIST_MAX);
  }

  /** 燃料队列（有序、去重）：老版本可能存成单个 ID */
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

  /** 已选燃料的摘要：只报只数与可用合计，具体顺序看下面的编号小标签。
   *  以前把「1.「全名」#id 股 → 2.…」整串写在这里，选十几只就占掉半屏。 */
  function sdPickText() {
    const q = sdQueue();
    if (!q.length) return '还没选燃料：点列表里的「选」加入队列（可多选，按点选顺序依次消耗）';
    // 还没读过持股时别显示「合计 0 股」这种误导性数字
    if (!sdHold.length) return `燃料队列 ${q.length} 只（点「读取持股」后可看每只可用股数）`;
    let sum = 0;
    q.forEach((id) => {
      const it = sdHold.find((x) => String(x.CharacterId) === id);
      if (it) sum += Math.max(0, num(it.UserAmount));
    });
    return `燃料队列 ${q.length} 只 · 可用合计 ${fmt(sum)} 股 · 按点选顺序消耗`;
  }

  /** 队列小标签上的短名字：太长会把整行撑开，详细名字放 title。
   *  6 个字以内保留全名（常见角色名都能完整显示），更长的才截断。 */
  function sdShortName(nm) {
    const s = String(nm || '');
    return s.length > 6 ? s.slice(0, 6) + '…' : s;
  }

  /** 星光碎片顶部那一行「目标」：面板最下面原来单独打一条日志，太远；
   *  现在固定在燃料队列的位置上，选燃料前后都看得到。 */
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

  /** 燃料队列摘要：文字说明 + 每只一个可点的小标签（× 移出）+ 一键清空。
   *  队列里可能有旧版设置迁移来的残留 ID，它不一定出现在当前筛选出的列表里，
   *  以前这种情况根本没有「取消」入口；现在不管列表显不显示都能清掉。 */
  function renderSdPick() {
    if (!els || !els.sdPick) return;
    const box = els.sdPick;
    box.textContent = '';
    // 第一行固定是目标塔（选没选燃料都显示）
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
        // 已选的显示它在队列里的序号（第几个被消耗），再点一次就移出队列
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
        // 名字是可点的：0 活股多半是股全挂了卖单，跳去角色页正好能取消挂单
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
    // 点一下加入队尾（顺序 = 消耗顺序），已在队列里就点一下移出（含 0 活股，便于取消）
    const q = sdQueue();
    const at = q.indexOf(String(id));
    if (at >= 0) q.splice(at, 1);
    else {
      // 0 活股一律不能当燃料，不管从行还是从别的地方点进来
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

  /** 查目标角色的等级（chara/list 返回的角色对象带 Level），只用于日志展示 */
  async function fetchTargetLevel(cid) {
    try {
      const arr = await api('chara/list', { method: 'POST', body: JSON.stringify([Number(cid)]) });
      const c = (arr || [])[0];
      return c ? Math.max(0, Math.floor(num(c.Level))) : 0;
    } catch (e) {
      return 0;
    }
  }

  /** 读取目标塔当前固资，顺便确认「他是不是你的塔」 */
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
      // 目标信息现在直接显示在燃料队列那一行，不再往下面的日志里塞一条
      renderSdPick();
    } catch (e) {
      /* 读不到就静默，执行时再报 */
    }
  }

  /** 星光碎片：take 股、燃料等级 a、目标等级 b → 能补多少固资。
   *  a ≥ b−1 → 1 股 = 1 固资；再低一级减半（2^(b−a−1) 股 = 1 固资，股数封顶 32）。 */
  function sdGain(take, a, b) {
    if (!(take > 0)) return 0;
    if (a >= b - 1) return take;
    const per = Math.min(32, Math.pow(2, b - a - 1));
    return take / per;
  }

  /** 星光碎片：按当前队列 + 数量估算能补多少固资。
   *  换算：目标等级 b、燃料等级 a。
   *    a ≥ b−1 → 1 股 = 1 固资；
   *    a = b−2 → 1 股 = 0.5 固资；再低一级继续减半（2 股 / 4 股…才 1 固资），
   *    也就是「2^(b−a−1) 股 = 1 固资」，股数最高 32（再低也按 32 股 = 1 固资）。
   *  按队列顺序依次扣。星光碎片可以**超充**：固资在上限以下时能一次性冲到上限之上
   *  （例如 5 级 499/500 的塔，10000 股 4 级股能补到 10499/500）；
   *  但冲到上限之上以后，后面的燃料就再也补不进去了 —— 所以要在这个点截断，
   *  否则会按「整条队列都能用」多算（16259 补完变 16862/1250，第二只就废了）。 */
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
      // 这一只充完就已经到 / 超过上限：后续燃料站点会直接拒绝，只能到此为止
      if (cap > 0 && assets + gain >= cap) {
        hitCap = true;
        blocked = q.slice(i + 1).length;
        break;
      }
    }
    // 超充只能「一次性」冲到上限之上；已经到 / 超过上限的塔就再也补不进去了
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

  /**
   * 星光碎片：按「燃料队列」的点选顺序依次消耗活股，补充目标角色圣殿的固定资产。
   * 「数量」是本次合计要消耗的股数：第一只不够就接着扣第二只，凑够就停。
   * POST magic/stardust/{燃料}/{目标}/{本次从这只扣的股数}/false
   */
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
    // 目标等级 / 上限 / 当前固资：用来判断「这一只充完是不是已经冲过上限」。
    // 冲过之后站点会拒绝后续充能，先停下来，别把剩下的燃料白试一遍。
    const lvB = sdTargetInfo && sdTargetInfo.lv ? Math.floor(sdTargetInfo.lv) : 0;
    const capNow = sdTargetInfo ? num(sdTargetInfo.cap) : 0;
    let assetsNow = sdTargetInfo ? num(sdTargetInfo.assets) : 0;

    try {
      await loadNames(queue.concat([to]));
      // 估算要用目标的等级 / 固资 / 上限：没读过就先读一次（跟日志共用一次请求）
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
        // 队列里的角色可能不在当前列表（换过筛选 / 刚卖出），也可能列表是几分钟前的缓存：
        // 每只都现查一次活股，别拿过期数字去充能（挂单 / 已卖光的会被跳过）
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
          // 这一只已经把固资充到上限之上：后面的燃料站点一律拒绝，直接停
          if (lvB && capNow > 0) {
            assetsNow += sdGain(take, sdLevel(it), lvB);
            if (assetsNow >= capNow && left > 0) {
              capStop = true;
              log('warn', `「${toName}」固资已经到/超过上限 ${fmt(capNow)}，后面的燃料用不上了，已停止`);
              break;
            }
          }
        } catch (err) {
          // 不可逆操作：某一只失败就停下来，别继续往后扣，免得重复消耗
          failed = `第 ${i + 1} 只「${fromName}」失败：${err && err.message ? err.message : err}`;
          log('fail', failed + ' · 已停止，请核对后再继续');
          break;
        }
      }

      await sleep(500);
      // 目标塔固资
      try {
        const t = await myTemple(to);
        if (t) {
          log('info', `「${toName}」固资 ${fmt(num(t.Assets))} / 上限 ${fmt(num(t.Sacrifices))}`);
          // 充完把估算的基准一起刷新，免得「预计 +N」还按充能前的固资算
          sdTargetInfo = {
            cid: String(to), lv: (sdTargetInfo && sdTargetInfo.cid === String(to) && sdTargetInfo.lv) || 0,
            name: (sdTargetInfo && sdTargetInfo.name) || t.Name || charaName(to),
            assets: num(t.Assets), cap: num(t.Sacrifices),
          };
          renderSdEstimate();
        }
      } catch (e) {}
      // 逐只刷新剩余活股，方便下一轮继续扣
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


  /* ------------------------------ ICO ------------------------------ */

  /* ICO 等级门槛（官方规则）：
   *   扣掉 50 万市场监管税后的资金 ≥ n(n+1)(2n+1)/6 × 10 万，且 参与人数 ≥ 10 + 5n，
   *   两个条件同时满足才算 n 级。所以只补钱、人数不够是升不上去的。 */
  const ICO_TAX = 500000;
  const ICO_MIN_JOIN = 5000; // 单次注资下限
  const icoNeedNet = (lv) => (lv * (lv + 1) * (2 * lv + 1) * 100000) / 6;
  const icoNeedTotal = (lv) => icoNeedNet(lv) + ICO_TAX;
  const icoNeedUsers = (lv) => 10 + 5 * lv;

  /** 由「已募集金额 + 参与人数」反推当前 ICO 等级 */
  function icoLevel(total, users) {
    const net = num(total) - ICO_TAX;
    let lv = 0;
    for (let n = 1; n <= 30; n++) {
      if (net < icoNeedNet(n) || num(users) < icoNeedUsers(n)) break;
      lv = n;
    }
    return lv;
  }

  /** ICO 等级 → 上市后角色等级（官方对照表，下标 = 等级 - 1）：
   *  1→2 2→4 3→5 4→6 5→7 6→8 7→8 8→9 9→9 10→9 11→10 12→10 13→10 14→11 15→11 16→11 17→11 18→12 19→12 20→12 */
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

  /** 读「我参与注资的 ICO」。
   *  首选 chara/user/assets/0/true 里的 Initials（字段最全：Total / Users / End / Level），
   *  拿不到时退回 chara/user/initial/{用户名}；募集额与人数再用公开的「即将结束」榜单校准一次。 */
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
      // 募集额 / 人数以公开的「即将结束」ICO 榜单为准：资产接口里不保证带全这两个字段
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
      // 老版本的计划只存了 { lv, on }，顺手把 cid / 结束时间 / 名字补进去，
      // 之后即使不打开 ICO 页也能独立判断该不该补款。
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
          // 上一次自动注资的结论：成功 / 人数不够 / 错过（页面没开着）都会留一行
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

  /** 提前多少毫秒执行：默认 1 分钟（ICO 结束前的最后一分钟） */
  function icoAdvMs() {
    return Math.max(1, Math.min(180, Math.floor(num(S.icoAdvance) || 1))) * 60000;
  }

  /** 当前所有「已开启自动注资」的计划。
   *  以本机持久化的 icoCfg 为准，不需要先打开 ICO 标签页、也不用先点「读取 ICO」：
   *  所以关掉小圣杯页、切到别的 bgm 页面、重开浏览器之后都还能继续执行。 */
  function icoPlans() {
    const out = [];
    const cfg = S.icoCfg || {};
    Object.keys(cfg).forEach((id) => {
      const c = cfg[id];
      if (!c || !c.on) return;
      // 另一个实例（组件 iframe 刚好重载）正在补这次款，20 秒内别重复投
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

  /** 一个计划处理完就关掉开关并记下结论：刷新 / 重开页面不会重复注资 */
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
    // 把角色 id / 结束时间一起存下来：之后不管是停在别的 bgm 页面，还是重开浏览器，
    // 这条计划都能独立判断「是不是该补款了」，不依赖 ICO 列表有没有被读出来。
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

  /** 我的可用余额（多个 ICO 同时补时按剩余额度依次扣） */
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
    // 组件挂在任意 bgm 页面都会跑，所以「关掉小圣杯页」不影响执行。
    // 页面一打开就先判一次：可能正好落在补款窗口里，也可能刚刚错过。
    setTimeout(() => icoAutoCheck(), 1200);
    // 浏览器切回来 / 电脑睡眠唤醒时立刻判一次，不用等下一秒
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

  /** 拉一次某个 ICO 的最新状态。
   *  查不到（网络问题 / 没登录）返回 null；查到但已经上市返回 { listed: true }。 */
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

  /** 每秒判一次「该不该补款」。两种要处理的情况：
   *   1) 还在窗口里（剩余 ≤ 提前分钟数）→ 按缺口补到目标等级；
   *   2) 结束时间已过但没处理过（页面关着 / 关机错过）→ 核对一次：
   *      真结束了就如实记录，被延期了就更新结束时间继续等。 */
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
      // 定时器每秒跑一次，但没必要每秒都打接口：5 秒核对一次服务端就够
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
      // 先处理「已过结束时间」的：多半是真结束了，少数是被延期
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
          // 刚开启时还在募集、这会儿已经结束：记一笔，别再重试
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
        // 先在本机「占位」再发请求：万一组件 iframe 正好在这几秒里重载，
        // 新实例看到占位就不会把同一笔补款再投一次。
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

  /* ------------------------------ 资金日志 ------------------------------ */

  const LOG_PAGE = 200;
  const LOG_MAX_PAGE = 40;
  /** 个人所得税（股息税）在日志里是单独一条负数记录 */
  const TAX_RE = /个人所得税|所得税|股息税/;

  /** 日志时间 → 毫秒时间戳，解析失败返回 0 */
  function logTs(v) {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    const s = String(v).trim();
    const t = Date.parse(s.replace(/(\.\d{3})\d+/, '$1'));
    return Number.isNaN(t) ? 0 : t;
  }

  /**
   * 「今天 0 点往前 offset 天」的毫秒时间戳（offset 可以为负，-1 = 明天 0 点）。
   * 账本按**自然日**统计：从第一天的 0:00 到最后一天的 24:00，
   * 而不是「现在往前推 N×24 小时」——后者会把首尾两天各切掉半截，
   * 隔着几个小时再看，同一批记录一会儿算进来一会儿算出去。
   */
  function dayStartMs(offset) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (offset || 0));
    return d.getTime();
  }

  /** 月/日两位显示（账本窗口用），如 11/03 */
  function fmtDay(ms) {
    const d = new Date(num(ms));
    return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
  }

  /** 'YYYY-MM-DD' → 当天 0:00 的毫秒时间戳；格式不对返回 null */
  function parseDayMs(v) {
    const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /** 毫秒时间戳 → 'YYYY-MM-DD'（本地时区），给日期输入框用 */
  function dayStr(ms) {
    const d = new Date(num(ms));
    return (
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    );
  }

  /** 当前统计窗口（自然日）：自定义优先，否则「今天 0 点往前 days-1 天 → 明天 0 点」 */
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
      // 选了自定义但还没填日期：先按近 7 天
    }
    const days = Math.max(1, Math.min(90, Math.floor(num(S.logDays) || 7)));
    return { from: dayStartMs(days - 1), to: dayStartMs(-1), days, custom: false };
  }

  /** 窗口文字：近 7 天 / 11/01 ~ 11/09（9 天） */
  function logRangeLabel(r) {
    const g = r || logRange();
    return g.custom ? `${fmtDay(g.from)} ~ ${fmtDay(g.to - 1)}（${g.days} 天）` : `近 ${g.days} 天`;
  }

  /** 从描述里抠角色 ID（兜底，正常走 RelatedId） */
  function descCharaId(desc) {
    const m = String(desc || '').match(/#(\d+)/);
    return m ? num(m[1]) : 0;
  }

  /** 从描述里抠股数（兜底，正常走 Amount） */
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
      // 星之力是固资转化，不算股数；卖出只算成交的，撤单 / 冻结不算
      if (/星之力/.test(String(x.Description || ''))) return;
      if (kind === 'sell' && ch <= 0) return;

      let rec = map.get(id);
      if (!rec) {
        rec = { id, gain: 0, loss: 0 };
        map.set(id, rec);
      }
      // 献祭（资产重组）在日志里股数是正数，但方向是消耗，和账本口径保持一致
      if (kind === 'sell' || kind === 'sacrifice') rec.loss += Math.abs(amt);
      else if (amt > 0) rec.gain += amt;
      else rec.loss += -amt;
    });

    return { income, expense, inN, outN, chars: [...map.values()] };
  }

  /**
   * 日志 → 变动来源。先用文字里最没歧义的词兜住（服务端有部分记录的 Type 标成了「其他」），
   * 再信 Type 字段，最后退回中文关键词和「花钱买股 / 卖股收钱」的方向推断。
   */
  function classifyKind(desc, amt, ch, type) {
    const s = String(desc || '');
    if (TAX_RE.test(s)) return 'tax';
    // 竞拍分红要先判：它同时带「竞拍」和「分红」，不能算成竞拍返还
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

  /** 描述文案 → 固定资产变动来源；不是固资相关返回 null */
  function fixedKind(desc) {
    const s = String(desc || '');
    if (!s) return null;
    for (let i = 0; i < FIXED_RULES.length; i++) {
      if (FIXED_RULES[i].test(s)) return FIXED_RULES[i];
    }
    if (s.includes('固定资产') || s.includes('固资') || s.includes('圣殿')) return { key: 'other', label: '其他' };
    return null;
  }

  /** 从描述里抠固定资产变动数值，抠不到返回 0 */
  function parseFixed(desc) {
    const s = String(desc || '');
    // 「71股固定资产」「100 点固定资产」「固定资产 71」都按固资点算
    let m = s.match(/([\d,]+(?:\.\d+)?)\s*(?:股|点)?\s*固定资产/) || s.match(/固定资产[^\d\-−]{0,12}([\d,]+(?:\.\d+)?)/);
    if (m) return num(String(m[1]).replace(/,/g, ''));
    // 只写了「点」的，也算固资
    m = s.match(/([\d,]+(?:\.\d+)?)\s*点/);
    if (m) return num(String(m[1]).replace(/,/g, ''));
    return 0;
  }

  /** 同一条日志里被扣掉的活股数（没有「固定资产」字样时才算，避免把「71股固定资产」当成股） */
  function parseFixedShares(desc) {
    const s = String(desc || '');
    if (/固定资产/.test(s)) return 0;
    const m = s.match(/([\d,]+(?:\.\d+)?)\s*股/);
    return m ? num(String(m[1]).replace(/,/g, '')) : 0;
  }

  /**
   * 账本统计：资金按「收入 / 支出」、股数按「获得 / 损失」四象限聚合，
   * 每个象限内再按来源分类（卖出 / 股息 / 买入 / 献祭 …）。
   */
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
        // 竞拍 / 买入的退款都是「挂单冻结又退回」，不算收入，改成冲减对应支出
        if (kind === 'auction') {
          auctionBack.sum += ch;
          auctionBack.n++;
        } else if (kind === 'buy') {
          buyBack.sum += ch;
          buyBack.n++;
        } else put(buckets.fundIn, FUND_IN_KINDS, ch);
      } else if (ch < 0) {
        // 个人所得税单拎出来，最后从股息里扣，避免"股息看着高、其实大半交税"
        if (kind === 'tax' || TAX_RE.test(String(desc || ''))) {
          tax.sum += -ch;
          tax.n++;
        } else put(buckets.fundOut, FUND_OUT_KINDS, -ch);
      }

      const ds = String(desc || '');
      // 自己的塔被道标打中：接口里 Change=0、Amount = -固资点数（2026-11 用真实账单核对过）。
      // 掉的是固资不是持股，别混进「股数损失」里。
      const isGuideHit = /虚空道标/.test(ds) && !/获得/.test(ds) && /受到|被|你的圣殿/.test(ds);

      if (/星之力/.test(ds)) {
        // 「N 股固定资产转化为星之力」算的是固资，已在圣殿口径里，不重复计入股数
      } else if (isGuideHit) {
        // 道标命中只掉固资，股数不动
      } else if (kind === 'sell') {
        // 卖出只算真正成交的（同时收到了 cc）；挂单冻结 / 取消卖出都不计
        if (ch > 0 && amt) put(buckets.stockOut, STOCK_OUT_KINDS, Math.abs(amt));
      } else if (kind === 'sacrifice' && amt) {
        // 献祭（资产重组）在日志里股数常记成正数，但语义是消耗，一律算损失
        put(buckets.stockOut, STOCK_OUT_KINDS, Math.abs(amt));
      } else if (amt > 0) put(buckets.stockIn, STOCK_IN_KINDS, amt);
      else if (amt < 0) put(buckets.stockOut, STOCK_OUT_KINDS, -amt);

      // 固定资产：日志里没有独立字段，只能靠描述归类 + 抠数值
      const fk = fixedKind(desc);
      // 道标命中行的描述有两种写法：「…11股固定资产」和「…83股」（少了「固定资产」四个字），
      // 后者抠不出数值，所以这类行直接取 Amount（-N 就是掉的点数）。
      const fAmt = isGuideHit ? Math.abs(num(x.Amount)) || parseFixed(desc) : parseFixed(desc);
      // 没解析出固资数值的行不是固资变动，跳过（不能 return，后面还要读 Balance 更新账户余额）：
      // 「使用「虚空道标」获得 6「伊吹风子」48股」这类行写着「获得」+ 道具名，
      // 以前会被记成「固资获得 0 点」，于是面板上出现「固资获得 57 次」却一分没有的怪现象。
      if (fk && fAmt > 0) {
        const sAmt = isGuideHit ? 0 : parseFixedShares(desc);
        const gain = /获得|增加|补充|恢复|注入/.test(String(desc || ''));
        add(gain ? buckets.fixedIn : buckets.fixedOut, fk.key, fk.label, fAmt, desc);
        if (!gain && fk.key === 'guidepost') {
          // 分组只认描述里那个角色：RelatedId 存的不是被命中的塔
          //（真实数据里同一座塔的 RelatedId 各不相同，按它分组会冒出一堆没建过塔的角色）
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

    // 刮刮乐的「次数」按购买次数算（日志里每次 -1000 cc 一条），
    // 不是奖励行数：刮一次会掉好几条「彩票刮刮乐获奖」记录，行数会虚高两三倍。
    if (scratchBuys > 0) {
      const scRow = buckets.stockIn.get('scratch');
      if (scRow) {
        scRow.n = scratchBuys;
        scRow.countBy = 'buy';
      }
    }

    // 股息记税后：把个税从股息收入里扣掉，个税不再单独出现在支出里
    const div = buckets.fundIn.get('dividend');
    if (tax.sum > 0 && div) {
      div.gross = div.sum;
      div.tax = tax.sum;
      div.taxN = tax.n;
      div.sum = Math.max(0, div.sum - tax.sum);
    }

    // 竞拍记净额：支出里的竞拍扣掉失败返还
    if (auctionBack.sum > 0) {
      const r = buckets.fundOut.get('auction');
      if (r && r.sum > 0) {
        r.refund = auctionBack.sum;
        r.refundN = auctionBack.n;
        r.sum = Math.max(0, r.sum - auctionBack.sum);
      } else {
        // 这段时间只有返还、没有竞拍支出，那就别把钱吞掉，照旧记成收入
        add(buckets.fundIn, 'auction', FLOW_LABEL.auction, auctionBack.sum, '竞拍失败返还');
        const row = buckets.fundIn.get('auction');
        if (row) row.n = auctionBack.n;
      }
    }

    // 买入同样记净额：撤单 / 冰山退回的 cc 冲减买入支出
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

  /** 从日志的 Balance 字段还原每日余额曲线（同一天取最后一条） */
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

  /** 取资产走势点：优先日志还原的余额（覆盖所选天数），其次本地每日快照 */
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

  /** 迷你折线图（viewBox 拉伸铺满，线宽用 non-scaling-stroke 保持） */
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
      // 自然日窗口：自定义日期优先，否则今天 0 点往前 days-1 天 → 明天 0 点（= 最后一天的 24:00）
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
          // 自定义区间可能以「过去的某天」结束：比结束日还新的记录要跳过（不能 break，
          // 后面还有落在区间里的），否则选 11/05~11/07 也会把 11/08、11/09 算进来
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

  /** 一个来源一行：名称 · 占比条 · 数值 · 笔数。「其他」的明细只放在悬停提示里，保持行名简洁 */
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

  /** 一个象限：【标题 + 合计】+ 各来源明细 */
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

    /* ---- 资产卡 ---- */
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

    /* ---- 四象限分类 ---- */
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

    /* ---- 视角按钮态 ---- */
    els.segBtns.forEach((b) => b.classList.toggle('tgtk-on', b.dataset.view === view));

    els.logStat.textContent =
      `${logAll.length} 条记录` +
      (span ? ` · ${span}` : '') +
      (view === 'stock' ? ` · ${count} 个角色有股数变动` : '') +
      (isFixed ? ' · 固资数值按日志描述解析' : '');

    /* ---- 角色明细 ---- */
    els.logList.textContent = '';
    els.logList.hidden = view === 'fund';
    els.sortWrap.hidden = view !== 'stock';

    /* 圣殿视角：谁被道标打了，一共掉了多少固资 */
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


  /* ------------------------------ 界面 ------------------------------ */

  function line(label, ...nodes) {
    return h('div', { class: 'tgtk-line' }, h('span', { class: 'tgtk-label' }, label), ...nodes);
  }

  function input(id, value, attrs) {
    return h('input', {
      id,
      type: 'text',
      // 面板里同时存在 text / password 输入框时，Chrome 会把它们当成登录表单，
      // 把保存的 bangumi 账号填进第一个文本框。统一关掉自动填充并随机化 name，
      // 让所有输入框都不与常见登录字段名（username/email/password）重合。
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

    /* ---- 顶部标签 ---- */
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

    /* ---- 塔筛选 ---- */
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
    // 两个筛选条件各自一个勾选：不勾就不参与筛选，都不勾 = 显示全部。
    // （原来的「显示全部」开关删掉了，它和阈值的组合容易互相打架）
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

    // 我的塔模式下预填用户名；空着的时候也随时补（切页 / 清空过后回到本页）
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
      // 勾选在筛选项右边：不勾就不按这个条件筛
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
      // 用户名框移到「塔图」右边，左边加提示字样；原来的位置空出来（面板更紧凑）
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
        // 用户名整组往右靠，别让勾选框看起来像「用户名」的开关
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

    /* ---- 持股筛选 ---- */
    // 只查自己的持股（别人的持股数不公开），所以用户名框改成「按角色名 / ID 搜索」；
    // 和一键冲星一样带角色名联想，输中文名会弹候选，点一下自动换成角色 ID
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

    /* ---- 幻想乡 ---- */
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

    /* ---- 收藏 ---- */
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
    // 浏览器常把 bangumi 登录账号（QQ 邮箱等）自动填进这里：type=search 让 Chrome
    // 不再把它当登录用户名；配合无语义 name / off / 密码管理器忽略标记，再加内容级守卫。
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
    // 自动填充有时不触发 input 事件：animationstart 配合 :-webkit-autofill 守卫 +
    // 常驻轮询（在 boot 里挂）一起兜底。
    ['input', 'change', 'blur', 'animationstart'].forEach((ev) =>
      favAddInput.addEventListener(ev, () => clearFavAddAutofill()));
    const favAddBtn = h('button', { class: 'tgtk-btn', type: 'button' }, '添加');
    const favStat = h('div', { class: 'tgtk-stat' }, '收藏角色后，在这里看持股 / 固定资产 / 英灵殿');
    const favList = h('div', { class: 'tgtk-list' });

    // 收藏夹（全部同级、可自定义名称）
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

    // 跨设备同步
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
    // 导入新版小圣杯收藏：先自动扫同源 localStorage，扫不到再展开粘贴区
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
      // 收藏夹：下拉 + 三个操作收进同一行，右侧按钮组对齐
      h('div', { class: 'tgtk-line' },
        h('span', { class: 'tgtk-label' }, '收藏夹'), favFolderSel,
        h('span', { class: 'tgtk-spacer' }), bFolderNew, bFolderRename, bFolderDel),
      folderEdit,
      // 列表：排序 + 刷新 / 复制合并成一行，少一行视觉噪声
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

    /* ---- 道具：魔方 / 道标 ---- */
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
    // 目标行与上面的炮塔行用同一套 .tgtk-line 布局，输入框左边界才会对齐
    const mToWrap = h(
      'div',
      { class: 'tgtk-line tgtk-ctx', 'data-ctx': 'mto' },
      h('span', { class: 'tgtk-label' }, '目标'),
      mTo,
      mToFav
    );
    // 次数按道具分开记：切到哪种道具就显示哪种的次数，改一个不会连带改到别的
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

    /* ---- 一键冲星 ---- */
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
    // 每批固资自动取塔上限（不用手填），结束后按下面选的口径补回去。
    // 「补到 250」是给「只留 250 固资、避免被虚空道标打中」的玩法准备的。
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
    // 「一键冲星」按钮右边：按 1 股活股 ≈ 2 固资 = 2 星之力估算要烧多少活股。
    // 只是执行前的粗算，不扣塔内已有固资 / 不预测献祭轮次，实际以执行日志为准。
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
      // 每座塔：先烧塔里已有的固资，不够才献祭（1 股活股 = 2 固资）；
      // 收尾再按「结束补资」把塔补到目标值。所以股数取决于塔当前的固资，不能按上限瞎猜。
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
    // 防抖预读塔的固资：只读缓存里没有的角色，判到就重算
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
      // 每批自动取塔上限，所以原来的「单次」输入框没用了；腾出的位置放收尾补资口径
      line('结束补资', sEndWrap),
      h('div', { class: 'tgtk-line tgtk-chkline' }, h('label', { class: 'tgtk-chk' }, sFill, ' 固资不足时自动献祭补充')),
      h('div', { class: 'tgtk-line tgtk-actions' }, sRun, sEstimate, sStop),
      sStat,
      sLog
    );

    /* ---- 星光碎片 ---- */
    const sdTarget = input('tgtk-sdtarget', S.sdTarget || '', { placeholder: '目标角色 ID 或角色名（自己的塔）' });
    const sdTargetFav = favBtn();
    const sdQuery = input('tgtk-sdquery', S.sdQuery || '', { placeholder: '角色名 / ID，多个用空格隔开' });
    const sdQueryFav = favBtn();
    const sdLoad = h('button', { class: 'tgtk-btn', type: 'button' }, '读取持股');
    // 排序开关：多→少（默认，方便挑大燃料）/ 少→多（清小股）
    const sdSort = h(
      'button',
      { id: 'tgtk-sdsort', class: 'tgtk-btn tgtk-mini tgtk-sdsort', type: 'button', title: '切换燃料候选的排序' },
      '多→少'
    );
    // 只按等级过滤：填几就只看 Lv 几的角色，留空看全部
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
      // 燃料队列放在候选列表上面：选得多了队列会占好几行，放下面会把「选」按钮挤到很远
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

    /* ---- ICO ---- */
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

    /* ---- 圣殿（原「塔图」页：塔图相关的开关 + 个人圣殿页排版） ---- */
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

    /* ---- 个人页圣殿置顶：开关 + 加角色 + 顺序列表 ---- */
    const pinSwitch = h('button', { class: 'tgtk-pintoggle', type: 'button' });
    const pinAdd = input('tgtk-pinadd', '', { placeholder: '角色名 / ID，可多个' });
    const pinAddBtn = h('button', { class: 'tgtk-btn', type: 'button' }, '置顶');
    const pinStat = h('div', { class: 'tgtk-stat tgtk-pinstat' }, '');
    const pinListBox = h('div', { class: 'tgtk-pinlist' });

    /* ---- 名字 / ID → 角色（置顶、置底共用）----
     * 以前直接拿搜索结果第 1 条：输「白」搜出来第一条是「白穗」，于是置顶的是别人。
     * 现在先按「完全同名 > 前缀 > 包含」排，再在重名里优先挑「我有这座塔」的那个，
     * 最后还核一遍你到底有没有这座塔，没有就不加、并且明说，不再一声不响地失败。 */
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
        // 先在自己的圣殿队列里找（和候选浮层同一个数据源，只会有我建过塔的角色）。
        // 队列里确实没匹配、或队列整个读不到时，才退回全站搜索；
        // 后者挑出来的角色仍会走下面「你有没有这座塔」那一关，不会静默加进名单。
        const mine = templeSugItems(p);
        const items = mine && mine.length ? mine : await searchChara(p).catch(() => []);
        const it = pickCharaCandidate(items, p, owned);
        if (it) {
          ids.push(String(it.id));
          if (it.name) {
            nameOf[it.id] = it.name;
            // 就算最后因为「没塔」被拦下来，提示里也要能写出名字（而不是 #69）
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
          // 队列可能过期（5 分钟缓存 / 刚建成）：单独再查一次，别把有塔的误判成没塔
          const t = await findMyTemple(id).catch(() => null);
          if (t) {
            pinSnapSet(id, t);
            ok.push(id);
          } else noTower.push(id);
        } else ok.push(id);
      }
      return { ids: ok, noTower, miss, nameOf };
    };
    /** 没找到 / 没塔时的提示文案（名字优先，实在没有就 #ID） */
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

    /* ---- 个人页圣殿置底：平时收成一条，展开才是配置 ---- */
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
      // 名字没缓存就补一次（和置顶那边同一条通道）
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
      // 名字没缓存就补一次；补完只重排一次，别在渲染里再触发渲染（会无限打转）
      const todo = pins.filter((cid) => !pinNameGet(cid) && !pinNameTried[cid]);
      if (todo.length) {
        todo.forEach((cid) => (pinNameTried[cid] = 1));
        // always：这不是扫描流程，别被 loadNames 的 busy 守卫挡回来（不然永远显示 #id）
        loadNames(todo, false, { always: true })
          .then(() => {
            todo.forEach((cid) => {
              if (nameCache[cid]) pinNameSet(cid, nameCache[cid]);
            });
            if (pinUiRefresh) pinUiRefresh();
          })
          .catch(() => {});
      }
      // 快照缺失（添加那次读取失败 / 换设备同步来的名单）：静默补一次，
      // 补上之后列表有名字、个人页也能靠快照兜底排序
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
      // 一次可填多个：空格 / 逗号 / 顿号 / 分号分隔；数字当完整 ID，其它当角色名
      const r = await resolveAddList(raw, pinStat);
      if (!r.ids.length && !r.noTower.length) {
        pinStat.textContent = addTroubleText([], r.miss) || '没找到对应的角色';
        return;
      }
      // 名字先落盘（刷新后列表还显示名字，不会退回 #id）
      r.ids.forEach((cid) => {
        if (r.nameOf[cid]) pinNameSet(cid, r.nameOf[cid]);
        delete pinNameTried[cid];
      });
      // 只加不删：已经置顶的角色保持原顺序，不会被这一下点成「取消置顶」
      const added = [];
      r.ids.forEach((cid) => {
        if (pinHas(cid)) return;
        if (pinToggle(cid)) added.push(cid);
      });
      pinAdd.value = '';
      hideCharaSuggest();
      renderPinList();
      if (added.length) {
        // 没有快照就插不进个人页第 1 页，所以这里等一次数据再报成功
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
        // 从候选里点选的，名字当场就知道，直接记下来
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
    // 另一个标签页（旧版 / 新版）改了名单或列数：跟着刷新
    tuiUiRefresh = () => {
      syncCols();
      renderBotList();
      renderPinList();
    };

    /* ---- 增强：面板页已移除；功能常驻，圣殿尺寸开关改挂角色页 ---- */

    /* ---- 账本 ---- */
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
    // 自定义起止日：都是「含当天」，起点 0:00、终点 24:00
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

    /* ---- 随手记：点书本按钮，整个面板变成一张记事纸 ---- */
    const noteBtn = h(
      'button',
      { class: 'tgtk-ico tgtk-notebtn', type: 'button', title: '随手记（再点一下回到工具箱，Esc 也行）' },
      ''
    );
    // 线装小书：两页 + 书脊，跟标题栏其它图标一样吃 currentColor
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
      // 随手记
      titleEl,
      noteBtn,
      noteView,
      noteText,
      noteStat,
      tabbar,
      bodyEl,
      views: { temple: templeView, hold: holdView, fantasy: fantasyView, fav: favView, magic: magicView, ico: icoView, cover: coverView, log: logView },
      // 塔
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
      // 持股
      hSearch,
      lvMin,
      lvMax,
      minAmt,
      sortSel,
      hRun,
      hCopy,
      holdStat,
      holdList,
      // 幻想乡
      fInput,
      fInputFav,
      fRun,
      fStat,
      fList,
      // 收藏
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
      // 道具
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
      // 一键冲星
      sChar,
      sCharFav,
      sAmount,
      sEndModes,
      sFill,
      sRun,
      sStop,
      sStat,
      sLog,
      // 星光碎片
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
      // ICO
      icoLoad,
      icoStat,
      icoList,
      icoLog,
      // 账本
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

    /* ---- 交互 ---- */

    const syncTab = () => {
      hideCharaSuggest();
      hideFavPop();
      tabBtns.forEach((b) => b.classList.toggle('tgtk-on', b.dataset.tab === S.tab));
      Object.keys(els.views).forEach((k) => {
        els.views[k].hidden = k !== S.tab;
      });
      // 筛塔页：用户名空着就自动填自己（换页 / 清空过之后回来也会补上）
      if (S.tab === 'temple') ensureTempleUser();
      if (S.tab === 'fav') {
        clearFavAddAutofill();
        syncFavPick();
        // 面板重建 / 首次打开时列表还是空的（以前只有增删、刷新才画），这里补画一次
        if (els.favList && !els.favList.childElementCount) {
          renderFavs();
          setFavStatus(favCountText());
        }
      }
      // ICO 页第一次打开时自动读一次，省得每次都要点按钮
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

    /* ---- 收藏交互 ---- */
    favRun.addEventListener('click', refreshFavs);
    favCopy.addEventListener('click', () => copyFavs());

    /* ---- 清理已退市角色（手动点，两次确认，避免误删） ---- */
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
        // 同一角色可以进多个夹：只有「这个夹里已经有了」才拦
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
      // 先把行画出来（名字有缓存就直接显示），再逐个补数据。
      // 这几个角色的资料马上由 refreshOneFav 去读，别让 renderFavs 再给它们排一轮名字请求
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
      // 一次加多个时排着队补，别同时打出一串请求
      (async () => {
        for (const id of fresh) {
          try {
            await refreshOneFav(id);
          } catch (e) {}
        }
      })();
    });

    /* ---- 收藏夹管理 ---- */
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
    // 默认收藏夹不能删，所以那个位置的按钮改成「清空」：只移出夹里的角色，收藏夹本身留着
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

    /* ---- 跨设备同步 ---- */
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
      // 和「★ 收藏当前角色」一样，导入完自动补一次角色资料：
      // 不用再手动点「刷新全部」才显示名字 / 等级 / 现价 / 持股
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
      // 上市校验那次 chara/list 已经顺带拿到 Name，直接填进导入条目
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

    /* ---- 道具交互 ---- */
    const syncMagic = () => {
      hideCharaSuggest();
      hideFavPop();
      mModes.forEach((b) => b.classList.toggle('tgtk-on', b.dataset.magic === S.magic));
      const def = MAGIC_DEFS[S.magic];
      mToWrap.hidden = !def.needTarget;
      mFillMaxWrap.hidden = !S.mFill;
      mTip.textContent = def.tip;
      // 换道具 = 换一本次数（三种各存各的），顺带把当天的上限写进悬停提示
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
      // 只改当前这种道具的次数，另外两种不受影响
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
      // 留空 = 按缺口自动算股数；填数字 = 每轮固定烧这么多股
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

    /* ---- 一键冲星交互 ---- */
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

    /* ---- 星光碎片交互 ---- */
    sdTarget.addEventListener('input', () => {
      S.sdTarget = sdTarget.value;
      // 目标改了就先作废旧塔信息，免得「预计 +N」还按上一座塔算
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
      // 填了目标就顺手把候选股拉出来
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
      // 留空 = 全部等级；填 0 = 只筛 Lv0。两者必须区分开（以前 0 被 || '' 吃掉了）
      S.sdLevel = raw === '' ? '' : Math.max(0, Math.floor(num(raw)));
      persist();
      if (sdHold.length) renderFuel();
    });
    // 列表事件委托：全量渲染时不给每行单独挂监听器
    sdList.addEventListener('click', (e) => {
      // 点角色名是「打开角色页」，不要顺手把它选成燃料
      if (e.target && e.target.closest && e.target.closest('a')) return;
      const row = e.target && e.target.closest ? e.target.closest('.tgtk-sdrow') : null;
      const id = row && row.getAttribute('data-sdid');
      if (!id) return;
      // 已在队列里的必须能点「移出」，哪怕这一轮消耗完变成 0 活股
      const queued = sdQueue().indexOf(String(id)) >= 0;
      if (!queued) {
        // 0 活股的角色只用来「查得到」，选不了：多半是持股全挂了卖单
        const it = sdHold.find((x) => String(x.CharacterId) === String(id));
        if (it && num(it.UserAmount) <= 0) {
          setSdStatus(`「${it.Name || charaName(id)}」没有可用活股（全挂了卖单？），不能当燃料；点名字可打开角色页取消挂单`);
          return;
        }
      }
      pickFuel(id);
    });
    // 队列摘要上的 × / 清空：万一队列里有列表里看不到的历史 ID，也能随时取消
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

    /* ---- ICO 交互 ---- */
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
      // 用展开保留 cid / end / name，否则改一次目标等级就把计划元信息抹掉了
      S.icoCfg[id] = Object.assign({}, cfg, { lv: lv });
      persist();
      if (cfg.on) {
        pushIcoLog('info', `目标等级改为 Lv${lv}`);
        icoAutoCheck();
      }
      renderIco();
    });
    // 倒计时 + 自动注资判断：挂一次就够，切换标签页也会继续跑
    startIcoTicker();

    /* ---- 日志交互 ---- */
    lDays.addEventListener('change', () => {
      if (lDays.value === 'custom') {
        S.logDays = 'custom';
        // 第一次切到自定义：默认给「近 7 天」，用户再改日期
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

    /* ---- 角色名联想：ID 之外可以直接输角色名，右侧给候选 ---- */
    attachCharaSuggest(tChars, { append: true, noKeys: true });
    // 幻想乡：角色 ID 框也支持输数字弹 ID 候选（123 → 1234 / 12345 …）
    attachCharaSuggest(fInput, { append: true, noKeys: true, numId: true });
    // 道具页（混沌魔法 / 虚空道标 / 鲤鱼之眼）：炮塔、目标
    attachCharaSuggest(mFrom, { blur: true, numId: true });
    attachCharaSuggest(mTo, { blur: true, numId: true });
    // 一键冲星：可以填多个，候选只看正在输入的最后一段
    attachCharaSuggest(sChar, { append: true, numId: true });
    attachCharaSuggest(hSearch, { append: true, numId: true, noEnter: true });
    // 星光碎片：目标 + 燃料（燃料以前完全没挂联想，输数字 ID 和角色名都不弹）
    attachCharaSuggest(sdTarget, { blur: true, numId: true });
    attachCharaSuggest(sdQuery, { blur: true, numId: true, append: true });
    attachCharaSuggest(favAddInput, {
      noEnter: true,
      numId: true,
      // 多个 ID / 名字用空格隔开：候选只看「正在输入的最后一段」
      append: true,
      onPick: () => favAddBtn.click(),
    });

    /* ---- 收藏夹快选：输入框右边的小星星 ---- */
    bindFavPicker(mFromFav, mFrom);
    bindFavPicker(mToFav, mTo);
    bindFavPicker(sCharFav, sChar, { multi: true });
    bindFavPicker(hSearchFav, hSearch);
    bindFavPicker(sdTargetFav, sdTarget);
    bindFavPicker(sdQueryFav, sdQuery);
    bindFavPicker(fInputFav, fInput, { multi: true });

    /* ---- 随手记：书本按钮切换、输入自动存本机 ---- */
    // 用 DOM 状态判断当前在不在记笔记（面板被重建过也不至于要按两下）
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
      // 输入法正在组词（随手记里打字）时别抢按键
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
        // 胶囊被收起来时先放出来：Alt+T 是隐藏之后唯一的退路，不能连它都点不到
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
    // 面板重建（切页面 / iframe 重载）后，把上次填过的目标塔信息补读一次，
    // 否则「预计 +N 固资」要等用户再点一下目标框才出得来
    if (S.sdTarget && !sdTargetInfo) {
      try { refreshSdTarget(); } catch (e) {}
    }
    // 面板被重建（点角色导致 iframe 重载等）时，把已经读到的 ICO 列表补画回来
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
  /** 面板底部的小提示条（收藏成功这种），1.6 秒后自动淡出 */
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

  /* ------------------------------ 随手记 ------------------------------ */

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
  /** 写盘：随手记只存在本机 localStorage，不进同步码 / 云同步 */
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
  /** 工具箱 ⇄ 随手记：只换面板里的内容，标题栏（拖动 / 主题 / 关闭）都保留 */
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
  /** 浏览器密码管理器会把 bangumi 登录账号（QQ 邮箱等）自动填进「手动添加」，
   *  时机不定（刷新后、下拉选择后都可能），所以做内容级守卫：值像邮箱/网址就清掉。
   *  这个框只会输入角色 ID 或角色名，永远不会含 @，清空不会误伤用户输入。 */
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
  /* ---------------------------- 角色页星星收藏 ---------------------------- */
  /* 星星徽标要嵌进角色页 DOM；角色页常在 iframe 里，拿不到顶层文档注入的 CSS，
   * 所以自带一份只作用于 #tgtk-star 的样式，随按钮一起注入那个文档。 */
  const STAR_CSS = `
/* 星标用定位容器包住：容器占位不变（不会把标题行撑高），
   星标绝对定位填满左侧一格；旧版角色页再补一枚同尺寸的「$」紧贴在它右边，
   两个按钮永远并排、左边缘对齐，星星再多也不会被挤走。 */
#tgtk-starbox{
  position:relative;display:inline-block;flex:none;box-sizing:border-box;
  width:19px;height:19px;min-width:19px;margin:0 0 0 6px;vertical-align:middle;line-height:0}
/* 带「$」时两颗按钮并排，但容器宽度必须归零：
   42px 的 inline-block 会实打实占标题行宽度，行情数字一长（价格 / 持股 / 固资
   位数多）就把左侧 float 头像挤到上一行。容器 0 宽、两颗按钮绝对定位向右铺开，
   视觉位置与上一版完全一致，但标题行一点都不变宽。
   ☆ 从「K线图」右边缘 -4px 起（紧接其后），$ 跟在 +19px。 */
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
/* 旧版角色页补的「$」历史交易按钮：与星标同尺寸，贴在星标右侧 */
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

  /** 只有角色页才显示收藏星星。首页账户区 #grailBox2 也带 [id^="grailBox"]，
   *  单靠锚点选择器会误命中；这里用「新版星级行 / 旧版 chara{id} 交易框 / 角色页 URL」三重判据。 */
  /** 新版主页「通天塔」网格里，鼠标悬停会弹出一张缩略信息窗，窗内同样带
   *  #tg-star-level-icons 星级行。它 absolute + hidden/w-48，或落在 babel-tower
   *  网格里 —— 这些都不是角色详情页，收藏星星不能挂到缩略窗上去。 */
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
        // 主页缩略窗里也有 #tg-star-level-icons，必须排除，否则整页会被误判成角色页
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

  /** 这个角色是不是「ICO 进行中」：ICO 角色还没上市，没有 K 线也没有成交，
   *  收藏星标与历史交易按钮在这里没有意义，整段隐藏。
   *  旧版交易框会直接写出「ICO进行中 / 已筹集 / 下一等级还需要投入 / 参与者 N」，
   *  先用 DOM 判（零请求、立刻生效）；判不出来时再用一次 chara/{id} 兜底：
   *  返回里带 End 但没有 Level / ListedDate = 还在 ICO。 */
  const icoPageMemo = Object.create(null); // cid → true（ICO）/ false（已上市）
  let icoPageProbing = '';

  function icoByDom() {
    // 只认这三种一定不会出现在「已上市」交易框里的文案，避免误判把星标藏掉
    const re = /ICO\s*进行中|已筹集|下一等级还需/;
    for (const d of allDocs()) {
      try {
        for (const gb of d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox')) {
          if (!/(?:^|\s)chara(\d+)(?:\s|$)/.test(String(gb.className || ''))) continue;
          // 旧版交易框最有说服力：命中 ICO 文案就是 ICO，没命中就是已经上市了
          return re.test(String(gb.textContent || '').slice(0, 4000)) ? 'ico' : 'trade';
        }
        // 新版 React 交易框（DOM 结构不固定，用较宽的容器选择器兜一下）
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
    // 旧版交易框已经变成可交易状态 → 就算缓存里是 ICO，也说明它刚上市了
    if (dom === 'trade') return false;
    if (dom === 'ico') return true;
    if (cid && icoPageMemo[cid] === true) return true;
    if (cid && !(cid in icoPageMemo)) probeIcoPage(cid);
    return false;
  }

  /** 在角色页里找「星星数」所在的行，把收藏星星插到它右边。
   *  新版 tinygrail.com（小圣杯 2.0+）= #tg-star-level-icons（React 图标行）；
   *  旧版小圣杯（2.0 前，Bangumi 超合金组件）= #grailBox.chara{id}，
   *  jQuery 注入的 .title .info .text（徽章行 / 星级）/ .text_button 链接行。
   *  返回 { doc, parent, after, append }：append=true 表示追加到 parent 行内末尾。 */
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
      // 新版：优先挂在小圣杯自带的「收藏」按钮右边（用户指定位置），
      // 找不到才退回下面的星级图标行末尾。
      const favb = gxNewFavBtn(d);
      if (favb && favb.parentElement) {
        return { doc: d, parent: favb.parentElement, after: favb, append: false, fav: true };
      }
      // 新版：星级图标行，插到它右边
      for (const sel of newSels) {
        let el;
        try { el = d.querySelector(sel); } catch (e) { continue; }
        if (!el || !el.isConnected || !el.parentElement) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        return { doc: d, parent: el.parentElement, after: el, append: false };
      }
      // 旧版小圣杯：#grailBox.chara{id} 交易框。
      // 首页账户区是 #grailBox2.rakuen_home，必须排除，否则「[退出登录][股息预测]」
      // 那一行会被当成角色链接行，把星星标 append 到账户区。
      let box = null;
      try {
        for (const gb of d.querySelectorAll('#grailBox,[id^="grailBox"],.grailBox')) {
          if (gb.hasAttribute && gb.hasAttribute('data-tgtk-dup')) continue; // 被去重隐藏的副本
          if (/(?:^|\s)chara(\d+)(?:\s|$)/.test(String(gb.className || ''))) { box = gb; break; }
        }
      } catch (e) {}
      if (box && box.isConnected) {
        // ★ 首选锚点（用户指定）：「K线图」链接。
        //     旧版角色页的徽章行会随星星数量变长，星标跟在星星右边时会被一路挤到
        //     行末；「K线图」是标题行里位置固定的短链接，放它右边永远贴着标题，
        //     不会随星星数量漂移。新版 React 页面走上面的 newSels 分支，不受影响。
        try {
          let kline = null;
          for (const el of box.querySelectorAll('a,.text_button,span,em,b,i,button,div')) {
            if (el.id === 'tgtk-star' || !el.parentElement) continue;
            const t = String(el.textContent || '').trim();
            if (!/^\[?\s*K\s*线(?:图)?\s*\]?$/.test(t)) continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            // 取最外层的那个：星标必须落在 <a> 之外，否则点星标会顺带触发 K线图 跳转
            if (!kline || el.contains(kline)) kline = el;
          }
          if (kline) {
            return { doc: d, parent: kline.parentElement, after: kline, append: false, legacy: true, kline: true };
          }
        } catch (e) {}
        // (0) 次选锚点：「上市等级」。星星数多的角色徽章行很长，星星标会被挤到
        //     行末甚至换行（跑到右侧时间戳旁边）；「上市等级」是固定不变的一小段
        //     文字，放它右边最稳。兼容两种 DOM：独立的
        //     <span class="listed">上市等级：5</span>，或「评估价 / 发行价 / 上市等级」
        //     同处一行（上市等级是纯文本节点）。找不到时才回退到徽章行 / 链接行。
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
              // 短小独立元素（如「上市等级：5」）→ 插到它右边；
              // 较长的整行（含评估价 / 发行价）→ 追加到行内末尾，紧跟那段文字。
              const isRow = bestLen > 20 || best.children.length >= 2;
              if (isRow) {
                return { doc: d, parent: best, after: best.lastElementChild || best, append: true, legacy: true };
              }
              return { doc: d, parent: best.parentElement, after: best, append: false, legacy: true };
            }
          }
        } catch (e) {}
        // (a) 星形字符 / 星形图片：紧跟其后
        try {
          const cand = box.querySelectorAll('span,div,i,b,em,img');
          for (let i = 0; i < cand.length; i++) {
            const el = cand[i];
            if (el.id === 'tgtk-star' || !el.parentElement) continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height || r.width > 200) continue;
            const t = String(el.textContent || '').trim();
            // 纯星形行，或「😊⭐⭐⭐」这类混了一两个表情的短徽章串
            const isTxt = (starText.test(t) || (t.length <= 12 && starLoose.test(t))) && hasStar.test(t);
            const isImg = el.tagName === 'IMG' &&
              /star|level|rank/i.test((el.getAttribute('src') || '') + ' ' + (el.getAttribute('class') || ''));
            if (isTxt || isImg) return { doc: d, parent: el.parentElement, after: el, append: false, legacy: true };
          }
        } catch (e) {}
        // (b) 徽章行（含 .tag / .badge 的 .text）：星星通常在行末，追加到行内末尾
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
        // (c) 链接行（[关注角色] [K线图] … .text_button）：追加到行末
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
        // (d) 兜底：标题信息区
        try {
          const info = box.querySelector('.title .info,.title') || box;
          const r = info.getBoundingClientRect();
          if (r.width && r.height) {
            return { doc: d, parent: info, after: info.lastElementChild || info, append: true, legacy: true };
          }
        } catch (e) {}
      }
      // 通用兜底：页面里任意星形文本小容器（兼容其它老版主题 / 独立角色页）
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

  /** 新版「收藏」按钮若在纵向 flex 里，星标作为兄弟会掉到下一行；
   *  这时改成绝对定位贴到按钮右侧（只加一条定位样式，不动站点节点结构）。
   *  按钮外面常还包着一层 <div>，所以要往上找一两级看真正的 flex 容器。 */
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
      // Tailwind 的 `flex` 就是 display:flex（默认横向）
      if (cls.indexOf('flex') >= 0) return 'row';
      // 只有 display:flex 没有方向时，默认就是 row
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

  /* ---------- 旧版角色页：历史交易浮层 ---------- */

  /** 一次往回翻多少天；点「加载更早」就再往前推一段。 */
  const HIST_SPAN_DAYS = 120;

  function histFrom(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const p = (n) => String(n).padStart(2, '0');
    // 接口按「起始日 0 点（+08:00）」返回该日到现在的全部成交时段
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

  /** 角色历史交易浮层。
   *  小圣杯只对外提供「按成交时段聚合」的数据（chara/charts/{id}/{起始日}），
   *  每条含 开盘 / 收盘 / 最低 / 最高 / 数量 / 金额，正好拼成一张交易记录表。 */
  function openHistPop(anchor, cid) {
    hideHistPop();
    hideStarPop();
    hideFavPop();
    if (!cid) return;
    // 页面居中（与往期竞拍同一套「顶部钉住」规则）：列表变长只向下延伸，
    // 「加载更早」追加数据也不会把整块浮层推得上下跳。
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
    // 居中模式由 CSS 定位，不再按「$」按钮贴边展开
    // 名字缓存里没有就顺手拉一次，标题能直接显示角色名而不是 #ID
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
        // 均价 = 成交总额 / 股数，比单看收盘价更能反映这批成交的真实价位
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
          // 再往前翻也没有新记录：这个角色已经到最早一笔了
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
      // 追加数据后不再重算贴边位置：浮层顶部固定，列表往下长就行
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
    // 先只记选择，不动收藏数据；确定时才一次性提交
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
        // 只有新加了才去补数据，而且只补这一个角色；纯取消收藏不用发请求
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
      // 非角色页（首页、塔列表、幻想乡…）一律不显示收藏星星，
      // 连右下角兜底圆标也不显示，避免首页「股息预测」旁边多出来一颗星。
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
      // ICO 进行中的角色还没上市：没有 K 线、没有成交，收藏与历史交易都用不上，
      // 两个按钮整段隐藏（等它上市后 DOM 一变化就会自动挂回来）。
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
      // 找到的锚点若落在主页缩略信息窗（hover card）里，也不能挂星星：
      // 新版通天塔网格的浮层里同样有星级图标行，只有当前悬停的那一张可见，
      // 于是会出现「只有某一个角色的缩略窗里冒出一颗收藏星」。
      const inHoverCard = !!anchor &&
        (isHoverCardNode(anchor.after) || isHoverCardNode(anchor.parent));
      // 找不到锚点 = 这不是角色页（或角色页还没渲染完）。
      // 以前这里会退化成挂在页面右下角的固定圆标，结果新版小圣杯主页右下角
      // 多出一颗星；现在改为直接隐藏/移除，角色页一渲染出锚点就会重新挂上。
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
        // 旧版角色页的标题行可能挂着 jQuery 点击委托，星标挨着 K线图 时
        // 必须掐断冒泡，否则点星标会顺带跳去 K线图 页面。
        starBadge.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openStarPop(starBadge);
        });
      }
      ensureStarStyle(anchor.doc);
      if (!starBox) starBox = h('span', { id: 'tgtk-starbox' });
      // 角色切换 / React 重渲染 / 旧版 jQuery 换框会换掉锚点，按钮跟着重新挂到锚点右边
      const sameAnchor = starAnchorAfter && starAnchorAfter.isConnected &&
        starAnchorAfter === (anchor.append ? anchor.parent : anchor.after);
      if (!starBox.isConnected || starBox.parentElement !== anchor.parent || !sameAnchor) {
        if (starBox.isConnected) starBox.remove();
        // 星标装进定位容器里：容器占位跟原来的按钮一样，
        // 「$」历史交易按钮就能绝对定位到它右侧，星星再多也挤不掉。
        if (anchor.append) {
          anchor.parent.appendChild(starBox);
        } else {
          const ref = anchor.after.nextSibling;
          if (ref) anchor.parent.insertBefore(starBox, ref);
          else anchor.parent.appendChild(starBox);
        }
      }
      // append 模式记父容器（星星标被追加进去，行末元素会变成它自己）
      starAnchorAfter = anchor.append ? anchor.parent : anchor.after;
      starBesideFav(starBox, anchor.fav ? anchor.after : null);
      if (starBadge.parentElement !== starBox) starBox.appendChild(starBadge);
      starBadge.className = 'tgtk-star tgtk-star-inline';
      starBadge.hidden = false;
      // 旧版 jQuery 换框 / DOM 克隆可能留下旧的星标副本，只保留当前这一枚，
      // 避免页面上出现两颗收藏星星。
      for (const d of allDocs()) {
        try {
          d.querySelectorAll('#tgtk-starbox').forEach((x) => { if (x !== starBox) x.remove(); });
        } catch (e) {}
      }
      starBadge.dataset.theme = S.theme === 'light' ? 'light' : 'dark';
      // 旧版角色页没有「历史交易」入口，在星标右边补一枚同尺寸的「$」；
      // 新版 React 页面自带这个入口，不挂。
      // 容器宽度跟着有没有「$」切换：有就加宽一格，两个按钮并排。
      starBox.classList.toggle('tgtk-has-hist', !!anchor.legacy);
      if (anchor.legacy) {
        if (!histBtn) {
          histBtn = h('button', { id: 'tgtk-hist', class: 'tgtk-hist tgtk-hist-inline', type: 'button' }, '$');
          // 标题行常挂着 jQuery 点击委托（换角色、跳 K线图），别让点「$」顺带触发父级
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
      // 新版弹窗换角色时，面板里「当前角色」也要立刻跟着换（不等用户切页签）
      if (els && id && id !== lastFavPickId) {
        lastFavPickId = id;
        syncFavPick();
      }
      refreshStarBadge();
    };
    ensure();
    starTimer = setInterval(ensure, 900);
    // SPA / hash 路由切角色时立刻刷新，不等定时器，避免星星状态滞后
    if (!starListenersBound) {
      starListenersBound = true;
      WINS.forEach((w) => {
        try {
          w.addEventListener('hashchange', ensure);
          w.addEventListener('popstate', ensure);
        } catch (e) {}
      });
      // 旧版小圣杯（jQuery）点 DD 列表换角色只重建 #grailBox、不发任何路由事件，
      // 用 MutationObserver 盯着角色框，变化时立刻重挂星星标并刷新点亮状态。
      // 只在「角色变了 / 星星标被重建弄丢」时才 ensure，避免自身渲染触发无限回调。
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
        // iframe 后期才加载出来：定时补挂观察
        setInterval(() => allDocs().forEach(observeDoc), 3000);
      }
    }
  }

  /* ---------------------- 旧版小圣杯页面增强 ---------------------- */
  /* 主体只对旧版（bgm.tv 里由 jQuery 注入的 #grailBox.chara{id}）生效；
     「圣殿尺寸」会顺带在新版 React 页面按结构找圣殿网格（新版类名未知，只做兜底）。 */
  const GRAILX_CSS = `
/* 旧版通天塔日志：按新版 chara/star/log 重画（Type 5 = 冲星成功 +数量 ★）
   主题变量必须在 .tgtk-starlog 上自己定义一份：工具箱原本只把 --tg-* 挂在
   #tgtk-panel / 浮层等节点上，日志面板不在其中，var() 取不到值 → 背景透明、
   吸底分页条会和最后一行日志叠字。 */
.tgtk-starlog{--tg-bg:#fff;--tg-sunken2:#f4eff3;--tg-surface:#f4eef2;
  --tg-line:rgba(96,64,84,.28);--tg-line-soft:rgba(96,64,84,.12);
  --tg-fg:#332b31;--tg-fg2:#4a4046;--tg-mute:#9b8d97}
html[data-theme="dark"] .tgtk-starlog{--tg-bg:#20242e;--tg-sunken2:#1b1f27;--tg-surface:#262b36;
  --tg-line:#3b4150;--tg-line-soft:rgba(255,255,255,.07);
  --tg-fg:#e6e8ee;--tg-fg2:#cfd4df;--tg-mute:#727b8d}
/* 站点 signalR 推来的旧格式条目先藏掉（tick 里也会清），避免换页前闪一下错误文案 */
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
/* 前 500 名：#排名 与 ✦星之力 合成一枚深色徽章（旧版 .badge.starforce.ranked
   是 #673ab7→#9c27b0 渐变，其余名次照新版用 #757575 深灰），一律白字 */
.tgtk-slog-badge{flex:none;display:inline-flex;align-items:center;gap:5px;
  font-size:10px;font-weight:600;line-height:1.6;padding:0 6px;border-radius:5px;
  background:#757575;color:#fff;white-space:nowrap;text-shadow:0 1px 1px rgba(0,0,0,.22)}
.tgtk-slog-badge.ranked{background:linear-gradient(45deg,#673ab7,#9c27b0)}
.tgtk-slog-bsep{width:1px;height:10px;background:rgba(255,255,255,.45)}
.tgtk-slog-up{color:#ffa7cc;font-size:10px;flex:none}
.tgtk-slog-down{color:#a7e3ff;font-size:10px;flex:none}
/* 用户名单独占一段并省略，数量 / 动词 / 时间始终完整显示 */
.tgtk-slog-act{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:5px;
  color:#d4568e;white-space:nowrap}
.tgtk-slog-user{flex:0 1 auto;min-width:0;max-width:120px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.tgtk-slog-amt{flex:none;white-space:nowrap}
.tgtk-slog-act.bad{color:#4a90e2}
.tgtk-slog-star{color:#e8b93a;flex:none}
.tgtk-slog-time{flex:none;color:var(--tg-mute);font-size:10px}
/* 旧版日志区是固定高度的滚动容器，分页条吸底才不用滚到底翻页 */
.tgtk-slog-pager{display:flex;align-items:center;justify-content:center;gap:8px;
  padding:8px 0 4px;font-size:11px;color:var(--tg-mute);
  position:sticky;bottom:0;z-index:1;background:var(--tg-bg)}
.tgtk-slog-pager button{font:inherit;padding:2px 8px;border:1px solid var(--tg-line);
  border-radius:5px;background:var(--tg-surface);color:var(--tg-fg2);cursor:pointer}
.tgtk-slog-pager button:disabled{opacity:.4;cursor:default}
.tgtk-slog-empty{padding:14px 4px;text-align:center;color:var(--tg-mute);font-size:11px}
/* 角色页内嵌的「圣殿尺寸」下拉（工具箱「增强」页已删，开关搬到角色页） */
.tgtk-gxsize-inline{
  box-sizing:border-box;display:inline-block;vertical-align:middle;flex:none;
  min-width:56px;font-family:inherit;font-size:12px;line-height:1.4;
  color:var(--tg-fg2);background:var(--tg-surface);
  border:1px solid var(--tg-line);border-radius:6px;
  padding:2px 4px;margin:0 6px;cursor:pointer;outline:none;
  -webkit-appearance:auto;appearance:auto}
.tgtk-gxsize-inline:hover{border-color:var(--tg-accent);color:var(--tg-accent-fg)}
.tgtk-gxsize-inline option{background:var(--tg-surface);color:var(--tg-fg)}
/* 新版：圣殿表头里、右侧「筛选」框左边；margin-left:auto 让它贴着筛选框 */
.tgtk-gxsize-inline.tgtk-gxsize-new{align-self:center;height:26px;margin:0 8px 0 auto;padding:0 6px}
/* 旧版：紧跟「[显示全部]」链接，与链接同一基线 */
.tgtk-gxsize-inline.tgtk-gxsize-old{height:20px;font-size:11px;line-height:1.2;
  padding:0 2px;margin:0 0 0 6px;border-radius:4px}
/* 角色页标题行的拍卖信息：蓝=竞拍人数/已拍股数，粉=我的出价/我的股数 */
.tgtk-gx-auction{display:inline-flex;align-items:center;gap:8px;margin:0 7px 0 3px;
  font-size:13px;line-height:1.6;font-variant-numeric:tabular-nums;vertical-align:middle;white-space:nowrap;
  position:relative;top:2px}
.tgtk-gx-auction[hidden]{display:none}
.tgtk-gx-auction .tgtk-gx-users{color:#4a90e2}
.tgtk-gx-auction .tgtk-gx-mine{color:#e0699b}
/* 新版：直接跟在「交易记录」按钮后面，去掉旧版为了贴标题行加的位移 */
.tgtk-gx-nauc{top:0;margin:0 2px 0 6px;font-size:12px;font-family:inherit;font-weight:600;
  line-height:1.5;min-height:22px;letter-spacing:0}
.tgtk-gx-nauc .tgtk-gx-wait{color:var(--tg-mute);font-size:11px;font-weight:400}
/* 各级圣殿数量：(3级 + 2级 + 1级)，紧跟固定资产数字后面 */
.tgtk-gx-temples{color:#a99ba6}
/* 新版：字数跟在「固定资产 …」后面，字体 / 字号 / 颜色全部继承原来那一行 */
.tgtk-gx-temples-n{color:inherit;font:inherit;white-space:nowrap}
/* 新版「拍卖信息」浮层：一行一个键值 */
.tgtk-gxkv{display:flex;flex-direction:column;gap:5px;padding:2px 2px 6px;font-size:12px}
.tgtk-gxkvrow{display:flex;align-items:baseline;justify-content:space-between;gap:18px;color:var(--tg-dim)}
.tgtk-gxkvrow b{color:var(--tg-fg);font-weight:600;font-variant-numeric:tabular-nums}
.tgtk-gxkvnote{padding-top:2px;color:var(--tg-mute);font-size:11px}
/* 自己的圣殿：只把名字染粉，不加框不加角标 */
#lastTemples .item.tgtk-my-temple .name a{color:#d4568e;font-weight:600}
/* 圣殿尺寸：缩放后整体居中（旧版 #lastTemples） */
#grailBox #lastTemples{text-align:center}
#lastTemples .item{text-align:left}
/* 「小」= 一行正好 7 个：不再整体 zoom，改成按比例算每格宽度，摆多少都是 7 个一行 */
#grailBox.tgtk-gx-sz-s #lastTemples{display:flex !important;flex-wrap:wrap !important;gap:6px !important;
  zoom:1;margin-left:0;margin-right:0;justify-content:flex-start}
#grailBox.tgtk-gx-sz-s #lastTemples .item{flex:0 0 calc((100% - 36px) / 7) !important;
  width:calc((100% - 36px) / 7) !important;margin:0 !important;float:none !important;box-sizing:border-box}
#grailBox.tgtk-gx-sz-s #lastTemples .item img{max-width:100% !important;height:auto !important}
#grailBox.tgtk-gx-sz-s #lastTemples .item > *{max-width:100% !important;box-sizing:border-box}
#grailBox.tgtk-gx-sz-l #lastTemples{zoom:1.15}
/* 圣殿尺寸：新版 React 页面（容器由 JS 打 data 标记）
   「小」不再整体缩放，而是强制一行 6 个 —— 格子变窄，塔图自然变小，且不会左偏 */
[data-tgtk-templesz="s"]{display:grid !important;grid-template-columns:repeat(6,minmax(0,1fr)) !important;
  justify-items:center;gap:6px !important;margin-left:0;margin-right:0;zoom:1}
[data-tgtk-templesz="l"]{zoom:1.15;justify-content:center}
/* 个人主页：折叠 / 展开按钮 */
#grail .tgtk-foldbtn{float:right;margin-right:4px;line-height:1.7}
#grail .tgtk-foldbtn a{color:#d4568e;cursor:pointer;text-decoration:none}
#grail .tgtk-foldbtn a:hover{text-decoration:underline}
.tgtk-grail-hidden{display:none !important}
/* 萌王榜：鼠标悬停才显示的综合信息卡（旧版 #topWeek / 新版 React 卡片都走 .tgtk-gx-card） */
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
/* 竞拍 / 往期竞拍浮层 */
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
/* 取消竞拍：粉底白字 */
#tgtk-gxpop .tgtk-gxcancel{background:#e0699b;border-color:#e0699b;color:#fff}
#tgtk-gxpop .tgtk-gxcancel:hover{background:#d4568e;border-color:#d4568e;color:#fff}
/* ============ 塔图工具箱：裁剪 / 复制 / 修改他人塔图 ============ */
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
/* 站点对 #grailBox / #TB_window 里的 <button> 有一条硬规则
   （min-width:80px; height:32px; padding:0 10px; border:none），优先级比类名高，
   不压回去的话我们的小图标按钮会被拉成一根 80×32 的长条。 */
.tgtk-tbtn{height:22px !important;min-width:34px !important;padding:0 8px !important;
  border-width:1px !important;border-style:solid !important;font-size:11px !important;line-height:1 !important}
.tgtk-tbtn.tgtk-ticon{width:22px !important;min-width:22px !important;height:22px !important;padding:2px !important}
.tgtk-tbtn.tgtk-ticon svg{width:15px !important;height:15px !important}
/* 旧版塔图操作行：跟换序键同一套尺寸（22px 图标），只在行内留一点间距 */
.tgtk-ttoolbar.tgtk-oldmini .tgtk-tbtn{margin:0 2px}
.tgtk-ttoolbar.tgtk-oldmini{display:inline-flex;align-items:center;gap:2px;margin:0 2px;vertical-align:middle}
/* 旧版操作行是 flex-wrap：按钮只有 22px，会「见缝插针」挤在上一行末尾。
   插一个 0 高度的断行元素，强制裁剪键落到 [闪光结晶] 所在的这一行、并且紧贴它左边。 */
.tgtk-brk{display:block;flex:0 0 100%;width:100%;height:0;margin:0;padding:0;border:0}
html[data-theme="dark"] .tgtk-tbtn{background:rgba(38,43,54,.92);color:#ffb3cf;border-color:rgba(255,179,207,.5)}
html[data-theme="dark"] .tgtk-tbtn:hover{background:#d4568e;color:#fff}
/* 新版「点别人塔图」的纯图片弹窗没有信息行：工具条浮在塔图右下，与资产数字齐平 */
.tgtk-ttoolbar.tgtk-tfloat{position:absolute;right:10px;bottom:12px;z-index:5;margin:0;
  flex-direction:column;align-items:flex-end;gap:5px;padding:6px;border-radius:8px;
  background:rgba(255,255,255,.86);box-shadow:0 4px 16px rgba(0,0,0,.18)}
html[data-theme="dark"] .tgtk-ttoolbar.tgtk-tfloat{background:rgba(32,36,46,.9)}
/* ============ LINK 圣殿：换序 / 无缝拼接 / LINK 图裁剪 ============ */
/* 换序按钮：沿用「自由裁剪」那套小图标按钮的尺寸与描边，只额外贴到卡片右下角 */
.tgtk-swapbtn{position:absolute;right:0;bottom:0;z-index:6;margin:0}
.tgtk-linkwrap{position:relative}
/* ===== 无缝 link 图（可在工具箱「圣殿」页关掉） =====
   站点左右两半都是 skewX(-10deg) 的平行四边形（左 origin 左上、右 origin 右下），
   两条斜边平行却整体错开 H*tan10°（432 尺寸约 6.2px），中间露出的就是卡片白底；
   斜切还会把每半画面切掉一个三角形（底部最多 58px），被切掉的像素不在任何一半里，
   所以「平移 / 加宽 / 补边」都补不回来（只会错位、重缩放或留白）。
   真实几何：左半 240 宽在 x=0 + 右半 240 宽在 x=188（重叠 54），合起来 432×320。
   去掉斜切后要铺满整张卡，两半各显示 56.25%、右半从 43.75% 起（重叠仍是 12.5%）：
   左 0~243、右 189~432。整套用百分比表达，三种尺寸（432/220/195）共用一套规则。
   选择器统一带 html.tgtk-seamless：开关一关整段失效，页面回到小圣杯原版（斜切）。 */
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
/* 新版（Tailwind 结构）同一套改法。
   注意：不要用 #tg-temple-link>div[class*="w-[214px]"] 这种选择器——角色名那一行
   同样带 w-[214px] / w-[188px]，会被一起改高，卡片里就会空出一大块（v48 的坑）。 */
html.tgtk-seamless #tg-temple-link-left,
html.tgtk-seamless #tg-temple-link-right{transform:none !important}
html.tgtk-seamless #tg-temple-link-left{width:56.25% !important}
html.tgtk-seamless #tg-temple-link-right{left:43.75% !important;width:56.25% !important}
html.tgtk-seamless #tg-temple-link-left>div,
html.tgtk-seamless #tg-temple-link-right>div{
  transform:none !important;width:100% !important;
  box-sizing:border-box !important;
  background-size:100% 100% !important;background-position:top center !important}
/* 接缝羽化：两张图各自 JPEG 编码，边缘会有 1~2px 的色度错位（看起来像一道细线）。
   右半左缘 2px 淡入，底下正好是重叠区里同一段画面，接缝就彻底看不见了。 */
html.tgtk-seamless .chara_link .right .container,
html.tgtk-seamless #tg-temple-link-right>div{
  -webkit-mask-image:linear-gradient(to right,rgba(0,0,0,0) 0,rgba(0,0,0,1) 2px);
  mask-image:linear-gradient(to right,rgba(0,0,0,0) 0,rgba(0,0,0,1) 2px)}
/* LINK 裁剪浮窗：本塔用左半 / 右半 + 另一半给 LINK 圣殿 */
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
/* 旧版：固定资产大于上限时，绿条只显示到 100%，不再捅出弹窗 */
#TB_window.temple .progress{overflow:hidden}
#TB_window.temple .progress .value{max-width:100% !important}
/* 裁剪浮层：自己带一套主题变量，不依赖工具箱面板 */
.tgtk-crop{position:fixed;left:0;right:0;top:0;bottom:0;z-index:2147483647;
  display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);
  font:13px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#332b31}
/* 浮层及其内部永远接收指针事件：防止被 body/祖先的 pointer-events:none 继承禁用 */
.tgtk-crop,.tgtk-crop *{pointer-events:auto !important}
/* 浮层用原生 <dialog>.showModal() 打开：进入浏览器 top layer，
   既压得住站点的 dialog#tg-modal（daisyUI .modal），又不会因为「模态对话框使外部 inert」而点不动 */
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
/* ============ v51：旧版个人页排版 / ICO 增强 / 股息预测 ============ */
/* 旧版个人 LINK 页：一行 3 个、右边空一大截 → 整行居中 */
#grail .link_list .grail_list{justify-content:center !important}
/* 新版个人圣殿页：一行 4 / 5 / 6 个（工具箱「圣殿」页控制）。
   站点用 ResizeObserver 写内联 grid-template-columns，只有 !important 压得住；
   minmax(0,1fr) 防止卡片里的长名字把格子撑宽。
   主力是下面那条结构选择器（:has）：站点每次重绘都会换掉节点，靠 JS 打 data 标记的话，
   新节点要等下一轮 tick 才带上，中间那一拍先按站点自己的列数排、再跳回来——
   打开 / 关掉塔图时闪的那一下就是这么来的。:has 让新节点一挂上就命中，同一帧生效。
   两条规则必须分开写：不支持 :has 的浏览器会把整条规则连同它一起丢掉，
   写在同一条里连 [data-tgtk-tcols] 这个兜底也没了。 */
#tg-user-tinygrail div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col),
#tg-modal div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col),
[id^="tg-trade-box"] div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col),
[id^="tg-character"] div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col),
#tinygrail div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col){
  grid-template-columns:repeat(var(--tgtk-tcols,4),minmax(0,1fr)) !important}
[data-tgtk-tcols]{grid-template-columns:repeat(var(--tgtk-tcols,4),minmax(0,1fr)) !important}
/* 角色页「圣殿尺寸：小」= 一行 6 个。class 挂在 <html> 上（React 换不掉），
   同样用结构选择器：点塔图再关闭时节点被整体重绘也不会闪回默认列数。 */
html.tgtk-gx-size-s div.grid.w-full.gap-4:has(> :first-child.min-w-0.flex-col){
  grid-template-columns:repeat(6,minmax(0,1fr)) !important}
/* 角色页圣殿网格：id 偶尔会换，靠「直接子节点是塔卡（data-user-name）」认，
   这样 React 换掉整个列表的那一帧也能立刻按 6 列排，不会先闪一下 4/5 列 */
html.tgtk-gx-size-s [id^="tg-trade-box-temple"]:has(> [data-user-name]){
  display:grid !important;grid-template-columns:repeat(6,minmax(0,1fr)) !important;
  justify-items:center;gap:6px !important;margin-left:0;margin-right:0;zoom:1}
/* 旧版 ICO「下一级」：仿新版的小号描边胶囊，摆在「追加注资请在下方输入金额」右边 */
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
/* ICO 注资金额：鼠标移上去换成「+N股」（提示这是可悬停的） */
[data-tgtk-shares]{cursor:help}
/* 旧版「[股息预测]」弹窗：照新版做成环形图 + 明细 */
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

  /** 无缝 link 图：class 挂在 <html> 上，CSS 用 html.tgtk-seamless 前缀；
   *  开关一关整段失效，页面完全回到小圣杯原版（斜切）。 */
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

  /** 新版个人圣殿页：一行显示几个（工具箱「圣殿」页的 4 / 5 / 6）。
   *  站点 TemplesTab 自己的 ResizeObserver 会往网格上写内联 grid-template-columns，
   *  所以只能给它打标记、由样式表用 !important + CSS 变量压回去。 */
  function templeColsFor(doc) {
    try {
      const el = doc && doc.documentElement;
      if (!el) return;
      const n = TUI.cols;
      if (el.style.getPropertyValue('--tgtk-tcols') !== String(n)) {
        el.style.setProperty('--tgtk-tcols', String(n));
      }
      // 只认「圣殿」网格：class 是 grid w-full gap-4，每格是 flex w-full min-w-0 flex-col gap-1
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
      // gxStyle 里会顺带把 --tgtk-tcols 补上；这里再直接跑一遍，保证点开关时立刻生效
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

  /** 和 api() 一样，但 State !== 0 不抛错：有些接口「今天已签到」时会返回非 0，还需要读 Value */
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

  /** 结构签名：只看框的个数 / 角色 / 准备态 / 父容器。
   *  行情数字每秒都在刷新，绝不能进签名，否则永远等不到稳定期。 */
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

  /** 旧版插件偶尔把角色交易框重复注入 1~2 次（相册 / 出演 / 关联角色之后又一份）。
   *  处理原则（都是为了不跟插件的渲染节奏打架）：
   *   1. 结构稳定 1.5 秒后才动手；结构一变就先「全部显示」再重新计时 —— 初始化、
   *      点「开启交易」换框期间不做任何隐藏，页面不会来回闪。
   *   2. 带「开启交易」的是准备态，点它会换成正式框，绝不参与去重、也绝不隐藏。
   *   3. 按结构签名分组，同组里保留页面最靠上的一份并锁定，其余才隐藏。
   *   4. 插件若反复重建框（10 秒内结构变 6 次以上）就本页放弃去重，宁可重复也不闪。
   *   5. 隐藏用行内 display 而不是删节点，不破坏插件自己的事件与状态；只写变化。 */
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
        // 首页账户区 #grailBox2.rakuen_home 不是角色交易框
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
      // 结构还在变：先把所有框恢复显示，再重新等稳定期
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

  /** 找旧版角色框；顺便带出角色 id（被去重隐藏的副本要跳过） */
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

  /** 竞拍 / 往期竞拍共用的浮层外壳。
   *  opts.center        = 页面居中的大弹窗（820px，股权拍卖专用）
   *  opts.centerCompact = 水平居中 + 顶部固定（表头不随数据变高而位移）、
   *                       仍保持 432px 紧凑尺寸（往期拍卖用）
   *  opts.wide          = 股权拍卖的输入行版式
   *  opts.extra         = 标题栏右侧、关闭按钮左边的按钮 */
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
    // 两种居中模式都靠 CSS 定位，不用贴按钮的 positionHistPop
    if (!opt.center && !opt.centerCompact) {
      try {
        positionHistPop(pop, anchor);
      } catch (e) {}
    }
    return pop;
  }

  /**
   * 拉角色页增强所需数据：
   *  - base ：可拍卖信息（底价 / 本轮拍卖总量）来自 chara/user/{id}/tinygrail/false
   *  - bid  ：本周竞拍（竞拍人数 State / 已拍股数 Type / 我的出价 Price / 我的股数 Amount）
   *  - temples：全部圣殿（按 Level 统计各级数量）
   */
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
      // 本周竞拍：[{ State: 竞拍人数, Type: 已拍股数, Price/Amount: 我的 }]
      const v = await api('chara/auction/list', { method: 'POST', body: JSON.stringify([Number(cid)]) });
      const arr = Array.isArray(v) ? v : (v && v.Items) || [];
      const row = arr[0] || null;
      out.bid = row
        ? { users: num(row.State), filled: num(row.Type), price: num(row.Price), amount: num(row.Amount) }
        : { users: 0, filled: 0, price: 0, amount: 0 };
    } catch (e) {}
    try {
      // 旧版圣殿列表本来就不显示 LINK 塔：这里不能并 chara/links，
      // 否则「各级圣殿数量」会比页面上看到的塔多出一截。
      const v = await api(`chara/temple/${cid}`);
      out.temples = Array.isArray(v) ? v : (v && v.Items) || [];
    } catch (e) {}
    GX.cache[cid] = out;
    if (GX.busy === cid) GX.busy = '';
    return out;
  }

  /** 圣殿等级只看「固定资产上限」：上限 500 = 1 级，2500 = 2 级，12500 = 3 级。
   *  接口里的 Level 是按「当前固资」算的（塔没补满时会低报一级，比如上限 2500、
   *  当前只有 487 会返回 Lv1），直接拿来统计各级圣殿数量就会错。
   *  上限异常（0）时才退回 Level。 */
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

  /** 新版角色页的完整圣殿列表。
   *  chara/temple/{cid} 不返回已 LINK 的圣殿（它们挂在 chara/links/{cid} 里，
   *  每条同时带本塔与对端 Link 的完整数据）；版面上这些塔在「LINK 圣殿」和
   *  下面的「圣殿」网格里各出现一次，但统计只能算一座 —— 这里按 Id 去重后
   *  并成一份，正好等于圣殿网格里的塔数。旧版页面不用这个函数（旧版不显示 LINK 塔）。 */
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

  /** 把「#70888 -「八寻宁宁」 ₵888.00 / 136,049 / …」这种整行文本洗成纯角色名 */
  function gxCleanName(raw) {
    let t = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    // 有「」就取引号里的，最稳
    const m = t.match(/「([^」]{1,60})」/);
    if (m) return m[1].trim();
    t = t.replace(/^#?\d+\s*[-–—]?\s*/, '');
    t = t.split('₵')[0].split('[')[0];
    t = t.split(/\s\/\s/)[0];
    return t.trim();
  }

  /** 角色名：名字缓存里没有时退回读页面，别把行情那一串也带上 */
  function gxName(cid) {
    const cached = gxCleanName(nameCache[cid] || '');
    if (cached && !/^#?\d+$/.test(cached)) return cached;
    try {
      const rec = gxBox();
      if (rec) {
        const a = rec.box.querySelector('.title .name a') || rec.box.querySelector('.title a[href^="/character/"]');
        let clean = gxCleanName(a ? a.textContent : '');
        if (!clean || /^#?\d+$/.test(clean)) {
          // 名字那一行常把「#id -「名字」 ₵价格 / 总量 …」全塞在一个元素里
          const t = rec.box.querySelector('.title');
          clean = gxCleanName(t ? t.textContent : '');
        }
        if (clean && !/^#?\d+$/.test(clean)) return clean;
      }
      // 新版页面没有 #grailBox，从交易框顶部的角色链接里取
      const nb = gxNewBox();
      if (nb) {
        const a = nb.box.querySelector('a[href*="/character/"]');
        const clean = gxCleanName(a ? a.textContent : '');
        if (clean && !/^#?\d+$/.test(clean)) return clean;
      }
    } catch (e) {}
    return '';
  }

  /** 弹窗标题里的角色标签：八寻宁宁 -「#70888」 */
  function gxCharLabel(cid) {
    const n = gxName(cid);
    return n ? `${n} -「#${cid}」` : `「#${cid}」`;
  }

  /** 收起/展开星标 & 拍卖信息要用到的「锚点」：优先「上期公示」按钮 */
  function gxAuctionAnchor(box) {
    return box.querySelector('#auctionHistoryButton') ||
      box.querySelector('#auctionButton') ||
      box.querySelector('#buildButton');
  }

  /** 标题行里的拍卖信息（蓝=人数/已拍，粉=我的出价/股数，没参与就不显示粉） */
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
    // 站点重绘会把节点挪走 / 换掉，位置不对就重新插到按钮前面
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
      // 自己没参与拍卖就不显示粉色那一段
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

  /** 在「固定资产 N」后面找一个插入点（N 之后的那个位置） */
  function gxTempleSlot(bold) {
    const kids = bold.childNodes;
    let seen = false;
    for (let i = 0; i < kids.length; i++) {
      const t = String(kids[i].textContent || '');
      if (!seen) {
        if (/固定资产/.test(t)) {
          seen = true;
          // 「固定资产 24」在同一个文本节点里时，数字后面就是插入点
          if (/\d/.test(t)) return { parent: bold, ref: kids[i].nextSibling };
        }
        continue;
      }
      if (/\d/.test(t)) return { parent: bold, ref: kids[i].nextSibling };
    }
    return null;
  }

  /** 固定资产后面的各级圣殿数量：(3级 + 2级 + 1级) */
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

  /** 接管站点自带的「上期公示」→「往期竞拍」、「参与竞拍」→ 我们的竞拍浮层 */
  function gxHijack(rec) {
    const { box } = rec;
    const past = box.querySelector('#auctionHistoryButton');
    if (past) {
      if (past.dataset.tgtkPast !== '1') {
        // 克隆一份顶替原节点：站点可能把点击直接绑在这个元素上（jQuery 直绑），
        // 换成新节点后旧监听就都没了，不会出现「两个弹窗一起弹」。
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
        // 标题行常挂着 jQuery 委托，用捕获 + stopImmediate 把站点自己的弹窗挡住
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

  /** 把自己的圣殿置顶 + 名字染粉（不加框、不加角标） */
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

  /** 新版 React 页面的圣殿网格：类名未知，按结构找——每个子项都带封面图、宽度够大 */
  function gxTempleGrids() {
    const out = [];
    for (const d of allDocs()) {
      // 新版 React 角色页：圣殿网格 id 是固定的（#tg-trade-box-temple-list），
      // 里面每张卡是 div[data-user-name]，塔图用的是 background-image 而不是 <img>，
      // 所以不能再靠「子项带 img」去猜——直接按 id 取最稳。
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
        // 塔图可能是 <img>，也可能是带 background-image 的 div
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

  /** 圣殿尺寸：旧版走 #lastTemples，新版按结构推断；两者都附带居中 */
  /** 圣殿尺寸改成「按 id 注入的持久 CSS 规则」：
   *  以前把标记打在网格节点上，React 一点塔图就整块重绘、节点换新，标记没了 →
   *  一行 6 个瞬间闪回一行 5 个。样式表不在 React 的 DOM 树里，重绘动不了它。 */
  function gxTempleCss(doc) {
    const sz = S.gxTempleSize === 's' ? 's' : S.gxTempleSize === 'l' ? 'l' : '';
    // html 上的 class 不会被 React 重绘抹掉，配合结构选择器避免点塔图 / 关弹窗闪一下
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

  /** 不走 4 秒节流的「立刻重贴」；onlyCss=true 时只刷样式表（很便宜），
   *  不翻整页找网格——行情表每秒都在刷新，没必要每次都扫。 */
  function gxTempleSizeFast(onlyCss) {
    const sz = S.gxTempleSize === 's' ? 's' : S.gxTempleSize === 'l' ? 'l' : '';
    for (const d of allDocs()) {
      gxTempleCss(d);
      gxStyle(d);
    }
    if (onlyCss) return;
    // 换了 id 的新版 / 结构兜底找出来的网格，仍用属性再补一层
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
    // 常规轮询 4 秒一次；DOM 变化由观察器走 gxTempleSizeFast()
    const now = Date.now();
    if (GX.szAt && now - GX.szAt < 4000) return;
    GX.szAt = now;
    gxTempleSizeFast(false);
  }

  /* ---- 角色页内嵌的「圣殿尺寸」开关（工具箱「增强」页已删） ---- */
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
      // 立刻生效，不等 4 秒轮询；旧版还要同步 #grailBox 上的尺寸 class
      try {
        gxTempleSize(gxBox());
      } catch (e) {}
      try {
        gxTempleSizeFast(false);
      } catch (e) {}
    });
    // 标题行 / 表头常挂 jQuery 点击委托，别让点下拉顺带触发它们
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
    // 同一父节点就别反复搬动，否则用户展开下拉时会被移走
    if (sel.isConnected && sel.parentElement === parent) return;
    try {
      parent.insertBefore(sel, before || null);
    } catch (e) {}
  }

  /** 新版：圣殿列表 sticky 表头里、右侧「筛选」框左边；
   *  旧版：「[显示全部]」链接右边。站点重绘换节点后由 tick / 观察器重挂。 */
  function gxMountSize() {
    let placed = false;
    for (const d of allDocs()) {
      // ---- 新版 ----
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
          // 表头是 flex + justify-between：插在筛选框左边，靠 margin-left:auto 贴过去
          gxPlaceSize(header, filter, 'new');
          placed = true;
          break;
        }
      } catch (e) {}
      // ---- 旧版 ----
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
            // 兜底：固定资产那一行（含「往期竞拍 / 萌王投票 / 资产重组」链接）
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
    // 不在角色页就把下拉摘下来，别留在别的页面上
    if (!placed && gxSizeEl && gxSizeEl.parentElement) gxSizeEl.remove();
  }

  /* -------------------- 新版小圣杯（tg-* 页面）增强 -------------------- */

  /** 新版头部解析缓存：站点每 1.2 秒轮询一次，不能每次都翻整页 */
  let gxNewHeadCache = { at: 0, doc: null, box: null, cid: '' };

  /** 从名字链接往上爬，找「同时含 固定资产 与 收藏/交易按钮」的那一层容器 */
  function gxNewClimb(from) {
    let up = from;
    let best = null;
    for (let i = 0; i < 7 && up; i++, up = up.parentElement) {
      const s = String(up.textContent || '');
      // 再往上就是整页了，收手
      if (s.length > 1200) break;
      if (!/固定资产|持股|可用/.test(s)) continue;
      best = up;
      if (/交易记录|资产重组|参与竞拍|萌王投票/.test(s)) break;
    }
    return best;
  }

  /**
   * 新版角色页头部容器。
   * 2.0 / 2.1 版的外层 id 是 `#tg-trade-box`；2.2 起换过容器（自带的「收藏」按钮
   * 也一起搬了家），固定 id 一旦对不上，拍卖信息 / 圣殿数 / 星标就全都挂不上去。
   * 所以这里两路解析：先认已知 id，认不到再按结构找
   * ——「#id -「名字」」链接 + 固定资产 + 收藏/交易记录 同时出现的那一层就是头部。
   */
  function gxNewBox() {
    const now = Date.now();
    if (gxNewHeadCache.box && gxNewHeadCache.box.isConnected && now - gxNewHeadCache.at < 1000) {
      return gxNewHeadCache;
    }
    for (const d of allDocs()) {
      let box = null;
      let cid = '';
      // (1) 已知 id（2.0 / 2.1）
      try {
        box =
          d.getElementById('tg-trade-box') ||
          d.getElementById('tg-trade-box-header') ||
          d.getElementById('tg-trade-box-header-info');
      } catch (e) {}
      // (2) 结构兜底（2.2+ 换了外层）
      if (!box) {
        try {
          for (const a of d.querySelectorAll('a[href*="/character/"]')) {
            const m = String(a.getAttribute('href') || '').match(/\/character\/(\d+)/);
            if (!m) continue;
            if (!/#\s*\d+/.test(String(a.textContent || ''))) continue;
            const up = gxNewClimb(a);
            if (!up) continue;
            // 必须爬到「带操作按钮」的那一层，否则可能拿到圣殿卡片之类的小容器
            if (!/交易记录|资产重组|参与竞拍|萌王投票/.test(String(up.textContent || ''))) continue;
            // 只认新版（tg-* 节点），别把旧版 jQuery 交易框当成新版头部
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

  /** 给站点输入框赋值，并派发 input 事件（站点的 onInput 是 jQuery 绑的，认原生事件） */
  function gxSetInput(el, v) {
    if (!el) return;
    try {
      el.value = String(v);
      const w = (el.ownerDocument && el.ownerDocument.defaultView) || window;
      el.dispatchEvent(new w.Event('input', { bubbles: true }));
    } catch (e) {}
  }

  /** 克隆站点的按钮、只换文字：这样尺寸 / 颜色 / 圆角 / 图标样式都和旁边完全一致 */
  function gxCloneLabel(src, label) {
    const b = src.cloneNode(true);
    try {
      ['id', 'onclick', 'disabled', 'title', 'href', 'aria-label'].forEach((k) => b.removeAttribute(k));
    } catch (e) {}
    // 图标在前、文字在后：取最后一个非空文本节点改，别把 svg 里的 <title> 改了
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

  /**
   * 新版数据：本周竞拍（人数 / 已拍 / 我的出价）+ 英灵殿（= 拍卖上限）+ 底价 + 全部圣殿。
   * 60 秒缓存，和旧版 gxData 分开存（键加 n 前缀）。
   */
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
    // 主接口没读到（登录态 / 站点改签名）时，用「我的竞拍列表」兜出价与数量；
    // 人数 / 已拍先记 0，并把缓存时间往前拨，15 秒后再试一次，不会一直空白
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

  /** 找新版角色页那颗「交易记录」按钮。
   *  站点改版后按钮行没有固定 id，按钮里可能带图标，页面上还可能有隐藏副本 / gm 版，
   *  所以：先在解析到的头部里找，找不到再扩到 #tinygrail / body；
   *  只认可见的按钮，优先「和 资产重组 / 参与竞拍 同一行」的那颗。 */
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
        // 「交易记录」四个字可能夹着图标；排除 gm 副本和过长的容器
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

  /** 新版角色页：把「竞拍人数 / 竞拍数量 · 我的出价 / 我的数量」直接写在「交易记录」右边。
   *  字体 / 字号跟旁边的按钮一致，蓝=人数/数量，粉=我的出价/数量。 */
  function gxNewAuctionInfo(rec, data) {
    const { doc } = rec;
    // 老版本这里补的是一枚「拍卖信息」按钮，清掉残留
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
    // 站点重绘可能把旧副本留在别的容器里，只留一枚
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
      // 接口暂时没读到也留个占位：既看得见位置，也不会误以为功能没开
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
    // 自己没参与拍卖就不显示粉色那一段（和旧版角色页一致）
    if (bid.price > 0) {
      bar.appendChild(
        h('span', { class: 'tgtk-gx-mine', title: '我的出价 / 我的数量' }, `₵${fmt(bid.price, 2)} / ${fmt(bid.amount)}`)
      );
    }
  }

  /** 新版角色页：各级圣殿数量 (3级 + 2级 + 1级) 跟在「固定资产 N」后面。
   *  新版把这个「固定资产 N」做成了圣殿列表的 sticky 表头
   *  （2.1 是 #tg-trade-box-temple-header，2.2 起同类表头也可能换 id），
   *  所以先按 id 找，找不到再按「只由 固定资产 + 数字 组成的短文本」认这一格。 */
  let gxTempleScanAt = 0;

  function gxNewTempleCount(rec, temples) {
    const { box, doc } = rec;
    let span = null;
    try {
      span = doc.querySelector('.tgtk-gx-temples-n');
    } catch (e) {}
    // 已经挂在页面上的，直接认它的父节点（站点重绘换掉就重新找）
    let host = (span && span.isConnected && span.parentElement) || null;
    // (1) 圣殿列表头（用户指定的位置）
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
    // (2) 表头 id 也换了的话：全页找「固定资产 27」这种短文本
    //     （带冒号的是角色头的「固定资产: 250 / 500」，不会被误认），5 秒最多扫一次
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
    // (3) 兜底：角色头的「可用 / 持股 · 固定资产」那一行
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

  /** 竞拍弹窗对应的角色：标题是「拍卖 - #36488「凉风青叶」」 */
  function gxBidCid(modal) {
    try {
      const head = String(modal.textContent || '').slice(0, 120);
      const m = head.match(/#\s*(\d{2,9})/);
      if (m) return m[1];
    } catch (e) {}
    return String(currentCharacterId() || '');
  }

  /** 新版竞拍弹窗：数量默认「我已经拍过的股数」，没参与过才用设定值（默认 1 股）。
   *  站点默认把「英灵殿全部」塞进数量框，一股脑全拍太冲；
   *  已经拍过 100 股时再点拍卖，默认值给 100 更顺手（改量时不用自己回忆）。
   *  补满 / 改量 / 改价 新版小圣杯自己已经提供了，插件不再重复造这三颗按钮。 */
  function gxNewBidModal() {
    for (const doc of allDocs()) {
      let modal = null;
      try {
        modal = doc.getElementById('tg-auction');
      } catch (e) {}
      if (!modal || !modal.isConnected) continue;
      // 老版本插件塞进去的按钮组，升级后节点可能还留着，清掉
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

      // 缓存还没就绪（刚进角色页就点开竞拍）：补一次，回来时用户没改过数量再跟着更新
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

  /** 新版小圣杯自带的「收藏」按钮（星标要挂在它右边；只在 tg-* 新版页面生效） */
  function gxNewFavBtn(doc) {
    // 星标同步很频繁，这里不能每次都翻整棵交易框（圣殿列表很长）。
    // 结果缓存 1.5 秒；节点脱离 DOM（站点重绘）立刻失效。
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
        // 「＋ 收藏」「收藏」都认，别的（我的收藏 / 收藏夹 …）不认
        const t = String(el.textContent || '').replace(/\s+/g, '');
        if (t !== '收藏' && t !== '+收藏' && t !== '＋收藏') continue;
        let r;
        try {
          r = el.getBoundingClientRect();
        } catch (e) {
          continue;
        }
        if (!r.width || !r.height || r.width > 220 || r.height > 48) continue;
        // 嵌套时取最内层（外层容器也算「收藏」）
        if (best && !best.contains(el)) continue;
        best = el;
      }
      if (!best) return null;
      // 命中的可能是按钮里的文字 span：往上爬到按钮本身，
      // 否则星标会被插进 <button> 里面（点星标会连带触发收藏）
      return (best.closest && best.closest('button,a,[role="button"]')) || best;
    };
    // 新版 2.2 起外层容器换了 id，「收藏」也可能搬到 #tg-trade-box 外面，
    // 所以从解析到的头部往外扩几层一起找。
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
      // 只认「同一个角色页」的小范围容器，别把 Bangumi 自己的收藏按钮抢过来
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

  /** 找当前页面的「签到」按钮：旧版叫 #bonusButton，新版是 #tg-rakuen-home-bonus-button */
  function gxBonusBtn() {
    for (const d of allDocs()) {
      try {
        const hit = d.getElementById('bonusButton') || d.getElementById('tg-rakuen-home-bonus-button');
        if (hit) return hit;
        for (const el of d.querySelectorAll('[id$="bonus-button"],[id$="bonusButton"]')) {
          // 排除「每周分红」那颗（id 也以 bonus-button 结尾）
          if (/签到|已领取|已签到/.test(String(el.textContent || ''))) return el;
        }
      } catch (e) {}
    }
    return null;
  }

  /**
   * 把签到按钮藏掉。直接 remove 会被站点重绘塞回来，所以改成注入一条
   * 以它 id 为准的 CSS 规则——重绘出来的新节点一样被压住。
   */
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
    // 注意：不 remove。节点留着才能每天重新判断一次（第二天该恢复就恢复），
    // 视觉上由上面那条 !important 规则压掉。
  }

  /** 股息已经高于低保 / 今天已领取 → 超展开首页的签到按钮没意义，收起来 */
  async function gxBonus() {
    const btn = gxBonusBtn();
    if (!btn) return;
    if (!S.gxHideBonus) {
      gxHideBonusBtn(btn, false);
      return;
    }
    const claimed = /已领取|已签到|明天再来/.test(String(btn.textContent || ''));
    // 今天已经签过 → 按钮只会显示「已领取」，点了也没用，直接藏。
    // （以前只在「股息够」时才藏，而且要求接口返回非 0，所以常常不生效）
    if (claimed) {
      gxHideBonusBtn(btn, true);
      return;
    }
    const now = Date.now();
    if (GX.bonus === null || now - GX.bonusAt > 30 * 60000) {
      GX.bonusAt = now;
      // 用不抛错的版本：今天已经签到时接口会返回非 0，普通 api() 直接报错
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

  /** 超展开首页（/rakuen）点个人头像弹出的「我的小圣杯」浮层，用户不要折叠功能 */
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

  /** 个人主页小圣杯：右侧「[折叠] / [展开]」，行为照新版 */
  function gxUserHome() {
    if (gxIsRakuenHome()) {
      // 删掉折叠按钮，并把以前折叠起来的内容全部恢复（含升级前留下的状态）
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
    /** 内容块：标题栏的下一个兄弟（旧版小圣杯内容就在它后面），兜底用 div.grail.page_inner */
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
      // (1) #grail 内部：标题栏之外的直接子块（内容列表、loading 等）一起收掉
      const root = title.closest('#grail') || (wrap && wrap.parentElement);
      const bar = title.closest('.horizontalOptions') || wrap;
      if (root && bar) {
        for (const child of Array.from(root.children)) {
          if (child === bar || child.contains(bar) || bar.contains(child)) continue;
          child.classList.toggle('tgtk-grail-hidden', hidden);
        }
      }
      // (2) 关键：旧版 loadPager() 是 $(`#${target}`).after(p)，把 #pager0..3 插在
      //     #grail **外面**（#grail 的兄弟节点，class="grail page_inner"）。
      //     上一版只遍历 #grail 的子节点，永远碰不到它 → 折叠后页码依旧显示。
      //     切标签时站点会重建分页，所以每轮 tick 都要重新收一遍。
      if (root && root.parentElement) {
        for (const sib of Array.from(root.parentElement.children)) {
          if (sib === root || sib.contains(root)) continue;
          const isPager = /^pager\d+$/.test(String(sib.id || '')) ||
            (sib.classList && sib.classList.contains('page_inner') &&
              sib.querySelector && sib.querySelector('a.p[data-page]'));
          if (isPager) sib.classList.toggle('tgtk-grail-hidden', hidden);
        }
      }
      // (3) 兜底：分页被别的容器包起来时，按「带页码链接的 .grail.page_inner」找
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
    // 站点重绘会把按钮冲掉，每次补一个
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

  /* ---- 旧版小圣杯：通天塔日志（照新版 chara/star/log/{page}/{size} 重画） ----
   * 旧版把 Type 5「冲星成功」落进 default，显示成「受到攻击 -N」（正负反了、丢了 ★），
   * 而且只渲染一页、没有翻页。这里接管 #starForces .logs：按新版 Type 分支渲染 + 加分页。
   * 宿主必须钉死真实 id/class；用「带 ago 的列表」猜会把自己的面板当成新宿主，
   * 每 1.2 秒清空重建一次，于是反复读取、分页条叠好几层。 */
  const GXLOG = { host: null, box: null, page: 1, data: null, at: 0, busy: false, err: '' };
  // 照旧版 normalizeAvatar()：日志接口给的 Icon 常是 OSS 全路径或 /avatar 相对路径，
  // 直接塞进 url() 会解析到 bgm.tv 而 404，所以部分角色头像显示为空白块。
  const SLOG_CDN = 'https://tinygrail.mange.cn';
  const SLOG_OSS = 'https://tinygrail.oss-cn-hangzhou.aliyuncs.com/';
  const SLOG_OSS_HOST = SLOG_OSS.replace(/^https?:\/\//i, '');
  const SLOG_AV = '//lain.bgm.tv/pic/user/l/icon.jpg';

  function gxLogAvatar(icon) {
    let a = String(icon || '').trim();
    if (!a) return SLOG_AV;
    // http / https / 协议相对三种写法都要认（旧版只认 https 一种）
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

  /** 新版脚本的 switch (log.Type)：0 普通 / 2 鲤鱼之眼 / 3 精炼成功 /
   *  4 精炼失败 / 5 冲星成功（带 ★）/ default 受到攻击。
   *  用户名与动作拆成两段，名字过长时只省略名字，后面的数量/动词仍看得见。 */
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
    // 前 500 名：一枚深色徽章同时显示 #排名 与 ✦星之力（照旧版 .badge.starforce.ranked）
    const badge = h(
      'span', {
        class: 'tgtk-slog-badge' + (rank > 0 && rank <= 500 ? ' ranked' : ''),
        title: `通天塔排名第${rank}位 / 星之力 +${fmt(sf, 0)}`,
      },
      h('span', null, '#' + rank),
      h('i', { class: 'tgtk-slog-bsep' }),
      h('span', null, '✦' + fmt(sf, 0))
    );
    // <img> + onerror 兜默认头像：主图 404 时不会留空白块
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

  /** 旧版日志列表容器：源码里是唯一确定的 #starForces .logs
   *  （<div id="starForces"><div class="title">/ 通天塔(β)</div>
   *      <div class="babel scroller"><div class="v_scroller"><div class="logs">…</div>）。
   *  之前用「带 4h ago 的列表」猜宿主，我们自己注入的 6m ago 行也会被当成新宿主，
   *  下一轮反复清空 / 重建 / 重新请求，分页条叠了好几层 —— 改成钉死真实锚点。 */
  function gxFindStarLogHost() {
    for (const d of allDocs()) {
      // 新版 React 页面自带正确实现，绝对不动
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
      // 兜底：容器 id 换了，仍要求「通天塔」标题与 .logs 在同一块里
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
      // 铁律：绝不把我们自己注入的面板当成宿主（否则必然反复接管）
      if (host.closest && host.closest('#tgtk-starlog')) continue;
      if (host.id === 'tgtk-starlog' || /tgtk-slog/.test(String(host.className || ''))) continue;
      return { doc: d, host };
    }
    return null;
  }

  /** 站点 signalR 的 ReceiveStarLog 会往 #starForces .logs prepend 旧格式 .star_log；
   *  DOM 一变就清掉，不等 1.2 秒 tick（CSS 里也有一层 display:none 防闪）。 */
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
    // 站点重绘会冲掉我们挂的节点，别因此每 1.2 秒就打一次接口
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
    // 自愈：清掉之前反复接管留下的游离面板，全页只允许一个 #tgtk-starlog
    try {
      for (const old of Array.from(doc.querySelectorAll('#tgtk-starlog'))) {
        if (old !== GXLOG.box || old.parentElement !== host) old.remove();
      }
    } catch (e) {}
    // 站点 signalR 的 ReceiveStarLog 会往 .logs 里 prepend 旧格式 .star_log，
    // 每轮清掉，避免和我们的列表混排（60 秒自动刷新会补上最新日志）
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
    // 站点把 .logs 换成新节点：把已有面板搬过去，不清数据、不重新请求
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
    // 接管：清掉旧版那几条（含把提升写成「受到攻击 -N」的），换成正确列表 + 分页
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

  /**
   * 新版 React 萌王投票页：类名未知，用「人数 / 拍卖数 / 拍卖总数」这一行反查卡片
   * （每张卡底部都有 `3 / 4,052 / 4,050` 这种格式），取同一父容器下最大的一组。
   */
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

  /** 萌王榜：鼠标悬停才弹综合信息卡（评分抹掉个位十位） */
  async function gxTopWeek() {
    if (!S.gxTopWeek) return;
    // 上次挂好的卡片都还在 → 不用再翻一遍 DOM（站点刷新会换节点，那就重来）
    if (GX.topNodes && GX.topNodes.length) {
      const alive = GX.topNodes.every(
        (n) => n.isConnected && n.querySelector('.tgtk-gx-ov') && n.querySelector('.tgtk-gx-ovscore')
      );
      if (alive) return;
    }
    const now = Date.now();
    if (GX.topAt && now - GX.topAt < 1500) return;
    GX.topAt = now;

    // 收集卡片：{ card: 卡片本体（挂 hover），host: 覆盖层要贴在哪（旧版=卡片本身，新版=封面块） }
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
      // 新版：容器 id 确定，卡片带 data-rank，封面是第一个 aspect-[3/4] 子块
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
      // 旧版本贴的行内角标清掉，改成只在悬停时显示（只清卡片外面的）
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
      // 评分抹掉后两位：17,744,500 → 177,445
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
    // 记下来：卡片都还在时下次直接跳过整轮扫描
    GX.topNodes = hosts;
  }

  /** 竞拍浮层：页面居中（465px）；已参与时回填我的出价 / 数量；
   *  补满 / 改量 / 改价 + 右下角「数量降低提醒」；取消竞拍粉底白字 */
  function gxOpenBid(rec, anchor) {
    const cid = rec.cid;
    const data = GX.cache[cid] || {};
    const base = (data.base && data.base.price) || 0;
    const pop = gxPop(`股权拍卖 · ${gxCharLabel(cid)}`, anchor, { center: true, wide: true });

    const hint = h('div', { class: 'tgtk-histsum' }, '读取中…');
    pop.appendChild(hint);

    const numSpan = h('span', { class: 'tgtk-gxnums' });
    // 已经参与过这一轮：价格 / 数量默认填「我已拍的值」。
    // 站点竞拍是「整条覆盖」语义——已拍 200 股时再拍 1 股，会把原来那条改成 1 股，
    // 等于撤掉 199 股（周六取消竞拍要扣资金）。所以绝不能用默认值把已有出价顶掉。
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
      // 提交 / 取消之后回填成最新的「已拍值」，别让输入框停在上一次的手填值上
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
        // 补满：把本轮没拍完的 + 我原来的份额一起拍下（与站点脚本一致）
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

    // 右下角「数量降低提醒」：勾上后，这次填的数量比已拍数量低就先弹一次确认；
    // 不勾就直接提交。状态记在本机，下次打开还是上次的选择。
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

    // 照站点弹窗的排法：上面一行标签（价格 / 数量 / 合计），下面一行「输入框 + 确定」
    pop.appendChild(
      h('div', { class: 'tgtk-gxlabels' }, h('span', null, '价格'), h('span', null, '数量'), sum)
    );
    pop.appendChild(h('div', { class: 'tgtk-gxrow' }, priceIn, amountIn, ok));
    pop.appendChild(h('div', { class: 'tgtk-histfoot tgtk-gxfoot' }, cancel, msg, warnLab));

    // 拍满 / 可拍 0 股都允许出价：可拍 0 股时站点走「萌王投票」机制，
    // 一样能提交价格与数量，所以这里不再禁用确定按钮。

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
      // 可拍 0 股（萌王投票）也保持可提交，不再按「本轮是否开拍」禁用确定
    };
    // 缓存里还没有本周数据（刚打开页面就点竞拍）：补拉一次，
    // 否则既没有底价、也回填不出「我已拍的值」
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
      // 竞拍是整条覆盖：数量改小等于撤掉差额（周六取消竞拍会扣资金）
      if (S.gxBidWarn) {
        // 先拉一次最新数据：缓存最长 60 秒，别拿旧的已拍股数去比较
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

  /** 往期竞拍（每周一轮，按页往前翻；成功的按出价从高到低置顶 + 均价/中位价） */
  function gxOpenPast(rec, anchor) {
    const cid = rec.cid;
    const sum = h('div', { class: 'tgtk-histsum' }, '读取中…');
    const list = h('div', { class: 'tgtk-histlist' });
    const stat = h('span', { class: 'tgtk-histstat' }, '');
    const prev = h('button', { class: 'tgtk-btn tgtk-gxnav', type: 'button', title: '往前翻更早的一周' }, '前一周');
    const next = h('button', { class: 'tgtk-btn tgtk-gxnav', type: 'button', title: '回到更近的一周' }, '后一周');
    // 水平居中 + 顶部钉住、仍保持 432px 紧凑尺寸；翻周按钮在右上角、关闭按钮左边。
    // 顺序按用户要求对调：[后一周][前一周][×]——常用的「前一周」最贴着关闭按钮。
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
          // 「前一周」不再因为空周就消失：有些周确实没记录，但更早的周可能有，
          // 藏掉按钮会把用户卡在这一周。保留它，让用户可以一直往前找。
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
        // 读失败也不藏「前一周」，重试 / 继续往前翻都由用户决定
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

  /** 新版 React 页面会整块重绘：轮询的 1.2 秒空档里，行内信息 / 圣殿数会被抹掉，
   *  塔图也会闪回一行 5 个。盯住页面节点变化，一变就立刻重贴（≤40ms，肉眼看不出闪）。 */
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
          // 这一段 DOM 是不是圣殿列表的一部分：卡片、列表本体（id 含 temple）
          // 或列表里任意一张带 data-user-name 的卡。React 关弹窗时可能整块换列表，
          // 换掉的节点自己没有 data-user-name，靠这个才能认出来。
          const templeish = (n) => {
            if (!n || n.nodeType !== 1) return false;
            try {
              if (n.hasAttribute && n.hasAttribute('data-user-name')) return true;
              if (/temple/i.test(String(n.id || ''))) return true;
              // 换掉的是外层容器时，里面还装着圣殿卡片
              if (n.querySelector && n.querySelector('[data-user-name]')) return true;
            } catch (e) {}
            return false;
          };
          for (const r of records) {
            // React 重渲染 LINK 卡时常常只改 style（背景图被写回原顺序），不换节点；
            // 只盯 childList 会漏掉，导致「点开/关闭塔图后顺序短暂恢复」要等心跳才补。
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
            // 我们自己容器内部的变化（重贴文字、样式表内容）不算，避免自激循环
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
          // LINK 卡的换序 / 接缝是每轮重贴的：React 重绘（点开、关闭塔图弹窗）后
          // 要立刻补回去，否则会看到一瞬间恢复成原顺序、白缝也闪一下
          tgLinkPassSoon();
          // 圣殿列表被 React 重绘时（点塔图 / 关弹窗）必须**当场**补尺寸标记：
          // MutationObserver 的回调本身在绘制之前，setTimeout(0) 会拖到下一帧，
          // 那一帧先按站点自己的列数排、再跳回 6 列 —— 就是关弹窗时闪的那一下。
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

  /** 每 1.2 秒对一次页面：角色页拍卖信息 / 各级圣殿 / 我的圣殿 / 圣殿尺寸 / 首页签到 / 个人主页 / 萌王榜 */
  /* ================= 塔图工具箱（新旧版通用） =================
   * 塔图是 3:4 竖图，站点上传时会自动裁中间；这里先自己自由裁剪再上传。
   * 旧版弹窗：#TB_window.temple（.action / img.cover / .progress）
   * 新版弹窗：#tg-temple-detail[data-character-id]（#tg-temple-info-progress / #tg-temple-actions）
   * 复制 / 修改他人塔图沿用激进版的接口：
   *   chara/temple/cover/{cid}         → 把图片设成「我的圣殿」封面
   *   chara/temple/cover/{cid}/{uid}   → 修改指定塔主的封面
   */
  const TGT = {
    last: null, crop: null, toastTimer: 0, uidCache: {}, paste: null,
    me: null, meAsked: false, meRetryAt: 0, popSig: '', popAt: 0,
    linkInfo: {}, linkAsked: {}, owner: {},
  };
  const TGT_OSS = 'https://tinygrail.oss-cn-hangzhou.aliyuncs.com/';
  /** 站点真正拿来显示的封面域名（CDN 回源到同一个 OSS 桶）。
   *  OSS 源站开了原图保护，裸地址在浏览器里 403「Forbidden access to the original image」；
   *  只有这个 CDN 域名能直接打开 —— 右键「复制图片地址」拿到的就是它。 */
  const TGT_CDN = 'https://tinygrail.mange.cn/';
  /** 浮层开着时，所有文档里的塔图弹窗一律隐身。
   *  光调 z-index 压不住：新版弹窗常挂在另一个文档 / 更高层级的 iframe 里，
   *  iframe 是透明的，弹窗的不透明卡片照样会盖在裁剪窗口下半截。 */
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

  /** 裁剪期间：把站点弹窗藏掉，并让浮层成为页面上唯一可点击的东西。
   *  新版角色页里承载小圣杯的透明 iframe / 定位容器会整屏接管点击——
   *  只把内容藏透明不够，元素本身仍在吃事件（浮层看得见却点不动）。
   *  所以对每个文档把 <body> 下除浮层/提示外的所有直接子元素置 pointer-events:none，
   *  关闭时按保存的旧值精确还原（React 重绘后每轮重贴）。 */
  function tgHidePopups() {
    if (!TGT.crop) return;
    for (const d of allDocs()) {
      tgCropHideCss(d);
      try { d.documentElement.classList.add('tgtk-crop-open'); } catch (e) {}
      // 直接命中已知弹窗壳层（新版两种写法都兼容；遮罩可能是 #tg-temple-detail 的兄弟节点）
      for (const sel of ['#tg-modal', '#tg-modal-background', '[id^="tg-modal-"]',
        '.tg-bg-mask', '.tg-modal-mask', '.tg-modal-backdrop']) {
        try {
          const els = d.querySelectorAll(sel);
          for (let i = 0; i < els.length; i++) {
            try { els[i].setAttribute('data-tgtk-crop-hide', '1'); } catch (e) {}
          }
        } catch (e) {}
      }
      // 塔图弹窗本体 + 整条祖先链都藏掉（不限层数）
      const det = d.getElementById && d.getElementById('tg-temple-detail');
      if (det) {
        let up = det;
        while (up && up !== d.body && up !== d.documentElement) {
          try { up.setAttribute('data-tgtk-crop-hide', '1'); } catch (e) {}
          up = up.parentElement;
        }
      }
      // 关键：body 下除浮层和提示外，所有直接子元素一律禁用指针事件。
      // pointer-events:none 会被后代继承，所以整棵站点子树都点不到，浮层不再被透明层吃掉点击。
      const b = d.body;
      if (!b) continue;
      const kids = Array.prototype.slice.call(b.children);
      for (let i = 0; i < kids.length; i++) {
        const el = kids[i];
        if (!el || el.id === 'tgtk-crop' || el.id === 'tgtk-ttoast') continue;
        try {
          // 原值只在第一次记录；样式每轮重贴（React 重绘可能把行内样式清掉）
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
      // 裁剪浮层可能挂在 iframe 文档里，提示也要跟到同一层，别被塔图弹窗压住
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

  // ---------- LINK 圣殿：换序 / 无缝拼接 / LINK 图裁剪 ----------
  const LS_LINKSWAP = 'tgtk:linkswap:v1';
  const TGT_HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20.8 8.6a5 5 0 0 0-8.8-3 5 5 0 0 0-8.8 3c0 5 8.8 10 8.8 10s8.8-5 8.8-10z"/></svg>';
  // 换序：上下两条反向箭头（互换）
  const TGT_SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3.6 8.4h13.2"/><path d="M13.9 5.3l3.1 3.1-3.1 3.1"/>' +
    '<path d="M20.4 15.6H7.2"/><path d="M10.1 12.5l-3.1 3.1 3.1 3.1"/></svg>';
  // 「视频」入口：圆润的播放三角，跟右边的裁剪键同尺寸
  const TGT_PLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M8.2 5.6a1.1 1.1 0 0 1 1.7-.9l8.4 6.4a1.1 1.1 0 0 1 0 1.8l-8.4 6.4a1.1 1.1 0 0 1-1.7-.9z" ' +
    'fill="currentColor"/></svg>';
  // 「复制塔图地址」：两个套在一起的小环，和裁剪键同尺寸（22×22 的 tgtk-ticon）
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
  /** 记录「希望把哪个角色放在左边」；没有记录 = 沿用站点按固定资产排序的默认顺序 */
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

  /** 个人 LINK 页：新版 = #tg-user-tinygrail 的「N组连接」；旧版 = .link_list */
  function tgIsPersonalLinkPage(card) {
    try {
      if (card.closest('#tg-user-tinygrail')) return true;
      if (card.closest('.link_list')) return true;
    } catch (e) {}
    return false;
  }

  /** 读一张 LINK 卡的两半：角色 ID + 实际节点 */
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
    // 旧版 renderLink 把「A」×「B」放在 .chara_link 的兄弟节点 .content 里，
    // 直接在 card 内查是查不到的（角色名因此一直没换）
    let cn = null;
    try { cn = (card.parentElement && card.parentElement.querySelector('.content')) || null; } catch (e) {}
    if (!cn) cn = card.querySelector('.content');
    return cn ? cn.querySelectorAll('span') : [];
  }

  /** 新版那半张 LINK 卡里的塔图是 <canvas> 画出来的（不是 background-image），
   *  找这一半里真正承载画面的画布；没有就返回 null，交给老的背景图逻辑兜底。 */
  function tgLinkCanvas(el) {
    if (!el) return null;
    try {
      const c = el.querySelector('canvas');
      if (c && c.width && c.height) return c;
    } catch (e) {}
    return null;
  }

  /** 把画布内容拷到离屏 canvas：换过去之后原图就没了，必须留底才换得回来。
   *  跨域污染的画布会抛错，返回 null 表示只能用背景图那套。 */
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

  /** 把两张画布互换位置（搬节点，不搬像素）。
   *  站点是逐帧往 canvas 里画的（透明 PNG / GIF 动图都靠这个），
   *  拷像素会被下一帧盖回去；搬节点则动画跟着一起走。 */
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

  /** 两半的「画面内容」整体互换：不去猜是 <img> / <canvas> / background-image，
   *  连图层、播放键、角标一起搬。真机上站点把 LINK 卡改成 <img> 渲染时，
   *  只换画布 / 只换背景图都会「名字换了、画面没换」。 */
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

  /** 换序要一起搬的属性：站点点击时读的就是 data-character-id（决定打开哪座塔） */
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

  /** 换序：新版换画布像素 + data-* 属性 + 边框色 + 名字；旧版对调 left/right 布局类（图片留在原节点） */
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
          // 自然顺序（站点刚渲染出来的样子）——所有判断都拿它当基准，
          // 否则换过一次之后按当前 DOM 再算就会来回翻
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

      // 站点重绘会连 canvas 节点一起换掉。以第一次看到的「自然顺序」为基准，
      // 当前节点既不是 L 的也不是 R 的（说明站点重建过），就把当前当作新的自然顺序。
      const cvL = tgLinkCanvas(s.L) || nat.cvL;
      const cvR = tgLinkCanvas(s.R) || nat.cvR;
      if (cvL && cvR && cvL !== cvR) {
        const known = (cvL === nat.cvL && cvR === nat.cvR) || (cvL === nat.cvR && cvR === nat.cvL);
        if (!known) { nat.cvL = cvL; nat.cvR = cvR; }
        const isSwapped = cvL === nat.cvR && cvR === nat.cvL;
        if (need !== isSwapped) tgSwapCanvasNodes(cvL, cvR);
      } else {
        // 两半里没有画布（LINK 卡是 <img> 或背景图）。只换「图片内容」，
        // 不搬容器：容器上挂着站点的斜切 / 位移样式，整块搬过去会把画面切歪。
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
          // 懒加载 / 高分屏 / 说明文字一起换，否则 src 换了但站点又按 data-src 画回来
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
          // 背景图：找到两半里真正挂 background-image 的那层，只换值
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
            // 实在认不出图片元素：退回整块子节点互换（至少画面会换）
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
      // 属性跟着一起换：不然画面是 B、点开却是 A
      tgWriteAttrs(s.L, need ? nat.aR : nat.aL);
      tgWriteAttrs(s.R, need ? nat.aL : nat.aR);
      // 上面可能把两半的子节点整体搬过，边框要贴到「现在的」图片容器上
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
        // 只在真的不一样时才写，避免每轮心跳都制造 DOM 变动（会喂给观察器造成空转）
        const w1 = need ? nat.n2 : nat.n1;
        const w2 = need ? nat.n1 : nat.n2;
        if (sp[0].textContent !== w1) sp[0].textContent = w1;
        if (sp[1].textContent !== w2) sp[1].textContent = w2;
      }
      // 只在真的变化时写属性，免得每轮都产生一条 mutation 再把观察器叫醒
      if (need) {
        if (card.getAttribute('data-tgtk-swapped') !== '1') card.setAttribute('data-tgtk-swapped', '1');
      } else if (card.hasAttribute('data-tgtk-swapped')) {
        card.removeAttribute('data-tgtk-swapped');
      }
      return;
    }

    // 旧版：对调 left/right 布局类（图片留在原节点，点哪张打开哪张）。
    // 关键：need 必须按「首次看到的自然顺序」算。若按当前 DOM 算，交换之后本轮心跳
    // 又会算出“要换回去”，于是每次心跳翻一次 → 用户看到的就是一直来回交换。
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
    // 名字跟着一起换（写在 if 外面：直接赋绝对值，重复执行也不出错）
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

  /** 换序按钮：只在个人 LINK 页出现，贴卡片右下角（截图圈出的位置） */
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
    // 和「自由裁剪」一样的小图标按钮，图案用互换箭头
    btn = tgBtn('', '交换这两座 LINK 圣殿的左右顺序（本地记忆，角色页同步生效）', () => {
      const cur = tgLinkSides(card, kind);
      if (!cur || !cur.cidL || !cur.cidR) return;
      // 新版换序时 data-character-id 已经跟着画面一起换过了，
      // 所以 DOM 里的左右就是「看得见的左右」，不需要再换算一次
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
  /** DOM 一变就补：MutationObserver 的回调本身就是微任务，这里**当场同步**贴回去，
   *  比任何 requestAnimationFrame / setTimeout 都早，React 提交完到绘制之前就已经恢复，
   *  所以点开 / 关闭塔图弹窗时不会看到「换序短暂恢复、换序键消失一下」。
   *  React 有时把一次重绘拆成几个任务，所以下一帧再补一轮兜底（只补一次，不常驻）。
   *  所有写入都是「值不同才写」，第二轮不会再产生 mutation，不会自激。 */
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

  /** 每轮心跳：给所有 LINK 卡应用换序偏好、补换序按钮（白缝由 CSS 处理） */
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

  /** 当前这座塔的 LINK 信息（cache 60s）；没有 link 返回 null */
  async function tgLinkInfo(cid) {
    const key = String(cid || '');
    if (!/^\d+$/.test(key)) return null;
    const hit = TGT.linkInfo[key];
    if (hit && Date.now() - hit.at < 60000) return hit.info;
    let info = null;
    try {
      const v = await api('chara/links/' + key);
      // api() 已经把 { State, Value } 解包成 Value —— 这里直接就是数组。
      // （之前按 v.Items 取，永远取到空数组，于是判定成“没有 LINK 圣殿”，心形按钮一直不出现）
      const items = Array.isArray(v) ? v
        : ((v && (v.Items || v.items || v.Value)) || []);
      // 这个接口返回的是「这个角色所有人的圣殿连接」，不是「我的」。
      // 只有我自己那座塔连着 Link 才算有 LINK，否则角色页上别人的连接会让没 LINK 的塔也长出心形按钮。
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
            // 部分接口不回 Link.UserId，用对方角色的圣殿列表反查
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

  /** 从弹窗 / 卡片里抠出 cover/hash.jpg，换成 OSS 原图地址。
   *  站点现在也收透明 PNG / GIF，一并认，别只盯 .jpg。 */
  /** 卡片里当前显示的封面地址。
   *  必须**原样**返回页面里那个 src：小圣杯的封面 Bucket 开了原图保护，
   *  裸的 cover/xxx.jpg 在浏览器里打不开（403 Forbidden access to the original image），
   *  站点自己是带样式 / 签名参数取的。以前这里把参数抹掉、拼回 OSS 裸地址，
   *  复制出来就「打不开」、拿去换塔也容易被站点判成无效图。 */
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

  /** 记录最近点开的是哪座塔
   *  旧版普通圣殿 data-id="uid#cid"；LINK 连接卡片是 data-id="cid_uid"（下划线，顺序相反）；
   *  新版 data-character-id / data-user-name。三种都要认，否则 LINK 过的塔读不到角色 ID。 */
  function tgWire(doc) {
    if (!doc || doc.__tgtkTgt) return;
    doc.__tgtkTgt = true;
    try {
      doc.addEventListener('click', (e) => {
        const el = e.target;
        if (!el || !el.closest) return;
        // 新版换序只换了背景图，React 的 onClick 闭包还指向原来那座塔：
        // 点「视觉上的左边」必须把事件转给右边那个半区，否则打开的塔图是原位置的。
        const lk = el.closest('#tg-temple-link');
        if (lk && lk.getAttribute('data-tgtk-swapped') === '1' && !e.__tgtkSwapDisp) {
          const half = el.closest('#tg-temple-link-left,#tg-temple-link-right');
          if (half) {
            const other = lk.querySelector(half.id === 'tg-temple-link-left'
              ? '#tg-temple-link-right' : '#tg-temple-link-left');
            e.preventDefault();
            e.stopPropagation();
            if (other) {
              // 先把「这次点的是谁」记成对半那一边，弹窗里的按钮才会挂到正确的塔上
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
        // 只有「真的点了塔图卡片」才更新；点弹窗里我们自己的按钮时，
        // closest 会命中 #tg-temple-detail[data-character-id]，别把塔主信息冲掉
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
        // el 可能落在卡片内层，往上再找一层带 ID 的祖先补全
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
        // 旧版把 temple 对象挂在 jQuery .data('temple') 上，最准；缺 ID 时用它兜底
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
          // 记下这次点的是不是 LINK 连接卡：LINK 圣殿一律不给「复制 / 修改」
          info.link = !!(card.closest && card.closest('.chara_link,#tg-temple-link'));
          TGT.last = info;
        }
      }, true);
    } catch (e) {}
  }

  /** 兜底：按封面哈希在页面上找同图卡片，反推角色 ID。
   *  LINK 连接卡 / 个人主页圣殿列表常常没有当前角色页上下文，
   *  以前会退化成 currentCharacterId()，ID 不对就整个工具条不挂。 */
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
    // 旧版：#TB_window.temple
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
        // 只有「这次点的确实是这座塔的 LINK 卡」才算 LINK 圣殿，避免上一次点击的标记串味
        link: !!(TGT.last && TGT.last.link && String(TGT.last.cid || '') === String(cid)),
      };
    }
    // 新版：#tg-temple-detail（imageOnly 弹窗只有这张图和它自己）
    const det = doc.querySelector && doc.querySelector('#tg-temple-detail');
    if (det) {
      let cid = String(det.getAttribute('data-character-id') ||
        (TGT.last && TGT.last.cid) || '');
      if (!/^\d+$/.test(cid)) cid = tgCidByCover(tgCoverUrl(det) || (TGT.last && TGT.last.cover) || '');
      if (!/^\d+$/.test(cid)) return null;
      const row = det.querySelector('#tg-temple-info-progress > div');
      // 同一个角色可能有好几座塔（自己的 + 别人的）：塔主能读就读，
      // 复制 / 修改时靠它从 chara/temple/{cid} 里挑对那一条
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

  /** 新版没有 data-id 里的数字塔主 id，按用户名从 chara/temple/{cid} 反查 */
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

  /** 点击时重新取一次弹窗信息：按钮会先于「点塔图」事件挂上，
   *  不能在创建时就把 cid / uid / cover 闭包写死 */
  function tgCurrent() {
    for (const d of allDocs()) {
      const t = tgTarget(d);
      if (t) return t;
    }
    return null;
  }

  /** 我的用户 ID / 用户名：判断「这座塔是不是自己的」 */
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

  /** 弹窗会话计时：React 重绘会换掉 #tg-temple-detail 节点，不能把时间挂在节点上 */
  function tgPopupAge(t) {
    const sig = t.kind + '|' + t.cid + '|' + t.cover;
    if (TGT.popSig !== sig) { TGT.popSig = sig; TGT.popAt = Date.now(); }
    return Date.now() - TGT.popAt;
  }

  /** own = 自己的塔（只给裁剪）；other = 别人的塔（只给复制/修改）；pending = 还没判定 */
  function tgOwnerState(t) {
    // 判定过一次就记住，别再重算：旧版个人圣殿页会因为 tab 切换 / 站点重绘让判定在
    // own 与 pending 之间反复横跳，裁剪按钮就一闪一闪。
    // 但缓存不能只按角色 ID 记：同一个角色可能同时有「我的塔」和「别人的塔」
    //（站点会把重复的合并在同一张卡里，点开仍是各自那座）。只按角色 ID 记，
    // 先看过别人的塔，再点自己的，就会把「复制 / 修改」缓存到自己头上。
    const cidKey = String(t.cid || '');
    const whoKey = String(t.uid || '') || String(t.userName || '').toLowerCase();
    const memKey = cidKey + '|' + whoKey;
    const put = (v) => {
      if (v !== 'pending') {
        try { t.root.__tgtkOwner = { key: memKey, state: v }; } catch (e) {}
        // 认不出塔主时只记在弹窗节点上，别写全局：下一次同角色的另一座塔会串味
        if (cidKey && whoKey) TGT.owner[memKey] = v;
      }
      return v;
    };
    // 新版站点的操作行（修改 / 重置 / LINK…）只在我的塔上渲染，这是最硬的判据：
    // 必须放在缓存前面，否则会被上一次「别人的塔」的缓存盖住，裁剪就变成复制 / 修改
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
    // 旧版弹窗 .detail .name a 就是塔主用户名，比上次点击留下的 TGT.last 可靠
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
        // 有操作行的自己的塔已经在上面直接返回了；这里只剩纯图片弹窗和别人的塔
        if (domOther) return put('other');
        // 纯图片弹窗不渲染操作行，按塔主用户名判断
        if (cachedOwn) return put('own');
        const age = t.root.__tgtkBornAt ? Date.now() - t.root.__tgtkBornAt : tgPopupAge(t);
        if (age < 600) return 'pending';
        return put('other');
      }
      // 旧版：这些按钮默认 display:none，接口回来确认是自己的塔才会 show()
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
      // 刚打开弹窗时接口可能还没回来：能凭 ID / 用户名确认是自己的就直接显示，
      // 否则先空 900ms，别把「自己的塔」闪成复制/修改
      const age = t.root.__tgtkBornAt ? Date.now() - t.root.__tgtkBornAt : tgPopupAge(t);
      if (hasNative && age < 900) return (!domOther && cachedOwn) ? put('own') : 'pending';
      return (!domOther && cachedOwn) ? put('own') : put('other');
    } catch (e) { return (!domOther && cachedOwn) ? put('own') : put('other'); }
  }

  /** 旧版：裁剪键要贴在 [闪光结晶] 的左边（用户截图圈出的位置） */
  function tgOldSlot(host) {
    if (!host || !host.children) return null;
    const kids = Array.prototype.slice.call(host.children);
    for (const el of kids) {
      if (el.id === 'tgtk-ttoolbar' || el.id === 'tgtk-tlinkbar') continue;
      if (/闪光结晶/.test(String(el.textContent || ''))) return el;
    }
    // 没有闪光结晶时退到 [塔图] / [星之力] 一带，仍旧保持在操作行里
    for (const el of kids) {
      if (el.id === 'tgtk-ttoolbar' || el.id === 'tgtk-tlinkbar') continue;
      if (/^\s*\[?塔图\]?\s*$/.test(String(el.textContent || '')) || /星之力/.test(String(el.textContent || ''))) return el;
    }
    return null;
  }

  /** 每轮按「自己的塔 / 别人的塔」挂按钮；React 重绘后由观察器再挂 */
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
    // LINK 连接圣殿：一律不给「复制 / 修改」（自己和别人的都不给）；
    // 还没判定出归属之前也先不显示，避免开弹窗时那两颗按钮闪一下。
    const mode = state === 'own' ? 'own' : (found.link ? 'pending' : state);
    let bar = doc.getElementById('tgtk-ttoolbar');
    if (!bar) bar = h('span', { id: 'tgtk-ttoolbar', class: 'tgtk-ttoolbar', 'data-tgtk': '1' });
    // 旧版塔图操作行里的按钮要再小一半，跟旁边的文字按钮才协调
    bar.classList.toggle('tgtk-oldmini', kind === 'old');
    if (bar.dataset.tgtkMode !== mode) {
      bar.textContent = '';
      bar.dataset.tgtkMode = mode;
      if (mode === 'own') {
        // 复制塔图地址：GIF 塔是 canvas，右键拿不到链接；这里直接取 Cover 塞进剪贴板，
        // 换到别的塔时粘进「图片地址」就行（动图也能整段带过去）
        bar.appendChild(tgBtn('', '复制当前塔图地址（.gif 会连动图一起带过去，可粘到别的塔的「图片地址」）', () => {
          const t = tgCurrent() || found;
          tgCopyCoverUrl(t);
        }, TGT_COVERLINK));
        // 新版支持 GIF 动图：图片裁剪左边给一个「视频」入口，
        // 跳到作者做的视频转 GIF 裁剪工具（外站，新标签打开）
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
      // 自己的塔：裁剪按钮紧贴 [闪光结晶] 左边（截图圈出的位置）
      const slot = tgOldSlot(host);
      if (slot && slot.parentElement === host) {
        if (!brk) brk = h('span', { id: 'tgtk-tbrk', class: 'tgtk-brk', 'data-tgtk': '1' });
        // 已经是「断行 + 按钮 + 闪光结晶」的顺序就不要再动，免得每轮制造 mutation
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
        // 有「固定资产 N / N」这一行：工具条贴到这行最右边
        host.style.display = 'flex';
        host.style.alignItems = 'center';
        host.style.gap = '6px';
        bar.style.marginLeft = 'auto';
        bar.classList.remove('tgtk-tfloat');
      } else {
        // 纯图片弹窗：浮在塔图右下，与资产数字大致齐平
        root.style.position = 'relative';
        bar.classList.add('tgtk-tfloat');
        bar.style.marginLeft = '';
      }
    }

    // ---- LINK 图裁剪按钮：只有识别到该圣殿存在 LINK 圣殿时才显示 ----
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
        // 只给自己的 LINK 圣殿换图：LINK 另一半如果是别人的塔，不给「同时更换」的选项
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

  /** cover 字段归一成可直接提交的绝对地址 */
  function tgNormCover(u) {
    let s = String(u || '').trim();
    if (!s) return '';
    if (/^cover\//.test(s)) s = TGT_OSS + s;
    else if (/^\/\//.test(s)) s = 'https:' + s;
    return s;
  }

  /** 提交给站点用的「规范 Cover」：小圣杯自己存的就是 TGT_OSS + cover/<hash>.<ext>，
   *  不带查询串。页面里那张图可能带 ?x-oss-process=style/... （原图保护，签名/样式），
   *  那是给浏览器看的；原样存进去站点再套一次样式就坏了。所以提交前统一剥掉。 */
  function tgCanonCover(u) {
    const m = String(u || '').match(/cover\/[A-Za-z0-9_-]+\.(?:jpe?g|png|gif|webp)/i);
    return m ? TGT_OSS + m[0] : '';
  }

  /** 同一张封面的「能直接打开」形态（CDN 域名）。复制 / 预览都走它。 */
  function tgCdnCover(u) {
    const m = String(u || '').match(/cover\/[A-Za-z0-9_-]+\.(?:jpe?g|png|gif|webp)/i);
    return m ? TGT_CDN + m[0] : '';
  }

  /** 新版塔图是 <canvas> 逐帧画出来的（GIF / 透明动图），DOM 里拿不到地址。
   *  从接口按「塔主」把这座塔的 Cover 找回来 —— 复制 / 直传都靠它。 */
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

  /** 复制一段文字到剪贴板。
   *  navigator.clipboard 在 iframe / 没给权限时会静默失败（乐园页就是），
   * 再退回 textarea + execCommand('copy')，两个都不行才返回 false。 */
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

  /** 复制当前塔的 Cover 地址：GIF 塔的图是 canvas，DOM 里拿不到地址，走接口补 */
  async function tgCopyCoverUrl(t) {
    let cover = tgNormCover(t.cover || (TGT.last && TGT.last.cover) || '');
    if (!cover) {
      tgToast('正在读取塔图地址…');
      cover = tgNormCover(await tgTempleCover(t));
    }
    if (!cover) return tgToast('没读到塔图地址，请重新点开这座塔');
    // 复制出去要的是「浏览器能直接打开」的那个：CDN 域名，而不是 403 的 OSS 源站
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
      // 新版 GIF 塔图是 canvas，DOM 里没有地址：先给个提示，再去接口取
      tgToast('正在读取塔图地址…');
      cover = tgNormCover(await tgTempleCover(t));
    }
    if (!cover) return tgToast('没读到塔图地址，请重新点开这座塔');
    // 提交前统一成站点自己的写法（裸 cover/<hash>.<ext>）：带样式参数的地址存进去会被再套一层
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

  // ---------- 上传：裁好的 JPEG → OSS 签名 → PUT → 通知站点 ----------
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

  /** 输出格式尽量跟原图一致：PNG 走无损、保留透明；其它一律 JPEG 质量 1 */
  function tgOutMime(m) {
    const v = String(m || '').toLowerCase();
    if (v === 'image/png' || v === 'image/apng' || v === 'image/gif' ||
        v === 'image/bmp' || v === 'image/avif' || v === 'image/svg+xml') return 'image/png';
    if (v === 'image/webp') return 'image/webp';
    return 'image/jpeg';
  }

  /** data URL → File：交给站点自己的 file input 时要用 */
  function tgDataUrlFile(dataUrl, mime, name) {
    const p = String(dataUrl).split(',');
    const bin = atob(p[1] || '');
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], name || 'tower.gif', { type: mime || 'image/gif' });
  }

  /** 站点「修改」点完会自己弹一个 <input type=file> 的系统选图框。
   *  在点它之前劫持一下 HTMLInputElement.prototype.click：
   *  文件框一旦被 click()，我们就把已经选好的 GIF 直接塞进去并派发 change，
   *  站点自己的上传逻辑照常跑（会写出 .gif 的 Cover，刷新后还是动图），
   *  用户不用再在系统选图框里挑第二次。 */
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

  /** GIF 动图：借小圣杯自己的「修改」上传通道。
   *  我们自己 PUT 到 OSS 的 .jpg 路径刷新后会被当成静态图（只剩第一帧），
   *  站点自己的上传才会写出 .gif 的 Cover 并保留动画。
   *  优先级：站点现成的 file input → 劫持「修改」弹出的选图框 → 兜底自传。 */
  function tgSiteGifUpload(target, out) {
    const docs = [];
    const td = (target && target.doc) || null;
    if (td) docs.push(td);
    for (const d of allDocs()) if (!docs.includes(d)) docs.push(d);
    let input = null, btn = null;
    // 我们自己的工具条也长在塔图弹窗里，按钮文字同样是「修改」：
    // 不排除的话会点到自己的键，重新打开裁剪浮层（别人的塔永远传不上 GIF）。
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
    // 先关掉我们的浮层：它是 top-layer 模态，会挡住站点的选图框
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
      // 钩子没接住（站点不是用 input.click() 打开的）才提示手动再选一次
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
    // 签名时用真实 MIME，但对象 key 只能是 .jpg：站点签名绑的就是这个 key，
    // 换成 .gif 去 PUT 会被 OSS 判签名不匹配（HTTP 403）。
    // 所以 GIF 不能走这条直传——它由「小圣杯自己的修改」上传，才会写出 .gif 的 Cover。
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

  // ---------- 自建 3:4 裁剪浮层 ----------
  /** 和 h() 一样，但节点直接建在指定文档里：canvas 跨文档 adopt 会丢位图，避免留坑 */
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
      // 原生模态 dialog 必须先 close()，再移除；否则 top layer / inert 可能残留
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
    // LINK 另一半也必须是自己的塔，才给「同时更换」；别人的 LINK 圣殿不碰
    const partnerMine = !!(opts && opts.partnerMine) && !!link;
    // 一律挂最外层文档：视野最完整，也不会被 iframe 尺寸裁掉。
    // 站点弹窗可能在别的文档 / 更高层级的 iframe 里，光调 z-index 压不住，
    // 由 tgHidePopups() 在裁剪期间把它隐身，关闭时还原。
    const cropDoc = HDOC;
    gxStyle(cropDoc);
    const mkSt = () => ({
      img: null, fit: null, box: null, drag: null,
      outMime: 'image/jpeg', rawDataUrl: '', rawMime: '', rawFile: null,
      // GIF / APNG：canvas 只能取一帧，交给站点自己的上传通道（保住动画）
      animated: false, rawUrl: '',
      // 「图片地址」框里那串 URL：srcUrl = 提交用的规范地址，srcRaw = 用户给的原样地址（预览用）
      srcUrl: '', srcRaw: '',
      // 用户有没有动过裁剪框：没动过就按原地址提交，画质不损失
      touched: false,
      // 小圣杯自己的封面地址：只做「原地址提交」，不给裁剪（CDN 没有 CORS 头）
      urlOnly: false,
    });
    const SIDES = { self: mkSt(), link: mkSt() };
    const st = SIDES.self;
    // LINK 卡的真实几何：左半 243 宽在 x=0 + 右半 243 宽在 x=189（重叠 54），
    // 合成 432×320。所以框选比例取 432:320（27:20），两半各取 9/16 宽、
    // 左边靠左、右边靠右（重叠 12.5% = 54px），切出来贴上去才严丝合缝。
    const RATIO = link ? 432 / 320 : 0.75; // 宽 / 高
    let curHalf = 'left';            // 本塔用左半还是右半

    /** OSS 路径 / 相对地址 → 可直接显示的原图地址 */
    const normCover = (u) => {
      const raw = String(u || '');
      const m = raw.match(/cover\/[A-Za-z0-9_-]+\.(?:jpe?g|png|gif|webp)/i);
      if (m) return TGT_OSS + m[0];
      return raw.replace(/^\/\//, 'https://');
    };

    // LINK 模式：只选一张拼图，框好区域后按中线切两半，这里只决定「本塔用哪一半」
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

    /** 裁剪框对应到原图上的像素范围，以及最终输出尺寸（LINK 模式按「一半」算） */
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
        // 每半 = 框宽 * 9/16（56.25%），两张等大，且天然重叠 12.5%（54px）
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
        // 3:4 原图、框又拉满时直接传原文件字节，一次重编码都不做
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

    /** LINK 模式：切换「本塔用左半 / 右半」 */
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
      // LINK 模式：只留一条细粉色判定线，其余网格 / 白框 / 文字 / 把手全部不要。
      // 线的位置随「本塔用左半 / 右半」移动，正好是所选那半的边界：
      // 选左半 → 56.25%（左半的右边缘）；选右半 → 43.75%（右半的左边缘）。
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
      // 普通裁剪：留淡淡的九宫格 + 白框 + 右下角把手，方便对位
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

    /** 载入一张图到指定一侧；resolve 出「有没有真的拿到像素」
     *  （小圣杯的封面 Bucket 只认自家站点，从 bgm 页面取会 403，这时候只能原地址提交） */
    const load = (src, cross, side) => new Promise((resolve) => {
      const dst = side || st; // 记下这一次要写入哪一侧，避免切页签后把图写到另一边
      const Img = (cropDoc.defaultView && cropDoc.defaultView.Image) ||
        (HDOC.defaultView && HDOC.defaultView.Image) || window.Image;
      const im = new Img();
      if (cross) {
        im.crossOrigin = 'anonymous';
        // 有的图床只放行空 Referer：带上 bgm.tv 会被防盗链挡掉
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
        // 小圣杯封面的「地址提交」模式：只预览，不画裁剪框（裁剪框画了也用不上）
        if (st.urlOnly) { draw(); refreshTip(); resolve(true); return; }
        sizeBox(Number(range.value || 100) / 100);
        refreshTip();
        resolve(true);
      };
      im.onerror = () => {
        // 地址来的 GIF 只用于「原地址提交」，预览被跨域拦了也不影响换图
        if (dst.animated && dst.rawUrl) {
          tip.textContent = '预览被跨域拦住了，地址已记录，可以直接点「确定并更换」';
          resolve(false);
          return;
        }
        // 静态图同理：像素取不到也照样能把地址交上去（「从动图换回图片」就靠这条）
        tip.textContent = dst.srcUrl
          ? '这串地址在本地读不到像素（小圣杯封面只对自家站点开放），' +
            '但地址已记下，点「确定并更换」会直接按原地址提交'
          : '图片加载失败，换一张或改用本地文件';
        resolve(false);
      };
      im.src = src;
      if (im.complete && im.naturalWidth && im.onload) im.onload();
    });

    /** 「图片地址」框里的一串 URL → 当前状态（并加载预览）。
     *  resolve 出「像素能不能用」：GIF / 防盗链的封面都是 false，那种情况按原地址提交。
     *  注意存两份：`srcUrl` 是提交用的规范地址（剥掉样式参数），预览用用户给的原始地址
     *  —— 右键复制出来的带 `?x-oss-process=...` 能在浏览器里打开，剥掉的裸地址反而 403。 */
    const applyUrl = (v, wait) => {
      const raw = tgNormCover(String(v || '').trim());
      if (!raw) return Promise.resolve(false);
      const dst = st;
      const canon = tgCanonCover(raw);
      const u = canon || raw;
      dst.srcUrl = u;
      dst.srcRaw = raw;
      // 小圣杯自己的封面：只做「原地址提交」，不给裁剪
      // （CDN 没有 CORS 头，canvas 读像素会污染；而且原图本来就该原样提交）
      dst.urlOnly = !!canon;
      const gif = isGifUrl(u);
      dst.animated = gif;
      dst.rawUrl = gif && !/^data:/i.test(u) ? u : '';
      dst.rawDataUrl = gif && /^data:/i.test(u) ? u : '';
      dst.rawFile = null;
      dst.rawMime = gif ? 'image/gif' : '';
      dst.outMime = gif ? 'image/gif' : tgOutMime(guessMime(u));
      // 预览用 CDN 那个能打开的地址；它不是小圣杯封面时才带 crossOrigin（要读像素裁剪）
      const preview = canon ? tgCdnCover(canon) : raw;
      const p = load(preview, canon ? false : !/^data:/i.test(raw), dst);
      // GIF 不等解码（提交的是原地址）；静态图要等，好判断像素到底能不能用
      return (gif || canon) ? Promise.resolve(false) : p;
    };

    /** 点「确定并更换」前兜一层：地址框里有值但还没按过回车，也要先记进状态，
     *  否则会白报「请选择图片」。已经读过像素的不重复读；读过但没读到的允许再试一次。 */
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

    /** 本地文件（选图 / 拖拽 / 粘贴共用）：保留原始字节，供「原文件直传」用 */
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
      // 从网页里直接把 <img> 拖过来时，通常只带 URL
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
    // 粘贴 / 失焦也自动生效：以前只有回车才算，粘完直接点「确定并更换」会白报「请选择图片」
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

    /** 画一块原图区域到指定尺寸的画布，按原格式编码 */
    const renderRegion = (s, rx, ry, rw, rh, ow, oh) => {
      const out = cropDoc.createElement('canvas');
      out.width = ow; out.height = oh;
      const octx = out.getContext && out.getContext('2d');
      if (!octx) throw new Error('浏览器不支持 canvas');
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(s.img, rx, ry, rw, rh, 0, 0, ow, oh);
      // PNG / WebP 不加质量参数（PNG 无损且保留透明），JPEG 拉到质量 1
      const du = s.outMime === 'image/jpeg'
        ? out.toDataURL('image/jpeg', 1)
        : out.toDataURL(s.outMime);
      // 浏览器不支持该格式时会静默回退成 PNG，按实际结果决定上传 MIME
      const realMime = (du.match(/^data:([^;]+);/) || [null, s.outMime])[1];
      return { dataUrl: du, mime: realMime, w: ow, h: oh };
    };

    /** 默认按原图分辨率 + 原格式导出，不再强制缩到 480×640 / JPEG 0.92 */
    const exportData = (s) => {
      s = s || st;
      // 动图：canvas 会丢掉除第一帧以外的所有内容，原样上传才是完整动画。
      // 地址来的图即使预览被跨域拦了也照样能提交，所以这里不要求 img/fit 就绪
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

    /** LINK 模式：把框选区域横向对半切，取左半 / 右半 */
    const exportHalf = (s, which) => {
      s = s || st;
      if (!s.img || !s.fit || !s.box) throw new Error('请先选择图片');
      const o = outSize(s);
      if (!o) throw new Error('请先选择图片');
      const hw = o.halfW || o.sw * (9 / 16);
      // 左半靠左（0~56.25%）、右半靠右（43.75%~100%）：两份等大、重叠 12.5%。
      // 取整到像素：半像素采样会让两张图在接缝处的相位差 0.5px，看起来就是一条细线。
      const rx = which === 'right' ? Math.round(o.sx + o.sw - hw) : Math.round(o.sx);
      const rw = Math.max(2, Math.round(hw));
      return renderRegion(s, rx, Math.round(o.sy), rw, Math.round(o.sh), rw, Math.round(o.sh));
    };

    const ok = tgBtn('确定并更换', '按所选画质导出后上传', async () => {
      ok.disabled = true;
      try {
        // 地址框里有值但没按过回车：先记进状态，别让「确定」白报「请选择图片」
        try { await ensureUrl(); } catch (e) {}
        // ---- LINK 模式：一张拼图切两半，本塔拿选中的那半，另一半（可选）给 LINK 塔 ----
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
        // 地址框里是一张小圣杯自己的封面（cover/<hash>.ext）时，一律「原地址提交」：
        // 站点自己存的就是裸 cover/<hash>.ext，页面里那张带样式的只是 CDN 上给浏览器看的。
        // 这样画质不损失、GIF 动画保住，「从动图换回静态图」也不会再白报「还没选图」。
        const canonSelf = tgCanonCover(selfSide.srcUrl);
        if (canonSelf && !selfSide.animated) {
          tip.textContent = '正在按原地址提交…';
          await tgPostCover(target.cid, target.uid, canonSelf);
          // 注意：**不要**去改弹窗里那张 <img>。新版塔图弹窗里第一个 img 往往是
          // 「封面模糊底图」那一层，把它换成新地址只会让整张卡片糊成一片；
          // 而真正的塔图是站点自己用 canvas 画的，改 src 也刷不新。刷新页面即可看到新图。
          tgToast('塔图已更换（原地址提交），刷新页面就能看到新图');
          tgCropClose();
          ok.disabled = false;
          return;
        }
        if (!selfSide.img && !(selfSide.animated && selfSide.rawUrl)) {
          throw new Error('还没选图：点左边「选择文件」，或在「图片地址」里粘链接');
        }
        const out = exportData(SIDES.self);
        // 自己塔的弹窗一定会渲染 #tg-temple-actions（修改 / 重置 / LINK…）；
        // 用它兜一层，免得「上一次点过别人的塔」留下的 uid 把自家塔误判成别人的
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
          // 地址来的 GIF：不下载、不重编码，直接把原地址交给站点（动画完整保留）
          tip.textContent = '正在提交原图地址…（' + (out.w ? out.w + '×' + out.h : '原图') + '）';
          await tgPostCover(target.cid, target.uid, out.url);
        } else if (out.animated && tgSiteGifUpload(target, out)) {
          // 本地 GIF 已交给小圣杯自己的「修改」上传：站点会写出 .gif 的 Cover，
          // 刷新后仍是动图。我们这边不再上传、也不弹「已更换」（站点自己会提示）。
          ok.disabled = false;
          return;
        } else if (out.animated && target.uid && !ownActs) {
          // 别人的塔：站点不渲染「修改」，也就没有 .gif 上传通道；
          // 工具箱直传只能写 .jpg（写 .gif 会被 OSS 判签名不匹配 → 403），
          // 与其传上去变静态图 / 报 403，不如直接说清楚。
          throw new Error('小圣杯没给别人的塔留 GIF 上传入口（只有自己塔上的「修改」才能传动图），请改用静态图');
        } else if (out.animated) {
          // 自己的塔但没接住站点的选图框：退回静态图直传，别让 zip 到 403
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
          // 只有「本地上传」这种能立刻拿到像素的情况才顺手换个预览图；
          // 地址类（CDN 封面）一律不碰，那张 img 可能是站点的封面模糊底图，换了只会糊一片
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
    // 站点弹窗的层级再高也不能盖住裁剪窗口
    overlay.style.setProperty('position', 'fixed', 'important');
    overlay.style.setProperty('z-index', '2147483647', 'important');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) tgCropClose(); });
    overlay.addEventListener('cancel', (e) => { e.preventDefault(); tgCropClose(); }); // ESC 也走统一关闭
    box.querySelector('.tgtk-crop-x').addEventListener('click', tgCropClose);

    // 拖拽图片到浮窗（黑色画布区域高亮），整个浮窗都可接收，避免边缘漏掉
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
    // 浏览器默认行为会在窗口外放开时跳转页面，顺手挡掉
    overlay.addEventListener('dragover', (e) => e.preventDefault());
    overlay.addEventListener('drop', (e) => { e.preventDefault(); dragOff(); });

    // 截图可直接 Ctrl+V 粘贴进来（只拦图片，文字照常粘到地址框）
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
    // 关键：站点塔图弹窗是原生 <dialog>.showModal()（模态会让对话框外全部 inert），
    // 我们的浮层必须同样进入 top layer，才能真正接收点击，并压在站点 dialog 之上
    try {
      if (typeof overlay.showModal === 'function') overlay.showModal();
      else overlay.setAttribute('open', '');
    } catch (e) {
      try { overlay.setAttribute('open', ''); } catch (err) {}
    }
    // 站点若用 inert 做焦点隔离，浮层会被连带禁用（可见但点不动），这里主动清掉
    try { overlay.inert = false; overlay.removeAttribute('inert'); } catch (e) {}
    TGT.crop = { overlay, st, doc: cropDoc };
    tgHidePopups();
    if (!ctx) tip.textContent = '当前环境无法绘制画布，请换个浏览器';
  }

  /* ================= v51：旧版个人页排版 / ICO 增强 / 股息预测 ================= */

  /** 旧版个人圣殿页：按「实际一行几个」把每页条数凑成整行。
   *  站点接口是 chara/user/temple/{用户名}/{页}/{每页条数}，默认 24；
   *  7 列时 24 = 3 整行 + 3 个，右下角空 4 格 —— 改成 28 刚好 4 整行。
   *  不猜也不重排：只把默认的 24 换掉，站点自己的分页 / 缓存 / 排序全都照旧。 */
  function gxUserPerPage(win) {
    try {
      const d = win.document;
      const grail = d.querySelector('#grail');
      if (!grail) return 0;
      if (grail.__tgtkPer != null) return grail.__tgtkPer; // 同一个弹窗里只算一次，翻页不会变
      const list = grail.querySelector('.temple_list');
      if (!list) return 0;
      // 圣殿 tab 一进来是隐藏的（默认停在「连接」页），拿不到宽度就退回 #grail 的宽度
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
      // .grail_list 右边距是 -15px，实际可用宽度已经算在 clientWidth 里了；
      // 减 1px 是为了避开四舍五入把 7 列算成 8 列（8 列时条数仍是 24，等于不生效）
      const per = Math.max(2, Math.floor((w - 1) / cw));
      const size = per * Math.ceil(24 / per);
      grail.__tgtkPer = size;
      return size;
    } catch (e) {
      return 0;
    }
  }

  /** 把默认的 /24 换成整行条数：每份 jQuery 只装一次 prefilter */
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
            // 只改「个人页 → 圣殿 tab」这一路（URL 以 /24 结尾）；带 ?keyword= 的搜索列表不动
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

  /* -------------------- 个人页圣殿置顶 --------------------
   * 个人页「圣殿」tab 是分页的（每页 24 座），置顶的塔多半排在很后面的页里、DOM 里根本没有，
   * 所以不能靠重排 DOM。做法是在**数据层**动手：
   *   · 把自己的塔拉一份完整队列（1 次请求，gzip 后一两百 KB～1MB，缓存 5 分钟）；
   *   · 按「置顶在前、其余保持站点原顺序」重新排好；
   *   · 站点要第 N 页，就从这份队列里切出对应的 24 座还给它。
   * 每页仍然是 24 座：第 1 页不会被撑大，后面的页也不会出现被挖走的空洞。
   * 站点照旧用它自己的卡片组件渲染，样式 / 点击 / 页码 / 总数全都不变。
   */

  /* ---- 置顶名单 / 开关 / 每行几个：单独存一个键 ----
   * 不能塞进 S（整块设置）：旧版页、新版页、iframe 各有一份内存副本，谁点一下标签页就把整块写回去，
   * 另一头刚加的置顶就被旧副本抹掉了 —— 表现就是「换个版本看，置顶和每行个数全没了」。 */
  const TUI = { pins: [], bots: [], on: true, cols: 4, ts: 0 };
  let tuiUiRefresh = null; // buildUI 里挂上：名单 / 列数从别处变了就刷新面板
  // 云设置（chiiApp.cloud_settings）的状态；tuiSave 会用到，所以先声明
  let cldReady = false; // 拉过一次之后才允许往回写，避免启动时把云端盖成空
  let cldPushTimer = 0;
  let cldStatEl = null;
  let cldStatMsg = '';

  /** 只留合法 ID 并去重（置顶 / 置底名单都过这一道） */
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
  /** bump=false 用于「刚从别处（云端 / 同步码）拿到的数据」：保持对方的 ts，也不往上推 */
  function tuiSave(bump) {
    if (bump !== false) TUI.ts = Date.now();
    try {
      localStorage.setItem(LS_TUI, JSON.stringify(TUI));
    } catch (e) {}
    if (bump !== false) cldPushSoon();
  }
  if (!tuiRead()) {
    // 旧版把名单 / 列数存在设置块里，迁移一次。
    // 这里不盖 ts：本机是「初次成型」，让云端的名单有机会赢（换设备的主要场景）
    tuiApply({ pins: S.templePins, on: S.templePinOn, cols: S.templeCols });
    tuiSave(false);
  }
  try {
    // 另一个标签页（旧版 / 新版）改了：跟着刷新，别各写各的
    window.addEventListener('storage', (e) => {
      if (!e || e.key !== LS_TUI) return;
      if (tuiRead() && tuiUiRefresh) tuiUiRefresh();
    });
  } catch (e) {}

  /* ---- BGM 组件云设置（chiiApp.cloud_settings）：置顶名单 / 每行个数跟着账号走 ----
   * 这个库只存在于 Bangumi 的组件环境（油猴 / 独立站没有），拿不到就静默跳过。
   * 云端存一个 JSON 字符串，带 ts 做仲裁：谁更新用谁的，避免两台设备互相覆盖。
   * 注意：停用组件时 Bangumi 会删掉这里的数据，所以它只是「自动同步」，不是备份。 */
  const CLD_KEY = 'tgtk_templeui';

  /** 组件 SDK 可能出现的位置：组件自己那个 iframe 的 window（最常见）、顶层、任意同源子框架，
   *  也可能是被包一层后留在脚本作用域里的自由变量 chiiApp（这种在 window 上根本看不到）。 */
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
      // 正常是 getAll；万一这版 SDK 只给了 get(key)，也能用
      if (typeof cs.getAll === 'function' || typeof cs.get === 'function') return cs;
    } catch (e) {}
    return null;
  }

  let cldWhere = '';
  function cldPick() {
    // ① 作用域里的自由变量：组件被包成函数时 chiiApp 是参数，不挂在 window 上
    try {
      if (typeof chiiApp !== 'undefined') {
        const cs = cldFromApp(chiiApp);
        if (cs) {
          cldWhere = 'chiiApp';
          return cs;
        }
      }
    } catch (e) {}
    // ② 各窗口上的 window.chiiApp
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

  /** 查不到时留一份「为什么查不到」，方便在控制台定位（不弹窗、不打扰） */
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

  /** 失败后悄悄重试几次（组件 SDK 有时比脚本晚一点注入）；
   *  状态行保持已经写好的结论不动，重试成功才改写，免得先「连接中…」晃十几秒 */
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

  /** 启动时拉一次：云端更新就采用，本机更新就推上去 */
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
      // 读不到就先别往回写，免得把云端盖成本机这份
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
  /** 记下角色名：置顶行刷新后要显示名字，不能只靠 nameCache（刷新就没了） */
  function pinNameSet(cid, name) {
    const id = String(cid || '');
    const nm = String(name || '').trim();
    if (!/^\d+$/.test(id) || !nm || pinNames[id] === nm) return;
    pinNames[id] = nm;
    pinSaveSnaps();
  }
  const pinNameGet = (cid) => pinNames[String(cid)] || nameCache[String(cid)] || '';

  /** 置顶名单：顺序就是个人页里的显示顺序 */
  function pinList() {
    return TUI.pins.slice();
  }
  function pinHas(cid) {
    return TUI.pins.indexOf(String(cid)) >= 0;
  }
  /** 置底名单：不分先后，统一排到整份名单的最末尾（= 最后一页的最后一个） */
  function botList() {
    return TUI.bots.slice();
  }
  function botHas(cid) {
    return TUI.bots.indexOf(String(cid)) >= 0;
  }

  /** 同步码 / 云同步里的置顶名单：
   *  本地是空的 → 原样照抄（换设备的主要场景）；
   *  两边都有 → 取并集，本地顺序不动，新的按对方的顺序追加在后面（不覆盖本机已有的排列）。 */
  function mergeIdList(incoming, which) {
    const bots = which === 'bots';
    // 同一个角色不会既置顶又置底：置顶优先，置底那边就不再收
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
      // 置顶那份进来之后，把置底里重复的剔掉
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
  /** 个人页要不要按工具箱的名单重排：置顶（开关打开且有名单）或置底（有名单）任一成立 */
  function pinOn() {
    return (TUI.on && TUI.pins.length > 0) || TUI.bots.length > 0;
  }
  /** 我到底有没有这座塔。先看已经拉过的全量队列（不发请求），认不出我是谁再拉一次；
   *  全都拿不到时返回 null —— 这时不做拦截，免得把正常的置顶误判成「没塔」。 */
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

  /** 存快照。站点卡片读的字段都在返回对象里，所以整份存下来最稳（别只挑几个字段） */
  function pinSnapSet(cid, obj) {
    const id = String(cid || '');
    if (!/^\d+$/.test(id) || !obj || !obj.CharacterId) return;
    // 顺手记名字：有些返回里 Name 是空的，列表就只剩 #id 了
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

  /* ---- 全量队列：只拉一次，之后翻页零请求 ---- */
  const pinAll = { user: '', at: 0, items: null, busy: null, busyUser: '', failAt: 0 };
  const PIN_ALL_TTL = 5 * 60 * 1000;

  function pinAllGet() {
    if (!pinAll.items) return null;
    const me = selfKeyCache || guessedUsername();
    // 用户名有时读不到（组件在 iframe 里、徽章还没渲染）：这时只要队列拉过就先用着，
    // 别因为「认不出我是谁」让置顶整体失效
    if (me && pinAll.user !== String(me).toLowerCase()) return null;
    if (Date.now() - pinAll.at > PIN_ALL_TTL) return null;
    return pinAll.items;
  }

  /** 按 100 一页并发补全（服务端把单页截短 / 大页请求失败时用） */
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

  /** 拉自己的全部圣殿（一次 10000 条；上万座再补几页）。只读，不改站点数据。 */
  function pinAllLoad(force) {
    if (!force) {
      const hit = pinAllGet();
      if (hit) return Promise.resolve(hit);
      if (pinAll.failAt && Date.now() - pinAll.failAt < 60000) return Promise.resolve(null);
    }
    if (pinAll.busy) return pinAll.busy;
    const p = (async () => {
      // 用户名可能还没就绪（组件挂在 iframe / 徽章没渲染）：这里 await 一下，
      // 以前直接 guessedUsername() 拿空串就去请求，一次失败还会把 60 秒内的重试全挡掉
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
        // 超过 1 万座才会多页；最多再补 4 页（5 万座），再多就不折腾了
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
        // 服务端把单页截短了（返回条数 < 总数）：按 100 一页重拉一遍。
        // 用半截队列去改站点分页会让第 2 页之后全是错位 / 空洞。
        if (total && items.length < total) {
          const full = await pinLoadPaged(key, total);
          if (full.length > items.length) items = full;
        }
        // 并发 / 重试可能带回重复项，按角色 ID 去重
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
        // 顺手把置顶 / 置底项的快照刷新（工具箱列表要显示名字 / 固资 / 缩略图）
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

  /** 置顶在前、其余保持站点原顺序。
   *  全量队列里找不到这一座（接口截断 / 新塔还没进队列）时用快照补上去 ——
   *  否则「置顶」看起来就是没生效。 */
  function pinOrdered(all) {
    const used = Object.create(null);
    const head = [];
    // 置顶开关关掉时只跳过「置顶」，置底照常生效
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
    // 置底：从中间队列里摘出来，整段挪到最末尾 —— 分页切片之后自然落在最后一页的最后一个
    if (TUI.bots.length) {
      const tail = [];
      TUI.bots.forEach((cid) => {
        const at = rest.findIndex((x) => x && String(x.CharacterId) === cid);
        if (at >= 0) {
          tail.push(rest[at]);
          rest.splice(at, 1);
          return;
        }
        // 队列里没有（接口截断 / 刚建的塔）：拿快照补，别让「置底」看起来没生效
        const snap = pinSnapGet(cid);
        if (snap) tail.push(snap);
      });
      return head.concat(rest, tail);
    }
    return head.concat(rest);
  }

  /** 从 URL 认出「我的塔列表」这一路；带 keyword 的单条查询不动 */
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

  /** 只改「我自己」的列表：别人的页面、未登录时一律不碰 */
  function pinIsMe(u) {
    if (!u) return false;
    const me = selfKeyCache || guessedUsername();
    if (me) return String(u).toLowerCase() === String(me).toLowerCase();
    // 认不出自己（iframe / 徽章没渲染）时，退一步信全量队列那次请求用的用户名
    return !!pinAll.user && String(u).toLowerCase() === pinAll.user;
  }

  /** 记下每一页最终长什么样：卡片上挂置顶按钮时靠它把 DOM 对回角色 ID */
  const pinPages = Object.create(null); // { [page]: { items, at } }
  function pinRemember(value, info) {
    try {
      if (value && Array.isArray(value.Items) && info) {
        pinPages[info.page] = { items: value.Items.slice(), at: Date.now() };
      }
    } catch (e) {}
  }

  /** 就地改写 Value。返回 true 表示动过 */
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

  /** 对象版（XHR 的 response 已经是 JSON 时用），返回新对象或 null */
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

  /** 文本版（fetch / XHR 的 responseText），返回新文本或 null */
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

  /** XHR 实例上装 responseText / response 的改写（jQuery、axios 都走 XHR） */
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

  /** 给一个 window 装钩子：fetch 和 XMLHttpRequest */
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
                    // 全量队列还没到就先补一次，这样第一屏就是准确的分页
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
            // 全量还没到：等它一下再发车，否则这一页会出现「置顶没生效 / 页尾空缺」
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

  /* ---- 快照补齐：只查「置顶的那几个」，不拉全量 ---- */
  let pinSnapBusy = false;
  let pinSnapAt = 0;
  let pinKickAt = 0; // 「快照缺失就补一次」的节流，1 分钟最多一次
  const pinTried = Object.create(null); // 查过一次没查到就歇 5 分钟，免得一直空转
  function pinRefreshSnaps(force) {
    // 置底的那几座也要快照：既要在工具箱列表里显示名字，也要能兜底排到最后
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

  /* ---- 名单操作 ---- */
  let pinUiRefresh = null; // buildUI 里挂上，操作后刷新「置顶顺序」列表
  const pinNameTried = Object.create(null); // 名字只补一次，补不到就算了

  /** 置顶 / 取消置顶。obj 有值就顺手存快照（从列表里点的时能带上整份数据） */
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
    // 同一个角色不能既置顶又置底：置顶优先
    if (on && TUI.bots.indexOf(id) >= 0) TUI.bots = TUI.bots.filter((x) => x !== id);
    tuiSave();
    if (on) pinRefreshSnaps();
    if (pinUiRefresh) pinUiRefresh();
    return on;
  }

  /** 置底 / 取消置底（置底不分顺序，只决定「排到最后一个」） */
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
    // 置底优先：原来在置顶名单里的，挪过来
    if (on && TUI.pins.indexOf(id) >= 0) TUI.pins = TUI.pins.filter((x) => x !== id);
    tuiSave();
    if (on) pinRefreshSnaps();
    if (pinUiRefresh) pinUiRefresh();
    return on;
  }

  /** 上移 / 下移一位 */
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

  /** 拖拽排序：把 from 挪到 to 的前面（before=true）或后面 */
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

  /** 给一行接上拖拽：只有按住「⋮⋮」才算拖，点名字 / 按钮不会误拖 */
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
      // 贴到列表上下边缘时自动滚动，长名单也能一口气拖到底
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

  /* ---- 个人页卡片：悬停浮出置顶按钮 ---- */

  /** 卡片上的按钮要放在站点自己的文档里，样式也得跟着注入那份文档（HDOC 的样式表够不到） */
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

  // 一枚小图钉：静态 SVG，跟着文字颜色走
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
      // 新版卡片：塔图挂在内层 div 的 background-image 上
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

  /** 全量列表的「封面哈希 → 角色 ID」索引：没拦到这一页的响应时也能认人 */
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

  /** 封面哈希 → 角色 ID：新版卡片是背景图，没有 data 属性时靠这个认人 */
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

  /** 按顺序对齐：站点拿到的 Items 就是这一格格渲染出来的，卡片个数对得上就按位置认 */
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

  /** 卡片里「塔图」那一块：置顶按钮要贴在画面上，
   *  不能贴整张卡片的下沿 —— 那里是等级勋章和角色名（v67 的坑）。 */
  /** 卡片里「塔图」那一块：挑面积最大的那块「画面」（背景图 / <img> / <canvas>），
   *  不能只看 URL 里有没有 /cover/ —— 用默认立绘的塔是 lain.bgm.tv/pic/crt/...，
   *  以前认不出来就退回「卡片底部」，正好压在等级行上。
   *  v2.3.25：GIF 动图改成 <canvas> 逐帧画，必须也算「画面」，否则整张卡当容器，
   *  按钉会掉到塔图下面去。 */
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
      // 背景图写在 CSS 类里（没有内联 style）时的兜底：只量面积够大的那几块
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

  /** 卡片里的「名字那一行」：旧版是 .name / 角色链接，新版是名字文本块 */
  function pinNameBox(card) {
    try {
      const el = card.querySelector && card.querySelector('a[href*="/character/"], .name, .title');
      if (!el || !el.getBoundingClientRect) return null;
      const r = el.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      // 命中的是包住整张卡的大块（比如 .title 是个集装箱）就当作没找到
      if (!r.height || r.height > cr.height * 0.5) return null;
      return r;
    } catch (e) {}
    return null;
  }

  /** 这块「画面」是不是动图：新版把 GIF / APNG 画在 <canvas> 上，
   *  左下角还会盖一个站点自己的播放键 —— 按钉要让到右下角，
   *  不然会被播放键压住（静态图仍是 <img>，不受影响）。 */
  /** 这块「画面」里的动图画布（新版 GIF / APNG 逐帧画在 canvas 上）。 */
  function pinCanvasIn(box) {
    try {
      if (!box || !box.querySelector) return null;
      const cv = box.querySelector('canvas');
      return (cv && cv.width && cv.height) ? cv : null;
    } catch (e) { return null; }
  }

  function pinPillFor(card, cid) {
    let pill = card.querySelector ? card.querySelector('button.tgtk-pinpill') : null;
    // 认出来的塔图容器缓存住：每 900ms 对 200+ 张卡重算 rect 太浪费
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
      // 关键样式写在行内：站点再怎么改自己的 button 样式也压不掉
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
      // 塔图重绘过、或者上一轮还挂在卡片上：挪进画面里
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
    // 定位：静态图贴左下角；动图（canvas + 站点播放键）改贴右下角。
    // 认不出塔图就吊在名字行上方
    try {
      if (box) {
        const cv = pinCanvasIn(box);
        if (cv) {
          // 画布可能没有独立的封面容器（直接挂在整张卡里）：按画布自己的矩形摆，
          // 否则按钮会落到卡片底部（等级 / 名字那一行）
          const br = box.getBoundingClientRect();
          const r = cv.getBoundingClientRect();
          const db = Math.max(0, Math.round(br.bottom - r.bottom));
          const dr = Math.max(0, Math.round(br.right - r.right));
          pill.style.top = 'auto';
          pill.style.bottom = (db + 4) + 'px';
          // GIF 左下角有站点自己的播放键，改贴画布右下角
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
          // 连名字行都量不到：抬到卡片底部往上 30px，至少不会压在等级 / 名字那一行
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
      // 旧版个人页：圣殿 tab 里的 .temple_list
      try {
        d.querySelectorAll('#grail .temple_list .item').forEach((card) => {
          const cid = pinCardCid(card) || pinCidByCover(pinCoverKey(pinCardCover(card)));
          if (cid) pinPillFor(card, cid);
        });
      } catch (e) {}
      // 新版个人页：头像弹窗里的圣殿网格（和 4/5/6 列用的是同一个判定）
      try {
        for (const host of d.querySelectorAll('#tg-user-tinygrail, #tg-modal')) {
          for (const g of host.querySelectorAll('div.grid.w-full.gap-4')) {
            const first = g.firstElementChild;
            if (!first || !first.classList || !first.classList.contains('min-w-0')) continue;
            const n = g.children.length;
            // 只认「和某一页的圣殿对得上」或带塔主信息的网格，别给人物 tab 挂错
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

  /* ---- 轻量浮层提示（面板没打开时也能用） ---- */
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

  /* ---------- 旧版「[股息预测]」：把 alert 改成新版那种弹窗 ---------- */

  /** 站点把 click 直接绑在 #testButton 上，这里在捕获阶段先拦下来 */
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
    // showModal 会把焦点丢给第一个可聚焦子元素（关闭键），那一圈黑框很难看；改让弹窗自己接焦点
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
        // 环形图：粉色 = 税后（占 (税后/预期) 的角度），蓝色 = 个税
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

  /* ---------- 旧版 ICO：一键填入「升到下一级」还差的金额 ---------- */

  /** 升到下一等级还差多少钱：优先读页面上的「投入₵X」，读不到再按等级门槛算 */
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
    // 旧版门槛：600,000 起，每级再 +(级数+1)² × 100,000
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

  /** 旧版 ICO 页：在「发行价：₵xxx」后面补一句「上市 LvN」（按当前 ICO 等级查对照表）。
   *  ICO 等级和上市后的角色等级不再一一对应（1→2、2→4、3→5…），看这一句最省事。 */
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
        // 塞进「发行价」那一行末尾：找含「发行价」的最小元素
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

  /* ---------- ICO：注资金额悬停看「预计获得股数」 ---------- */

  function gxIcoPrice(box) {
    let t = '';
    const head = box.querySelector('#tg-ico-box-header') || box.querySelector('.predicted');
    if (head) t = head.textContent || '';
    if (!/发行价/.test(t)) t = box.textContent || '';
    const m = /发行价\s*[：:]?\s*[₵¥]?\s*([\d,]+(?:\.\d+)?)/.exec(t);
    const p = m ? num(String(m[1]).replace(/,/g, '')) : 0;
    return p > 0 ? p : 0;
  }

  /** 鼠标是不是还停在这个元素上（取不到 hover 时保守认为还在，别把悬停态抢掉） */
  function tgHovering(el) {
    try {
      if (!el || !el.matches) return true;
      return !!el.matches(':hover');
    } catch (e) {
      return true;
    }
  }

  /** 记下「原文金额 → 预计股数」。money 必须是真金额：
   *  悬停时元素里显示的是「+N股」，绝不能反过来当成金额再算一遍，
   *  否则每轮 tick 都会拿股数去除发行价，数字越滚越小（v51 初版的 bug）。 */
  function tgMarkShares(el, money, shareText) {
    try {
      if (!el || !el.getAttribute) return;
      if (!money || /股/.test(money)) return;
      if (el.getAttribute('data-tgtk-money') === money && el.getAttribute('data-tgtk-shares') === shareText) return;
      el.setAttribute('data-tgtk-money', money);
      el.setAttribute('data-tgtk-shares', shareText);
      // 正在悬停时不要抢回原文，等鼠标移开再还原
      if (!el.classList.contains('tgtk-share-on')) el.textContent = money;
    } catch (e) {}
  }

  /** 悬停金额的形状：参与者徽标一律是「+数字」，账户余额 / 等级 / 名次不会以 + 开头，
   *  所以只认这个前缀，避免把页面上其它数字也换成股数。 */
  const TG_BADGE_RE = /^[+＋]\s*\d[\d,]*(?:\.\d+)?\s*$/;
  const TG_MONEY_RE = /^[+＋]?\s*[₵¥]?\s*\d[\d,]*(?:\.\d+)?\s*$/;

  /** 往上找最近的「含发行价」的 ICO 容器 —— 新版换 id / 换类名也照样能认出来 */
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
    // 头部和参与者列表不在同一棵子树时，退回文档里第一处「发行价」
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

  /** 事件路径（含 shadow DOM 的 composedPath），只留元素节点 */
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

  /** 把「金额 → 预计股数」记到节点上并临时换字 */
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
      // 捕获阶段：站点在 mouseover 上 stopPropagation 也拦不住我们
      doc.addEventListener('mouseover', function (e) {
        const path = tgSharePath(e);
        // 1) 已经标过的节点（心跳预标记的徽标 / 「已注资 ₵X」包出来的 span）
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
        // 2) 兜底：页面结构变了（换了 id / 类名 / 没了 data-*）时，按「+数字」叶子节点直接认
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

  /** 把 root 里第一处匹配的文本包成 <span>，好挂悬停 */
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

  /** 找「已注资 ₵X」这段文字并包出金额节点：新旧版的容器 id / 结构都不同，
   *  直接按文字找最稳。已经包过就复用同一个节点，避免重复包层。 */
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

  /** 兜底：整个文档里找「已注资 ₵X」这种整段文字，把金额那段包成可悬停的 span。
   *  只在能找到「发行价」的 ICO 容器里做，免得把用户资产页的「已注资：」也包了。 */
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
      // 上面 enter 会立刻换成「+N股」，包完先还原成金额，等鼠标移上去再换
      if (span) tgShareLeave(span);
    }
  }

  /** 每轮心跳复核所有标记过的节点：股数跟随发行价变化、站点重绘后重新认金额、
   *  mouseout 被吞掉时自愈还原。 */
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
      // 站点把节点整块重绘了：文字既不是原金额也不是股数
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

  /** 新版挂载点 / 版本换过 id 时会找不到 #tg-ico-box，所以再用「参与者行」反查一次：
   *  只要页面上有带 data-amount / data-rank 的行，往上找含「发行价」的祖先即可。 */
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

  /** 新版金额标签：优先 class=inline-block，再退到「最后一个 +数字 的节点」，
   *  最后兜底遍历整行找任意 +数字 叶子节点（新版换类名也不会漏）。 */
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
      // 不依赖站点结构的兜底：整段「已注资 ₵X」也能悬停
      try { tgWrapInvestAll(d); } catch (e) {}
      const roots = gxIcoRoots(d);
      for (let bi = 0; bi < roots.length; bi++) {
        const box = roots[bi];
        const root = box.root;
        const kind = box.kind;
        const price = gxIcoPrice(root);
        if (!price) continue;
        // 参与者行：前三名 + 自己
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
          // 悬停中显示的是「+N股」，金额要取之前记下的原文，不能读当前文字
          const money = on ? String(el.getAttribute('data-tgtk-money') || '') : String(el.textContent || '').trim();
          if (!money || /股/.test(money)) continue;
          const amt = num(money.replace(/[^\d.]/g, ''));
          if (!(amt > 0) || !isFinite(amt)) continue;
          // mouseout 被吞掉（元素被重绘 / 指针直接跳走）时兜底还原，避免悬停态卡死
          if (on && !tgHovering(el)) {
            el.textContent = money;
            el.classList.remove('tgtk-share-on');
          }
          tgMarkShares(el, money, '+' + fmt(Math.round(amt / price)) + '股');
        }
        // 自己那笔「已注资 ₵X」：按文字定位，新旧版共用一套
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
      // 复核：股数跟着发行价走、站点重绘后重新认金额、mouseout 丢失时自愈
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
              // 点标题行的按钮不算「点外面」（那些是打开浮层的入口）
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
          // ICO 角色还没上市，没有拍卖也没有圣殿，整块不显示
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
          // 新版页面没有 #grailBox，也要能调圣殿尺寸
          gxTempleSize(null);
        }
        // 新版小圣杯（tg-* 页面）：行内拍卖信息 + 各级圣殿数量
        let nrec = gxNewBox();
        if (!nrec) {
          const cid = String(currentCharacterId() || '');
          if (/^\d+$/.test(cid)) {
            for (const d of allDocs()) {
              // 只认新版（tg-* 节点），别在旧版 jQuery 页面上误挂
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
        // 竞拍弹窗：从角色页、英灵殿列表打开的都算，单独扫一遍
        gxNewBidModal();
        gxBonus().catch(() => {});
        gxUserHome();
        gxStarLog();
        tgTempleTools();
        // v51/v53：这些增强各自兜底，任何一个抛错都不会挡住后面的（尤其 ICO 悬停）
        const safeTick = (fn) => { try { fn(); } catch (e) {} };
        safeTick(gxDivHook);
        safeTick(gxUserTempleFill);
        safeTick(gxIcoNextBtn);
        safeTick(gxIcoListedTag);
        safeTick(gxIcoShares);
        safeTick(applyTempleCols);
        // 个人页圣殿置顶：装钩子（fetch / XHR）、给个人页卡片挂悬浮按钮、补快照
        safeTick(pinInstallAll);
        safeTick(pinDecorTick);
        safeTick(pinRefreshSnaps);
        // 右下角工具条里的开关：站点重画 dock 后自己补回去，顺带校正胶囊显隐
        safeTick(mountDockSwitch);
        safeTick(syncFabVisible);
        gxTopWeek().catch(() => {});
      } catch (e) {}
    };
    tick();
    gxTimer = setInterval(tick, 1200);
  }

  /** 文件夹增删改后，重建各个下拉的选项 */
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
    // 默认收藏夹的按钮要显示「清空」而不是「删除」
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

  /* --------------------- 工具箱胶囊的收 / 放 ---------------------
     bgm 右下角那条工具条（官方 id 就是 dock）里挂一个开关：
     点一下把胶囊收起来、再点一下放出来。收起是为了不让它挡住右下角的内容。
     胶囊是唯一入口，所以必须留两条回来的路——开关本身和 Alt+T。
     找不到工具条的页面（比如直接开 tinygrail.com）不提供隐藏：
     没有入口的隐藏等于把人锁在门外。 */

  /** bgm 右下角工具条；没有或还没排好版时返回 null */
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

  /** 按 S.fabHidden 同步胶囊显隐 + 开关的亮灭；页面没有开关入口时强制显示 */
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

  /** 收起 / 放出胶囊；force 省略 = 取反 */
  function toggleFab(force) {
    S.fabHidden = force === undefined ? !S.fabHidden : !!force;
    persist();
    syncFabVisible();
  }

  /** 把开关插进 bgm 右下角工具条；站点重画工具条时下一轮 tick 会自动补回去 */
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
    // 小工具箱图标：stroke 用 currentColor，颜色自动跟随站点工具条的文字色
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
    // 插在「最后一项」之前：站点给 .last 做了右端圆角，挂在末尾会把那块圆角挤掉
    const last = ul.querySelector('li.last') || ul.lastElementChild;
    if (last && last.parentNode === ul) ul.insertBefore(li, last);
    else ul.appendChild(li);
    syncFabVisible();
  }

  function togglePanel(force) {
    // 面板 DOM 若被宿主页面的 ajax / iframe 重建弄丢了，点开时顺手重建
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
      // 面板显示后浏览器可能又异步 autofill 一次，稍后复查
      clearFavAddAutofill();
      setTimeout(clearFavAddAutofill, 160);
      setTimeout(clearFavAddAutofill, 700);
      // 之前在非组件环境（或 SDK 还没就绪）→ 打开面板时再试一次云设置（30 秒内不重复试）
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

  /* ------------------------------ 复制 ------------------------------ */

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

  /** 复制：只导出角色数字 ID（空格分隔），方便直接粘进筛选框 / 收藏的「手动添加」 */
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

  /** 收藏：只导**当前打开的那个收藏夹**里的角色 ID（「全部收藏夹」时按角色去重） */
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

  /* ------------------------------ 样式 ------------------------------ */

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
/* 挂到最外层页面时，避免主站全局样式干扰面板内部布局 */
#tgtk-panel,#tgtk-panel *{box-sizing:border-box}
#tgtk-panel button,#tgtk-fab{font-family:inherit}
.tgtk-line .tgtk-favbtn{margin-left:-2px}
/* 收藏夹快选按钮 + 浮层 */
.tgtk-favbtn{flex:none;width:22px;height:22px;padding:0;line-height:1;border:1px solid var(--tg-line);
  border-radius:6px;background:var(--tg-sunken);color:var(--tg-accent);font:inherit;font-size:12px;cursor:pointer}
.tgtk-favbtn:hover,.tgtk-favbtn:focus{background:var(--tg-hit);border-color:var(--tg-accent);outline:none}
/* 多目标输入框最右边的「清空」：跟输入框同高，弱化成次级按钮 */
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
/* 角色名候选：挂在 body 上的 fixed 浮层，避免被面板 overflow 裁掉 */
.tgtk-sug{position:fixed;z-index:2147483005;width:236px;max-height:264px;overflow-y:auto;box-sizing:border-box;
  padding:4px;background:var(--tg-bg);color:var(--tg-fg);border:1px solid var(--tg-line);border-radius:8px;
  box-shadow:0 10px 32px rgba(0,0,0,.5);font:12px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.tgtk-sughead{padding:3px 6px 5px;color:var(--tg-dim);font-size:10px;border-bottom:1px solid var(--tg-line-soft);margin-bottom:3px}
.tgtk-sugrow{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 6px;border-radius:5px;cursor:pointer}
.tgtk-sugrow:hover,.tgtk-sugrow.tgtk-sugon{background:var(--tg-hit);color:var(--tg-accent-fg)}
.tgtk-sugname{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-sugid{flex:none;color:var(--tg-mute);font-size:10px;font-variant-numeric:tabular-nums}
/* 圣殿置顶 / 置底：这个角色你没有塔，选它不会生效 */
.tgtk-sugtag{flex:none;padding:0 4px;border-radius:999px;background:var(--tg-sunken2);color:var(--tg-mute);
  font-size:9px;line-height:14px}
.tgtk-sugmiss .tgtk-sugname{color:var(--tg-mute)}
.tgtk-sugempty{padding:6px;color:var(--tg-mute);font-size:11px;line-height:1.5}
/* 工具箱胶囊收进 bgm 右下角工具条（#dock）的开关：图标跟工具条文字色，收起时变淡。
   #dock ul 是 flex，所以 li 也照站点的写法用 flex，别用 float/block，否则和旁边的图标对不齐 */
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
/* 收起来时靠 !important 压过上面的 opacity / transition，别留个半透明的影子 */
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
/* 标签栏可横向滑动：加了多少个功能都不撑大面板，窄屏也能左右滑到最后一个。
   flex:0 0 auto 很关键：面板高度到 max-height 时，默认 flex-shrink 会把标签栏
   一起压扁，选中标签的高亮块就会被裁掉半个（道具页内容一多就出现）。 */
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
/* 一键冲星「结束补资」：补满 / 补到 250 / 不补 */
.tgtk-endwrap{flex:1;min-width:0;max-width:230px}
.tgtk-endwrap .tgtk-subtab{display:inline-flex;align-items:center;justify-content:center;
  height:24px;padding:0 6px;border-radius:6px;font-size:11px;line-height:1}
/* 「圣殿」页：每行 4 / 5 / 6 个的分段按钮 */
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
/* 用户名框挪到「塔图」那一行：整组靠右，和左边的勾选框拉开一点距离 */
.tgtk-userwrap{display:flex;align-items:center;gap:6px;flex:1;min-width:150px;margin-left:10px}
#tgtk-user{min-width:80px}
/* 筛选条件右边的勾选：没有文字，只占一个方框 */
.tgtk-chkend{gap:0;margin-left:-2px}
#tgtk-favadd{width:96px}
/* 手动添加：隐藏 type=search 自带的清除按钮；Chrome 一旦自动填充，用守卫动画立即清掉 */
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
/* 「导入小圣杯收藏」的粘贴兜底区 */
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
/* 一键冲星按钮右边的「预计消耗活股」：跟着按钮走，不许把按钮挤换行 */
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
/* 资产卡 */
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
/* 资金 / 股数 / 圣殿 视角切换 */
.tgtk-seg{display:flex;gap:4px;background:var(--tg-sunken);border-radius:7px;padding:3px}
.tgtk-segbtn{flex:1;padding:5px 0;border:0;border-radius:5px;background:transparent;color:var(--tg-dim);font-size:12px;cursor:pointer}
.tgtk-segbtn:hover{color:var(--tg-fg)}
.tgtk-segbtn.tgtk-on{background:rgba(228,111,161,.2);color:var(--tg-accent-fg);font-weight:600}
/* 四象限明细 */
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
/* 一键冲星 */
.tgtk-starbox{margin-top:10px;padding-top:10px;border-top:1px dashed var(--tg-line-soft);display:flex;flex-direction:column;gap:6px}
/* 星光碎片候选列表（按持股排序，不再按等级分组） */
.tgtk-sdlist{display:flex;flex-direction:column;gap:2px;max-height:236px;overflow-y:auto;padding-right:2px}
.tgtk-sdrow{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:5px;background:var(--tg-sunken2);cursor:pointer}
.tgtk-sdrow:hover{background:var(--tg-surface3)}
.tgtk-sdrow.tgtk-on{outline:1px solid var(--tg-accent);background:var(--tg-surface2)}
/* 已在燃料队列里：序号 + 移出，用粉色底和「无活股」区分开 */
.tgtk-mini.tgtk-picked{background:var(--tg-accent);border-color:var(--tg-accent);color:#fff;min-width:64px}
.tgtk-mini.tgtk-picked:hover{filter:brightness(1.1)}
.tgtk-sdzero.tgtk-on .tgtk-mini.tgtk-picked{opacity:1}
/* 0 活股的行：能搜到、能看清，但选不了（持股多半全挂了卖单） */
.tgtk-sdrow.tgtk-sdzero{opacity:.6;cursor:default}
.tgtk-sdrow.tgtk-sdzero:hover{background:var(--tg-sunken2)}
.tgtk-sdmain{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.tgtk-sdmain .tgtk-name,.tgtk-sdmain a{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tgtk-mini{padding:3px 9px;font-size:11px;flex:none}
/* ICO：按剩余时间排列，每行一张小卡片 */
.tgtk-icolist{display:flex;flex-direction:column;gap:4px;max-height:300px;overflow-y:auto;padding-right:2px}
.tgtk-icorow{display:flex;flex-direction:column;gap:3px;padding:6px 8px;border-radius:6px;
  background:var(--tg-sunken2);border:1px solid transparent}
.tgtk-icorow.tgtk-on{border-color:rgba(228,111,161,.45);background:var(--tg-hit)}
.tgtk-icotop{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tgtk-icotop .tgtk-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.tgtk-ico-left{flex:none;color:var(--tg-mute);font-size:11px;font-variant-numeric:tabular-nums}
.tgtk-icosub{color:var(--tg-dim);font-size:10px;font-variant-numeric:tabular-nums;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 上一次自动注资的结论（补款成功 / 人数不够 / 错过） */
.tgtk-icores{color:var(--tg-mute);font-size:10px;line-height:1.45;word-break:break-all}
.tgtk-icoline{display:flex;align-items:center;gap:6px;margin-top:1px}
.tgtk-icoline .tgtk-mute{color:var(--tg-mute);font-size:11px}
.tgtk-icosel{width:74px;padding:3px 6px;font-size:11px}
.tgtk-icohint{flex:none;font-size:11px;line-height:1.6;color:var(--tg-accent-fg);white-space:nowrap}
/* 旧版 ICO 页：发行价后面的「上市 LvN」小胶囊 */
.tgtk-icolv{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;
  background:rgba(228,111,161,.16);border:1px solid rgba(228,111,161,.45);
  color:#c9457d;font-size:11px;line-height:16px;vertical-align:1px;white-space:nowrap}
.tgtk-icoline .tgtk-btn{margin-left:auto}
.tgtk-pick{color:var(--tg-dim);font-size:11px;line-height:1.5;padding:2px;word-break:break-all;
  max-height:96px;overflow-y:auto}
.tgtk-picktxt{display:block}
/* 燃料队列：每只一个可取消的小标签（列表里筛不到它时也能移出） */
.tgtk-sdpicks{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;align-items:center}
.tgtk-sdpick{display:inline-flex;align-items:center;gap:3px;max-width:100%;padding:1px 2px 1px 6px;
  border:1px solid var(--tg-line);border-radius:9px;background:var(--tg-surface2);color:var(--tg-fg2);font-size:10px;white-space:nowrap}
.tgtk-sdpick>span{overflow:hidden;text-overflow:ellipsis;max-width:112px}
.tgtk-sdpick-x{width:16px;height:16px;line-height:14px;text-align:center;border:0;border-radius:8px;
  background:transparent;color:var(--tg-mute);font-size:13px;cursor:pointer;padding:0}
.tgtk-sdpick-x:hover{background:var(--tg-badbg);color:var(--tg-bad)}
.tgtk-sdpick-clear{border:0;background:transparent;color:var(--tg-link);font-size:10px;cursor:pointer;padding:1px 3px}
.tgtk-sdpick-clear:hover{text-decoration:underline}
/* 目标塔那一行：固定在燃料队列上方，替代原来空队列时的提示语 */
.tgtk-picktxt.tgtk-sdtline{color:var(--tg-fg);font-variant-numeric:tabular-nums}
.tgtk-sdsort{min-width:52px;justify-content:center}
/* 「充能」右边的预计固资：跟着按钮一行，不换行、不挤压按钮 */
.tgtk-sdest{flex:none;color:var(--tg-accent-fg);font-size:11px;font-variant-numeric:tabular-nums;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px}
/* 持股等级进度 */
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
/* ===== v2.0：收藏夹分组 / 同步 / 角色页星星（v2.2 改为全部同级） ===== */
.tgtk-favfolder{box-sizing:border-box;width:100%;padding:4px 7px;border-radius:6px;
  border:1px solid var(--tg-line);background:var(--tg-sunken);color:var(--tg-fg);font:inherit;font-size:12px;outline:none}
.tgtk-favfolder:focus{border-color:var(--tg-accent)}
/* 收藏夹分组条：左侧强调色竖条 + 更深底色 + 右侧计数，
   与角色行拉开层次，扫长列表时不会把「夹名」和「角色名」看混 */
.tgtk-favgrp{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:6px;
  margin:6px 0 2px;padding:4px 8px 4px 7px;border-radius:5px;border-left:3px solid var(--tg-accent);
  background:var(--tg-surface2);color:var(--tg-accent-fg);
  font-size:11px;font-weight:700;letter-spacing:.02em;line-height:1.45}
.tgtk-favgrp:first-child{margin-top:0}
.tgtk-favgrp i{flex:none;font-style:normal;color:var(--tg-mute);font-size:10px;font-weight:400;
  font-variant-numeric:tabular-nums}
/* 收藏夹一律用标签列（每个标签可点开「移到别的收藏夹」，多夹时各带一个 ×） */
.tgtk-fchips{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:4px}
.tgtk-fchips i{color:var(--tg-mute);font-style:normal;font-size:11px}
.tgtk-fchip{display:inline-flex;align-items:center;gap:1px;padding:1px 2px 1px 1px;border:1px solid var(--tg-line);
  border-radius:999px;background:var(--tg-sunken);color:var(--tg-fg2);font-size:11px;line-height:1.55}
.tgtk-fchipx{border:0;background:transparent;color:var(--tg-mute);font:inherit;font-size:12px;line-height:1;
  padding:0 3px;cursor:pointer;border-radius:50%}
.tgtk-fchipx:hover{color:var(--tg-bad);background:var(--tg-badbg)}
/* 标签列末尾的「＋」：再收藏到别的收藏夹（虚线描边，和实体夹标签区分开） */
.tgtk-fchipadd{flex:none;display:inline-flex;align-items:center;justify-content:center;height:20px;
  padding:0 7px;border:1px dashed var(--tg-line);border-radius:999px;background:transparent;
  color:var(--tg-mute);font:inherit;font-size:12px;line-height:1;cursor:pointer}
.tgtk-fchipadd:hover,.tgtk-fchipadd:focus{color:var(--tg-accent-fg);border-color:var(--tg-accent);
  background:var(--tg-hit);outline:none}
/* 标签文字本身是按钮：点开「移到别的收藏夹」小下拉 */
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
/* 面板底部的小提示条：收藏成功之类的轻反馈，不放状态行里打扰读数 */
.tgtk-toast{position:absolute;left:50%;bottom:16px;z-index:9;transform:translate(-50%,8px);
  padding:4px 12px;border-radius:999px;background:var(--tg-accent);color:#fff;font-size:11px;
  line-height:1.6;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.35);
  opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease}
.tgtk-toast.tgtk-toast-on{opacity:1;transform:translate(-50%,0)}
/* 个人页圣殿置顶：开关、顺序列表、卡片上的悬浮胶囊、轻提示 */
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
/* 个人页圣殿置底：平时收成一行，点开才展开配置 */
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
/* 卡片上的置顶按钮：样式写在行内，并随卡片所在文档单独注入（见 PIN_CSS） */
.tgtk-pintoast{position:fixed;left:50%;top:18px;z-index:2147483000;transform:translate(-50%,-6px);
  padding:5px 14px;border-radius:999px;background:var(--tg-accent);color:#fff;font-size:12px;
  line-height:1.7;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.32);
  opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease}
.tgtk-pintoast.tgtk-toast-on{opacity:1;transform:translate(-50%,0)}
/* 随手记：标题栏的书本按钮 + 整页记事纸 */
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
/* 星标浮层：取消在最左、确定在最右，左右对称 */
.tgtk-starpop .tgtk-starfoot{justify-content:space-between;gap:6px;padding-top:6px;
  border-top:1px solid var(--tg-line-soft)}
.tgtk-starpop .tgtk-starfoot .tgtk-btn{flex:none;min-width:56px}
.tgtk-starpop .tgtk-starcreate .tgtk-line{gap:5px}
/* 收藏页：所有按钮同一规格、标签定宽，散落的操作收进整齐的工具行 */
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
/* 收藏夹 / 排序两个下拉等宽，视觉上才对得齐（这两个 select 只有 id，没有 class） */
#tgtk-panel .tgtk-favtools #tgtk-favfolder,
#tgtk-panel .tgtk-favtools #tgtk-favsort{flex:0 0 138px;width:138px;max-width:138px}
/* 手动添加：输入框占大头，右边「加到哪个夹」收窄 */
#tgtk-panel .tgtk-favtools .tgtk-favaddline input[type=text],
#tgtk-panel .tgtk-favtools .tgtk-favaddline input[type=search]{flex:1 1 auto;min-width:0;width:auto}
#tgtk-panel .tgtk-favtools .tgtk-favaddline #tgtk-favaddfolder{flex:0 0 104px;width:104px;max-width:104px}
#tgtk-panel .tgtk-favtools input[type=text]{flex:1;min-width:0;width:auto}
#tgtk-panel .tgtk-favtools .tgtk-syncbox .tgtk-line{flex-wrap:wrap}
#tgtk-panel .tgtk-favtools .tgtk-syncbox select{flex:none;width:auto;max-width:190px}
#tgtk-panel .tgtk-favtools .tgtk-syncbox input[type=text]{flex:1;min-width:120px}
#tgtk-panel .tgtk-favtools .tgtk-favpick .tgtk-btn{padding:4px 9px;font-size:11px}
/* 角色收藏浮层：给 input/select 补组件样式消掉浏览器默认黑框，按钮不再实心加粗 */
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
/* 旧版角色页「$」历史交易浮层 */
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
/* 页面居中的弹窗（股权拍卖用大弹窗；往期拍卖用下面的紧凑居中版） */
.tgtk-histpop.tgtk-gxmodal{position:fixed !important;left:50% !important;top:50% !important;
  transform:translate(-50%,-50%);width:820px;max-width:calc(100vw - 32px);max-height:86vh;
  z-index:2147483010;padding:12px 14px;gap:8px;font-size:13px;border-radius:12px;
  overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.55)}
/* 往期拍卖：水平居中 + 顶部钉住，保持 432px 紧凑长度。
   不能用 translateY(-50%) 做垂直居中：那样浮层高度随每周数据量变化，
   标题栏、列头、「前一周 / 后一周」会跟着上下跑，翻周时得不停换地方点。
   现在顶部固定，数据变多只向下延长；列表吃到上限后自己内部滚动，
   列头是 sticky，永远停在原位。 */
.tgtk-histpop.tgtk-gxcenter{position:fixed !important;left:50% !important;
  top:calc(50% - 170px) !important;right:auto !important;bottom:auto !important;
  transform:translateX(-50%);
  z-index:2147483010;max-height:calc(50vh + 154px);
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 20px 52px rgba(0,0,0,.5)}
/* 标题栏 / 汇总 / 页脚高度恒定，不参与伸缩；汇总强制单行，长文案也不把列头挤下去 */
.tgtk-histpop.tgtk-gxcenter > :not(.tgtk-histlist){flex:none}
.tgtk-histpop.tgtk-gxcenter .tgtk-histsum{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* 列表按内容自然长高（数据少就短、数据多向下长），触到浮层上限后内部滚动 */
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
/* 股权拍卖：标签行 + 输入行（大号输入框） */
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
/* 竞拍浮层底部：取消竞拍 / 提示 / 右下角「数量降低提醒」 */
.tgtk-gxfoot .tgtk-gxmsg{flex:1 1 auto;min-width:0}
.tgtk-gxwarn{margin-left:auto;flex:none;display:inline-flex;align-items:center;gap:4px;
  color:var(--tg-mute);font-size:11px;line-height:1.4;cursor:pointer;user-select:none;white-space:nowrap}
.tgtk-gxwarn input{margin:0;width:12px;height:12px;cursor:pointer;accent-color:#d4568e}
`;

  /* --------------------------- 主实例看门狗 ---------------------------
   * 组件常跑在会被导航销毁的 iframe 里：UI 挂在顶层页面，可事件与状态都在那个
   * iframe 的 JS 上下文。从左侧 DD 列表 / 小圣杯点开角色会重载 iframe，UI 就变成
   * 「还在屏幕上但点不动」的僵尸。用顶层页面上的心跳 + 各实例的看门狗自动重建。
   */
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
      // 星星标 / 历史交易按钮可能挂在角色页 iframe 里，逐个同源文档清理
      for (const d of allDocs()) {
        ['tgtk-fab', 'tgtk-panel', 'tgtk-star', 'tgtk-starbox', 'tgtk-hist', 'tgtk-starpop', 'tgtk-histpop', 'tgtk-style'].forEach((id) => {
          const x = d.getElementById(id);
          if (x) x.remove();
        });
        // 右下角工具条里那个开关挂在 bgm 的 dock 里，不在这批 id 里，单独摘掉（留个空 li 不好看）
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
    // 跨域 iframe 访问不到顶层文档，UI 只能留在 iframe 内；窄侧栏照旧跳过，避免重复悬浮球。
    // 同源 iframe 则放宽：UI 挂在顶层，不受 iframe 宽度影响。
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
      // 刚拖动过就不要误当成「点开」
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
    // 右下角工具条里的开关（工具条还没排好版就先挂着，tick 里会自动补装一次）
    mountDockSwitch();
    syncFabVisible();
    startStarBadge();
    // 旧版小圣杯页面增强（拍卖 / 圣殿 / 签到 / 小圣杯开关 / 萌王榜）也跟着页面常驻
    startGrailExtras();
    // 自动注资的定时器挂在 boot 里，而不是「打开面板」时：
    // 组件在任意 bgm 页面都会跑，所以哪怕从没点开过工具箱、小圣杯页也已经关掉，
    // 只要还有 bgm 页面开着，到点就会自动补款。
    startIcoTicker();
    // 自动填充时机不定：刷新后、密码管理器下拉选择后都可能灌进来。用常驻轮询 +
    // 多个延时点覆盖；只在顶层挂一次定时器，但每次组件重启都刷新函数引用
    // （iframe 重载后旧闭包里的 els 已失效，要指向新实例的清理函数）。
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
    // 点开角色会重载组件所在的 iframe，顶层 UI 被清掉；按关闭前的状态自动重启：
    // 面板重新打开、回到同一个标签页、回到拖动过的位置。用户主动关闭时 open=false，不会自作主张弹出。
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
    // 开了自动同步就在启动时拉一次云端数据
    if (S.syncAuto && cloudConfigured()) cloudPull(false).catch(() => {});
    // 组件环境里：置顶名单 / 每行个数也跟着账号走（没有 chiiApp 就自动跳过）
    setTimeout(() => { cldPull().catch(() => {}); }, 1200);
  }

  /** 每个文档实例都盯着心跳：主实例随 iframe 导航消失后，2 秒内自动接管重建 */
  setInterval(() => {
    try {
      if (hostAlive()) return;
      if (!HWIN.__TGTK_HOST__) { boot(); return; }
      cleanupHostUI();
      claimHost();
      boot();
      // boot 若因窄 iframe 限制跳过，别占着主实例位子
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
