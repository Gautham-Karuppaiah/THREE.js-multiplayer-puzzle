
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

export function getOpposite(slot) {
    if (slot === '1') return '0'
    if (slot === '0') return '1'
    if (slot === '2') return '2'
    if (slot === 'top') return 'bottom'
    if (slot === 'bottom') return 'top'
    if (slot === 'left') return 'right'
    if (slot === 'right') return 'left'
    return slot
}
