import React, { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import styles from "@/styles/Home.module.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export default function Home() {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [fileName, setFileName] = useState(""); // 업로드된 파일 이름
  const [pageNum, setPageNum] = useState(1);
  const [rects, setRects] = useState([]);
  const [pdfLibDoc, setPdfLibDoc] = useState(null);
  const [previewRect, setPreviewRect] = useState(null); // 미리보기 사각형
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);

  const MIN_DRAG_SIZE = 15;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setFileName(file.name); // 파일 이름 저장
      const reader = new FileReader();
      reader.onload = async function () {
        const typedArray = new Uint8Array(this.result);

        const pdfLibDoc = await PDFDocument.load(typedArray);
        setPdfLibDoc(pdfLibDoc);

        pdfjsLib.getDocument(typedArray).promise.then((pdf) => {
          setPdfDoc(pdf);
          renderPage(1, pdf);
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const renderPage = (num, pdf) => {
    pdf.getPage(num).then((page) => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      page.render(renderContext);
    });
  };

  const convertToPdfCoords = (x, y, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const pdfPage = pdfLibDoc.getPage(pageNum - 1);
    const { width: pdfWidth, height: pdfHeight } = pdfPage.getSize();

    const pdfX = (x / rect.width) * pdfWidth;
    const pdfY = pdfHeight - (y / rect.height) * pdfHeight; // Y 좌표 변환

    return { x: pdfX, y: pdfY };
  };

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    const left = Math.min(currentPos.x, startPos.x);
    const top = Math.min(currentPos.y, startPos.y);

    setPreviewRect({
      x: left,
      y: top,
      width,
      height,
    });
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !canvasRef.current || !pdfLibDoc) {
      setPreviewRect(null);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const endPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);

    if (width >= MIN_DRAG_SIZE && height >= MIN_DRAG_SIZE) {
      const pdfStart = convertToPdfCoords(startPos.x, startPos.y, canvas);
      const pdfEnd = convertToPdfCoords(endPos.x, endPos.y, canvas);

      // PDF 좌표계에서 왼쪽 상단 꼭지점 계산
      const newRect = {
        x: Math.min(pdfStart.x, pdfEnd.x), // X 좌표는 최소값
        y: Math.max(pdfStart.y, pdfEnd.y), // PDF 좌표계에서 상단 기준 (최대 Y 값)
        width: Math.abs(pdfEnd.x - pdfStart.x),
        height: Math.abs(pdfEnd.y - pdfStart.y),
        canvasX: Math.min(startPos.x, endPos.x),
        canvasY: Math.min(startPos.y, endPos.y),
        canvasWidth: width,
        canvasHeight: height,
        id: Date.now(),
      };

      setRects((prevRects) => [...prevRects, newRect]);
    }

    setPreviewRect(null);
    setIsDrawing(false);
  };

  const handleRectDelete = (id) => {
    setRects((prevRects) => prevRects.filter((rect) => rect.id !== id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.uploadSection}>
        <label htmlFor="fileInput" className={styles.uploadButton}>
          {fileName ? "Change PDF" : "Upload PDF"}
        </label>
        <input
          id="fileInput"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        {fileName && <p className={styles.fileName}>File: {fileName}</p>}
      </div>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "inline-block",
          marginTop: "20px",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          className={styles.pdfCanvas}
          style={{ border: "1px solid #000" }}
        ></canvas>
        {previewRect && (
          <div
            style={{
              position: "absolute",
              left: `${previewRect.x}px`,
              top: `${previewRect.y}px`,
              width: `${previewRect.width}px`,
              height: `${previewRect.height}px`,
              border: "2px dashed blue",
              boxSizing: "border-box",
            }}
          ></div>
        )}
        {rects.map((rect) => (
          <div
            key={rect.id}
            style={{
              position: "absolute",
              left: `${rect.canvasX}px`,
              top: `${rect.canvasY}px`,
              width: `${rect.canvasWidth}px`,
              height: `${rect.canvasHeight}px`,
              border: "2px solid red",
              boxSizing: "border-box",
            }}
          >
            <button
              onClick={() => handleRectDelete(rect.id)}
              className={styles.deleteRectButton}
            >
              X
            </button>
          </div>
        ))}
      </div>
      <div>
        <ul className={styles.rectList}>
          {rects.map((rect, index) => (
            <li key={rect.id} className={styles.rectItem}>
              Rectangle {index + 1}: X: {rect.x.toFixed(2)}, Y:
              {(rect.y - 10).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
