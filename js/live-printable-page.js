(function () {
  const slug = document.body.dataset.printableSlug;
  const app = document.getElementById("live-printable-app");
  if (!slug || !app || !window.MFTLivePrintableStore || !window.MFTLivePrintableTemplates) return;

  const storageKey = `mft_live_printable_progress_${slug}`;

  const readProgress = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const writeProgress = (value) => {
    localStorage.setItem(storageKey, JSON.stringify(value));
  };

  const renderField = (field, value) => {
    const style = `top:${field.top}%;left:${field.left}%;width:${field.width}%;height:${field.height}%;`;
    if (field.type === "checkbox") {
      return `
        <label class="lp-field lp-checkbox-row" style="${style}">
          <input type="checkbox" data-field-id="${field.id}" ${value ? "checked" : ""} />
        </label>
      `;
    }
    if (field.type === "textarea") {
      return `
        <label class="lp-field lp-textarea" style="${style}">
          <textarea data-field-id="${field.id}" placeholder="${field.placeholder || ""}">${value || ""}</textarea>
        </label>
      `;
    }
    return `
      <label class="lp-field" style="${style}">
        <input type="text" data-field-id="${field.id}" placeholder="${field.placeholder || ""}" value="${value || ""}" />
      </label>
    `;
  };

  const collectValues = () => {
    const values = {};
    app.querySelectorAll("[data-field-id]").forEach((field) => {
      const id = field.getAttribute("data-field-id");
      values[id] = field.type === "checkbox" ? field.checked : field.value;
    });
    return values;
  };

  const setStatus = (message) => {
    const node = document.getElementById("save-status");
    if (node) node.textContent = message;
  };

  const hydrate = async () => {
    const registry = await window.MFTLivePrintableStore.loadRegistry();
    const publishedRecords = registry.records.filter((item) => item.is_published);
    const recordIndex = publishedRecords.findIndex((item) => item.slug === slug);
    const record = publishedRecords[recordIndex];
    if (!record) {
      app.innerHTML = '<section class="lp-printable-shell"><h1>Printable not found</h1><p class="lp-muted">This slug is not in the current printable registry yet.</p></section>';
      return;
    }
    const previousRecord = recordIndex > 0 ? publishedRecords[recordIndex - 1] : null;
    const nextRecord = recordIndex < publishedRecords.length - 1 ? publishedRecords[recordIndex + 1] : null;

    const template = window.MFTLivePrintableTemplates.getTemplate(record.template_type);
    const saved = readProgress();

    app.innerHTML = `
      <div class="lp-page-wrap">
        <div class="lp-float-controls" id="float-controls">
          <a class="lp-float-btn" href="${record.image_url}" download>Download</a>
          <button class="lp-float-btn" type="button" id="float-print-button">Print</button>
        </div>
        <div class="lp-page-toolbar">
          <a class="lp-btn lp-btn-secondary" href="/printables/index.html">Back to Live Printables</a>
          <div class="lp-inline-actions">
            ${previousRecord ? `<a class="lp-btn lp-btn-secondary" href="/printables/${previousRecord.slug}/">Previous Printable</a>` : ""}
            ${nextRecord ? `<a class="lp-btn lp-btn-secondary" href="/printables/${nextRecord.slug}/">Next Printable</a>` : ""}
            <button class="lp-btn lp-btn-primary" type="button" id="print-printable">Print</button>
            ${record.is_interactive ? '<button class="lp-btn" type="button" id="save-printable">Save for Later</button><button class="lp-btn" type="button" id="clear-printable">Clear All</button><button class="lp-btn" type="button" id="reset-printable">Reset</button>' : ""}
          </div>
        </div>

        <article class="lp-printable-shell">
          <header class="lp-printable-head">
            <div>
              <p class="lp-eyebrow">${record.type.replace(/-/g, " ")}</p>
              <h1>${record.title}</h1>
              <p>${record.description}</p>
              <div class="lp-printable-meta">
                <span class="lp-pill">${record.category}</span>
                <span class="lp-pill">${record.publish_status}</span>
                <span class="lp-pill">${record.live_url}</span>
              </div>
            </div>
          </header>

          <div class="lp-printable-body">
            <div class="lp-printable-canvas">
              <div class="lp-design-stage">
                <img class="lp-design-image" src="${record.image_url}" alt="${record.title}" />
                <div class="lp-field-layer">
                  ${template.fields.map((field) => renderField(field, saved[field.id])).join("")}
                </div>
              </div>
            </div>
            <div class="lp-footer-note">
              <span>Made For This live printable prepared for clients.digioffice.shop/codee-live-printables/${record.slug}/</span>
              <div class="lp-inline-actions">
                ${previousRecord ? `<a class="lp-btn lp-btn-secondary" href="/printables/${previousRecord.slug}/">Previous</a>` : ""}
                ${nextRecord ? `<a class="lp-btn lp-btn-secondary" href="/printables/${nextRecord.slug}/">Next</a>` : ""}
                <a class="lp-btn lp-btn-secondary" href="/admin/dashboard.html?slug=${record.slug}">Edit in Admin</a>
              </div>
            </div>
            <div id="save-status" class="lp-save-status"></div>
          </div>
        </article>
      </div>
    `;

    document.getElementById("print-printable")?.addEventListener("click", () => window.print());
    document.getElementById("float-print-button")?.addEventListener("click", () => window.print());
    document.getElementById("save-printable")?.addEventListener("click", () => {
      writeProgress(collectValues());
      setStatus("Saved in this browser for later.");
    });
    document.getElementById("clear-printable")?.addEventListener("click", () => {
      app.querySelectorAll("[data-field-id]").forEach((field) => {
        if (field.type === "checkbox") field.checked = false;
        else field.value = "";
      });
      localStorage.removeItem(storageKey);
      setStatus("Cleared all fields and removed saved progress.");
    });
    document.getElementById("reset-printable")?.addEventListener("click", () => {
      const restored = readProgress();
      app.querySelectorAll("[data-field-id]").forEach((field) => {
        const id = field.getAttribute("data-field-id");
        if (field.type === "checkbox") field.checked = Boolean(restored[id]);
        else field.value = restored[id] || "";
      });
      setStatus("Reset to the last saved version.");
    });

    app.querySelectorAll("[data-field-id]").forEach((field) => {
      field.addEventListener("change", () => setStatus("Unsaved changes."));
      if (field.tagName === "TEXTAREA" || field.type === "text") {
        field.addEventListener("input", () => setStatus("Unsaved changes."));
      }
    });

    const stage = app.querySelector(".lp-design-stage");
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 45;
    const goTo = (target) => {
      if (!target) return;
      window.location.href = `/printables/${target.slug}/`;
    };

    stage?.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    stage?.addEventListener(
      "touchend",
      (event) => {
        touchEndX = event.changedTouches[0].clientX;
        const delta = touchEndX - touchStartX;
        if (Math.abs(delta) < swipeThreshold) return;
        if (delta < 0) goTo(nextRecord);
        if (delta > 0) goTo(previousRecord);
      },
      { passive: true }
    );

    window.setTimeout(() => {
      document.getElementById("float-controls")?.classList.add("is-visible");
    }, 2600);
  };

  hydrate();
})();
