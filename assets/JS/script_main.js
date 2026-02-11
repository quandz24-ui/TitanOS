let roms = {};

const blurOverlay = document.querySelector(".blurOV");
const romInf = document.querySelector(".romInf");
const main = document.querySelector("main");
const grid = document.querySelector(".grid");

let romInfAnim = null;
let lastOpenBtn = null;
let lastOpenRect = null;
let isClosing = false;
let closeCleanup = null;
let closeStartScrollTop = 0;

function getImageUrl(value) {
    if (!value) {
        return "";
    }
    const trimmed = String(value).trim();
    if (trimmed.startsWith("url(")) {
        return trimmed.replace(/^url\((['"]?)/, "").replace(/(['"]?)\)$/, "");
    }
    return trimmed;
}

function renderGrid(items) {
    const grid = document.querySelector(".grid");
    if (!grid) {
        return;
    }

    items.forEach((rom) => {
        const item = document.createElement("div");
        item.className = "item";

        const img = document.createElement("img");
        img.src = getImageUrl(rom.image);
        item.appendChild(img);

        const nameEl = document.createElement("name");
        nameEl.textContent = rom.name || "";
        item.appendChild(nameEl);

        const basedEl = document.createElement("based");
        basedEl.textContent = rom.based || "";
        item.appendChild(basedEl);

        const deviceEl = document.createElement("device");
        deviceEl.textContent = rom.device || "";
        item.appendChild(deviceEl);

        const row = document.createElement("div");
        row.className = "row";

        const downloadBtn = document.createElement("div");
        downloadBtn.className = "dwnload Btn";
        downloadBtn.dataset.idrom = rom.id;
        downloadBtn.textContent = "Download";
        row.appendChild(downloadBtn);

        const infoBtn = document.createElement("div");
        infoBtn.className = "inf Btn";
        infoBtn.dataset.idrom = rom.id;
        infoBtn.textContent = "Information";
        row.appendChild(infoBtn);

        item.appendChild(row);
        grid.appendChild(item);
    });
}
function clearInfHtml() {
    const container = document.querySelector(".romInfo");
    container.innerHTML = "";
}
async function loadRomInfoHtml(id) {
    const container = document.querySelector(".romInfo");
    if (!container) {
        return;
    }
    try {
        const response = await fetch(`./assets/ROMsInfo/${id}.html`);
        if (!response.ok) {
            throw new Error(`File not found: ${response.status}`);
        }
        container.innerHTML = await response.text();
    } catch (err) {
        container.innerHTML = "<p>Nothing Here.</p>";
        console.error(err);
    }
}

function cancelRomInfAnim(opacity) {
    if (romInfAnim) {
        romInfAnim.cancel();
        romInfAnim = null;
    }
    if (lastOpenBtn) {
        lastOpenBtn.style.opacity = opacity;
    }
}

function rectInContainer(rect, containerRect) {
    return {
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height,
    };
}

function getRomInfContainerRect() {
    const container = romInf.offsetParent || document.body;
    return container.getBoundingClientRect();
}

function getScaleAndOrigin(el) {
    if (!el) {
        return {scaleX: 1, scaleY: 1, originX: 0, originY: 0};
    }

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const originParts = style.transformOrigin.split(" ");
    const ox = originParts[0] || "0px";
    const oy = originParts[1] || "0px";
    const originX = rect.left + parseFloat(ox);
    const originY = rect.top + parseFloat(oy);

    if (!style.transform || style.transform === "none") {
        return {scaleX: 1, scaleY: 1, originX, originY};
    }

    const matrix = new DOMMatrixReadOnly(style.transform);
    const scaleX = matrix.a || 1;
    const scaleY = matrix.d || 1;
    return {scaleX, scaleY, originX, originY};
}

function unscaleRect(rect, scaleX, scaleY, originX, originY) {
    if (scaleX === 1 && scaleY === 1) {
        return rect;
    }
    return {
        top: originY + (rect.top - originY) / scaleY,
        left: originX + (rect.left - originX) / scaleX,
        width: rect.width / scaleX,
        height: rect.height / scaleY,
    };
}

function animateOpen(startRect, endRect, options) {
    romInfAnim = romInf.animate(
        [
            {
                top: `${startRect.top}px`,
                left: `${startRect.left}px`,
                width: `${startRect.width}px`,
                height: `${startRect.height}px`,
                opacity: 1,
            },
            {
                top: `10%`,
                left: `5%`,
                width: `90%`,
                height: ``,
                opacity: 1,
            },
        ],
        options
    );
}

function animateClose(fromRect, endRect, options) {
    romInfAnim = romInf.animate(
        [
            {
                top: `${fromRect.top}px`,
                left: `${fromRect.left}px`,
                width: `${fromRect.width}px`,
                height: `${fromRect.height}px`,
                opacity: 1,
            },
            {
                top: `${endRect.top}px`,
                left: `${endRect.left}px`,
                width: `${endRect.width}px`,
                height: `${endRect.height}px`,
                opacity: 1,
            },
        ],
        options
    );
}

function startCloseAnim(fromRect, endRect, duration, easing) {
    animateClose(fromRect, endRect, {
        duration,
        easing,
    });
    romInfAnim.onfinish = () => {
        if (closeCleanup) {
            closeCleanup();
            closeCleanup = null;
        }
        lastOpenBtn.style.opacity = 1;
        isClosing = false;
        romInfAnim = null;
    };
    romInfAnim.oncancel = () => {
        if (closeCleanup) {
            closeCleanup();
            closeCleanup = null;
        }
        isClosing = false;
        romInfAnim = null;
    };
}

function trackCloseToScroll() {
    const scrollEl = document.querySelector(".scroll");
    if (!scrollEl) {
        return () => {};
    }

    closeStartScrollTop = scrollEl.scrollTop;

    const handler = () => {
        if (!isClosing) {
            return;
        }
        const deltaY = scrollEl.scrollTop - closeStartScrollTop;
        romInf.style.transform = `translateY(${-deltaY}px)`;
    };

    scrollEl.addEventListener("scroll", handler, {passive: true});
    return () => {
        scrollEl.removeEventListener("scroll", handler);
        romInf.style.transform = "";
    };
}

function closeBtn() {
    if (!lastOpenBtn) {
        return;
    }

    isClosing = true;
    const startContainerRect = getRomInfContainerRect();
    const startRect = rectInContainer(romInf.getBoundingClientRect(), startContainerRect);

    cancelRomInfAnim(0);
    main.classList.remove("open");

    const endContainerRect = getRomInfContainerRect();
    const endViewportRect = lastOpenRect || lastOpenBtn.getBoundingClientRect();
    const endRect = rectInContainer(endViewportRect, endContainerRect);

    closeCleanup = trackCloseToScroll();
    startCloseAnim(startRect, endRect, 500, "cubic-bezier(0.35, 1.1, 0.33, 1)");
    clearInfHtml();
}
function openById(id, trigger) {
    console.log(id, trigger);
    if (!trigger) {
        main.classList.add("open");
        return;
    }
    cancelRomInfAnim(1);
    lastOpenBtn = trigger;

    trigger.style.opacity = 0;

    const containerRect = getRomInfContainerRect();
    const scrollEl = document.querySelector(".scroll");
    const {scaleX, scaleY, originX, originY} = getScaleAndOrigin(scrollEl);
    const rawStartRect = trigger.getBoundingClientRect();
    const unscaledStartRect = unscaleRect(rawStartRect, scaleX, scaleY, originX, originY);
    const startRect = rectInContainer(unscaledStartRect, containerRect);
    lastOpenRect = unscaledStartRect;

    main.classList.add("open");

    requestAnimationFrame(() => {
        const endContainerRect = getRomInfContainerRect();
        const endRect = rectInContainer(romInf.getBoundingClientRect(), endContainerRect);
        animateOpen(startRect, endRect, {
            duration: 420,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        });

        romInfAnim.onfinish = () => {
            romInfAnim = null;
        };
    });
}
function openDwnLoadLink(id, btn) {
    console.log(id, btn);
}

async function init() {
    await fetch("./assets/ROMs/TitanOS.json")
    .then((response) => response.json())
    .then((data) => {
        roms = data;
        console.log(roms);
    });
    renderGrid(roms);

    const allInfBtn = document.querySelectorAll(".inf.Btn");

    allInfBtn.event = function (e) {
        console.log("clicked");
        const el = e.currentTarget;
        openById(el.dataset.idrom, el);

        romInf.querySelector(".ct").textContent = "Information";
        loadRomInfoHtml(el.dataset.idrom);
    };
    allInfBtn.forEach((el) => {
        el.addEventListener("click", allInfBtn.event);
    });

    const allDownloadBtn = document.querySelectorAll(".dwnload.Btn");

    allDownloadBtn.event = function (e) {
        console.log("clicked");
        const el = e.currentTarget;
        openDwnLoadLink(el.dataset.idrom, el);

        romInf.querySelector(".ct").textContent = "Download";
    };
    allDownloadBtn.forEach((el) => {
        el.addEventListener("click", allDownloadBtn.event);
    });

    const closeBtnEl = document.querySelector(".closeBtn");
    if (closeBtnEl) {
        closeBtnEl.addEventListener("click", closeBtn);
    }

    window.removeEventListener("DOMContentLoaded", init);
}
window.addEventListener("DOMContentLoaded", init);
