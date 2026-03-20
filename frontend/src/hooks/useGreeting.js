import { useState, useEffect } from 'react';

/**
 * Custom hook to provide a time-based greeting.
 * @returns {string} The greeting (e.g., "Good Morning")
 */
export default function useGreeting() {
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good Morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good Afternoon";
    } else {
      return "Good Evening";
    }
  };

  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    // Update the greeting every minute to handle time-of-day transitions
    const intervalId = setInterval(() => {
      const newGreeting = getGreeting();
      if (newGreeting !== greeting) {
        setGreeting(newGreeting);
      }
    }, 60000); // 1 minute

    return () => clearInterval(intervalId);
  }, [greeting]);

  return greeting;
}
