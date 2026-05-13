(function () {
  const root = document.documentElement;
  const toggle = document.querySelector("[data-theme-toggle]");
  const icon = document.querySelector("[data-theme-icon]");

  function setIcon(theme) {
    if (icon) icon.textContent = theme === "dark" ? "☾" : "☼";
  }

  setIcon(root.dataset.theme);

  if (toggle) {
    toggle.addEventListener("click", function () {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = nextTheme;
      localStorage.setItem("limenaut-notes-theme", nextTheme);
      setIcon(nextTheme);
    });
  }
})();

