import React from "react";
import ReactPDF from "@react-pdf/renderer";
import * as fs from "fs";
import * as path from "path";
import { BrandCisDocument } from "./cis/BrandCisDocument";

async function main() {
  console.log("Generating Linus Brand CIS & UI Design System PDF...");
  const element = React.createElement(BrandCisDocument);
  
  const publicOut = path.resolve("public/Linus_Brand_CIS_UI_Manual.pdf");
  await ReactPDF.renderToFile(element, publicOut);
  console.log(`✓ PDF successfully written to ${publicOut} (${(fs.statSync(publicOut).size / 1024).toFixed(1)} KB)`);

  const docsDir = path.resolve("docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  const docsOut = path.resolve("docs/Linus_Brand_CIS_UI_Manual.pdf");
  fs.copyFileSync(publicOut, docsOut);
  console.log(`✓ Duplicate written to ${docsOut}`);
}

main().catch(err => {
  console.error("Error generating CIS PDF:", err);
  process.exit(1);
});

