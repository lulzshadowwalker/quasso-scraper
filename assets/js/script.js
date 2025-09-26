document.addEventListener("DOMContentLoaded", function () {
  const els = ["table", "html", "json"];

  for (const el of els) {
    const $switch = document.getElementById(`js-${el}-preview`);
    const $container = document.getElementById(`js-${el}-preview-container`);

    const key = `preview-${el}`;
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      const checked = stored === "true";
      $switch.checked = checked;
    }

    function handlePreview() {
      if ($switch.checked) {
        $container.style.display = "block";
      } else {
        $container.style.display = "none";
      }
    }

    handlePreview();

    $switch.addEventListener("change", function () {
      handlePreview();
      localStorage.setItem(key, this.checked.toString());
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const $form = document.getElementById("js-form");
  $form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const $input = document.getElementById("js-input");

    if ($input.value.trim() === "") {
      toaster.toast("No input provided", "Please please a URL to scrape.");
      return;
    }

    const query = encodeURIComponent($input.value.trim());
    const response = await fetch(`/scrape?url=${query}`);
    if (!response.ok) {
      const message = await response.text();
      toaster.toast("Failed to scrape URL", message);
      return;
    }

    const data = await response.json();
    const html = data.html || "";
    const json = data.data || "{}";

    toaster.toast("Scrape successful", "The URL was scraped successfully.");
    document.querySelector("#js-html-code pre code").textContent = html;
    document.querySelector("#js-json-code pre code").textContent =
      JSON.stringify(json, null, 2);

    document.querySelectorAll("[data-highlighted]").forEach((element) => {
      element.removeAttribute("data-highlighted");
    });
    hljs.highlightAll();
  });
});
