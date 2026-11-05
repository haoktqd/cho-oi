import React, { useEffect, useState } from 'react';
import { GameSaveState, MarketLocationId } from '../../types';
import { PLAYER_RANKS } from '../../economy/catalog';
import { sound } from '../../audio/soundSystem';
import { firebaseService, AuthUser, FirebaseClientConfig } from '../../services/firebase';
import { gameManager } from '../../state/gameState';

interface TopBarProps {
  state: GameSaveState;
  onTravel: (loc: MarketLocationId) => void;
  onSetSpeed: (speed: number) => void;
  onOpenSandbox: () => void;
}

export function TopBar({ state, onTravel, onSetSpeed, onOpenSandbox }: TopBarProps) {
  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [authUser, setAuthUser] = useState<AuthUser | null>(firebaseService.currentUser);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'idle' | 'error'>(gameManager.cloudSyncStatus);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showConfigForm, setShowConfigForm] = useState<boolean>(false);
  const [loginMessage, setLoginMessage] = useState<string>('');

  // Firebase config form state
  const [customApiKey, setCustomApiKey] = useState('');
  const [customAuthDomain, setCustomAuthDomain] = useState('');
  const [customProjectId, setCustomProjectId] = useState('');
  const [customAppId, setCustomAppId] = useState('');

  const rank = PLAYER_RANKS.find((r) => r.level === state.playerRankLevel) || PLAYER_RANKS[0];
  const isWholesale = state.currentLocation === 'wholesale_market';

  useEffect(() => {
    const unsubAuth = firebaseService.subscribeAuth((user) => {
      setAuthUser(user);
    });
    const unsubSync = gameManager.subscribeSyncStatus((status) => {
      setSyncStatus(status);
    });
    return () => {
      unsubAuth();
      unsubSync();
    };
  }, []);

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getTimePeriod = (h: number) => {
    if (h >= 5 && h <= 9) return 'Sáng sớm';
    if (h >= 10 && h <= 12) return 'Trưa';
    if (h >= 13 && h <= 17) return 'Chiều';
    if (h >= 18 && h <= 21) return 'Chập tối';
    return 'Đêm muộn';
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleGoogleLogin = async () => {
    setLoginMessage('Đang kết nối Google...');
    const res = await firebaseService.loginWithGoogle();
    if (!res.success) {
      setLoginMessage(res.message || 'Không thể đăng nhập');
    } else {
      setShowAuthModal(false);
      sound.playSuccessFanfare();
    }
  };

  const handleDemoLogin = () => {
    firebaseService.loginDemoGoogle();
    setShowAuthModal(false);
    sound.playSuccessFanfare();
  };

  const handleLogout = async () => {
    await firebaseService.logout();
    setShowAuthModal(false);
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customApiKey || !customProjectId) {
      alert('Vui lòng nhập ít nhất API Key và Project ID!');
      return;
    }
    const cfg: FirebaseClientConfig = {
      apiKey: customApiKey,
      authDomain: customAuthDomain || `${customProjectId}.firebaseapp.com`,
      projectId: customProjectId,
      appId: customAppId || '1:123456789:web:abcdef',
    };
    firebaseService.saveConfig(cfg);
    alert('Đã lưu cấu hình Firebase! Bây giờ bạn có thể đăng nhập Google thật.');
    setShowConfigForm(false);
  };

  return (
    <>
      <header className="topbar-container">
        {/* Brand & Market Identity */}
        <div className="brand-section">
          <div className="brand-icon">🧺</div>
          <div>
            <div className="brand-title">
              <strong>CHỢ ƠI!</strong>
              <span className="brand-badge">Bản Mới 2.0</span>
            </div>
            <span className="brand-tagline">Mô phỏng Kinh doanh & Thị trường Chợ Việt</span>
          </div>
        </div>

        {/* Location Switcher */}
        <div className="location-switcher">
          <button
            className={`loc-btn ${!isWholesale ? 'active' : ''}`}
            onClick={() => onTravel('local_market')}
            title="Chợ Dân Sinh: Giá bán lẻ cao, khách đông"
          >
            <span>🏘️</span> Chợ Dân Sinh
          </button>
          <button
            className={`loc-btn ${isWholesale ? 'active' : ''}`}
            onClick={() => onTravel('wholesale_market')}
            title="Chợ Đầu Mối: Mua sỉ giá gốc, số lượng lớn"
          >
            <span>🚛</span> Chợ Đầu Mối
          </button>
        </div>

        {/* Clock & Weather */}
        <div className="clock-weather-pill">
          <span className="weather-emoji">
            {state.clock.weather === 'rainy' ? '🌧️' : state.clock.weather === 'cloudy' ? '⛅' : '☀️'}
          </span>
          <div className="clock-text">
            <strong>Ngày {state.clock.day} · {formatTime(state.clock.hour, state.clock.minute)}</strong>
            <small>{getTimePeriod(state.clock.hour)} · {state.clock.weather === 'rainy' ? 'Mưa giông' : 'Trời đẹp'}</small>
          </div>
        </div>

        {/* Wealth & Rank Indicators */}
        <div className="stats-cluster">
          {/* Cash */}
          <div className="stat-card cash-card" title="Tiền mặt sẵn sàng mua hàng">
            <span className="stat-label">Tiền mặt</span>
            <div className="stat-val">
              <span className="coin-icon">🪙</span>
              <strong>{state.cash.toLocaleString('vi-VN')}</strong> <small>xu</small>
            </div>
          </div>

          {/* Rank */}
          <div className="stat-card rank-card" title={`Cấp ${rank.level}: ${rank.title}`}>
            <span className="stat-label">Cấp bậc thương nhân</span>
            <div className="stat-val">
              <span className="rank-star">⭐</span>
              <strong className="rank-title">{rank.title}</strong>
            </div>
          </div>
        </div>

        {/* Google Account & Cloud Save Button */}
        <div className="auth-account-section">
          {authUser ? (
            <button
              className="user-profile-pill"
              onClick={() => setShowAuthModal(true)}
              title="Tài khoản đang liên kết & lưu trên đám mây"
            >
              <img
                src={authUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=trader'}
                alt="Avatar"
                className="user-avatar-img"
              />
              <div className="user-info-text">
                <strong>{authUser.displayName || 'Thương Nhân'}</strong>
                <span className={`sync-status-badge ${syncStatus}`}>
                  {syncStatus === 'synced' && '☁️ Đã lưu cloud'}
                  {syncStatus === 'syncing' && '⏳ Đang lưu...'}
                  {syncStatus === 'error' && '⚠️ Lỗi lưu'}
                  {syncStatus === 'idle' && '☁️ Sẵn sàng'}
                </span>
              </div>
            </button>
          ) : (
            <button
              className="google-login-btn"
              onClick={() => setShowAuthModal(true)}
              title="Đăng nhập tài khoản Gmail để lưu tiến trình lên đám mây"
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Lưu Gmail</span>
            </button>
          )}
        </div>

        {/* Simulation Speed Controls & Sandbox */}
        <div className="sim-speed-controls">
          <button
            className={`speed-btn ${state.clock.tickSpeed === 0 ? 'active' : ''}`}
            onClick={() => onSetSpeed(0)}
            title="Tạm dừng thời gian"
          >
            ⏸
          </button>
          <button
            className={`speed-btn ${state.clock.tickSpeed === 1 ? 'active' : ''}`}
            onClick={() => onSetSpeed(1)}
            title="Tốc độ 1x"
          >
            1x
          </button>
          <button
            className={`speed-btn ${state.clock.tickSpeed === 5 ? 'active' : ''}`}
            onClick={() => onSetSpeed(5)}
            title="Tốc độ 5x"
          >
            5x
          </button>
          <button
            className="sandbox-btn"
            onClick={onOpenSandbox}
            title="Phòng thử nghiệm kinh tế (Chạy mô phỏng 7-30 ngày)"
          >
            🧪 Sandbox
          </button>
          <button className="sound-btn" onClick={toggleSound} title="Bật/Tắt âm thanh">
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Account & Google Sign-In Modal */}
      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="modal-card auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="auth-header-title">
                <span className="auth-icon-large">☁️</span>
                <div>
                  <h3>Đăng Nhập Gmail & Lưu Đám Mây</h3>
                  <span className="subtitle">Đồng bộ dữ liệu an toàn trên mọi máy tính và điện thoại</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowAuthModal(false)}>✕</button>
            </div>

            <div className="auth-modal-body">
              {authUser ? (
                <div className="logged-in-profile">
                  <img
                    src={authUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=trader'}
                    alt="Avatar"
                    className="modal-avatar-lg"
                  />
                  <h4>{authUser.displayName}</h4>
                  <p className="user-email">{authUser.email}</p>
                  {authUser.isDemo && (
                    <span className="demo-badge">Tài Khoản Dùng Thử (Demo Mode)</span>
                  )}

                  <div className="sync-info-box">
                    <span>Trạng thái Cloud Save:</span>
                    <strong>✓ Tự động đồng bộ mỗi khi giao dịch hoặc thoát game</strong>
                  </div>

                  <div className="auth-modal-actions">
                    <button
                      className="btn-sync-now"
                      onClick={() => gameManager.triggerCloudSave(true)}
                    >
                      🔄 Đồng Bộ Đám Mây Ngay
                    </button>
                    <button className="btn-logout" onClick={handleLogout}>
                      Đăng Xuất
                    </button>
                  </div>
                </div>
              ) : (
                <div className="login-options-block">
                  <p className="login-intro">
                    Đăng nhập tài khoản Google để lưu lại toàn bộ ví tiền, sạp hàng và kho nông sản của bạn trên đám mây.
                  </p>

                  {/* Primary Google Login Button */}
                  <button className="btn-google-sign-in" onClick={handleGoogleLogin}>
                    <svg className="google-icon-large" viewBox="0 0 24 24" width="22" height="22">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Tiếp tục với Google (Gmail)</span>
                  </button>

                  {/* Demo test login */}
                  <div className="demo-login-row">
                    <span className="or-divider">hoặc</span>
                    <button className="btn-demo-login" onClick={handleDemoLogin}>
                      ⚡ Trải Nghiệm Thử Bản Demo (Không Cần Cài Đặt)
                    </button>
                  </div>

                  {loginMessage && <div className="login-error-alert">{loginMessage}</div>}

                  {/* Advanced Firebase Config Toggle */}
                  <div className="firebase-config-toggle">
                    <button
                      className="btn-toggle-config"
                      onClick={() => setShowConfigForm(!showConfigForm)}
                    >
                      ⚙️ {showConfigForm ? 'Ẩn Cấu Hình Firebase' : 'Tùy Chỉnh Mã Firebase (Dành cho Chủ Web)'}
                    </button>
                  </div>

                  {showConfigForm && (
                    <form className="firebase-form" onSubmit={handleSaveFirebaseConfig}>
                      <span className="config-form-tip">
                        Điền thông tin từ <em>Firebase Console → Project Settings</em> nếu bạn triển khai web riêng:
                      </span>
                      <input
                        type="text"
                        placeholder="VITE_FIREBASE_API_KEY (ví dụ: AIzaSy...)"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="VITE_FIREBASE_PROJECT_ID (ví dụ: cho-oi-game)"
                        value={customProjectId}
                        onChange={(e) => setCustomProjectId(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="VITE_FIREBASE_AUTH_DOMAIN (tùy chọn)"
                        value={customAuthDomain}
                        onChange={(e) => setCustomAuthDomain(e.target.value)}
                      />
                      <button type="submit" className="btn-save-config">
                        Lưu Cấu Hình Firebase
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
