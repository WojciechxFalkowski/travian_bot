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
            await bot.run_adventure(page)
            await bot.update_tasks(page)
            await bot.attack_oasises(page)
            
            //upgrade all the village resources level by level
            const villagesInfo = await bot.get_villages_info(page);
            let min_level = 10;

            for (const villageInfo of villagesInfo) {
                for (const resource of villageInfo.resources) {
                    if (resource.level < min_level) {
                        if (resource.type === 'crop' && villageInfo.currentResources.crop < CROP_MIN) {
                            min_level = resource.level;
                        }
                        else if (resource.type !== 'crop' && villageInfo.currentResources.crop >= CROP_MIN) {
                            min_level = resource.level;
                        }
                        // min_level = resource.level;
                    }
                }
            }

            // await bot.launch_raid_from_farm_list(page);


            for (const villageInfo of villagesInfo) {
                if (villageInfo.currentResources.availableCrop <= MIN_AVAILABLE_CROP) {
                    const cropResources = villageInfo.resources.filter(resource => resource.type === 'crop')
                    let cropMinLevel = 10
                    for (const resource of cropResources) {
                        if (resource.level < cropMinLevel) {
                            cropMinLevel = resource.level;
                        }
                    }
                    const minCrop = villageInfo.resources.find(resource => resource.level === cropMinLevel)
                    await bot.upgrade_slot(page, minCrop.href);
                }
                else {
                    for (const resource of villageInfo.resources) {
                        if (resource.level == min_level && resource.status == 'normal') {
                            if (resource.type === 'crop' && villageInfo.currentResources.crop < CROP_MIN) {
                                const status = await bot.upgrade_slot(page, resource.href);
                                if (status) break;
                            }
                            else if (resource.type !== 'crop' && villageInfo.currentResources.crop >= CROP_MIN) {
                                const status = await bot.upgrade_slot(page, resource.href);
                                if (status) break;
                            }
                        }
                    }
                }
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


