import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Mic, Brain, Sparkles, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Master English Speaking
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Practice speaking English with AI-powered feedback and real-time analysis
          </p>
          
          <div className="mt-10">
            <SignedIn>
              <Link 
                href="/topic"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center gap-2 transition-all transform hover:scale-105"
              >
                Start Practice <ArrowRight className="w-5 h-5" />
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center gap-2 transition-all transform hover:scale-105">
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Mic className="w-8 h-8 text-blue-400" />}
              title="Real-time Speech Analysis"
              description="Get instant feedback on your pronunciation, fluency, and grammar as you speak."
            />
            <FeatureCard 
              icon={<Brain className="w-8 h-8 text-emerald-400" />}
              title="AI-Powered Feedback"
              description="Receive personalized suggestions and corrections from our advanced AI system."
            />
            <FeatureCard 
              icon={<Clock className="w-8 h-8 text-purple-400" />}
              title="Track Your Progress"
              description="Monitor your improvement over time with detailed analytics and progress tracking."
            />
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="py-24 bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-12">Trusted by Language Learners Worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="This platform has transformed my English speaking abilities completely!"
              author="Sarah Chen"
              role="Business Professional"
            />
            <TestimonialCard 
              quote="The real-time feedback helped me improve faster than any other method."
              author="Miguel Rodriguez"
              role="University Student"
            />
            <TestimonialCard 
              quote="Perfect for daily practice. I feel more confident speaking English now."
              author="Anna Kowalski"
              role="Language Learner"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="bg-gray-900/30 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
      <p className="text-gray-300 mb-4">"{quote}"</p>
      <div className="text-sm">
        <p className="font-semibold">{author}</p>
        <p className="text-gray-500">{role}</p>
      </div>
    </div>
  );
}
