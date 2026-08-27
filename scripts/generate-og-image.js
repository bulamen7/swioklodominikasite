import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const html = `
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1200px;
  height: 630px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #5c6b5e 0%, #8a9a7b 50%, #c9a96e 100%);
  font-family: 'Georgia', serif;
  color: white;
}
.card {
  text-align: center;
  padding: 3rem;
}
h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
  letter-spacing: -1px;
}
p {
  font-size: 1.8rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}
.subtitle {
  font-size: 1.4rem;
  opacity: 0.75;
  margin-top: 1.5rem;
}
.divider {
  width: 80px;
  height: 3px;
  background: rgba(255,255,255,0.6);
  margin: 1.5rem auto;
}
</style>
</head>
<body>
  <div class="card">
    <h1>Dominika Świokło</h1>
    <div class="divider"></div>
    <p>Fizjoterapia &bull; Integracja Sensoryczna</p>
    <p class="subtitle">Warszawa, ul. Odolańska 10</p>
  </div>
</body>
</html>
`;

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html);
  await page.screenshot({ path: join(__dirname, '..', 'public', 'og-image.jpg'), type: 'jpeg', quality: 90 });
  await browser.close();
  console.log('og-image.jpg generated in public/');
}

generate();
