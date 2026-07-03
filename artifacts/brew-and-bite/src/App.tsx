import { useState, useEffect, useRef } from 'react';
import { loadStripe, type Stripe as StripeType } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// ── Local images ────────────────────────────────────────────────────────────
import chaiImg   from '@assets/istockphoto-614533094-612x612_1782735711394.jpg';
import puffsImg  from '@assets/image_1782735974246.png';
import coffeeImg from '@assets/image_1782736035803.png';

// ── Data ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: number; name: string; tag: string; price: number;
  desc: string; img: string; ingredients: string[];
}
const ITEMS: MenuItem[] = [
  { id:1, name:'Classic Burger', tag:'Main Course', price:149,
    desc:'Juicy and flavorful, made fresh to order with premium ingredients and house sauces',
    img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
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
    img:'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80',
    ingredients:['Oreo Cookies','Full Cream Milk','Vanilla Ice Cream','Whipped Cream','Dark Chocolate Sauce','Oreo Crumble Topping'] },
  { id:6, name:'Choco Chip Cookies', tag:'Snacks', price:39,
    desc:'Homestyle thick-baked cookies loaded with dark chocolate chips — warm & gooey inside',
    img:'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80',
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
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
function Reveal({ children, delay=0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform] duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-9'}`}
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
            <h3 className="font-['Playfair_Display'] text-xl sm:text-[1.75rem] text-[#f0b870]">{item.name}</h3>
            <p className="text-[#b8956a] mt-1.5 text-[0.92rem] leading-[1.65]">{item.desc}</p>
            <div className="flex items-center gap-3 mt-3.5 flex-wrap">
              <span className="text-[1.6rem] font-extrabold text-[#d4924d]">₹{item.price}</span>
              <span className="text-[0.82rem] text-[#7a5c3a]">per serving</span>
              <button onClick={() => { onAdd(item); onClose(); }} className="bg-gradient-to-br from-[#9a6530] to-[#d4924d] text-white border-none rounded-lg px-5 py-2.5 text-[0.88rem] font-semibold cursor-pointer flex items-center gap-1.5 ml-auto transition-all duration-[360ms] hover:shadow-lg font-['Inter']"><CartSvg size={15}/> Add to Cart</button>
            </div>
            <div className="mt-5.5 flex items-center gap-2 text-[0.95rem] font-semibold text-[#f5e6ce] border-t border-[rgba(212,146,77,.2)] pt-5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
              </svg>
              Fresh Ingredients
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5">
              {item.ingredients.map(ing => (
                <div key={ing} className="bg-[rgba(255,255,255,.04)] border border-[rgba(212,146,77,.2)] rounded-lg px-3.5 py-2.5 text-[0.83rem] text-[#b8956a] flex items-center gap-2.5">
                  <span className="w-[7px] h-[7px] rounded-full bg-[#d4924d] inline-block flex-shrink-0"/>
                  {ing}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cart Panel ───────────────────────────────────────────────────────────────
function CartPanel({ open, onClose, cart, onQty, onRemove, onCheckout, onNavigateHome }:
  { open: boolean; onClose: () => void; cart: CartMap;
    onQty: (id: number, d: number) => void; onRemove: (id: number) => void; onCheckout: () => void; onNavigateHome: () => void }) {
  const entries = Object.values(cart);
  const total   = entries.reduce((s, c) => s + c.item.price * c.qty, 0);
  const hasItems = entries.length > 0;
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className={`fixed inset-0 z-[400] bg-[rgba(0,0,0,.7)] backdrop-blur-[6px] transition-opacity duration-[360ms] ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className={`fixed top-0 right-0 bottom-0 w-[380px] max-w-[95vw] bg-[#1e1108] border-l border-[rgba(212,146,77,.2)] flex flex-col z-[401] transition-transform duration-[360ms] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-5 pt-4 pb-4 border-b border-[rgba(212,146,77,.2)]">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-['Playfair_Display'] text-[1.3rem] text-[#f0b870]">Your Cart</h3>
            <button onClick={onClose} className="bg-none border-none text-[#b8956a] text-[1.4rem] cursor-pointer hover:text-[#f5e6ce] transition-colors">✕</button>
          </div>
          <button onClick={() => { onClose(); onNavigateHome(); }} className="flex items-center gap-2 bg-[rgba(212,146,77,.1)] border border-[rgba(212,146,77,.25)] rounded-lg px-4 py-2 text-[#d4924d] text-[0.84rem] font-semibold cursor-pointer w-full font-['Inter'] hover:bg-[rgba(212,146,77,.2)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Continue Shopping
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!hasItems ? (
            <div className="flex flex-col items-center justify-center h-full gap-3.5 text-[#7a5c3a] text-center">
              <CartSvg size={52}/>
              <p className="text-[0.9rem] leading-[1.6]">Your cart is empty.<br/>Add something delicious!</p>
              <button onClick={() => { onClose(); onNavigateHome(); }} className="bg-gradient-to-br from-[#9a6530] to-[#d4924d] text-white border-none rounded-lg px-5.5 py-2.5 text-[0.88rem] font-semibold cursor-pointer font-['Inter'] hover:shadow-lg transition-shadow">Browse Menu</button>
            </div>
          ) : entries.map(({ item, qty }) => (
            <div key={item.id} className="flex gap-3 py-3.5 border-b border-[rgba(212,146,77,.2)] items-center">
              <img src={item.img} alt={item.name} className="w-15 h-15 rounded-lg object-cover flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <div className="text-[0.92rem] font-semibold text-[#f5e6ce] overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</div>
                <div className="text-[0.82rem] text-[#d4924d] mt-0.5">₹{item.price} × {qty} = <strong>₹{item.price * qty}</strong></div>
                <div className="flex items-center gap-2 mt-2">
                  {([-1, null, 1] as const).map((d, i) => d === null ? (
                    <span key={i} className="text-[0.88rem] font-bold text-[#f5e6ce] min-w-5 text-center">{qty}</span>
                  ) : (
                    <button key={i} onClick={() => onQty(item.id, d)} className="w-6.5 h-6.5 rounded-full border border-[rgba(212,146,77,.2)] bg-[rgba(212,146,77,.1)] text-[#d4924d] text-base cursor-pointer flex items-center justify-center hover:bg-[rgba(212,146,77,.2)] transition-colors">
                      {d < 0 ? '−' : '+'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => onRemove(item.id)} className="bg-none border-none text-[#7a5c3a] cursor-pointer hover:text-[#ef4444] transition-colors">✕</button>
            </div>
          ))}
        </div>
        {hasItems && (
          <div className="px-6 py-5 border-t border-[rgba(212,146,77,.2)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[0.9rem] text-[#b8956a]">Total</span>
              <span className="text-[1.4rem] font-extrabold text-[#f0b870]">₹{total}</span>
            </div>
            <button onClick={onCheckout} className="w-full bg-gradient-to-br from-[#9a6530] via-[#d4924d] to-[#f0b870] text-white border-none rounded-xl py-4 text-base font-bold cursor-pointer flex items-center justify-center gap-2 font-['Inter'] shadow-[0_4px_20px_rgba(212,146,77,.3)] hover:shadow-[0_6px_28px_rgba(212,146,77,.45)] transition-shadow">
              <CheckSvg/> Proceed to Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Feedback Modal ───────────────────────────────────────────────────────────
function FeedbackModal({ open, orderId, onClose }: { open: boolean; orderId: string; onClose: () => void }) {
  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [comment, setComment]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { if (open) { setRating(0); setHovered(0); setComment(''); setSubmitted(false); } }, [open]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitted(true);
    setTimeout(onClose, 2200);
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className={`fixed inset-0 z-[800] bg-[rgba(0,0,0,.85)] backdrop-blur-[10px] flex items-center justify-center p-4 transition-opacity duration-[360ms] ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-gradient-to-br from-[#201208] via-[#2a1508] to-[#180e04] border border-[rgba(212,146,77,.3)] rounded-3xl p-8 sm:p-10 max-w-[440px] w-full shadow-[0_24px_80px_rgba(0,0,0,.7)] relative animate-[slideUp_0.45s_cubic-bezier(.4,0,.2,1)_both]">
        <button onClick={onClose} className="absolute top-4 right-4 bg-[rgba(212,146,77,.1)] border border-[rgba(212,146,77,.25)] rounded-full w-8 h-8 text-[#b8956a] text-base cursor-pointer flex items-center justify-center hover:bg-[rgba(212,146,77,.2)] transition-colors">✕</button>
        {!submitted ? (
          <>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9a6530] to-[#d4924d] flex items-center justify-center mx-auto mb-3.5 shadow-[0_8px_24px_rgba(212,146,77,.35)]"><CheckSvg/></div>
              <div className="text-[0.75rem] font-bold tracking-[0.14em] uppercase text-[#22c55e] mb-1.5">Order Placed!</div>
              <h2 className="font-['Playfair_Display'] text-[1.6rem] text-[#f0b870] font-bold">Thank you!</h2>
              <p className="text-[#b8956a] text-[0.88rem] mt-1.5 leading-[1.6]">Order <strong className="text-[#d4924d]">#{orderId}</strong> is being prepared with love.</p>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-[rgba(212,146,77,.3)] to-transparent my-5"/>
            <div className="text-center">
              <p className="text-[0.9rem] font-semibold text-[#f5e6ce] mb-3.5">How was your experience?</p>
              <div className="flex justify-center gap-1.5 mb-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(n)} className="bg-none border-none cursor-pointer p-0.5 hover:scale-110 transition-transform">
                    <StarSvg filled={n <= (hovered || rating)}/>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-[0.82rem] text-[#b8956a] mb-4 italic">
                  {rating===1?'Sorry to hear that!':rating===2?"We'll do better!":rating===3?'Thanks for the feedback.':rating===4?'Great, glad you enjoyed it!':'Wonderful! You made our day!'}
                </p>
              )}
              <textarea placeholder="Leave a comment (optional)..." value={comment} onChange={e => setComment(e.target.value)} rows={3} className="w-full bg-[rgba(255,255,255,.04)] border border-[rgba(212,146,77,.25)] rounded-xl px-3.5 py-3 text-[#f5e6ce] text-[0.88rem] font-['Inter'] resize-none outline-none focus:border-[rgba(212,146,77,.5)] mb-4"/>
              <button onClick={handleSubmit} disabled={rating===0} className={`w-full ${rating===0 ? 'bg-[rgba(212,146,77,.2)] text-[#7a5c3a] cursor-not-allowed' : 'bg-gradient-to-br from-[#9a6530] via-[#d4924d] to-[#f0b870] text-white cursor-pointer'} border-none rounded-xl py-3.5 text-base font-bold font-['Inter'] transition-colors ${rating>0 ? 'shadow-[0_4px_20px_rgba(212,146,77,.3)]' : ''}`}>
                Submit Feedback
              </button>
              <button onClick={onClose} className="bg-none border-none text-[#7a5c3a] text-[0.82rem] cursor-pointer mt-3 font-['Inter'] hover:text-[#b8956a] transition-colors">Skip for now</button>
            </div>
          </>
        ) : (
          <div className="text-center py-5">
            <div className="text-[3rem] mb-4">🎉</div>
            <h2 className="font-['Playfair_Display'] text-[1.5rem] text-[#f0b870] mb-2">Thank you!</h2>
            <p className="text-[#b8956a] text-[0.9rem] leading-[1.65]">Your feedback means the world to us.<br/>See you again soon at Brew & Bite!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stripe Card Form (inside <Elements>) ────────────────────────────────────
function CardPaymentForm({ clientSecret, amount, onSuccess }:
  { clientSecret: string; amount: number; onSuccess: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setLoading(true);
    setError('');
    const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    setLoading(false);
    if (stripeErr) {
      setError(stripeErr.message || 'Payment failed. Please try again.');
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess();
    }
  };

  return (
    <div>
      <div className="bg-[rgba(255,255,255,.04)] border border-[rgba(212,146,77,.3)] rounded-xl p-4 mb-4">
        <CardElement options={{
          style: {
            base: { color:'#f5e6ce', fontFamily:"'Inter',sans-serif", fontSize:'15px', '::placeholder': { color:'#7a5c3a' } },
            invalid: { color:'#ef4444' },
          },
          hidePostalCode: true,
        }}/>
      </div>
      {error && <p className="text-[#ef4444] text-[0.84rem] mb-3">{error}</p>}
      <button onClick={handlePay} disabled={loading || !stripe} className={`w-full ${(!stripe||loading) ? 'bg-[rgba(212,146,77,.3)] text-[#7a5c3a] cursor-not-allowed' : 'bg-gradient-to-br from-[#9a6530] via-[#d4924d] to-[#f0b870] text-white cursor-pointer'} border-none rounded-xl py-3.5 text-base font-bold font-['Inter'] transition-all duration-300`}>
        {loading ? 'Processing…' : `Pay ₹${amount}`}
      </button>
    </div>
  );
}

// ── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ open, amount, onClose, onSuccess }:
  { open: boolean; amount: number; onClose: () => void; onSuccess: () => void }) {
  const [tab, setTab]               = useState<'card'|'upi'|'phonepe'>('card');
  const [stripeObj,  setStripeObj]  = useState<Promise<StripeType|null>|null>(null);
  const [clientSecret, setCS]       = useState('');
  const [configErr,  setConfigErr]  = useState('');
  const [upiPaid,    setUpiPaid]    = useState(false);
  const [copied,     setCopied]     = useState(false);

  const upiId    = 'brewandbite@upi';
  const upiLink  = `upi://pay?pa=${upiId}&pn=Brew%20%26%20Bite%20Cafe&am=${amount}&cu=INR&tn=Cafe%20Order`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=1e1108&color=f0b870&data=${encodeURIComponent(upiLink)}`;

  useEffect(() => {
    if (!open) { setStripeObj(null); setCS(''); setConfigErr(''); setUpiPaid(false); setTab('card'); return; }
    fetch('/api/payment/config')
      .then(r => r.json())
      .then(({ publishableKey, error }) => {
        if (error || !publishableKey) { setConfigErr('Stripe not configured yet. Please connect Stripe first.'); return; }
        setStripeObj(loadStripe(publishableKey));
      })
      .catch(() => setConfigErr('Could not reach payment service.'));
  }, [open]);

  useEffect(() => {
    if (!open || tab !== 'card' || !stripeObj || clientSecret || configErr) return;
    fetch('/api/payment/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then(r => r.json())
      .then(({ clientSecret: cs, error }) => {
        if (error || !cs) setConfigErr('Could not create payment session.');
        else setCS(cs);
      })
      .catch(() => setConfigErr('Payment service unavailable.'));
  }, [open, tab, stripeObj, amount, clientSecret, configErr]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SuccessCheck = ({ color = '#22c55e' }: { color?: string }) => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-3 block">
      <circle cx="32" cy="32" r="30" stroke={color} strokeWidth="3" strokeDasharray="188.5" className="animate-[dashCircle_0.6s_ease_both]"/>
      <polyline points="18,33 28,43 46,22" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" className="animate-[dashCheck_0.4s_0.5s_ease_both]"/>
    </svg>
  );

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className={`fixed inset-0 z-[750] bg-[rgba(0,0,0,.88)] backdrop-blur-xl flex items-center justify-center p-4 transition-opacity duration-[360ms] ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-gradient-to-br from-[#201208] via-[#2a1508] to-[#180e04] border border-[rgba(212,146,77,.35)] rounded-3xl px-6 py-8 sm:px-8 max-w-[460px] w-full shadow-[0_32px_100px_rgba(0,0,0,.8)] relative animate-[payModalIn_0.45s_cubic-bezier(.34,1.56,.64,1)_both]">
        <button onClick={onClose} className="absolute top-4 right-4 bg-[rgba(212,146,77,.08)] border border-[rgba(212,146,77,.2)] rounded-full w-8 h-8 text-[#b8956a] text-base cursor-pointer flex items-center justify-center hover:bg-[rgba(212,146,77,.2)] transition-colors">✕</button>

        <div className="mb-5 animate-[fadeSlideDown_0.4s_0.05s_both]">
          <p className="text-[0.72rem] font-bold tracking-[0.14em] uppercase text-[#d4924d] mb-1">Secure Checkout</p>
          <h2 className="font-['Playfair_Display'] text-[1.55rem] text-[#f0b870] font-bold">Complete Your Order</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[1.4rem] font-extrabold text-[#d4924d] animate-[amountPop_0.5s_0.2s_cubic-bezier(.34,1.56,.64,1)_both]">₹{amount}</span>
            <span className="text-[0.8rem] text-[#7a5c3a]">• Brew & Bite Cafe</span>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(212,146,77,.4)] to-transparent mb-5"/>

        <div className="flex gap-1.5 mb-5.5 bg-[rgba(0,0,0,.4)] p-1.5 rounded-[15px] animate-[fadeSlideDown_0.4s_0.1s_both]">
          <button onClick={() => setTab('card')} className={`flex-1 py-2.5 px-1.5 ${tab==='card' ? 'bg-gradient-to-br from-[#9a6530] to-[#d4924d] text-white scale-[1.03] shadow-[0_4px_16px_rgba(0,0,0,.35)]' : 'bg-transparent text-[#7a5c3a]'} rounded-[11px] text-[0.8rem] font-bold cursor-pointer transition-all duration-300 font-['Inter'] flex items-center justify-center gap-1.5`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Card
          </button>
          <button onClick={() => setTab('upi')} className={`flex-1 py-2.5 px-1.5 ${tab==='upi' ? 'bg-gradient-to-br from-[#9a6530] to-[#d4924d] text-white scale-[1.03] shadow-[0_4px_16px_rgba(0,0,0,.35)]' : 'bg-transparent text-[#7a5c3a]'} rounded-[11px] text-[0.8rem] font-bold cursor-pointer transition-all duration-300 font-['Inter'] flex items-center justify-center gap-1.5`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            UPI
          </button>
          <button onClick={() => setTab('phonepe')} className={`flex-1 py-2.5 px-1.5 ${tab==='phonepe' ? 'bg-gradient-to-br from-[#5f259f] to-[#7b2fa8] text-white scale-[1.03] shadow-[0_4px_16px_rgba(0,0,0,.35)]' : 'bg-transparent text-[#7a5c3a]'} rounded-[11px] text-[0.8rem] font-bold cursor-pointer transition-all duration-300 font-['Inter'] flex items-center justify-center gap-1.5`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
              <path d="M8 12c0-2.67 2.24-4.8 5-4.8h1.2V5l3.6 3.6-3.6 3.6V9.6H13C11.12 9.6 9.6 11.12 9.6 13S11.12 16.4 13 16.4h3.6V18.8H13C10.24 18.8 8 16.67 8 14" strokeWidth="1.5"/>
            </svg>
            PhonePe
          </button>
        </div>

        {tab === 'card' && (
          <div key="card" className="animate-[tabSlideIn_0.3s_cubic-bezier(.4,0,.2,1)_both]">
            {configErr ? (
              <div className="bg-[rgba(239,68,68,.08)] border border-[rgba(239,68,68,.25)] rounded-[14px] px-4.5 py-5 text-center animate-[tabSlideIn_0.3s_both]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="1.5" className="mx-auto mb-2.5 block">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-[#fca5a5] text-[0.88rem] leading-[1.6]">{configErr}</p>
                <p className="text-[#7a5c3a] text-[0.78rem] mt-2">Connect Stripe in the Integrations panel to enable card payments.</p>
              </div>
            ) : !stripeObj || !clientSecret ? (
              <div className="text-center py-7">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <div className="absolute inset-0 border-[3px] border-[rgba(212,146,77,.15)] rounded-full"/>
                  <div className="absolute inset-0 border-[3px] border-transparent border-t-[#d4924d] rounded-full animate-spin"/>
                  <div className="absolute inset-2 border-[2px] border-transparent border-t-[rgba(212,146,77,.5)] rounded-full animate-[spin_0.7s_linear_infinite_reverse]"/>
                </div>
                <p className="text-[#b8956a] text-[0.88rem]">Setting up secure payment…</p>
              </div>
            ) : (
              <Elements stripe={stripeObj}>
                <CardPaymentForm clientSecret={clientSecret} amount={amount} onSuccess={onSuccess}/>
              </Elements>
            )}
            <div className="flex items-center gap-1.5 mt-4 justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a3c1a" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-[#5a3c1a] text-[0.73rem]">Secured by Stripe · 256-bit SSL</span>
            </div>
          </div>
        )}

        {tab === 'upi' && (
          <div key="upi" className="text-center animate-[tabSlideIn_0.3s_cubic-bezier(.4,0,.2,1)_both]">
            {!upiPaid ? (
              <>
                <p className="text-[#b8956a] text-[0.85rem] mb-4 leading-[1.6]">Scan with any UPI app — Google Pay, Paytm, BHIM, or your bank app</p>
                <div className="relative inline-block mb-4">
                  <div className="bg-[rgba(255,255,255,.04)] border border-[rgba(212,146,77,.25)] rounded-[18px] p-3.5 animate-[qrReveal_0.5s_0.1s_cubic-bezier(.34,1.26,.64,1)_both]">
                    <img src={qrApiUrl} alt="UPI QR" width="180" height="180" className="rounded-[10px] block"/>
                  </div>
                  <div className="absolute left-3.5 right-3.5 h-0.5 bg-gradient-to-r from-transparent via-[#d4924d] to-transparent rounded animate-[scanLine_2s_ease-in-out_infinite] top-3.5"/>
                </div>
                <div className="flex items-center justify-center gap-2 mb-3.5">
                  <div className="bg-[rgba(212,146,77,.08)] border border-[rgba(212,146,77,.22)] rounded-[10px] px-3.5 py-2 flex items-center gap-2.5 flex-1 max-w-[270px] animate-[fadeSlideDown_0.4s_0.15s_both]">
                    <span className="font-mono text-[#f0b870] text-[0.88rem] flex-1">{upiId}</span>
                    <button onClick={copyUpi} className={`${copied ? 'bg-[rgba(34,197,94,.15)] border-[rgba(34,197,94,.4)] text-[#22c55e]' : 'bg-[rgba(212,146,77,.15)] border-[rgba(212,146,77,.3)] text-[#d4924d]'} border rounded-md cursor-pointer text-[0.76rem] font-bold px-2.5 py-1 font-['Inter'] whitespace-nowrap transition-all duration-250`}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <a href={upiLink} className="inline-flex items-center gap-1.5 bg-[rgba(212,146,77,.1)] border border-[rgba(212,146,77,.28)] text-[#d4924d] rounded-[10px] px-4.5 py-2.5 text-[0.84rem] font-semibold no-underline mb-4 transition-all duration-250 animate-[fadeSlideDown_0.4s_0.2s_both] hover:bg-[rgba(212,146,77,.18)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                  Open UPI App
                </a>
                <button onClick={() => setUpiPaid(true)} className="block w-full bg-gradient-to-br from-[#9a6530] via-[#d4924d] to-[#f0b870] text-white border-none rounded-[13px] py-3.5 text-base font-bold cursor-pointer font-['Inter'] shadow-[0_4px_20px_rgba(212,146,77,.3)] transition-all duration-250 animate-[fadeSlideDown_0.4s_0.25s_both] hover:translate-y-[-2px] hover:shadow-[0_8px_28px_rgba(212,146,77,.45)]">
                  I have paid
                </button>
              </>
            ) : (
              <div className="animate-[successIn_0.5s_cubic-bezier(.34,1.36,.64,1)_both] py-2">
                <SuccessCheck/>
                <h3 className="font-['Playfair_Display'] text-[#f0b870] mb-1.5 text-[1.3rem]">Payment confirmed!</h3>
                <p className="text-[#b8956a] text-[0.86rem] mb-5.5">Thank you for paying via UPI.</p>
                <button onClick={onSuccess} className="w-full bg-gradient-to-br from-[#9a6530] via-[#d4924d] to-[#f0b870] text-white border-none rounded-[13px] py-3.5 text-base font-bold cursor-pointer font-['Inter'] shadow-[0_4px_20px_rgba(212,146,77,.3)] transition-all duration-250 hover:translate-y-[-2px]">
                  Place My Order →
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'phonepe' && (
          <div key="phonepe" className="text-center animate-[tabSlideIn_0.3s_cubic-bezier(.4,0,.2,1)_both]">
            {!upiPaid ? (
              <>
                <div className="flex items-center justify-center gap-2.5 mb-3.5 animate-[fadeSlideDown_0.35s_both]">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5f259f] to-[#7b2fa8] flex items-center justify-center shadow-[0_4px_14px_rgba(95,37,159,.5)]">
                    <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                      <path d="M12 20c0-4.4 3.6-8 8-8h2v-4l6 6-6 6v-4h-2c-2.2 0-4 1.8-4 4s1.8 4 4 4h6v4H20c-4.4 0-8-3.6-8-8z" fill="white"/>
                    </svg>
                  </div>
                  <span className="font-['Playfair_Display'] text-[1.15rem] text-[#c084fc] font-bold tracking-[0.02em]">PhonePe</span>
                </div>
                <p className="text-[#b8956a] text-[0.85rem] mb-4 leading-[1.6]">Scan QR with PhonePe or enter UPI ID manually</p>
                <div className="relative inline-block mb-4">
                  <div className="bg-[rgba(95,37,159,.08)] border border-[rgba(95,37,159,.45)] rounded-[18px] p-3.5 animate-[qrReveal_0.5s_0.1s_cubic-bezier(.34,1.26,.64,1)_both]">
                    <img src={qrApiUrl} alt="PhonePe QR" width="180" height="180" className="rounded-[10px] block"/>
                  </div>
                  <div className="absolute left-3.5 right-3.5 h-0.5 bg-gradient-to-r from-transparent via-[#c084fc] to-transparent rounded animate-[scanLine_2s_ease-in-out_infinite] top-3.5"/>
                </div>
                <div className="flex items-center justify-center gap-2 mb-3.5">
                  <div className="bg-[rgba(95,37,159,.1)] border border-[rgba(95,37,159,.35)] rounded-[10px] px-3.5 py-2 flex items-center gap-2.5 flex-1 max-w-[270px] animate-[fadeSlideDown_0.4s_0.15s_both]">
                    <span className="font-mono text-[#c084fc] text-[0.88rem] flex-1">{upiId}</span>
                    <button onClick={copyUpi} className={`${copied ? 'bg-[rgba(34,197,94,.15)] border-[rgba(34,197,94,.4)] text-[#22c55e]' : 'bg-[rgba(95,37,159,.25)] border-[rgba(95,37,159,.4)] text-[#c084fc]'} border rounded-md cursor-pointer text-[0.76rem] font-bold px-2.5 py-1 font-['Inter'] whitespace-nowrap transition-all duration-250`}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="bg-[rgba(95,37,159,.08)] border border-[rgba(95,37,159,.25)] rounded-xl px-3.5 py-3 mb-4 animate-[fadeSlideDown_0.4s_0.2s_both]">
                  {['Open PhonePe', 'Send Money → To UPI ID', `Enter ${upiId}`, `Enter ₹${amount} & Pay`].map((step, i) => (
                    <div key={step} className={`flex items-center gap-2.5 py-1.25 ${i < 3 ? 'border-b border-[rgba(95,37,159,.15)]' : ''}`}>
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#5f259f] to-[#7b2fa8] flex items-center justify-center text-[0.65rem] font-extrabold text-white flex-shrink-0">{i+1}</span>
                      <span className="text-[0.82rem] text-[#b8956a] text-left">{step}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setUpiPaid(true)} className="w-full bg-gradient-to-br from-[#5f259f] via-[#7b2fa8] to-[#9333ea] text-white border-none rounded-[13px] py-3.5 text-base font-bold cursor-pointer font-['Inter'] shadow-[0_4px_20px_rgba(95,37,159,.4)] transition-all duration-250 animate-[fadeSlideDown_0.4s_0.25s_both] hover:translate-y-[-2px] hover:shadow-[0_8px_28px_rgba(95,37,159,.55)]">
                  I have paid via PhonePe
                </button>
              </>
            ) : (
              <div className="animate-[successIn_0.5s_cubic-bezier(.34,1.36,.64,1)_both] py-2">
                <SuccessCheck color="#a855f7"/>
                <h3 className="font-['Playfair_Display'] text-[#c084fc] mb-1.5 text-[1.3rem]">Payment confirmed!</h3>
                <p className="text-[#b8956a] text-[0.86rem] mb-5.5">Thank you for paying via PhonePe.</p>
                <button onClick={onSuccess} className="w-full bg-gradient-to-br from-[#5f259f] to-[#7b2fa8] text-white border-none rounded-[13px] py-3.5 text-base font-bold cursor-pointer font-['Inter'] shadow-[0_4px_20px_rgba(95,37,159,.4)] transition-all duration-250 hover:translate-y-[-2px]">
                  Place My Order →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Menu Card ────────────────────────────────────────────────────────────────
function MenuCard({ item, onDetails, onAdd, delay }:
  { item: MenuItem; onDetails: () => void; onAdd: () => void; delay: number }) {
  const [hover, setHover] = useState(false);
  const { ref, visible }  = useReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform] duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-9'}`} style={{ transitionDelay: `${delay}s` }}>
      <div onClick={onDetails} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className={`relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer border transition-all duration-[360ms] ${hover ? 'border-[rgba(212,146,77,.35)] translate-y-[-8px] scale-[1.016] shadow-[0_24px_64px_rgba(0,0,0,.7)]' : 'border-[rgba(212,146,77,.2)]'}`}>
        <img src={item.img} alt={item.name} loading="lazy" className={`w-full h-full object-cover block transition-transform duration-[650ms] ease-out ${hover ? 'scale-108' : ''}`}/>
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,4,0,.96)] via-[rgba(0,0,0,.1)]_55% to-transparent flex flex-col justify-end p-4 sm:p-5">
          <span className="inline-block text-[0.63rem] font-bold tracking-[0.14em] uppercase text-[#f0b870] bg-[rgba(212,146,77,.18)] border border-[rgba(212,146,77,.3)] rounded-full px-2.5 py-1 mb-2 w-fit">{item.tag}</span>
          <h3 className="font-['Playfair_Display'] text-[1.15rem] sm:text-[1.35rem] font-bold text-white">{item.name}</h3>
          <p className="text-[0.81rem] text-[rgba(255,255,255,.55)] mt-1 line-clamp-2">{item.desc}</p>
          <div className="flex items-center justify-between mt-3.5 gap-2 flex-wrap">
            <span className="text-[1.1rem] font-bold text-[#f0b870]">₹{item.price}</span>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); onDetails(); }} className="text-[0.76rem] font-semibold border border-[rgba(255,255,255,.2)] rounded-full px-3 py-1.5 cursor-pointer bg-[rgba(255,255,255,.1)] text-white flex items-center gap-1.5 font-['Inter'] hover:bg-[rgba(255,255,255,.2)] transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>Details
              </button>
              <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="text-[0.76rem] font-semibold border-none rounded-full px-3 py-1.5 cursor-pointer bg-gradient-to-br from-[#9a6530] to-[#d4924d] text-white flex items-center gap-1.5 font-['Inter'] hover:shadow-lg transition-shadow">
                <CartSvg size={13}/> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ onDetails, onAdd }:
  { onDetails: (i: MenuItem) => void; onAdd: (i: MenuItem) => void }) {
  useEffect(() => {
    document.title = 'Brew & Bite Cafe | Premium Coffee & Fresh Food in Koramangala, Bengaluru';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Brew & Bite Cafe in Koramangala, Bengaluru — premium artisan coffee, fresh handcrafted food, and cozy vibes. Open 7 AM–10 PM daily. Order online or visit us today!');
  }, []);
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center text-center pt-28 sm:pt-32 pb-16 sm:pb-20 px-6 relative overflow-hidden bg-[radial-gradient(ellipse_80%_55%_at_50%_10%,#3d1f06_0%,#100904_68%)]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1800&q=80')] bg-center bg-cover opacity-[0.08] z-0"/>
        <div className="text-[#d4924d] mb-5.5 flex items-center justify-center gap-3.5 animate-[fadeUp_0.8s_0.05s_both] relative z-[1]">
          <CupSvg size={36} stroke={1.7}/>
          <span className="text-[#7a5c3a] text-[1.6rem] font-thin">|</span>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
            <line x1="6" y1="17" x2="18" y2="17"/>
          </svg>
        </div>
        <h1 className="font-['Playfair_Display'] text-[clamp(2.2rem,7vw,5.4rem)] font-black text-[#f0b870] leading-[1.06] animate-[fadeUp_0.9s_0.15s_both] relative z-[1]">Brew & Bite Cafe</h1>
        <p className="mt-4 sm:mt-4.5 text-[#b8956a] text-base sm:text-[1.05rem] font-light animate-[fadeUp_0.9s_0.28s_both] relative z-[1] px-4">Where Every Sip and Bite Tells a Story of Flavor and Passion</p>
        <div className="mt-8 sm:mt-8.5 flex gap-4 flex-wrap justify-center animate-[fadeUp_0.9s_0.42s_both] relative z-[1]">
          {[{ icon:<CupSvg size={15} stroke={2}/>, label:'Premium Brews' },
            { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/></svg>, label:'Fresh Cuisine' },
            { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label:'Quality First' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-[rgba(212,146,77,.1)] border border-[rgba(212,146,77,.28)] rounded-full px-4.5 py-2 text-[#d4924d] text-[0.84rem] font-medium">
              {icon} {label}
            </div>
          ))}
        </div>
        <div className="mt-12 sm:mt-15 flex flex-col items-center gap-2 text-[#7a5c3a] text-[0.72rem] tracking-[0.14em] uppercase animate-[fadeUp_0.9s_0.58s_both] relative z-[1]">
          <div className="w-px h-11 bg-gradient-to-b from-[#d4924d] to-transparent animate-[bob_2s_infinite]"/>
          scroll to explore
        </div>
      </div>

      <QRMenuSection/>
      <ReviewsSection/>
      <ContactSection/>
      <GoogleMapsSection/>

      <footer className="bg-[#1e1108] border-t border-[rgba(212,146,77,.2)] py-9 text-center px-6">
        <div className="flex items-center justify-center gap-2.5 font-['Playfair_Display'] text-[1.15rem] text-[#d4924d] mb-2.5">
          <CupSvg size={22} stroke={1.8}/> Brew & Bite Cafe
        </div>
        <p className="text-[#7a5c3a] text-[0.84rem]">© 2026 <span className="text-[#d4924d]">Brew & Bite Cafe</span> · Where Every Sip and Bite Tells a Story</p>
      </footer>
    </>
  );
}

// ── Social Media Section ─────────────────────────────────────────────────────
const SOCIALS = [
  { name:'Instagram', handle:'@prachethan_k', followers:'', url:'https://instagram.com/prachethan_k', color:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', icon:( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> ) },
  { name:'Facebook', handle:'@prachethan_k', followers:'', url:'https://facebook.com/prachethan_k', color:'linear-gradient(135deg,#1877f2,#166fe5)', icon:( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> ) },
  { name:'Twitter / X', handle:'@BrewAndBiteCafe', followers:'5.8K', url:'https://twitter.com/BrewAndBiteCafe', color:'linear-gradient(135deg,#111,#333)', icon:( <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> ) },
  { name:'YouTube', handle:'prachethan.star', followers:'', url:'https://youtube.com/@prachethan.star', color:'linear-gradient(135deg,#ff0000,#cc0000)', icon:( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/></svg> ) },
];

function SocialMediaSection() {
  return (
    <div className="bg-[#100904] py-16 sm:py-17 px-6 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,146,77,.3)] to-transparent"/>
      <div className="max-w-[960px] mx-auto">
        <Reveal>
          <div className="text-center mb-11">
            <p className="text-[0.72rem] font-bold tracking-[0.14em] uppercase text-[#d4924d] mb-2">Stay Connected</p>
            <h2 className="font-['Playfair_Display'] text-[clamp(1.6rem,3.5vw,2.5rem)] text-[#f0b870] font-bold">Follow & Connect</h2>
            <div className="w-15 h-[3px] bg-gradient-to-r from-[#9a6530] to-[#f0b870] rounded mt-3.5 mx-auto"/>
            <p className="mt-4 text-[#b8956a] text-[0.95rem] max-w-[460px] mx-auto leading-[1.75]">Join our community for daily specials, behind-the-scenes peeks, and exclusive offers</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
          {SOCIALS.map(({ name, handle, followers, url, color, icon }, i) => (
            <Reveal key={name} delay={i * 0.1}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="no-underline block">
                <div className="bg-gradient-to-br from-[#1e1108] to-[#150c04] border border-[rgba(212,146,77,.2)] rounded-[18px] px-5 py-6 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:translate-y-[-5px] hover:border-[rgba(212,146,77,.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,.5)]">
                  <div className="w-13 h-13 rounded-[14px] flex-shrink-0 flex items-center justify-center text-white shadow-[0_4px_16px_rgba(0,0,0,.4)]" style={{ background: color }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#f5e6ce] text-[0.95rem] mb-0.5">{name}</div>
                    <div className="text-[#b8956a] text-[0.82rem] overflow-hidden text-ellipsis whitespace-nowrap">{handle}</div>
                    {followers && <div className="text-[#7a5c3a] text-[0.76rem] mt-1">{followers} followers</div>}
                  </div>
                  <div className="text-[#d4924d] flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div className="mt-10 bg-gradient-to-br from-[rgba(154,101,48,.15)] to-[rgba(212,146,77,.1)] border border-[rgba(212,146,77,.25)] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 min-w-[200px] text-center md:text-left">
              <h3 className="font-['Playfair_Display'] text-[1.15rem] text-[#f0b870] mb-1">Get exclusive offers in your inbox</h3>
              <p className="text-[#b8956a] text-[0.84rem]">Weekly specials, new arrivals & loyalty rewards</p>
            </div>
            <div className="flex gap-2.5 flex-shrink-0 w-full md:w-auto flex-col sm:flex-row">
              <input type="email" placeholder="your@email.com" className="bg-[rgba(255,255,255,.06)] border border-[rgba(212,146,77,.3)] rounded-lg px-4 py-2.5 text-[#f5e6ce] text-[0.88rem] outline-none font-['Inter'] flex-1 sm:w-[200px] focus:border-[rgba(212,146,77,.5)]"/>
              <button className="bg-gradient-to-br from-[#9a6530] to-[#d4924d] text-white border-none rounded-lg px-5 py-2.5 text-[0.88rem] font-semibold cursor-pointer font-['Inter'] whitespace-nowrap hover:shadow-lg transition-shadow">Subscribe</button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ── Reviews Section ──────────────────────────────────────────────────────────
interface Review { id: number; name: string; rating: number; comment: string; date: string; }
const SEED_REVIEWS: Review[] = [
  { id:1, name:'Priya M.',    rating:5, comment:'Absolutely love this place! The masala chai is hands-down the best in Koramangala. The ambience is so cozy — I come here every weekend.', date:'June 2026' },
  { id:2, name:'Arjun S.',    rating:5, comment:'The signature coffee is a must-try. Rich, smooth, and beautifully presented. Spiced Puffs pair perfectly with it. Will definitely be back!', date:'June 2026' },
  { id:3, name:'Nisha R.',    rating:4, comment:'Great food and wonderful vibes. The Oreo Milkshake is dangerously good. Only wish they had more seating on weekends — it gets packed!', date:'May 2026' },
  { id:4, name:'Rahul K.',    rating:5, comment:'My go-to spot for remote work sessions. Excellent WiFi, fresh food and the staff are super friendly. The Classic Burger is a 10/10.', date:'May 2026' },
  { id:5, name:'Deepa T.',    rating:5, comment:'Took my parents here and they were blown away by the quality. The choco chip cookies taste like they were baked five minutes ago. Pure comfort!', date:'April 2026' },
];

const RATING_LABELS: Record<number, string> = {
  1:'Poor', 2:'Below Average', 3:'Good', 4:'Great', 5:'Excellent!'
};

function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('bnb_reviews');
      return saved ? [...SEED_REVIEWS, ...JSON.parse(saved)] : SEED_REVIEWS;
    } catch { return SEED_REVIEWS; }
  });

  const [name,    setName]    = useState('');
  const [comment, setComment] = useState('');
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]     = useState('');

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  const handleSubmit = () => {
    if (!name.trim())    { setError('Please enter your name.'); return; }
    if (rating === 0)    { setError('Please select a star rating.'); return; }
    if (!comment.trim()) { setError('Please write a short review.'); return; }
    setError('');
    const newReview: Review = {
      id: Date.now(), name: name.trim(), rating, comment: comment.trim(),
      date: new Date().toLocaleDateString('en-IN', { month:'long', year:'numeric' }),
    };
    const updated = [newReview, ...reviews];
    setReviews(updated);
    try {
      const saved = updated.filter(r => !SEED_REVIEWS.some(s => s.id === r.id));
      localStorage.setItem('bnb_reviews', JSON.stringify(saved));
    } catch {}
    setName(''); setComment(''); setRating(0); setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section aria-label="Customer reviews" className="bg-[#100904] py-16 sm:py-20 px-6 relative" id="reviews">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,146,77,.3)] to-transparent"/>
      <div className="max-w-[960px] mx-auto">

        {/* Header */}
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-[0.72rem] font-bold tracking-[0.14em] uppercase text-[#d4924d] mb-2">Guest Reviews</p>
            <h2 className="font-['Playfair_Display'] text-[clamp(1.6rem,3.5vw,2.5rem)] text-[#f0b870] font-bold">What Our Guests Say</h2>
            <div className="w-15 h-[3px] bg-gradient-to-r from-[#9a6530] to-[#f0b870] rounded mt-3.5 mx-auto"/>
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="font-['Playfair_Display'] text-[2.2rem] font-black text-[#d4924d]">{avgRating}</span>
              <div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} width="20" height="20" viewBox="0 0 24 24"
                      fill={n <= Math.round(Number(avgRating)) ? '#f0b870' : 'none'}
                      stroke="#f0b870" strokeWidth="1.8">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <p className="text-[#7a5c3a] text-[0.75rem] mt-0.5">Based on {reviews.length} reviews</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Review cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 mb-12">
          {reviews.slice(0, 6).map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}>
              <div className="bg-gradient-to-br from-[#1e1108] to-[#150c04] border border-[rgba(212,146,77,.2)] rounded-2xl p-5 h-full flex flex-col gap-3 hover:border-[rgba(212,146,77,.4)] hover:translate-y-[-5px] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9a6530] to-[#d4924d] flex items-center justify-center text-white font-bold text-[0.9rem] font-['Playfair_Display'] flex-shrink-0">
                    {r.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[#f5e6ce] text-[0.88rem] truncate">{r.name}</div>
                    <div className="text-[#7a5c3a] text-[0.72rem]">{r.date}</div>
                  </div>
                  <div className="ml-auto flex gap-0.5 flex-shrink-0">
                    {[1,2,3,4,5].map(n => (
                      <svg key={n} width="13" height="13" viewBox="0 0 24 24"
                        fill={n <= r.rating ? '#f0b870' : 'none'}
                        stroke="#f0b870" strokeWidth="1.8">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-[#b8956a] text-[0.84rem] leading-[1.7] flex-1">"{r.comment}"</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Submission form */}
        <Reveal delay={0.1}>
          <div className="bg-gradient-to-br from-[#1e1108] to-[#150c04] border border-[rgba(212,146,77,.25)] rounded-3xl p-6 sm:p-10 shadow-[0_16px_60px_rgba(0,0,0,.5)]">
            <div className="text-center mb-7">
              <h3 className="font-['Playfair_Display'] text-[1.4rem] text-[#f0b870] font-bold">Share Your Experience</h3>
              <p className="text-[#b8956a] text-[0.88rem] mt-1.5">We'd love to hear from you — every review makes us better!</p>
            </div>

            {submitted ? (
              <div className="text-center py-6 animate-[slideUp_0.45s_both]">
                <div className="text-[3rem] mb-3">🎉</div>
                <h4 className="font-['Playfair_Display'] text-[1.25rem] text-[#f0b870] mb-1.5">Thank you for your review!</h4>
                <p className="text-[#b8956a] text-[0.88rem]">Your feedback helps us serve you better. See you soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[0.75rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-1.5">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya M."
                      value={name}
                      onChange={e => setName(e.target.value)}
                      maxLength={40}
                      className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(212,146,77,.25)] rounded-xl px-4 py-3 text-[#f5e6ce] text-[0.9rem] font-['Inter'] outline-none focus:border-[rgba(212,146,77,.55)] transition-colors placeholder-[#4a3520]"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.75rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-2">Your Rating</label>
                    <div className="flex gap-1.5 items-center">
                      {[1,2,3,4,5].map(n => (
                        <button key={n}
                          onMouseEnter={() => setHovered(n)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(n)}
                          className="bg-none border-none cursor-pointer p-0.5 hover:scale-115 transition-transform">
                          <svg width="32" height="32" viewBox="0 0 24 24"
                            fill={n <= (hovered || rating) ? '#f0b870' : 'none'}
                            stroke="#f0b870" strokeWidth="1.8"
                            className="transition-all duration-150">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </button>
                      ))}
                      {(hovered || rating) > 0 && (
                        <span className="text-[0.82rem] text-[#d4924d] font-semibold ml-1">{RATING_LABELS[hovered || rating]}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex-1 flex flex-col">
                    <label className="block text-[0.75rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-1.5">Your Review</label>
                    <textarea
                      placeholder="Tell us about your visit — what did you love?"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={4}
                      maxLength={300}
                      className="flex-1 w-full bg-[rgba(255,255,255,.05)] border border-[rgba(212,146,77,.25)] rounded-xl px-4 py-3 text-[#f5e6ce] text-[0.9rem] font-['Inter'] outline-none focus:border-[rgba(212,146,77,.55)] transition-colors resize-none placeholder-[#4a3520]"
                    />
                    <div className="text-right text-[0.7rem] text-[#4a3520] mt-1">{comment.length}/300</div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  {error && (
                    <p className="text-[#ef4444] text-[0.84rem] mb-3 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </p>
                  )}
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-br from-[#9a6530] via-[#d4924d] to-[#f0b870] text-white border-none rounded-xl py-3.5 text-base font-bold cursor-pointer font-['Inter'] shadow-[0_4px_20px_rgba(212,146,77,.3)] hover:shadow-[0_6px_28px_rgba(212,146,77,.45)] hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-center gap-2">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    Submit Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact Section ───────────────────────────────────────────────────────────
function ContactSection() {
  const [cName,    setCName]    = useState('');
  const [cEmail,   setCEmail]   = useState('');
  const [cPhone,   setCPhone]   = useState('');
  const [cMsg,     setCMsg]     = useState('');
  const [cSent,    setCSent]    = useState(false);
  const [cErr,     setCErr]     = useState('');

  const handleContact = () => {
    if (!cName.trim())  { setCErr('Please enter your name.');          return; }
    if (!cEmail.trim() || !/\S+@\S+\.\S+/.test(cEmail)) { setCErr('Please enter a valid email.'); return; }
    if (!cMsg.trim())   { setCErr('Please write your message.');       return; }
    setCErr('');
    setCSent(true);
    setTimeout(() => setCSent(false), 4000);
    setCName(''); setCEmail(''); setCPhone(''); setCMsg('');
  };

  return (
    <section aria-label="Contact and feedback" className="bg-[#1a0f06] py-16 sm:py-20 px-6 relative" id="contact">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#d4924d] to-transparent"/>
      <div className="max-w-[860px] mx-auto">
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-[0.72rem] font-bold tracking-[0.14em] uppercase text-[#d4924d] mb-2">Get in Touch</p>
            <h2 className="font-['Playfair_Display'] text-[clamp(1.6rem,3.5vw,2.5rem)] text-[#f0b870] font-bold">Contact & Feedback</h2>
            <div className="w-15 h-[3px] bg-gradient-to-r from-[#9a6530] to-[#f0b870] rounded mt-3.5 mx-auto"/>
            <p className="mt-4 text-[#b8956a] text-[0.95rem] max-w-[480px] mx-auto leading-[1.75]">Have a question, special request, or feedback? We'd love to hear from you — drop us a message and we'll get back to you shortly.</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Info sidebar */}
          <Reveal delay={0.05}>
            <div className="lg:col-span-2 flex flex-col gap-4">
              {[
                { icon: <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>, dot: <circle cx="12" cy="10" r="3"/>, label:'Visit Us', val:'Koramangala, Bengaluru, KA 560034' },
                { icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>, dot: null, label:'Call Us', val:'+91 98765 43210' },
                { icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, dot: null, label:'Email Us', val:'hello@brewandbite.in' },
                { icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, dot: null, label:'Hours', val:'7:00 AM – 10:00 PM, Daily' },
              ].map(({ icon, dot, label, val }) => (
                <div key={label} className="flex gap-3.5 items-start bg-[rgba(212,146,77,.06)] border border-[rgba(212,146,77,.18)] rounded-[14px] px-4 py-3.5">
                  <div className="w-9 h-9 rounded-[10px] flex-shrink-0 bg-gradient-to-br from-[#78350f] to-[#d97706] flex items-center justify-center">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}{dot}</svg>
                  </div>
                  <div>
                    <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-0.5">{label}</div>
                    <div className="text-[0.86rem] text-[#f5e6ce] font-medium leading-[1.45]">{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.12}>
            <div className="lg:col-span-3 bg-gradient-to-br from-[#1e1108] to-[#150c04] border border-[rgba(212,146,77,.25)] rounded-2xl p-6 sm:p-8 shadow-[0_12px_48px_rgba(0,0,0,.4)]">
              {cSent ? (
                <div className="text-center py-8 animate-[slideUp_0.45s_both]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9a6530] to-[#d4924d] flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_rgba(212,146,77,.35)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3 className="font-['Playfair_Display'] text-[1.3rem] text-[#f0b870] mb-2">Message sent!</h3>
                  <p className="text-[#b8956a] text-[0.88rem] leading-[1.65]">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.73rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-1.5">Full Name <span className="text-[#d4924d]">*</span></label>
                      <input type="text" placeholder="Your name" value={cName} onChange={e => setCName(e.target.value)} maxLength={50}
                        className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(212,146,77,.22)] rounded-xl px-4 py-2.5 text-[#f5e6ce] text-[0.88rem] font-['Inter'] outline-none focus:border-[rgba(212,146,77,.55)] transition-colors placeholder-[#4a3520]"/>
                    </div>
                    <div>
                      <label className="block text-[0.73rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-1.5">Email <span className="text-[#d4924d]">*</span></label>
                      <input type="email" placeholder="your@email.com" value={cEmail} onChange={e => setCEmail(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(212,146,77,.22)] rounded-xl px-4 py-2.5 text-[#f5e6ce] text-[0.88rem] font-['Inter'] outline-none focus:border-[rgba(212,146,77,.55)] transition-colors placeholder-[#4a3520]"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[0.73rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-1.5">Phone <span className="text-[#7a5c3a] font-normal normal-case">(optional)</span></label>
                    <input type="tel" placeholder="+91 98765 43210" value={cPhone} onChange={e => setCPhone(e.target.value)} maxLength={15}
                      className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(212,146,77,.22)] rounded-xl px-4 py-2.5 text-[#f5e6ce] text-[0.88rem] font-['Inter'] outline-none focus:border-[rgba(212,146,77,.55)] transition-colors placeholder-[#4a3520]"/>
                  </div>
                  <div>
                    <label className="block text-[0.73rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-1.5">Message <span className="text-[#d4924d]">*</span></label>
                    <textarea placeholder="Tell us how we can help, or share your feedback…" value={cMsg} onChange={e => setCMsg(e.target.value)} rows={4} maxLength={500}
                      className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(212,146,77,.22)] rounded-xl px-4 py-2.5 text-[#f5e6ce] text-[0.88rem] font-['Inter'] outline-none focus:border-[rgba(212,146,77,.55)] transition-colors resize-none placeholder-[#4a3520]"/>
                    <div className="text-right text-[0.7rem] text-[#4a3520] mt-0.5">{cMsg.length}/500</div>
                  </div>
                  {cErr && (
                    <p className="text-[#ef4444] text-[0.83rem] flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {cErr}
                    </p>
                  )}
                  <button onClick={handleContact}
                    className="w-full bg-gradient-to-br from-[#9a6530] via-[#d4924d] to-[#f0b870] text-white border-none rounded-xl py-3.5 text-base font-bold cursor-pointer font-['Inter'] shadow-[0_4px_20px_rgba(212,146,77,.3)] hover:shadow-[0_6px_28px_rgba(212,146,77,.45)] hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-center gap-2">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send Message
                  </button>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Google Maps Section ──────────────────────────────────────────────────────
function GoogleMapsSection() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const { ref, visible } = useReveal();
  const address = 'Koramangala, Bengaluru, Karnataka 560034, India';
  const mapsQuery = encodeURIComponent('Koramangala Bengaluru India');
  const embedUrl = `https://maps.google.com/maps?q=${mapsQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
  const openUrl = `https://www.google.com/maps/search/${mapsQuery}`;
  return (
    <section aria-label="Location and directions" className="bg-[#100904] py-16 sm:py-20 px-6 relative" id="location">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,146,77,.3)] to-transparent"/>
      <div className="max-w-[900px] mx-auto">
        <Reveal>
          <div className="text-center mb-11">
            <p className="text-[0.72rem] font-bold tracking-[0.14em] uppercase text-[#d4924d] mb-2">Find Us</p>
            <h2 className="font-['Playfair_Display'] text-[clamp(1.6rem,3.5vw,2.5rem)] text-[#f0b870] font-bold">Visit Brew & Bite</h2>
            <div className="w-15 h-[3px] bg-gradient-to-r from-[#9a6530] to-[#f0b870] rounded mt-3.5 mx-auto"/>
            <p className="mt-4 text-[#b8956a] text-[0.95rem] max-w-[480px] mx-auto leading-[1.75]">We're nestled in the heart of Koramangala — easy to find, hard to leave.</p>
          </div>
        </Reveal>
        <div ref={ref} className={`transition-[opacity,transform] duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-9'}`}>
          <div className="relative rounded-2xl overflow-hidden border border-[rgba(212,146,77,.25)] shadow-[0_16px_60px_rgba(0,0,0,.6)]">
            {!mapLoaded && (
              <div className="absolute inset-0 bg-[#1e1108] flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3 text-[#b8956a]">
                  <div className="w-10 h-10 border-[3px] border-[rgba(212,146,77,.2)] border-t-[#d4924d] rounded-full animate-spin"/>
                  <span className="text-[0.85rem]">Loading map…</span>
                </div>
              </div>
            )}
            <iframe
              title="Brew & Bite Cafe location on Google Maps — Koramangala, Bengaluru"
              src={embedUrl}
              width="100%"
              height="380"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setMapLoaded(true)}
              aria-label="Interactive Google Map showing Brew & Bite Cafe in Koramangala, Bengaluru"
            />
          </div>
          <div className="mt-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-start gap-3 flex-1 bg-[rgba(212,146,77,.07)] border border-[rgba(212,146,77,.2)] rounded-[14px] px-4.5 py-4">
              <div className="w-9 h-9 rounded-[10px] flex-shrink-0 bg-gradient-to-br from-[#78350f] to-[#d97706] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <div className="text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-0.5">Address</div>
                <address className="text-[0.88rem] text-[#f5e6ce] font-medium not-italic leading-[1.55]">{address}</address>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0 flex-col xs:flex-row w-full sm:w-auto">
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#9a6530] to-[#d4924d] text-white rounded-[14px] px-5 py-3 text-[0.88rem] font-semibold cursor-pointer no-underline transition-all duration-300 hover:shadow-[0_6px_24px_rgba(212,146,77,.4)] hover:translate-y-[-2px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                Get Directions
              </a>
              <a href={openUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[rgba(212,146,77,.1)] border border-[rgba(212,146,77,.3)] text-[#d4924d] rounded-[14px] px-5 py-3 text-[0.88rem] font-semibold cursor-pointer no-underline transition-all duration-300 hover:bg-[rgba(212,146,77,.18)] hover:translate-y-[-2px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── QR Menu Section ──────────────────────────────────────────────────────────
function QRMenuSection() {
  const [shared, setShared] = useState(false);
  const menuUrl = 'https://caf-menu-instant.vercel.app/';
  const qrUrl   = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://caf-menu-instant.vercel.app/&format=png&margin=10';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Brew & Bite Menu', text: 'Check out the menu at Brew & Bite Cafe!', url: menuUrl });
      } else {
        await navigator.clipboard.writeText(menuUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {
      try { await navigator.clipboard.writeText(menuUrl); setShared(true); setTimeout(() => setShared(false), 2500); } catch {}
    }
  };

  return (
    <section aria-label="Scan digital menu QR code" className="bg-[#1a0f06] py-16 sm:py-20 px-6 relative" id="qr-menu">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#d4924d] to-transparent"/>
      <div className="max-w-[900px] mx-auto">
        <div className="bg-gradient-to-br from-[#1e1108] to-[#150c04] border border-[rgba(212,146,77,.25)] rounded-3xl px-6 py-10 sm:px-12 sm:py-14 flex flex-col lg:flex-row items-center gap-10 shadow-[0_16px_60px_rgba(0,0,0,.5)]">
          <Reveal>
            <div className="relative flex-shrink-0">
              <div className="bg-[rgba(212,146,77,.08)] border border-[rgba(212,146,77,.3)] rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,.4)]">
                <img
                  src={qrUrl}
                  alt="QR code to scan and view Brew & Bite digital menu"
                  width="220"
                  height="220"
                  loading="lazy"
                  className="rounded-[10px] block"
                />
              </div>
              <div className="absolute -top-3 -right-3 w-9 h-9 bg-gradient-to-br from-[#9a6530] to-[#f0b870] rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(212,146,77,.4)] animate-[pulse_2.5s_infinite]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  <path d="M14 14h3v3M17 20h3M20 17v3"/>
                </svg>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="text-center lg:text-left flex-1 max-w-[460px]">
              <p className="text-[0.72rem] font-bold tracking-[0.14em] uppercase text-[#d4924d] mb-2">Digital Menu</p>
              <h2 className="font-['Playfair_Display'] text-[clamp(1.5rem,3.5vw,2.2rem)] text-[#f0b870] font-bold leading-[1.2]">Scan to View Our Digital Menu</h2>
              <div className="w-12 h-[3px] bg-gradient-to-r from-[#9a6530] to-[#f0b870] rounded mt-3.5 lg:mx-0 mx-auto"/>
              <p className="mt-4 text-[#b8956a] text-[0.95rem] leading-[1.75]">Point your phone camera at the QR code to instantly browse our full menu — no app needed. Save your favourites and order with ease!</p>
              <div className="mt-7 flex flex-col xs:flex-row gap-3 justify-center lg:justify-start">
                <a
                  href="/menu.pdf"
                  download
                  onClick={(e) => { e.preventDefault(); window.open(menuUrl, '_blank'); }}
                  className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#9a6530] to-[#d4924d] text-white rounded-[14px] px-5 py-3 text-[0.88rem] font-semibold cursor-pointer no-underline transition-all duration-300 hover:shadow-[0_6px_24px_rgba(212,146,77,.4)] hover:translate-y-[-2px] font-['Inter']">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  View Full Menu
                </a>
                <button
                  onClick={handleShare}
                  className={`flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-[0.88rem] font-semibold cursor-pointer transition-all duration-300 hover:translate-y-[-2px] font-['Inter'] ${shared ? 'bg-[rgba(34,197,94,.12)] border border-[rgba(34,197,94,.35)] text-[#22c55e]' : 'bg-[rgba(212,146,77,.1)] border border-[rgba(212,146,77,.3)] text-[#d4924d] hover:bg-[rgba(212,146,77,.18)]'}`}>
                  {shared ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                      Share Menu
                    </>
                  )}
                </button>
              </div>
              <p className="mt-5 text-[0.78rem] text-[#7a5c3a] flex items-center gap-1.5 justify-center lg:justify-start">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Works with any smartphone camera — no app required
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── About Page ───────────────────────────────────────────────────────────────
function AboutPage() {
  useEffect(() => {
    document.title = 'About Us | Brew & Bite Cafe — Our Story, Koramangala Bengaluru';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Founded in 2018 in Koramangala, Bengaluru, Brew & Bite Cafe is built on a passion for great coffee and honest food. Learn our story, values, and what makes us unique.');
  }, []);
  return (
    <>
      <div className="bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,#3d1f06_0%,#100904_70%)] pt-20 sm:pt-22 pb-14 sm:pb-15 text-center relative overflow-hidden px-6">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=80')] bg-center bg-cover opacity-[0.08]"/>
        <div className="relative z-[1]">
          <Reveal>
            <h1 className="font-['Playfair_Display'] text-[clamp(2rem,5vw,3.8rem)] font-black text-[#f0b870]">About Us</h1>
            <p className="mt-4 text-[#b8956a] text-base max-w-[560px] mx-auto leading-[1.75]">A story brewed with passion, poured with love — and served fresh every single day.</p>
          </Reveal>
        </div>
      </div>

      <div className="max-w-[960px] mx-auto my-14 sm:my-17 px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-15 items-start">
        <Reveal>
          <p className="text-[0.72rem] font-bold tracking-[0.14em] uppercase text-[#d4924d] mb-2">Our Journey</p>
          <h2 className="font-['Playfair_Display'] text-2xl text-[#d4924d] font-bold">About <span className="text-[#f0b870]">Brew &amp; Bite</span></h2>
          <div className="w-12.5 h-[3px] bg-gradient-to-r from-[#9a6530] to-[#f0b870] rounded mt-3.5"/>
          {['Founded in 2018 by a pair of passionate food lovers in the heart of Koramangala, Bengaluru, Brew & Bite was born from a simple dream: to create a space where great coffee and honest food could bring people together.',
            'Every bean we roast is single-origin and traceable. Every ingredient is sourced from local farmers and artisans. Every dish is prepared fresh each morning — never pre-packaged, never rushed.',
            'From students cramming for exams to remote workers on deadline, from first dates to celebratory brunches — Brew & Bite has quietly become a part of countless stories in this neighbourhood.']
            .map((p, i) => <p key={i} className="mt-3.5 text-[#b8956a] leading-[1.85] text-[0.95rem]">{p}</p>)}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8">
            {[
              { label:'Location', val:'Koramangala, Bengaluru', d:<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>, dot:<circle cx="12" cy="10" r="3"/> },
              { label:'Opening Hours', val:'7:00 AM – 10:00 PM', d:<circle cx="12" cy="12" r="10"/>, dot:<polyline points="12 6 12 12 16 14"/> },
              { label:'Reservations', val:'+91 98765 43210', d:<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>, dot:null },
              { label:'Email Us', val:'hello@brewandbite.in', d:<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, dot:null },
            ].map(({ label, val, d, dot }) => (
              <div key={label} className="flex gap-3 items-start bg-[rgba(212,146,77,.06)] border border-[rgba(212,146,77,.18)] rounded-[14px] px-4 py-3.5">
                <div className="w-9.5 h-9.5 rounded-[10px] flex-shrink-0 bg-gradient-to-br from-[#78350f] to-[#d97706] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}{dot}</svg>
                </div>
                <div>
                  <div className="text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[#7a5c3a] mb-0.5">{label}</div>
                  <div className="text-[0.88rem] text-[#f5e6ce] font-medium">{val}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=900&q=80" alt="Inside Brew & Bite Cafe — cozy interior in Koramangala Bengaluru" loading="lazy" className="w-full h-56 sm:h-72 object-cover rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,.5)] block"/>
            <div className="absolute -bottom-5 -right-4 bg-gradient-to-br from-[#9a6530] to-[#d4924d] rounded-2xl px-4.5 py-3.5 shadow-[0_6px_24px_rgba(0,0,0,.45)] flex flex-col items-center gap-1 animate-[pulse_2.8s_infinite]">
              <CupSvg size={28} stroke={1.8}/>
              <span className="font-['Playfair_Display'] text-[0.78rem] font-bold text-white whitespace-nowrap">Brew &amp; Bite</span>
              <small className="text-[0.62rem] text-[rgba(255,255,255,.75)] tracking-[0.1em]">Est. 2018</small>
            </div>
            <div className="absolute -top-4 -left-4 bg-gradient-to-br from-[#9f1239] to-[#e11d48] rounded-full w-11 h-11 flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,.4)] animate-[popIn_0.6s_0.4s_both] text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-center mt-10 sm:mt-10.5 bg-[rgba(212,146,77,.07)] border border-[rgba(212,146,77,.2)] rounded-2xl px-5 sm:px-6 py-5 gap-0">
            {([{ num:'6+', lbl:'Years' }, null, { num:'50K+', lbl:'Customers' }, null, { num:'4.9★', lbl:'Rating' }] as const).map((s, i) =>
              s ? (
                <div key={i} className="text-center flex-1">
                  <div className="font-['Playfair_Display'] text-[1.8rem] font-black text-[#d4924d]">{s.num}</div>
                  <div className="text-[0.8rem] text-[#b8956a] mt-0.5">{s.lbl}</div>
                </div>
              ) : <div key={i} className="w-px h-10 bg-[rgba(212,146,77,.25)] mx-3"/>
            )}
          </div>
        </Reveal>
      </div>

      <div className="bg-[#1a0f06] py-16 sm:py-17 relative mt-10 px-6">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#d4924d] to-transparent"/>
        <div className="text-center pb-10">
          <Reveal>
            <h2 className="font-['Playfair_Display'] text-[clamp(1.8rem,4vw,2.9rem)] text-[#d4924d] font-bold">What Drives Us</h2>
            <div className="w-15 h-[3px] bg-gradient-to-r from-[#9a6530] to-[#f0b870] rounded mt-3.5 mx-auto"/>
          </Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[960px] mx-auto">
          {[
            { delay:0, color:'linear-gradient(135deg,#78350f,#d97706)', icon:<><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>, title:'Quality First', text:'We source only the finest ingredients — from premium single-origin coffee beans to fresh, locally-grown produce every single day.' },
            { delay:.12, color:'linear-gradient(135deg,#164e63,#0891b2)', icon:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, title:'Community Spirit', text:"We're more than a cafe — a gathering place where local artists, neighbours, and strangers become lifelong friends." },
            { delay:.24, color:'linear-gradient(135deg,#14532d,#16a34a)', icon:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, title:'Made Fresh Daily', text:"Every item on our menu is prepared fresh each morning. We never compromise on freshness or flavour — ever." },
          ].map(({ delay, color, icon, title, text }) => (
            <Reveal key={title} delay={delay}>
              <div className="bg-gradient-to-br from-[#1e1108] to-[#150c04] border border-[rgba(212,146,77,.2)] rounded-[18px] px-5.5 py-7.5 text-center transition-all duration-[360ms] h-full hover:translate-y-[-7px] hover:border-[rgba(212,146,77,.35)]">
                <div className="w-14.5 h-14.5 rounded-2xl mx-auto mb-4.5 flex items-center justify-center" style={{ background: color }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                </div>
                <h3 className="font-['Playfair_Display'] text-[1.1rem] text-[#f0b870]">{title}</h3>
                <p className="mt-2.5 text-[#b8956a] text-[0.84rem] leading-[1.72]">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="max-w-[960px] mx-auto mt-12.5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ num:'30+', label:'Menu Items' }, { num:'4', label:'Signature Brews' }, { num:'100%', label:'Fresh Ingredients' }, { num:'Daily', label:'New Specials' }]
            .map(({ num, label }) => (
              <Reveal key={label}>
                <div className="bg-[#1e1108] border border-[rgba(212,146,77,.2)] rounded-[18px] px-5 py-7 text-center">
                  <div className="font-['Playfair_Display'] text-[2.2rem] font-black text-[#d4924d]">{num}</div>
                  <p className="text-[#b8956a] text-[0.88rem] mt-1.5">{label}</p>
                </div>
              </Reveal>
            ))}
        </div>
      </div>

      <SocialMediaSection/>

      <footer className="bg-[#1e1108] border-t border-[rgba(212,146,77,.2)] py-9 text-center px-6">
        <div className="flex items-center justify-center gap-2.5 font-['Playfair_Display'] text-[1.15rem] text-[#d4924d] mb-2.5">
          <CupSvg size={22} stroke={1.8}/> Brew &amp; Bite Cafe
        </div>
        <p className="text-[#7a5c3a] text-[0.84rem]">© 2026 <span className="text-[#d4924d]">Brew &amp; Bite Cafe</span> · Where Every Sip and Bite Tells a Story</p>
      </footer>
    </>
  );
}

// ── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]           = useState<'home'|'about'>('home');
  const [cart, setCart]           = useState<CartMap>({});
  const [cartOpen, setCartOpen]   = useState(false);
  const [modal, setModal]         = useState<MenuItem | null>(null);
  const [toast, setToast]         = useState({ msg:'', show:false });
  const [feedback, setFeedback]   = useState({ open:false, orderId:'' });
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = (msg: string) => {
    setToast({ msg, show:true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show:false })), 2800);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const entry = prev[item.id];
      return { ...prev, [item.id]: { item, qty: entry ? entry.qty + 1 : 1 } };
    });
    showToast(`${item.name} added to cart`);
  };

  const removeFromCart = (id: number) => setCart(prev => { const n={...prev}; delete n[id]; return n; });
  const changeQty = (id: number, d: number) => setCart(prev => {
    if (!prev[id]) return prev;
    return { ...prev, [id]: { ...prev[id], qty: Math.max(1, prev[id].qty + d) } };
  });

  const cartCount = Object.values(cart).reduce((s, c) => s + c.qty, 0);

  const checkout = () => {
    if (cartCount === 0) return;
    const total = Object.values(cart).reduce((s, c) => s + c.item.price * c.qty, 0);
    setPaymentAmount(total);
    setCartOpen(false);
    setPaymentOpen(true);
  };

  const onPaymentSuccess = () => {
    const orderId = 'BBC-' + Math.floor(1000 + Math.random() * 9000);
    setCart({});
    setPaymentOpen(false);
    setFeedback({ open:true, orderId });
  };

  const navTo = (p: 'home'|'about') => {
    setPage(p);
    setMobileMenuOpen(false);
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  return (
    <div className="bg-[#100904] text-[#f5e6ce] font-['Inter'] min-h-screen overflow-x-hidden">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(60px) scale(.95); } to { opacity:1; transform:none; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.13)} }
        @keyframes bob { 0%,100%{opacity:1;transform:scaleY(1)} 50%{opacity:.3;transform:scaleY(.7)} }
        @keyframes popIn { from{transform:scale(0) rotate(-15deg);opacity:0} to{transform:none;opacity:1} }
        @keyframes payModalIn { from { opacity:0; transform:translateY(48px) scale(.93); } to { opacity:1; transform:none; } }
        @keyframes tabSlideIn { from { opacity:0; transform:translateX(14px); } to { opacity:1; transform:none; } }
        @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:none; } }
        @keyframes amountPop { 0% { transform:scale(.7); opacity:0; } 70% { transform:scale(1.12); } 100% { transform:scale(1); opacity:1; } }
        @keyframes qrReveal { from { opacity:0; transform:scale(.88); } to { opacity:1; transform:none; } }
        @keyframes scanLine { 0% { top:14px; opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { top:calc(100% - 16px); opacity:0; } }
        @keyframes successIn { from { opacity:0; transform:scale(.82) translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes dashCircle { from { stroke-dashoffset:188.5; opacity:0; } to { stroke-dashoffset:0; opacity:1; } }
        @keyframes dashCheck { from { stroke-dashoffset:40; } to { stroke-dashoffset:0; } }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3.5 bg-[rgba(16,9,4,.92)] backdrop-blur-[18px] border-b border-[rgba(212,146,77,.2)]">
        <button onClick={() => navTo('home')} className="flex items-center gap-2.5 font-['Playfair_Display'] text-[1.15rem] text-[#d4924d] bg-none border-none cursor-pointer">
          <CupSvg size={28} stroke={1.8}/> <span className="hidden sm:inline">Brew &amp; Bite Cafe</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-9">
          <div className="flex gap-2">
            {(['home','about'] as const).map(p => (
              <button key={p} onClick={() => navTo(p)} className={`${page===p ? 'bg-[rgba(212,146,77,.1)] text-[#d4924d]' : 'text-[#b8956a]'} border-none cursor-pointer text-[0.9rem] font-medium px-3.5 py-1.75 rounded-lg tracking-[0.04em] transition-all duration-[360ms] font-['Inter'] capitalize hover:text-[#d4924d]`}>{p}</button>
            ))}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden bg-none border-none text-[#d4924d] cursor-pointer p-1">
          {mobileMenuOpen ? <CloseIcon/> : <MenuIcon/>}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div className={`fixed inset-0 z-[490] bg-[rgba(0,0,0,.85)] backdrop-blur-sm lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)}>
        <div className={`fixed top-[60px] left-0 right-0 bg-[#1e1108] border-b border-[rgba(212,146,77,.2)] p-6 transition-transform duration-300 ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex flex-col gap-4">
            {(['home','about'] as const).map(p => (
              <button key={p} onClick={() => navTo(p)} className={`${page===p ? 'text-[#d4924d]' : 'text-[#b8956a]'} border-none cursor-pointer text-lg font-medium py-2 text-left font-['Inter'] capitalize transition-colors`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={`pt-[60px] ${page==='about' ? '' : ''}`}>
        {page==='home'
          ? <HomePage onDetails={setModal} onAdd={addToCart}/>
          : <AboutPage/>}
      </div>

      <ItemModal item={modal} onClose={() => setModal(null)} onAdd={addToCart}/>
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onQty={changeQty} onRemove={removeFromCart} onCheckout={checkout} onNavigateHome={() => navTo('home')}/>
      <PaymentModal open={paymentOpen} amount={paymentAmount} onClose={() => setPaymentOpen(false)} onSuccess={onPaymentSuccess}/>
      <FeedbackModal open={feedback.open} orderId={feedback.orderId} onClose={() => setFeedback(f => ({ ...f, open:false }))}/>
      <Toast msg={toast.msg} show={toast.show}/>
    </div>
  );
}
