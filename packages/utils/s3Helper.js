const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const Jimp = require("jimp"); // ← NEW
const path = require("path");
const crypto = require("crypto");

const cfg = {
  region: process.env.AWS_REGION || "eu-north-1",
  bucket: process.env.AWS_BUCKET_NAME || "toprisebucket",
  keyId: process.env.AWS_ACCESS_KEY_ID || "AKIAXVDSWFZ2PGB4F2PE",
  secret:
    process.env.AWS_SECRET_ACCESS_KEY ||
    "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",
  img: {
    maxW: 1200,
    maxH: 1200,
    quality: 80,
    formats: ["webp", "jpeg"],
    thumb: { w: 300, h: 300, suffix: "-thumb.webp" },
  },
};

const s3 = new S3Client({
  region: cfg.region,
  credentials: { accessKeyId: cfg.keyId, secretAccessKey: cfg.secret },
});

const isImage = (mime) => mime.startsWith("image/");
const mimeOf = (ext) =>
  ({
    webp: "image/webp",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
  }[ext]);

const uploadToS3 = async (buf, key, mime) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buf,
      ContentType: mime,
      ACL: "public-read",
    })
  );
  return {
    location: `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`,
    key,
  };
};

async function uploadImage(buffer, originalName, mimeType, folder = "uploads") {
  if (!isImage(mimeType)) throw new Error("File is not an image");

  const ext = path.extname(originalName).toLowerCase().replace(".", "");
  const baseName = path.basename(originalName, path.extname(originalName));
  const hash = crypto.createHash("md5").update(buffer).digest("hex");

  /* 1️⃣  load with Jimp once, reuse clones */
  const jimpOrig = await Jimp.read(buffer);

  /* 2️⃣  generic resize helper */
  const resize = (j) =>
    j.clone().cover(cfg.img.maxW, cfg.img.maxH, Jimp.HORIZONTAL_ALIGN_CENTER);

  /* 3️⃣  upload the (compressed) “original” in same ext */
  const origBuf = await resize(jimpOrig)
    .quality(cfg.img.quality)
    .getBufferAsync(mimeOf(ext) || mimeType);

  const keyBase = `${folder}/${hash}/${baseName}`;
  const original = await uploadToS3(
    origBuf,
    `${keyBase}.${ext}`,
    mimeOf(ext) || mimeType
  );

  /* 4️⃣  upload variants */
  const variants = await Promise.all(
    cfg.img.formats.map(async (fmt) => {
      if (fmt === ext) return null; // already uploaded
      const buf = await resize(jimpOrig)
        .quality(cfg.img.quality)
        .getBufferAsync(mimeOf(fmt));
      const vKey = `${keyBase}.${fmt}`;
      const vh = await uploadToS3(buf, vKey, mimeOf(fmt));
      return { ...vh, format: fmt };
    })
  ).then((arr) => arr.filter(Boolean));

  /* 5️⃣  thumbnail (WebP) */
  const thumbBuf = await jimpOrig
    .clone()
    .cover(cfg.img.thumb.w, cfg.img.thumb.h)
    .quality(cfg.img.quality)
    .getBufferAsync(Jimp.MIME_WEBP);

  const thumbKey = `${keyBase}${cfg.img.thumb.suffix}`;
  const thumb = await uploadToS3(thumbBuf, thumbKey, Jimp.MIME_WEBP);
  variants.push({ ...thumb, format: "thumb" });

  return { original, variants, hash };
}

async function uploadFile(buffer, originalName, mimeType, folder = "files") {
  const ext = path.extname(originalName);
  const key = `${folder}/${uuidv4()}${ext}`;
  return uploadToS3(buffer, key, mimeType);
}

async function deleteFile(key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
    return true;
  } catch (e) {
    console.error("Delete failed:", e);
    return false;
  }
}

async function generatePresignedUploadUrl(key, mimeType) {
  const cmd = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: mimeType,
  });
  return getSignedUrl(s3, cmd, { expiresIn: 60 * 60 }); // 1 h
}

module.exports = {
  uploadImage,
  uploadFile,
  deleteFile,
  generatePresignedUploadUrl,
};
