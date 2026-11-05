import { CommercialContract, ProductId } from '../types';

export const CONTRACT_TEMPLATES: Array<Omit<CommercialContract, 'id' | 'deadlineDay' | 'deadlineHour' | 'completed' | 'accepted' | 'expired'>> = [
  {
    clientName: 'Nhà Hàng Cơm Niêu Sài Gòn',
    clientRole: 'Chuỗi Ẩm Thực Cao Cấp',
    productId: 'rice',
    requiredQuantity: 35,
    rewardCoins: 420,
    bonusReputation: 45,
  },
  {
    clientName: 'Quán Phở Bò Bác Bảy',
    clientRole: 'Quán Phở Gia Truyền',
    productId: 'onion',
    requiredQuantity: 25,
    rewardCoins: 260,
    bonusReputation: 30,
  },
  {
    clientName: 'Bếp Ăn Trường Mầm Non Sen Hồng',
    clientRole: 'Cơ Sở Giáo Dục',
    productId: 'egg',
    requiredQuantity: 50,
    rewardCoins: 240,
    bonusReputation: 40,
  },
  {
    clientName: 'Quán Nhậu Hải Sản Đồng Quê',
    clientRole: 'Nhà Hàng Ẩm Thực',
    productId: 'fish',
    requiredQuantity: 20,
    rewardCoins: 380,
    bonusReputation: 50,
  },
  {
    clientName: 'Chuỗi Siêu Thị Tiện Lợi Co.op',
    clientRole: 'Đại Siêu Thị',
    productId: 'tomato',
    requiredQuantity: 40,
    rewardCoins: 310,
    bonusReputation: 35,
  },
  {
    clientName: 'Quán Cơm Văn Phòng Chợ Cũ',
    clientRole: 'Quán Ăn Bình Dân',
    productId: 'greens',
    requiredQuantity: 45,
    rewardCoins: 280,
    bonusReputation: 25,
  },
];

export function generateContract(currentDay: number, currentHour: number): CommercialContract {
  const template = CONTRACT_TEMPLATES[Math.floor(Math.random() * CONTRACT_TEMPLATES.length)];
  const durationHours = 24 + Math.floor(Math.random() * 24); // 24 to 48 hours to complete
  const totalHours = currentDay * 24 + currentHour + durationHours;
  
  return {
    ...template,
    id: `contract_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    deadlineDay: Math.floor(totalHours / 24),
    deadlineHour: totalHours % 24,
    completed: false,
    accepted: false,
    expired: false,
  };
}
