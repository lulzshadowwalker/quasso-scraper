document.addEventListener("DOMContentLoaded", function () {
  const previewTypes = ["table", "html", "json"];

  previewTypes.forEach((type) => {
    const $switch = document.getElementById(`js-${type}-preview`);
    const $container = document.getElementById(`js-${type}-preview-container`);

    const key = `preview-${type}`;
    if ($switch && $container) {
      $switch.checked = localStorage.getItem(key) === "true";
      $container.style.display = $switch.checked ? "block" : "none";
      $switch.addEventListener("change", function () {
        $container.style.display = $switch.checked ? "block" : "none";
        localStorage.setItem(key, $switch.checked.toString());
      });
    }
  });

  const $form = document.getElementById("js-form");
  if ($form) {
    $form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const $input = document.getElementById("js-input");
      if (!$input || $input.value.trim() === "") {
        toaster.toast("No input provided", "Please provide a URL to scrape.");
        return;
      }

      try {
        const query = encodeURIComponent($input.value.trim());

        const response = await fetch(`/scrape?url=${query}`);
        if (!response.ok) {
          const message = await response.text();
          toaster.toast("Failed to scrape URL", message);
          return;
        }

        const data = await response.json();

        document.querySelector("#js-html-code pre code").textContent =
          data.html || "";

        document.querySelector("#js-json-code pre code").textContent =
          JSON.stringify(data.data || {}, null, 2);

        toaster.toast("Scrape successful", "The URL was scraped successfully.");

        document
          .querySelectorAll("[data-highlighted]")
          .forEach((el) => el.removeAttribute("data-highlighted"));
        hljs.highlightAll();
      } catch (err) {
        console.error(err);
        toaster.toast("Error", "An unexpected error occurred.");
      }
    });
  }
});
