(function () {
  const printButtons = document.querySelectorAll("[data-print-button]");
  if (!printButtons.length) return;

  const preparePrint = () => {
    document.body.classList.add("print-prep");
    if (window.MFTQr) window.MFTQr.refresh();
  };

  const clearPrint = () => {
    document.body.classList.remove("print-prep");
  };

  printButtons.forEach((button) => {
    button.addEventListener("click", () => {
      preparePrint();
      window.print();
      window.setTimeout(clearPrint, 300);
    });
  });

  window.addEventListener("beforeprint", preparePrint);
  window.addEventListener("afterprint", clearPrint);
})();
