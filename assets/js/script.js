document.addEventListener('DOMContentLoaded', function() {
  const els = ['table', 'html', 'json']

  for (const el of els) {
    const $switch = document.getElementById(`js-${el}-preview`)
    const $container = document.getElementById(`js-${el}-preview-container`)

    const key = `preview-${el}`
    const stored = localStorage.getItem(key)
    if (stored !== null) {
      const checked = stored === 'true'
      $switch.checked = checked
    }

    function handlePreview() {
      if ($switch.checked) {
        $container.style.display = 'block'
      } else {
        $container.style.display = 'none'
      }
    }

    handlePreview()

    $switch.addEventListener('change', function() {
      handlePreview()
      localStorage.setItem(key, this.checked.toString())
    })
  }
})
