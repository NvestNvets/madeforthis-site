(function () {
  const STORAGE_KEY = "made_for_this_printable_assets_v1";
  const CATEGORY_LABELS = {
    coloring: "Coloring",
    mazes: "Mazes",
    "trace-and-learn": "Trace & Learn",
    matching: "Matching",
    "cut-and-paste": "Cut & Paste",
    "find-and-seek": "Find & Seek",
    "quiet-time": "Quiet Time",
    freebies: "Freebies",
    "bundle-preview": "Bundle Preview"
  };

  const readAssets = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error("Could not parse printable asset registry.", error);
      return [];
    }
  };

  const writeAssets = (assets) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  };

  const registerAsset = (payload) => {
    const assets = readAssets();
    const record = {
      id: `asset-${Date.now()}`,
      createdAt: new Date().toISOString(),
      title: payload.title || "Untitled asset",
      category: payload.category || "bundle-preview",
      assetType: payload.assetType || "printable-page",
      hostedUrl: payload.hostedUrl || "",
      fileName: payload.fileName || "",
      clientEmail: payload.clientEmail || "",
      message: payload.message || "",
      notes: payload.notes || ""
    };

    assets.unshift(record);
    writeAssets(assets);
    return record;
  };

  const clearAssets = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const getAssetsByCategory = (category) => {
    const normalized = String(category || "").trim().toLowerCase();
    return readAssets().filter((asset) => asset.category === normalized);
  };

  const renderDashboard = () => {
    const form = document.getElementById("printable-upload-form");
    const feed = document.getElementById("upload-feed");
    const status = document.getElementById("upload-status");
    const summary = document.getElementById("routing-summary");
    const emailPreview = document.getElementById("email-preview");
    const clearButton = document.getElementById("clear-printable-assets");

    if (!form || !feed || !status || !summary || !emailPreview) return;

    const renderFeed = () => {
      const assets = readAssets();
      feed.innerHTML = "";

      if (!assets.length) {
        feed.innerHTML = '<div class="upload-record">No printable assets routed in this browser yet.</div>';
        summary.textContent = "No assets routed yet in this browser.";
        return;
      }

      const categoryCounts = assets.reduce((acc, asset) => {
        acc[asset.category] = (acc[asset.category] || 0) + 1;
        return acc;
      }, {});

      summary.innerHTML = Object.entries(categoryCounts)
        .map(([key, count]) => `<p><strong>${CATEGORY_LABELS[key] || key}:</strong> ${count} routed item(s)</p>`)
        .join("");

      assets.forEach((asset) => {
        const card = document.createElement("article");
        card.className = "upload-record";
        card.innerHTML = [
          `<strong>${asset.title}</strong>`,
          `<p>Category: ${CATEGORY_LABELS[asset.category] || asset.category}</p>`,
          `<p>Type: ${asset.assetType}</p>`,
          asset.hostedUrl ? `<p><a class="text-link" href="${asset.hostedUrl}" target="_blank" rel="noopener noreferrer">Hosted link</a></p>` : "<p>No hosted link provided yet.</p>",
          asset.clientEmail ? `<p>Client email: ${asset.clientEmail}</p>` : "<p>No client email added.</p>",
          asset.fileName ? `<p>Uploaded file: ${asset.fileName}</p>` : "",
          asset.notes ? `<p>${asset.notes}</p>` : ""
        ].join("");
        feed.appendChild(card);
      });
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      if (!payload.title || !payload.category) {
        status.textContent = "Add at least an asset title and category before routing.";
        return;
      }

      const record = registerAsset(payload);

      status.innerHTML = [
        `<strong>Asset routed:</strong> ${record.title}`,
        `<br />Section: ${CATEGORY_LABELS[record.category] || record.category}`,
        "<br />Placeholder: connect this action to real storage upload, metadata save, and publish hooks."
      ].join("");

      if (window.MFTEmailClient) {
        const email = window.MFTEmailClient.prepareHostedLinkEmail({
          clientEmail: record.clientEmail,
          hostedUrl: record.hostedUrl,
          hostedImageUrl: record.fileName ? `/assets/images/${record.fileName}` : "",
          title: record.title,
          category: record.category,
          message: record.message
        });

        emailPreview.innerHTML = [
          `<p><strong>Status:</strong> ${email.status}</p>`,
          `<p><strong>To:</strong> ${email.clientEmail || "not provided"}</p>`,
          `<p><strong>Subject:</strong> ${email.subject}</p>`,
          `<pre>${email.body}</pre>`
        ].join("");
      }

      form.reset();
      renderFeed();
    });

    clearButton?.addEventListener("click", () => {
      clearAssets();
      status.textContent = "Saved printable assets cleared from this browser.";
      emailPreview.textContent = "Email preview cleared.";
      renderFeed();
    });

    renderFeed();
  };

  window.MFTUploadRouting = {
    CATEGORY_LABELS,
    readAssets,
    registerAsset,
    clearAssets,
    getAssetsByCategory,
    renderDashboard
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderDashboard);
  } else {
    renderDashboard();
  }
})();
