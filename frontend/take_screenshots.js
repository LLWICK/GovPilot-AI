const puppeteer = require("puppeteer");
const path = require("path");

async function run() {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000); // Allow up to 60s for dev server compilation on cold starts
  const artifactDir = "C:\\Users\\sanus\\.gemini\\antigravity\\brain\\a6b2af0d-517f-43de-9e22-7de9b540b2f0";

  // 1. Landing Page (Desktop)
  console.log("Loading landing page (desktop)...");
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000", { waitUntil: "load" });
  await page.waitForSelector("h1", { timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000)); // wait for client-side hydration
  await page.screenshot({ path: path.join(artifactDir, "1_landing_desktop.png") });
  console.log("Captured: 1_landing_desktop.png");

  // 2. Landing Page (Mobile)
  console.log("Setting viewport to mobile (375px)...");
  await page.setViewport({ width: 375, height: 812 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(artifactDir, "2_landing_mobile.png") });
  console.log("Captured: 2_landing_mobile.png");

  // Navigate to Login page
  console.log("Navigating to Login page...");
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000/login", { waitUntil: "load" });
  await page.waitForSelector("#email", { timeout: 30000 });
  await page.screenshot({ path: path.join(artifactDir, "3_login.png") });
  console.log("Captured: 3_login.png");

  // Enter login credentials
  console.log("Submitting login form...");
  await page.type("#email", "citizen@gov.lk");
  await page.type("#password", "password123");
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForNavigation({ waitUntil: "load" });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(artifactDir, "4_dashboard.png") });
  console.log("Captured: 4_dashboard.png");

  // Start new passport renewal session
  console.log("Initializing new passport renewal session...");
  await page.goto("http://localhost:3000/chat/new?serviceId=passport-renewal", { waitUntil: "load" });
  
  // Wait for redirect to chat room
  await page.waitForSelector("textarea", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(artifactDir, "5_chat_initial.png") });
  console.log("Captured: 5_chat_initial.png");

  // Parse sessionId
  const currentUrl = page.url();
  const sessionId = currentUrl.split("/").pop();
  console.log("Created Chat Session ID:", sessionId);

  // Navigate to Documents Upload Page
  console.log("Navigating to document upload portal...");
  await page.goto(`http://localhost:3000/documents/${sessionId}`, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(artifactDir, "6_documents_upload.png") });
  console.log("Captured: 6_documents_upload.png");

  // Wait for background OCR status simulation to automatically verify NIC & Birth Certificate
  console.log("Waiting 8 seconds for simulated OCR validation...");
  await new Promise(r => setTimeout(r, 8000));

  // Navigate back to the chat room
  console.log("Returning to Chat session...");
  await page.goto(`http://localhost:3000/chat/${sessionId}`, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(artifactDir, "7_chat_confirmation.png") });
  console.log("Captured: 7_chat_confirmation.png");

  // Click on "Submit Final Application" inside the ConfirmationCard
  console.log("Clicking final confirmation action button...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const confirmBtn = buttons.find(b => b.textContent.includes("Submit Final Application"));
    if (confirmBtn) {
      confirmBtn.click();
    } else {
      console.error("Could not find Submit Final Application button!");
    }
  });

  // Wait for final agent streamed reply to finish
  console.log("Waiting for final agent reply SSE stream...");
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(artifactDir, "8_chat_completed.png") });
  console.log("Captured: 8_chat_completed.png");

  console.log("Closing browser.");
  await browser.close();
  console.log("Screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
