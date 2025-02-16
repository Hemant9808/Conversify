"use client";

import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { useEffect, useState } from "react";
import { BackgroundGradientAnimation } from "../components/ui/gradient-bg";
import useTopicStore from "../store/topicSlice";
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { useNavigate } from "react-router-dom";

const FetchTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInput, setUserInput] = useState("");
  const { setSelectedTopic ,selectedTopic} = useTopicStore();
  const router = useRouter()
  // const navigate = useNavigate();
  console.log('selectedTopic',selectedTopic)
  const searchParams = useSearchParams()
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const getPrompt = (input: string) => {
    if (!input.trim()) {
      return `Generate three creative, engaging, and unique topic names that can help someone practice English communication skills. The topics should be diverse, conversational, and suitable for discussions across casual, professional, and thought-provoking contexts.Respond only in the following JSON format:
{
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ]
} `;
    }

    return `Generate three creative, engaging, and unique topic names related to "${input}" that can help someone practice English communication skills. The topics should be diverse, conversational, and suitable for discussions. Respond only in the following JSON format:
{
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ]
} `;
  };

  const generate = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await model.generateContent(getPrompt(userInput));
      console.log("result", result);
      //@ts-expect-error Server Component
      const rawContent = result.response.candidates[0].content.parts[0].text;
      console.log("rawContent", rawContent);
      if (!rawContent) {
        throw new Error("Content is missing or improperly structured.");
      }

      const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch || !jsonMatch[1]) {
        throw new Error("Failed to extract JSON from the response.");
      }0

      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[1]); // Extract the JSON object
        setTopics(parsedData.topics || []);
        console.log("parsed data", parsedData);
      }
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelection = (topic:string) => {
    const params = new URLSearchParams(searchParams.toString())
    setSelectedTopic(topic);
    params.set('topic', topic)
    // window.history.pushState("/convert", '/convert', `?${params.toString()}`) 
    // router.push('/convert',params.toString())
    params.set("topic", topic);
    // navigate(`/convert?${params.toString()}`);
    router.push(`/convert?${params.toString()}`);
    // // Update the selected topic in the Zustand store
  };


  return (

    <div className=" z-[900] grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div style={{ padding: "20px" }}>
          <h1>English Practice Topics</h1>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter a topic area (optional)"
              className="p-2 rounded border border-gray-300 text-black"
            />
            <button 
              className="bg-white text-black p-3 rounded" 
              onClick={generate} 
              disabled={loading}
            >
              {loading ? "Fetching..." : "Fetch Topics"}
            </button>
          </div>
          {error && <p style={{ color: "red" }}>Error: {error}</p>}
          <ul className="mt-5">
            {topics.map((topic, index) => (
            <li className="bg-gray-600 mb-3 p-3 rounded cursor-pointer" onClick={()=>handleTopicSelection(topic)} key={index}>{topic}</li>

            ))}
          </ul>
        </div>
      </main>
    </div>

  );
};

export default FetchTopics;
