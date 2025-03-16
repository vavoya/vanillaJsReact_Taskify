import {createComponent, useRef, useState} from "/src/core/react.js";
const C = createComponent
import {li, h3, pre, span, div, button} from "/src/core/react-dom-element.js";
import Close from "/src/components/svg/Close.js";
import Edit from "/src/components/svg/Edit.js";
import Plus from "/src/components/svg/Plus.js";



export default function Button({onClick = undefined, type}) {
    const [hover, setHover] = useState(false)

    const mouseOut = (e) => {
        setHover(false)
    }

    const mouseOver = () => {
        setHover(true)
    }

    const renderSVG = () => {
        switch (type) {
            case 1:
                return C(Close, {fill: hover ? 'red' : undefined})
            case 2:
                return C(Edit, {stroke: hover ? 'blue' : undefined})
            case 3:
                return C(Plus, {fill: hover ? 'blue' : undefined})
        }
    }

    return (
        C(button, {onClick, className: 'iconButton', onMouseOver: mouseOver, onMouseOut: mouseOut, children: [
                renderSVG(),]})
    )
}