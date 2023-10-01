import { BASE_URL } from './bot.js'
import * as human from './human.js'; //human behavior

export async function runStableArmy(page) {
    if (BASE_URL !== "https://ts5.x1.europe.travian.com") {
        return
    }
    console.log('run_stable_army')
    const stableUnitsInProducton = await checkStableQueue(page)
    if (!stableUnitsInProducton || stableUnitsInProducton.length > 0) {
        return
    }

    const unitsQuantityInQueue = stableUnitsInProducton.reduce((prevValue, unit) => prevValue + unit.quantity, 0)

    if (unitsQuantityInQueue && unitsQuantityInQueue > 5) {
        return
    }
    await page.goto(`${BASE_URL}/build.php?id=21&gid=20`);
    await human.mmouse(page);
    await human.delay(page);

    const nonFavouriteTroops = await page.waitForSelector('#nonFavouriteTroops');

    const troopt4Container = await nonFavouriteTroops.$('div.troopt4');
    if (!troopt4Container) {
        return
    }
    const ctaContainer = await troopt4Container.$('div.cta')
    if (!ctaContainer) {
        return
    }

    const availableQuantityContainer = await ctaContainer.$('a[href="#"]')
    if (!availableQuantityContainer) {
        return
    }
    const availableQuantity = await availableQuantityContainer.evaluate(x => x.textContent)
    await human.click(availableQuantityContainer, page);
    // const inputContainer = await ctaContainer.$('input[name="t4"]')
    // await human.type(inputContainer, Number(availableQuantity), page)
    const formContainer = await page.$('form[action="/build.php?id=21&gid=20"]')
    const submitButtonContainer = await formContainer.$('#s1')
    await human.click(submitButtonContainer, page);
}

export const checkStableQueue = async (page) => {
    await human.mmouse(page);
    await human.delay(page);
    await page.goto(`${BASE_URL}/build.php?id=21&gid=20`);


    const buildContainer = await page.waitForSelector('#build');
    const titleDuringTraining = await buildContainer.$('h4.round.spacer')
    if (!titleDuringTraining) {
        return
    }
    const tableUnderProgressArmy = await buildContainer.$('table.under_progress')
    const tBodyUnderProgressArmy = await tableUnderProgressArmy.$('tbody')
    const trUnderProgressArmyUnits = await tBodyUnderProgressArmy.$$('tr')
    console.log(trUnderProgressArmyUnits)
    const unitsInProduction = [];

    for (const [index, unit] of trUnderProgressArmyUnits.entries()) {
        const trClass = await unit.evaluate(el => el.getAttribute('class'));
        if (!trClass) {
            const descContainer = await unit.$('td.desc')
            const imgContainer = await descContainer.$('img.unit')
            const unitClass = await imgContainer.evaluate(el => el.getAttribute('class'));
            const unitName = await imgContainer.evaluate(el => el.getAttribute('alt'));
            let unitType = null
            if (unitClass.includes('unit')) {
                unitType = unitClass.replace('unit ', "")
            }
            const textContent = await descContainer.evaluate(el => el.textContent);
            const unitQuantity = Number(textContent.replace(unitName, "").replace(/\s/g, ''))
            // console.log('vv')
            unitsInProduction.push({
                index: index,
                name: unitName,
                type: unitType,
                quantity: unitQuantity
            });
        }
    }
    return unitsInProduction
}