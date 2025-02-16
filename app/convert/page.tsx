"use client";

import useSpeechToText from "react-hook-speech-to-text";
// import useTopicStore from "../store/topicSlice";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Trash2, Play, Pause, RotateCcw, Clock, Edit, Mic, MicOff, Download } from "lucide-react";
  
import { GoogleGenerativeAI } from "@google/generative-ai";

import { useSearchParams } from 'next/navigation';

// Define types
interface Recording {
  blob: Blob;
  url: string;
  timestamp: number;
  duration: number;
  name: string;
}

interface Hint {
  hint: string;
  isNew: boolean;
}

interface GenerativeResponse {
  hints: Hint[];
}

// interface ResultType {
//   transcript: string;
//   timestamp: number;
// }

export default function AnyComponent() {
  const {
    error: speechError,
    interimResult,
    isRecording: isSpeechRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [hints, setHints] = useState<Hint[]>([]);
  const [loadingHints, setLoadingHints] = useState(false);
  const searchParams = useSearchParams();
  const selectedTopic = searchParams.get('topic');

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const [userInput, setUserInput] = useState("");
  const [latestHints, setLatestHints] = useState<Hint[]>([]);

  const [time, setTime] = useState(90); // 1.5 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [customTime, setCustomTime] = useState("1:30");
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [showTopicInput, setShowTopicInput] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && time > 0) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev - 1);
      }, 1000);
    } else if (time === 0) {
      setIsRunning(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, time]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const [mins, secs] = customTime.split(":").map(Number);
    const totalSeconds = (mins * 60) + (secs || 0);
    setTime(totalSeconds);
    setShowTimeInput(false);
  };

  const handleTopicSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (customTopic.trim()) {
      window.history.pushState({}, '', `?topic=${encodeURIComponent(customTopic.trim())}`);
      setShowTopicInput(false);
      setCustomTopic("");
      await fetchHints();
    }
  };

  const fetchHints = async (customTopic?: string): Promise<void> => {
    setLoadingHints(true);
    try {
      const prompt = customTopic
        ? `Generate 2-3 concise, actionable and short sentences hints specifically about "${customTopic}" as a subtopic of "${selectedTopic}".`
        : `Generate 3-5 concise, actionable and short sentences hints for the topic "${selectedTopic}".`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      if (!response) throw new Error("No response from API");

      const content = response.text();
      const data = JSON.parse(content) as GenerativeResponse;

      if (customTopic) {
        setLatestHints(data.hints);
        setHints(prev => [...prev, ...data.hints]);
      } else {
        setHints(data.hints);
        setLatestHints([]);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error fetching hints:", error.message);
    } finally {
      setLoadingHints(false);
    }
  };

  const handleCustomHints = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      fetchHints(userInput.trim());
      setUserInput("");
    }else{
      if (selectedTopic) {
        fetchHints(selectedTopic);
      }
    }

  };

  const createAudioFile = () => {
    const transcript = results
      .map((r) => (typeof r === 'string' ? r : r?.transcript))
      .join(" ");
    const blob = new Blob([transcript], { type: "audio/wav" });
    return blob;
  };

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
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error uploading audio:", error.message);
      setUploadStatus("Failed to upload audio.");
    }
  };

  // Add this function to handle click events inside the dropdown
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling up to details element
  };

  const deleteHint = (indexToDelete: number) => {
    setHints((prevHints: Hint[]) => 
      prevHints.filter((_, index: number) => index !== indexToDelete)
    );
  };

  const clearAllHints = () => {
    setHints([]);
    setLatestHints([]);
  };

  // Recording timer function
  const startRecordingTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const timestamp = Date.now();
        setRecordings(prev => [...prev, {
          blob: audioBlob,
          url: audioUrl,
          timestamp,
          duration: recordingTime,
          name: `Recording_${timestamp}`
        }]);
        setRecordingTime(0);
      };

      mediaRecorder.start(10);
      setIsAudioRecording(true);
      setIsPaused(false);
      startRecordingTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isAudioRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopRecordingTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isAudioRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startRecordingTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isAudioRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsAudioRecording(false);
      setIsPaused(false);
      stopRecordingTimer();
    }
  };

  const restartRecording = () => {
    stopRecording();
    setTimeout(() => {
      startRecording();
    }, 100);
  };

  const downloadRecording = (recording: Recording) => {
    const url = URL.createObjectURL(recording.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.name}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteRecording = (timestamp: number) => {
    setRecordings(prev => {
      const newRecordings = prev.filter(rec => rec.timestamp !== timestamp);
      // Clean up URLs
      prev.forEach(rec => {
        if (rec.timestamp === timestamp) {
          URL.revokeObjectURL(rec.url);
        }
      });
      return newRecordings;
    });
  };

  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      recordings.forEach(rec => URL.revokeObjectURL(rec.url));
    };
  }, [recordings]);

  if (speechError) return <p>Web Speech API is not available in this browser 🤷‍</p>;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-2xl">
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-400">{selectedTopic}</h1>
              <button
                onClick={() => setShowTopicInput(!showTopicInput)}
                className="p-1.5 text-gray-400 hover:text-blue-400 rounded-lg transition-all duration-200"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            {/* Timer Controls */}
            <div className="flex items-center gap-4 bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 border border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {showTimeInput ? (
                  <form onSubmit={handleTimeSubmit} className="flex items-center">
                    <input
                      type="text"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-16 bg-transparent border-b border-gray-600 text-white px-1"
                      placeholder="1:30"
                    />
                    <button type="submit" className="ml-2 text-blue-400 text-sm">Set</button>
                  </form>
                ) : (
                  <span
                    onClick={() => setShowTimeInput(true)}
                    className="text-white cursor-pointer hover:text-blue-400 transition-colors"
                  >
                    {formatTime(time)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                >
                  {isRunning ? 
                    <Pause className="w-4 h-4 text-yellow-400" /> : 
                    <Play className="w-4 h-4 text-green-400" />
                  }
                </button>
                <button
                  onClick={() => {
                    setTime(90);
                    setIsRunning(false);
                  }}
                  className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
          </div>

          {showTopicInput && (
            <form onSubmit={handleTopicSubmit} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Enter new topic"
                  className="flex-1 p-3 rounded-lg text-gray-900 bg-white/90 backdrop-blur-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Change Topic
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            <details
              className="bg-gray-800/40 backdrop-blur-sm rounded-xl text-white shadow-lg border border-gray-700"
              open={isHintOpen}
              onClick={async (e) => {
                e.preventDefault();
                // if (!isHintOpen) {
                //   await fetchHints();
                // }
                setIsHintOpen(!isHintOpen);
              }}
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50 rounded-xl transition-all duration-200 select-none">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg">View Hints</span>
                  {hints?.length > 0 && (
                    <span className="bg-blue-500 px-2 py-0.5 rounded-full text-xs">
                      {hints.length}
                    </span>
                  )}
                </div>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isHintOpen ? "transform rotate-180" : ""
                  }`} 
                />
              </summary>

              <div 
                className="p-6 space-y-4" 
                onClick={handleDetailsClick}
              >
                <div className="flex justify-between items-center">
                  <form onSubmit={handleCustomHints} className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Enter subtopic for more hints"
                      className="flex-1 p-3 rounded-lg text-gray-900 bg-white/90 backdrop-blur-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="submit"
                      disabled={loadingHints}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm"
                    >
                      {loadingHints ? (
                        <span className="flex items-center gap-2">
                          Loading...
                        </span>
                      ) : (
                        'Add Hints'
                      )}
                    </button>
                  </form>
                  
                  {hints && hints.length > 0 && (
                    <button
                      onClick={clearAllHints}
                      className="ml-2 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                      title="Clear all hints"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-3 mt-4">
                  { hints && hints.length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    hints.map((hint: any, index: number) => (
                      <div 
                        key={index} 
                        className={`group flex items-start p-3 rounded-lg transition-all ${
                          latestHints.some(h => h.hint === hint.hint)
                            ? 'bg-yellow-500/20 text-yellow-300 font-medium' 
                            : 'hover:bg-gray-700/30'
                        }`}
                      >
                        <span className="mr-3 text-lg">•</span>
                        <p className="leading-relaxed flex-1">{hint.hint}</p>
                        <button
                          onClick={() => deleteHint(index)}
                          className="opacity-0 group-hover:opacity-100 ml-2 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                          title="Delete hint"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <p>No hints available for this topic.</p>
                      <p className="text-sm mt-1">Try adding a subtopic to get specific hints</p>
                    </div>
                  )}
                </div>
              </div>
            </details>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-medium text-white">Voice Recordings</h2>
                  {isAudioRecording && (
                    <span className="text-sm text-gray-400">
                      Recording: {formatRecordingTime(recordingTime)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAudioRecording && (
                    <>
                      <button
                        onClick={restartRecording}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                        title="Restart recording"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={isPaused ? resumeRecording : pauseRecording}
                        className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-all duration-200"
                        title={isPaused ? "Resume recording" : "Pause recording"}
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                  <button
                    onClick={isAudioRecording ? stopRecording : startRecording}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      isAudioRecording 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    }`}
                  >
                    {isAudioRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {recordings.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No recordings yet. Click the microphone icon to start recording.
                  </p>
                ) : (
                  recordings.map((recording, index) => (
                    <div 
                      key={recording.timestamp}
                      className="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-gray-400 min-w-[100px]">
                          Recording {recordings.length - index}
                        </span>
                        <span className="text-gray-400 text-sm">
                          ({formatRecordingTime(recording.duration)})
                        </span>
                        <audio controls className="h-8 flex-1">
                          <source src={recording.url} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadRecording(recording)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                          title="Download recording"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRecording(recording.timestamp)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                          title="Delete recording"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                className="bg-white text-gray-900 p-3 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                onClick={isSpeechRecording ? stopSpeechToText : startSpeechToText}
              >
                {isSpeechRecording ? "Stop Translation" : "Start Translation"}
              </button>
              <button
                className="bg-blue-500 text-white p-3 rounded-lg shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={uploadAudio}
                disabled={isSpeechRecording || !results.length}
              >
                Upload Audio
              </button>
            </div>

            <div className="border border-gray-200 bg-white min-h-[10rem] rounded-lg p-4 shadow-sm">
              <ul className="space-y-2">
                {results.map((result) => (
                  <li key={typeof result === 'string' ? result : result.timestamp} className="text-gray-700">
                    {typeof result === 'string' ? result : result.transcript}
                  </li>
                ))}
                {interimResult && (
                  <li className="text-gray-500 italic">{interimResult}</li>
                )}
              </ul>
            </div>

            {uploadStatus && (
              <p className="mt-4 text-gray-800 font-medium">{uploadStatus}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
