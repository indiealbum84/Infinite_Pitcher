const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const countries = require('flag-icons/country.json');

const sourceDir = path.dirname(require.resolve('flag-icons/package.json'));
const outputDir = path.resolve(__dirname, '../images/country-flags');
const size = 480;
const olive = [122, 141, 101];
const ink = [32, 39, 43];
const printRange = [216, 194, 163];

function byte(value) {
    return Math.max(0, Math.min(255, value));
}

async function makeBackdrop() {
    // Speed lines taper toward the cloth. Most show only at the panel edges.
    const rays = Array.from({ length: 58 }, (_, index) => {
        const angle = index * Math.PI * 2 / 58 + Math.sin(index * 2.8) * .055;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        const tip = 168 + (index * 107 % 11) * 10;
        const thickness = 1.5 + (index * 29 % 9);
        return `<path d="M${240 + x * 355} ${244 + y * 355} l${-y * thickness} ${x * thickness} L${240 + x * tip} ${244 + y * tip} Z"/>`;
    }).join('');
    const art = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 480 480">
      <rect width="480" height="480" fill="rgb(${olive.join(',')})"/>
      <g fill="#242d2a" opacity=".9">${rays}</g>
      <path d="M29 28 Q16 172 4 410" fill="none" stroke="#1e272b" stroke-width="16"/>
      <path d="M29 28 Q16 172 4 410" fill="none" stroke="#b38d58" stroke-width="9"/>
      <path d="M27 30 Q14 172 2 410" fill="none" stroke="#f0ce8c" stroke-width="3"/>
      <circle cx="30" cy="22" r="13" fill="#c5a56d" stroke="#1e272b" stroke-width="4"/>
      <path d="M22 21 Q25 13 34 16" fill="none" stroke="#f5d9a0" stroke-width="3"/>
    </svg>`;
    const backdrop = await sharp(Buffer.from(art)).removeAlpha().raw().toBuffer();
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const weave = (x + y) % 5 === 0 && (x - y) % 3 === 0 ? -39 : 0;
            const grain = ((x * 73 ^ y * 151 ^ x * y * 17) & 31) - 15;
            const pixel = (y * size + x) * 3;
            for (let channel = 0; channel < 3; channel++) {
                backdrop[pixel + channel] = byte(backdrop[pixel + channel] + weave + grain);
            }
        }
    }
    return backdrop;
}

// The contour follows the inked cloth edge in the shared drawn panel.
const clothOutline = `M75 108 C179 154 241 117 397 157 C479 178 532 211 571 252
    C620 299 688 311 768 291 C864 263 912 253 972 290 C1018 317 1031 354 1065 367
    C1138 397 1172 348 1254 384 L1254 541 C1240 582 1207 617 1224 666 L1254 714
    L1254 1158 C1124 1175 1119 1093 989 1107 C859 1117 837 1158 737 1161
    C623 1166 612 1111 556 1090 C482 1059 408 1139 319 1107 C274 1091 283 1069 230 1050
    C154 1023 70 1090 0 1120 L0 987 C11 849 34 645 50 442 C66 258 74 171 75 108Z`;

async function makePrintMap() {
    const templateFile = path.join(__dirname, 'art/country-flag-cloth.webp');
    const maskArt = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1254 1254">
        <path d="${clothOutline}" fill="white"/>
    </svg>`;
    const panel = await sharp(templateFile).resize(size, size).removeAlpha().raw().toBuffer();
    const mask = await sharp(Buffer.from(maskArt)).extractChannel('alpha').raw().toBuffer();
    const offsets = new Int32Array(size * size).fill(-1);
    for (let x = 0; x < size; x++) {
        // For the curved hoist, the first fully visible column gives stable fabric height estimates.
        const column = Math.max(x, 30);
        let top = 0;
        while (top < size && mask[top * size + column] < 128) top++;
        let bottom = size - 1;
        while (bottom > top && mask[bottom * size + column] < 128) bottom--;
        for (let y = 0; y < size; y++) {
            const index = y * size + x;
            if (!mask[index]) continue;
            const v = Math.min(1, Math.max(0, (y - top) / (bottom - top)));
            const hoist = 30 * (1 - v) ** .8;
            const u = Math.min(1, Math.max(0, (x - hoist) / (size - hoist - 1)));
            // Bend the print with the folds while keeping stars, seals and other marks legible.
            const bend = Math.sin(u * 12 - v * 8) * .1;
            const fabricV = v + v * (1 - v) * bend;
            offsets[index] = (Math.round(fabricV * (size - 1)) * size + Math.round(u * (size - 1))) * 4;
        }
    }
    return { panel, mask, offsets };
}

async function drawFlag(file, target, { panel, mask, offsets }, cutoutBackdrop) {
    const source = await sharp(path.join(sourceDir, file))
        .resize(size, size, { fit: 'fill' })
        .ensureAlpha()
        .raw()
        .toBuffer();
    const pixels = Buffer.from(cutoutBackdrop || panel);
    const coverage = index => offsets[index] >= 0 ? source[offsets[index] + 3] / 255 * mask[index] / 255 : 0;
    for (let index = 0; index < offsets.length; index++) {
        const alpha = coverage(index);
        if (!alpha) continue;
        const sample = offsets[index];
        const out = index * 3;
        // Tint the blank fabric's highlights and leave the original dark ink and hatch strokes visible.
        const light = Math.max(0, (panel[out] - 40) / 215);
        const clothTint = cutoutBackdrop ? light : light * Math.min(1, Math.max(0, (panel[out] - panel[out + 1]) / 10));
        const edge = cutoutBackdrop && (
            coverage(index - 2) < .15 || coverage(index + 2) < .15 ||
            coverage(index - size * 2) < .15 || coverage(index + size * 2) < .15
        );
        for (let channel = 0; channel < 3; channel++) {
            const tint = (1 - source[sample + channel] / 255) * printRange[channel];
            const printed = edge ? ink[channel] : byte(panel[out + channel] - clothTint * tint);
            pixels[out + channel] = printed * alpha + pixels[out + channel] * (1 - alpha);
        }
    }

    await sharp(pixels, { raw: { width: size, height: size, channels: 3 } })
        .webp({ quality: 78, effort: 5 })
        .toFile(target);
}

async function generate() {
    const flags = countries.filter(({ code }) => /^[a-z]{2}$/.test(code))
        .sort((a, b) => a.code.localeCompare(b.code, 'en'));
    await fs.mkdir(outputDir, { recursive: true });
    const printMap = await makePrintMap();
    const cutoutBackdrop = await makeBackdrop();
    for (const { code, flag_4x3: source } of flags) {
        const target = path.join(outputDir, `${code}.webp`);
        if (code === 'kr') {
            await fs.copyFile(path.resolve(outputDir, '../showa-comic-results/korea.webp'), target);
        } else {
            await drawFlag(source, target, printMap, code === 'np' ? cutoutBackdrop : null);
        }
    }
    // Custom property URLs resolve relative to the consuming game-art.css.
    const rules = flags.map(({ code }) =>
        `[data-flag-art="${code.toUpperCase()}"] { --country-flag-art: url('./images/country-flags/${code}.webp'); }`);
    await fs.writeFile(path.join(outputDir, 'flags.css'), [
        '/* Generated by npm run generate:flags from flag-icons (MIT). */',
        ...rules,
        ''
    ].join('\n'));
    await fs.copyFile(path.join(sourceDir, 'LICENSE'), path.join(outputDir, 'LICENSE.flag-icons.txt'));
    console.log(`Generated ${flags.length} flag illustrations, including ${flags.filter(flag => flag.iso).length} ISO entries.`);
}

generate().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
