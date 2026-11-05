import { MarketEvent, MarketLocationId, ProductId, WeatherType } from '../types';

export const EVENT_TEMPLATES: Array<Omit<MarketEvent, 'id' | 'startDay' | 'startHour' | 'active'>> = [
  {
    title: 'Mưa Giông Ngập Lụt Miền Tây',
    description: 'Nước dâng cao gây khó khăn cho việc đánh bắt cá và vận chuyển rau củ. Nguồn cung tại chỗ sụt giảm nghiêm trọng.',
    type: 'HEAVY_RAIN',
    affectedProducts: ['fish', 'greens'],
    affectedLocations: ['local_market', 'wholesale_market'],
    supplyMultiplier: 0.55,
    demandMultiplier: 1.15,
    priceMultiplier: 1.35,
    durationHours: 14,
    severity: 'high',
    reliability: 1.0,
    isRumor: false,
  },
  {
    title: 'Đoàn Xe Rau Đà Lạt Cập Chợ Đầu Mối',
    description: 'Hàng chục xe tải chở cà chua và rau cải tươi đổ về chợ sáng nay. Hàng ngập sạp, các chủ vựa đua nhau đại hạ giá gom vốn!',
    type: 'NEW_SHIPMENT',
    affectedProducts: ['tomato', 'greens'],
    affectedLocations: ['wholesale_market'],
    supplyMultiplier: 1.85,
    demandMultiplier: 0.95,
    priceMultiplier: 0.72,
    durationHours: 18,
    severity: 'medium',
    reliability: 1.0,
    isRumor: false,
  },
  {
    title: 'Lễ Hội Ẩm Thực Phố Chợ & Ngày Rằm',
    description: 'Người dân đổ xô đi chợ chuẩn bị mâm cơm cúng và ăn chay. Sức mua rau muống, nấm, củ quả tươi và gạo thơm tăng vọt!',
    type: 'HOLIDAY_DEMAND',
    affectedProducts: ['greens', 'rice', 'onion'],
    affectedLocations: ['local_market'],
    supplyMultiplier: 0.95,
    demandMultiplier: 1.75,
    priceMultiplier: 1.40,
    durationHours: 24,
    severity: 'high',
    reliability: 0.95,
    isRumor: false,
  },
  {
    title: 'Tin Đồn Đứt Cáp Vận Tải Nông Sản',
    description: 'Giới lái xe kháo nhau đường đèo sạt lở tạm ngừng lưu thông. Nhiều sạp bắt đầu rục rịch gom hàng đầu cơ tích trữ.',
    type: 'SCARCITY_RUMOR',
    affectedProducts: ['onion', 'rice', 'tomato'],
    affectedLocations: ['local_market', 'wholesale_market'],
    supplyMultiplier: 0.8,
    demandMultiplier: 1.4,
    priceMultiplier: 1.25,
    durationHours: 10,
    severity: 'medium',
    reliability: 0.65,
    isRumor: true,
  },
  {
    title: 'Đại Chiến Xả Hàng Cắt Lỗ Giữa Các Sạp',
    description: 'Hai vựa buôn lớn ở chợ đầu mối đang cạnh tranh gay gắt, hạ giá bán trứng gà và củ hành để giành giật khách mối.',
    type: 'PRICE_WAR',
    affectedProducts: ['egg', 'onion'],
    affectedLocations: ['wholesale_market', 'local_market'],
    supplyMultiplier: 1.3,
    demandMultiplier: 1.2,
    priceMultiplier: 0.75,
    durationHours: 12,
    severity: 'medium',
    reliability: 0.9,
    isRumor: false,
  },
  {
    title: 'Trời Nồm Oi Bức – Cảnh Báo Hàng Hỏng',
    description: 'Độ ẩm không khí tăng cao và nhiệt độ oi ả khiến cá tươi và rau củ xuống màu rất nhanh nếu để ngoài sạp thường.',
    type: 'SPOILAGE_WAVE',
    affectedProducts: ['fish', 'greens', 'tomato'],
    affectedLocations: ['local_market', 'wholesale_market'],
    supplyMultiplier: 0.85,
    demandMultiplier: 0.9,
    priceMultiplier: 1.1,
    durationHours: 16,
    severity: 'critical',
    reliability: 1.0,
    isRumor: false,
  },
];

export function createRandomMarketEvent(day: number, hour: number): MarketEvent {
  const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  return {
    ...template,
    id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    startDay: day,
    startHour: hour,
    active: true,
  };
}

export function determineWeatherFromEvents(activeEvents: MarketEvent[], hour: number): WeatherType {
  const hasRainEvent = activeEvents.some((e) => e.active && e.type === 'HEAVY_RAIN');
  if (hasRainEvent) return 'rainy';
  const hasSpoilage = activeEvents.some((e) => e.active && e.type === 'SPOILAGE_WAVE');
  if (hasSpoilage) return 'cloudy';
  if (hour >= 6 && hour <= 17) return 'sunny';
  return 'cloudy';
}
