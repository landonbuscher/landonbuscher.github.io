/* Progressive enhancement for /writing/.
 *
 * The article list is real markup in the page — with this script blocked the
 * archive is still a complete, correctly ordered list. Everything below only
 * adds controls on top of nodes that are already in the DOM. */
(() => {
    const list = document.getElementById("entries");
    const controls = document.querySelector(".archive-controls");
    if (!list || !controls) return;

    const text = (el, sel) => (el.querySelector(sel)?.textContent || "").replace(/\s+/g, " ").trim();

    const entries = [...list.querySelectorAll(".entry")].map((el) => ({
        el,
        date: el.dataset.date || "",
        tags: (el.dataset.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        // title and dek only — searching the tag line too would make every
        // chip-worthy word a search hit as well
        haystack: (text(el, ".entry-title") + " " + text(el, ".entry-dek")).toLowerCase(),
    }));
    if (!entries.length) return;

    const noResults = document.querySelector(".no-results");
    let query = "";
    let tag = new URLSearchParams(location.search).get("tag") || "";
    let newestFirst = true;

    /* ---- controls ---- */
    const search = document.createElement("input");
    search.type = "search";
    search.className = "archive-search";
    search.placeholder = "Search titles…";
    search.setAttribute("aria-label", "Search articles");

    const sortBtn = document.createElement("button");
    sortBtn.type = "button";
    sortBtn.className = "sort-toggle";

    const row = document.createElement("div");
    row.className = "control-row";
    row.append(search, sortBtn);

    const chipRow = document.createElement("div");
    chipRow.className = "tag-chips";
    const chips = new Map();
    const allTags = [...new Set(entries.flatMap((e) => e.tags))].sort();
    for (const t of ["", ...allTags]) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "tag-chip";
        chip.textContent = t || "all";
        chip.onclick = () => {
            tag = tag === t ? "" : t;
            apply();
        };
        chips.set(t, chip);
        chipRow.appendChild(chip);
    }

    controls.append(row, chipRow);

    search.oninput = () => {
        query = search.value.trim().toLowerCase();
        apply();
    };
    sortBtn.onclick = () => {
        newestFirst = !newestFirst;
        apply();
    };

    /* ---- filter, sort, reflect state ---- */
    function apply() {
        let shown = 0;
        for (const e of entries) {
            const match = (!query || e.haystack.includes(query)) && (!tag || e.tags.includes(tag));
            e.el.hidden = !match;
            if (match) shown++;
        }

        const order = [...entries].sort((a, b) => b.date.localeCompare(a.date));
        if (!newestFirst) order.reverse();
        for (const e of order) list.appendChild(e.el);

        sortBtn.textContent = newestFirst ? "newest ↓" : "oldest ↑";
        for (const [t, chip] of chips) chip.setAttribute("aria-pressed", String(t === tag));
        if (noResults) noResults.hidden = shown > 0;

        // keep the active tag in the URL so a filtered view can be linked
        const url = new URL(location.href);
        if (tag) url.searchParams.set("tag", tag);
        else url.searchParams.delete("tag");
        history.replaceState(null, "", url);
    }

    apply();
})();
