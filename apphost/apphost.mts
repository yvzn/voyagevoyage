// Aspire TypeScript AppHost
// For more information, see: https://aspire.dev

import { createBuilder } from './.aspire/modules/aspire.mjs';

const builder = await createBuilder();

// Add your resources here:
await builder.addCSharpApp('server', '../server/VoyageVoyage.Server/VoyageVoyage.Server.csproj');

await builder.addJavaScriptApp('front', '../front')
    .withUrl("http://localhost:4200")
    .withRunScript('start');

await builder.build().run();

