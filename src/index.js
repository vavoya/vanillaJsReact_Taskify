import {createRoot, createComponent} from "/src/core/react.js";
import App from "./App.js";
const C = createComponent

createRoot(document.getElementById('root'))
    .render(C(App, {}))