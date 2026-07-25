import getBaseStyles from "./styles";
import { escapeHtml } from "./helpers";

const openPrintDocument = ({
  title = "",
  fileName = "document",
  content = "",
}) => {
  const printWindow = window.open(
    "",
    "_blank",
    "width=1100,height=800"
  );

  if (!printWindow) {
    throw new Error(
      "Browserul a blocat fereastra pentru document. Permite ferestrele pop-up pentru acest site."
    );
  }

  printWindow.document.open();

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="ro">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
/>

<title>${escapeHtml(fileName)}</title>

<style>

${getBaseStyles()}

</style>

</head>

<body>

<main class="document">

${content}

</main>

<script>

window.addEventListener("load",function(){

document.title=${JSON.stringify(fileName)};

setTimeout(function(){

window.print();

},300);

});

</script>

</body>

</html>
`);

  printWindow.document.close();

  return printWindow;
};

export default openPrintDocument;
