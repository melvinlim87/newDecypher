import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { MarketTicker } from './MarketTicker';
import 'swiper/css';

interface MarketTickerSliderProps {
  category: string;
}

export const MarketTickerSlider: React.FC<MarketTickerSliderProps> = ({ category }) => {
  const getTickerSymbols = () => {
    switch (category) {
      case 'forex':
        return [
          'FX:EURUSD',
          'FX:GBPUSD',
          'FX:USDJPY',
          'FX:AUDUSD',
          'FX:USDCAD',
          'NCDEX:GOLD'
        ];
      case 'indexes':
        return [
          'FOREXCOM:DJI',
          'FOREXCOM:NAS100',
          'FOREXCOM:NDAQ',
          'FOREXCOM:SPX500',
          'FOREXCOM:UK100',
          'FOREXCOM:HK50'
        ];
      case 'cfds':
        return [
          'OANDA:SPY',
          'OANDA:QQQ',
          'OANDA:AAPL',
          'OANDA:MSFT',
          'OANDA:GOOGL',
          'OANDA:TSLA'
        ];
      default:
        return [
          'FOREXCOM:DJI',
          'FOREXCOM:NAS100',
          'FOREXCOM:SPX500',
          'FX:EURUSD',
          'FX:GBPUSD',
          'NCDEX:GOLD'
        ];
    }
  };

  return (
    <div className="w-full">
      <Swiper
        modules={[Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }}
        className="market-ticker-slider"
      >
        {getTickerSymbols().map((symbol) => (
          <SwiperSlide key={symbol}>
            <MarketTicker symbol={symbol} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
