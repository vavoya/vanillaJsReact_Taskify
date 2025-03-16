import {createComponent as C} from "@react";
import {svg, path} from "@react/react-dom-element.js";



export default function Plus({width = '14', height = '14', fill = '#A0A3BD'}) {

    return (
        C(svg, {
            width: width, height: height, viewBox: '0 0 14 14', fill: 'none', children: [
                C(path, {
                    d: "M14 7.99799H8V13.998H6V7.99799H0V5.99799H6V-0.00201416H8V5.99799H14V7.99799Z",
                    fill: fill
                })
            ]
        })
    )
}