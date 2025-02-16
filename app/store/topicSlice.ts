import { create } from 'zustand';
interface TopicState {
    selectedTopic: string | null;
    setSelectedTopic: (topic: string) => void;
}

const useTopicStore = create<TopicState>((set) => ({
  selectedTopic: null, // Initially, no topic is selected
  setSelectedTopic: (topic: string) => set({ selectedTopic: topic }), // Function to update the selected topic
}));

export default useTopicStore;
