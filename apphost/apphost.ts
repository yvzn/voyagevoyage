// Aspire TypeScript AppHost
// For more information, see: https://aspire.dev

import { createBuilder } from './.modules/aspire.js';

const builder = await createBuilder();

// Add your resources here, for example:
await builder.addCSharpApp('server', '../server/VoyageVoyage.Server/VoyageVoyage.Server.csproj');
await builder.addJavaScriptApp('front', '../front')
    .withUrl("http://localhost:4200")
    .withRunScript('start');
await builder.addAzureCosmosDB('voyagevoyage')
    .runAsEmulator();

await builder.build().run();
