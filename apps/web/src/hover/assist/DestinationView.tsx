import {useBack} from "../../back";
import { useState } from "react";
import { Search, Plus, ShoppingCart, ArrowLeft } from "lucide-react";
import type { Action } from "./types";
const products = [
  "彩色拼接小号托特包",
  "撞色拼接小号手提包",
  "拼色手提包轻量小号",
  "彩色拼接托特包通勤款",
  "几何拼色小号托特包",
  "复古拼接双提手包",
  "撞色拼接双提手包",
  "轻量彩色通勤手袋",
];
const prices = [239, 189, 269, 329, 219, 299, 259, 229];
export const listViews = [
  "product-results",
  "restaurant-results",
  "restaurant-menu",
  "hotel-results",
  "attraction-tickets",
];
export default function DestinationView({ action }: { action: Action }) {
  const [selected, setSelected] = useState<number | null>(null),
    [merchant, setMerchant] = useState("粥小馆（虹桥店）"),
    [menu, setMenu] = useState(action.destination?.view === "restaurant-menu"),
    [category, setCategory] = useState("热销"),
    [cart, setCart] = useState<Record<string, number>>({}),
    [date, setDate] = useState(""),
    [sort, setSort] = useState("综合"),
    [detail, setDetail] = useState(false);
  useBack(()=>{if(selected!==null||detail){setSelected(null);setDetail(false);return true;}if(menu&&action.destination?.view!=="restaurant-menu"){setMenu(false);return true;}return false;},200);
  const view = action.destination?.view;
  const field = (name: string, missing: string) =>
    action.fields.find(([key]) => key === name)?.[1] || missing;
  const budget = Number(field("每晚预算", "").match(/[0-9]+/)?.[0]) || Infinity;

  if (view === "product-results")
    return (
      <div data-destination-view={selected === null ? view : "product-detail"}>
        {selected !== null ? (
          <>
            <button
              className="destination-back"
              onClick={() => setSelected(null)}
            >
              <ArrowLeft size={18} />
              搜索结果
            </button>
            <img
              className="product-detail-photo"
              src={`/assets/products/bag-${selected + 1}.png`}
              alt={products[selected]}
            />
            <div className="product-detail-info">
              <b>¥{prices[selected]}</b>
              <h2>{products[selected]}</h2>
              <p>小号 · 26 × 19 × 11 cm · 可调节肩带</p>
              <p>
                几何拼接纹理，双提手设计。内置拉链袋，可放手机、钱包和折叠伞。
              </p>
              <button onClick={() => setDetail(!detail)}>
                {detail ? "已加入收藏" : "收藏商品"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mock-search">
              <Search size={18} />
              <span>彩色拼接包 小号</span>
            </div>
            <nav className="commerce-tabs">
              {(action.app === "jd"
                ? ["全部", "京东自营", "店铺", "同款"]
                : ["全部", "天猫", "店铺", "同款"]
              ).map((t) => (
                <button key={t}>{t}</button>
              ))}
            </nav>
            <nav className="commerce-tabs">
              {["综合", "销量", "价格", "筛选"].map((t) => (
                <button
                  key={t}
                  className={sort === t ? "active" : ""}
                  onClick={() => setSort(t)}
                >
                  {t}
                  {t === "价格" ? " ⇅" : ""}
                </button>
              ))}
            </nav>
            <div className="search-chips">
              <span>小号</span>
              <span>彩色拼接</span>
              <span>手提单肩</span>
            </div>
            <div className="product-grid">
              {products
                .map((_, i) => i)
                .sort((a, b) =>
                  sort === "价格" ? prices[a] - prices[b] : a - b,
                )
                .map((i) => (
                  <button
                    className="product-card"
                    key={i}
                    onClick={() => setSelected(i)}
                  >
                    <img
                      src={`/assets/products/bag-${i + 1}.png`}
                      alt={products[i]}
                    />
                    <div>
                      <h3>{products[i]}</h3>
                      <small>小号 · 可肩背 · 拼接皮革</small>
                      <p>
                        <b>¥{prices[i]}</b>
                        <span>{180 + i * 62}人付款</span>
                      </p>
                      <footer>匠色箱包旗舰店 ›</footer>
                    </div>
                  </button>
                ))}
            </div>
          </>
        )}
      </div>
    );
  if (view === "restaurant-results" || view === "restaurant-menu") {
    const dishes =
      category === "凉拌小菜"
        ? [
            ["清爽拌黄瓜", 12],
            ["清炒时蔬", 16],
          ]
        : category === "清淡粥品"
          ? [["山药小米粥", 18]]
          : [
              ["山药小米粥", 18],
              ["清爽拌黄瓜", 12],
              ["清炒时蔬", 16],
            ];
    const total = Object.entries(cart).reduce(
      (n, [k, count]) => n + count * Number(k.split("|")[1]),
      0,
    );
    if (!menu)
      return (
        <div data-destination-view="restaurant-results">
          <div className="mock-search">
            <Search size={18} />
            {field("偏好", "餐饮偏好待补充")} ·{" "}
            {field("筛选", "筛选条件待补充")}
          </div>
          <nav className="commerce-tabs">
            <button>综合排序</button>
            <button>距离</button>
            <button>评分</button>
            <button>筛选</button>
          </nav>
          {[
            "粥小馆（虹桥店）",
            "清禾粥铺",
            "谷田稻香（娄山关路店）",
            "老苏州汤粥",
          ].map((name, i) => (
            <button
              className="merchant-card"
              key={name}
              onClick={() => {
                setMerchant(name);
                setMenu(true);
              }}
            >
              <img
                src="/assets/products/congee.png"
                alt="清淡粥品"
                style={{ objectPosition: "0% 50%" }}
              />
              <div>
                <h3>{name}</h3>
                <p>
                  ★ 4.{8 - (i % 2)} 月售 {2000 - i * 320}+
                </p>
                <small>{25 + i * 5}分钟 配送 ¥3</small>
                <p className="merchant-tags">清淡少油 现熬粥品</p>
              </div>
            </button>
          ))}
        </div>
      );
    return (
      <div data-destination-view="restaurant-menu" className="restaurant-menu">
        <div className="store-banner">
          <button onClick={() => setMenu(false)}>‹ 商家列表</button>
          <h2>{merchant} · 清淡现熬粥</h2>
        </div>
        <div className="store-info">
          <h3>{merchant}</h3>
          <p>★ 4.8 月售2000+ 约30分钟</p>
          <small>配送 ¥3 满35减5 清淡少油</small>
        </div>
        <nav className="commerce-tabs">
          <b>点菜</b>
          <span>评价</span>
          <span>商家</span>
        </nav>
        <div className="menu-layout">
          <aside>
            {["热销", "清淡粥品", "凉拌小菜"].map((c) => (
              <button
                className={c === category ? "active" : ""}
                key={c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </aside>
          <div className="dish-list">
            {dishes.map(([name, price]) => (
              <article className="dish-card" key={name}>
                <img
                  src="/assets/products/congee.png"
                  alt={String(name)}
                  style={{
                    objectPosition: String(name).includes("黄瓜")
                      ? "50% 50%"
                      : String(name).includes("时蔬")
                        ? "100% 50%"
                        : "0% 50%",
                  }}
                />
                <div>
                  <h3>{name}</h3>
                  <small>清淡少油 · 现点现做</small>
                  <p>
                    ¥{price}
                    <button
                      aria-label={`添加${name}`}
                      onClick={() =>
                        setCart((c) => ({
                          ...c,
                          [`${name}|${price}`]:
                            (c[`${name}|${price}`] || 0) + 1,
                        }))
                      }
                    >
                      <Plus size={17} />
                    </button>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="food-cart">
          <ShoppingCart size={24} />
          <div>
            <b>¥{total}</b>
            <small>另需配送费 ¥3</small>
          </div>
          <button onClick={() => setDetail(true)}>查看清单</button>
        </div>
        {detail && (
          <div className="cart-review">
            <button onClick={() => setDetail(false)}>收起</button>
            <h3>今晚的菜单</h3>
            {Object.entries(cart).map(([name, count]) => (
              <p key={name}>
                {name.split("|")[0]} × {count}
              </p>
            ))}
            <p>收餐地址待补充 · 先看菜单，不下单</p>
          </div>
        )}
      </div>
    );
  }
  if (view === "hotel-results")
    return (
      <div data-destination-view={detail ? "hotel-detail" : "hotel-results"}>
        <div className="mock-search">
          <Search size={18} />
          {field("目的地", "目的地待补充")}
        </div>
        <div className="hotel-filters">
          <span>每晚 {field("每晚预算", "预算待补充")}</span>
          <label>
            入住日期{" "}
            <input
              aria-label="入住日期"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <p>{field("当前状态", "先浏览，暂不预订")} · 退房日期待确认</p>
        </div>
        {[
          "上海虹桥会展雅宿酒店",
          "虹桥云庭酒店",
          "上海会展花园酒店",
          "虹桥枫林雅居",
        ].map(
          (name, i) =>
            628 + i * 40 <= budget && (
              <button
                className="hotel-result"
                key={name}
                onClick={() => {
                  setSelected(i);
                  setDetail(true);
                }}
              >
                <div className={`hotel-illustration hotel-${i}`}>
                  <span>HOTEL</span>
                </div>
                <div>
                  <h3>{name}</h3>
                  <p>
                    4.{8 - (i % 3)}分 距会展中心 {1.2 + i * 0.6} 公里
                  </p>
                  <small>早餐 · 健身房 · 免费 Wi-Fi</small>
                  <p className="hotel-price">
                    ¥{628 + i * 40}
                    <small>起 / 晚</small>
                  </p>
                </div>
              </button>
            ),
        )}
        {budget < 628 && (
          <p className="store-info">
            当前条件暂无匹配酒店，可调整预算后再查看。
          </p>
        )}
        {detail && (
          <div className="cart-review">
            <button onClick={() => setDetail(false)}>返回结果</button>
            <h3>舒适大床房</h3>
            <p>28m² · 1.8m 床 · 含双早</p>
            <p>¥{628 + (selected || 0) * 40} / 晚</p>
            <p>入住 {date || "待选择"} · 退房待确认</p>
            <p>陈总要求先浏览，本轮不预订。</p>
          </div>
        )}
      </div>
    );
  if (view === "attraction-tickets")
    return (
      <div data-destination-view="attraction-tickets">
        <img
          className="attraction-photo"
          src="/assets/products/suzhou-garden.png"
          alt="苏州拙政园"
        />
        <div className="store-info">
          <h2>拙政园</h2>
          <p>苏州市姑苏区东北街178号</p>
          <label>
            游览日期{" "}
            <input
              aria-label="游览日期"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        {["成人票", "学生票", "亲子票"].map((t, i) => (
          <div className="ticket-row" key={t}>
            <h3>{t}</h3>
            <p>入园时段待选择 · 实名预约</p>
            <b>¥{[80, 40, 120][i]}</b>
            <button
              onClick={() => {
                setSelected(i);
                setDetail(true);
              }}
            >
              查看票种
            </button>
          </div>
        ))}
        {detail && (
          <div className="cart-review">
            <button onClick={() => setDetail(false)}>收起</button>
            <h3>{["成人票", "学生票", "亲子票"][selected || 0]}</h3>
            <p>日期：{date || "待选择"}；入园人信息待补充。</p>
            <p>先看门票，不创建订单。</p>
          </div>
        )}
      </div>
    );
  return null;
}
