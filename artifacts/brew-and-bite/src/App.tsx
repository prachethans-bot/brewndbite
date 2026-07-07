import { useState, useEffect, useRef } from 'react';

// ── Local images ────────────────────────────────────────────────────────────
import chaiImg      from '@assets/istockphoto-614533094-612x612_1782735711394.jpg';
import puffsImg     from '@assets/image_1782735974246.png';
import coffeeImg    from '@assets/image_1782736035803.png';

// ── Data ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: number; name: string; tag: string; price: number;
  desc: string; img: string; ingredients: string[];
}
const ITEMS: MenuItem[] = [
  { id:1, name:'Classic Burger', tag:'Main Course', price:149,
    desc:'Juicy and flavorful, made fresh to order with premium ingredients and house sauces',
    img:'https://unsplash.com',
    ingredients:['Brioche Bun','Chicken / Veg Patty','Fresh Lettuce','Tomato Slices','Onion Rings','Cheddar Cheese','House Mayo','Ketchup','Butter','Sea Salt','Black Pepper'] },
  { id:2, name:'Masala Chai', tag:'Beverages', price:49,
    desc:'Aromatic spiced milk tea brewed with whole spices the traditional way',
    img: chaiImg,
    ingredients:['Assam Tea Leaves','Full Cream Milk','Fresh Ginger','Green Cardamom','Cinnamon Stick','Cloves','Black Pepper','Jaggery'] },
  { id:3, name:'Signature Coffee', tag:'Beverages', price:79,
    desc:'Rich, aromatic double-shot espresso crafted to perfection with microfoam art',
    img: coffeeImg,
    ingredients:['Double Espresso Shot','Steamed Full-Cream Milk','Silky Microfoam','Cinnamon Dust','Vanilla Syrup','Brown Sugar (opt)'] },
  { id:4, name:'Spiced Puffs', tag:'Snacks', price:59,
    desc:'Flaky, golden pastry filled with spiced potato and peas — baked to perfection',
    img: puffsImg,
    ingredients:['Puff Pastry Shell','Spiced Potato','Green Peas','Fresh Coriander','Cheese','Chaat Masala','Green Chilli','Black Pepper'] },
  { id:5, name:'Oreo Milkshake', tag:'Beverages', price:119,
    desc:'Creamy, chocolatey indulgence blended thick — topped with whipped cream & Oreo crumble',
    img:'https://unsplash.com',
    ingredients:['Oreo Cookies','Full Cream Milk','Vanilla Ice Cream','Whipped Cream','Dark Chocolate Sauce','Oreo Crumble Topping'] },
  { id:6, name:'Choco Chip Cookies', tag:'Snacks', price:39,
    desc:'Homestyle thick-baked cookies loaded with dark chocolate chips — warm & gooey inside',
    img:'https://unsplash.com',
    ingredients:['Butter','Dark Brown Sugar','All-Purpose Flour','Dark Choc Chips','Free-Range Eggs','Vanilla Extract','Baking Soda','Sea Salt Flakes'] },
];

interface CartEntry { item: MenuItem; qty: number; }
type CartMap = Record<number, CartEntry>;

// ── Common SVGs ─────────────────────────────────────────────────────────────
const CupSvg = ({ size=28, stroke=1.8 }: { size?: number; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}>
    <path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
    <line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>
  </svg>
);
const CartSvg = ({ size=17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const CheckSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="20 4 12 14.01 9 11.01"/>
  </svg>
);
const StarSvg = ({ filled }: { filled: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? '#f0b870' : 'none'} stroke="#f0b870" strokeWidth="1.8">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ── Reveal hook ──────────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function Reveal({ children, delay=0, className='' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform] duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-9'} ${className}`}
      style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div className={`fixed bottom-7 left-1/2 -translate-x-1/2 z-[700] bg-gradient-to-br from-[#201208] to-[#2e1a08] border border-[#d4924d] rounded-xl px-5 py-3 text-[#f5e6ce] text-sm shadow-[0_8px_32px_rgba(0,0,0,.6)] transition-transform duration-[420ms] whitespace-nowrap flex items-center gap-2.5 ${show ? 'translate-y-0' : 'translate-y-[120px]'}`}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {msg}
    </div>
  );
}

// ── Item Modal ───────────────────────────────────────────────────────────────
function ItemModal({ item, onClose, onAdd }: { item: MenuItem | null; onClose: () => void; onAdd: (i: MenuItem) => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className={`fixed inset-0 z-[600] bg-[rgba(0,0,0,.82)] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-[360ms] ${item ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {item && (
        <div className="bg-[#1e1108] border border-[rgba(212,146,77,.2)] rounded-2xl max-w-[600px] w-full overflow-hidden max-h-[90vh] overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-3.5 right-3.5 z-10 bg-[rgba(0,0,0,.65)] border border-[rgba(255,255,255,.15)] rounded-full w-9 h-9 text-white text-base cursor-pointer flex items-center justify-center hover:bg-[rgba(0,0,0,.8)] transition-colors">✕</button>
          <div className="relative h-56 sm:h-72 overflow-hidden">
            <img src={item.img} alt={item.name} className="w-full h-full object-cover block"/>
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,4,0,.85)] via-transparent to-transparent"/>
            <div className="absolute bottom-4 left-4 z-[1] text-[0.63rem] font-bold tracking-[0.14em] uppercase text-[#f0b870] bg-[rgba(0,0,0,.65)] border border-[rgba(212,146,77,.4)] rounded-full px-3 py-1">{item.tag}</div>
          </div>
          <div className="p-5 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-[#f5e6ce] mb-2">{item.name}</h3>
            <p className="text-[#cbb599] text-sm leading-relaxed mb-6">{item.desc}</p>
            <div className="border-t border-[rgba(212,146,77,.15)] pt-5">
              <h4 className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#d4924d] mb-3">Ingredients Used</h4>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.map((ing, idx) => (
                  <span key={idx} className="bg-[rgba(212,146,77,.06)] border border-[rgba(212,146,77,.12)] text-[#e2d0b9] text-[0.72rem] rounded-lg px-2.5 py-1">{ing}</span>
                ))}
              </div>
            </div>
            <div className="border-t border-[rgba(212,146,77,.15)] mt-6 pt-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-[0.6rem] uppercase tracking-[0.1em] text-[#cbb599] mb-0.5">Price</div>
                <div className="text-xl font-bold text-[#f0b870]">₹{item.price}</div>
              </div>
              <button onClick={() => { onAdd(item); onClose(); }} className="bg-gradient-to-r from-[#d4924d] to-[#b37535] text-[#140b05] text-xs font-bold uppercase tracking-[0.08em] px-6 py-3 rounded-xl hover:shadow-[0_4px_16px_rgba(212,146,77,.25)] hover:-translate-y-0.5 active:translate-y-0 transition-[transform,shadow] duration-200">Add to Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Application Root ────────────────────────────────────────────────────────
export default function App() {
  const [cart, setCart] = useState<CartMap>({});
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState({ msg: '', show: false });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const tabs = ['All', 'Main Course', 'Snacks', 'Beverages'];

  const triggerToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, qty: existing ? existing.qty + 1 : 1 } };
    });
    triggerToast(`${item.name} added to cart!`);
  };


