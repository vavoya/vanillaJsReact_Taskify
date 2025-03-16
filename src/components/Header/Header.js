import {createComponent, useState} from "/src/core/react.js";
const C = createComponent
import {button, h1, header} from "/src/core/react-dom-element.js";
import Sort from "/src/components/svg/Sort.js";
import Commit from "/src/components/Commit/Commit.js";


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