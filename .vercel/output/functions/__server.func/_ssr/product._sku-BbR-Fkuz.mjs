import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Route$5 } from "./router-CMhCLoa6.mjs";
import { s as ProductBody } from "./customer-pKCr0Vdq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product._sku-BbR-Fkuz.js
var import_jsx_runtime = require_jsx_runtime();
function ProductPage() {
	const { sku } = Route$5.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductBody, { sku });
}
//#endregion
export { ProductPage as component };
