import { IBoundsData, ISizeData } from '@leafer/interface'
import { Platform, MatrixHelper, ImageEvent } from '@leafer/core'

import { IUI, IImagePaint, ILeafPaint, IMatrixData, IImagePaintMode, IPointData } from '@leafer-ui/interface'


const { get, rotateOfOuter, translate, scaleOfOuter, scale: scaleHelper, rotate } = MatrixHelper

export function image(ui: IUI, attrName: string, paint: IImagePaint, box: IBoundsData): ILeafPaint {
    const { type, blendMode } = paint
    let leaferPaint: ILeafPaint = { type, style: 'rgba(255,255,255,0)' }
    if (blendMode) leaferPaint.blendMode = blendMode

    const { imageManager } = ui.leafer
    const image = imageManager.get(paint)

    if (image.ready) {

        if (!autoSize(ui, image)) {

            let transform: IMatrixData
            let { opacity, mode, offset, scale, rotation } = paint
            let { width, height } = image
            const sameBox = box.width === width && box.height === height

            switch (mode) {
                case 'strench':
                    if (!sameBox) width = box.width, height = box.height
                    if (box.x || box.y) {
                        transform = get()
                        translate(transform, box.x, box.y)
                    }
                    break
                case 'clip':
                    if (offset || scale || rotation) transform = getClipTransform(box, offset, scale, rotation)
                    break
                case 'repeat':
                    if (!sameBox || scale || rotation) transform = getRepeatTransform(box, width, height, scale as number, rotation)
                    break
                case 'fit':
                case 'cover':
                default:
                    if (!sameBox || rotation) transform = getFillOrFitTransform(mode, box, width, height, rotation)
            }

            leaferPaint.style = createPattern(image.getCanvas(width, height, opacity), transform, mode === 'repeat')

        }

    } else {

        imageManager.load(image,
            () => {
                if (ui.leafer) {
                    if (!autoSize(ui, image)) ui.forceUpdate('width')
                    ui.emitEvent(new ImageEvent(ImageEvent.LOADED, ui, image, attrName, paint))
                }
            },
            (error) => {
                ui.emitEvent(new ImageEvent(ImageEvent.ERROR, ui, image, attrName, paint, error))
            }
        )

    }

    return leaferPaint
}

function autoSize(ui: IUI, image: ISizeData): boolean {
    let auto: boolean
    const { __: data } = ui
    if (data) {
        if (!data.__getInput('width')) {
            auto = true
            ui.width = image.width
        }
        if (!data.__getInput('height')) {
            auto = true
            ui.height = image.height
        }
    }
    return auto
}

function getFillOrFitTransform(mode: IImagePaintMode, box: IBoundsData, width: number, height: number, rotation: number): IMatrixData {
    const transform: IMatrixData = get()
    const swap = rotation && rotation !== 180
    const sw = box.width / (swap ? height : width)
    const sh = box.height / (swap ? width : height)
    const scale = mode === 'fit' ? Math.min(sw, sh) : Math.max(sw, sh)
    const x = box.x + (box.width - width * scale) / 2
    const y = box.y + (box.height - height * scale) / 2
    translate(transform, x, y)
    scaleHelper(transform, scale)
    if (rotation) rotateOfOuter(transform, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, rotation)
    return transform
}

function getClipTransform(box: IBoundsData, offset: IPointData, scale: number | IPointData, rotation: number): IMatrixData {
    const transform: IMatrixData = get()
    translate(transform, box.x, box.y)
    if (offset) translate(transform, offset.x, offset.y)
    if (scale) typeof scale === 'number' ? scaleHelper(transform, scale) : scaleHelper(transform, scale.x, scale.y)
    if (rotation) rotate(transform, rotation)
    return transform
}

function getRepeatTransform(box: IBoundsData, width: number, height: number, scale: number, rotation: number): IMatrixData {
    const transform = get()

    if (rotation) {
        rotate(transform, rotation)
        switch (rotation) {
            case 90:
                translate(transform, height, 0)
                break
            case 180:
                translate(transform, width, height)
                break
            case 270:
                translate(transform, 0, width)
                break
        }
    }
    translate(transform, box.x, box.y)
    if (scale) scaleOfOuter(transform, box, scale)
    return transform
}


function createPattern(canvas: any, transform?: IMatrixData, repeat?: boolean,): CanvasPattern {
    let style = Platform.canvas.createPattern(canvas, repeat ? 'repeat' : 'no-repeat')
    if (transform) {
        const { a, b, c, d, e, f } = transform
        style.setTransform(new DOMMatrix([a, b, c, d, e, f]))
    }
    return style
}