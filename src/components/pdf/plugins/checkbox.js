import {
  mm2pt,
  isHexValid,
  MM_TO_PT_RATIO,
  PT_TO_PX_RATIO,
} from "@pdfme/common";
import { cmyk, degrees, degreesToRadians, grayscale, rgb } from "pdf-lib";

export const HEX_COLOR_PATTERN =
  "^#(?:[A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$";

const px2mm = (px) => {
  return px / (PT_TO_PX_RATIO * MM_TO_PT_RATIO);
};
const px2pt = (px) => {
  return px / PT_TO_PX_RATIO;
};

export const convertForPdfLayoutProps = ({
  schema,
  pageHeight,
  applyRotateTranslate = true,
}) => {
  const {
    width: mmWidth,
    height: mmHeight,
    position,
    rotate,
    opacity,
  } = schema;
  const { x: mmX, y: mmY } = position;

  const rotateDegrees = rotate ? -rotate : 0;
  const width = mm2pt(mmWidth);
  const height = mm2pt(mmHeight);
  let x = mm2pt(mmX);
  let y = pageHeight - mm2pt(mmY) - height;

  if (rotateDegrees && applyRotateTranslate) {
    const pivotPoint = {
      x: x + width / 2,
      y: pageHeight - mm2pt(mmY) - height / 2,
    };
    const rotatedPoint = rotatePoint({ x, y }, pivotPoint, rotateDegrees);
    x = rotatedPoint.x;
    y = rotatedPoint.y;
  }

  return {
    position: { x, y },
    height: height,
    width: width,
    rotate: degrees(rotateDegrees),
    opacity,
  };
};
export const rotatePoint = (point, pivot, angleDegrees) => {
  const angleRadians = degreesToRadians(angleDegrees);

  const x =
    Math.cos(angleRadians) * (point.x - pivot.x) -
    Math.sin(angleRadians) * (point.y - pivot.y) +
    pivot.x;
  const y =
    Math.sin(angleRadians) * (point.x - pivot.x) +
    Math.cos(angleRadians) * (point.y - pivot.y) +
    pivot.y;

  return { x, y };
};

export const hex2CmykColor = (hexString) => {
  if (hexString) {
    const isValid = isHexValid(hexString);

    if (!isValid) {
      throw new Error(`Invalid hex color value ${hexString}`);
    }

    hexString = hexString.replace("#", "");

    const hexColor = hexString.substring(0, 6);
    const opacityColor = hexString.substring(6, 8);
    const opacity = opacityColor ? parseInt(opacityColor, 16) / 255 : 1;

    let r = parseInt(hexColor.substring(0, 2), 16) / 255;
    let g = parseInt(hexColor.substring(2, 4), 16) / 255;
    let b = parseInt(hexColor.substring(4, 6), 16) / 255;

    r = r * opacity + (1 - opacity);
    g = g * opacity + (1 - opacity);
    b = b * opacity + (1 - opacity);

    const k = 1 - Math.max(r, g, b);
    const c = r === 0 ? 0 : (1 - r - k) / (1 - k);
    const m = g === 0 ? 0 : (1 - g - k) / (1 - k);
    const y = b === 0 ? 0 : (1 - b - k) / (1 - k);

    return cmyk(c, m, y, k);
  }

  return undefined;
};

const hex2PrintingColor = (hexString, colorType) => {
  return colorType?.toLocaleLowerCase() == "cmyk"
    ? hex2CmykColor(hexString)
    : hex2RgbColor(hexString);
};

