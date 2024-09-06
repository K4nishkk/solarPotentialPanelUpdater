'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [titles, setTitles] = useState([]);

  useEffect(() => {
    // Fetch data from the API route on your server
    axios.get('/api/scrape')
      .then((response) => {
        setTitles(response.data.titles);
      })
      .catch((error) => {
        console.error(`Error: ${error.message}`);
      });
  }, []);

  return (
    <div>
      <h1>Product Titles</h1>
      <ul>
        {titles.length > 0 ? (
          titles.map((title, index) => <li key={index}>{title}</li>)
        ) : (
          <li>Loading...</li>
        )}
      </ul>
    </div>
  );
}
