import React from 'react';
import { Circle, Rect, Line, Path, Group } from 'react-konva';

interface QuestShapeProps {
  shape?: string;
  size: number;
  isSelected?: boolean;
  stageScale?: number;
  customStrokeColor?: string;
  customFillColor?: string;
}

export const QuestShape: React.FC<QuestShapeProps> = ({
  shape = 'circle',
  size,
  isSelected = false,
  stageScale = 1,
  customStrokeColor,
  customFillColor
}) => {
  const normShape = (shape || 'circle').toLowerCase();
  const R = size / 2;
  const strokeWidth = Math.max(1.5, 2.5 / stageScale);
  const selStrokeWidth = Math.max(1.5, 2.0 / stageScale);

  // Colores base de marco FTB Quests
  const fillColor = customFillColor || '#1e1e2e';
  const strokeColor = customStrokeColor || '#6c7086';
  const selStrokeColor = '#ffffff';

  // Helper para generar polígonos regulares
  const getRegularPolygonPoints = (sides: number, radius: number, angleOffset: number = 0): number[] => {
    const points: number[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides + angleOffset;
      points.push(radius * Math.cos(angle), radius * Math.sin(angle));
    }
    return points;
  };

  // Helper para generar el engranaje (gear) de 8 dientes característico de FTB Quests
  const getGearPoints = (outerR: number, innerR: number): number[] => {
    const points: number[] = [];
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const baseAngle = (i * 2 * Math.PI) / teeth;
      const step = (2 * Math.PI) / (teeth * 4);

      // 4 puntos por diente: raíz, diente izquierda, diente derecha, valle
      const a1 = baseAngle - step;
      const a2 = baseAngle - step * 0.4;
      const a3 = baseAngle + step * 0.4;
      const a4 = baseAngle + step;

      points.push(innerR * Math.cos(a1), innerR * Math.sin(a1));
      points.push(outerR * Math.cos(a2), outerR * Math.sin(a2));
      points.push(outerR * Math.cos(a3), outerR * Math.sin(a3));
      points.push(innerR * Math.cos(a4), innerR * Math.sin(a4));
    }
    return points;
  };

  const renderShapeElement = (radiusExtra = 0, isHighlight = false) => {
    const currentR = R + radiusExtra;
    const currentSize = size + radiusExtra * 2;
    const stroke = isHighlight ? selStrokeColor : strokeColor;
    const fill = isHighlight ? undefined : fillColor;
    const sWidth = isHighlight ? selStrokeWidth : strokeWidth;
    const dash = isHighlight ? [5, 5] : undefined;

    switch (normShape) {
      case 'square':
        return (
          <Rect
            x={-currentR}
            y={-currentR}
            width={currentSize}
            height={currentSize}
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
            dash={dash}
          />
        );

      case 'rsquare':
        return (
          <Rect
            x={-currentR}
            y={-currentR}
            width={currentSize}
            height={currentSize}
            cornerRadius={currentR * 0.35}
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
            dash={dash}
          />
        );

      case 'diamond':
        return (
          <Line
            points={[0, -currentR * 1.08, currentR * 1.08, 0, 0, currentR * 1.08, -currentR * 1.08, 0]}
            closed
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
            dash={dash}
            lineJoin="round"
          />
        );

      case 'hexagon':
        return (
          <Line
            points={getRegularPolygonPoints(6, currentR * 1.05, Math.PI / 6)}
            closed
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
            dash={dash}
            lineJoin="round"
          />
        );

      case 'octagon':
        return (
          <Line
            points={getRegularPolygonPoints(8, currentR * 1.04, Math.PI / 8)}
            closed
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
            dash={dash}
            lineJoin="round"
          />
        );

      case 'pentagon':
        return (
          <Line
            points={getRegularPolygonPoints(5, currentR * 1.06, -Math.PI / 2)}
            closed
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
            dash={dash}
            lineJoin="round"
          />
        );

      case 'gear':
        return (
          <Line
            points={getGearPoints(currentR * 1.1, currentR * 0.82)}
            closed
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
            dash={dash}
            lineJoin="round"
          />
        );

      case 'heart': {
        const scale = currentSize / 36;
        const heartPath = "M 0,-6 C 0,-14 -16,-14 -16,-2 C -16,8 0,16 0,16 C 0,16 16,8 16,-2 C 16,-14 0,-14 0,-6 Z";
        return (
          <Path
            data={heartPath}
            scaleX={scale}
            scaleY={scale}
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth / scale}
            dash={dash ? [5 / scale, 5 / scale] : undefined}
            lineJoin="round"
          />
        );
      }

      case 'circle':
      default:
        return (
          <Circle
            radius={currentR}
            fill={fill}
            stroke={stroke}
            strokeWidth={sWidth}
            dash={dash}
          />
        );
    }
  };

  return (
    <Group listening={false}>
      {/* Marco de fondo base */}
      {renderShapeElement(0, false)}

      {/* Contorno de selección cuando está seleccionado */}
      {isSelected && renderShapeElement(3 / stageScale + 2, true)}
    </Group>
  );
};
