
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const Calculator = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [preview, setPreview] = useState("");
  const [isCommitted, setIsCommitted] = useState(false);
  const [showFx, setShowFx] = useState(false);
  const [isDegree, setIsDegree] = useState(true);
  const [isShift, setIsShift] = useState(false);
  const [inputOverflow, setInputOverflow] = useState(false);
  const [outputOverflow, setOutputOverflow] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const lastAnswerRef = useRef("");
  const inputScrollRef = useRef(null);
  const typingUntilRef = useRef(0);
  const previewTimeoutRef = useRef(null);
  const previewTaskRef = useRef(null);
  const lastPressTimeRef = useRef(0);
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const safePaddingTop = (insets.top || 0) + 10;
  // Keep '=' close to the bottom while still clearing the gesture/nav bar.
  const safePaddingBottom = (insets.bottom || 0) + 2;

  const isCompactHeight = screenHeight < 720;
  const buttonHeight = isCompactHeight ? 46 : 52;
  const buttonMargin = isCompactHeight ? 3 : 4;
  const toggleHeight = isCompactHeight ? 44 : 50;

  const displayMetrics = useMemo(() => {
    const inputFontSize = isCommitted ? 28 : 48;
    const inputLineHeight = Math.round(inputFontSize * 1.12);
    const outputFontSize = isCommitted ? 52 : 26;
    const outputLineHeight = Math.round(outputFontSize * 1.1);
    return { inputFontSize, inputLineHeight, outputFontSize, outputLineHeight };
  }, [isCommitted]);

  const maxInputLines = 3;
  const maxOutputLines = 2;

  const applyReciprocalToLastTerm = (src) => {
    const text = src ?? "";
    if (!text.trim()) return "1/(";

    const end = text.length - 1;
    const last = text[end];

    const isDigit = (ch) => ch >= "0" && ch <= "9";
    const isAlpha = (ch) => (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");

    const wrap = (startIndex, endIndex) => {
      const before = text.slice(0, startIndex);
      const term = text.slice(startIndex, endIndex + 1);
      const after = text.slice(endIndex + 1);
      return `${before}1/(${term})${after}`;
    };

    if (last === ")") {
      let depth = 0;
      let i = end;
      for (; i >= 0; i--) {
        const ch = text[i];
        if (ch === ")") depth++;
        else if (ch === "(") {
          depth--;
          if (depth === 0) break;
        }
      }
      if (i < 0) return `1/(${text})`;

      let start = i;
      while (start - 1 >= 0) {
        const ch = text[start - 1];
        if (isAlpha(ch) || ch === "⁻" || ch === "¹") start--;
        else break;
      }
      return wrap(start, end);
    }

    if (isDigit(last) || last === ".") {
      let start = end;
      while (start - 1 >= 0) {
        const ch = text[start - 1];
        if (isDigit(ch) || ch === ".") start--;
        else break;
      }
      return wrap(start, end);
    }

    if (last === "π" || last === "e") return wrap(end, end);

    return text + "1/(";
  };

  const handleButtonPress = (value) => {
    const now = Date.now();
    if (now - lastPressTimeRef.current < 100) return; // Debounce to prevent double presses
    lastPressTimeRef.current = now;

    if (value === "AC") {
      setInput("");
      setResult("");
      setPreview("");
      setIsCommitted(false);
      setInputOverflow(false);
      setOutputOverflow(false);
    } else if (value === "⌫") {
      setInput((prev) => prev.slice(0, -1));
      setIsCommitted(false);
    } else if (value === "EXP") {
      setInput((prev) => prev + "exp(");
      setIsCommitted(false);
    } else if (value === "x/y") {
      setInput((prev) => prev + "**(");
      setIsCommitted(false);
    } else if (value === "x⁻¹") {
      setInput((prev) => applyReciprocalToLastTerm(prev));
      setIsCommitted(false);
    } else if (value === "10^") {
      setInput((prev) => prev + "10^");
      setIsCommitted(false);
    } else if (value === "e^") {
      setInput((prev) => prev + "e^");
      setIsCommitted(false);
    } else if (value === "=") {
      try {
        const evalResult = evaluateExpression(input, isDegree);
        const next = String(evalResult);
        setResult(next);
        if (next !== "Error") lastAnswerRef.current = next;
        setIsCommitted(true);
      } catch (error) {
        setResult("Error");
        setIsCommitted(true);
      }
    } else if (value === "Rad") {
      setIsDegree(false);
      setIsCommitted(false);
      if (input) {
        try {
          const evalResult = evaluateExpression(input, false);
          const next = String(evalResult);
          setResult(next);
          if (next !== "Error") lastAnswerRef.current = next;
        } catch {
          setResult("Error");
        }
      }
    } else if (value === "Deg") {
      setIsDegree(true);
      setIsCommitted(false);
      if (input) {
        try {
          const evalResult = evaluateExpression(input, true);
          const next = String(evalResult);
          setResult(next);
          if (next !== "Error") lastAnswerRef.current = next;
        } catch {
          setResult("Error");
        }
      }
    } else if (value === "Ans") {
      const ans = (lastAnswerRef.current ?? "").toString();
      if (ans.length) {
        setInput((prev) => prev + `(${ans})`);
        setIsCommitted(false);
      }
    } else if (value === "Shift") {
      setIsShift((prev) => !prev);
    } else {
      setInput((prev) => (prev === "Error" ? value : prev + value));
      setIsCommitted(false);
    }
  };

  useEffect(() => {
    if (!inputScrollRef.current || !inputOverflow) return;
    requestAnimationFrame(() => {
      inputScrollRef.current?.scrollToEnd?.({ animated: false });
    });
  }, [input, inputOverflow]);

  useEffect(() => {
    if (!input) {
      setPreview("");
      return;
    }

    const shouldPreview =
      /[+\-×÷%]/.test(input) ||
      input.includes("(") ||
      input.includes(")") ||
      input.includes("sin") ||
      input.includes("cos") ||
      input.includes("tan") ||
      input.includes("log") ||
      input.includes("ln") ||
      input.includes("√") ||
      input.includes("exp") ||
      input.includes("10^") ||
      input.includes("e^") ||
      input.includes("fact") ||
      input.includes("**");

    if (!shouldPreview || isCommitted) {
      setPreview("");
      return;
    }

    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    if (previewTaskRef.current) previewTaskRef.current.cancel();
    previewTimeoutRef.current = setTimeout(() => {
      previewTaskRef.current = InteractionManager.runAfterInteractions(() => {
        try {
          const val = evaluateExpression(input, isDegree);
          const next = String(val);
          const safe =
            next === "NaN" || next === "Infinity" || next === "-Infinity" ? "" : next;
          setPreview((prev) => (prev === safe ? prev : safe));
        } catch {
          setPreview((prev) => (prev === "" ? prev : ""));
        }
      });
    }, 120);

    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      if (previewTaskRef.current) previewTaskRef.current.cancel();
    };
  }, [input, isDegree, isCommitted]);

  useEffect(() => {
    setIsCommitted(false);
  }, [showFx]);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < typingUntilRef.current) return;
      setCursorOn((v) => !v);
    }, 520);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isCommitted) return;
    typingUntilRef.current = Date.now() + 700;
    setCursorOn((prev) => (prev ? prev : true));
  }, [input, isCommitted]);

  const CalcButton = ({ label, color, onPress, style }) => (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        style,
        { height: buttonHeight, margin: buttonMargin },
        { backgroundColor: color || "#333" },
        label === "Rad" && !isDegree ? styles.activeMode : null,
        label === "Deg" && isDegree ? styles.activeMode : null,
        label === "Shift" && isShift ? styles.activeMode : null,
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
      onPress={onPress}
      hitSlop={8}
      pressRetentionOffset={12}
    >
      <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );

  const modeText = isDegree ? "Deg Mode" : "Rad Mode";

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View
        style={[
          styles.container,
          { paddingTop: safePaddingTop, paddingBottom: safePaddingBottom },
        ]}
      >
        <View style={styles.topArea}>
          <Text style={styles.modeText}>{modeText}</Text>
        </View>

        <View style={styles.display}>
          {/* Input Expression */}
          <View
            style={[
              styles.inputArea,
              { height: displayMetrics.inputLineHeight * maxInputLines, width: screenWidth - 20 },
            ]}
          >
            {inputOverflow ? (
              <ScrollView
                ref={inputScrollRef}
                horizontal
                onContentSizeChange={() => {
                  inputScrollRef.current?.scrollToEnd?.({ animated: false });
                }}
                contentContainerStyle={styles.inputScrollContent}
                style={styles.inputScroll}
                showsHorizontalScrollIndicator={false}
              >
                <Text
                  style={[
                    styles.inputText,
                    isCommitted && styles.inputTextCommitted,
                    { fontSize: displayMetrics.inputFontSize, lineHeight: displayMetrics.inputLineHeight },
                    !isCommitted && styles.inputTextWithCursorSpace,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                >
                  {input}
                </Text>
              </ScrollView>
            ) : (
              <View style={styles.inputWrap}>
                <Text
                  style={[
                    styles.inputText,
                    isCommitted && styles.inputTextCommitted,
                    { fontSize: displayMetrics.inputFontSize, lineHeight: displayMetrics.inputLineHeight },
                    !isCommitted && styles.inputTextWithCursorSpace,
                  ]}
                  onTextLayout={(e) => {
                    const next = e.nativeEvent.lines.length > maxInputLines;
                    setInputOverflow((prev) => (prev === next ? prev : next));
                  }}
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                >
                  {input}
                </Text>
              </View>
            )}

            {!isCommitted && (
              <View pointerEvents="none" style={styles.cursorOverlay}>
                <Text
                  style={[
                    styles.cursor,
                    {
                      opacity: cursorOn ? 1 : 0,
                      fontSize: displayMetrics.inputFontSize + 4,
                      lineHeight: displayMetrics.inputLineHeight,
                    },
                  ]}
                >
                  |
                </Text>
              </View>
            )}
          </View>

          {/* Result */}
          <View
            style={[
              styles.outputArea,
              { height: displayMetrics.outputLineHeight * maxOutputLines, width: screenWidth - 20 },
            ]}
          >
            {outputOverflow ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.outputScrollContent}
                style={styles.outputScroll}
              >
                <Text
                  style={[
                    styles.resultText,
                    isCommitted && styles.resultTextCommitted,
                    { fontSize: displayMetrics.outputFontSize, lineHeight: displayMetrics.outputLineHeight },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {isCommitted ? result : preview}
                </Text>
              </ScrollView>
            ) : (
              <View style={styles.outputWrap}>
                <Text
                  style={[
                    styles.resultText,
                    isCommitted && styles.resultTextCommitted,
                    { fontSize: displayMetrics.outputFontSize, lineHeight: displayMetrics.outputLineHeight },
                  ]}
                  onTextLayout={(e) => {
                    const next = e.nativeEvent.lines.length > maxOutputLines;
                    setOutputOverflow((prev) => (prev === next ? prev : next));
                  }}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {isCommitted ? result : preview}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.keypad}>
          {/* Toggle Buttons Row */}
          <View style={styles.row}>
            <CalcButton
              label="123"
              color={!showFx ? "#4F46E5" : "#333"}
              onPress={() => setShowFx(false)}
              style={[styles.toggleButton, { height: toggleHeight }]}
            />
            <CalcButton
              label="Fx"
              color={showFx ? "#4F46E5" : "#333"}
              onPress={() => setShowFx(true)}
              style={[styles.toggleButton, { height: toggleHeight }]}
            />
          </View>

          {/* Calculator Buttons */}
          {showFx ? (
            <>
              <View style={styles.row}>
                <CalcButton label="AC" color="#DC2626" onPress={() => handleButtonPress("AC")} />
                <CalcButton label="Rad" onPress={() => handleButtonPress("Rad")} />
                <CalcButton label="Deg" onPress={() => handleButtonPress("Deg")} />
                
                <CalcButton label="⌫" color="#2563EB" onPress={() => handleButtonPress("⌫")} />
              </View>
              <View style={styles.row}>
                <CalcButton
                  label="Shift"
                  color="#9333EA"
                  onPress={() => handleButtonPress("Shift")}
                />
                <CalcButton
                  label={isShift ? "sin⁻¹(" : "sin("}
                  onPress={() => handleButtonPress(isShift ? "sin⁻¹(" : "sin(")}
                />
                <CalcButton
                  label={isShift ? "cos⁻¹(" : "cos("}
                  onPress={() => handleButtonPress(isShift ? "cos⁻¹(" : "cos(")}
                />
                <CalcButton
                  label={isShift ? "tan⁻¹(" : "tan("}
                  onPress={() => handleButtonPress(isShift ? "tan⁻¹(" : "tan(")}
                />
              </View>
              <View style={styles.row}>
                <CalcButton label="fact(" onPress={() => handleButtonPress("fact(")} />
                <CalcButton
                  label={isShift ? "10^" : "log("}
                  onPress={() => handleButtonPress(isShift ? "10^" : "log(")}
                />
                <CalcButton
                  label={isShift ? "e^" : "ln("}
                  onPress={() => handleButtonPress(isShift ? "e^" : "ln(")}
                />
                <CalcButton label="π" onPress={() => handleButtonPress("π")} />
              </View>
              <View style={styles.row}>
                <CalcButton label="Ans" onPress={() => handleButtonPress("Ans")} />
                  
                <CalcButton
                  label={isShift ? "x²" : "√("}
                  onPress={() => handleButtonPress(isShift ? "**2" : "√(")}
                />
                <CalcButton label="e" onPress={() => handleButtonPress("e")} />
                
                <CalcButton label="^" onPress={() => handleButtonPress("**")} />
              </View>
              <View style={styles.row}>
                <CalcButton label="EXP" onPress={() => handleButtonPress("EXP")} />
                <CalcButton label=")" onPress={() => handleButtonPress(")")} />
                <CalcButton label="x/y" onPress={() => handleButtonPress("x/y")} />
                <CalcButton label="x⁻¹" onPress={() => handleButtonPress("x⁻¹")} />
              </View>
              <View style={[styles.row, { marginBottom: 0 }]}>
                <CalcButton label="=" color="#F97316" onPress={() => handleButtonPress("=")} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <CalcButton label="AC" color="#DC2626" onPress={() => handleButtonPress("AC")} />
                <CalcButton label="(" onPress={() => handleButtonPress("(")} />
                <CalcButton label=")" onPress={() => handleButtonPress(")")} />
                <CalcButton label="⌫" color="#2563EB" onPress={() => handleButtonPress("⌫")} />
              </View>
              <View style={styles.row}>
                <CalcButton label="7" onPress={() => handleButtonPress("7")} />
                <CalcButton label="8" onPress={() => handleButtonPress("8")} />
                <CalcButton label="9" onPress={() => handleButtonPress("9")} />
                <CalcButton label="÷" color="#0D9488" onPress={() => handleButtonPress("÷")} />
              </View>
              <View style={styles.row}>
                <CalcButton label="4" onPress={() => handleButtonPress("4")} />
                <CalcButton label="5" onPress={() => handleButtonPress("5")} />
                <CalcButton label="6" onPress={() => handleButtonPress("6")} />
                <CalcButton label="×" color="#0D9488" onPress={() => handleButtonPress("×")} />
              </View>
              <View style={styles.row}>
                <CalcButton label="1" onPress={() => handleButtonPress("1")} />
                <CalcButton label="2" onPress={() => handleButtonPress("2")} />
                <CalcButton label="3" onPress={() => handleButtonPress("3")} />
                <CalcButton label="-" color="#0D9488" onPress={() => handleButtonPress("-")} />
              </View>
              <View style={styles.row}>
                <CalcButton label="0" onPress={() => handleButtonPress("0")} />
                <CalcButton label="." onPress={() => handleButtonPress(".")} />
                <CalcButton label="%" onPress={() => handleButtonPress("%")} />
                <CalcButton label="+" color="#0D9488" onPress={() => handleButtonPress("+")} />
              </View>
              <View style={[styles.row, { marginBottom: 0 }]}>
                <CalcButton label="=" color="#F97316" onPress={() => handleButtonPress("=")} />
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 10,
  },
  topArea: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  display: {
    flex: 1,
    justifyContent: "flex-end",
  },
  keypad: {
    flexShrink: 0,
    justifyContent: "flex-end",
  },
  modeText: {
    fontSize: 20,
    color: "#9ca3af",
    textAlign: "left",
    marginBottom: 2,
  },
  inputArea: {
    alignSelf: "stretch",
    justifyContent: "flex-end",
    marginBottom: 4,
    overflow: "hidden",
  },
  inputScroll: {
    marginBottom: 0,
  },
  inputScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  inputWrap: {
    alignSelf: "stretch",
    overflow: "hidden",
    marginBottom: 0,
  },
  inputText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "right",
    includeFontPadding: false,
  },
  inputTextWithCursorSpace: {
    paddingRight: 8,
  },
  inputTextCommitted: {
    fontWeight: "600",
    color: "#9ca3af",
  },
  cursor: {
    fontWeight: "200",
    color: "#F97316",
    includeFontPadding: false,
    letterSpacing: -1,
    transform: [{ scaleY: 1.8 }, { scaleX: 1 }],
  },
  cursorOverlay: {
    position: "absolute",
    right: 2,
    bottom: 0,
  },
  resultText: {
    color: "#9ca3af",
    textAlign: "right",
    marginBottom: 13,
    fontWeight: "600",
  },
  resultTextCommitted: {
     color: "#fff",
    fontWeight: "700",
    marginBottom: 10,
  },
  outputArea: {
    alignSelf: "stretch",
    justifyContent: "flex-end",
    marginBottom: 0,
    overflow: "hidden",
  },
  outputScroll: {
    marginBottom: 0,
  },
  outputScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  outputWrap: {
    alignSelf: "stretch",
    overflow: "hidden",
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButton: {
    flex: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  activeMode: {
    backgroundColor: "#9333EA",
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000" />
      <Calculator />
    </SafeAreaProvider>
  );
}

function evaluateExpression(input, isDegree) {
  const factorial = (n) => {
    if (n < 0) throw new Error("Invalid factorial");
    if (n > 170) throw new Error("Overflow");
    return n <= 1 ? 1 : n * factorial(n - 1);
  };

  const toRad = (x) => (isDegree ? (x * Math.PI) / 180 : x);
  const fromRad = (x) => (isDegree ? (x * 180) / Math.PI : x);

  const sqrt = (x) => Math.sqrt(x);
  const sin = (x) => Math.sin(toRad(x));
  const cos = (x) => Math.cos(toRad(x));
  const tan = (x) => Math.tan(toRad(x));

  const asin = (x) => fromRad(Math.asin(x));
  const acos = (x) => fromRad(Math.acos(x));
  const atan = (x) => fromRad(Math.atan(x));

  const log = (x) => Math.log10(x);
  const ln = (x) => Math.log(x);
  const exp = (x) => Math.exp(x);
  const pow10 = (x) => Math.pow(10, x);

  const PI = Math.PI;
  const E = Math.E;

  const rewritePowTokens = (raw) => {
    const s = raw ?? "";
    const readTerm = (start) => {
      let i = start;
      if (i < s.length && s[i] === "-") i++;
      if (i >= s.length) return { term: "", next: i };

      const ch = s[i];
      const isDigit = (c) => c >= "0" && c <= "9";
      const isAlpha = (c) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");

      if (ch === "(") {
        let depth = 0;
        let j = i;
        for (; j < s.length; j++) {
          if (s[j] === "(") depth++;
          else if (s[j] === ")") {
            depth--;
            if (depth === 0) {
              j++;
              break;
            }
          }
        }
        return { term: s.slice(start, j), next: j };
      }

      if (isDigit(ch) || ch === ".") {
        let j = i;
        for (; j < s.length; j++) {
          const c = s[j];
          if (isDigit(c) || c === ".") continue;
          break;
        }
        return { term: s.slice(start, j), next: j };
      }

      if (ch === "π" || ch === "e") {
        return { term: s.slice(start, i + 1), next: i + 1 };
      }

      if (isAlpha(ch)) {
        let j = i;
        for (; j < s.length; j++) {
          const c = s[j];
          if (isAlpha(c) || c === "⁻" || c === "¹") continue;
          break;
        }
        if (j < s.length && s[j] === "(") {
          let depth = 0;
          let k = j;
          for (; k < s.length; k++) {
            if (s[k] === "(") depth++;
            else if (s[k] === ")") {
              depth--;
              if (depth === 0) {
                k++;
                break;
              }
            }
          }
          return { term: s.slice(start, k), next: k };
        }
        return { term: s.slice(start, j), next: j };
      }

      return { term: s.slice(start, i + 1), next: i + 1 };
    };

    let out = "";
    let i = 0;
    while (i < s.length) {
      if (s.startsWith("10^", i)) {
        const { term, next } = readTerm(i + 3);
        out += term ? `pow10(${term})` : "pow10(";
        i = next;
        continue;
      }
      if (s.startsWith("e^", i)) {
        const { term, next } = readTerm(i + 2);
        out += term ? `exp(${term})` : "exp(";
        i = next;
        continue;
      }
      out += s[i];
      i++;
    }
    return out;
  };

  let expression = input
    .split("")
    .join("");

  expression = rewritePowTokens(expression)
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/sin⁻¹\(/g, "asin(")
    .replace(/cos⁻¹\(/g, "acos(")
    .replace(/tan⁻¹\(/g, "atan(")
    .replace(/sin\(/g, "sin(")
    .replace(/cos\(/g, "cos(")
    .replace(/tan\(/g, "tan(")
    .replace(/√\(/g, "sqrt(")
    .replace(/√/g, "sqrt")
    .replace(/log\(/g, "log(")
    .replace(/ln\(/g, "ln(")
    .replace(/EXP/g, "exp")
    .replace(/fact\(/g, "factorial(")
    .replace(/π/g, "PI");

  // Replace constant 'e' only when it's a standalone token (avoid 'exp', 'Deg', etc.)
  expression = expression.replace(
    /(^|[^A-Za-z0-9_])e([^A-Za-z0-9_]|$)/g,
    (_m, p1, p2) => `${p1}E${p2}`
  );

  return Function(
    "factorial",
    "sqrt",
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "log",
    "ln",
    "exp",
    "pow10",
    "PI",
    "E",
    `"use strict"; return (${expression});`
  )(factorial, sqrt, sin, cos, tan, asin, acos, atan, log, ln, exp, pow10, PI, E);
}
