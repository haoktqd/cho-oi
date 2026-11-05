import { MarketLocationId, NPCProfile, ProductId } from '../types';

export const INITIAL_NPCS: Record<string, NPCProfile> = {
  ba_tu: {
    id: 'ba_tu',
    name: 'Bà Tư',
    title: 'Chủ Sạp Rau Đà Lạt',
    avatar: '👩🏻‍🌾',
    role: 'vendor',
    location: 'local_market',
    specialtyProduct: 'greens',
    budget: 850,
    relationshipScore: 50,
    bargainTendency: 0.65, // Quite friendly and easy to bargain with
    dialoguePool: [
      'Rau sáng nay tươi non mơn mởn con ơi, lấy thêm mớ hành cô bớt cho!',
      'Thời buổi này đi buôn phải chịu khó dậy sớm con à, chim sớm mới bắt được sâu!',
      'Hôm nay trời đẹp, hàng rau của cô đắt khách từ tờ mờ sáng.',
      'Con mua sỉ nhiều thì cô để giá hữu nghị lấy vía may mắn đầu ngày nha!',
    ],
  },
  ba_sau: {
    id: 'ba_sau',
    name: 'Bà Sáu',
    title: 'Bà Trùm Vựa Cá Đồng',
    avatar: '👩🏼‍🍳',
    role: 'supplier',
    location: 'local_market',
    specialtyProduct: 'fish',
    budget: 2500,
    relationshipScore: 40,
    bargainTendency: 0.40, // Tough negotiator
    dialoguePool: [
      'Cá rô đồng quẫy khỏe re đây! Cân mau kẻo hết con ơi.',
      'Cá tươi chuyển từ ghe lúc 4h sáng, mua mà ép giá cô là cô giận đấy nhé!',
      'Mấy quán nhậu chiều nay đặt cá nhiều lắm, giá có thể nhích lên đó.',
      'Buôn cá phải nhanh tay, để quá trưa là rớt giá thê thảm ngay!',
    ],
  },
  chu_ba: {
    id: 'chu_ba',
    name: 'Chú Ba',
    title: 'Chủ Quán Cơm & Trà Đá',
    avatar: '👨🏻‍🦳',
    role: 'consumer',
    location: 'local_market',
    budget: 1200,
    relationshipScore: 60,
    bargainTendency: 0.70,
    dialoguePool: [
      'Uống chén trà nóng rồi ngắm bảng giá con trai, vội gì!',
      'Quán chú trưa nào cũng cần 20kg gạo với chục quả trứng gà. Có hàng ngon thì để cho chú.',
      'Nghe đâu ngoài cảng container đang ùn ứ, giá cà chua mấy ngày tới dễ biến động lắm đó!',
      'Kinh doanh buôn bán quan trọng nhất là chữ Tín và bảo quản hàng cho khéo con à.',
    ],
  },
  bac_bay: {
    id: 'bac_bay',
    name: 'Bác Bảy Đầu Mối',
    title: 'Đại Lý Nông Sản Chợ Đầu Mối',
    avatar: '👴🏻',
    role: 'wholesaler',
    location: 'wholesale_market',
    specialtyProduct: 'rice',
    budget: 25000,
    relationshipScore: 35,
    bargainTendency: 0.50,
    dialoguePool: [
      'Ở chợ đầu mối này, ai có vốn mạnh gom hàng số lượng lớn là người đó làm chủ cuộc chơi!',
      'Gạo ST25 vừa về 5 tấn, mua từ 50 bao trở lên bác chiết khấu thêm cho.',
      'Thời tiết miền Trung đang bão, mấy chú tiểu thương cứ cẩn thận nguồn rau củ nhé.',
      'Bác chỉ làm việc với đối tác sòng phẳng, thanh toán nhanh gọn.',
    ],
  },
  chi_hoa: {
    id: 'chi_hoa',
    name: 'Chị Hoa',
    title: 'Đầu Mối Trứng & Gia Vị',
    avatar: '👱🏻‍♀️',
    role: 'vendor',
    location: 'wholesale_market',
    specialtyProduct: 'egg',
    budget: 6000,
    relationshipScore: 45,
    bargainTendency: 0.60,
    dialoguePool: [
      'Trứng gà ta chuẩn sạch, vỏ dày bảo quản 10 ngày vẫn tươi nguyên.',
      'Hành tím Lý Sơn đang vào vụ thu hoạch, trữ lúc này cuối tuần xả hàng lời to em nhé.',
      'Chị có mối xe thồ quen, cần chở hàng về chợ nội thành thì bảo chị kết nối cho.',
    ],
  },
  anh_hung: {
    id: 'anh_hung',
    name: 'Anh Hùng Ba Gác',
    title: 'Tài Xế Vận Chuyển Chợ',
    avatar: '🧑🏻‍🔧',
    role: 'logistics',
    location: 'wholesale_market',
    budget: 500,
    relationshipScore: 70,
    bargainTendency: 0.80,
    dialoguePool: [
      'Xe ba gác máy êm ru, chở 300kg hàng bon bon từ chợ đầu mối về nội ô chỉ 10 phút!',
      'Hôm nay anh em bốc vác đông đủ, xếp hàng cẩn thận không lo dập nát rau quả đâu sếp.',
      'Đường xá thông thoáng, đi sớm chuyến này là kịp phiên chợ sáng bán giá cao!',
    ],
  },
};

export interface BargainAttemptResult {
  success: boolean;
  discountPercentage: number; // e.g. 0.05 (5%)
  message: string;
  relationshipChange: number;
}

export function attemptBargain(
  npc: NPCProfile,
  playerReputation: number,
  targetQuantity: number
): BargainAttemptResult {
  // Higher relationship and higher reputation improves bargain odds
  const baseScore = npc.relationshipScore * 0.4 + (playerReputation / 2) * 0.3 + npc.bargainTendency * 30;
  const quantityBonus = Math.min(15, targetQuantity * 0.5); // Buying in bulk helps bargain
  const roll = Math.random() * 100;

  if (roll < baseScore + quantityBonus) {
    const discount = Math.min(0.08, Math.max(0.02, (baseScore + quantityBonus) / 1200));
    return {
      success: true,
      discountPercentage: Math.round(discount * 1000) / 1000,
      message: `"${npc.name} mỉm cười gật đầu: 'Thôi được rồi, trông cô/cậu nhanh nhẹn xởi lởi, tôi bớt cho ${(discount * 100).toFixed(1)}% lấy lộc buôn bán nhé!'"`,
      relationshipChange: 2,
    };
  } else {
    return {
      success: false,
      discountPercentage: 0,
      message: `"${npc.name} lắc đầu xua tay: 'Giá này sát sàn sạt rồi con ơi, bớt nữa là lỗ tiền xăng xe bốc vác của người ta!'"`,
      relationshipChange: -1,
    };
  }
}
