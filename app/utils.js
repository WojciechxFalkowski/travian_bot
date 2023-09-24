import * as human from './human.js';
import * as bot from './core.js'
import { BASE_URL } from './bot.js'

export async function get_village_resource(page, village_url) {
    const info = [];

    // Go to resources page
    await page.goto(`${BASE_URL}/dorf1.php${village_url}`);
    await human.mmouse(page);

    // Resource fields
    const resourceContainer = await page.waitForSelector('div#resourceFieldContainer');
    const resources = await resourceContainer.$$('a');

    for (const resource of resources) {
        const resourceClass = await resource.evaluate(el => el.getAttribute('class'));
        if (resourceClass.includes('villageCenter')) continue;

        const resourceLevel = resourceClass.match(/level(\d+)/)[1];
        const resourceType = resourceClass.match(/gid(\d+)/)[1];
        const resourceSlot = resourceClass.match(/buildingSlot(\d+)/)[1];
        const resourceHref = await resource.evaluate(el => el.getAttribute('href'));

        info.push({
            level: resourceLevel,
            type: resourceType === '1' ? 'wood' : resourceType === '2' ? 'clay' : resourceType === '3' ? 'iron' : 'crop',
            status: resourceClass.includes('underConstruction') ? 'under construction' : 'normal',
            href: resourceHref,
            slot: resourceSlot,
        });
    }

    await human.mmouse(page);
    await human.delay(page);

    return info;
}

export async function get_village_current_resource(page, village_url) {
    console.log('get_village_current_resource')
    // Go to resources page
    await page.goto(`${BASE_URL}/dorf1.php${village_url}`);
    await human.mmouse(page);

    // Resource fields
    const warehouseContainer = await page.waitForSelector('div#stockBar');
    const currentResources = await warehouseContainer.$$('.stockBarButton');
    const recourses = {
        wood: 0,
        clay: 0,
        iron: 0,
        crop: 0,
        availableCrop: 0
    }

    // Definiowanie kolejności zasobów
    const resourceOrder = ['wood', 'clay', 'iron', 'crop', 'availableCrop'];

    for (let i = 0; i < currentResources.length; i++) {
        const resource = currentResources[i];
        const valueElement = await resource.$('.value');
        if (valueElement) {  // Sprawdzamy, czy element istnieje
            let value = await page.evaluate(el => el.innerText, valueElement);
            value = value.replace(/[\u202D\u202C]/g, '');  // Usuwanie znaków kontroli tekstu
            console.log(value);
            const resourceName = resourceOrder[i];
            if (resourceName) {
                recourses[resourceName] = parseInt(value, 10);
            } else {
                console.error('Index poza zakresem: brak zdefiniowanej nazwy zasobu dla index', i);
            }
        } else {
            console.log('Element .value nie został znaleziony dla zasobu o indeksie', i);
        }
    }

    await human.mmouse(page);
    await human.delay(page);
    return recourses  // Zwracanie obiektu z aktualnymi zasobami
}

export async function get_village_buildings(page, village_url) {
    const info = [];

    // Go to buildings page
    await page.goto(`${BASE_URL}/dorf2.php${village_url}`);
    await human.mmouse(page);

    // Building fields
    const buildingContainer = await page.waitForSelector('div#villageContent');
    const buildings = await buildingContainer.$$('div.buildingSlot');

    for (const building of buildings) {
        const buildingName = await building.evaluate(el => el.getAttribute('data-name'));
        const buildingId = await building.evaluate(el => el.getAttribute('data-building-id'));

        const buildingTag = await building.$('a');
        const buildingClass = await buildingTag.evaluate(el => el.getAttribute('class'));
        const buildingLevel = await buildingTag.evaluate(el => el.getAttribute('data-level'));
        const buildingHref = await buildingTag.evaluate(el => el.getAttribute('href'));
        const buildingSlot = await building.evaluate(el => el.getAttribute('data-aid'));

        info.push({
            id: buildingId,
            name: buildingName,
            level: buildingLevel,
            status: buildingClass.includes('underConstruction') ? 'under construction' : 'normal',
            href: buildingHref,
            slot: buildingSlot,
        });
    }

    await human.mmouse(page);
    await human.delay(page);

    return info;
}

