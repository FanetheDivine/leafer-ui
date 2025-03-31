import { IBooleanMap, ILeaferImage, IObject } from '@leafer/interface'
import { ImageManager } from '@leafer/core'

import { IImagePaint, ILeafPaint, IPaintAttr, IUIData } from '@leafer-ui/interface'


export function recycleImage(attrName: IPaintAttr, data: IUIData): IBooleanMap {
    const paints = (data as IObject)['_' + attrName] as ILeafPaint[]

    if (paints instanceof Array) {

        let image: ILeaferImage, recycleMap: IBooleanMap, input: IImagePaint[], url: string

        for (let i = 0, len = paints.length; i < len; i++) {

            image = paints[i].image
            url = image && image.url

            if (url) {
                if (!recycleMap) recycleMap = {}
                recycleMap[url] = true
                ImageManager.recycle(image)

                // stop load
                if (image.loading) {
                    if (!input) {
                        input = (data.__input && data.__input[attrName]) || []
                        if (!(input instanceof Array)) input = [input]
                    }
                    image.unload(paints[i].loadId, !input.some((item: IImagePaint) => item.url === url))
                } else paints[i].style = null // fix: 小程序垃圾回收
            }

        }

        return recycleMap

    }

    return null
}