import {createRoot, createComponent as C} from "@react";
import App from "./App.js";

createRoot(document.getElementById('root'))
    .render(C(App, {}))