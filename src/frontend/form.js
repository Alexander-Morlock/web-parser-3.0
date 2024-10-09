const forms = document.querySelectorAll("form")

forms.forEach((form) => {
  const input = form.querySelector('input[type="file"]')

  input.addEventListener("input", (e) => {
    const filename = e.target.files[0].name

    if (filename.endsWith(".xlsx")) {
      form.submit()
    }
  })
})
