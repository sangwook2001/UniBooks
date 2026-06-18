// 클라이언트 측 이미지 압축 유틸
// 업로드 전 큰 사진(수 MB)을 화면 표시용 크기로 리사이즈/압축해
// DB 저장 용량과 목록/상세 로딩 속도를 크게 줄인다.

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."))
    img.src = src
  })
}

/**
 * 이미지를 최대 변 길이(maxSize)에 맞춰 리사이즈하고 JPEG로 압축한 data URL을 반환한다.
 */
export async function compressImage(file: File, maxSize = 1280, quality = 0.72): Promise<string> {
  // 이미지가 아니면 원본 그대로 반환
  if (!file.type.startsWith("image/")) {
    return readFileAsDataURL(file)
  }

  try {
    const dataUrl = await readFileAsDataURL(file)
    const img = await loadImage(dataUrl)

    let { width, height } = img
    if (width > maxSize || height > maxSize) {
      if (width >= height) {
        height = Math.round((height * maxSize) / width)
        width = maxSize
      } else {
        width = Math.round((width * maxSize) / height)
        height = maxSize
      }
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return dataUrl
    ctx.drawImage(img, 0, 0, width, height)

    const compressed = canvas.toDataURL("image/jpeg", quality)
    // 압축 결과가 원본보다 크면(이미 작은 이미지) 원본 유지
    return compressed.length < dataUrl.length ? compressed : dataUrl
  } catch {
    // 실패 시 원본 사용
    return readFileAsDataURL(file)
  }
}