export const hex2RgbColor = (hexString) => {
  if (hexString) {
    const isValid = isHexValid(hexString);

    if (!isValid) {
      throw new Error(`Invalid hex color value ${hexString}`);
    }

    const [r, g, b] = hex2rgb(hexString);

    return rgb(r / 255, g / 255, b / 255);
  }

  return undefined;
};
const hex2rgb = (hex) => {
  if (hex.slice(0, 1) === "#") hex = hex.slice(1);
  if (hex.length === 3)
    hex =
      hex.slice(0, 1) +
      hex.slice(0, 1) +
      hex.slice(1, 2) +
      hex.slice(1, 2) +
      hex.slice(2, 3) +
      hex.slice(2, 3);

  return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((str) =>
    parseInt(str, 16)
  );
};
export const checkbox = {
  ui: async (arg) => {
    const { schema, rootElement, value, onChange } = arg;
    const div = document.createElement("div");
    const checkbox = document.createElement("input");
    div.appendChild(checkbox);
    div.style.marginLeft = "15px";
    div.style.marginTop = "15px";
    div.style.position = "relative";
    checkbox.type = "checkbox";
    checkbox.style.display = "none";
    checkbox.checked = String(value) === "true";
    div.style.width = "calc(100% - 30px)";
    div.style.height = "calc(100% - 30px)";

    const updateCheckmark = (isChecked) => {
      let svg = div.querySelector("svg"); // Find the existing SVG if any
      if (isChecked) {
        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 24 24");
          svg.style.width = "90%";
          svg.style.height = "90%";
          svg.style.position = "absolute";
          svg.style.top = "50%";
          svg.style.left = "50%";
          svg.style.transform = "translate(-50%, -50%)";
          svg.style.pointerEvents = "none";

          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          path.setAttribute("d", "M20 6L9 17l-5-5");
          path.setAttribute("stroke", "black");
          path.setAttribute("stroke-width", "4");
          path.setAttribute("fill", "none");
          svg.appendChild(path);

          div.appendChild(svg);
        }
      } else if (svg) {
        svg.remove();
      }
    };
    updateCheckmark(value === "true");
    div.addEventListener("click", () => {
      const newValue = !checkbox.checked;
      onChange && onChange(String(newValue));
      checkbox.checked = newValue;
      updateCheckmark(newValue);
    });

    div.style.boxSizing = "border-box";
    div.style.borderWidth = `${schema.borderWidth ?? 1}mm`;
    div.style.borderStyle = "solid";
    div.style.borderColor = schema.borderColor ?? "#000000";
    div.style.backgroundColor = schema.color ?? "transparent";

    rootElement.appendChild(div);
  },
  pdf: (arg) => {
    const { schema, page, options, value } = arg;
    const { colorType } = options;
    const pageHeight = page.getHeight();
    const cArg = { schema, pageHeight };

    const { position, width, height, rotate, opacity } =
      convertForPdfLayoutProps(cArg);
    const drawOptions = {
      rotate,
      borderWidth: px2pt(1),
      borderColor: hex2PrintingColor(
        schema.borderColor || "#000000",
        colorType
      ),
      color: hex2PrintingColor(schema.color || "#ffffff", colorType),
      opacity,
      borderOpacity: opacity,
    };
    const rectWidth = width - px2pt(1) - px2pt(30);
    const rectHeight = height - px2pt(1) - px2pt(30);

    // Always draw the checkbox rectangle
    page.drawRectangle({
      x: position.x + px2pt(15),
      y: position.y + px2pt(15),
      width: rectWidth,
      height: rectHeight,
      ...drawOptions,
    });

    // Draw checkmark if value is "true"
    if (String(value) === "true") {
      const checkmarkPath = "M 16 16 L 4 0 L 0 5";

      const originalWidth = 16;
      const originalHeight = 16;

      const scaleWidth = rectWidth / originalWidth;
      const scaleHeight = rectHeight / originalHeight;
      const checkmarkScaleFactor = Math.min(scaleWidth, scaleHeight) * 0.5;

      const checkmarkX =
        position.x + px2pt(15) + 0.5 * (checkmarkScaleFactor * originalWidth);
      const checkmarkY =
        position.y + px2pt(15) + 0.5 * (checkmarkScaleFactor * originalHeight);

      page.drawSvgPath(checkmarkPath, {
        x: checkmarkX,
        y: checkmarkY,
        scale: checkmarkScaleFactor,
        borderColor: grayscale(0),
        borderWidth: mm2pt(1),
      });
    }
  },
  propPanel: {
    schema: ({ i18n }) => ({
      borderWidth: {
        title: "Border width",
        type: "number",
        widget: "inputNumber",
        min: 0,
        step: 1,
      },
      borderColor: {
        title: "Border color",
        type: "string",
        widget: "color",
        rules: [{ pattern: HEX_COLOR_PATTERN, message: "Select color" }],
      },
      color: {
        title: "Color",
        type: "string",
        widget: "color",
        rules: [{ pattern: HEX_COLOR_PATTERN, message: "Select color" }],
      },
    }),
    defaultValue: "",
    defaultSchema: {
      type: "checkbox",
      position: { x: 0, y: 0 },
      width: 14.5,
      height: 14.5,
      rotate: 0,
      opacity: 1,
      borderWidth: 1,
      borderColor: "#000000",
      color: "#ffffff",
      readOnly: false,
    },
  },
};
