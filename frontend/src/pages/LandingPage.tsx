import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Brain,
  MessageSquare,
  RefreshCw,
  BarChart3,
  Lock,
  Layers,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { formatINR } from '../utils/formatters';

export const LandingPage: React.FC = () => {
  // Interactive Engine Simulator on Landing Page
  const [calcAmount, setCalcAmount] = useState<number>(12500);
  const [calcReason, setCalcReason] = useState<string>('GATEWAY_TIMEOUT');
  const [calcMethod, setCalcMethod] = useState<string>('UPI_INTENT');

  const getSimResult = () => {
    let prob = 76;
    let channel = 'WhatsApp UPI Link';
    let action = 'Instant Interactive WhatsApp Link';
    let window = '30–45 mins (Immediate Golden Window)';

    if (calcReason === 'GATEWAY_TIMEOUT') {
      prob = 88;
      channel = 'Smart Acquirer Webhook';
      action = 'Automated Acquirer Switch Retry';
      window = '15–30 mins (Gateway Self-healing)';
    } else if (calcReason === 'INSUFFICIENT_FUNDS') {
      prob = 68;
      channel = 'WhatsApp Payment Prompt';
      action = 'Interactive 1-Click Pay Link';
      window = 'Next morning 09:30 AM (Fund Credit Window)';
    } else if (calcReason === 'MANDATE_LAPSED') {
      prob = 74;
      channel = 'Email & WhatsApp Auth Link';
      action = 'Digital Mandate Re-authorization';
      window = '12–24 hours';
    }

    const expectedRecovery = Math.round(calcAmount * (prob / 100));
    return { prob, channel, action, window, expectedRecovery };
  };

  const sim = getSimResult();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">RecoverAI</span>
              <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider -mt-1">
                Revenue Recovery Platform
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#simulator" className="hover:text-slate-900 transition-colors">Recovery Calculator</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="emerald" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Intelligent Payment Revenue Recovery for High-Growth Indian SaaS & Fintech</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Recover failed payments before they turn into <span className="text-emerald-600">lost revenue</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            RecoverAI classifies payment drop-offs, calculates deterministic recovery probabilities, and orchestrates multi-channel win-back across WhatsApp, SMS, and smart gateway retries.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/login">
              <Button variant="emerald" size="lg" leftIcon={<Zap className="w-4 h-4" />}>
                Launch Live Demo Dashboard
              </Button>
            </Link>
            <a href="#simulator">
              <Button variant="outline" size="lg">
                Try Recovery Calculator
              </Button>
            </a>
          </div>

          {/* Metrics bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-6 bg-white border border-slate-200 rounded-2xl shadow-card text-left">
            <div>
              <div className="text-2xl font-black text-slate-900">₹48.2 Cr+</div>
              <p className="text-xs text-slate-500 mt-0.5">Revenue Recovered</p>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600">79.4%</div>
              <p className="text-xs text-slate-500 mt-0.5">Average Recovery Rate</p>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">&lt; 35 mins</div>
              <p className="text-xs text-slate-500 mt-0.5">Avg. Resolution Window</p>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-600">100%</div>
              <p className="text-xs text-slate-500 mt-0.5">Explainable Decisions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Recovery Calculator Widget */}
      <section id="simulator" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Live Simulation Widget</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Test Our Deterministic Recovery Engine</h2>
            <p className="text-xs text-slate-400 mt-2">
              Adjust transaction parameters to see how RecoverAI calculates recovery probability and selects the optimal channel.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Input parameters */}
            <div className="lg:col-span-6 bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-sm font-semibold text-white">Simulate Transaction Failure</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Failed Transaction Amount: <strong className="text-emerald-400">{formatINR(calcAmount)}</strong>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="500"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₹1,000</span>
                  <span>₹50,000</span>
                  <span>₹1,00,000</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Failure Root Cause</label>
                <select
                  value={calcReason}
                  onChange={(e) => setCalcReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  <option value="GATEWAY_TIMEOUT">Transient Gateway Timeout (504)</option>
                  <option value="INSUFFICIENT_FUNDS">Insufficient Account Balance</option>
                  <option value="CUSTOMER_DROPOFF">3DS OTP Drop-off / Timeout</option>
                  <option value="MANDATE_LAPSED">eNACH Mandate Authorization Lapsed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Instrument</label>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  <option value="UPI_INTENT">UPI Intent (Google Pay / PhonePe)</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="ENACH_MANDATE">eNACH Mandate</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>
            </div>

            {/* Live Engine Output Card */}
            <div className="lg:col-span-6 bg-slate-950 p-6 rounded-2xl border border-emerald-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Engine Diagnostic</span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {sim.prob}% Probability
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Expected Recovery</span>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">{formatINR(sim.expectedRecovery)}</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Target Channel</span>
                  <div className="text-xs font-bold text-white mt-1">{sim.channel}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Recommended Action</span>
                <p className="font-semibold text-slate-200">{sim.action}</p>
                <p className="text-[11px] text-amber-400 pt-1">Timing: {sim.window}</p>
              </div>

              <Link to="/login" className="block pt-2">
                <Button variant="emerald" className="w-full" size="sm">
                  Access Full Platform Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">Autonomous Pipeline</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">How RecoverAI Recovers Lost Payments</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Capture & Classify',
                desc: 'Webhooks instantly capture gateway drop-offs and classify into transient, customer, or mandate root causes.',
              },
              {
                step: '02',
                title: 'Score & Explain',
                desc: 'Deterministic engine weighs customer LTV, historical success rate, amount, and timing to compute recovery probability.',
              },
              {
                step: '03',
                title: 'Channel Routing',
                desc: 'Selects the highest-converting communication channel (interactive WhatsApp, SMS, or background retry).',
              },
              {
                step: '04',
                title: 'Reconcile & Audit',
                desc: 'Updates ledger status, generates immutable audit log, and notifies teams with zero manual intervention.',
              },
            ].map((st) => (
              <div key={st.step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card">
                <div className="text-2xl font-black text-emerald-600 font-mono mb-2">{st.step}</div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{st.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">Enterprise Capabilities</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Built for Modern Payment Operations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-5 h-5 text-emerald-600" />,
                title: 'Explainable AI Intelligence',
                desc: 'Every recommendation is backed by clear, deterministic rules and human-readable explanations—no black boxes.',
              },
              {
                icon: <MessageSquare className="w-5 h-5 text-emerald-600" />,
                title: 'WhatsApp Deep-Link Win-Back',
                desc: 'Send interactive 1-click UPI and Card payment links directly to Indian consumers with 88%+ open rates.',
              },
              {
                icon: <RefreshCw className="w-5 h-5 text-emerald-600" />,
                title: 'Smart Acquirer Retries',
                desc: 'Time retries with issuer bank clearing cycles and morning fund credit windows to maximize authorization.',
              },
              {
                icon: <Layers className="w-5 h-5 text-emerald-600" />,
                title: 'Recovery Campaigns',
                desc: 'Build multi-step recovery sequences segmented by customer tier, amount threshold, and payment instrument.',
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-emerald-600" />,
                title: 'Real-Time Revenue Analytics',
                desc: 'Track recovered vs lost revenue, channel effectiveness, failure distributions, and cohort recovery rates.',
              },
              {
                icon: <Lock className="w-5 h-5 text-emerald-600" />,
                title: 'Role-Based Access & Audit Logs',
                desc: 'Enforce granular permissions for Admin, Analyst, and Support personnel with immutable action logging.',
              },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-subtle">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 bg-emerald-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black tracking-tight">Ready to stop losing revenue to failed payments?</h2>
          <p className="mt-3 text-sm text-emerald-200 max-w-xl mx-auto">
            Join leading Indian fintechs and SaaS companies recovering up to 79% of failed transactions automatically.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/register">
              <Button variant="emerald" size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-emerald-400 text-white hover:bg-emerald-800">
                Explore Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">RecoverAI</span>
            <span>— Intelligent Payment Revenue Recovery</span>
          </div>
          <div className="flex items-center gap-6">
            <span>© 2026 RecoverAI Technologies Pvt Ltd</span>
            <span>Security & Compliance</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
