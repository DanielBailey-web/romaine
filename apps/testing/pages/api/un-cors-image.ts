import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    if (typeof req.query.url !== "string") return res.status(400).end();
    try {
      // the image is fetched from the url
      const image = await fetch(req.query.url);

      const imageBlob = await image.blob();
      const imageType = imageBlob.type; // e.g. image/png

      // the image NEEDS to be of type buffer
      const buffer = Buffer.from(await imageBlob.arrayBuffer());

      res.setHeader("Content-Type", imageType);
      return res.send(buffer);
    } catch (error) {
      console.error(error);
      return res.status(500).end();
    }
  }
  return res.status(404).end();
};
