import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { processTaskImage } from '../lib/admin/task-image-processor';
import { MAX_IMAGE_BYTES } from '../lib/admin/task-images';

test('normalizes real JPEG bytes to bounded metadata-free WebP', async () => {
  const source = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: '#7ccbff' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const result = await processTaskImage(source);
  const info = await sharp(result.bytes).metadata();
  assert.equal(info.format, 'webp');
  assert.ok(info.width! <= 1600 && info.height! <= 1600);
  assert.ok(result.bytes.length <= MAX_IMAGE_BYTES);
  assert.equal(info.exif, undefined);
});
test('refuses unsupported signatures, corrupt bytes, excessive input and animation', async () => {
  await assert.rejects(processTaskImage(Buffer.from('<svg/>')));
  await assert.rejects(processTaskImage(Buffer.alloc(20 * 1024 * 1024 + 1)));
  await assert.rejects(processTaskImage(Buffer.from([0xff, 0xd8, 0xff, 0x00])));
  const gif = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).gif().toBuffer();
  await assert.rejects(processTaskImage(gif));
});

test('refuses decompression-sized images and animated WebP chunks', async () => {
  const bomb = await sharp({ create: { width: 8000, height: 6000, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(processTaskImage(bomb));
  const animated = Buffer.alloc(30);
  animated.write('RIFF', 0); animated.write('WEBP', 8); animated.write('VP8X', 12); animated.writeUInt32LE(10, 16); animated[20] = 2;
  await assert.rejects(processTaskImage(animated));
});
test('reduces dense images rather than storing an oversized output', async () => {
  const { randomBytes } = await import('node:crypto');
  const source = await sharp(randomBytes(1600 * 1600 * 3), { raw: { width: 1600, height: 1600, channels: 3 } }).png().toBuffer();
  const result = await processTaskImage(source);
  assert.ok(result.byteSize <= MAX_IMAGE_BYTES);
  assert.ok(result.width <= 1600 && result.height <= 1600);
});

test('browser preflight bounds image dimensions before decoding', async () => {
  const { sourceImageDimensions } = await import('../lib/admin/task-images');
  for (const format of ['png', 'jpeg', 'webp'] as const) {
    const source = await sharp({ create: { width: 37, height: 29, channels: 3, background: 'blue' } }).toFormat(format).toBuffer();
    assert.deepEqual(sourceImageDimensions(source), { width: 37, height: 29 });
  }
  assert.equal(sourceImageDimensions(Buffer.from('bad')), null);
});
