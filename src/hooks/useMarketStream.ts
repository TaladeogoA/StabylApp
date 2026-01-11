import { useEffect, useState } from 'react';
import { streamEngine } from '../engine/stream';

export const useMarketStream = () => {
  const [status, setStatus] = useState(streamEngine.state);
  const [isPlaying, setIsPlaying] = useState(streamEngine.isPlaying);
  const [isReady, setIsReady] = useState(streamEngine.isReady);
  const [eventCount, setEventCount] = useState(streamEngine.eventCount);

  useEffect(() => {
      setStatus(streamEngine.state);
      setIsPlaying(streamEngine.isPlaying);
      setEventCount(streamEngine.eventCount);
      setIsReady(streamEngine.isReady);

      const removeListener = streamEngine.addListener(() => {
          setStatus(streamEngine.state);
          setIsPlaying(streamEngine.isPlaying);
          setEventCount(streamEngine.eventCount);
          setIsReady(streamEngine.isReady);
      });

      return () => {
          removeListener();
      };
  }, []);

  useEffect(() => {
      streamEngine.load();
  }, []);

  const togglePlay = () => {
      if (streamEngine.isPlaying) {
          streamEngine.pause();
      } else {
          streamEngine.play();
      }
  };

  const reset = () => {
      streamEngine.reset();
  };

  const replay = async () => {
      await streamEngine.reset();
      streamEngine.play();
  };

  return {
      isReady,
      isPlaying,
      status,
      progress: 0, // Not implemented yet
      eventCount,
      togglePlay,
      reset,
      replay
  };
};
