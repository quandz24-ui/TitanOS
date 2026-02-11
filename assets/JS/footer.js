let activeTabId = null;
let activeTabEl = null;
let tabAnim = null;

function getTabEl(tabId) {
    if (String(tabId) === "1") {
        return document.querySelector("main");
    }
    return document.querySelector(`tab[data-tab="${tabId}"]`);
}

function animateOut(el) {
    return el.animate([{transform: "translateX(0%)"}, {transform: "translateX(-100%)"}], {
        duration: 280,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "forwards",
    });
}

function animateIn(el) {
    return el.animate([{transform: "translateX(100%)"}, {transform: "translateX(0%)"}], {
        duration: 280,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "forwards",
    });
}

function setActiveTab(tabId) {
    const items = document.querySelectorAll("footer .item");
    const targetEl = getTabEl(tabId);
    if (!targetEl) {
        return;
    }

    items.forEach((item) => {
        item.classList.toggle("active", item.dataset.tabop === String(tabId));
    });

    if (activeTabEl === targetEl) {
        return;
    }

    if (tabAnim) {
        tabAnim.cancel();
        tabAnim = null;
    }

    if (activeTabEl) {
        const outAnim = animateOut(activeTabEl);
    }

    targetEl.style.display = "";
    tabAnim = animateIn(targetEl);
    tabAnim.onfinish = () => {
        tabAnim = null;
    };

    activeTabId = String(tabId);
    activeTabEl = targetEl;
}

function initFooterTabs() {
    const items = document.querySelectorAll("footer .item");
    const initialActive = document.querySelector("footer .item.active");
    const initialTabId = initialActive ? initialActive.dataset.tabop : "1";

    const allTabs = [document.querySelector("main"), ...document.querySelectorAll("tab[data-tab]")];
    const targetEl = getTabEl(initialTabId) || allTabs.find((el) => el);

    if (targetEl) {
        items.forEach((item) => {
            item.classList.toggle("active", item.dataset.tabop === String(initialTabId));
        });
    }

    allTabs.forEach((el) => {
        if (!el) {
            return;
        }
        if (el === targetEl) {
            el.style.display = "block";
            el.style.transform = "translateX(0%)";
            activeTabEl = el;
            activeTabId = String(initialTabId);
        } else {
            el.style.display = "none";
        }
    });

    items.forEach((item) => {
        item.addEventListener("click", () => {
            setActiveTab(item.dataset.tabop);
        });
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFooterTabs);
} else {
    initFooterTabs();
}
