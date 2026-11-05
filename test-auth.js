import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:5173';

async function testAuth() {
  console.log('🚀 Testing Google Sign-in & Cloud Save UI...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900', '--use-gl=swiftshader'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Take screenshot of header with "Lưu Gmail"
  console.log('📸 Screenshot with "Lưu Gmail" button...');
  await page.screenshot({ path: 'test-9-auth-button.png' });

  // Click "Lưu Gmail" button to open modal
  console.log('🖱️ Clicking "Lưu Gmail" button...');
  const loginBtn = await page.$('.google-login-btn');
  if (loginBtn) {
    await loginBtn.click();
    await new Promise((r) => setTimeout(r, 800));
    console.log('📸 Screenshot of Google Login & Cloud Save Modal...');
    await page.screenshot({ path: 'test-10-auth-modal.png' });

    // Test Demo Login
    console.log('⚡ Clicking Demo Login...');
    const demoBtn = await page.$('.btn-demo-login');
    if (demoBtn) {
      await demoBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      console.log('📸 Screenshot after logged in (Avatar & Cloud Synced)...');
      await page.screenshot({ path: 'test-11-logged-in.png' });
    }
  }

  await browser.close();
  console.log('🎉 Auth & Cloud Save verification complete!');
}

testAuth().catch(console.error);
