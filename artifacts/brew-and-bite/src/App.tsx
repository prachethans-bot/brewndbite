import { useState, useEffect, useRef } from 'react';

// ── Local images from attached_assets ──────────────────────────────────────
import chaiImg   from '@assets/istockphoto-614533094-612x612_1782735711394.jpg';
import puffsImg  from '@assets/image_1782735974246.png';
import coffeeImg from '@assets/image_1782736035803.png';

// ── Google Fonts (injected once at module scope via link tag in index.html) ─

// ── Data ───────────────────────────────────────────────────────────────────
interface MenuItem {
  id: number;
  name: string;
  tag: string;
  price: number;
  desc: string;
  img: string;
  ingredients: string[];
}

const ITEMS: MenuItem[] = [
  {
    id:1, name:'Classic Burger', tag:'Main Course', price:149,
    desc:'Juicy and flavorful, made fresh to order with premium ingredients and house sauces',
    img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    ingredients:['Brioche Bun','Chicken / Veg Patty','Fresh Lettuce','Tomato Slices','Onion Rings','Cheddar Cheese','House Mayo','Ketchup','Butter','Sea Salt','Black Pepper'],
  },
  {
    id:2, name:'Masala Chai', tag:'Beverages', price:49,
    desc:'Aromatic spiced milk tea brewed with whole spices the traditional way',
    img: chaiImg,
    ingredients:['Assam Tea Leaves','Full Cream Milk','Fresh Ginger','Green Cardamom','Cinnamon Stick','Cloves','Black Pepper','Jaggery'],
  },
  {
    id:3, name:'Signature Coffee', tag:'Beverages', price:79,
    desc:'Rich, aromatic double-shot espresso crafted to perfection with microfoam art',
    img: coffeeImg,
    ingredients:['Double Espresso Shot','Steamed Full-Cream Milk','Silky Microfoam','Cinnamon Dust','Vanilla Syrup','Brown Sugar (opt)'],
  },
  {
    id:4, name:'Spiced Puffs', tag:'Snacks', price:59,
    desc:'Flaky, golden pastry filled with spiced potato and peas — baked to perfection',
    img: puffsImg,
    ingredients:['Puff Pastry Shell','Spiced Potato','Green Peas','Fresh Coriander','Cheese','Chaat Masala','Green Chilli','Black Pepper'],
  },
  {
    id:5, name:'Oreo Milkshake', tag:'Beverages', price:119,
    desc:'Creamy, chocolatey indulgence blended thick — topped with whipped cream & Oreo crumble',
    img:'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80',
    ingredients:['Oreo Cookies','Full Cream Milk','Vanilla Ice Cream','Whipped Cream','Dark Chocolate Sauce','Oreo Crumble Topping'],
  },
  {
    id:6, name:'Choco Chip Cookies', tag:'Snacks', price:39,
    desc:'Homestyle thick-baked cookies loaded with dark chocolate chips — warm & gooey inside',
    img:'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80',
    ingredients:['Butter','Dark Brown Sugar','All-Purpose Flour','Dark Choc Chips','Free-Range Eggs','Vanilla Extract','Baking Soda','Sea Salt Flakes'],
  },
];

// ── Cart types ─────────────────────────────────────────────────────────────
interface CartEntry { item: MenuItem; qty: number; }
type CartMap = Record<number, CartEntry>;

// ── Reusable SVGs ──────────────────────────────────────────────────────────
const CupSvg = ({ size = 28, stroke = 1.8 }: { size?: number; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}>
    <path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
    <line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>
  </svg>
);
const CartSvg = ({ size = 17 }: { size?: number }) => (
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

// ── Reveal hook ────────────────────────────────────────────────────────────
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

// ── Reveal wrapper ─────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(38px)',
      transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div style={{
      position:'fixed', bottom:28, left:'50%',
      transform: show ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(120px)',
      zIndex:700,
      background:'linear-gradient(135deg,#201208,#2e1a08)',
      border:'1px solid #d4924d', borderRadius:12,
      padding:'13px 22px', color:'#f5e6ce', fontSize:'.88rem',
      boxShadow:'0 8px 32px rgba(0,0,0,.6)',
      transition:'transform .42s cubic-bezier(.4,0,.2,1)',
      whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:10,
    }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {msg}
    </div>
  );
}

