import puppeteer from 'puppeteer';
import chalk from 'chalk';
import figlet from 'figlet';
import readline from 'readline';

const utils = {
    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

    displayBanner: () => {
        console.clear();
        console.log(
            chalk.green(
                figlet.textSync('Leo', { horizontalLayout: 'full' })
            )
        );
        console.log(chalk.blueBright("Instagram Unfollow Script"));
        console.log(chalk.yellow("Developed by Leo | discord.gg/pK86qbNHZq | github.com/Gol-D-Leo"));
        console.log();
    },

    askInput: (promptMessage) => {
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            rl.question(chalk.cyan(promptMessage), (input) => {
                rl.close();
                resolve(input.trim());
            });
        });
    },

    waitForEnter: () => {
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            console.log(chalk.green("Press Enter to start the process."));
            rl.on('line', () => {
                rl.close();
                resolve();
            });
        });
    },

    scrollToLoad: async (page) => {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await utils.delay(3000);
    },

    clickButton: async (page, buttonSelector, buttonText) => {
        return await page.evaluate((selector, text) => {
            const buttons = Array.from(document.querySelectorAll(selector));
            const button = buttons.find((btn) => btn.innerText === text);
            if (button) {
                button.click();
                return true;
            }
            return false;
        }, buttonSelector, buttonText);
    },
};

const unfollowProcess = async (page) => {
    let accountsUnfollowed = 0;

    while (true) {
        try {
            const unfollowIndices = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button'))
                    .map((button, index) => (button.innerText === 'Following' ? index : -1))
                    .filter((index) => index !== -1);
            });

            if (unfollowIndices.length === 0) {
                console.log(chalk.yellow("No more accounts to unfollow. Process complete!"));
                break;
            }

            console.log(chalk.blueBright(`Found ${unfollowIndices.length} accounts to process.`));

            for (let index of unfollowIndices) {
                try {
                    const unfollowed = await utils.clickButton(page, 'button', 'Following');
                    if (!unfollowed) {
                        console.log(chalk.red("❌ Failed to unfollow. Skipping."));
                        continue;
                    }

                    await utils.delay(2000);

                    const confirmed = await utils.clickButton(page, 'button', 'Unfollow');
                    if (!confirmed) {
                        console.log(chalk.red("❌ Failed to confirm unfollow. Skipping."));
                        continue;
                    }

                    await utils.delay(3000);
                    accountsUnfollowed++;
                    console.log(chalk.green(`✅ Unfollowed successfully. Total: ${accountsUnfollowed}`));
                } catch (err) {
                    console.log(chalk.red(`Error unfollowing: ${err.message}`));
                }
            }

            console.log(chalk.magenta("Loading more accounts..."));
            await utils.scrollToLoad(page);
        } catch (err) {
            console.error(chalk.red(`Error during process: ${err.message}`));
            break;
        }
    }

    console.log(chalk.green("🎉 All accounts have been unfollowed successfully!"));
};

(async () => {
    utils.displayBanner();

    const username = await utils.askInput("Please enter your Instagram username: ");
    const followingUrl = `https://www.instagram.com/${username}/following/`;

    console.log(chalk.magenta(`Navigate to: ${followingUrl}`));

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('https://www.instagram.com', { waitUntil: 'networkidle2' });

    console.log(chalk.green("Log in to your account and navigate to the following page."));
    console.log(chalk.green(`Navigate to: ${followingUrl}`));
    console.log(chalk.green("Once ready, press Enter to start."));
    await utils.waitForEnter();

    await unfollowProcess(page);

    console.log(chalk.yellow("Thank you for using this script. Visit us at discord.gg/pK86qbNHZq | github.com/Gol-D-Leo"));

    await browser.close();
})().catch((err) => {
    console.error(chalk.red(`Script failed: ${err.message}`));
});
