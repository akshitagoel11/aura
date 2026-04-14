import Link from "next/link"
import { Sparkles, CheckSquare, Calendar, BarChart3, Brain, ArrowRight, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Brain,
    title: "AI Intent Recognition",
    description:
      "Natural language processing that understands complex commands and automates your workflow.",
    color: "bg-blue-500",
  },
  {
    icon: CheckSquare,
    title: "Smart Task Engine",
    description:
      "AI-driven categorization and duration estimation to keep your to-do list organized and realistic.",
    color: "bg-aura-500",
  },
  {
    icon: Calendar,
    title: "Dynamic Scheduling",
    description:
      "Intelligent time-blocking that adapts to your habits, energy levels, and deadlines.",
    color: "bg-purple-500",
  },
  {
    icon: BarChart3,
    title: "Predictive Analytics",
    description:
      "Advanced insights into your productivity patterns with personalized improvement suggestions.",
    color: "bg-emerald-500",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-aura-100 selection:text-aura-900">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white/70 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aura-600 shadow-lg shadow-aura-200 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Aura <span className="text-aura-600">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-6">
              <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-aura-600 transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-aura-600 transition-colors">How it Works</Link>
              <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-aura-600 transition-colors">Pricing</Link>
            </nav>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-slate-700 hover:text-aura-600 transition-colors"
              >
                Sign In
              </Link>
              <Button asChild className="rounded-full px-6 shadow-md shadow-aura-100">
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32 px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-aura-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aura-50 border border-aura-100 text-aura-700 text-sm font-semibold mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aura-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-aura-500"></span>
              </span>
              v2.0 is now live with Gemini 1.5 Pro
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-slide-in">
              Master Your Time with
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-aura-600 to-indigo-600 leading-tight">
                AI Precision
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in italic">
              Experience the next generation of productivity. Aura AI transforms scattered tasks into an optimized, high-performance schedule automatically.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-semibold group shadow-xl shadow-aura-200 w-full sm:w-auto" asChild>
                <Link href="/auth/register">
                  Unlock Superpowers <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-semibold border-2 w-full sm:w-auto" asChild>
                <Link href="/dashboard">Watch Demo</Link>
              </Button>
            </div>

            {/* Dashboard Mockup Preview */}
            <div className="relative mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-slide-in p-2 bg-white/50 backdrop-blur-sm">
              <div className="rounded-xl overflow-hidden border border-slate-100 bg-white aspect-[16/9] flex">
                 <div className="w-1/4 border-r bg-slate-50/50 p-4 space-y-4">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="space-y-2">
                      <div className="h-8 w-full bg-aura-100 rounded-lg" />
                      <div className="h-8 w-full bg-slate-100 rounded-lg" />
                      <div className="h-8 w-full bg-slate-100 rounded-lg" />
                    </div>
                 </div>
                 <div className="flex-1 p-6 space-y-6 bg-white">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <div className="h-6 w-32 bg-slate-200 rounded" />
                        <div className="h-4 w-48 bg-slate-100 rounded" />
                      </div>
                      <div className="h-10 w-24 bg-aura-600 rounded-lg shadow-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       {[1,2,3].map(i => (
                         <div key={i} className="h-24 bg-slate-50/80 rounded-xl border border-slate-100 p-4 space-y-2">
                            <div className="h-3 w-1/2 bg-slate-200 rounded" />
                            <div className="h-6 w-full bg-slate-100 rounded" />
                         </div>
                       ))}
                    </div>
                    <div className="h-48 bg-slate-50/50 rounded-xl border border-slate-100 p-6 flex items-center justify-center">
                       <div className="text-slate-400 font-medium">Visualization of your productivity...</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 px-4 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl font-bold mb-6 tracking-tight">The Intelligent Core</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed font-light">
                Built on advanced LLMs, Aura AI adapts to your unique working style 
                to eliminate friction and maximize output.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-8 rounded-3xl border bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-aura-100 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-snug">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic CTA */}
        <section className="py-32 px-4">
          <div className="max-w-5xl mx-auto rounded-[3rem] bg-slate-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/2 h-full">
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-aura-500/20 rounded-full blur-[100px]" />
            </div>
            
            <div className="relative z-10 p-12 sm:p-20 text-center">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">Ready to reclaim your focus?</h2>
              <p className="text-slate-400 mb-12 text-lg max-w-2xl mx-auto font-light">
                Join 5,000+ high-performers who use Aura AI to stay 
                ahead of their deadlines and achieve peak productivity daily.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-10 rounded-full font-bold text-lg" asChild>
                  <Link href="/auth/register">Start for Free</Link>
                </Button>
                <p className="text-slate-500 text-sm">No credit card required. Cancel anytime.</p>
              </div>
              
              <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
                 <div className="flex items-center gap-1 text-white font-semibold"><Zap className="h-5 w-5 fill-current" /> Fast</div>
                 <div className="flex items-center gap-1 text-white font-semibold"><Shield className="h-5 w-5 fill-current" /> Secure</div>
                 <div className="flex items-center gap-1 text-white font-semibold"><Brain className="h-5 w-5 fill-current" /> Smart</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-16">
            <div className="max-w-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-aura-600 shadow-md shadow-aura-200">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">Aura AI</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Empowering humans through artificial intelligence. We build tools that make you better at what you do.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 md:gap-24">
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900">Product</h4>
                <div className="flex flex-col gap-2 text-sm text-slate-500 font-medium">
                  <Link href="#" className="hover:text-aura-600">Features</Link>
                  <Link href="#" className="hover:text-aura-600">Integrations</Link>
                  <Link href="#" className="hover:text-aura-600">Enterprise</Link>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900">Company</h4>
                <div className="flex flex-col gap-2 text-sm text-slate-500 font-medium">
                  <Link href="#" className="hover:text-aura-600">About</Link>
                  <Link href="#" className="hover:text-aura-600">Careers</Link>
                  <Link href="#" className="hover:text-aura-600">Privacy</Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400 font-light italic">
              Built with precision for the modern achiever.
            </p>
            <p className="text-sm text-slate-400">
              © 2024 Aura AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
