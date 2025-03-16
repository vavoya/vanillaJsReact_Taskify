import {createComponent as C, useState} from "@react";
import {button, h1, header} from "@react/react-dom-element.js";
import Sort from "@components/svg/Sort.js";
import Commit from "@components/Commit/Commit.js";


export default function Header({latest, updateTop}) {
    const [_, update] = useState(Symbol());

    const click = () => {
        latest.current = !latest.current
        updateTop()
        update(Symbol());
    }

    return (
        C(header, {className: "header", children: [
                C(h1, {children: [
                        'TASKIFY'
                    ]}),
                C(button, {onClick: click, children: [
                        C(Sort, {}),
                        latest.current ? '최신 순' : '생성 순']}),
                C(Commit, {})
            ]})
    )
}