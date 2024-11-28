import React, { useRef, useState } from "react";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [rects, setRects] = useState([]);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 }); // 이미지 크기 저장

  const MIN_DRAG_SIZE = 15; // 최소 드래그 크기 (15x15)

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImageUrl(URL.createObjectURL(file));
      };
      img.src = URL.createObjectURL(file);
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
      // A4 크기 기준으로 좌표 변환
      const A4_WIDTH = 595; // PDFKit A4 Width
      const A4_HEIGHT = 842; // PDFKit A4 Height

      const newRect = {
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
      <h1 className={styles.title}>Image Annotation Tool</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {imageUrl && (
        <div
          ref={containerRef}
          className={styles.imageContainer}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            position: "relative",
            display: "inline-block",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <img
            src={imageUrl}
            alt="Uploaded"
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
          {rects.map((rect) => (
            <div
              key={rect.id}
              className={styles.rectOverlay}
              style={{
                position: "absolute",
                left: `${(rect.x / 595) * 100}%`,
                top: `${(rect.y / 842) * 100}%`,
                width: `${(rect.width / 595) * 100}%`,
                height: `${(rect.height / 842) * 100}%`,
                border: "2px solid red",
                boxSizing: "border-box",
              }}
            >
              <button
                className={styles.deleteRectButton}
                onClick={(e) => handleRectDelete(e, rect.id)}
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-10px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                }}
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
              X: {rect.x.toFixed(2)}, Y: {rect.y.toFixed(2)}, Width:{" "}
              {rect.width.toFixed(2)}, Height: {rect.height.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
