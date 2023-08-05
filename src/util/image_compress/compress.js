export function imageCompressing(file, maxWnH, quality, format) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                let newWidth = img.width;
                let newHeight = img.height;

                if (maxWnH !== false) {
                    if (maxWnH && newWidth > maxWnH) {
                        newWidth = maxWnH;
                        newHeight = (img.height * maxWnH) / img.width;
                    }

                    if (maxWnH && newHeight > maxWnH) {
                        newHeight = maxWnH;
                        newWidth = (img.width * maxWnH) / img.height;
                    }
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = newWidth;
                canvas.height = newHeight;

                let type = file.type;

                if (format !== false) {
                    type = `image/${format}`;
                }

                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                canvas.toBlob(function (blob) {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Error compressing image'));
                    }
                }, type, quality);
            };
            img.src = e.target.result;
        };

        reader.onerror = function (e) {
            reject(new Error('Error reading file'));
        };

        reader.readAsDataURL(file);
    });
}