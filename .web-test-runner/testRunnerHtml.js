export const testRunnerHtml = (testFramework) => `
  <!DOCTYPE html>
  <html lang="es-ES">
    <head>
      <meta charset="utf-8"/>
      <meta http-equiv="x-ua-compatible" content="IE=edge,chrome=1"/>
      <meta name="viewport"
            content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
    </head>
    <body>
      <script type="module" src="${testFramework}"></script>
    </body>
  </html>
`;
