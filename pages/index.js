import React, { useRef, useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState("");
  const [rects, setRects] = useState([]);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);

  const MIN_DRAG_SIZE = 15; // 최소 드래그 크기 (15x15)

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPdfUrl(URL.createObjectURL(file));
    }
  };

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDrawing(true);

    // Preview rectangle setup
    const previewDiv = document.createElement("div");
    previewDiv.id = "preview-rect";
    previewDiv.style.position = "absolute";
    previewDiv.style.border = "2px dashed #00f";
    previewDiv.style.zIndex = "10";
    containerRef.current.appendChild(previewDiv);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const width = currentPos.x - startPos.x;
    const height = currentPos.y - startPos.y;

    // Update preview rectangle dynamically
    const previewRect = document.getElementById("preview-rect");
    if (previewRect) {
      previewRect.style.left = `${Math.min(startPos.x, currentPos.x)}px`;
      previewRect.style.top = `${Math.min(startPos.y, currentPos.y)}px`;
      previewRect.style.width = `${Math.abs(width)}px`;
      previewRect.style.height = `${Math.abs(height)}px`;
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const endPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);

    // Check minimum drag size
    if (width >= MIN_DRAG_SIZE && height >= MIN_DRAG_SIZE) {
      const A4_WIDTH = 595; // A4 width in points
      const A4_HEIGHT = 842; // A4 height in points

      const newRect = {
        // Calculate based on A4 proportions
        x: (Math.min(startPos.x, endPos.x) / rect.width) * A4_WIDTH,
        y: (Math.min(startPos.y, endPos.y) / rect.height) * A4_HEIGHT,
        width: (width / rect.width) * A4_WIDTH,
        height: (height / rect.height) * A4_HEIGHT,
        id: Date.now(),
      };

      setRects((prevRects) => [...prevRects, newRect]);
    }

    setIsDrawing(false);

    // Remove preview rectangle
    const previewRect = document.getElementById("preview-rect");
    if (previewRect) {
      previewRect.remove();
    }
  };

  const handleRectDelete = (e, id) => {
    e.stopPropagation(); // Prevent triggering the parent click event
    setRects((prevRects) => prevRects.filter((rect) => rect.id !== id));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PDF Annotation Tool</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {pdfUrl && (
        <div
          ref={containerRef}
          className={styles.pdfContainer}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js">
            <Viewer fileUrl={pdfUrl} />
          </Worker>
          {rects.map((rect) => (
            <div
              key={rect.id}
              className={styles.rectOverlay}
              style={{
                left: `${(rect.x / 595) * 100}%`,
                top: `${(rect.y / 842) * 100}%`,
                width: `${(rect.width / 595) * 100}%`,
                height: `${(rect.height / 842) * 100}%`,
              }}
            >
              <button
                className={styles.deleteRectButton}
                onClick={(e) => handleRectDelete(e, rect.id)}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
      <h2 className={styles.subtitle}>Rectangles:</h2>
      <ul className={styles.rectList}>
        {rects.map((rect, index) => (
          <li key={rect.id} className={styles.rectItem}>
            <span>Rectangle {index + 1}:</span>
            <span>
              X: {rect.x.toFixed(2)}, Y: {(rect.y + 150).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
