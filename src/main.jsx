import React from "react";
import { createRoot } from "react-dom/client";
import AnimeRanker from "./AnimeRanker.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AnimeRanker />
  </React.StrictMode>
);
