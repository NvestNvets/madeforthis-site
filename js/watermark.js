(function () {
  const watermark = document.querySelector(".corner-watermark");
  if (!watermark) return;

  const delay = Number(document.body.getAttribute("data-watermark-delay") || 3000);
  window.setTimeout(() => {
    document.body.classList.add("watermark-visible");
  }, delay);
})();
