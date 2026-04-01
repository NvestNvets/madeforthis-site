(function () {
  const buildQrUrl = (target) => {
    const endpoint = "https://api.qrserver.com/v1/create-qr-code/";
    const params = new URLSearchParams({
      size: "180x180",
      margin: "0",
      format: "svg",
      data: target
    });
    return `${endpoint}?${params.toString()}`;
  };

  const refresh = () => {
    document.querySelectorAll(".qr-image[data-qr-target]").forEach((image) => {
      const target = image.getAttribute("data-qr-target");
      if (!target) return;
      image.src = buildQrUrl(target);
    });
  };

  window.MFTQr = { refresh };
  refresh();
})();
