function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
}

function itemMatchesQuery(item, query) {
    if (!query) {
        return true;
    }
    const nameEl = item.querySelector("name");
    const basedEl = item.querySelector("based");
    const deviceEl = item.querySelector("device");

    const haystack = [
        nameEl ? nameEl.textContent : "",
        basedEl ? basedEl.textContent : "",
        deviceEl ? deviceEl.textContent : "",
    ]
        .join(" ")
        .toLowerCase();

    return haystack.includes(query);
}

function applyFilter(query) {
    const items = document.querySelectorAll(".grid .item");
    items.forEach((item) => {
        item.style.display = itemMatchesQuery(item, query) ? "flex" : "none";
    });
}

function initSearch() {
    const input = document.getElementById("search");
    if (!input) {
        return;
    }

    const onInput = () => {
        applyFilter(normalizeText(input.value));
    };

    input.addEventListener("input", onInput);
    onInput();

    const grid = document.querySelector(".grid");
    if (grid) {
        const observer = new MutationObserver(() => {
            onInput();
        });
        observer.observe(grid, {childList: true});
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearch);
} else {
    initSearch();
}
