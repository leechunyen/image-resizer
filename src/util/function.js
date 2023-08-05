export function convertBase64UrlToBlob(urlData) {
    const base64Header = urlData.split(',')[0]; // Extract the base64 header (e.g., 'data:image/png;base64,')
    const base64Data = urlData.split(',')[1]; // Extract the base64 data
    const fileExt = base64Header.split(':')[1].split(';')[0].split('/')[1]; // Extract the file extension

    const bytes = window.atob(base64Data);
    const ab = new ArrayBuffer(bytes.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) {
        ia[i] = bytes.charCodeAt(i);
    }

    return new Blob([ab], { type: 'image/' + fileExt });
}
export function fileToBlob(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (event) {
            const blob = new Blob([event.target.result], { type: file.type });
            resolve(blob);
        };

        reader.onerror = function (event) {
            reject(event.error);
        };

        reader.readAsArrayBuffer(file);
    });
}