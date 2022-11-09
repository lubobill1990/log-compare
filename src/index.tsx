import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import reportWebVitals from "./reportWebVitals";
import { LogContextProvider } from "./GlobalLogProvider";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import App2 from './App2';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LogContextProvider>
      <DndProvider backend={HTML5Backend}>
        <App2 />
      </DndProvider>
    </LogContextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
