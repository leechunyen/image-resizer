export function convertImage(file, format) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(function (blob) {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Error converting image to Blob'));
                    }
                }, `image/${format}`);
            };
            img.src = e.target.result;
        };

        reader.onerror = function (e) {
            reject(e);
        };

        reader.readAsDataURL(file);
    });
}