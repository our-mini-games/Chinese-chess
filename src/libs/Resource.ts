const resources = import.meta.env.VITE_CHESS_TEST_ENV === 'test'
  ? import.meta.glob('../assets/*')
  : import.meta.glob([
    './FZLSFT.ttf',
    './STXINGKAI.ttf',
    './sword.png',
    './win.png',
    './pattern.png'
  ])

export const loadResources = async () => {
  const data = Object.values(resources)

  const result: any = {}
  let type
  let name
  let resource

  for (let i = 0; i < data.length; i++) {
    resource = await data[i]() as any

    [name, type] = resource.default.split('/').at(-1).split('.')

    if (type === 'png') {
      result[name] = await loadPic(resource.default)
    } else if (type === 'ttf') {
      const font = new FontFace(name, `url(${resource.default})`)
      result[name] = await font.load()
      ;(document.fonts as any).add(font)
      await document.fonts.ready.then()
    }
  }

  return result
}

// eslint-disable-next-line @typescript-eslint/promise-function-async
const loadPic = (pic: string): Promise<HTMLImageElement> => {
  return new Promise(resolve => {
    const oImage = new Image()
    oImage.onload = () => {
      resolve(oImage)
    }
    oImage.src = pic
  })
}
