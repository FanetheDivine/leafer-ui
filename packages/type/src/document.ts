import { ILeaferBase } from '@leafer/interface'
import { addInteractionWindow } from './window'


export function document(leafer: ILeaferBase): void {
    addInteractionWindow(leafer)
    leafer.config.move.scroll = true
}
