import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Zap } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthSuccess: (user: any) => void;
    socket: any;
    showNotification: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, socket, showNotification }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const eventName = isLogin ? 'login' : 'register';

        // Slight artificial delay for the premium animated feeling
        setTimeout(() => {
            socket.emit(eventName, formData, (response: any) => {
                setIsLoading(false);
                if (response.success) {
                    showNotification(`Welcome to the Aether, ${response.user.name}`);
                    onAuthSuccess(response.user);
                    onClose();
                } else {
                    showNotification(`Auth Error: ${response.message}`);
                }
            });
        }, 1500);
    };

    const overlayVariants = {
        hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
        visible: { opacity: 1, backdropFilter: 'blur(25px)' },
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 50, rotateX: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            rotateX: 0,
            transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
        },
        exit: { opacity: 0, scale: 0.9, y: 30, transition: { duration: 0.2 } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="auth-overlay"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ duration: 0.4 }}
                >
                    <motion.div
                        className="auth-modal glass-panel"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <button className="close-modal-btn group" onClick={onClose} disabled={isLoading}>
                            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="auth-header">
                            <Zap className="auth-logo-icon rotating-slow" size={32} />
                            <h2>{isLogin ? 'Access Portal' : 'Join the Aether'}</h2>
                            <p>Sign in to secure your exclusive items.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <AnimatePresence mode="popLayout">
                                {!isLogin && (
                                    <motion.div
                                        className="input-group"
                                        initial={{ opacity: 0, height: 0, y: -20 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <User className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Display Name"
                                            required={!isLogin}
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                        <div className="input-glow"></div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="input-group">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                <div className="input-glow"></div>
                            </div>

                            <div className="input-group">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <div className="input-glow"></div>
                            </div>

                            <motion.button
                                type="submit"
                                className={`auth-submit-btn ${isLoading ? 'processing' : 'pulse-glow'}`}
                                disabled={isLoading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? (
                                    <span className="flex-center">Authenticating<span className="dot-pulse"></span></span>
                                ) : (
                                    <span className="flex-center">
                                        {isLogin ? 'Initialize Session' : 'Create Identity'}
                                        <ArrowRight size={18} className="ml-2" />
                                    </span>
                                )}
                            </motion.button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                {isLogin ? "Don't have an identity?" : "Already part of the Aether?"}
                                <button
                                    type="button"
                                    className="switch-auth-btn"
                                    onClick={() => setIsLogin(!isLogin)}
                                    disabled={isLoading}
                                >
                                    {isLogin ? 'Register Now' : 'Access Here'}
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
