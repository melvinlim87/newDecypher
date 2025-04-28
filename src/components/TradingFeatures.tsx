import React, { useEffect, useRef } from 'react';
import { FaChartLine, FaRobot, FaCode, FaLock } from 'react-icons/fa';
import { BiAnalyse } from 'react-icons/bi';
import { HiLightningBolt } from 'react-icons/hi';

interface TradingFeatureProps {
  theme: string;
}

export const TradingFeatures: React.FC<TradingFeatureProps> = ({ theme }) => {
  const featureContainerRef = useRef<HTMLDivElement>(null);
  
  // Add floating animation effect
  useEffect(() => {
    const addFloatingAnimation = () => {
      if (!featureContainerRef.current) return;
      
      const cards = featureContainerRef.current.querySelectorAll('.feature-card');
      
      cards.forEach((card, index) => {
        const delay = index * 0.2;
        const element = card as HTMLElement;
        element.style.animation = `floatCard 6s ease-in-out ${delay}s infinite`;
      });
      
      // Add keyframe animation if not already added
      if (!document.getElementById('float-animation')) {
        const style = document.createElement('style');
        style.id = 'float-animation';
        style.innerHTML = `
          @keyframes floatCard {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          
          @keyframes glowPulse {
            0% { box-shadow: 0 5px 15px rgba(0, 169, 224, 0.3); }
            50% { box-shadow: 0 5px 30px rgba(0, 169, 224, 0.6); }
            100% { box-shadow: 0 5px 15px rgba(0, 169, 224, 0.3); }
          }
          
          @keyframes iconPulse {
            0% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(0, 169, 224, 0.5)); }
            50% { transform: scale(1.1); filter: drop-shadow(0 0 10px rgba(0, 169, 224, 0.8)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(0, 169, 224, 0.5)); }
          }
        `;
        document.head.appendChild(style);
      }
    };
    
    addFloatingAnimation();
  }, []);
  
  const features = [
    {
      title: 'AI-Powered Analysis',
      description: 'Leverage cutting-edge artificial intelligence to analyze market patterns and identify trading opportunities with precision.',
      icon: FaRobot,
      delay: 0
    },
    {
      title: 'Real-time Market Insights',
      description: 'Get up-to-the-second market data and expert analysis to make informed trading decisions at the perfect moment.',
      icon: FaChartLine,
      delay: 0.1
    },
    {
      title: 'EA Code Generation',
      description: 'Automatically generate Expert Advisor code based on your trading strategies and parameters.',
      icon: FaCode,
      delay: 0.2
    },
    {
      title: 'Advanced Technical Analysis',
      description: 'Comprehensive technical analysis tools that identify key support/resistance levels, trends, and chart patterns.',
      icon: BiAnalyse,
      delay: 0.3
    },
    {
      title: 'Instant Strategy Backtesting',
      description: 'Test your trading strategies against historical data to validate performance before risking real capital.',
      icon: HiLightningBolt,
      delay: 0.4
    },
    {
      title: 'Secure Trading Environment',
      description: 'Enterprise-grade security to protect your trading data and strategies with end-to-end encryption.',
      icon: FaLock,
      delay: 0.5
    }
  ];
  
  return (
    <div 
      ref={featureContainerRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12"
    >
      {features.map((feature, index) => (
        <div 
          key={index}
          className="feature-card relative bg-opacity-20 p-6 rounded-lg transition-all duration-300 hover:transform hover:scale-105"
          style={{
            backgroundColor: theme === 'silver' ? 'rgba(176, 180, 185, 0.15)' : 'rgba(21, 23, 25, 0.7)',
            backdropFilter: 'blur(10px)',
            border: theme === 'silver' ? '1px solid rgba(201, 204, 207, 0.5)' : '1px solid rgba(44, 49, 55, 0.8)',
            boxShadow: theme === 'silver' ? '0 8px 32px rgba(14, 31, 53, 0.1)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
            animation: `glowPulse 4s ease-in-out ${feature.delay}s infinite`
          }}
        >
          {/* Card accent decorations */}
          <div className="absolute top-0 left-0 w-8 h-1 bg-gradient-to-r from-transparent to-blue-400" />
          <div className="absolute top-0 left-0 w-1 h-8 bg-gradient-to-b from-transparent to-blue-400" />
          
          <div className="mb-4 text-center">
            <div 
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{
                background: theme === 'silver' ? 'rgba(176, 180, 185, 0.3)' : 'rgba(21, 23, 25, 0.5)',
                border: theme === 'silver' ? '1px solid rgba(201, 204, 207, 0.5)' : '1px solid rgba(44, 49, 55, 0.8)',
                animation: `iconPulse 3s ease-in-out ${feature.delay}s infinite`
              }}
            >
              <feature.icon 
                size={24} 
                style={{
                  color: theme === 'silver' ? '#00A9E0' : '#4ADBFF',
                  filter: 'drop-shadow(0 0 5px rgba(0, 169, 224, 0.5))'
                }}
              />
            </div>
            <h3 
              className="text-xl font-semibold mb-2"
              style={{
                color: '#ffffff',
                textShadow: '0 0 5px rgba(0, 169, 224, 0.3)'
              }}
            >
              {feature.title}
            </h3>
          </div>
          <p 
            className="text-center"
            style={{
              color: '#ffffff'
            }}
          >
            {feature.description}
          </p>
          
          {/* Animated highlight effect */}
          <div 
            className="absolute inset-0 rounded-lg opacity-0 hover:opacity-30 transition-opacity duration-700"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 169, 224, 0.3) 0%, transparent 70%)'
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default TradingFeatures;
