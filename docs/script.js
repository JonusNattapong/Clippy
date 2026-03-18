document.addEventListener("DOMContentLoaded", () => {
  const docsWindow = document.getElementById("window-docs");
  const docsIframe = document.getElementById("docs-iframe");
  const docsLinks = document.querySelectorAll("#window-docs a[data-src]");

  const downloadLinks = {
    windowsX64: document.getElementById("download-windows-x64"),
    macosArm64: document.getElementById("download-macos-arm64"),
    linuxDebX64: document.getElementById("download-linux-deb-x64"),
    linuxRpmX64: document.getElementById("download-linux-rpm-x64"),
  };

  const installCommandTargets = {
    windowsX64: document.getElementById("install-shell-windows-x64"),
    macosArm64: document.getElementById("install-shell-macos-arm64"),
    linuxDebX64: document.getElementById("install-shell-linux-deb"),
    linuxRpmX64: document.getElementById("install-shell-linux-rpm"),
  };

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

  function getHref(element) {
    if (!(element instanceof HTMLAnchorElement)) {
      return null;
    }

    const href = element.getAttribute("href");
    if (!href || href === "#") {
      return null;
    }

    return href;
  }

  function setCommand(target, command) {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.textContent = command;
  }

  const linuxDebUrl = getHref(downloadLinks.linuxDebX64);
  const linuxRpmUrl = getHref(downloadLinks.linuxRpmX64);
  const macosArm64Url = getHref(downloadLinks.macosArm64);
  const windowsX64Url = getHref(downloadLinks.windowsX64);

  setCommand(
    installCommandTargets.linuxDebX64,
    linuxDebUrl
      ? `curl -fsSL "${linuxDebUrl}" -o /tmp/clippy.deb && sudo apt install -y /tmp/clippy.deb`
      : "Release link not available yet.",
  );

  setCommand(
    installCommandTargets.linuxRpmX64,
    linuxRpmUrl
      ? `curl -fsSL "${linuxRpmUrl}" -o /tmp/clippy.rpm && sudo rpm -Uvh /tmp/clippy.rpm`
      : "Release link not available yet.",
  );

  setCommand(
    installCommandTargets.macosArm64,
    macosArm64Url
      ? `tmpdir="$(mktemp -d)" && curl -fsSL "${macosArm64Url}" -o "$tmpdir/clippy.zip" && unzip -q "$tmpdir/clippy.zip" -d "$tmpdir" && open "$tmpdir"`
      : "Release link not available yet.",
  );

  setCommand(
    installCommandTargets.windowsX64,
    windowsX64Url
      ? `powershell -Command "$out='$env:TEMP\\Clippy.zip'; Invoke-WebRequest -Uri '${windowsX64Url}' -OutFile $out; Expand-Archive -Path $out -DestinationPath '$env:TEMP\\Clippy' -Force; Start-Process explorer '$env:TEMP\\Clippy'"`
      : "Release link not available yet.",
  );

  window.addEventListener("hashchange", scrollToHashTarget);
  scrollToHashTarget();
});
