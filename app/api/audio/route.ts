// // import { NextResponse } from 'next/server';
// // import cloudinary from 'cloudinary';
// // import multer from 'multer';
// // import { Readable } from 'stream';

// // // Configure Cloudinary
// // cloudinary.v2.config({
// //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
// //   api_key: process.env.CLOUDINARY_API_KEY,
// //   api_secret: process.env.CLOUDINARY_API_SECRET,
// // });

// // // Multer middleware for parsing form data
// // const multerUpload = multer({
// //   storage: multer.memoryStorage(),
// // });

// // // Middleware to process the request and extract the file
// // const processFile = (req) => {
// //   return new Promise((resolve, reject) => {
// //     multerUpload.single('audio')(req, {}, (err) => {
// //       if (err) return reject(err);
// //       resolve(req.file);
// //     });
// //   });
// // };

// // // POST handler for uploading audio
// // export async function POST(req) {
// //   try {
// //     // Parse the incoming form data
// //     const formData = await req.formData();
// //     const file = formData.get('audio');

// //     if (!file) {
// //       return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
// //     }

// //     // Convert the file to a readable stream for Cloudinary upload
// //     const readable = new Readable();
// //     readable.push(Buffer.from(await file.arrayBuffer()));
// //     readable.push(null);


// //     // Upload the file to Cloudinary
// //     const result = await new Promise((resolve, reject) => {
// //       const uploadStream = cloudinary.v2.uploader.upload_stream(
// //         { resource_type: 'video', folder: 'audio_uploads' },
// //         (error, result) => {
// //           if (error) return reject(error);
// //           resolve(result);
// //         }
// //       );
// //       readable.pipe(uploadStream);
// //     });

// //     return NextResponse.json({
// //       message: 'Audio uploaded successfully',
// //       url: result.secure_url,
// //       public_id: result.public_id,
// //     });
// //   } catch (error) {
// //     console.error('Error uploading audio:', error);
// //     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
// //   }
// // }





// import { v2 as cloudinary } from "cloudinary";
// import formidable from "formidable";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export const config = {
//   api: {
//     bodyParser: false, // Disable built-in body parser
//   },
// };

// export default async function handler(req, res) {
//   if (req.method === "POST") {
//     const form = formidable({ multiples: false });

//     form.parse(req, async (err, fields, files) => {
//       if (err) {
//         return res.status(500).json({ error: "File parsing failed" });
//       }

//       const file = files.audio; // File key matches the FormData key in the frontend
//       try {
//         const result = await cloudinary.uploader.upload(file.filepath, {
//           resource_type: "auto",
//         });
//         return res.status(200).json({ url: result.secure_url });
//       } catch (uploadError) {
//         console.error("Cloudinary upload failed:", uploadError);
//         return res.status(500).json({ error: "Cloudinary upload failed" });
//       }
//     });
//   } else {
//     res.setHeader("Allow", ["POST"]);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }
