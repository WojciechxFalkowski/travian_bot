import * as bot from './core.js'



(async () => {

    const bot_info = await bot.init_bot();

    const page = bot_info.page;
    const browser = bot_info.browser;
    const username = bot_info.username;
    const password = bot_info.password;

    await new Promise(resolve => setTimeout(resolve, 2000))
    await bot.login(page, username, password);

    let lastExecutionTime = null;
    // Funkcja porównująca dwa obiekty Date i zwracająca true, jeśli różnica między nimi wynosi więcej niż 10 minut
    function isMoreThanTenMinutesOld(time1, time2) {
        const differenceInMilliseconds = Math.abs(time1 - time2);
        const tenMinutesInMilliseconds = 8 * 60 * 1000;  // 10 minut przekonwertowanych na milisekundy
        return differenceInMilliseconds > tenMinutesInMilliseconds;
    }
    while (true) {
        const currentTime = new Date();
        try {
            await bot.run_army(page)
            await bot.run_adventure(page)
            await bot.update_tasks(page)
            // await bot.attack_oasises(page)
            const villagesInfo = await bot.get_villages_info(page);

            if (lastExecutionTime === null || isMoreThanTenMinutesOld(currentTime, lastExecutionTime)) {
                // Aktualizuj czas ostatniego uruchomienia funkcji
                lastExecutionTime = currentTime;

                // Tutaj umieść kod funkcji, którą chcesz uruchomić
                await bot.launch_raid_from_farm_list(page);

                console.log('Funkcja została uruchomiona o', currentTime);
            } else {
                console.log('Nie można uruchomić funkcji, nie minęło jeszcze 10 minut od ostatniego uruchomienia.', currentTime);
            }

            for (const villageInfo of villagesInfo) {
                await bot.buildQueue(page, villageInfo.village.href)
                // await bot.buildResource(page, villageInfo)
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


