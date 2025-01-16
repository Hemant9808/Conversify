// "use client";

// import useSpeechToText from "react-hook-speech-to-text";
// import useTopicStore from "../store/topicSlice";

// export default function AnyComponent() {
//   const {
//     error,
//     interimResult,
//     isRecording,
//     results,
//     startSpeechToText,
//     stopSpeechToText,
//   } = useSpeechToText({
//     continuous: true,
//     useLegacyResults: false,
//   });
// const {selectedTopic}=useTopicStore()
//   if (error) return <p>Web Speech API is not available in this browser 🤷‍</p>;

//   return (
//     <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//       <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
//         <div>
//           <h1>{selectedTopic}</h1>
//           <button
//             className="mb-4 bg-white text-gray-900 p-3 rounded"
//             onClick={isRecording ? stopSpeechToText : startSpeechToText}
//           >
//             {isRecording ? "Stop Recording" : "Start Recording"}
//           </button>
//           <div className="border border-gray-400 min-h-[10rem] rounded m-[1erm]">
//             <ul>
//               {results.map((result) => (
//                 //@ts-ignore
//                 <li key={result.timestamp}>{result.transcript}</li>
//               ))}
//               {interimResult && <li>{interimResult}</li>}
//             </ul>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }





"use client";

import useSpeechToText from "react-hook-speech-to-text";
import useTopicStore from "../store/topicSlice";
import { useState } from "react";

export default function AnyComponent() {
  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  const { selectedTopic } = useTopicStore();
  const [uploadStatus, setUploadStatus] = useState<any>(null);

  // Create a Blob of the recorded transcript
  const createAudioFile = () => {
    const transcript = results.map((r) => r.transcript).join(" ");
    const blob = new Blob([transcript], { type: "audio/wav" });
    return blob;
  };

  // Upload audio file to the server
  const uploadAudio = async () => {
    const audioFile = createAudioFile();

    if (!audioFile) {
      alert("No audio available to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      setUploadStatus("Uploading...");
      const response = await fetch("/api/audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload audio.");
      }

      const data = await response.json();
      setUploadStatus(`Upload successful! Audio URL: ${data.url}`);
    } catch (error) {
      console.error("Error uploading audio:", error);
      setUploadStatus("Failed to upload audio.");
    }
  };

  if (error) return <p>Web Speech API is not available in this browser 🤷‍</p>;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div>
          <h1>{selectedTopic}</h1>
          <button
            className="mb-4 bg-white text-gray-900 p-3 rounded"
            onClick={isRecording ? stopSpeechToText : startSpeechToText}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
          <button
            className="mb-4 bg-blue-500 text-white p-3 rounded"
            onClick={uploadAudio}
            disabled={isRecording || !results.length}
          >
            Upload Audio
          </button>
          <div className="border border-gray-400 min-h-[10rem] rounded m-[1rem] p-4">
            <ul>
              {results.map((result) => (
                //@ts-ignore
                <li key={result.timestamp}>{result.transcript}</li>
              ))}
              {interimResult && <li>{interimResult}</li>}
            </ul>
          </div>
          {uploadStatus && (
            <p className="mt-4 text-gray-800 font-bold">{uploadStatus}</p>
          )}
        </div>
      </main>
    </div>
  );
}
