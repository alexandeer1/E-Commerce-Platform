import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ShieldCheck, X, Activity, Zap, User as UserIcon } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import { AuthModal } from './AuthModal';
import './App.css';

const socket = io('http://localhost:3001');

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface ActivityEvent {
  id: string;
  message: string;
  time: string;
}

// Custom Premium Interactive Cursor
const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (['A', 'BUTTON'].includes(target.tagName) || target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className="custom-cursor"
      animate={{
        x: mousePosition.x - 16,
        y: mousePosition.y - 16,
        scale: isHovering ? 2.5 : 1,
        backgroundColor: isHovering ? 'rgba(167, 139, 250, 0.2)' : 'rgba(167, 139, 250, 0.8)',
        border: isHovering ? '1px solid rgba(167, 139, 250, 0.8)' : '1px solid transparent'
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
    />
  );
};

// 3D Tilt Product Card Component
const ProductCard = ({ product, addToCart, outOfStock }: { product: Product, addToCart: (p: Product) => void, outOfStock: boolean }) => {
  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
    });
  };

  return (
    <motion.div
      className={`product-card glass-panel ${outOfStock ? 'out-of-stock' : ''}`}
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      layout
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
    >
      <div className="card-image">
        <img src={product.image} alt={product.name} />
        <div className="stock-badge" style={{ background: outOfStock ? 'rgba(239, 68, 68, 0.8)' : 'rgba(15, 23, 42, 0.8)' }}>
          <span className="pulse-dot" style={{ display: outOfStock ? 'none' : 'block' }}></span>
          {outOfStock ? 'OUT OF STOCK' : `${product.stock} available`}
        </div>
      </div>
      <div className="card-content">
        <span className="category">{product.category}</span>
        <h3>{product.name}</h3>
        <div className="card-footer">
          <span className="price">${product.price.toLocaleString()}</span>
          <button
            className={`primary-btn ${!outOfStock ? 'pulse-glow' : ''}`}
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
          >
            {outOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    socket.on('inventory_init', (serverProducts) => setProducts(serverProducts));
    socket.on('inventory_update', (updatedProducts) => setProducts(updatedProducts));
    socket.on('live_activity', (activity: ActivityEvent) => {
      setActivities(prev => [activity, ...prev].slice(0, 3)); // Keep last 3
    });

    return () => {
      socket.off('inventory_init');
      socket.off('inventory_update');
      socket.off('live_activity');
    };
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(p => p.id === product.id);
    const quantityInCart = existing ? existing.quantity : 0;

    if (quantityInCart >= product.stock) {
      showNotification(`Not enough stock for ${product.name}`);
      return;
    }

    setCart(prev => {
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const clearCart = () => setCart([]);

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      socket.emit('purchase', cart, (response: any) => {
        setIsProcessing(false);
        if (response.success) {
          showNotification('Payment Securely Processed! Thank you.');
          clearCart();
          setIsCartOpen(false);
        } else {
          showNotification(`Error: ${response.message}`);
        }
      });
    }, 2000);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <CustomCursor />
      <AnimatedBackground />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u: any) => setUser(u)}
        socket={socket}
        showNotification={showNotification}
      />

      {/* Live Global Activity Feed */}
      <div className="activity-feed">
        <AnimatePresence>
          {activities.map((act) => (
            <motion.div
              key={act.id}
              className="activity-item glass-panel"
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Activity size={14} className="activity-icon rotating" />
              <span>{act.message}</span>
              <span className="activity-time">{act.time}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="app-container">
        <AnimatePresence>
          {notification && (
            <motion.div
              className="notification-banner"
              initial={{ top: -50, opacity: 0 }}
              animate={{ top: 20, opacity: 1 }}
              exit={{ top: -50, opacity: 0 }}
            >
              <ShieldCheck size={20} />
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <header className="glass-header">
          <motion.div
            className="logo"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Zap className="logo-icon" size={24} />
            <h1>AETHER<span className="gradient-text">STORE</span></h1>
          </motion.div>
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {user ? (
              <span className="user-greeting">Welcome, <span className="gradient-text">{user.name}</span></span>
            ) : (
              <button className="nav-btn auth-trigger-btn pulse-glow" onClick={() => setIsAuthOpen(true)}>
                <UserIcon size={20} className="mr-2" />
                <span>Identity Portal</span>
              </button>
            )}
            <button className="nav-btn group" onClick={() => setIsCartOpen(!isCartOpen)}>
              <ShoppingCart strokeWidth={1.5} size={28} className="group-hover:scale-110 transition-transform" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    className="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </nav>
        </header>

        <main className="main-content">
          <section className="hero">
            <motion.h2
              className="reveal-text"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Experience the Future of Commerce.
            </motion.h2>
            <motion.p
              className="hero-subtext"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Interactive. Real-time. Secure.
            </motion.p>
          </section>

          <motion.section
            className="product-grid"
            layout
          >
            <AnimatePresence>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  outOfStock={product.stock === 0}
                />
              ))}
            </AnimatePresence>
          </motion.section>
        </main>

        <AnimatePresence>
          {isCartOpen && (
            <motion.aside
              className="cart-sidebar glass-panel"
              initial={{ right: '-100%', opacity: 0 }}
              animate={{ right: 0, opacity: 1 }}
              exit={{ right: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="cart-header">
                <h2>Your Cart</h2>
                <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="cart-items">
                {cart.length === 0 ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-cart">
                    Your cart is empty.
                  </motion.p>
                ) : (
                  <AnimatePresence>
                    {cart.map(item => (
                      <motion.div
                        key={item.id}
                        className="cart-item"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <img src={item.image} alt={item.name} />
                        <div className="item-details">
                          <h4>{item.name}</h4>
                          <span className="item-price">${item.price} x {item.quantity}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              {cart.length > 0 && (
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total:</span>
                    <span>${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}</span>
                  </div>
                  <button
                    className={`checkout-btn ${isProcessing ? 'processing' : 'pulse-glow'}`}
                    onClick={() => {
                      if (!user) {
                        setIsCartOpen(false);
                        setIsAuthOpen(true);
                        showNotification('Authentication required to secure items.');
                      } else {
                        handleCheckout();
                      }
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing Secure Payment...' : 'Secure Checkout'}
                  </button>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default App;