export async function get_villages(page) {
    const villages = [];

    // Go to the villages page
    await page.goto(`${BASE_URL}/dorf1.php`);
    await human.mmouse(page);

    // Get the villages
    const villageContainer = await page.waitForSelector('div.villageList');
    const villageList = await villageContainer.$$('div.listEntry');

    for (const village of villageList) {
        const villageTagA = await village.$('a');
        const villageHref = await page.evaluate(el => el.getAttribute('href'), villageTagA);

        const villageTagSpan = await village.$('span.coordinatesGrid');
        const villageName = await page.evaluate(el => el.getAttribute('data-villagename'), villageTagSpan);
        const villageCoordX = await page.evaluate(el => el.getAttribute('data-x'), villageTagSpan);
        const villageCoordY = await page.evaluate(el => el.getAttribute('data-y'), villageTagSpan);
        const villageId = await page.evaluate(el => el.getAttribute('data-did'), villageTagSpan);

        villages.push({
            name: villageName,
            href: villageHref,
            coordX: villageCoordX,
            coordY: villageCoordY,
            id: villageId,
        });
    }

    await human.mmouse(page);
    await human.delay(page);

    return villages;
}

export async function check_village_building_queue(page) {
    await page.goto(`${BASE_URL}/dorf1.php`);
    await human.mmouse(page);

    try {
        const buildingContainer = await page.waitForSelector('div.buildingList');
        const buildings = await buildingContainer.$$('div.name');


        if (buildings.length >= 2) {
            await human.mmouse(page);
            return false;
        }

        await human.mmouse(page);
        return true;

    } catch (e) {
        await human.mmouse(page);
        return true;
    }
}

export async function get_tasks(page) {
    await page.goto(`${BASE_URL}/tasks?t=1`);
    await human.mmouse(page);
    await human.delay(page);
    // Sprawdzanie, czy istnieją elementy z klasą 'task achieved group' w elemencie z klasą 'taskOverview'
    const taskContainer = await page.waitForSelector('.taskOverview');
    const taskAchievedElements = await taskContainer.$$('div.task.achieved.group');
    // Jeśli istnieją elementy z klasą 'task achieved group', wyszukaj przycisk i kliknij go
    if (taskAchievedElements && taskAchievedElements.length > 0) {
        for (const taskAchievedElement of taskAchievedElements) {
            const button = await taskAchievedElement.$('button.textButtonV2.buttonFramed.collect.preventAnimation.rectangle.withText.green[type="button"]')
            if (button) {
                await button.click();
                await human.mmouse(page);
                await human.delay(page, 2000, 4000);
            }
        }
    }


    await human.mmouse(page);
    await human.delay(page);
}

export async function get_adventure(page) {
    await page.goto(`${BASE_URL}/hero/adventures`);
    await human.mmouse(page);
    await human.delay(page);

    // Sprawdzanie, czy istnieją elementy z klasą 'task achieved group' w elemencie z klasą 'taskOverview'
    const adventuresContainer = await page.waitForSelector('table.adventureList tbody');
    // const adventureRowElement = await adventuresContainer.$$('tr');

    const disabledButtons = await adventuresContainer.$$('.button .textButtonV2.disabled');
    if (disabledButtons && disabledButtons.length > 0) {
        return
    }
    // Pobierz wszystkie czasy i zamień je na sekundy
    const durationsInSeconds = await adventuresContainer.$$eval('.duration', durations => {
        return durations.map(duration => {
            const [hours, minutes, seconds] = duration.textContent.trim().split(':').map(Number);
            return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
        });
    });

    // Znajdź indeks elementu z najkrótszym czasem
    const shortestIndex = durationsInSeconds.indexOf(Math.min(...durationsInSeconds));
    // Znajdź przycisk związany z tym indeksem i kliknij go
    const buttons = await adventuresContainer.$$('.button .textButtonV2');
    if (buttons[shortestIndex]) {
        await buttons[shortestIndex].click();
    }

    await human.mmouse(page);
    await human.delay(page);
}