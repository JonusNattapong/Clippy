document.addEventListener("DOMContentLoaded", () => {
  const docsWindow = document.getElementById("window-docs");
  const docsIframe = document.getElementById("docs-iframe");
  const docsLinks = document.querySelectorAll("#window-docs a[data-src]");

  function scrollToHashTarget() {
    const { hash } = window.location;
    if (!hash) {
      return;
    }

    const target = document.querySelector(hash);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  docsLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const src = link.getAttribute("data-src");
      if (!docsIframe || !src) {
        return;
      }

      event.preventDefault();
      docsIframe.setAttribute("src", src);
      docsWindow?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState({}, "", "#window-docs");
    });
  });

  window.addEventListener("hashchange", scrollToHashTarget);
  scrollToHashTarget();
});
