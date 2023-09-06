/**
 * 文件转 base64
 * @param file 
 * @returns 
 */
export function fileToBase64(file: File) {
    return new Promise((resolve: (base64: string) => void, reject: () => void) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
    })
}