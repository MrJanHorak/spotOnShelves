import { useRef, useState } from 'react';
import { ProjectSettings, WallDimensions } from '../../types';

type Point = { x: number; y: number };

interface UseBackgroundAlignerProps {
  settings: ProjectSettings;
  wall: WallDimensions;
  onSettingsChange: (settings: ProjectSettings) => void;
}

export function useBackgroundAligner({
  settings,
  wall,
  onSettingsChange,
}: UseBackgroundAlignerProps) {
  const [alignOpen, setAlignOpen] = useState(false);
  const [alignDisplaySize, setAlignDisplaySize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [alignHandles, setAlignHandles] = useState<Point[] | null>(null);
  const alignImgRef = useRef<HTMLImageElement | null>(null);
  const draggingHandleRef = useRef<number | null>(null);

  const openAligner = () => {
    if (!settings.backgroundImage) return;
    const img = new Image();
    img.onload = () => {
      alignImgRef.current = img;
      const maxW = Math.min(900, window.innerWidth - 120);
      const scale = Math.min(1, maxW / img.width);
      const dispW = Math.round(img.width * scale);
      const dispH = Math.round(img.height * scale);
      setAlignDisplaySize({ w: dispW, h: dispH });
      setAlignHandles([
        { x: 8, y: 8 },
        { x: dispW - 8, y: 8 },
        { x: dispW - 8, y: dispH - 8 },
        { x: 8, y: dispH - 8 },
      ]);
      setAlignOpen(true);
    };
    img.src = settings.backgroundImage;
  };

  const onAlignPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    idx: number,
  ) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    draggingHandleRef.current = idx;
  };

  const onAlignPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingHandleRef.current === null) return;
    if (!alignHandles || !alignImgRef.current) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setAlignHandles((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => ({ ...p }));
      next[draggingHandleRef.current as number] = { x, y };
      return next;
    });
  };

  const onAlignPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    draggingHandleRef.current = null;
  };

  const solveAffine = (src: Point[], dst: Point[]) => {
    const A: number[][] = [];
    const B: number[] = [];
    for (let i = 0; i < 3; i++) {
      const sx = src[i].x;
      const sy = src[i].y;
      A.push([sx, sy, 1, 0, 0, 0]);
      B.push(dst[i].x);
      A.push([0, 0, 0, sx, sy, 1]);
      B.push(dst[i].y);
    }

    const n = 6;
    for (let i = 0; i < n; i++) {
      let piv = i;
      for (let r = i; r < n; r++) {
        if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
      }
      if (piv !== i) {
        [A[i], A[piv]] = [A[piv], A[i]];
        [B[i], B[piv]] = [B[piv], B[i]];
      }
      const ai = A[i][i];
      if (Math.abs(ai) < 1e-12) continue;
      for (let j = i; j < n; j++) A[i][j] /= ai;
      B[i] /= ai;
      for (let r = 0; r < n; r++) {
        if (r === i) continue;
        const factor = A[r][i];
        for (let c = i; c < n; c++) A[r][c] -= factor * A[i][c];
        B[r] -= factor * B[i];
      }
    }
    return B;
  };

  const drawTriangle = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    srcTri: Point[],
    dstTri: Point[],
  ) => {
    const [a, b, c, d, e, f] = solveAffine(srcTri, dstTri);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dstTri[0].x, dstTri[0].y);
    ctx.lineTo(dstTri[1].x, dstTri[1].y);
    ctx.lineTo(dstTri[2].x, dstTri[2].y);
    ctx.closePath();
    ctx.clip();
    ctx.setTransform(a, d, b, e, c, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  const warpQuadToRect = (
    img: HTMLImageElement,
    srcPts: Point[],
    tw: number,
    th: number,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dst = [
      { x: 0, y: 0 },
      { x: tw, y: 0 },
      { x: tw, y: th },
      { x: 0, y: th },
    ];
    drawTriangle(ctx, img, [srcPts[0], srcPts[1], srcPts[2]], [dst[0], dst[1], dst[2]]);
    drawTriangle(ctx, img, [srcPts[0], srcPts[2], srcPts[3]], [dst[0], dst[2], dst[3]]);
    return canvas.toDataURL('image/jpeg', 0.86);
  };

  const applyAlignment = async () => {
    if (!alignImgRef.current || !alignHandles) return;
    const img = alignImgRef.current;
    const dispW = alignDisplaySize.w || img.width;
    const dispH = alignDisplaySize.h || img.height;
    const scaleX = img.width / dispW;
    const scaleY = img.height / dispH;
    const srcPts = alignHandles.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }));
    const tw = Math.max(600, Math.min(2000, Math.round(1200)));
    const th = Math.round((wall.height / Math.max(1, wall.width)) * tw);
    const warped = warpQuadToRect(img, srcPts, tw, th);
    if (warped) {
      onSettingsChange({
        ...settings,
        backgroundImage: warped,
        backgroundFitMode: 'cover',
        useBackgroundPhoto: true,
      });
    }
    setAlignOpen(false);
  };

  const resizeImageFile = (file: File, maxWidth = 1600, maxHeight = 1600) =>
    new Promise<string | null>((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          let targetWidth = width;
          let targetHeight = height;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            targetWidth = Math.round(width * scale);
            targetHeight = Math.round(height * scale);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

  return {
    alignOpen,
    alignDisplaySize,
    alignHandles,
    setAlignOpen,
    openAligner,
    onAlignPointerDown,
    onAlignPointerMove,
    onAlignPointerUp,
    applyAlignment,
    resizeImageFile,
  };
}
