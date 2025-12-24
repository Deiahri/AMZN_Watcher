import { chromium, devices } from "playwright";
import playsound from "play-sound";
import path from "path";
import readline from "readline";

const players: any = "ffplay";
const player = playsound({
  players: [players],
});

const audioPath = path.join(__dirname, "/audio");

console.log(audioPath);

const playSound = (sound: string) => {
  player.play(
    `${audioPath}/${sound}`,
    {
      [players]: ["-nodisp", "-autoexit"],
    },
    (err) => {
      if (err) console.error("Playback failed:", err);
    }
  );
};

// (async () => {
//   // Setup
//   const browser = await chromium.launch({ headless: true });
//   const context = await browser.newContext(devices['iPhone 11']);
//   const page = await context.newPage();

//   console.log('launching');

//   // The actual interesting bit
//   await context.route('**.jpg', route => route.abort());
//   await page.goto('https://example.com/');

//   assert(await page.title() === 'Example Domain'); // 👎 not a Web First assertion

//   console.log('closing');
//   // Teardown
//   await context.close();
//   await browser.close();
// })();

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

(async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const zipcode: string = await new Promise((resolve) => {
    rl.question("Enter zipcode: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  await page.goto(
    `https://hiring.amazon.com/app#/jobSearch?query=&postal=${zipcode}&locale=en-US`
  );
  // initial setup time
  await sleep(5000);

  const func = async () => {
    try {
      const humanVerification = page.getByText("you are human");

      if (!(await humanVerification.isVisible())) {
        throw new Error();
      }

      const alertInterval = setInterval(() => {
        playSound("bruh.mp3");
        console.log("Human verification required");
      }, 10000);
      await page.bringToFront();

      const jobThing = page.getByText(/jobs found/);
      while (!jobThing) {
        sleep(1000);
        console.log("waiting...");
      }
      clearInterval(alertInterval);
      console.log("Human Verification Complete\n\n====================");
    } catch {}

    try {
      const jobThing = page.getByText(/jobs found/);

      const text = await jobThing.innerText({ timeout: 5000 });
      const num = Number(text.split(" ")[1]);

      if (isNaN(num)) {
        func();
        return;
      }

      if (num != 0) {
        console.log("Found Job!\n\nJob Count: " + num);
        await page.bringToFront();
        playSound("ping.mp3");
        await sleep(20000);
      }

      // try {
      //   console.log(await jobThing.innerText({ timeout: 5000 }));
      // } catch (e) {
      //   console.log('failed '+(e as Error).message);
      // }
    } catch (e) {}
    await sleep(15000);
    await page.reload();
    func();
  };

  func();

  page.on("close", () => {
    browser.close();
  });
  // await browser.close();
})();
