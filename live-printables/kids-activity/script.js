(function () {
  const sections = document.querySelectorAll("[data-upload-section]");
  if (!sections.length || !window.MFTUploadRouting) return;

  sections.forEach((section) => {
    const category = section.getAttribute("data-upload-section");
    const assets = window.MFTUploadRouting.getAssetsByCategory(category);
    if (!assets.length) return;

    const wrapper = document.createElement("div");
    wrapper.className = "card-grid three-up";

    assets.slice(0, 3).forEach((asset) => {
      const card = document.createElement("article");
      card.className = "preview-card";
      card.innerHTML = [
        `<span class="card-kicker">Uploaded ${asset.assetType}</span>`,
        `<h3>${asset.title}</h3>`,
        `<p>${asset.notes || "Dashboard-routed asset preview placeholder."}</p>`,
        asset.hostedUrl ? `<a class="text-link" href="${asset.hostedUrl}" target="_blank" rel="noopener noreferrer">Open hosted link</a>` : ""
      ].join("");
      wrapper.appendChild(card);
    });

    section.appendChild(wrapper);
  });
})();
