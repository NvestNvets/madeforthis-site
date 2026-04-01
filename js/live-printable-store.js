(function () {
  const DATA_URL = "/assets/data/live-printables.json";
  const ADMIN_OVERRIDES_KEY = "mft_live_printable_admin_overrides_v1";

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const readOverrides = () => {
    try {
      const raw = localStorage.getItem(ADMIN_OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const writeOverrides = (records) => {
    localStorage.setItem(ADMIN_OVERRIDES_KEY, JSON.stringify(records));
  };

  const mergeRecords = (published, overrides) => {
    const map = new Map();
    published.forEach((record) => map.set(record.slug, record));
    overrides.forEach((record) => map.set(record.slug, record));
    return Array.from(map.values());
  };

  const normalizeRecord = (record, bucketBaseUrl) => {
    const slug = slugify(record.slug || record.title);
    return {
      printable_id: record.printable_id || `mft-${slug}`,
      title: record.title || "Untitled Printable",
      slug,
      subtitle: record.subtitle || "",
      description: record.description || "",
      category: record.category || "uncategorized",
      tags: Array.isArray(record.tags)
        ? record.tags
        : String(record.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
      type: record.type || "static-printable",
      image_url: record.image_url || "",
      template_type: record.template_type || "planner-static",
      field_config: Array.isArray(record.field_config) ? record.field_config : [],
      is_interactive: Boolean(record.is_interactive),
      is_published: Boolean(record.is_published),
      created_by: record.created_by || "Creator",
      reviewed_by_codee: record.reviewed_by_codee || "",
      publish_status: record.publish_status || "draft",
      created_at: record.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      live_url: `${bucketBaseUrl}/${slug}/`,
      bucket_path: `printables/${slug}/index.html`
    };
  };

  const loadRegistry = async () => {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    const data = await response.json();
    const bucketBaseUrl = data.bucketBaseUrl || "https://clients.digioffice.shop/printables";
    const published = (data.records || []).map((record) => normalizeRecord(record, bucketBaseUrl));
    const overrides = readOverrides().map((record) => normalizeRecord(record, bucketBaseUrl));
    return {
      bucketBaseUrl,
      availableAssets: data.availableAssets || [],
      published,
      overrides,
      records: mergeRecords(published, overrides)
    };
  };

  const saveOverride = async (record) => {
    const registry = await loadRegistry();
    const next = normalizeRecord(record, registry.bucketBaseUrl);
    const overrides = readOverrides().filter((item) => item.slug !== next.slug);
    overrides.unshift(next);
    writeOverrides(overrides);
    return next;
  };

  const removeOverride = (slug) => {
    const overrides = readOverrides().filter((item) => item.slug !== slug);
    writeOverrides(overrides);
  };

  window.MFTLivePrintableStore = {
    DATA_URL,
    slugify,
    readOverrides,
    writeOverrides,
    loadRegistry,
    saveOverride,
    removeOverride,
    normalizeRecord
  };
})();
