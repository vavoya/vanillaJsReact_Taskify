import {createComponent as C, useRef, useState} from "@react";
import {li, h3, pre, span, div, button} from "@react/react-dom-element.js";
import Close from "@components/svg/Close.js";
import Edit from "@components/svg/Edit.js";
import Plus from "@components/svg/Plus.js";



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