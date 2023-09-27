import {
    get_villages,
    get_village_resource,
    get_village_buildings,
    check_village_building_queue,
    get_village_current_resource,
    get_tasks,
    get_adventure
} from './utils.js' //utils functions

import * as human from './human.js'; //human behavior

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import dotenv from 'dotenv'; //env variables
import winston from 'winston'; //logger
import { BASE_URL, IS_AVAILABLE_ATTACK_OASIS } from './bot.js'
import locateChrome from 'locate-chrome'

puppeteer.use(StealthPlugin()); //stealth plugin to avoid detection

export async function init_bot() {
    // const executablePath = await new Promise(resolve => locateChrome((arg) => resolve(arg))) || '';
    const browser = await puppeteer.launch({
        // executablePath,
        // executablePath: '/usr/app/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: false,
    });

    const page = await browser.newPage();
    dotenv.config();
    const username = process.env.TRAVIAN_USERNAME;
    const password = process.env.TRAVIAN_PASSWORD;
    const bot = {
        browser: browser,
        page: page,
        username: username,
        password: password,
    }

    return bot;
}

export async function test_function(page) {
    await check_village_building_queue(page);
}

export async function login(page, username, password) {
    await page.goto(`${BASE_URL}/`);

    const usernameInput = await page.locator('input[name="name"]');
    const passwordInput = await page.locator('input[name="password"]');
    const loginButton = await page.locator('button[type="submit"]');

    await human.type(usernameInput, username, page);
    await human.type(passwordInput, password, page);

    await human.mmouse(page);
    await human.click(loginButton, page);
    await human.mmouse(page);

}

export async function get_villages_info(page) {
    console.log('get_villages_info')
    await human.mmouse(page);

    const accountInfo = [];
    const villages = await get_villages(page);

    for (const village of villages) {
        accountInfo.push({
            village: village,
            currentResources: await get_village_current_resource(page, village.href),
            resources: await get_village_resource(page, village.href),
            buildings: await get_village_buildings(page, village.href),
        });

    }

    console.log('accountInfo')
    console.log(accountInfo[0].currentResources)
    await human.mmouse(page);
    await human.delay(page);



    return accountInfo;

}

export async function upgrade_slot(page, slot_url) {
    console.log('upgrade_slot')
    const availableSlots = await check_village_building_queue(page);
    if (!availableSlots) {
        console.log('No available slots');
        return false;
    }

    await page.goto(`${BASE_URL}${slot_url}`);
    await human.mmouse(page);
    await human.delay(page);

    const buttonUpgradeContainer = await page.waitForSelector('div.section1');
    const buttonUpgrade = await buttonUpgradeContainer.$('button');

    const buttonClass = await page.evaluate(el => el.getAttribute('class'), buttonUpgrade)
    if (buttonClass.includes('gold')) {
        return false;
    }

    await human.mmouse(page);
    await human.click(buttonUpgrade, page);

    return true;

}

export async function launch_raid_from_farm_list(page) {

    await page.goto(`${BASE_URL}/build.php?id=39&gid=16&tt=99`);
    await human.mmouse(page);
    await human.delay(page);

    const buttonRaid = await page.waitForSelector('button[value="Avvia"]');

    await human.mmouse(page);
    await human.click(buttonRaid, page);
    await human.delay(page);

}

export async function update_tasks(page) {
    await get_tasks(page)
}

export async function run_adventure(page) {
    await get_adventure(page)
}

// export async function attack_oasises(page) {
//     console.log('attack_oasises', IS_AVAILABLE_ATTACK_OASIS)
//     await human.mmouse(page);
//     await human.delay(page);
//     if(!IS_AVAILABLE_ATTACK_OASIS){
//         console.log("Nie można atakować oaz!")
//         return
//     }
//     console.log("Można atakować oazy!")
//     const oasisesToAttack = [{x: '-110', y:'-40' }]
//     const T1_AMOUNT = '3'
//     await page.goto(`${BASE_URL}/build.php?id=39&gid=16&tt=2`);
//     const tropsContainer = await page.waitForSelector('#troops');
//     const t1 = await tropsContainer.$('input[name="troop[t1]"]');
//     await human.type(t1, T1_AMOUNT, page);
//     const coordinatesContainer = await page.$('.coordinatesInput');
//     console.log('v5')
//     const xCoordinate = await coordinatesContainer.$('input[name="x"]');
//     await human.type(xCoordinate, oasisesToAttack[0].x, page);

//     const yCoordinate = await coordinatesContainer.$('input[name="y"]');
//     await human.type(yCoordinate, oasisesToAttack[0].y, page);

//     const optionsContainer = await page.$('.option');
//     const plunderOption = await optionsContainer.$('input[value="4"]');
//     plunderOption.click()
//     await human.mmouse(page);
//     await human.delay(page);
// }
export async function attack_oasises(page) {
    await human.mmouse(page);
    await human.delay(page);
    if (!IS_AVAILABLE_ATTACK_OASIS) {
        console.log("Nie można atakować oaz!")
        return
    }
    console.log("Można atakować oazy!")
    const oasisesToAttack = [{ x: '-110', y: '-40' }]

    for (const oasis of oasisesToAttack) {
        await page.goto(`${BASE_URL}/position_details.php?x=${oasis.x}&y=${oasis.y}`);
        const troopInfoContainer = await page.waitForSelector('#troop_info');
        const tropTypes = await troopInfoContainer.$$('table > tbody > tr')
        const isEmptyOasis = await tropTypes[0].evaluate(x => x.textContent) === 'brak'

        if (!isEmptyOasis) {
            console.log(`Oaza [x: ${oasis.x}, y: ${oasis.y}] nie jest pusta!`)
            return
        }

        const optionsContainer = await page.$('.detailImage > .options');
        const attackOasisButton = (await optionsContainer.$$('.option'))[2]
        await attackOasisButton.click()
        await human.delay(page);

        /**
         * Set army
         */
        const T1_AMOUNT = '3'
        const t1AmountContainer = await page.$('input[name="troop[t1]"] + a');
        const t1Amount = (await t1AmountContainer.evaluate(el => el.textContent)).replace(/[\u202D\u202C\s]/g, '');
        const isEnoughT1 = Number(T1_AMOUNT) <= Number(t1Amount)
        if(!isEnoughT1){
            return
        }
        const tropsContainer = await page.waitForSelector('#troops');
        const t1 = await tropsContainer.$('input[name="troop[t1]"]');
        await human.type(t1, T1_AMOUNT, page);

        //It is selected by default
        // const coordinatesContainer = await page.$('.coordinatesInput');
        // const xCoordinate = await coordinatesContainer.$('input[name="x"]');
        // await human.type(xCoordinate, oasisesToAttack[0].x, page);

        // const yCoordinate = await coordinatesContainer.$('input[name="y"]');
        // await human.type(yCoordinate, oasisesToAttack[0].y, page);

        // const optionsContainer = await page.$('.option');
        // const plunderOption = await optionsContainer.$('input[value="4"]');
        // plunderOption.click()
        const sendArmyButton = await page.$('button[type="submit"]')
        await sendArmyButton.click()

        const actionButtonsContainer = await page.waitForSelector('#rallyPointButtonsContainer')
        const actionButtons = await actionButtonsContainer.$$('button')
        const confirmSendArmyButton = await actionButtons[actionButtons.length - 1]
        await confirmSendArmyButton.click()
        await human.mmouse(page);
        await human.delay(page);
    }
}