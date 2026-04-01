(function () {
  const app = document.getElementById("printable-catalog");
  const search = document.getElementById("catalog-search");
  if (!app || !window.MFTLivePrintableStore) return;

  const render = async (query = "") => {
    const registry = await window.MFTLivePrintableStore.loadRegistry();
    const normalized = String(query || "").trim().toLowerCase();
    const records = registry.records.filter((record) => {
      if (!record.is_published) return false;
      if (!normalized) return true;
      const haystack = [record.title, record.description, record.category, ...(record.tags || [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });

    app.innerHTML = records
      .map(
        (record) => `
          <article class="lp-card">
            <img src="${record.image_url}" alt="${record.title}" loading="lazy" />
            <p class="lp-pill">${record.type.replace(/-/g, " ")}</p>
            <h3>${record.title}</h3>
            <p>${record.description}</p>
            <p class="lp-path">${record.live_url}</p>
            <div class="lp-inline-actions">
              <a class="lp-btn lp-btn-primary" href="/printables/${record.slug}/">Open Live Page</a>
              <a class="lp-btn lp-btn-secondary" href="/admin/dashboard.html?slug=${record.slug}">Edit</a>
            </div>
          </article>
        `
      )
      .join("");
  };

  search?.addEventListener("input", (event) => render(event.target.value));
  render();
})();
