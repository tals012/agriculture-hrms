"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Dictionary from './Dictionary';

const DictionaryContainer = (props) => {
  const [container, setContainer] = useState(null);

  useEffect(() => {
    // Create a div that lives outside the main React tree
    const dictionaryContainer = document.createElement('div');
    dictionaryContainer.id = 'dictionary-portal-container';
    document.body.appendChild(dictionaryContainer);
    setContainer(dictionaryContainer);

    // Clean up on unmount
    return () => {
      document.body.removeChild(dictionaryContainer);
    };
  }, []);

  // Only render once we have a container and we're on the client
  if (!container) return null;

  // Create a portal to render the Dictionary into our container
  return createPortal(
    <Dictionary {...props} />,
    container
  );
};

export default DictionaryContainer; 