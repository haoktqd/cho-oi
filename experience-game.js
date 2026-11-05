import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:5173';

async function main() {
  console.log('🚀 Launching Chrome to experience CHỢ ƠI!...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900', '--use-gl=swiftshader'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // Capture console logs from browser
  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`[Browser Console]: ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    console.error(`[Browser PageError]: ${err.toString()}`);
  });

  console.log(`📡 Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait 3 seconds for 3D world to render
  console.log('⏳ Waiting for 3D canvas and HUD to load...');
  await new Promise((r) => setTimeout(r, 3000));

  // Take screenshot 1: 3D Market World
  console.log('📸 Taking Screenshot 1: 3D Market World View...');
  await page.screenshot({ path: 'test-1-market-world.png' });

  // Test Click-to-Move: Click on the ground near center
  console.log('🖱️ Testing Click-to-Move by clicking on market lane...');
  await page.mouse.click(720, 520);
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: 'test-2-after-move.png' });

  // Test Tab 2: Bảng Giá (Market Dashboard)
  console.log('📊 Switching to Tab 2: Bảng Giá Thị Trường...');
  await page.keyboard.press('2');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: 'test-3-market-dashboard.png' });

  // Test Buying Goods: Click "Mua vào" on Tomato
  console.log('🍅 Testing Buy Modal for Tomato...');
  const buyBtn = await page.$('.btn-buy');
  if (buyBtn) {
    await buyBtn.click();
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: 'test-4-trading-terminal.png' });

    // Confirm buy
    console.log('🛒 Confirming Buy 1 unit...');
    const confirmBuy = await page.$('.btn-confirm-buy');
    if (confirmBuy) {
      await confirmBuy.click();
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Test Tab 3: Kho Hàng (Inventory)
  console.log('🧺 Switching to Tab 3: Kho Hàng & Lô FIFO...');
  await page.keyboard.press('3');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: 'test-5-inventory.png' });

  // Test Tab 4: Tài Chính (Finance Dashboard)
  console.log('💰 Switching to Tab 4: Tài Chính & Sổ Cái...');
  await page.keyboard.press('4');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: 'test-6-finance.png' });

  // Test Tab 6: Bếp Ẩm Thực (Kitchen) & Cooking
  console.log('🍲 Switching to Tab 6: Bếp Ẩm Thực...');
  await page.keyboard.press('6');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: 'test-7-kitchen.png' });

  // Test Sandbox Modal: Open and run 7 days simulation
  console.log('🧪 Opening Sandbox Modal...');
  const sandboxBtn = await page.$('.sandbox-btn');
  if (sandboxBtn) {
    await sandboxBtn.click();
    await new Promise((r) => setTimeout(r, 800));
    console.log('🚀 Running 7-day headless simulation inside modal...');
    const runSimBtn = await page.$('.btn-run-sim');
    if (runSimBtn) {
      await runSimBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({ path: 'test-8-sandbox-result.png' });
    }
  }

  console.log('🎉 Experience tour completed successfully!');
  await browser.close();

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`Total console logs captured: ${consoleLogs.length}`);
  const errors = consoleLogs.filter((l) => l.startsWith('[error]'));
  console.log(`Console Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
