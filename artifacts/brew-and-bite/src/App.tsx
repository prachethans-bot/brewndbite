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
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(38px)',
      transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div style={{ position:'fixed', bottom:28, left:'50%',
      transform: show ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(120px)',
      zIndex:700, background:'linear-gradient(135deg,#201208,#2e1a08)',
      border:'1px solid #d4924d', borderRadius:12, padding:'13px 22px', color:'#f5e6ce',
      fontSize:'.88rem', boxShadow:'0 8px 32px rgba(0,0,0,.6)',
      transition:'transform .42s cubic-bezier(.4,0,.2,1)', whiteSpace:'nowrap',
      display:'flex', alignItems:'center', gap:10 }}>
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
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,.82)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      opacity: item ? 1 : 0, pointerEvents: item ? 'all' : 'none',
      transition:'opacity .36s cubic-bezier(.4,0,.2,1)' }}>
      {item && (
        <div style={{ background:'#1e1108', border:'1px solid rgba(212,146,77,.2)', borderRadius:22,
          maxWidth:600, width:'100%', overflow:'hidden', maxHeight:'90vh', overflowY:'auto',
          transform: 'none', transition:'transform .36s cubic-bezier(.4,0,.2,1)', position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:14, right:14, zIndex:10,
            background:'rgba(0,0,0,.65)', border:'1px solid rgba(255,255,255,.15)', borderRadius:'50%',
            width:36, height:36, color:'#fff', fontSize:'1rem', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          <div style={{ position:'relative', height:270, overflow:'hidden' }}>
            <img src={item.img} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(8,4,0,.85) 0%,transparent 55%)' }}/>
            <div style={{ position:'absolute', bottom:16, left:16, zIndex:1, fontSize:'.63rem', fontWeight:700,
              letterSpacing:'.14em', textTransform:'uppercase', color:'#f0b870', background:'rgba(0,0,0,.65)',
              border:'1px solid rgba(212,146,77,.4)', borderRadius:20, padding:'4px 12px' }}>{item.tag}</div>
          </div>
          <div style={{ padding:26 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.75rem', color:'#f0b870' }}>{item.name}</h3>
            <p style={{ color:'#b8956a', marginTop:6, fontSize:'.92rem', lineHeight:1.65 }}>{item.desc}</p>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:14, flexWrap:'wrap' }}>
              <span style={{ fontSize:'1.6rem', fontWeight:800, color:'#d4924d' }}>₹{item.price}</span>
              <span style={{ fontSize:'.82rem', color:'#7a5c3a' }}>per serving</span>
              <button onClick={() => { onAdd(item); onClose(); }} style={{
                background:'linear-gradient(135deg,#9a6530,#d4924d)', color:'#fff', border:'none',
                borderRadius:10, padding:'10px 20px', fontSize:'.88rem', fontWeight:600, cursor:'pointer',
                display:'flex', alignItems:'center', gap:7, transition:'all .36s', marginLeft:'auto',
                fontFamily:"'Inter',sans-serif" }}><CartSvg size={15}/> Add to Cart</button>
            </div>
            <div style={{ marginTop:22, display:'flex', alignItems:'center', gap:8, fontSize:'.95rem', fontWeight:600,
              color:'#f5e6ce', borderTop:'1px solid rgba(212,146,77,.2)', paddingTop:20 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
              </svg>
              Fresh Ingredients
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginTop:14 }}>
              {item.ingredients.map(ing => (
                <div key={ing} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(212,146,77,.2)',
                  borderRadius:9, padding:'10px 14px', fontSize:'.83rem', color:'#b8956a',
                  display:'flex', alignItems:'center', gap:9 }}>
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

// ── Cart Panel ───────────────────────────────────────────────────────────────
function CartPanel({ open, onClose, cart, onQty, onRemove, onCheckout }:
  { open: boolean; onClose: () => void; cart: CartMap;
    onQty: (id: number, d: number) => void; onRemove: (id: number) => void; onCheckout: () => void }) {
  const entries = Object.values(cart);
  const total   = entries.reduce((s, c) => s + c.item.price * c.qty, 0);
  const hasItems = entries.length > 0;
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.7)', backdropFilter:'blur(6px)',
      opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
      transition:'opacity .36s cubic-bezier(.4,0,.2,1)' }}>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:380, maxWidth:'95vw',
        background:'#1e1108', borderLeft:'1px solid rgba(212,146,77,.2)', display:'flex',
        flexDirection:'column', zIndex:401,
        transform: open ? 'none' : 'translateX(100%)',
        transition:'transform .36s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ padding:'18px 20px 16px', borderBottom:'1px solid rgba(212,146,77,.2)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', color:'#f0b870' }}>Your Cart</h3>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#b8956a', fontSize:'1.4rem', cursor:'pointer' }}>✕</button>
          </div>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:8,
            background:'rgba(212,146,77,.1)', border:'1px solid rgba(212,146,77,.25)',
            borderRadius:10, padding:'9px 16px', color:'#d4924d', fontSize:'.84rem', fontWeight:600,
            cursor:'pointer', width:'100%', fontFamily:"'Inter',sans-serif" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Continue Shopping
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 24px' }}>
          {!hasItems ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              height:'100%', gap:14, color:'#7a5c3a', textAlign:'center' }}>
              <CartSvg size={52}/>
              <p style={{ fontSize:'.9rem', lineHeight:1.6 }}>Your cart is empty.<br/>Add something delicious!</p>
              <button onClick={onClose} style={{ background:'linear-gradient(135deg,#9a6530,#d4924d)', color:'#fff',
                border:'none', borderRadius:10, padding:'11px 22px', fontSize:'.88rem', fontWeight:600,
                cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Browse Menu</button>
            </div>
          ) : entries.map(({ item, qty }) => (
            <div key={item.id} style={{ display:'flex', gap:12, padding:'14px 0',
              borderBottom:'1px solid rgba(212,146,77,.2)', alignItems:'center' }}>
              <img src={item.img} alt={item.name} style={{ width:60, height:60, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'.92rem', fontWeight:600, color:'#f5e6ce', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                <div style={{ fontSize:'.82rem', color:'#d4924d', marginTop:3 }}>₹{item.price} × {qty} = <strong>₹{item.price * qty}</strong></div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                  {([-1, null, 1] as const).map((d, i) => d === null ? (
                    <span key={i} style={{ fontSize:'.88rem', fontWeight:700, color:'#f5e6ce', minWidth:20, textAlign:'center' }}>{qty}</span>
                  ) : (
                    <button key={i} onClick={() => onQty(item.id, d)} style={{ width:26, height:26, borderRadius:'50%',
                      border:'1px solid rgba(212,146,77,.2)', background:'rgba(212,146,77,.1)', color:'#d4924d',
                      fontSize:'1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {d < 0 ? '−' : '+'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => onRemove(item.id)} style={{ background:'none', border:'none', color:'#7a5c3a', cursor:'pointer' }}>✕</button>
            </div>
          ))}
        </div>
        {hasItems && (
          <div style={{ padding:'20px 24px', borderTop:'1px solid rgba(212,146,77,.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:'.9rem', color:'#b8956a' }}>Total</span>
              <span style={{ fontSize:'1.4rem', fontWeight:800, color:'#f0b870' }}>₹{total}</span>
            </div>
            <button onClick={onCheckout} style={{
              width:'100%', background:'linear-gradient(135deg,#9a6530,#d4924d,#f0b870)',
              color:'#fff', border:'none', borderRadius:12, padding:16, fontSize:'1rem', fontWeight:700,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 20px rgba(212,146,77,.3)' }}>
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
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position:'fixed', inset:0, zIndex:800, background:'rgba(0,0,0,.85)', backdropFilter:'blur(10px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
      transition:'opacity .36s cubic-bezier(.4,0,.2,1)' }}>
      <div style={{ background:'linear-gradient(160deg,#201208 0%,#2a1508 60%,#180e04 100%)',
        border:'1px solid rgba(212,146,77,.3)', borderRadius:24, padding:40, maxWidth:440, width:'100%',
        boxShadow:'0 24px 80px rgba(0,0,0,.7)', position:'relative',
        animation: open ? 'slideUp .45s cubic-bezier(.4,0,.2,1) both' : 'none' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16,
          background:'rgba(212,146,77,.1)', border:'1px solid rgba(212,146,77,.25)', borderRadius:'50%',
          width:32, height:32, color:'#b8956a', fontSize:'1rem', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        {!submitted ? (
          <>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#9a6530,#d4924d)',
                display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px',
                boxShadow:'0 8px 24px rgba(212,146,77,.35)' }}><CheckSvg/></div>
              <div style={{ fontSize:'.75rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'#22c55e', marginBottom:6 }}>
                Order Placed!
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', color:'#f0b870', fontWeight:700 }}>Thank you!</h2>
              <p style={{ color:'#b8956a', fontSize:'.88rem', marginTop:6, lineHeight:1.6 }}>
                Order <strong style={{ color:'#d4924d' }}>#{orderId}</strong> is being prepared with love.
              </p>
            </div>
            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(212,146,77,.3),transparent)', margin:'20px 0' }}/>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:'.9rem', fontWeight:600, color:'#f5e6ce', marginBottom:14 }}>How was your experience?</p>
              <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:8 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(n)} style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}>
                    <StarSvg filled={n <= (hovered || rating)}/>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p style={{ fontSize:'.82rem', color:'#b8956a', marginBottom:16, fontStyle:'italic' }}>
                  {rating===1?'Sorry to hear that!':rating===2?"We'll do better!":rating===3?'Thanks for the feedback.':rating===4?'Great, glad you enjoyed it!':'Wonderful! You made our day!'}
                </p>
              )}
              <textarea placeholder="Leave a comment (optional)..." value={comment} onChange={e => setComment(e.target.value)} rows={3}
                style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(212,146,77,.25)',
                  borderRadius:12, padding:'12px 14px', color:'#f5e6ce', fontSize:'.88rem',
                  fontFamily:"'Inter',sans-serif", resize:'none', outline:'none', marginBottom:16 }}/>
              <button onClick={handleSubmit} disabled={rating===0} style={{
                width:'100%', background: rating===0 ? 'rgba(212,146,77,.2)' : 'linear-gradient(135deg,#9a6530,#d4924d,#f0b870)',
                color: rating===0 ? '#7a5c3a' : '#fff', border:'none', borderRadius:12, padding:'14px',
                fontSize:'1rem', fontWeight:700, cursor: rating===0 ? 'not-allowed' : 'pointer',
                fontFamily:"'Inter',sans-serif", boxShadow: rating>0 ? '0 4px 20px rgba(212,146,77,.3)' : 'none' }}>
                Submit Feedback
              </button>
              <button onClick={onClose} style={{ background:'none', border:'none', color:'#7a5c3a',
                fontSize:'.82rem', cursor:'pointer', marginTop:12, fontFamily:"'Inter',sans-serif" }}>Skip for now</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:'3rem', marginBottom:16 }}>🎉</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', color:'#f0b870', marginBottom:8 }}>Thank you!</h2>
            <p style={{ color:'#b8956a', fontSize:'.9rem', lineHeight:1.65 }}>Your feedback means the world to us.<br/>See you again soon at Brew & Bite!</p>
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
      <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(212,146,77,.3)',
        borderRadius:12, padding:'16px 14px', marginBottom:16 }}>
        <CardElement options={{
          style: {
            base: { color:'#f5e6ce', fontFamily:"'Inter',sans-serif", fontSize:'15px',
              '::placeholder': { color:'#7a5c3a' } },
            invalid: { color:'#ef4444' },
          },
          hidePostalCode: true,
        }}/>
      </div>
      {error && <p style={{ color:'#ef4444', fontSize:'.84rem', marginBottom:12 }}>{error}</p>}
      <button onClick={handlePay} disabled={loading || !stripe} style={{
        width:'100%', background: (!stripe||loading) ? 'rgba(212,146,77,.3)' : 'linear-gradient(135deg,#9a6530,#d4924d,#f0b870)',
        color: (!stripe||loading) ? '#7a5c3a' : '#fff', border:'none', borderRadius:12, padding:14,
        fontSize:'1rem', fontWeight:700, cursor: (!stripe||loading) ? 'not-allowed' : 'pointer',
        fontFamily:"'Inter',sans-serif", transition:'all .3s' }}>
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

  // Load Stripe publishable key when modal opens
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

  // Create payment intent when card tab is active and stripe is loaded
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

  const tabStyle = (active: boolean, color?: string) => ({
    flex:1, padding:'11px 6px', border: active ? 'none' : '1px solid transparent',
    borderRadius:11, gap:6,
    background: active ? (color || 'linear-gradient(135deg,#9a6530,#d4924d)') : 'transparent',
    color: active ? '#fff' : '#7a5c3a', fontSize:'.8rem', fontWeight:700,
    cursor:'pointer', transition:'all .3s cubic-bezier(.4,0,.2,1)',
    fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', justifyContent:'center',
    transform: active ? 'scale(1.03)' : 'scale(1)',
    boxShadow: active ? '0 4px 16px rgba(0,0,0,.35)' : 'none',
  });

  // Animated success checkmark SVG
  const SuccessCheck = ({ color = '#22c55e' }: { color?: string }) => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin:'0 auto 12px', display:'block' }}>
      <circle cx="32" cy="32" r="30" stroke={color} strokeWidth="3" strokeDasharray="188.5" strokeDashoffset="0"
        style={{ animation:'dashCircle .6s ease both' }}/>
      <polyline points="18,33 28,43 46,22" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="40" strokeDashoffset="0"
        style={{ animation:'dashCheck .4s .5s ease both' }}/>
    </svg>
  );

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position:'fixed', inset:0, zIndex:750, background:'rgba(0,0,0,.88)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
      transition:'opacity .36s cubic-bezier(.4,0,.2,1)' }}>
      <div style={{ background:'linear-gradient(160deg,#201208 0%,#2a1508 60%,#180e04 100%)',
        border:'1px solid rgba(212,146,77,.35)', borderRadius:26, padding:'32px 32px 28px',
        maxWidth:460, width:'100%', boxShadow:'0 32px 100px rgba(0,0,0,.8)', position:'relative',
        animation: open ? 'payModalIn .45s cubic-bezier(.34,1.56,.64,1) both' : 'none' }}>

        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16,
          background:'rgba(212,146,77,.08)', border:'1px solid rgba(212,146,77,.2)', borderRadius:'50%',
          width:32, height:32, color:'#b8956a', fontSize:'1rem', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(212,146,77,.2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(212,146,77,.08)'; }}>✕</button>

        {/* Header with animated amount */}
        <div style={{ marginBottom:20, animation:'fadeSlideDown .4s .05s both' }}>
          <p style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'#d4924d', marginBottom:4 }}>
            Secure Checkout
          </p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.55rem', color:'#f0b870', fontWeight:700 }}>
            Complete Your Order
          </h2>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
            <span style={{ fontSize:'1.4rem', fontWeight:800, color:'#d4924d',
              animation:'amountPop .5s .2s cubic-bezier(.34,1.56,.64,1) both' }}>₹{amount}</span>
            <span style={{ fontSize:'.8rem', color:'#7a5c3a' }}>• Brew &amp; Bite Cafe</span>
          </div>
        </div>

        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(212,146,77,.4),transparent)', marginBottom:20 }}/>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:5, marginBottom:22,
          background:'rgba(0,0,0,.4)', padding:5, borderRadius:15,
          animation:'fadeSlideDown .4s .1s both' }}>
          {/* Card tab */}
          <button style={tabStyle(tab==='card')} onClick={() => setTab('card')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Card
          </button>
          {/* UPI tab */}
          <button style={tabStyle(tab==='upi')} onClick={() => setTab('upi')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            UPI
          </button>
          {/* PhonePe tab */}
          <button style={tabStyle(tab==='phonepe', 'linear-gradient(135deg,#5f259f,#7b2fa8)')} onClick={() => setTab('phonepe')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
              <path d="M8 12c0-2.67 2.24-4.8 5-4.8h1.2V5l3.6 3.6-3.6 3.6V9.6H13C11.12 9.6 9.6 11.12 9.6 13S11.12 16.4 13 16.4h3.6V18.8H13C10.24 18.8 8 16.67 8 14" strokeWidth="1.5"/>
            </svg>
            PhonePe
          </button>
        </div>

        {/* ── CARD TAB ── */}
        {tab === 'card' && (
          <div key="card" style={{ animation:'tabSlideIn .3s cubic-bezier(.4,0,.2,1) both' }}>
            {configErr ? (
              <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)',
                borderRadius:14, padding:'20px 18px', textAlign:'center',
                animation:'tabSlideIn .3s both' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="1.5"
                  style={{ margin:'0 auto 10px', display:'block' }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ color:'#fca5a5', fontSize:'.88rem', lineHeight:1.6 }}>{configErr}</p>
                <p style={{ color:'#7a5c3a', fontSize:'.78rem', marginTop:8 }}>
                  Connect Stripe in the Integrations panel to enable card payments.
                </p>
              </div>
            ) : !stripeObj || !clientSecret ? (
              <div style={{ textAlign:'center', padding:'28px 0' }}>
                {/* Pulsing ring loader */}
                <div style={{ position:'relative', width:56, height:56, margin:'0 auto 16px' }}>
                  <div style={{ position:'absolute', inset:0, border:'3px solid rgba(212,146,77,.15)',
                    borderRadius:'50%' }}/>
                  <div style={{ position:'absolute', inset:0, border:'3px solid transparent',
                    borderTopColor:'#d4924d', borderRadius:'50%', animation:'spin .9s linear infinite' }}/>
                  <div style={{ position:'absolute', inset:8, border:'2px solid transparent',
                    borderTopColor:'rgba(212,146,77,.5)', borderRadius:'50%', animation:'spin .7s linear infinite reverse' }}/>
                </div>
                <p style={{ color:'#b8956a', fontSize:'.88rem' }}>Setting up secure payment…</p>
              </div>
            ) : (
              <Elements stripe={stripeObj}>
                <CardPaymentForm clientSecret={clientSecret} amount={amount} onSuccess={onSuccess}/>
              </Elements>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:16, justifyContent:'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a3c1a" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ color:'#5a3c1a', fontSize:'.73rem' }}>Secured by Stripe · 256-bit SSL</span>
            </div>
          </div>
        )}

        {/* ── UPI TAB ── */}
        {tab === 'upi' && (
          <div key="upi" style={{ textAlign:'center', animation:'tabSlideIn .3s cubic-bezier(.4,0,.2,1) both' }}>
            {!upiPaid ? (
              <>
                <p style={{ color:'#b8956a', fontSize:'.85rem', marginBottom:16, lineHeight:1.6 }}>
                  Scan with any UPI app — Google Pay, Paytm, BHIM, or your bank app
                </p>
                {/* QR with animated border */}
                <div style={{ position:'relative', display:'inline-block', marginBottom:16 }}>
                  <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(212,146,77,.25)',
                    borderRadius:18, padding:14, animation:'qrReveal .5s .1s cubic-bezier(.34,1.26,.64,1) both' }}>
                    <img src={qrApiUrl} alt="UPI QR" width="180" height="180"
                      style={{ borderRadius:10, display:'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}/>
                  </div>
                  {/* Scanning line */}
                  <div style={{ position:'absolute', left:14, right:14, height:2,
                    background:'linear-gradient(90deg,transparent,#d4924d,transparent)',
                    borderRadius:2, animation:'scanLine 2s ease-in-out infinite',
                    top:14 }}/>
                </div>
                {/* UPI ID row */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:14 }}>
                  <div style={{ background:'rgba(212,146,77,.08)', border:'1px solid rgba(212,146,77,.22)',
                    borderRadius:10, padding:'9px 14px', display:'flex', alignItems:'center', gap:10,
                    flex:1, maxWidth:270, animation:'fadeSlideDown .4s .15s both' }}>
                    <span style={{ fontFamily:'monospace', color:'#f0b870', fontSize:'.88rem', flex:1 }}>{upiId}</span>
                    <button onClick={copyUpi} style={{ background: copied ? 'rgba(34,197,94,.15)' : 'rgba(212,146,77,.15)',
                      border: copied ? '1px solid rgba(34,197,94,.4)' : '1px solid rgba(212,146,77,.3)',
                      borderRadius:7, cursor:'pointer', color: copied ? '#22c55e' : '#d4924d',
                      fontSize:'.76rem', fontWeight:700, padding:'4px 10px',
                      fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap', transition:'all .25s' }}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <a href={upiLink} style={{ display:'inline-flex', alignItems:'center', gap:6,
                  background:'rgba(212,146,77,.1)', border:'1px solid rgba(212,146,77,.28)',
                  color:'#d4924d', borderRadius:10, padding:'9px 18px', fontSize:'.84rem', fontWeight:600,
                  textDecoration:'none', marginBottom:16, transition:'all .25s',
                  animation:'fadeSlideDown .4s .2s both' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(212,146,77,.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(212,146,77,.1)'; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                  Open UPI App
                </a>
                <button onClick={() => setUpiPaid(true)} style={{
                  display:'block', width:'100%', background:'linear-gradient(135deg,#9a6530,#d4924d,#f0b870)',
                  color:'#fff', border:'none', borderRadius:13, padding:'14px',
                  fontSize:'1rem', fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif",
                  boxShadow:'0 4px 20px rgba(212,146,77,.3)', transition:'all .25s',
                  animation:'fadeSlideDown .4s .25s both' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 28px rgba(212,146,77,.45)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(212,146,77,.3)'; }}>
                  I have paid
                </button>
              </>
            ) : (
              <div style={{ animation:'successIn .5s cubic-bezier(.34,1.36,.64,1) both', padding:'8px 0' }}>
                <SuccessCheck/>
                <h3 style={{ fontFamily:"'Playfair Display',serif", color:'#f0b870', marginBottom:6, fontSize:'1.3rem' }}>Payment confirmed!</h3>
                <p style={{ color:'#b8956a', fontSize:'.86rem', marginBottom:22 }}>Thank you for paying via UPI.</p>
                <button onClick={onSuccess} style={{
                  width:'100%', background:'linear-gradient(135deg,#9a6530,#d4924d,#f0b870)',
                  color:'#fff', border:'none', borderRadius:13, padding:14, fontSize:'1rem',
                  fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif",
                  boxShadow:'0 4px 20px rgba(212,146,77,.3)', transition:'all .25s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; }}>
                  Place My Order →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PHONEPE TAB ── */}
        {tab === 'phonepe' && (
          <div key="phonepe" style={{ textAlign:'center', animation:'tabSlideIn .3s cubic-bezier(.4,0,.2,1) both' }}>
            {!upiPaid ? (
              <>
                {/* PhonePe brand header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:14,
                  animation:'fadeSlideDown .35s both' }}>
                  <div style={{ width:40, height:40, borderRadius:12,
                    background:'linear-gradient(135deg,#5f259f,#7b2fa8)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 4px 14px rgba(95,37,159,.5)' }}>
                    <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                      <path d="M12 20c0-4.4 3.6-8 8-8h2v-4l6 6-6 6v-4h-2c-2.2 0-4 1.8-4 4s1.8 4 4 4h6v4H20c-4.4 0-8-3.6-8-8z" fill="white"/>
                    </svg>
                  </div>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'#c084fc', fontWeight:700,
                    letterSpacing:'.02em' }}>PhonePe</span>
                </div>
                <p style={{ color:'#b8956a', fontSize:'.85rem', marginBottom:16, lineHeight:1.6 }}>
                  Scan QR with PhonePe or enter UPI ID manually
                </p>
                {/* QR with purple border */}
                <div style={{ position:'relative', display:'inline-block', marginBottom:16 }}>
                  <div style={{ background:'rgba(95,37,159,.08)', border:'1px solid rgba(95,37,159,.45)',
                    borderRadius:18, padding:14, animation:'qrReveal .5s .1s cubic-bezier(.34,1.26,.64,1) both' }}>
                    <img src={qrApiUrl} alt="PhonePe QR" width="180" height="180"
                      style={{ borderRadius:10, display:'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}/>
                  </div>
                  <div style={{ position:'absolute', left:14, right:14, height:2,
                    background:'linear-gradient(90deg,transparent,#c084fc,transparent)',
                    borderRadius:2, animation:'scanLine 2s ease-in-out infinite', top:14 }}/>
                </div>
                {/* UPI ID row */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:14 }}>
                  <div style={{ background:'rgba(95,37,159,.1)', border:'1px solid rgba(95,37,159,.35)',
                    borderRadius:10, padding:'9px 14px', display:'flex', alignItems:'center', gap:10,
                    flex:1, maxWidth:270, animation:'fadeSlideDown .4s .15s both' }}>
                    <span style={{ fontFamily:'monospace', color:'#c084fc', fontSize:'.88rem', flex:1 }}>{upiId}</span>
                    <button onClick={copyUpi} style={{ background: copied ? 'rgba(34,197,94,.15)' : 'rgba(95,37,159,.25)',
                      border: copied ? '1px solid rgba(34,197,94,.4)' : '1px solid rgba(95,37,159,.4)',
                      borderRadius:7, cursor:'pointer', color: copied ? '#22c55e' : '#c084fc',
                      fontSize:'.76rem', fontWeight:700, padding:'4px 10px',
                      fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap', transition:'all .25s' }}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                {/* Steps */}
                <div style={{ background:'rgba(95,37,159,.08)', border:'1px solid rgba(95,37,159,.25)',
                  borderRadius:12, padding:'12px 14px', marginBottom:16,
                  animation:'fadeSlideDown .4s .2s both' }}>
                  {['Open PhonePe', 'Send Money → To UPI ID', `Enter ${upiId}`, `Enter ₹${amount} & Pay`].map((step, i) => (
                    <div key={step} style={{ display:'flex', alignItems:'center', gap:10,
                      padding:'5px 0', borderBottom: i < 3 ? '1px solid rgba(95,37,159,.15)' : 'none' }}>
                      <span style={{ width:20, height:20, borderRadius:'50%',
                        background:'linear-gradient(135deg,#5f259f,#7b2fa8)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'.65rem', fontWeight:800, color:'#fff', flexShrink:0 }}>{i+1}</span>
                      <span style={{ fontSize:'.82rem', color:'#b8956a', textAlign:'left' }}>{step}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setUpiPaid(true)} style={{
                  width:'100%', background:'linear-gradient(135deg,#5f259f,#7b2fa8,#9333ea)',
                  color:'#fff', border:'none', borderRadius:13, padding:14,
                  fontSize:'1rem', fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif",
                  boxShadow:'0 4px 20px rgba(95,37,159,.4)', transition:'all .25s',
                  animation:'fadeSlideDown .4s .25s both' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 28px rgba(95,37,159,.55)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(95,37,159,.4)'; }}>
                  I have paid via PhonePe
                </button>
              </>
            ) : (
              <div style={{ animation:'successIn .5s cubic-bezier(.34,1.36,.64,1) both', padding:'8px 0' }}>
                <SuccessCheck color="#a855f7"/>
                <h3 style={{ fontFamily:"'Playfair Display',serif", color:'#c084fc', marginBottom:6, fontSize:'1.3rem' }}>Payment confirmed!</h3>
                <p style={{ color:'#b8956a', fontSize:'.86rem', marginBottom:22 }}>Thank you for paying via PhonePe.</p>
                <button onClick={onSuccess} style={{
                  width:'100%', background:'linear-gradient(135deg,#5f259f,#7b2fa8)',
                  color:'#fff', border:'none', borderRadius:13, padding:14, fontSize:'1rem',
                  fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif",
                  boxShadow:'0 4px 20px rgba(95,37,159,.4)', transition:'all .25s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; }}>
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
    <div ref={ref} style={{ opacity: visible?1:0, transform: visible?'none':'translateY(38px)',
      transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s` }}>
      <div onClick={onDetails} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ position:'relative', borderRadius:16, overflow:'hidden', aspectRatio:'4/3', cursor:'pointer',
          border: hover ? '1px solid rgba(212,146,77,.35)' : '1px solid rgba(212,146,77,.2)',
          transform: hover ? 'translateY(-8px) scale(1.016)' : 'none',
          boxShadow: hover ? '0 24px 64px rgba(0,0,0,.7)' : 'none',
          transition:'transform .36s cubic-bezier(.4,0,.2,1), box-shadow .36s, border-color .36s' }}>
        <img src={item.img} alt={item.name} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block',
          transform: hover ? 'scale(1.08)' : 'none', transition:'transform .65s ease' }}/>
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(to top,rgba(8,4,0,.96) 0%,rgba(0,0,0,.1) 55%,transparent 80%)',
          display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:20 }}>
          <span style={{ display:'inline-block', fontSize:'.63rem', fontWeight:700, letterSpacing:'.14em',
            textTransform:'uppercase', color:'#f0b870', background:'rgba(212,146,77,.18)',
            border:'1px solid rgba(212,146,77,.3)', borderRadius:20, padding:'3px 10px', marginBottom:8, width:'fit-content' }}>
            {item.tag}
          </span>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.35rem', fontWeight:700, color:'#fff' }}>{item.name}</h3>
          <p style={{ fontSize:'.81rem', color:'rgba(255,255,255,.55)', marginTop:4 }}>{item.desc}</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, gap:8 }}>
            <span style={{ fontSize:'1.1rem', fontWeight:700, color:'#f0b870' }}>₹{item.price}</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={(e) => { e.stopPropagation(); onDetails(); }} style={{ fontSize:'.76rem', fontWeight:600,
                border:'1px solid rgba(255,255,255,.2)', borderRadius:20, padding:'6px 13px', cursor:'pointer',
                background:'rgba(255,255,255,.1)', color:'#fff', display:'flex', alignItems:'center', gap:5,
                fontFamily:"'Inter',sans-serif" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>Details
              </button>
              <button onClick={(e) => { e.stopPropagation(); onAdd(); }} style={{ fontSize:'.76rem', fontWeight:600,
                border:'none', borderRadius:20, padding:'6px 13px', cursor:'pointer',
                background:'linear-gradient(135deg,#9a6530,#d4924d)', color:'#fff',
                display:'flex', alignItems:'center', gap:5, fontFamily:"'Inter',sans-serif" }}>
                <CartSvg size={13}/> Add to Cart
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
  return (
    <>
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', textAlign:'center', padding:'130px 24px 80px', position:'relative',
        overflow:'hidden', background:'radial-gradient(ellipse 80% 55% at 50% 10%,#3d1f06 0%,#100904 68%)' }}>
        <div style={{ position:'absolute', inset:0,
          background:"url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1800&q=80') center/cover",
          opacity:.08, zIndex:0 }}/>
        <div style={{ color:'#d4924d', marginBottom:22, display:'flex', alignItems:'center',
          justifyContent:'center', gap:14, animation:'fadeUp .8s .05s both', position:'relative', zIndex:1 }}>
          <CupSvg size={36} stroke={1.7}/>
          <span style={{ color:'#7a5c3a', fontSize:'1.6rem', fontWeight:100 }}>|</span>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
            <line x1="6" y1="17" x2="18" y2="17"/>
          </svg>
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2.8rem,7vw,5.4rem)',
          fontWeight:900, color:'#f0b870', lineHeight:1.06, animation:'fadeUp .9s .15s both',
          position:'relative', zIndex:1 }}>Brew &amp; Bite Cafe</h1>
        <p style={{ marginTop:18, color:'#b8956a', fontSize:'1.05rem', fontWeight:300,
          animation:'fadeUp .9s .28s both', position:'relative', zIndex:1 }}>
          Where Every Sip and Bite Tells a Story of Flavor and Passion
        </p>
        <div style={{ marginTop:34, display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center',
          animation:'fadeUp .9s .42s both', position:'relative', zIndex:1 }}>
          {[{ icon:<CupSvg size={15} stroke={2}/>, label:'Premium Brews' },
            { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/></svg>, label:'Fresh Cuisine' },
            { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label:'Quality First' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8,
              background:'rgba(212,146,77,.1)', border:'1px solid rgba(212,146,77,.28)',
              borderRadius:30, padding:'8px 18px', color:'#d4924d', fontSize:'.84rem', fontWeight:500 }}>
              {icon} {label}
            </div>
          ))}
        </div>
        <div style={{ marginTop:60, display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          color:'#7a5c3a', fontSize:'.72rem', letterSpacing:'.14em', textTransform:'uppercase',
          animation:'fadeUp .9s .58s both', position:'relative', zIndex:1 }}>
          <div style={{ width:1, height:44, background:'linear-gradient(to bottom,#d4924d,transparent)', animation:'bob 2s infinite' }}/>
          scroll to explore
        </div>
      </div>

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
            <MenuCard key={item.id} item={item} delay={i*0.09}
              onDetails={() => onDetails(item)} onAdd={() => onAdd(item)}/>
          ))}
        </div>
      </div>

      <footer style={{ background:'#1e1108', borderTop:'1px solid rgba(212,146,77,.2)', padding:'38px 24px', textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'#d4924d', marginBottom:10 }}>
          <CupSvg size={22} stroke={1.8}/> Brew &amp; Bite Cafe
        </div>
        <p style={{ color:'#7a5c3a', fontSize:'.84rem' }}>© 2026 <span style={{ color:'#d4924d' }}>Brew &amp; Bite Cafe</span> · Where Every Sip and Bite Tells a Story</p>
      </footer>
    </>
  );
}

// ── Social Media Section ─────────────────────────────────────────────────────
const SOCIALS = [
  {
    name:'Instagram', handle:'@prachethan_k',
    followers:'', url:'https://instagram.com/prachethan_k',
    color:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',
    icon:(
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    name:'Facebook', handle:'@prachethan_k',
    followers:'', url:'https://facebook.com/prachethan_k',
    color:'linear-gradient(135deg,#1877f2,#166fe5)',
    icon:(
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    name:'Twitter / X', handle:'@BrewAndBiteCafe',
    followers:'5.8K', url:'https://twitter.com/BrewAndBiteCafe',
    color:'linear-gradient(135deg,#111,#333)',
    icon:(
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name:'YouTube', handle:'prachethan.star',
    followers:'', url:'https://youtube.com/@prachethan.star',
    color:'linear-gradient(135deg,#ff0000,#cc0000)',
    icon:(
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
];

function SocialMediaSection() {
  return (
    <div style={{ background:'#100904', padding:'70px 24px 80px', position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
        background:'linear-gradient(90deg,transparent,rgba(212,146,77,.3),transparent)' }}/>
      <div style={{ maxWidth:960, margin:'0 auto' }}>
        <Reveal>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <p style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase',
              color:'#d4924d', marginBottom:8 }}>Stay Connected</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,3.5vw,2.5rem)',
              color:'#f0b870', fontWeight:700 }}>Follow &amp; Connect</h2>
            <div style={{ width:60, height:3, background:'linear-gradient(90deg,#9a6530,#f0b870)',
              borderRadius:4, margin:'14px auto 0' }}/>
            <p style={{ marginTop:16, color:'#b8956a', fontSize:'.95rem', maxWidth:460, marginInline:'auto', lineHeight:1.75 }}>
              Join our community for daily specials, behind-the-scenes peeks, and exclusive offers
            </p>
          </div>
        </Reveal>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:18 }}>
          {SOCIALS.map(({ name, handle, followers, url, color, icon }, i) => (
            <Reveal key={name} delay={i * 0.1}>
              <a href={url} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration:'none', display:'block' }}>
                <div style={{ background:'linear-gradient(160deg,#1e1108 0%,#150c04 100%)',
                  border:'1px solid rgba(212,146,77,.2)', borderRadius:18, padding:'24px 20px',
                  display:'flex', alignItems:'center', gap:16, cursor:'pointer',
                  transition:'transform .3s, border-color .3s, box-shadow .3s' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,146,77,.4)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,.5)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,146,77,.2)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}>
                  {/* Icon */}
                  <div style={{ width:52, height:52, borderRadius:14, flexShrink:0,
                    background:color, display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,.4)' }}>
                    {icon}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, color:'#f5e6ce', fontSize:'.95rem', marginBottom:2 }}>{name}</div>
                    <div style={{ color:'#b8956a', fontSize:'.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{handle}</div>
                    {followers && <div style={{ color:'#7a5c3a', fontSize:'.76rem', marginTop:4 }}>{followers} followers</div>}
                  </div>
                  {/* Arrow */}
                  <div style={{ color:'#d4924d', flexShrink:0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        {/* Newsletter strip */}
        <Reveal delay={0.3}>
          <div style={{ marginTop:40, background:'linear-gradient(135deg,rgba(154,101,48,.15),rgba(212,146,77,.1))',
            border:'1px solid rgba(212,146,77,.25)', borderRadius:20, padding:'28px 32px',
            display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'#f0b870', marginBottom:4 }}>
                Get exclusive offers in your inbox
              </h3>
              <p style={{ color:'#b8956a', fontSize:'.84rem' }}>Weekly specials, new arrivals & loyalty rewards</p>
            </div>
            <div style={{ display:'flex', gap:10, flexShrink:0 }}>
              <input type="email" placeholder="your@email.com" style={{
                background:'rgba(255,255,255,.06)', border:'1px solid rgba(212,146,77,.3)',
                borderRadius:10, padding:'10px 16px', color:'#f5e6ce', fontSize:'.88rem',
                outline:'none', fontFamily:"'Inter',sans-serif", width:200 }}/>
              <button style={{ background:'linear-gradient(135deg,#9a6530,#d4924d)', color:'#fff',
                border:'none', borderRadius:10, padding:'10px 20px', fontSize:'.88rem', fontWeight:600,
                cursor:'pointer', fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' }}>
                Subscribe
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ── About Page ───────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <>
      <div style={{ background:'radial-gradient(ellipse 80% 55% at 50% 0%,#3d1f06 0%,#100904 70%)',
        padding:'90px 24px 60px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0,
          background:"url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=80') center/cover",
          opacity:.08 }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <Reveal>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2.2rem,5vw,3.8rem)',
              fontWeight:900, color:'#f0b870' }}>About Us</h1>
            <p style={{ marginTop:16, color:'#b8956a', fontSize:'1rem', maxWidth:560, marginInline:'auto', lineHeight:1.75 }}>
              A story brewed with passion, poured with love — and served fresh every single day.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Story */}
      <div style={{ maxWidth:960, margin:'70px auto', padding:'0 24px',
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'start' }}>
        <Reveal>
          <p style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'#d4924d', marginBottom:8 }}>Our Journey</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'#d4924d', fontWeight:700 }}>
            About <span style={{ color:'#f0b870' }}>Brew &amp; Bite</span>
          </h2>
          <div style={{ width:50, height:3, background:'linear-gradient(90deg,#9a6530,#f0b870)', borderRadius:4, marginTop:14 }}/>
          {['Founded in 2018 by a pair of passionate food lovers in the heart of Koramangala, Bengaluru, Brew & Bite was born from a simple dream: to create a space where great coffee and honest food could bring people together.',
            'Every bean we roast is single-origin and traceable. Every ingredient is sourced from local farmers and artisans. Every dish is prepared fresh each morning — never pre-packaged, never rushed.',
            'From students cramming for exams to remote workers on deadline, from first dates to celebratory brunches — Brew & Bite has quietly become a part of countless stories in this neighbourhood.']
            .map((p, i) => <p key={i} style={{ marginTop:14, color:'#b8956a', lineHeight:1.85, fontSize:'.95rem' }}>{p}</p>)}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:32 }}>
            {[
              { label:'Location', val:'Koramangala, Bengaluru', d:<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>, dot:<circle cx="12" cy="10" r="3"/> },
              { label:'Opening Hours', val:'7:00 AM – 10:00 PM', d:<circle cx="12" cy="12" r="10"/>, dot:<polyline points="12 6 12 12 16 14"/> },
              { label:'Reservations', val:'+91 98765 43210', d:<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>, dot:null },
              { label:'Email Us', val:'hello@brewandbite.in', d:<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, dot:null },
            ].map(({ label, val, d, dot }) => (
              <div key={label} style={{ display:'flex', gap:12, alignItems:'flex-start',
                background:'rgba(212,146,77,.06)', border:'1px solid rgba(212,146,77,.18)',
                borderRadius:14, padding:'14px 16px' }}>
                <div style={{ width:38, height:38, borderRadius:10, flexShrink:0,
                  background:'linear-gradient(135deg,#78350f,#d97706)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">{d}{dot}</svg>
                </div>
                <div>
                  <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#7a5c3a', marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:'.88rem', color:'#f5e6ce', fontWeight:500 }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div style={{ position:'relative' }}>
            <img src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=900&q=80"
              alt="Inside Brew & Bite Cafe" style={{ width:'100%', height:280, objectFit:'cover',
                borderRadius:20, boxShadow:'0 12px 40px rgba(0,0,0,.5)', display:'block' }}/>
            <div style={{ position:'absolute', bottom:-20, right:-16,
              background:'linear-gradient(135deg,#9a6530,#d4924d)', borderRadius:16,
              padding:'14px 18px', boxShadow:'0 6px 24px rgba(0,0,0,.45)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4, animation:'pulse 2.8s infinite' }}>
              <CupSvg size={28} stroke={1.8}/>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'.78rem', fontWeight:700, color:'#fff', whiteSpace:'nowrap' }}>Brew &amp; Bite</span>
              <small style={{ fontSize:'.62rem', color:'rgba(255,255,255,.75)', letterSpacing:'.1em' }}>Est. 2018</small>
            </div>
            <div style={{ position:'absolute', top:-16, left:-16,
              background:'linear-gradient(135deg,#9f1239,#e11d48)', borderRadius:'50%',
              width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 6px 20px rgba(0,0,0,.4)', animation:'popIn .6s .4s both', color:'#fff' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginTop:42,
            background:'rgba(212,146,77,.07)', border:'1px solid rgba(212,146,77,.2)',
            borderRadius:16, padding:'20px 24px', gap:0 }}>
            {([{ num:'6+', lbl:'Years' }, null, { num:'50K+', lbl:'Customers' }, null, { num:'4.9★', lbl:'Rating' }] as const).map((s, i) =>
              s ? (
                <div key={i} style={{ textAlign:'center', flex:1 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', fontWeight:900, color:'#d4924d' }}>{s.num}</div>
                  <div style={{ fontSize:'.8rem', color:'#b8956a', marginTop:2 }}>{s.lbl}</div>
                </div>
              ) : <div key={i} style={{ width:1, height:40, background:'rgba(212,146,77,.25)', margin:'0 12px' }}/>
            )}
          </div>
          <div style={{ marginTop:28, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { img:chaiImg,   name:'Masala Chai',      price:'₹49' },
              { img:coffeeImg, name:'Signature Coffee',  price:'₹79' },
              { img:puffsImg,  name:'Spiced Puffs',      price:'₹59' },
              { img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', name:'Classic Burger', price:'₹149' },
            ].map(({ img, name, price }) => (
              <div key={name} style={{ borderRadius:12, overflow:'hidden', position:'relative', border:'1px solid rgba(212,146,77,.2)' }}>
                <img src={img} alt={name} style={{ width:'100%', height:80, objectFit:'cover', display:'block' }}/>
                <div style={{ position:'absolute', inset:0,
                  background:'linear-gradient(to top,rgba(8,4,0,.88) 0%,transparent 60%)',
                  display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'8px 10px' }}>
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
            { delay:0, color:'linear-gradient(135deg,#78350f,#d97706)',
              icon:<><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>,
              title:'Quality First', text:'We source only the finest ingredients — from premium single-origin coffee beans to fresh, locally-grown produce every single day.' },
            { delay:.12, color:'linear-gradient(135deg,#164e63,#0891b2)',
              icon:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
              title:'Community Spirit', text:"We're more than a cafe — a gathering place where local artists, neighbours, and strangers become lifelong friends." },
            { delay:.24, color:'linear-gradient(135deg,#14532d,#16a34a)',
              icon:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
              title:'Made Fresh Daily', text:"Every item on our menu is prepared fresh each morning. We never compromise on freshness or flavour — ever." },
          ].map(({ delay, color, icon, title, text }) => (
            <Reveal key={title} delay={delay}>
              <div style={{ background:'linear-gradient(160deg,#1e1108 0%,#150c04 100%)',
                border:'1px solid rgba(212,146,77,.2)', borderRadius:18, padding:'30px 22px', textAlign:'center',
                transition:'transform .36s, border-color .36s', height:'100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-7px)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(212,146,77,.35)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.borderColor='rgba(212,146,77,.2)'; }}>
                <div style={{ width:58, height:58, borderRadius:16, margin:'0 auto 18px',
                  display:'flex', alignItems:'center', justifyContent:'center', background:color }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                </div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', color:'#f0b870' }}>{title}</h3>
                <p style={{ marginTop:10, color:'#b8956a', fontSize:'.84rem', lineHeight:1.72 }}>{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div style={{ maxWidth:960, margin:'50px auto 0', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {[{ num:'30+', label:'Menu Items' }, { num:'4', label:'Signature Brews' }, { num:'100%', label:'Fresh Ingredients' }, { num:'Daily', label:'New Specials' }]
            .map(({ num, label }) => (
              <Reveal key={label}>
                <div style={{ background:'#1e1108', border:'1px solid rgba(212,146,77,.2)', borderRadius:18, padding:'28px 20px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2.2rem', fontWeight:900, color:'#d4924d' }}>{num}</div>
                  <p style={{ color:'#b8956a', fontSize:'.88rem', marginTop:6 }}>{label}</p>
                </div>
              </Reveal>
            ))}
        </div>
      </div>

      {/* ── Social Media ── */}
      <SocialMediaSection/>

      <footer style={{ background:'#1e1108', borderTop:'1px solid rgba(212,146,77,.2)', padding:'38px 24px', textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'#d4924d', marginBottom:10 }}>
          <CupSvg size={22} stroke={1.8}/> Brew &amp; Bite Cafe
        </div>
        <p style={{ color:'#7a5c3a', fontSize:'.84rem' }}>© 2026 <span style={{ color:'#d4924d' }}>Brew &amp; Bite Cafe</span> · Where Every Sip and Bite Tells a Story</p>
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
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  return (
    <div style={{ background:'#100904', color:'#f5e6ce', fontFamily:"'Inter',sans-serif", minHeight:'100vh', overflowX:'hidden' }}>
      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(60px) scale(.95); } to { opacity:1; transform:none; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.13)} }
        @keyframes bob { 0%,100%{opacity:1;transform:scaleY(1)} 50%{opacity:.3;transform:scaleY(.7)} }
        @keyframes popIn { from{transform:scale(0) rotate(-15deg);opacity:0} to{transform:none;opacity:1} }

        /* Payment modal animations */
        @keyframes payModalIn {
          from { opacity:0; transform:translateY(48px) scale(.93); }
          to   { opacity:1; transform:none; }
        }
        @keyframes tabSlideIn {
          from { opacity:0; transform:translateX(14px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes fadeSlideDown {
          from { opacity:0; transform:translateY(-10px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes amountPop {
          0%   { transform:scale(.7); opacity:0; }
          70%  { transform:scale(1.12); }
          100% { transform:scale(1); opacity:1; }
        }
        @keyframes qrReveal {
          from { opacity:0; transform:scale(.88); }
          to   { opacity:1; transform:none; }
        }
        @keyframes scanLine {
          0%   { top:14px; opacity:0; }
          10%  { opacity:1; }
          90%  { opacity:1; }
          100% { top:calc(100% - 16px); opacity:0; }
        }
        @keyframes successIn {
          from { opacity:0; transform:scale(.82) translateY(20px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes dashCircle {
          from { stroke-dashoffset:188.5; opacity:0; }
          to   { stroke-dashoffset:0; opacity:1; }
        }
        @keyframes dashCheck {
          from { stroke-dashoffset:40; }
          to   { stroke-dashoffset:0; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:500,
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px 48px',
        background:'rgba(16,9,4,.92)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(212,146,77,.2)' }}>
        <button onClick={() => navTo('home')} style={{ display:'flex', alignItems:'center', gap:10,
          fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'#d4924d',
          background:'none', border:'none', cursor:'pointer' }}>
          <CupSvg size={28} stroke={1.8}/> Brew &amp; Bite Cafe
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:36 }}>
          <div style={{ display:'flex', gap:8 }}>
            {(['home','about'] as const).map(p => (
              <button key={p} onClick={() => navTo(p)} style={{
                background: page===p ? 'rgba(212,146,77,.1)' : 'none', border:'none', cursor:'pointer',
                color: page===p ? '#d4924d' : '#b8956a', fontSize:'.9rem', fontWeight:500,
                padding:'7px 14px', borderRadius:8, letterSpacing:'.04em', transition:'all .36s',
                fontFamily:"'Inter',sans-serif", textTransform:'capitalize' }}>{p}</button>
            ))}
          </div>
          <button onClick={() => setCartOpen(true)} style={{ position:'relative',
            background:'linear-gradient(135deg,#9a6530,#d4924d)', border:'none', borderRadius:12,
            padding:'9px 18px', color:'#fff', fontSize:'.88rem', fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', gap:7, fontFamily:"'Inter',sans-serif" }}>
            <CartSvg size={17}/> Cart
            {cartCount > 0 && (
              <span style={{ position:'absolute', top:-7, right:-7, background:'#ef4444', color:'#fff',
                fontSize:'.62rem', fontWeight:800, width:19, height:19, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #100904' }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <div style={{ paddingTop: page==='about' ? 70 : 0 }}>
        {page==='home'
          ? <HomePage onDetails={setModal} onAdd={addToCart}/>
          : <AboutPage/>}
      </div>

      <ItemModal item={modal} onClose={() => setModal(null)} onAdd={addToCart}/>
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} cart={cart}
        onQty={changeQty} onRemove={removeFromCart} onCheckout={checkout}/>
      <PaymentModal open={paymentOpen} amount={paymentAmount}
        onClose={() => setPaymentOpen(false)} onSuccess={onPaymentSuccess}/>
      <FeedbackModal open={feedback.open} orderId={feedback.orderId}
        onClose={() => setFeedback(f => ({ ...f, open:false }))}/>
      <Toast msg={toast.msg} show={toast.show}/>
    </div>
  );
}