// ── Item Modal ─────────────────────────────────────────────────────────────
function ItemModal({ item, onClose, onAdd }: { item: MenuItem | null; onClose: () => void; onAdd: (i: MenuItem) => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position:'fixed', inset:0, zIndex:600,
      background:'rgba(0,0,0,.82)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      opacity: item ? 1 : 0, pointerEvents: item ? 'all' : 'none',
      transition:'opacity .36s cubic-bezier(.4,0,.2,1)',
    }}>
      {item && (
        <div style={{
          background:'#1e1108', border:'1px solid rgba(212,146,77,.2)', borderRadius:22,
          maxWidth:600, width:'100%', overflow:'hidden', maxHeight:'90vh', overflowY:'auto',
          transform: item ? 'none' : 'translateY(36px) scale(.95)',
          transition:'transform .36s cubic-bezier(.4,0,.2,1)',
          position:'relative',
        }}>
          <button onClick={onClose} style={{
            position:'absolute', top:14, right:14, zIndex:10,
            background:'rgba(0,0,0,.65)', border:'1px solid rgba(255,255,255,.15)',
            borderRadius:'50%', width:36, height:36, color:'#fff',
            fontSize:'1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          }}>✕</button>
          <div style={{ position:'relative', height:270, overflow:'hidden' }}>
            <img src={item.img} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(8,4,0,.85) 0%,transparent 55%)' }}/>
            <div style={{
              position:'absolute', bottom:16, left:16, zIndex:1,
              fontSize:'.63rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase',
              color:'#f0b870', background:'rgba(0,0,0,.65)', border:'1px solid rgba(212,146,77,.4)',
              borderRadius:20, padding:'4px 12px',
            }}>{item.tag}</div>
          </div>
          <div style={{ padding:26 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.75rem', color:'#f0b870' }}>{item.name}</h3>
            <p style={{ color:'#b8956a', marginTop:6, fontSize:'.92rem', lineHeight:1.65 }}>{item.desc}</p>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:14, flexWrap:'wrap' }}>
              <span style={{ fontSize:'1.6rem', fontWeight:800, color:'#d4924d' }}>₹{item.price}</span>
              <span style={{ fontSize:'.82rem', color:'#7a5c3a' }}>per serving</span>
              <button onClick={() => { onAdd(item); onClose(); }} style={{
                background:'linear-gradient(135deg,#9a6530,#d4924d)',
                color:'#fff', border:'none', borderRadius:10,
                padding:'10px 20px', fontSize:'.88rem', fontWeight:600,
                cursor:'pointer', display:'flex', alignItems:'center', gap:7,
                transition:'all .36s', marginLeft:'auto',
                fontFamily:"'Inter',sans-serif",
              }}>
                <CartSvg size={15}/> Add to Cart
              </button>
            </div>
            <div style={{ marginTop:22, display:'flex', alignItems:'center', gap:8, fontSize:'.95rem', fontWeight:600, color:'#f5e6ce', borderTop:'1px solid rgba(212,146,77,.2)', paddingTop:20 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
              </svg>
              Fresh Ingredients
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginTop:14 }}>
              {item.ingredients.map(ing => (
                <div key={ing} style={{
                  background:'rgba(255,255,255,.04)', border:'1px solid rgba(212,146,77,.2)',
                  borderRadius:9, padding:'10px 14px', fontSize:'.83rem', color:'#b8956a',
                  display:'flex', alignItems:'center', gap:9,
                }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#d4924d', display:'inline-block', flexShrink:0 }}/>
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

// ── Cart Panel ─────────────────────────────────────────────────────────────
function CartPanel({
  open, onClose, cart, onQty, onRemove, onCheckout,
}: {
  open: boolean; onClose: () => void;
  cart: CartMap; onQty: (id: number, d: number) => void; onRemove: (id: number) => void;
  onCheckout: () => void;
}) {
  const entries = Object.values(cart);
  const total   = entries.reduce((s, c) => s + c.item.price * c.qty, 0);
  const hasItems = entries.length > 0;

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position:'fixed', inset:0, zIndex:400,
      background:'rgba(0,0,0,.7)', backdropFilter:'blur(6px)',
      opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
      transition:'opacity .36s cubic-bezier(.4,0,.2,1)',
    }}>
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width:380, maxWidth:'95vw',
        background:'#1e1108', borderLeft:'1px solid rgba(212,146,77,.2)',
        display:'flex', flexDirection:'column', zIndex:401,
        transform: open ? 'none' : 'translateX(100%)',
        transition:'transform .36s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header */}
        <div style={{ padding:'18px 20px 16px', borderBottom:'1px solid rgba(212,146,77,.2)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', color:'#f0b870' }}>Your Cart</h3>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#b8956a', fontSize:'1.4rem', cursor:'pointer', lineHeight:1, padding:'2px 6px' }}>✕</button>
          </div>
          <button onClick={onClose} style={{
            display:'flex', alignItems:'center', gap:8,
            background:'rgba(212,146,77,.1)', border:'1px solid rgba(212,146,77,.25)',
            borderRadius:10, padding:'9px 16px', color:'#d4924d',
            fontSize:'.84rem', fontWeight:600, cursor:'pointer', width:'100%',
            fontFamily:"'Inter',sans-serif",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Continue Shopping
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 24px' }}>
          {!hasItems ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, color:'#7a5c3a', textAlign:'center' }}>
              <CartSvg size={52}/>
              <p style={{ fontSize:'.9rem', lineHeight:1.6 }}>Your cart is empty.<br/>Add something delicious!</p>
              <button onClick={onClose} style={{ background:'linear-gradient(135deg,#9a6530,#d4924d)', color:'#fff', border:'none', borderRadius:10, padding:'11px 22px', fontSize:'.88rem', fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Browse Menu</button>
            </div>
          ) : entries.map(({ item, qty }) => (
            <div key={item.id} style={{ display:'flex', gap:12, padding:'14px 0', borderBottom:'1px solid rgba(212,146,77,.2)', alignItems:'center' }}>
              <img src={item.img} alt={item.name} style={{ width:60, height:60, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'.92rem', fontWeight:600, color:'#f5e6ce', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                <div style={{ fontSize:'.82rem', color:'#d4924d', marginTop:3 }}>₹{item.price} × {qty} = <strong>₹{item.price * qty}</strong></div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                  {[-1, null, 1].map((d, i) => d === null ? (
                    <span key={i} style={{ fontSize:'.88rem', fontWeight:700, color:'#f5e6ce', minWidth:20, textAlign:'center' }}>{qty}</span>
                  ) : (
                    <button key={i} onClick={() => onQty(item.id, d)} style={{
                      width:26, height:26, borderRadius:'50%',
                      border:'1px solid rgba(212,146,77,.2)',
                      background:'rgba(212,146,77,.1)', color:'#d4924d',
                      fontSize:'1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    }}>{d < 0 ? '−' : '+'}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => onRemove(item.id)} style={{ background:'none', border:'none', color:'#7a5c3a', cursor:'pointer', fontSize:'.8rem' }}>✕</button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {hasItems && (
          <div style={{ padding:'20px 24px', borderTop:'1px solid rgba(212,146,77,.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:'.9rem', color:'#b8956a' }}>Total</span>
              <span style={{ fontSize:'1.4rem', fontWeight:800, color:'#f0b870' }}>₹{total}</span>
            </div>
            <button onClick={onCheckout} style={{
              width:'100%',
              background:'linear-gradient(135deg,#9a6530,#d4924d,#f0b870)',
              color:'#fff', border:'none', borderRadius:12,
              padding:16, fontSize:'1rem', fontWeight:700,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              transition:'all .36s', fontFamily:"'Inter',sans-serif",
              boxShadow:'0 4px 20px rgba(212,146,77,.3)',
            }}>
              <CheckSvg/> Place Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Feedback Modal ─────────────────────────────────────────────────────────
function FeedbackModal({ open, orderId, onClose }: { open: boolean; orderId: string; onClose: () => void }) {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [comment, setComment]   = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) { setRating(0); setHovered(0); setComment(''); setSubmitted(false); }
  }, [open]);

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
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position:'fixed', inset:0, zIndex:800,
      background:'rgba(0,0,0,.85)', backdropFilter:'blur(10px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
      transition:'opacity .36s cubic-bezier(.4,0,.2,1)',
    }}>
      <div style={{
        background:'linear-gradient(160deg,#201208 0%,#2a1508 60%,#180e04 100%)',
        border:'1px solid rgba(212,146,77,.3)', borderRadius:24,
        padding:40, maxWidth:440, width:'100%',
        boxShadow:'0 24px 80px rgba(0,0,0,.7)',
        animation: open ? 'slideUp .45s cubic-bezier(.4,0,.2,1) both' : 'none',
        position:'relative',
      }}>
        <button onClick={onClose} style={{
          position:'absolute', top:16, right:16,
          background:'rgba(212,146,77,.1)', border:'1px solid rgba(212,146,77,.25)',
          borderRadius:'50%', width:32, height:32,
          color:'#b8956a', fontSize:'1rem', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>✕</button>

        {!submitted ? (
          <>
            {/* Icon */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{
                width:64, height:64, borderRadius:20,
                background:'linear-gradient(135deg,#9a6530,#d4924d)',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(212,146,77,.35)',
              }}>
                <CheckSvg/>
              </div>
              <div style={{ fontSize:'.75rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'#22c55e', marginBottom:6 }}>
                Order Placed!
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', color:'#f0b870', fontWeight:700 }}>
                Thank you for ordering!
              </h2>
              <p style={{ color:'#b8956a', fontSize:'.88rem', marginTop:6, lineHeight:1.6 }}>
                Order <strong style={{ color:'#d4924d' }}>#{orderId}</strong> is being prepared with love.
              </p>
            </div>

            {/* Divider */}
            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(212,146,77,.3),transparent)', margin:'20px 0' }}/>

            {/* Rating */}
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:'.9rem', fontWeight:600, color:'#f5e6ce', marginBottom:14 }}>
                How was your experience?
              </p>
              <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:20 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(n)}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:2, transition:'transform .15s' }}
                  >
                    <StarSvg filled={n <= (hovered || rating)}/>
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <p style={{ fontSize:'.82rem', color:'#b8956a', marginBottom:16, fontStyle:'italic' }}>
                  {rating === 1 ? 'Sorry to hear that!' : rating === 2 ? 'We\'ll do better!' : rating === 3 ? 'Thanks for the feedback.' : rating === 4 ? 'Great, glad you enjoyed it!' : 'Wonderful! You made our day!'}
                </p>
              )}

              <textarea
                placeholder="Leave a comment (optional)..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                style={{
                  width:'100%', background:'rgba(255,255,255,.04)',
                  border:'1px solid rgba(212,146,77,.25)', borderRadius:12,
                  padding:'12px 14px', color:'#f5e6ce', fontSize:'.88rem',
                  fontFamily:"'Inter',sans-serif", resize:'none', outline:'none',
                  marginBottom:16,
                }}
              />

              <button
                onClick={handleSubmit}
                disabled={rating === 0}
                style={{
                  width:'100%',
                  background: rating === 0
                    ? 'rgba(212,146,77,.2)'
                    : 'linear-gradient(135deg,#9a6530,#d4924d,#f0b870)',
                  color: rating === 0 ? '#7a5c3a' : '#fff',
                  border:'none', borderRadius:12, padding:'14px',
                  fontSize:'1rem', fontWeight:700, cursor: rating === 0 ? 'not-allowed' : 'pointer',
                  transition:'all .3s', fontFamily:"'Inter',sans-serif",
                  boxShadow: rating > 0 ? '0 4px 20px rgba(212,146,77,.3)' : 'none',
                }}
              >
                Submit Feedback
              </button>

              <button onClick={onClose} style={{
                background:'none', border:'none', color:'#7a5c3a',
                fontSize:'.82rem', cursor:'pointer', marginTop:12,
                fontFamily:"'Inter',sans-serif",
              }}>
                Skip for now
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:'3rem', marginBottom:16 }}>🎉</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', color:'#f0b870', marginBottom:8 }}>
              Thank you!
            </h2>
            <p style={{ color:'#b8956a', fontSize:'.9rem', lineHeight:1.65 }}>
              Your feedback means the world to us.<br/>See you again soon at Brew & Bite!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Menu Card ──────────────────────────────────────────────────────────────
function MenuCard({ item, onDetails, onAdd, delay }: { item: MenuItem; onDetails: () => void; onAdd: () => void; delay: number }) {
  const [hover, setHover] = useState(false);
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(38px)',
      transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`,
    }}>
      <div
        onClick={onDetails}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position:'relative', borderRadius:16, overflow:'hidden',
          aspectRatio:'4/3', cursor:'pointer',
          border: hover ? '1px solid rgba(212,146,77,.35)' : '1px solid rgba(212,146,77,.2)',
          transform: hover ? 'translateY(-8px) scale(1.016)' : 'none',
          boxShadow: hover ? '0 24px 64px rgba(0,0,0,.7)' : 'none',
          transition:'transform .36s cubic-bezier(.4,0,.2,1), box-shadow .36s, border-color .36s',
        }}
      >
        <img src={item.img} alt={item.name} loading="lazy" style={{
          width:'100%', height:'100%', objectFit:'cover', display:'block',
          transform: hover ? 'scale(1.08)' : 'none',
          transition:'transform .65s ease',
        }}/>
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to top,rgba(8,4,0,.96) 0%,rgba(0,0,0,.1) 55%,transparent 80%)',
          display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:20,
        }}>
          <span style={{
            display:'inline-block', fontSize:'.63rem', fontWeight:700,
            letterSpacing:'.14em', textTransform:'uppercase',
            color:'#f0b870', background:'rgba(212,146,77,.18)',
            border:'1px solid rgba(212,146,77,.3)', borderRadius:20,
            padding:'3px 10px', marginBottom:8, width:'fit-content',
          }}>{item.tag}</span>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.35rem', fontWeight:700, color:'#fff' }}>{item.name}</h3>
          <p style={{ fontSize:'.81rem', color:'rgba(255,255,255,.55)', marginTop:4 }}>{item.desc}</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, gap:8 }}>
            <span style={{ fontSize:'1.1rem', fontWeight:700, color:'#f0b870' }}>₹{item.price}</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={(e) => { e.stopPropagation(); onDetails(); }} style={{
                fontSize:'.76rem', fontWeight:600, border:'1px solid rgba(255,255,255,.2)',
                borderRadius:20, padding:'6px 13px', cursor:'pointer',
                background:'rgba(255,255,255,.1)', color:'#fff',
                display:'flex', alignItems:'center', gap:5,
                fontFamily:"'Inter',sans-serif",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Details
              </button>
              <button onClick={(e) => { e.stopPropagation(); onAdd(); }} style={{
                fontSize:'.76rem', fontWeight:600, border:'none',
                borderRadius:20, padding:'6px 13px', cursor:'pointer',
                background:'linear-gradient(135deg,#9a6530,#d4924d)', color:'#fff',
                display:'flex', alignItems:'center', gap:5,
                fontFamily:"'Inter',sans-serif",
              }}>
                <CartSvg size={13}/> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Home Page ──────────────────────────────────────────────────────────────
function HomePage({ onDetails, onAdd }: { onDetails: (i: MenuItem) => void; onAdd: (i: MenuItem) => void }) {
  return (
    <>
      {/* Hero */}
      <div style={{
        minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', textAlign:'center', padding:'130px 24px 80px',
        position:'relative', overflow:'hidden',
        background:'radial-gradient(ellipse 80% 55% at 50% 10%,#3d1f06 0%,#100904 68%)',
      }}>
        <div style={{
          position:'absolute', inset:0,
          background:"url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1800&q=80') center/cover",
          opacity:.08, zIndex:0,
        }}/>
        <div style={{ position:'relative', zIndex:1, display:'contents' }}>
          <div style={{ color:'#d4924d', marginBottom:22, display:'flex', alignItems:'center', justifyContent:'center', gap:14, animation:'fadeUp .8s .05s both' }}>
            <CupSvg size={36} stroke={1.7}/>
            <span style={{ color:'#7a5c3a', fontSize:'1.6rem', fontWeight:100 }}>|</span>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
              <line x1="6" y1="17" x2="18" y2="17"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily:"'Playfair Display',serif",
            fontSize:'clamp(2.8rem,7vw,5.4rem)', fontWeight:900,
            color:'#f0b870', lineHeight:1.06, animation:'fadeUp .9s .15s both',
          }}>Brew &amp; Bite Cafe</h1>
          <p style={{ marginTop:18, color:'#b8956a', fontSize:'1.05rem', fontWeight:300, animation:'fadeUp .9s .28s both' }}>
            Where Every Sip and Bite Tells a Story of Flavor and Passion
          </p>
          <div style={{ marginTop:34, display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center', animation:'fadeUp .9s .42s both' }}>
            {[
              { icon: <CupSvg size={15} stroke={2}/>, label:'Premium Brews' },
              { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/></svg>, label:'Fresh Cuisine' },
              { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label:'Quality First' },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display:'flex', alignItems:'center', gap:8,
                background:'rgba(212,146,77,.1)', border:'1px solid rgba(212,146,77,.28)',
                borderRadius:30, padding:'8px 18px', color:'#d4924d', fontSize:'.84rem', fontWeight:500,
              }}>
                {icon} {label}
              </div>
            ))}
          </div>
          <div style={{ marginTop:60, display:'flex', flexDirection:'column', alignItems:'center', gap:8, color:'#7a5c3a', fontSize:'.72rem', letterSpacing:'.14em', textTransform:'uppercase', animation:'fadeUp .9s .58s both' }}>
            <div style={{ width:1, height:44, background:'linear-gradient(to bottom,#d4924d,transparent)', animation:'bob 2s infinite' }}/>
            scroll to explore
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ background:'#1a0f06', paddingBottom:90, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,#d4924d,transparent)' }}/>
        <div style={{ textAlign:'center', padding:'80px 24px 44px' }}>
          <Reveal>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2rem,4vw,2.9rem)', color:'#d4924d', fontWeight:700 }}>Our Menu</h2>
            <div style={{ width:60, height:3, background:'linear-gradient(90deg,#9a6530,#f0b870)', borderRadius:4, margin:'14px auto 0' }}/>
            <p style={{ marginTop:16, color:'#b8956a', fontSize:'.97rem', maxWidth:520, marginInline:'auto', lineHeight:1.75 }}>
              Explore our carefully curated selection of beverages and delicacies, crafted with the finest ingredients
            </p>
          </Reveal>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:22, maxWidth:940, margin:'0 auto', padding:'0 22px' }}>
          {ITEMS.map((item, i) => (
            <MenuCard key={item.id} item={item} delay={i * 0.09}
              onDetails={() => onDetails(item)} onAdd={() => onAdd(item)}/>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background:'#1e1108', borderTop:'1px solid rgba(212,146,77,.2)', padding:'38px 24px', textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'#d4924d', marginBottom:10 }}>
          <CupSvg size={22} stroke={1.8}/> Brew &amp; Bite Cafe
        </div>
        <p style={{ color:'#7a5c3a', fontSize:'.84rem' }}>© 2026 <span style={{ color:'#d4924d' }}>Brew &amp; Bite Cafe</span> · Where Every Sip and Bite Tells a Story</p>
      </footer>
    </>
  );
}

// ── About Page ─────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div style={{
        background:'radial-gradient(ellipse 80% 55% at 50% 0%,#3d1f06 0%,#100904 70%)',
        padding:'90px 24px 60px', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', inset:0,
          background:"url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=80') center/cover",
          opacity:.08,
        }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <Reveal>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2.2rem,5vw,3.8rem)', fontWeight:900, color:'#f0b870', animation:'fadeUp .8s .1s both' }}>
              About Us
            </h1>
            <p style={{ marginTop:16, color:'#b8956a', fontSize:'1rem', maxWidth:560, marginInline:'auto', lineHeight:1.75, animation:'fadeUp .8s .25s both' }}>
              A story brewed with passion, poured with love — and served fresh every single day.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Story grid */}
      <div style={{ maxWidth:960, margin:'70px auto', padding:'0 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'start' }}>
        {/* Left text */}
        <Reveal>
          <p style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'#d4924d', marginBottom:8 }}>Our Journey</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'#d4924d', fontWeight:700 }}>
            About <span style={{ color:'#f0b870' }}>Brew &amp; Bite</span>
          </h2>
          <div style={{ width:50, height:3, background:'linear-gradient(90deg,#9a6530,#f0b870)', borderRadius:4, marginTop:14 }}/>
          <p style={{ marginTop:18, color:'#b8956a', lineHeight:1.85, fontSize:'.95rem' }}>
            Founded in 2018 by a pair of passionate food lovers in the heart of Koramangala, Bengaluru,
            Brew &amp; Bite was born from a simple dream: to create a space where great coffee and honest food
            could bring people together. What started as a 20-seat neighbourhood nook has grown into one of
            the city's most beloved cafes — while still holding on to that same warmth and intimacy.
          </p>
          <p style={{ marginTop:14, color:'#b8956a', lineHeight:1.85, fontSize:'.95rem' }}>
            Every bean we roast is single-origin and traceable. Every ingredient is sourced from local
            farmers and artisans. And every dish on our menu is prepared fresh each morning — never
            pre-packaged, never rushed. We believe the best meals are made with intent, not shortcuts.
          </p>
          <p style={{ marginTop:14, color:'#b8956a', lineHeight:1.85, fontSize:'.95rem' }}>
            From students cramming for exams to remote workers on deadline, from first dates to celebratory
            brunches — Brew &amp; Bite has quietly become a part of countless stories in this neighbourhood.
            That is the greatest honour we know.
          </p>

          {/* Info grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:32 }}>
            {[
              { icon:<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>, dot:<circle cx="12" cy="10" r="3"/>, label:'Location', val:'Koramangala, Bengaluru' },
              { icon:<circle cx="12" cy="12" r="10"/>, dot:<polyline points="12 6 12 12 16 14"/>, label:'Opening Hours', val:'7:00 AM – 10:00 PM' },
              { icon:<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>, dot:null, label:'Reservations', val:'+91 98765 43210' },
              { icon:<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, dot:null, label:'Email Us', val:'hello@brewandbite.in' },
            ].map(({ icon, dot, label, val }) => (
              <div key={label} style={{
                display:'flex', gap:12, alignItems:'flex-start',
                background:'rgba(212,146,77,.06)', border:'1px solid rgba(212,146,77,.18)',
                borderRadius:14, padding:'14px 16px',
              }}>
                <div style={{
                  width:38, height:38, borderRadius:10, flexShrink:0,
                  background:'linear-gradient(135deg,#78350f,#d97706)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon}{dot}
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#7a5c3a', marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:'.88rem', color:'#f5e6ce', fontWeight:500 }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Right: image + stats */}
        <Reveal delay={0.14}>
          <div style={{ position:'relative' }}>
            <img src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=900&q=80" alt="Inside Brew & Bite Cafe"
              style={{ width:'100%', height:280, objectFit:'cover', borderRadius:20, boxShadow:'0 12px 40px rgba(0,0,0,.5)', display:'block' }}/>
            {/* Logo badge */}
            <div style={{
              position:'absolute', bottom:-20, right:-16,
              background:'linear-gradient(135deg,#9a6530,#d4924d)',
              borderRadius:16, padding:'14px 18px',
              boxShadow:'0 6px 24px rgba(0,0,0,.45)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              animation:'pulse 2.8s infinite',
            }}>
              <CupSvg size={28} stroke={1.8}/>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'.78rem', fontWeight:700, color:'#fff', whiteSpace:'nowrap' }}>Brew &amp; Bite</span>
              <small style={{ fontSize:'.62rem', color:'rgba(255,255,255,.75)', letterSpacing:'.1em' }}>Est. 2018</small>
            </div>
            {/* Heart sticker */}
            <div style={{
              position:'absolute', top:-16, left:-16,
              background:'linear-gradient(135deg,#9f1239,#e11d48)',
              borderRadius:'50%', width:44, height:44,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 6px 20px rgba(0,0,0,.4)', animation:'popIn .6s .4s both',
              color:'#fff',
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>

          {/* Stat row */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            marginTop:42, background:'rgba(212,146,77,.07)',
            border:'1px solid rgba(212,146,77,.2)', borderRadius:16, padding:'20px 24px', gap:0,
          }}>
            {[
              { num:'6+', lbl:'Years' },
              null,
              { num:'50K+', lbl:'Customers' },
              null,
              { num:'4.9★', lbl:'Rating' },
            ].map((s, i) => s ? (
              <div key={i} style={{ textAlign:'center', flex:1 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', fontWeight:900, color:'#d4924d' }}>{s.num}</div>
                <div style={{ fontSize:'.8rem', color:'#b8956a', marginTop:2 }}>{s.lbl}</div>
              </div>
            ) : (
              <div key={i} style={{ width:1, height:40, background:'rgba(212,146,77,.25)', margin:'0 12px' }}/>
            ))}
          </div>

          {/* Menu highlight cards */}
          <div style={{ marginTop:28, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { img: chaiImg,   name:'Masala Chai',     price:'₹49' },
              { img: coffeeImg, name:'Signature Coffee', price:'₹79' },
              { img: puffsImg,  name:'Spiced Puffs',     price:'₹59' },
              { img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', name:'Classic Burger', price:'₹149' },
            ].map(({ img, name, price }) => (
              <div key={name} style={{
                borderRadius:12, overflow:'hidden', position:'relative',
                border:'1px solid rgba(212,146,77,.2)',
              }}>
                <img src={img} alt={name} style={{ width:'100%', height:80, objectFit:'cover', display:'block' }}/>
                <div style={{
                  position:'absolute', inset:0,
                  background:'linear-gradient(to top,rgba(8,4,0,.88) 0%,transparent 60%)',
                  display:'flex', flexDirection:'column', justifyContent:'flex-end',
                  padding:'8px 10px',
                }}>
                  <div style={{ fontSize:'.75rem', fontWeight:600, color:'#f0b870' }}>{name}</div>
                  <div style={{ fontSize:'.7rem', color:'#d4924d' }}>{price}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Values */}
      <div style={{ background:'#1a0f06', padding:'70px 24px', position:'relative', marginTop:40 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,#d4924d,transparent)' }}/>
        <div style={{ textAlign:'center', paddingBottom:40 }}>
          <Reveal>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2rem,4vw,2.9rem)', color:'#d4924d', fontWeight:700 }}>What Drives Us</h2>
            <div style={{ width:60, height:3, background:'linear-gradient(90deg,#9a6530,#f0b870)', borderRadius:4, margin:'14px auto 0' }}/>
          </Reveal>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, maxWidth:960, margin:'0 auto' }}>
          {[
            {
              delay:0, color:'linear-gradient(135deg,#78350f,#d97706)',
              icon:<><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>,
              title:'Quality First',
              text:'We source only the finest ingredients — from premium single-origin coffee beans to fresh, locally-grown produce every single day.',
            },
            {
              delay:.12, color:'linear-gradient(135deg,#164e63,#0891b2)',
              icon:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
              title:'Community Spirit',
              text:"We're more than a cafe — a gathering place where local artists, neighbours, and strangers become lifelong friends.",
            },
            {
              delay:.24, color:'linear-gradient(135deg,#14532d,#16a34a)',
              icon:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
              title:'Made Fresh Daily',
              text:"Every item on our menu is prepared fresh each morning. We never compromise on freshness or flavour — ever.",
            },
          ].map(({ delay, color, icon, title, text }) => (
            <Reveal key={title} delay={delay}>
              <div style={{
                background:'linear-gradient(160deg,#1e1108 0%,#150c04 100%)',
                border:'1px solid rgba(212,146,77,.2)', borderRadius:18, padding:'30px 22px',
                textAlign:'center', transition:'transform .36s, border-color .36s, box-shadow .36s',
                height:'100%',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-7px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,146,77,.35)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,146,77,.2)'; }}
              >
                <div style={{ width:58, height:58, borderRadius:16, margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center', background:color }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                </div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', color:'#f0b870' }}>{title}</h3>
                <p style={{ marginTop:10, color:'#b8956a', fontSize:'.84rem', lineHeight:1.72 }}>{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Extra info strip */}
        <div style={{ maxWidth:960, margin:'50px auto 0', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, padding:'0 0' }}>
          {[
            { num:'30+', label:'Menu Items' },
            { num:'4', label:'Signature Brews' },
            { num:'100%', label:'Fresh Ingredients' },
            { num:'Daily', label:'New Specials' },
          ].map(({ num, label }) => (
            <Reveal key={label}>
              <div style={{
                background:'#1e1108', border:'1px solid rgba(212,146,77,.2)',
                borderRadius:18, padding:'28px 20px', textAlign:'center',
              }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2.2rem', fontWeight:900, color:'#d4924d' }}>{num}</div>
                <p style={{ color:'#b8956a', fontSize:'.88rem', marginTop:6 }}>{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background:'#1e1108', borderTop:'1px solid rgba(212,146,77,.2)', padding:'38px 24px', textAlign:'center', marginTop:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'#d4924d', marginBottom:10 }}>
          <CupSvg size={22} stroke={1.8}/> Brew &amp; Bite Cafe
        </div>
        <p style={{ color:'#7a5c3a', fontSize:'.84rem' }}>© 2026 <span style={{ color:'#d4924d' }}>Brew &amp; Bite Cafe</span> · Where Every Sip and Bite Tells a Story</p>
      </footer>
    </>
  );
}

// ── App root ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]           = useState<'home' | 'about'>('home');
  const [cart, setCart]           = useState<CartMap>({});
  const [cartOpen, setCartOpen]   = useState(false);
  const [modal, setModal]         = useState<MenuItem | null>(null);
  const [toast, setToast]         = useState({ msg: '', show: false });
  const [feedback, setFeedback]   = useState({ open: false, orderId: '' });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2800);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const entry = prev[item.id];
      return { ...prev, [item.id]: { item, qty: entry ? entry.qty + 1 : 1 } };
    });
    showToast(`${item.name} added to cart`);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const changeQty = (id: number, d: number) => {
    setCart(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], qty: Math.max(1, prev[id].qty + d) } };
    });
  };

  const cartCount = Object.values(cart).reduce((s, c) => s + c.qty, 0);

  const checkout = () => {
    if (cartCount === 0) return;
    const orderId = 'BBC-' + Math.floor(1000 + Math.random() * 9000);
    setCart({});
    setCartOpen(false);
    setFeedback({ open: true, orderId });
  };

  const navTo = (p: 'home' | 'about') => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ background:'#100904', color:'#f5e6ce', fontFamily:"'Inter',sans-serif", minHeight:'100vh', overflowX:'hidden' }}>
      {/* Nav */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:500,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'15px 48px',
        background:'rgba(16,9,4,.92)', backdropFilter:'blur(18px)',
        borderBottom:'1px solid rgba(212,146,77,.2)',
      }}>
        <button onClick={() => navTo('home')} style={{
          display:'flex', alignItems:'center', gap:10, fontFamily:"'Playfair Display',serif",
          fontSize:'1.15rem', color:'#d4924d', background:'none', border:'none', cursor:'pointer',
        }}>
          <CupSvg size={28} stroke={1.8}/> Brew &amp; Bite Cafe
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:36 }}>
          <div style={{ display:'flex', gap:8 }}>
            {(['home','about'] as const).map(p => (
              <button key={p} onClick={() => navTo(p)} style={{
                background: page === p ? 'rgba(212,146,77,.1)' : 'none',
                border:'none', cursor:'pointer',
                color: page === p ? '#d4924d' : '#b8956a',
                fontSize:'.9rem', fontWeight:500,
                padding:'7px 14px', borderRadius:8,
                letterSpacing:'.04em', transition:'all .36s',
                fontFamily:"'Inter',sans-serif",
                textTransform:'capitalize',
              }}>{p}</button>
            ))}
          </div>
          <button onClick={() => { setCartOpen(true); }} style={{
            position:'relative',
            background:'linear-gradient(135deg,#9a6530,#d4924d)',
            border:'none', borderRadius:12, padding:'9px 18px',
            color:'#fff', fontSize:'.88rem', fontWeight:600,
            cursor:'pointer', display:'flex', alignItems:'center', gap:7,
            transition:'all .36s', fontFamily:"'Inter',sans-serif",
          }}>
            <CartSvg size={17}/> Cart
            {cartCount > 0 && (
              <span style={{
                position:'absolute', top:-7, right:-7,
                background:'#ef4444', color:'#fff', fontSize:'.62rem', fontWeight:800,
                width:19, height:19, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'2px solid #100904',
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Pages */}
      <div style={{ paddingTop:page === 'about' ? 70 : 0 }}>
        {page === 'home'
          ? <HomePage onDetails={setModal} onAdd={addToCart}/>
          : <AboutPage/>}
      </div>

      {/* Overlays */}
      <ItemModal item={modal} onClose={() => setModal(null)} onAdd={addToCart}/>
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onQty={changeQty} onRemove={removeFromCart} onCheckout={checkout}/>
      <FeedbackModal open={feedback.open} orderId={feedback.orderId} onClose={() => setFeedback(f => ({ ...f, open: false }))}/>
      <Toast msg={toast.msg} show={toast.show}/>
    </div>
  );
}
