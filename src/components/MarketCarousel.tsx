import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { MarketTicker } from './MarketTicker';
import 'swiper/css';
import 'swiper/css/navigation';

interface MarketItem {
  label: string;
  symbol: string;
}

interface MarketCarouselProps {
  items: MarketItem[];
  category: string;
  currentSymbol: string;
}

export const MarketCarousel: React.FC<MarketCarouselProps> = ({ category }) => {
  const getTickerSymbols = () => {
    switch (category) {
      case 'forex':
        return [
          { symbol: 'FX:EURUSD', label: 'EUR/USD' },
          { symbol: 'FX:GBPUSD', label: 'GBP/USD' },
          { symbol: 'FX:USDJPY', label: 'USD/JPY' },
          { symbol: 'FX:AUDUSD', label: 'AUD/USD' },
          { symbol: 'FX:USDCAD', label: 'USD/CAD' },
          { symbol: 'FX:EURJPY', label: 'EUR/JPY' },
          { symbol: 'FX:GBPJPY', label: 'GBP/JPY' },
          { symbol: 'NCDEX:GOLD', label: 'GOLD' }
        ];
      case 'indexes':
        return [
          { symbol: 'FOREXCOM:DJI', label: 'Dow Jones' },
          { symbol: 'FOREXCOM:NAS100', label: 'Nasdaq 100' },
          { symbol: 'FOREXCOM:NDAQ', label: 'Nasdaq' },
          { symbol: 'FOREXCOM:SPX500', label: 'S&P 500' },
          { symbol: 'FOREXCOM:UK100', label: 'FTSE 100' },
          { symbol: 'FOREXCOM:HK50', label: 'Hang Seng' }
        ];
      case 'cfds':
        return [
          { symbol: 'OANDA:SPY', label: 'SPY' },
          { symbol: 'OANDA:QQQ', label: 'QQQ' },
          { symbol: 'OANDA:AAPL', label: 'Apple' },
          { symbol: 'OANDA:MSFT', label: 'Microsoft' },
          { symbol: 'OANDA:GOOGL', label: 'Google' },
          { symbol: 'OANDA:TSLA', label: 'Tesla' }
        ];
      default:
        return [
          { symbol: 'FOREXCOM:DJI', label: 'Dow Jones' },
          { symbol: 'FOREXCOM:NAS100', label: 'Nasdaq 100' },
          { symbol: 'FOREXCOM:SPX500', label: 'S&P 500' },
          { symbol: 'FX:EURUSD', label: 'EUR/USD' },
          { symbol: 'FX:GBPUSD', label: 'GBP/USD' },
          { symbol: 'NCDEX:GOLD', label: 'GOLD' }
        ];
    }
  };

  return (
    <div className="w-full bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50">
      <Swiper
        modules={[Navigation]}
        spaceBetween={20}
        slidesPerView={1}
        navigation={true}
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }}
        className="market-ticker-slider"
      >
        {getTickerSymbols().map((item) => (
          <SwiperSlide key={item.symbol}>
            <MarketTicker symbol={item.symbol} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
