const sharp = require('sharp');

const sizes = [16, 48, 128];

sizes.forEach(size => {
  sharp('icons/icon.svg')
    .resize(size, size)
    .toFile(`icons/icon${size}.png`)
    .catch(err => console.error(err));
}); 