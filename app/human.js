export async function type(element, text, page) {

    await element.click();

    for (let i = 0; i < text.length; i++) {
        await page.keyboard.type(text[i], { delay: (Math.random() * 250 + 100) });
    }
}

export async function click(element, page) {
    await delay(page);
    await element.click();
    await delay(page)
}

export async function mmouse(page) {
    for (let i = 0; i < Math.floor(Math.random() * 10 + 1); i++) {
        await page.mouse.move(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000), { steps: 40, delay: 500 });
    }
}

export async function delay(page, min = 100, max = 1000) {
    const delay = Math.floor(Math.random() * (max - min)) + min;
    await page.waitForTimeout(delay);
}
