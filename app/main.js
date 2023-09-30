import * as bot from './core.js'



(async () => {

    const bot_info = await bot.init_bot();

    const page = bot_info.page;
    const browser = bot_info.browser;
    const username = bot_info.username;
    const password = bot_info.password;
    const CROP_MIN = 300
    const MIN_AVAILABLE_CROP = 5

    await new Promise(resolve => setTimeout(resolve, 2000))
    await bot.login(page, username, password);


    while (true) {

        try {
            await bot.run_stable_army(page)
            await bot.run_adventure(page)
            await bot.update_tasks(page)
            await bot.attack_oasises(page)
            const villagesInfo = await bot.get_villages_info(page);


            await bot.launch_raid_from_farm_list(page);

            for (const villageInfo of villagesInfo) {
                await bot.buildQueue(page, villageInfo.village.href)
            }

            // await bot.launch_raid_from_farm_list(page);


        } catch (e) {

            await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 2));
            await bot.login(page, username, password);
            console.log('ERROR')

        }

    }

    // Close the browser
    await browser.close();
})();


