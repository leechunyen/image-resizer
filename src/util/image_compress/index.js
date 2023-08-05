import { imageCompressing } from "./compress";

export function compressImage(file, maxWnH, maxFileSizeB, quality, format) {
    return new Promise((resolve, reject) => {
        function compressRecursive(file, currentQuality) {
            imageCompressing(file, maxWnH, currentQuality, format)
                .then((blob) => {
                    if (maxFileSizeB !== false) {
                        if (blob.size <= maxFileSizeB) {
                            resolve(blob);
                        } else {
                            const newQuality = currentQuality - 0.01;
                            if (newQuality >= 0) {
                                compressRecursive(file, newQuality);
                            } else {
                                reject(new Error('Compression failed. Minimum quality reached.'));
                            }
                        }
                    } else {
                        resolve(blob);
                    }
                })
                .catch(reject);
        }
        compressRecursive(file, quality);
    });
}