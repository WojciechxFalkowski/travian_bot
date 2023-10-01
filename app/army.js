import { BASE_URL } from './bot.js'
import * as human from './human.js'; //human behavior

export async function buildArmy(page, url, unitTroopType, minUnitQuantityInQueue, maxUnitQuantityInQueue) {
    if (BASE_URL !== "https://ts5.x1.europe.travian.com") {
        return
    }
    const stableUnitsInProducton = await checkUnitQueue(page, url)
    console.log(stableUnitsInProducton)
    if (!Array.isArray(stableUnitsInProducton)) {
        return
    }

    const unitsQuantityInQueue = stableUnitsInProducton.reduce((prevValue, unit) => prevValue + unit.quantity, 0)

    if (unitsQuantityInQueue && unitsQuantityInQueue >= maxUnitQuantityInQueue) {
        return
    }
    await page.goto(`${BASE_URL}${url}`);
    await human.mmouse(page);
    await human.delay(page);

    await buildUnit(page, unitTroopType, minUnitQuantityInQueue)
}

export const buildUnit = async (page, unitTroopType, minUnitQuantityInQueue) => {
    const nonFavouriteTroops = await page.waitForSelector('#nonFavouriteTroops');

    const troopTypeContainer = await nonFavouriteTroops.$(`div.${unitTroopType}`);
    if (!troopTypeContainer) {
        return
    }
    const ctaContainer = await troopTypeContainer.$('div.cta')
    if (!ctaContainer) {
        return
    }

    const availableQuantityContainer = await ctaContainer.$('a[href="#"]')
    if (!availableQuantityContainer) {
        return
    }
    const availableQuantity = Number(await availableQuantityContainer.evaluate(x => x.textContent))
    // await human.click(availableQuantityContainer, page);
    const quantity = availableQuantity > minUnitQuantityInQueue ? minUnitQuantityInQueue : availableQuantity
    const inputContainer = await ctaContainer.$('input')
    await human.type(inputContainer, quantity.toString(), page)
    const formContainer = await page.$('form[name="snd"]')
    const submitButtonContainer = await formContainer.$('#s1')

    await human.click(submitButtonContainer, page);
}

export const checkUnitQueue = async (page, url) => {
    await human.mmouse(page);
    await human.delay(page);
    await page.goto(`${BASE_URL}${url}`);


    const buildContainer = await page.waitForSelector('#build');
    const titleDuringTraining = await buildContainer.$('h4.round.spacer')
    if (!titleDuringTraining) {
        return []
    }
    const tableUnderProgressArmy = await buildContainer.$('table.under_progress')
    const tBodyUnderProgressArmy = await tableUnderProgressArmy.$('tbody')
    const trUnderProgressArmyUnits = await tBodyUnderProgressArmy.$$('tr')
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