(function () {
  const form = document.getElementById("printable-admin-form");
  const list = document.getElementById("printable-record-list");
  const status = document.getElementById("admin-status");
  const preview = document.getElementById("admin-preview");
  const slugInput = document.getElementById("printable-slug");
  const titleInput = document.getElementById("printable-title");
  const imageSelect = document.getElementById("printable-image-select");
  const imageInput = document.getElementById("printable-image-url");
  const querySlug = new URLSearchParams(window.location.search).get("slug");

  if (!form || !window.MFTLivePrintableStore) return;

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const formToRecord = () => {
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const slug = window.MFTLivePrintableStore.slugify(data.get("slug") || title);
    const type = String(data.get("type") || "static-printable");
    const templateType = String(data.get("template_type") || "planner-static");
    const imageUrl = String(data.get("image_url") || imageInput.value || "").trim();
    const bucketBase = "https://clients.digioffice.shop/printables";

    return {
      printable_id: `mft-${slug}`,
      title,
      slug,
      subtitle: String(data.get("subtitle") || "").trim(),
      description: String(data.get("description") || "").trim(),
      category: String(data.get("category") || "").trim(),
      tags: String(data.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      type,
      image_url: imageUrl,
      template_type: templateType,
      field_config: [],
      is_interactive: type === "interactive-live-printable",
      is_published: data.get("publish_status") === "published",
      created_by: "Nina",
      reviewed_by_codee: data.get("reviewed_by_codee") ? "Codee" : "",
      publish_status: String(data.get("publish_status") || "draft"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      live_url: `${bucketBase}/${slug}/`,
      bucket_path: `printables/${slug}/index.html`
    };
  };

  const fillForm = (record) => {
    form.elements.namedItem("title").value = record.title || "";
    form.elements.namedItem("slug").value = record.slug || "";
    form.elements.namedItem("subtitle").value = record.subtitle || "";
    form.elements.namedItem("description").value = record.description || "";
    form.elements.namedItem("category").value = record.category || "";
    form.elements.namedItem("tags").value = Array.isArray(record.tags) ? record.tags.join(", ") : record.tags || "";
    form.elements.namedItem("type").value = record.type || "static-printable";
    form.elements.namedItem("template_type").value = record.template_type || "planner-static";
    form.elements.namedItem("image_url").value = record.image_url || "";
    form.elements.namedItem("publish_status").value = record.publish_status || "draft";
    form.elements.namedItem("reviewed_by_codee").checked = Boolean(record.reviewed_by_codee);
    imageInput.value = record.image_url || "";
    renderPreview(record);
  };

  const renderPreview = (record) => {
    if (!preview) return;
    preview.innerHTML = `
      <p class="lp-pill">${record.type.replace(/-/g, " ")}</p>
      <h3>${record.title || "Untitled Printable"}</h3>
      <p class="lp-muted">${record.description || "Add a description for this printable."}</p>
      <p class="lp-path">Live URL: ${record.live_url || "https://clients.digioffice.shop/printables/[slug]/"}</p>
      ${record.image_url ? `<div class="lp-preview-art"><img src="${record.image_url}" alt="${record.title || "Printable preview"}" /></div>` : ""}
    `;
  };

  const renderList = async () => {
    const registry = await window.MFTLivePrintableStore.loadRegistry();
    list.innerHTML = registry.records
      .map(
        (record) => `
          <article class="lp-record-card">
            <p class="lp-pill">${record.publish_status}</p>
            <h3>${record.title}</h3>
            <p class="lp-muted">${record.type.replace(/-/g, " ")} · ${record.category}</p>
            <p class="lp-path">${record.live_url}</p>
            <div class="lp-record-actions">
              <button class="lp-btn lp-btn-secondary" type="button" data-edit-slug="${record.slug}">Edit</button>
              <button class="lp-btn lp-btn-secondary" type="button" data-duplicate-slug="${record.slug}">Duplicate</button>
              <button class="lp-btn lp-btn-secondary" type="button" data-publish-slug="${record.slug}">${record.is_published ? "Unpublish" : "Publish"}</button>
            </div>
          </article>
        `
      )
      .join("");

    list.querySelectorAll("[data-edit-slug]").forEach((button) => {
      button.addEventListener("click", async () => {
        const current = (await window.MFTLivePrintableStore.loadRegistry()).records.find(
          (record) => record.slug === button.dataset.editSlug
        );
        if (current) fillForm(current);
      });
    });

    list.querySelectorAll("[data-duplicate-slug]").forEach((button) => {
      button.addEventListener("click", async () => {
        const current = (await window.MFTLivePrintableStore.loadRegistry()).records.find(
          (record) => record.slug === button.dataset.duplicateSlug
        );
        if (!current) return;
        fillForm({
          ...current,
          title: `${current.title} Copy`,
          slug: `${current.slug}-copy`,
          publish_status: "draft",
          is_published: false,
          reviewed_by_codee: ""
        });
        setStatus("Duplicated into the form as a new draft.");
      });
    });

    list.querySelectorAll("[data-publish-slug]").forEach((button) => {
      button.addEventListener("click", async () => {
        const current = (await window.MFTLivePrintableStore.loadRegistry()).records.find(
          (record) => record.slug === button.dataset.publishSlug
        );
        if (!current) return;
        const next = {
          ...current,
          is_published: !current.is_published,
          publish_status: current.is_published ? "draft" : "published",
          reviewed_by_codee: "Codee"
        };
        await window.MFTLivePrintableStore.saveOverride(next);
        setStatus(`${next.title} ${next.is_published ? "published" : "unpublished"} in local admin storage.`);
        renderList();
      });
    });
  };

  const hydrateAssetOptions = async () => {
    const registry = await window.MFTLivePrintableStore.loadRegistry();
    imageSelect.innerHTML = '<option value="">Choose an existing hosted asset</option>';
    registry.availableAssets.forEach((asset) => {
      const option = document.createElement("option");
      option.value = asset.image_url;
      option.textContent = asset.label;
      imageSelect.appendChild(option);
    });
  };

  titleInput?.addEventListener("input", () => {
    slugInput.value = window.MFTLivePrintableStore.slugify(titleInput.value);
  });

  imageSelect?.addEventListener("change", () => {
    imageInput.value = imageSelect.value;
    renderPreview(formToRecord());
  });

  form.addEventListener("input", () => renderPreview(formToRecord()));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const record = formToRecord();
    await window.MFTLivePrintableStore.saveOverride(record);
    setStatus(`${record.title} saved for Codee review with slug ${record.slug}.`);
    renderList();
  });

  document.getElementById("send-to-codee")?.addEventListener("click", async () => {
    const record = { ...formToRecord(), publish_status: "in_review" };
    await window.MFTLivePrintableStore.saveOverride(record);
    setStatus(`${record.title} sent to Codee for review.`);
    renderList();
  });

  document.getElementById("approve-printable")?.addEventListener("click", async () => {
    const record = { ...formToRecord(), publish_status: "approved", reviewed_by_codee: "Codee" };
    await window.MFTLivePrintableStore.saveOverride(record);
    setStatus(`${record.title} approved by Codee and ready for bucket publish.`);
    renderList();
  });

  document.getElementById("publish-printable")?.addEventListener("click", async () => {
    const record = { ...formToRecord(), is_published: true, publish_status: "published", reviewed_by_codee: "Codee" };
    await window.MFTLivePrintableStore.saveOverride(record);
    setStatus(`${record.title} marked published. Target URL: ${record.live_url}`);
    renderList();
  });

  (async () => {
    await hydrateAssetOptions();
    await renderList();
    if (querySlug) {
      const registry = await window.MFTLivePrintableStore.loadRegistry();
      const record = registry.records.find((item) => item.slug === querySlug);
      if (record) fillForm(record);
    } else {
      renderPreview(formToRecord());
    }
  })();
})();
