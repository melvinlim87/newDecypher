import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRobot, FaChartLine, FaCode, FaUserCheck, FaCheckCircle } from 'react-icons/fa';
import { HiLightningBolt } from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { SilverCarousel } from '../components/SilverCarousel';
import { TradingFeatures } from '../components/TradingFeatures';
import { LiveMarketData } from '../components/LiveMarketData';
import { VerticalCircuitLines } from '../components/VerticalCircuitLines';


export function HomePage() {
  // Add a style tag for themed background that matches navbar
  useEffect(() => {
    const homePageStyle = document.createElement('style');
    homePageStyle.innerHTML = `
      /* Global home page styling */
      .home-page-container {
        background: 
          rgba(24, 24, 27, 0.98) 0%,
          rgba(39, 39, 42, 0.95) 50%,
          rgba(24, 24, 27, 0.98) 100%
        ) !important;
        color: var(--main-title, #E3E5E7) !important;
        min-height: 100vh !important;
        position: relative !important;
        overflow-x: hidden !important;
      }
      
      .home-page-container.dark {
        background: 
          rgba(24, 24, 27, 0.98) 0%,
          rgba(39, 39, 42, 0.95) 50%,
          rgba(24, 24, 27, 0.98) 100%
        ) !important;
        color: #C9CCCF !important;
      }
      
      /* Force all text elements to use the navbar blue */
      .home-page *, .home-page *::before, .home-page *::after {
        color: var(--logo-inner-blue, #00A9E0) !important;
      }
      
      /* Fix for body and html to prevent any background showing through */
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
      
      /* Apply the token styling to home page elements */
      .home-text, .home-page h1, .home-page h2, .home-page p, .home-page span,
      .home-page div, .home-page button, .home-page a {
        color: white !important;
        text-shadow: 0 0 5px rgba(0, 229, 255, 0.5) !important;
      }
      
      /* Target all icons in home page */
      .home-page svg, .home-page .lucide-user, .home-page .lucide-mail, 
      .home-page .lucide-calendar, .home-page .lucide-phone,
      .home-page .lucide-coins, .home-page .lucide-credit-card,
      .home-page .lucide-receipt, .home-page .lucide-users,
      .home-page .lucide-gift, .home-page .lucide-history,
      .home-page .fa, .home-page .fas, .home-page .far, .home-page .fab {
        color: var(--logo-inner-blue, #00A9E0) !important;
        filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.5)) !important;
      }
      
      /* Card styling */
      .home-card {
        background: linear-gradient(
          135deg,
          rgba(226, 232, 240, 0.02) 0%,
          rgba(203, 213, 225, 0.03) 25%,
          rgba(226, 232, 240, 0.02) 50%,
          rgba(203, 213, 225, 0.03) 75%,
          rgba(226, 232, 240, 0.02) 100%
        ) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        box-shadow: 0 8px 32px rgba(203, 213, 225, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(5px) !important;
        border-radius: 0.5rem !important;
      }
      
      /* Dark mode adjustments */
      /* Dark mode text styling - overridden to keep using blue */
      .home-page-container.dark .home-text, 
      .home-page-container.dark h1, 
      .home-page-container.dark h2, 
      .home-page-container.dark p, 
      .home-page-container.dark span,
      .home-page-container.dark div,
      .home-page-container.dark button,
      .home-page-container.dark a {
        color: white !important;
        text-shadow: 0 2px 4px rgba(0, 169, 224, 0.5) !important;
      }
      
      /* Dark mode icon styling - overridden to keep using blue */
      .home-page-container.dark svg, 
      .home-page-container.dark .lucide-user, 
      .home-page-container.dark .lucide-mail, 
      .home-page-container.dark .lucide-calendar, 
      .home-page-container.dark .lucide-phone,
      .home-page-container.dark .lucide-coins,
      .home-page-container.dark .lucide-credit-card,
      .home-page-container.dark .lucide-receipt,
      .home-page-container.dark .lucide-users,
      .home-page-container.dark .lucide-gift,
      .home-page-container.dark .lucide-history,
      .home-page-container.dark .fa, 
      .home-page-container.dark .fas, 
      .home-page-container.dark .far, 
      .home-page-container.dark .fab {
        color: var(--logo-inner-blue, #00A9E0) !important;
        filter: drop-shadow(0 2px 4px rgba(0, 169, 224, 0.5)) !important;
      }
      
      /* Dark mode card styling */
      .home-page-container.dark .home-card {
        background: linear-gradient(
          135deg,
          rgba(226, 232, 240, 0.02) 0%,
          rgba(203, 213, 225, 0.03) 25%,
          rgba(226, 232, 240, 0.02) 50%,
          rgba(203, 213, 225, 0.03) 75%,
          rgba(226, 232, 240, 0.02) 100%
        ) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        box-shadow: 0 8px 32px rgba(203, 213, 225, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
      }
      
      /* Add button styling */
      .home-page button, .home-page a.button {
        transition: all 0.2s ease-in-out !important;
      }
      
      .home-page button:hover, .home-page a.button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 20px rgba(0, 229, 255, 0.4) !important;
      }
      
      .home-page-container.dark button:hover, .home-page-container.dark a.button:hover {
        box-shadow: 0 4px 20px rgba(0, 169, 224, 0.4) !important;
      }
    `;
    document.head.appendChild(homePageStyle);
    
    return () => {
      document.head.removeChild(homePageStyle);
    };
  }, []);

  const { user } = useAuth();
  const { theme } = useTheme();
  const [scrollPosition, setScrollPosition] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position for animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Animate stats counters when in view
  useEffect(() => {
    if (!statsRef.current) return;
    
    const statsSection = statsRef.current;
    const statElements = statsSection.querySelectorAll('.stat-value');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          statElements.forEach(el => {
            const element = el as HTMLElement;
            const targetValue = parseInt(element.dataset.value || '0');
            const duration = 2000; // 2 seconds
            const frameDuration = 1000 / 60; // 60fps
            const totalFrames = Math.round(duration / frameDuration);
            let frame = 0;
            
            const counter = setInterval(() => {
              frame++;
              const progress = frame / totalFrames;
              const currentValue = Math.round(targetValue * progress);
              
              element.textContent = currentValue.toLocaleString();
              
              if (frame === totalFrames) {
                clearInterval(counter);
              }
            }, frameDuration);
          });
          
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(statsSection);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Carousel items
  const carouselItems = [
    {
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      title: 'Advanced AI Analysis for Forex Trading',
      description: 'Our cutting-edge algorithms analyze market patterns to identify profitable trading opportunities with precision and accuracy.'
    },
    {
      image: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      title: 'Generate Expert Advisors Automatically',
      description: 'Transform your trading strategies into fully-functioning Expert Advisors with our AI-powered code generation.'
    },
    {
      image: 'https://images.unsplash.com/photo-1559526324-593bc073d938?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      title: 'Real-time Market Insights',
      description: 'Stay ahead of market movements with real-time analysis and actionable insights delivered instantly.'
    },
    {
      image: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      title: 'Comprehensive Technical Analysis',
      description: 'Get detailed technical analysis including support/resistance levels, trend identification, and pattern recognition.'
    }
  ];
  
  // Steps for "How it Works" section
  const steps = [
    {
      number: 1,
      title: 'Import Your Chart Data',
      description: 'Upload your MT4/MT5 chart data or paste it directly into our platform.',
      icon: FaChartLine
    },
    {
      number: 2,
      title: 'AI-Powered Analysis',
      description: 'Our advanced algorithms analyze your data to identify patterns and trading opportunities.',
      icon: FaRobot
    },
    {
      number: 3,
      title: 'Review Insights',
      description: 'Get detailed market insights, support/resistance levels, and trend predictions.',
      icon: HiLightningBolt
    },
    {
      number: 4,
      title: 'Generate Expert Advisor',
      description: 'Automatically create custom Expert Advisors based on the analysis.',
      icon: FaCode
    }
  ];
  
  // Testimonials
  const testimonials = [
    {
      name: 'Michael R.',
      role: 'Professional Forex Trader',
      quote: 'This platform has completely transformed my trading. The AI analysis catches patterns I would have missed, and the EA generation saves me hours of coding.',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      name: 'Sarah L.',
      role: 'Institutional Investor',
      quote: "The technical insights are incredibly accurate. I've been able to make more informed decisions and significantly increase my win rate.",
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      name: 'David K.',
      role: 'Retail Trader',
      quote: 'As someone new to forex trading, this platform has been invaluable. The AI guidance feels like having a mentor watching over my trades.',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
    }
  ];
  
  return (
    <div className={`home-page home-page-container ${theme === 'dark' ? 'dark' : ''} min-h-screen relative overflow-hidden`}>
      {/* Single background layer with animations */}
      <div className="absolute inset-0 z-0">
        <div className="opacity-50">
          <VerticalCircuitLines theme={theme} />
        </div>
      </div>
      
      {/* Ensure z-index stacking context is correct */}
      <div className="relative z-10 px-6 md:px-12 lg:px-24">
        
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[85vh] flex items-center pt-0">
        {/* Main Content */}
        <div className="container mx-auto py-4 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 home-text">
                AI-Powered Forex Analytics
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 home-text opacity-80">
                Leverage advanced artificial intelligence to analyze market patterns, generate trading strategies, and automate your expert advisors.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {!user ? (
                  <>
                    <Link 
                      to="/register" 
                      className="relative px-8 py-3 rounded-lg text-center text-lg font-medium overflow-hidden group button home-card"
                      style={{
                        background: 'rgba(0, 169, 224, 0.2)',
                        boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
                        border: '1px solid rgba(192, 192, 192, 0.5)',
                        fontWeight: 'bold'
                      }}
                    >
                      <span className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rotate-45 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-15 transition-all group-hover:translate-x-full duration-700"></span>
                      <span className="home-text">Start Trading Smarter</span>
                    </Link>
                    
                    <Link 
                      to="/login" 
                      className="px-8 py-3 rounded-lg text-center text-lg font-medium button home-card"
                      style={{
                        background: 'rgba(31, 41, 55, 0.4)',
                        boxShadow: '0 0 15px rgba(31, 41, 55, 0.3)',
                        border: '1px solid rgba(192, 192, 192, 0.3)',
                        fontWeight: 'bold'
                      }}
                    >
                      <span className="home-text">Log In</span>
                    </Link>
                  </>
                ) : (
                  <Link 
                    to="/ai-chat" 
                    className="relative px-8 py-3 rounded-lg text-center text-lg font-medium overflow-hidden group button home-card"
                    style={{
                      background: 'rgba(0, 169, 224, 0.2)',
                      boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
                      border: '1px solid rgba(192, 192, 192, 0.5)',
                      fontWeight: 'bold'
                    }}
                  >
                    <span className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rotate-45 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-15 transition-all group-hover:translate-x-full duration-700"></span>
                    <span className="home-text">Start AI Analysis</span>
                  </Link>
                )}
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <SilverCarousel items={carouselItems} />
            </div>
          </div>
        </div>
      </section>
      
      {/* Live Market Data Section */}
      <section className="py-16 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
        
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center home-text">
            Real-time Market Insights
          </h2>
          
          <LiveMarketData theme={theme} />
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
        
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center home-text">
            Powerful Trading Tools
          </h2>
          
          <p className="text-lg text-center max-w-3xl mx-auto mb-12 home-text opacity-80">
            Our platform combines cutting-edge AI technology with user-friendly features to give you an edge in the forex market.
          </p>
          
          <TradingFeatures theme={theme} />
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
        
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center home-text">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="relative p-6 rounded-lg transition-all duration-300 hover:transform hover:scale-105 home-card"
              >
                {/* Step number */}
                <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30 home-text">
                  {step.number}
                </div>
                
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-1 bg-gradient-to-r from-indigo-500/70 to-transparent z-1"></div>
                )}
                
                <div className="text-center pt-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-indigo-500/10 border border-indigo-500/20">
                    <step.icon size={32} className="home-icon" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 home-text">
                    {step.title}
                  </h3>
                  
                  <p className="home-text opacity-80">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section ref={statsRef} className="py-16 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
        
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg text-center home-card">
              <h3 className="stat-value text-4xl font-bold mb-2 home-text" data-value="25000">
                0
              </h3>
              <p className="home-text opacity-80">
                Charts Analyzed
              </p>
            </div>
            
            <div className="p-6 rounded-lg text-center home-card">
              <h3 className="stat-value text-4xl font-bold mb-2 home-text" data-value="10500">
                0
              </h3>
              <p className="home-text opacity-80">
                EAs Generated
              </p>
            </div>
            
            <div className="p-6 rounded-lg text-center home-card">
              <h3 className="stat-value text-4xl font-bold mb-2 home-text" data-value="5000">
                0
              </h3>
              <p className="home-text opacity-80">
                Active Traders
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
        
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center home-text">
            What Traders Are Saying
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="relative p-6 rounded-lg transition-all duration-300 hover:transform hover:scale-105 home-card"
              >
                {/* Quote mark */}
                <div className="absolute -top-4 -left-2 text-5xl opacity-20 home-text">
                  "
                </div>
                
                <div className="text-center pt-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-indigo-500/30"
                  />
                  
                  <p className="mb-4 italic home-text opacity-90">
                    "{testimonial.quote}"
                  </p>
                  
                  <h4 className="font-semibold home-text">
                    {testimonial.name}
                  </h4>
                  
                  <p className="text-sm home-text opacity-80">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section ref={ctaRef} className="py-16 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
        
        <div className="container mx-auto py-16 rounded-2xl home-card">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 home-text">
              Ready to Transform Your Trading?
            </h2>
            
            <p className="text-xl mb-8 home-text opacity-80">
              Join thousands of traders who are already leveraging AI to gain a competitive edge in the markets.
            </p>
            
            {!user ? (
              <Link 
                to="/register" 
                className="relative px-10 py-4 rounded-lg text-center text-lg font-medium overflow-hidden group button home-card inline-block"
                style={{
                  background: 'rgba(0, 169, 224, 0.2)',
                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
                  border: '1px solid rgba(192, 192, 192, 0.5)',
                  fontWeight: 'bold'
                }}
              >
                <span className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rotate-45 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-15 transition-all group-hover:translate-x-full duration-700"></span>
                <span className="home-text">Start Analyzing Now</span>
              </Link>
            ) : (
              <Link 
                to="/ai-chat" 
                className="relative px-10 py-4 rounded-lg text-center text-lg font-medium overflow-hidden group button home-card inline-block"
                style={{
                  background: 'rgba(0, 169, 224, 0.2)',
                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
                  border: '1px solid rgba(192, 192, 192, 0.5)',
                  fontWeight: 'bold'
                }}
              >
                <span className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rotate-45 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-15 transition-all group-hover:translate-x-full duration-700"></span>
                <span className="home-text">Start Analyzing Now</span>
              </Link>
            )}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

export default HomePage;