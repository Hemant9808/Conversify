import { create } from 'zustand';
interface Appstate{
    selectedTopic:string | null
    setSelectedTopic:any
}

const useTopicStore = create<Appstate>((set) => ({
  selectedTopic: null, // Initially, no topic is selected
  setSelectedTopic: (topic:string) => set({ selectedTopic: topic }), // Function to update the selected topic
}));

export default useTopicStore;
