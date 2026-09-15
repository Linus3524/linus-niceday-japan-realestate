import React from "react";
import { Document } from "@react-pdf/renderer";
import { Page1 } from "./Page1";
import { Page2 } from "./Page2";
import { Page3 } from "./Page3";
import { Page4 } from "./Page4";
import { Page5 } from "./Page5";
import { Page6 } from "./Page6";

export const BrandCisDocument: React.FC = () => (
  <Document
    title="Linus 好日不動產 CIS / UI 視覺系統規範手冊"
    author="Linus 好日不動產"
    subject="Brand CIS / UI Design System Specification v2.0"
  >
    <Page1 />
    <Page2 />
    <Page3 />
    <Page4 />
    <Page5 />
    <Page6 />
  </Document>
);

