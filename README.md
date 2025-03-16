# 바닐라 JS로 React를 구현하고, 이를 사용하여 만든 Taskify 앱

## 프로젝트 소개
바닐라 JS 만으로 React 라이브러리를 구현하고,
해당 라이브러리(React)로 Taskify 프로젝트를 완성하고 Vercel에 배포가 되었습니다.

## 기술 스택
- JavaScript (Vanilla)
- VDOM (Virtual DOM)
- HTML, CSS
- Vercel: 배포

## 배포 링크
라이브 앱은 [여기](https://vanilla-js-react-taskify.vercel.app)에서 확인할 수 있습니다.

## 주요 기능
- 카드 추가: 새로운 카드를 생성하고 컬럼에 추가
- 카드 삭제: 카드 삭제
- 카드 정렬: 카드 순서를 변경
- 컬럼 추가: 새로운 컬럼을 추가
- 컬럼 삭제: 컬럼 삭제
- 커밋 기록: 수정 내역을 확인할 수 있는 기능

## React 구현
바닐라 JS로 구현한 React에 대해서 간단한 설명 파트입니다.

React 관련 코드는 [public/src/core](https://github.com/vavoya/vanillaJsReact_Taskify/tree/master/public/src/core)에서 확인 가능합니다.

### 렌더링
`renderPhase` + `commitPhase` 로 구성되어 있습니다.

#### renderPhase
렌더 페이즈는 VDOM의 노드들을 비교하면 변경점을 분류에 따라 객체내의 배열에 저장하는 역할입니다.

두 가지 상황에서 내부에 호출됩니다.
```js
createRoot(document.getElementById('root'))
    .render(C(App, {}))

/*---*/
    
setState()
```

객체는 아래와 같은 구조를 가집니다.
```js
const effectObj = {
        mount: new Set(), // element 생성
        update: new Set(), // element 속성 변경
        cleanup: new Set(), // cleanup 실행
        effect: new Set(), // useEffect 실행 - 마운트 할 때
        portalUnmount: new Set(), // portal 해제 목록
        portalMount: new Set(), // portal 등록 목록
        replace: new Set() // 부모가 자식 재정렬
    }
```

이렇게 저장된 VDOM node 간의 이전과 현재의 차이점을 분류하여 effectObj를 `commitPhase`에 넘기게 됩니다.

추가적으로, 노드간 비교하는 로직은 [여기서](https://github.com/vavoya/vanillaJsReact_Taskify/blob/master/public/src/core/compareNode.js) 확인가능합니다.

비교는 `if` 문으로 분리되며, 각 로직은 모듈내의 함수를 import 하여 사용하게 되어있습니다.
```js
while (pNodeStack.length > 0 || nNodeStack.length > 0) {
        const [pNode, nNode] = [pNodeStack.pop(), nNodeStack.pop()]
        if (pNode != null && nNode != null) {
            if (pNode.type in tagObj) {
                if (nNode.type in tagObj) {
                    compareElements(pNode, nNode, pNodeStack, nNodeStack, effectObj)
                }
                else if (nNode.type === 'function') {
                    compareElementFunc(pNode, nNode, pNodeStack, nNodeStack, effectObj)
                }
```

#### commitPhase
`effectObj` 객체를 우선순위에 따라 dom 조작을 실행 또는 로직을 실행하는 페이즈 입니다.

이러한 로직으로 구성됩니다.
```js
function commitPhase(effectObj) {
    effectObj.cleanup.forEach((node) => {
        executeCleanup(node)
    })

    effectObj.update.forEach(([pNode, nNode]) => {
        executeUpdate(pNode, nNode)
    })

    effectObj.mount.forEach((node) => {
        executeMount(node)
    })

    effectObj.replace.forEach((node) => {
        executeReplace(node)
    })

    effectObj.portalUnmount.forEach((node) => {
        executePortalUnmount(node)
    })

    effectObj.portalMount.forEach((node) => {
        executePortalMount(node)
    })

    effectObj.effect.forEach((node) => {
        executeEffect(node)
    })
}
```

우선순위에 맞춰 실행하게 됩니다. (언마운트 이전에 useEffect의 cleanup 함수, 마운트 이후 useEffect 콜백)

### 비교
VDOM의 node를 비교할 때는 형제들과의 index와 key를 기준으로 비교할 수 있어야합니다.

이러한 과정은 이전과 현재의 node가 아닌, 그들 node의 자식 node들을 탐색하여 구분합니다.

```js
function diffChildren(pNode, nNode, pNodeStack, nNodeStack, effectObj) {
    if (pNode?.children?.length > 0 && nNode?.children?.length > 0) {
        const pNodeChildSet = new Set(pNode.children)

        reverseForEach(nNode.children, (nChild, i) => {
            nChild.parent = nNode

            if (nChild.key != null) {
                const pChild = pNode.children.find(child => child.key === nChild.key)
                // 동일한 키
                if (pChild) {
                    pNodeChildSet.delete(pChild)
                    pNodeStack.push(pChild)
                    nNodeStack.push(nChild)

                    // index가 nChild와 동일하지 않으면
                    if (pNode.children[i] !== pChild) {
                        const parent = findParentElement(nNode)
                        if (parent !== 'portal') {
                            effectObj.replace.add(parent)
                        }
                    }
                }
                // 동일한 키 없음
                else {
                    pNodeStack.push(null)
                    nNodeStack.push(nChild)

                    const parent = findParentElement(nNode)
                    if (parent !== 'portal') {
                        effectObj.replace.add(parent)
                    }
                }
            }
            // nChild가 index 기반
            else {
                const pChild = pNode.children[i]
                // 같은 index의 pChild 존재 && key가 없어야 한다.
                if (pChild?.key == null) {
                    pNodeChildSet.delete(pChild)
                    pNodeStack.push(pChild)
                    nNodeStack.push(nChild)
                }
                else {
                    pNodeStack.push(null)
                    nNodeStack.push(nChild)
                }
            }
        })

        pNodeChildSet.forEach(pChild => {
            // 선택받지 못한 자는 삭제될 준비를 (클린업, portal 등)
            const parent = findParentElement(nNode)
            if (parent !== 'portal') {
                effectObj.replace.add(parent)
            }

            pNodeStack.push(pChild)
            nNodeStack.push(null)
        })
    }
    // pNode 자식 없음
    else if (nNode?.children?.length > 0) {
        reverseForEach(nNode.children, nChild => {
            nChild.parent = nNode

            pNodeStack.push(null)
            nNodeStack.push(nChild)
            if (pNode != null) {
                const parent = findParentElement(nNode)
                if (parent !== 'portal') {
                    effectObj.replace.add(parent)
                }
            }
        })
    }
    // nNode 자식 없음
    else if (pNode?.children?.length > 0) {
        if (nNode != null && nNode.type in tagObj) {
            const parent = findParentElement(nNode)
            if (parent !== 'portal') {
                effectObj.replace.add(parent)
            }
        }

        pNode.children.forEach(pChild => {
            pNodeStack.push(pChild)
            nNodeStack.push(null)
        })
    }
    // 둘 다 자식 없음 ㅠㅠ
    else {

    }
}
```

### hook
현재 구현된 hook 은 `useState`, `useEffect`, `useRef` 입니다.

기능은 기존 React 와 동일하게 구현되어있습니다.

이 hook 들은 객체이며, 서로 다른 구조를 가지고 있습니다.

그리고 React 에서는 이러한 hook 들을 node 내에서 연결리스트로 관리하지만, 저는 단순 배열로 구현해서 코드의 복잡도를 낮췄습니다.

#### useState
`useState` 입니다.

여기서 핵심은 `setState`에 `this 바인딩`을 사용하여 setState를 반환하는 것입니다.

이러한 구조는, 바인딩된 객체의 node 만 변경하여, 똑같은 함수 참조를 넘겨주지만 다른 node 로 설정이 가능하게 해줍니다.

따라서, 어떠한 경우에도 `setState`의 참조 값이 달라지는 일이 생기지 않습니다.

```js
function useState(initialValue) {
    const node = currentNode
    let state = node.hook[node.hookIndex++]
    // 마운트
    if (state == null){
        state = {
            value: initialValue,
            obj: {node},
            setState: null,
        }
        state.obj.state = state
        state.setState = setState.bind(state.obj)
        node.hook.push(state)

        return [state.value, state.setState]
    }
    else {
        state.obj.node = node
        return [state.value, state.setState]
    }
}
```

#### useEffect
`useEffect` 입니다.

의존성 배열을 비교하고 함수 실행을 예약하거나 또는 함수를 등록합니다.

```js
function useEffect(effect, dependencies = []) {
    const node = currentNode
    let state = node.hook[node.hookIndex++]
    // 마운트
    if (state == null){
        state = {
            effect,
            dependencies,
            cleanup: null,
        }
        node.hook.push(state)
    }
    else {
        if (
            state.dependencies?.length > 0 && // 의존성 배열이 정의된 경우
            (
                state.dependencies.length !== dependencies.length || // 배열 길이가 다르거나
                !state.dependencies.every((value, index) => value === dependencies[index]) // 값이 다를 때
            )
        ) {
            state.effect = effect
            state.dependencies = dependencies
            useEffectStack.push(state); // 콜백 실행
        }
    }
}
```

#### useRef
리렌더링이 되어도 값이 유지되도록 하는 `useRef` 입니다.

```js
function useRef(initialValue = null) {
    const node = currentNode
    let state = node.hook[node.hookIndex++]

    // 마운트
    if (state == null){
        state = {
            ref: {current: initialValue},
        }
        node.hook.push(state)

        return state.ref
    }
    else {
        return state.ref
    }
}
```

### setState
구현을 하다보니 `setState`가 React의 핵심이라고 판단되어서 따로 챕터를 만들었습니다.

`setState`의 배치처리가 일부 구현되어있습니다. 

아래의 순서로 동작합니다.
1. `setState` 가 호출되면 스택에 저장하고, 다음 작업을 분리하여 예약한다. (await Promise)
2. 이벤트 루프 종료가 되면 promise 로 분리된 `setState`의 다음 작업(2)이 실행된다.
3. 해당 작업은 `setState`를 부모-자식간에 하나의 작업으로 묶는 역할을 한다. 그리고 state 값을 적용한다.
4. 마지막 작업(3)이 실행되고 배치처리된 작업을 기준으로 실행된다.
5. `setState`의 시작지점을 기준으로 트리를 탐색하여 render, commitPhase를 진행한다.

명칭에 일부 이상함이 있을 수 있습니다.

```js
let setStateMap = new Map()
async function setState(newValue) {

    // 값이 같으면
    if (this.state.value === newValue) {
        return
    }

    // setState 배치 처리를 위한 callStack
    if (setStateMap.has(this.node)) {
        setStateMap.get(this.node).push({
            state: this.state,
            newValue: newValue
        })
    }
    else {
        setStateMap.set(this.node, [{
            state: this.state,
            newValue: newValue
        }])
    }

    // 작업 분리
    await Promise.resolve();

    // 여기서 부터는 전혀 다른 영역
    // 위의 동기 영역의 값을 가져다 쓰면 안된다.
    if (setStateMap.size === 0) {
        return
    }

    const setStateStack = []
    setStateMap.forEach((array, node) => {
        let parent = node.parent
        // 부모를 찾을 때 까지 || null이 아닐 때 까지
        while (!setStateMap.has(parent) && parent != null) {
            parent = parent.parent
        }

        // 상태 갱신
        array.forEach(({state, newValue}) => {
            state.value = newValue
        })

        // 부모를 못찾았다.
        if (parent == null) {
            setStateStack.push(node)
        }
        else {
        }
    })
    setStateMap.clear()

    const commitStack = []

    // 연속적인 렌더 작업
    setStateStack.forEach(node => {
        const pNodeRoot = node
        const nNodeRoot = {...node, children: []}
        const pIndex = pNodeRoot.parent.children.findIndex((child) => child === pNodeRoot)
        nNodeRoot.parent.children[pIndex] = nNodeRoot
        const effectObj = renderPhase(pNodeRoot, nNodeRoot)

        // 자식 element 찾기
        let pChild = pNodeRoot.children[0]
        while (!(pChild.type in tagObj)) {
            pChild = pChild.children[0]
        }
        let nChild = nNodeRoot.children[0]
        while (!(nChild.type in tagObj)) {
            nChild = nChild.children[0]
        }
        // 부모 element 찾기
        let parent = node.parent
        while (!(parent.type in tagObj)) {
            parent = parent.parent
        }
        commitStack.push([effectObj, parent, pChild, nChild])

    })
    setStateStack.length = 0

    // 커밋 작업
    commitStack.forEach(([effectObj, parent, pChild, nChild]) => {
        commitPhase(effectObj)
        parent.stateNode.replaceChild(pChild.stateNode, nChild.stateNode)

        // dom 렌더링 사이클 이후에 바로 실행
        requestAnimationFrame(() => {
            while (useEffectStack.length > 0) {
                const effect = useEffectStack.pop()

                if (typeof effect.cleanup === 'function') {
                    effect.cleanup()
                }

                if (typeof effect.effect === 'function') {
                    effect.cleanup = effect.effect()
                }
            }
        })
    })

    commitStack.length = 0
}
```

### 이벤트 처리
React 와 유사한 이벤트 처리를 위해 이벤트 위임(Event Delegation)과 `WeakMap`을  사용하여 이벤트 관리를 구현했습니다.

#### 1. 이벤트 위임
각 노드에 이벤트를 할당하는 것이 아닌, root 요소에만 이벤트를 할당하여 처리하는 방식입니다.

캡처링과 버블링 또한 내부적으로 직접 구현해야하는 문제가 있습니다.

현재는 버블링에 따른 이벤트 실행 순서가 보장됩니다.

#### 2. WeakMap
`WeakMap` 은 객체를 key로하여 값을 저장할 수 있는 객체입니다.

여기서는 node의 주소가 key가 되고, 등록한 이벤트 핸들러가 value가 됩니다.

여기서 또 `WeakMap` 의 특징이 사용되는데, node가 만약 메모리 상에서 지워지면, `WeakMap` 은 GC(가비지 컬렉션)로 알아서 처리해준다는 점입니다.

따라서 node가 사라짐에 따른 이벤트 핸들러의 삭제를 따로 구현하지 않아도 되는 편리함이 있습니다.

```js
const onClickMap = new WeakMap();
const onOuterClickMap = new WeakMap();
const onDoubleClickMap = new WeakMap();
const onMouseOverMap = new WeakMap();
const onMouseOutMap = new WeakMap();
const onMouseMoveMap = new WeakMap();
const onMouseDownMap = new WeakMap();
const onMouseUpMap = new WeakMap();
const onInputMap = new WeakMap();
const onKeyDownMap = new WeakMap();
const onDragStartMap = new WeakMap();
const onDragEnterMap = new WeakMap();
const onDragEndMap = new WeakMap();
const onSelectStartMap = new WeakMap();

function eventHandler(e, eventMap) {
    let element = e.target
    // 버블링만
    while (element.id !== 'root') {
        const eventHandler = eventMap.get(element)
        if (typeof eventHandler === 'function') {
            const stopP = eventHandler({
                event: e,
                target: element,
            })
            if (stopP === true) {
                break
            }
        }
        element = element.parentNode
    }
}

const onMouseOverSet = new Set();
const onMouseOutSet = new Set();
function mouseOnOutHandler(e) {
    let element = e.target
    while (element.id !== 'root') {
        // 등록된 것 찾기
        const eventHandler = onMouseOverMap.get(element)
        if (typeof eventHandler === 'function' && !onMouseOverSet.has(element)) {
            eventHandler({
                event: e,
                target: element,
            })
        }

        onMouseOutSet.delete(element)
        element = element.parentNode
    }

    onMouseOverSet.clear()
    onMouseOutSet.forEach(element => {
        const eventHandler = onMouseOutMap.get(element)
        eventHandler({
            event: e,
            target: element,
        })
    })
    onMouseOutSet.clear()

    element = e.target
    while (element.id !== 'root') {
        let eventHandler = onMouseOverMap.get(element)
        if (typeof eventHandler === 'function') {
            onMouseOverSet.add(element)
        }
        eventHandler = onMouseOutMap.get(element)
        if (typeof eventHandler === 'function') {
            onMouseOutSet.add(element)
        }
        element = element.parentNode
    }
}


export {
    onClickMap,
    onOuterClickMap,
    onDoubleClickMap,
    onMouseOverMap,
    onMouseOutMap,
    onMouseMoveMap,
    onInputMap,
    onKeyDownMap,
    onDragStartMap,
    onDragEnterMap,
    onDragEndMap,
    onMouseDownMap,
    onMouseUpMap,
    onSelectStartMap,
    eventHandler,
    mouseOnOutHandler,
}
```

코드를 보시면 이벤트 함수가 2개가 나와있습니다.

상단의 것은 기본적인 이벤트 처리이며,

하단의 것은 mouseOver, out을 제가 직접 따로 구현한 것 입니다.

### React 를 활용한 개발
JSX 문법만 제외하면 기존 React 와 유사한 방식으로 개발이 가능합니다.

아래는 프로젝트 코드의 일부 입니다.

```js
// index.js
import {createRoot, createComponent as C} from "@react";
import App from "./App.js";

createRoot(document.getElementById('root'))
    .render(C(App, {}))
```

```js
// Column.js
import {createComponent as C, useRef, useState, useEffect, createPortal} from "@react";
import {div, button, span, li, h2, ul} from "@react/react-dom-element.js";
import Button from "./components/IconButton.js";
import Card from "@components/Card/Card.js";
import Modal from "@components/Modal/Modal.js";
import {sendMessage} from "@lib/componentSocket.js";


export default function Column({taskify, columnIndex, updateMain, updateTop}) {
    const [_, update] = useState(Symbol());
    const column = taskify.current.columnList[columnIndex];
    const {cardList} = column;
    const ref = useRef();

    useEffect(() => {
        updateTop()
    }, [cardList.length])

    return (
        C(li, {className: 'column', children: [
                C(Header, {taskify, columnIndex, updateMain: updateMain, updateColumn: update}),
                C(ul, {ref, className: 'cardList', children:
                        cardList.map((card, i) => {
                            const {key} = card;
                            return C(Card, {key, taskify, columnIndex, cardIndex: i, updateTop, updateMain: updateMain, updateColumn: update});
                        })
                }),]})
    )
}


function Header({taskify, columnIndex, updateMain, updateColumn}) {
    const [_, update] = useState(Symbol());
    const h2Ref = useRef();
    const contentEditable = useRef(false);
    const modalOpen = useRef(false)

    const column = taskify.current.columnList[columnIndex];

    useEffect(() => {
        const root = document.getElementById('root')

        const eventListener = (e) => {
            if (e.target !== h2Ref.current) {
                contentEditable.current = false

                if (h2Ref.current.textContent) {
                    column.title = h2Ref.current.textContent;
                    sendMessage(1, {type: 3, data: [taskify.current.columnList[columnIndex].title], time: new Date()})
                    update(Symbol());
                }
                else {
                    console.log(h2Ref.current.textContent, contentEditable.current)
                    h2Ref.current.textContent = column.title;
                }
            }
        }

        if (contentEditable.current) {
            h2Ref.current.focus();
            root.addEventListener('click', eventListener)
        }

        return () => {
            root.removeEventListener('click', eventListener)
        }
    }, [contentEditable.current]);

    const keyDown = (e) => {
        if (e.event.key === 'Enter') {
            e.event.preventDefault()
        }
    }

    const doubleClick = () => {
        contentEditable.current = true
        update(Symbol());
    }

    const addCard = () => {
        const newCard = createCard(column.nextKey++)
        column.cardList.push(newCard)
        sendMessage(1, {type: 5, data: [taskify.current.columnList[columnIndex].title, newCard.title], time: new Date()})
        updateColumn(Symbol())
    }

    const removeColumn = () => {
        sendMessage(1, {type: 1, data: [taskify.current.columnList[columnIndex].title], time: new Date()})
        taskify.current.columnList.splice(columnIndex, 1)
        updateMain(Symbol())
    }

    const openModal = () => {
        modalOpen.current = true
        update(Symbol())
    }

    const closeModal = () => {
        modalOpen.current = false
        update(Symbol())
    }

    return (
        C(div, {className: 'columnHeader', children: [
                C(div, {className: 'columnHeader_textArea', children: [
                        C(h2, {ref: h2Ref, onKeyDown: keyDown,  onDoubleClick: doubleClick, contentEditable: contentEditable.current, children: [column.title]}),
                        C(div, {children: [`${column.cardList.length}`]})]}),
                C(div, {className: 'columnHeader_iconButtons', children: [
                        C(Button, {onClick: addCard, type:3}),
                        C(Button, {onClick: openModal, type:1}),]}),
                modalOpen.current ? createPortal(C(Modal, {type: `리스트[제목: ${column.title}]`, onAct: removeColumn, onCancel: closeModal}), document.body) : null
            ]})
    )
}


const createCard = (key) => {
    return {
        key: key,
        title: `새로운 카드${key}`,
        text: "내용을 입력하세요",
        date: new Date(),
    }
}
```

### 추가적인 내용
`createPortal` 구현

`createMemo` 미완

컴포넌트 간의 상태 공유를 위한 컴포넌트 소켓 함수 (Commit.js에 사용)

