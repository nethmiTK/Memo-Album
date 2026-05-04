'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Check, CreditCard, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SecureOnboarding({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleFinalSubmit = () => {
    // Navigate to user panel
    router.push('/user-panel');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Blurred Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#fff8f8]/80 backdrop-blur-2xl"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl bg-white/40 shadow-[0_40px_100px_rgba(33,26,27,0.08)] rounded-[48px] overflow-hidden border border-white/40"
      >
        {/* Header */}
        <div className="absolute top-0 w-full px-12 py-8 flex justify-between items-center z-20">
          <div className="font-serif italic text-2xl tracking-tighter text-[#211a1b]" style={{ fontFamily: 'var(--font-newsreader)' }}>
            The Editorial Archive
          </div>
          <div className="flex items-center gap-6">
            <button className="text-[#534345]/60 hover:text-[#890051] transition-colors">
              <HelpCircle size={22} strokeWidth={1.5} />
            </button>
            <button onClick={onClose} className="text-[#534345]/60 hover:text-[#890051] transition-colors">
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] min-h-[700px]">
          {/* Left Panel: Context */}
          <div className="hidden lg:flex flex-col justify-center px-24 py-20 bg-gradient-to-br from-white/20 to-transparent">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-3">
                  <span className="h-px w-8 bg-[#890051]/40"></span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#890051]">
                    Step 0{step} / {step === 1 ? 'Security' : step === 2 ? 'Profile' : 'Atelier'}
                  </p>
                </div>
                
                <h2 className="text-6xl leading-[1.05] text-[#211a1b]" style={{ fontFamily: 'var(--font-newsreader)' }}>
                  {step === 1 && <>Establish Your <span className="italic block">Sanctuary</span></>}
                  {step === 2 && <>Configure Your <span className="italic block">Identity</span></>}
                  {step === 3 && <>Select Your <span className="italic block">Tier</span></>}
                </h2>
                
                <p className="text-[#534345] text-lg leading-relaxed font-light italic max-w-sm">
                  {step === 1 && "Create a secure access point for your archive. Every great journey starts with a safe foundation."}
                  {step === 2 && "Personalize your studio presence. This is how your clients will recognize your curated work."}
                  {step === 3 && "Choose a plan that matches the scale of your digital archive. Upgrade anytime as your studio grows."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Panel: Form */}
          <div className="flex flex-col justify-center px-8 md:px-16 py-32 lg:py-20 bg-white/30">
            <AnimatePresence mode="wait">
              {step === 1 && <Step1Security onNext={() => setStep(2)} />}
              {step === 2 && <Step2Profile onNext={() => setStep(3)} />}
              {step === 3 && <Step3Plans onFinish={handleFinalSubmit} />}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Step1Security({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10 max-w-md w-full mx-auto"
    >
      <div className="space-y-8">
        <InputField label="Current Password" type="password" placeholder="••••••••••••" />
        <div className="space-y-2">
          <InputField label="New Password" type="password" placeholder="••••••••••••" />
          <p className="text-[10px] text-[#8b7079] italic">Minimum 12 characters, including one intentional symbol.</p>
        </div>
        <InputField label="Confirm New Password" type="password" placeholder="••••••••••••" />
      </div>
      
      <div className="flex items-center gap-8 pt-4">
        <button 
          onClick={onNext}
          className="px-10 py-4 bg-gradient-to-r from-[#890051] to-[#d23284] text-white font-semibold rounded-2xl shadow-[0_20px_40px_rgba(137,0,81,0.2)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          Continue to Profile
        </button>
        <button onClick={onNext} className="text-[#890051] italic text-lg hover:underline decoration-[#890051]/30" style={{ fontFamily: 'var(--font-newsreader)' }}>
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}

function Step2Profile({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10 max-w-md w-full mx-auto"
    >
      <div className="space-y-8">
        <div className="flex justify-center mb-10">
          <div className="w-32 h-32 rounded-full bg-[#f3e5e6] flex items-center justify-center border-2 border-dashed border-[#890051]/20 group cursor-pointer hover:border-[#890051]/40 transition-all">
            <span className="text-[10px] uppercase tracking-widest text-[#890051]/60 font-bold text-center px-4">Upload <br/>Avatar</span>
          </div>
        </div>
        <InputField label="Studio Display Name" type="text" placeholder="Julianne Vough Studio" />
        <InputField label="Contact Number" type="text" placeholder="+1 (555) 000-0000" />
      </div>
      
      <div className="flex items-center gap-8 pt-4">
        <button 
          onClick={onNext}
          className="px-10 py-4 bg-gradient-to-r from-[#890051] to-[#d23284] text-white font-semibold rounded-2xl shadow-[0_20px_40px_rgba(137,0,81,0.2)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          Proceed to Atelier
        </button>
      </div>
    </motion.div>
  );
}

function Step3Plans({ onFinish }: { onFinish: () => void }) {
  const [selected, setSelected] = useState('pro');

  const plans = [
    { id: 'essential', name: 'Essential', price: '$29', features: ['10,000 Assets', 'Standard Meta', 'Single Profile'] },
    { id: 'pro', name: 'Professional', price: '$89', features: ['Unlimited Assets', 'AI Curation', 'Multi-Collab'], featured: true },
    { id: 'ent', name: 'Enterprise', price: 'Custom', features: ['White-Label', 'Curator Liaison', 'Custom API'] }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={`cursor-pointer p-6 rounded-[32px] transition-all duration-500 relative border ${
              selected === plan.id 
              ? 'bg-[#ffe8ee]/80 border-[#890051]/20 shadow-xl -translate-y-2' 
              : 'bg-[#fff8f7]/50 border-transparent hover:bg-[#fff8f7]/80'
            }`}
          >
            {plan.featured && <div className="absolute -top-3 right-6 bg-[#890051] text-white text-[8px] uppercase font-bold px-3 py-1 rounded-full tracking-widest">Recommended</div>}
            <h3 className="text-xl mb-1" style={{ fontFamily: 'var(--font-newsreader)' }}>{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-2xl font-bold">{plan.price}</span>
              {plan.id !== 'ent' && <span className="text-[10px] text-[#534345]/60">/mo</span>}
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-[11px] text-[#534345]">
                  <Check size={12} className="text-[#890051]" /> {f}
                </li>
              ))}
            </ul>
            <div className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center transition-all ${
              selected === plan.id ? 'bg-[#890051] text-white' : 'bg-[#f3e5e6] text-[#890051]'
            }`}>
              {selected === plan.id ? 'Selected' : 'Select'}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#fff8f7]/60 p-8 rounded-[32px] border border-white/40">
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#534345] mb-6">Order Summary</h4>
        <div className="space-y-4 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-[#534345]/60">Professional Plan</span>
            <span>$89.00</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-4 border-t border-[#890051]/10">
            <span>Total Due</span>
            <span className="text-[#890051]">$89.00</span>
          </div>
        </div>
        <button 
          onClick={onFinish}
          className="w-full py-5 bg-gradient-to-r from-[#890051] to-[#d23284] text-white font-semibold rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          Confirm & Pay
        </button>
      </div>
    </motion.div>
  );
}

function InputField({ label, type, placeholder }: { label: string, type: string, placeholder: string }) {
  return (
    <div className="relative group">
      <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8b7079] mb-3 ml-1 group-focus-within:text-[#890051] transition-colors">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder}
        className="w-full bg-[#fff8f7]/50 border-none rounded-2xl py-4 px-6 text-[#211a1b] focus:ring-1 focus:ring-[#890051]/40 focus:outline-none transition-all placeholder:text-[#8b7079]/30" 
      />
    </div>
  );
}
