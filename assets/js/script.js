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

      const $button = $form.querySelector("button[type='submit']");
      $button.disabled = true;
      const originalText = $button.textContent;
      $button.innerHTML = `<span class="inline-block w-3 h-3 border-2 border-white border-b-transparent rounded-full animate-spin"></span> Scraping...`;

      try {
        const query = encodeURIComponent($input.value.trim());

        const response = await fetch(`/scrape?url=${query}`);
        if (!response.ok) {
          const message = await response.text();
          toaster.toast("Failed to scrape URL", message);
          return;
        }

        const data = await response.json();

        const menuData = extractMenuData(data.data || {});
        updateTable(menuData);

        document.querySelector("#js-html-code pre code").textContent =
          prettifyHtml(data.html || "");

        document.querySelector("#js-json-code pre code").textContent =
          JSON.stringify(menuData, null, 2);

        toaster.toast("Scrape successful", "The URL was scraped successfully.");

        document
          .querySelectorAll("[data-highlighted]")
          .forEach((el) => el.removeAttribute("data-highlighted"));
        hljs.highlightAll();
      } catch (err) {
        console.error(err);
        toaster.toast("Error", "An unexpected error occurred.");
      } finally {
        $button.disabled = false;
        $button.textContent = originalText;
      }
    });
  }

  function prettifyHtml(html) {
    const options = {
      indent_size: 2,
      end_with_newline: true,
      indent_inner_html: true,
      wrap_line_length: 80,
    };

    return html_beautify(html, options);
  }

  function extractMenuData(rawData) {
    const menuData = {
      restaurant: null,
      categories: [],
      items: [],
    };

    if (rawData.props?.pageProps?.initialMenuState?.restaurant) {
      const restaurant = rawData.props.pageProps.initialMenuState.restaurant;
      menuData.restaurant = {
        name: restaurant.name || "",
        logo: restaurant.logo || "",
        heroImage: restaurant.heroImage || "",
      };
    }

    const initialMenuState =
      rawData.props?.pageProps?.initialMenuState?.menuData;
    if (initialMenuState) {
      if (initialMenuState.categories) {
        initialMenuState.categories.forEach((category) => {
          const cleanCategory = {
            id: category.id,
            name: category.name || "",
            itemCount: category.items ? category.items.length : 0,
          };
          menuData.categories.push(cleanCategory);

          if (category.items) {
            category.items.forEach((item) => {
              menuData.items.push(sanitizeItem(item));
            });
          }
        });
      }

      if (initialMenuState.filteredCategories) {
        initialMenuState.filteredCategories.forEach((category) => {
          if (category.items) {
            category.items.forEach((item) => {
              menuData.items.push(sanitizeItem(item));
            });
          }
        });
      }

      if (initialMenuState.items) {
        initialMenuState.items.forEach((item) => {
          menuData.items.push(sanitizeItem(item));
        });
      }
    }

    return menuData;
  }

  function sanitizeItem(item) {
    return {
      id: item.id || "",
      name: item.name || "",
      description: item.description || "",
      price: item.price || 0,
      image: item.image || item.originalImage || "",
      rating: item.rating || 0,
      category: item.sectionName || item.originalSection || "",
      hasChoices: item.hasChoices || false,
    };
  }

  function updateTable(menuData) {
    const tableBody = document.querySelector("#js-table tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    menuData.items.forEach((item) => {
      const row = document.createElement("tr");
      row.className = "border-b border-gray-200 hover:bg-gray-50";

      row.innerHTML = `
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.name}" class="w-10 h-10 rounded object-cover">`
                : ""
            }
            <div>
              <div class="font-medium">${item.name}</div>
              ${
                item.description
                  ? `<div class="text-sm text-gray-500 truncate max-w-xs">${item.description}</div>`
                  : ""
              }
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-sm">${item.category}</td>
        <td class="px-4 py-3 text-sm font-medium">$${item.price.toFixed(2)}</td>
        <td class="px-4 py-3 text-sm">
          ${
            item.rating > 0
              ? `<span class="flex items-center gap-1">⭐ ${item.rating}</span>`
              : "-"
          }
        </td>
        <td class="px-4 py-3 text-sm">
          ${
            item.hasChoices
              ? '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Has Options</span>'
              : "-"
          }
        </td>
      `;

      tableBody.appendChild(row);
    });

    const footer = document.querySelector("#js-table tfoot tr");
    if (footer) {
      footer.innerHTML = `
        <th class="px-4 py-3 text-left">${menuData.items.length} items</th>
        <th class="px-4 py-3"></th>
        <th class="px-4 py-3"></th>
        <th class="px-4 py-3"></th>
        <th class="px-4 py-3"></th>
      `;
    }
  }
});
