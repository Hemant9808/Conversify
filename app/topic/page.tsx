"use client";

import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { useEffect, useState } from "react";
import { BackgroundGradientAnimation } from "../components/ui/gradient-bg";
import useTopicStore from "../store/topicSlice";
import { useRouter } from 'next/navigation'

const FetchTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setSelectedTopic ,selectedTopic} = useTopicStore();
  const router = useRouter()
  console.log('selectedTopic',selectedTopic)

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `Generate three creative, engaging, and unique topic names that can help someone practice English communication skills. The topics should be diverse, conversational, and suitable for discussions across casual, professional, and thought-provoking contexts.Respond only in the following JSON format:
{
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ]
} `;

  const generate = async () => {
    const result = await model.generateContent(prompt);
    console.log("result", result);
    //@ts-ignore
    const rawContent = result.response.candidates[0].content.parts[0].text;
    console.log("rawContent", rawContent);
    if (!rawContent) {
      throw new Error("Content is missing or improperly structured.");
    }

    const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Failed to extract JSON from the response.");
    }
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[1]); // Extract the JSON object
      setTopics(parsedData.topics || []);
      console.log("parsed data", parsedData);
    }
  };

  const handleTopicSelection = (topic:string) => {
    setSelectedTopic(topic); 
    router.push('/convert')// Update the selected topic in the Zustand store
  };


  return (

    <div className=" z-[900] grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div style={{ padding: "20px" }}>
          <h1>English Practice Topics</h1>
          <button className="  bg-white text-black p-3 rounded" onClick={generate} disabled={loading}>
            {loading ? "Fetching..." : "Fetch Topics"}
          </button>
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
