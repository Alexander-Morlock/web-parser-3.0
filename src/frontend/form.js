"strict mode"

const form = document.querySelector("form")
const input = document.querySelector("#file")

input.addEventListener("input", (e) => {
  const filename = e.target.files[0].name
  if (`${filename}`.endsWith(".xlsx")) {
    form.submit()
  }
})
