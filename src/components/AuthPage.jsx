import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lock, Mail, Loader2, AlertCircle, CheckCircle, ArrowRight, ShieldCheck, Activity, Zap } from 'lucide-react';
import { loginAPI, signupAPI, forgotPasswordAPI } from '../services/api';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const data = await loginAPI(email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        const data = await signupAPI(email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setResetSuccess('');
    if (!email || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await forgotPasswordAPI(email, newPassword);
      setResetSuccess(data.message || 'Password updated. You can sign in now.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const formVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" }
    } )
  };

  return (
    <div className="min-h-screen bg-[#050b18] flex overflow-hidden font-sans">
      {/* Left Side: Creative Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-600 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/login-bg.png" 
            alt="Medical AI" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#050b18] via-blue-900/40 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full flex flex-col justify-center p-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-10"
          >
            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <Brain size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight italic">MediAssist <span className="text-blue-400">AI</span></h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <h2 className="text-6xl font-bold leading-[1.1]">
              The Future of <br />
              <span className="text-blue-400">Healthcare</span> is Here.
            </h2>
            <p className="text-xl text-blue-100/70 max-w-lg leading-relaxed">
              Experience the power of advanced AI diagnostics, real-time medical insights, and personalized health tracking in one stunning interface.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 grid grid-cols-2 gap-6 max-w-md"
          >
            {[
              { icon: <ShieldCheck className="text-green-400" />, title: "Secure Data", desc: "End-to-end encryption" },
              { icon: <Activity className="text-blue-400" />, title: "Smart Triage", desc: "Advanced AI analysis" },
              { icon: <Zap className="text-amber-400" />, title: "Instant Insights", desc: "Real-time specialists" },
              { icon: <Brain className="text-purple-400" />, title: "RAG Engine", desc: "Private medical training" }
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <div className="mt-1">{item.icon}</div>
                <div>
                  <h4 className="font-bold text-sm">{item.title}</h4>
                  <p className="text-[10px] text-blue-100/60 uppercase tracking-widest mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute inset-0 z-0 bg-[#050b18]" />
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex flex-col items-center mb-10">
             <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-900/20">
              <Brain size={30} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white italic">MediAssist <span className="text-blue-400">AI</span></h2>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-4xl font-bold text-white mb-3">
              {forgotMode ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Get Started')}
            </h3>
            <p className="text-slate-400">
              {forgotMode 
                ? 'Securely reset your account access' 
                : (isLogin ? 'Enter your credentials to access your portal' : 'Create your secure health profile today')}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-2xl bg-red-900/20 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {resetSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-sm"
            >
              <CheckCircle size={18} className="flex-shrink-0" />
              <span>{resetSuccess}</span>
            </motion.div>
          )}

          <div className="relative">
            <AnimatePresence mode="wait" custom={isLogin ? 1 : -1}>
              {forgotMode ? (
                <motion.form
                  key="forgot"
                  custom={1}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  onSubmit={handleForgotSubmit}
                  className="space-y-5"
                >
                  <InputField 
                    label="Email Address" 
                    icon={<Mail size={18} />} 
                    type="email" 
                    value={email} 
                    onChange={setEmail} 
                    placeholder="name@company.com"
                    loading={loading}
                  />
                  <InputField 
                    label="New Password" 
                    icon={<Lock size={18} />} 
                    type="password" 
                    value={newPassword} 
                    onChange={setNewPassword} 
                    placeholder="Min 6 characters"
                    loading={loading}
                  />
                  <InputField 
                    label="Confirm Password" 
                    icon={<Lock size={18} />} 
                    type="password" 
                    value={confirmPassword} 
                    onChange={setConfirmPassword} 
                    placeholder="Repeat new password"
                    loading={loading}
                  />

                  <PrimaryButton loading={loading}>Update Password</PrimaryButton>
                  
                  <button
                    type="button"
                    onClick={() => setForgotMode(false)}
                    className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Back to Sign In
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key={isLogin ? "login" : "signup"}
                  custom={isLogin ? 1 : -1}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <InputField 
                    label="Email Address" 
                    icon={<Mail size={18} />} 
                    type="email" 
                    value={email} 
                    onChange={setEmail} 
                    placeholder="name@company.com"
                    loading={loading}
                  />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-sm font-semibold text-slate-300 tracking-wide">Password</label>
                      {isLogin && (
                        <button 
                          type="button" 
                          onClick={() => setForgotMode(true)}
                          className="text-xs font-bold text-blue-500 hover:text-blue-400"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors text-slate-500">
                        <Lock size={18} />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 border border-slate-700 rounded-2xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all hover:bg-slate-800"
                        placeholder="••••••••"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <PrimaryButton loading={loading}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    {!loading && <ArrowRight size={18} className="ml-2" />}
                  </PrimaryButton>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#050b18] px-2 text-slate-500 font-bold tracking-widest">Or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full flex justify-center py-4 px-4 rounded-2xl border border-slate-700 text-sm font-bold text-white hover:bg-slate-800 transition-all active:scale-[0.98]"
                  >
                    {isLogin ? 'New to MediAssist? Sign Up' : 'Already have an account? Sign In'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-12 text-center text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
            By signing in, you agree to our <span className="text-slate-400 underline cursor-pointer">Terms</span> and <span className="text-slate-400 underline cursor-pointer">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function InputField({ label, icon, type, value, onChange, placeholder, loading }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-300 tracking-wide px-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-500 transition-colors text-slate-500">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full pl-12 pr-4 py-4 border border-slate-700 rounded-2xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all hover:bg-slate-800"
          placeholder={placeholder}
          disabled={loading}
        />
      </div>
    </div>
  );
}

function PrimaryButton({ children, loading, onClick }) {
  return (
    <button
      type="submit"
      disabled={loading}
      onClick={onClick}
      className="w-full flex items-center justify-center py-4 px-6 rounded-2xl shadow-lg shadow-blue-900/20 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all active:scale-[0.98] disabled:opacity-50"
    >
      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : children}
    </button>
  );
}
