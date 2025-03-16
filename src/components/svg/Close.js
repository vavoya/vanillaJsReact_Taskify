import {createComponent} from "/src/core/react.js";
import {svg, path} from "/src/core/react-dom-element.js";

const C = createComponent


export default function Close({width = '12', height = '12', fill = "#A0A3BD"}) {

    return (
        C(svg, {
            width: width,
            height: height,
            viewBox: "0 0 12 12",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            children: [
                C(path, {
                    d: "M1.2 12L0 10.8L4.8 6L0 1.2L1.2 0L6 4.8L10.8 0L12 1.2L7.2 6L12 10.8L10.8 12L6 7.2L1.2 12Z",
                    fill: fill
                })
            ]
        })
    )
}