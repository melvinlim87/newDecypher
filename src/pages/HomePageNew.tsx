import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRobot, FaChartLine, FaHistory, FaCode, FaUserCheck, FaCheckCircle } from 'react-icons/fa';
import { HiLightningBolt } from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { SilverCarousel } from '../components/SilverCarousel';
import { TradingFeatures } from '../components/TradingFeatures';
import { LiveMarketData } from '../components/LiveMarketData';
import { ParticleBackground } from '../components/ParticleBackground';

export function HomePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [scrollPosition, setScrollPosition] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  
  // Force silver theme when on homepage
  useEffect(() => {
    const originalTheme = theme;
    setTheme('silver');
    
    return () => {
      setTheme(originalTheme);
    };
  }, []);
  
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
      quote: 'The technical insights are incredibly accurate. I've been able to make more informed decisions and significantly increase my win rate.',
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground theme="silver" />
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-1 h-32 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-70"
          style={{ boxShadow: '0 0 15px rgba(0, 169, 224, 0.7)' }} />
        <div className="absolute top-0 right-0 w-1 h-32 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-70"
          style={{ boxShadow: '0 0 15px rgba(0, 169, 224, 0.7)' }} />
        <div className="absolute bottom-0 left-0 w-1 h-32 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-70"
          style={{ boxShadow: '0 0 15px rgba(0, 169, 224, 0.7)' }} />
        <div className="absolute bottom-0 right-0 w-1 h-32 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-70"
          style={{ boxShadow: '0 0 15px rgba(0, 169, 224, 0.7)' }} />
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-16 mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ 
                  color: '#00A9E0',
                  textShadow: '0 0 10px rgba(0, 169, 224, 0.5)'
                }}
              >
                AI-Powered Forex Analytics
              </h1>
              
              <p 
                className="text-xl md:text-2xl mb-8"
                style={{ 
                  color: '#515969'
                }}
              >
                Leverage advanced artificial intelligence to analyze market patterns, generate trading strategies, and automate your expert advisors.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {!user ? (
                  <>
                    <Link 
                      to="/register" 
                      className="relative px-8 py-3 rounded-lg text-center text-lg font-medium overflow-hidden group"
                      style={{
                        background: 'linear-gradient(90deg, #00ACC1 0%, #00E5FF 100%)',
                        boxShadow: '0 0 20px rgba(0, 229, 255, 0.4), 0 0 40px rgba(0, 229, 255, 0.2)',
                        border: '1px solid rgba(0, 229, 255, 0.7)',
                        color: '#004d66',
                        fontWeight: 'bold'
                      }}
                    >
                      <span className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rotate-45 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-15 transition-all group-hover:translate-x-full duration-700"></span>
                      Start Trading Smarter
                    </Link>
                    
                    <Link 
                      to="/login" 
                      className="px-8 py-3 rounded-lg text-center text-lg font-medium border-2 transition-all duration-300"
                      style={{
                        borderColor: 'rgba(0, 169, 224, 0.7)',
                        color: '#00A9E0',
                        boxShadow: '0 0 10px rgba(0, 169, 224, 0.2)',
                        textShadow: '0 0 5px rgba(0, 169, 224, 0.3)'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 169, 224, 0.1)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 169, 224, 0.4)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 169, 224, 0.2)';
                      }}
                    >
                      Log In
                    </Link>
                  </>
                ) : (
                  <Link 
                    to="/ai-chat" 
                    className="relative px-8 py-3 rounded-lg text-center text-lg font-medium overflow-hidden group"
                    style={{
                      background: 'linear-gradient(90deg, #00ACC1 0%, #00E5FF 100%)',
                      boxShadow: '0 0 20px rgba(0, 229, 255, 0.4), 0 0 40px rgba(0, 229, 255, 0.2)',
                      border: '1px solid rgba(0, 229, 255, 0.7)',
                      color: '#004d66',
                      fontWeight: 'bold'
                    }}
                  >
                    <span className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rotate-45 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-15 transition-all group-hover:translate-x-full duration-700"></span>
                    Start AI Analysis
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
        <div 
          className="absolute top-0 left-0 w-full h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(0, 169, 224, 0.7), transparent)',
            boxShadow: '0 0 8px rgba(0, 169, 224, 0.5)'
          }}
        />
        
        <div className="container mx-auto px-4">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{ 
              color: '#00A9E0',
              textShadow: '0 0 8px rgba(0, 169, 224, 0.3)'
            }}
          >
            Real-time Market Insights
          </h2>
          
          <LiveMarketData theme="silver" />
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 relative">
        <div 
          className="absolute top-0 left-0 w-full h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(0, 169, 224, 0.7), transparent)',
            boxShadow: '0 0 8px rgba(0, 169, 224, 0.5)'
          }}
        />
        
        <div className="container mx-auto px-4">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4 text-center"
            style={{ 
              color: '#00A9E0',
              textShadow: '0 0 8px rgba(0, 169, 224, 0.3)'
            }}
          >
            Powerful Trading Tools
          </h2>
          
          <p 
            className="text-lg text-center max-w-3xl mx-auto mb-12"
            style={{ 
              color: '#515969'
            }}
          >
            Our platform combines cutting-edge AI technology with user-friendly features to give you an edge in the forex market.
          </p>
          
          <TradingFeatures theme="silver" />
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 relative">
        <div 
          className="absolute top-0 left-0 w-full h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(0, 169, 224, 0.7), transparent)',
            boxShadow: '0 0 8px rgba(0, 169, 224, 0.5)'
          }}
        />
        
        <div className="container mx-auto px-4">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{ 
              color: '#00A9E0',
              textShadow: '0 0 8px rgba(0, 169, 224, 0.3)'
            }}
          >
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="relative p-6 rounded-lg transition-all duration-300 hover:transform hover:scale-105"
                style={{
                  backgroundColor: 'rgba(176, 180, 185, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(201, 204, 207, 0.5)',
                  boxShadow: '0 8px 32px rgba(14, 31, 53, 0.1)'
                }}
              >
                {/* Step number */}
                <div 
                  className="absolute -top-5 -left-5 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(0, 169, 224, 0.9)',
                    border: '2px solid rgba(201, 204, 207, 0.7)',
                    boxShadow: '0 0 10px rgba(0, 169, 224, 0.5)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {step.number}
                </div>
                
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div 
                    className="hidden lg:block absolute top-1/2 -right-4 w-8 h-1"
                    style={{
                      background: 'linear-gradient(90deg, rgba(0, 169, 224, 0.7), transparent)',
                      zIndex: 1
                    }}
                  />
                )}
                
                <div className="text-center pt-6">
                  <div 
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{
                      background: 'rgba(176, 180, 185, 0.3)',
                      border: '1px solid rgba(201, 204, 207, 0.5)'
                    }}
                  >
                    <step.icon 
                      size={32} 
                      style={{
                        color: '#00A9E0',
                        filter: 'drop-shadow(0 0 5px rgba(0, 169, 224, 0.5))'
                      }}
                    />
                  </div>
                  
                  <h3 
                    className="text-xl font-semibold mb-2"
                    style={{
                      color: '#00A9E0',
                      textShadow: '0 0 5px rgba(0, 169, 224, 0.3)'
                    }}
                  >
                    {step.title}
                  </h3>
                  
                  <p
                    style={{
                      color: '#515969'
                    }}
                  >
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
        <div 
          className="absolute top-0 left-0 w-full h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(0, 169, 224, 0.7), transparent)',
            boxShadow: '0 0 8px rgba(0, 169, 224, 0.5)'
          }}
        />
        
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              className="p-6 rounded-lg text-center"
              style={{
                backgroundColor: 'rgba(176, 180, 185, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(201, 204, 207, 0.5)',
                boxShadow: '0 8px 32px rgba(14, 31, 53, 0.1)'
              }}
            >
              <h3 
                className="stat-value text-4xl font-bold mb-2" 
                data-value="25000"
                style={{
                  color: '#00A9E0',
                  textShadow: '0 0 8px rgba(0, 169, 224, 0.3)'
                }}
              >
                0
              </h3>
              <p
                style={{
                  color: '#515969'
                }}
              >
                Charts Analyzed
              </p>
            </div>
            
            <div 
              className="p-6 rounded-lg text-center"
              style={{
                backgroundColor: 'rgba(176, 180, 185, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(201, 204, 207, 0.5)',
                boxShadow: '0 8px 32px rgba(14, 31, 53, 0.1)'
              }}
            >
              <h3 
                className="stat-value text-4xl font-bold mb-2" 
                data-value="10500"
                style={{
                  color: '#00A9E0',
                  textShadow: '0 0 8px rgba(0, 169, 224, 0.3)'
                }}
              >
                0
              </h3>
              <p
                style={{
                  color: '#515969'
                }}
              >
                EAs Generated
              </p>
            </div>
            
            <div 
              className="p-6 rounded-lg text-center"
              style={{
                backgroundColor: 'rgba(176, 180, 185, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(201, 204, 207, 0.5)',
                boxShadow: '0 8px 32px rgba(14, 31, 53, 0.1)'
              }}
            >
              <h3 
                className="stat-value text-4xl font-bold mb-2" 
                data-value="5000"
                style={{
                  color: '#00A9E0',
                  textShadow: '0 0 8px rgba(0, 169, 224, 0.3)'
                }}
              >
                0
              </h3>
              <p
                style={{
                  color: '#515969'
                }}
              >
                Active Traders
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 relative">
        <div 
          className="absolute top-0 left-0 w-full h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(0, 169, 224, 0.7), transparent)',
            boxShadow: '0 0 8px rgba(0, 169, 224, 0.5)'
          }}
        />
        
        <div className="container mx-auto px-4">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{ 
              color: '#00A9E0',
              textShadow: '0 0 8px rgba(0, 169, 224, 0.3)'
            }}
          >
            What Traders Are Saying
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="relative p-6 rounded-lg transition-all duration-300 hover:transform hover:scale-105"
                style={{
                  backgroundColor: 'rgba(176, 180, 185, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(201, 204, 207, 0.5)',
                  boxShadow: '0 8px 32px rgba(14, 31, 53, 0.1)'
                }}
              >
                {/* Quote mark */}
                <div 
                  className="absolute -top-4 -left-2 text-5xl opacity-20"
                  style={{
                    color: '#00A9E0'
                  }}
                >
                  "
                </div>
                
                <div className="text-center pt-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                    style={{
                      border: '2px solid rgba(0, 169, 224, 0.7)',
                      boxShadow: '0 0 10px rgba(0, 169, 224, 0.5)'
                    }}
                  />
                  
                  <p 
                    className="mb-4 italic"
                    style={{
                      color: '#515969'
                    }}
                  >
                    "{testimonial.quote}"
                  </p>
                  
                  <h4 
                    className="font-semibold"
                    style={{
                      color: '#00A9E0',
                      textShadow: '0 0 5px rgba(0, 169, 224, 0.3)'
                    }}
                  >
                    {testimonial.name}
                  </h4>
                  
                  <p
                    className="text-sm"
                    style={{
                      color: '#515969'
                    }}
                  >
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
        <div 
          className="absolute top-0 left-0 w-full h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(0, 169, 224, 0.7), transparent)',
            boxShadow: '0 0 8px rgba(0, 169, 224, 0.5)'
          }}
        />
        
        <div 
          className="container mx-auto px-4 py-16 rounded-2xl"
          style={{
            backgroundColor: 'rgba(176, 180, 185, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(201, 204, 207, 0.5)',
            boxShadow: '0 8px 32px rgba(14, 31, 53, 0.1)'
          }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6"
              style={{ 
                color: '#00A9E0',
                textShadow: '0 0 8px rgba(0, 169, 224, 0.3)'
              }}
            >
              Ready to Transform Your Trading?
            </h2>
            
            <p 
              className="text-xl mb-8"
              style={{ 
                color: '#515969'
              }}
            >
              Join thousands of traders who are already leveraging AI to gain a competitive edge in the markets.
            </p>
            
            {!user ? (
              <Link 
                to="/register" 
                className="relative px-10 py-4 rounded-lg text-center text-lg font-medium overflow-hidden group"
                style={{
                  background: 'linear-gradient(90deg, #00ACC1 0%, #00E5FF 100%)',
                  boxShadow: '0 0 20px rgba(0, 229, 255, 0.4), 0 0 40px rgba(0, 229, 255, 0.2)',
                  border: '1px solid rgba(0, 229, 255, 0.7)',
                  color: '#004d66',
                  fontWeight: 'bold'
                }}
              >
                <span className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rotate-45 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-15 transition-all group-hover:translate-x-full duration-700"></span>
                Start Analyzing Now
              </Link>
            ) : (
              <Link 
                to="/ai-chat" 
                className="relative px-10 py-4 rounded-lg text-center text-lg font-medium overflow-hidden group"
                style={{
                  background: 'linear-gradient(90deg, #00ACC1 0%, #00E5FF 100%)',
                  boxShadow: '0 0 20px rgba(0, 229, 255, 0.4), 0 0 40px rgba(0, 229, 255, 0.2)',
                  border: '1px solid rgba(0, 229, 255, 0.7)',
                  color: '#004d66',
                  fontWeight: 'bold'
                }}
              >
                <span className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rotate-45 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-15 transition-all group-hover:translate-x-full duration-700"></span>
                Start Analyzing Now
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
