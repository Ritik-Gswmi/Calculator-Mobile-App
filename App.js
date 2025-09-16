
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const Calculator = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [showFx, setShowFx] = useState(false);
  const [isDegree, setIsDegree] = useState(true);
  const [isShift, setIsShift] = useState(false);

  const handleButtonPress = (value) => {
    if (value === "AC") {
      setInput("");
      setResult("");
    } else if (value === "⌫") {
      setInput((prev) => prev.slice(0, -1));
    } else if (value === "=") {
      try {
        let expression = input
          .replace(/×/g, "*")
          .replace(/÷/g, "/")
          .replace(/√/g, "Math.sqrt")
          .replace(/sin⁻¹\(/g, isDegree ? "Math.asin(" + "Math.PI/180*" : "Math.asin(")
          .replace(/cos⁻¹\(/g, isDegree ? "Math.acos(" + "Math.PI/180*" : "Math.acos(")
          .replace(/tan⁻¹\(/g, isDegree ? "Math.atan(" + "Math.PI/180*" : "Math.atan(")
          .replace(/sin\(/g, isDegree ? "Math.sin(Math.PI/180*" : "Math.sin(")
          .replace(/cos\(/g, isDegree ? "Math.cos(Math.PI/180*" : "Math.cos(")
          .replace(/tan\(/g, isDegree ? "Math.tan(Math.PI/180*" : "Math.tan(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/10\^/g, "Math.pow(10,")
          .replace(/ln\(/g, "Math.log(")
          .replace(/e\^/g, "Math.exp(")
          .replace(/π/g, "Math.PI")
          .replace(/e/g, "Math.E")
          .replace(/fact\(/g, "factorial(")
          .replace(/EXP/g, "Math.exp");

        const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

        const evalResult = eval(expression);
        setResult(evalResult.toString());
      } catch (error) {
        setResult("Error");
      }
    } else if (value === "Rad") {
      setIsDegree(false);
      if (input) {
        try {
          const evalResult = evaluateExpression(input, false);
          setResult(String(evalResult));
        } catch {
          setResult("Error");
        }
      }
    } else if (value === "Deg") {
      setIsDegree(true);
      if (input) {
        try {
          const evalResult = evaluateExpression(input, true);
          setResult(String(evalResult));
        } catch {
          setResult("Error");
        }
      }
    } else if (value === "Ans") {
      setInput((prev) => prev + result);
    } else if (value === "Shift") {
      setIsShift((prev) => !prev);
    } else {
      setInput((prev) => (prev === "Error" ? value : prev + value));
    }
  };

  const CalcButton = ({ label, color, onPress, style }) => (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        style,
        { backgroundColor: color || "#333" },
        label === "Rad" && !isDegree ? styles.activeMode : null,
        label === "Deg" && isDegree ? styles.activeMode : null,
        label === "Shift" && isShift ? styles.activeMode : null,
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
      onPress={onPress}
    >
      <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );

  const modeText = isDegree ? "Deg Mode" : "Rad Mode";

  return (
    <View style={styles.container}>
      {/* Mode at Top */}
      <Text style={styles.modeText}>{modeText}</Text>

      {/* Input Expression */}
      <ScrollView
        horizontal
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ marginBottom: 10 }}
      >
        <Text style={styles.inputText}>{input || "0"}</Text>
      </ScrollView>

      {/* Result */}
      <Text style={styles.resultText}>{result}</Text>

      {/* Toggle Buttons Row */}
      <View style={styles.row}>
        <CalcButton
          label="123"
          color={!showFx ? "#4F46E5" : "#333"}
          onPress={() => setShowFx(false)}
          style={styles.toggleButton}
        />
        <CalcButton
          label="Fx"
          color={showFx ? "#4F46E5" : "#333"}
          onPress={() => setShowFx(true)}
          style={styles.toggleButton}
        />
      </View>

      {/* Calculator Buttons */}
      {showFx ? (
        <>
          <View style={styles.row}>
            <CalcButton label="AC" color="#DC2626" onPress={() => handleButtonPress("AC")} />
            <CalcButton label="Rad" onPress={() => handleButtonPress("Rad")} />
            <CalcButton label="Deg" onPress={() => handleButtonPress("Deg")} />
            <CalcButton label="fact(" onPress={() => handleButtonPress("fact(")} />
          </View>
          <View style={styles.row}>
            <CalcButton label="Shift" color="#9333EA" onPress={() => handleButtonPress("Shift")} />
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
            <CalcButton
              label={isShift ? "10^" : "log("}
              onPress={() => handleButtonPress(isShift ? "10^" : "log(")}
            />
            <CalcButton
              label={isShift ? "e^" : "ln("}
              onPress={() => handleButtonPress(isShift ? "e^" : "ln(")}
            />
            <CalcButton label="π" onPress={() => handleButtonPress("π")} />
            <CalcButton label="e" onPress={() => handleButtonPress("e")} />
          </View>
          <View style={styles.row}>
            <CalcButton label="Ans" onPress={() => handleButtonPress("Ans")} />
            <CalcButton
              label={isShift ? "x²" : "√("}
              onPress={() => handleButtonPress(isShift ? "**2" : "√(")}
            />
            <CalcButton label="EXP" onPress={() => handleButtonPress("EXP")} />
            <CalcButton label="^" onPress={() => handleButtonPress("**")} />
          </View>
          <View style={styles.row}>
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
          <View style={styles.row}>
            <CalcButton label="=" color="#F97316" onPress={() => handleButtonPress("=")} />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 10,
  },
  modeText: {
    fontSize: 20,
    color: "#9ca3af",
    textAlign: "right",
    marginBottom: 5,
  },
  inputText: {
    fontSize: 48,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "right",
  },
  resultText: {
    fontSize: 28,
    color: "#9ca3af",
    textAlign: "right",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  button: {
    flex: 1,
    margin: 5,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButton: {
    flex: 1,
    margin: 5,
    height: 60,
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

export default Calculator;

function evaluateExpression(input, isDegree) {
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

  let expression = input
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/√/g, "Math.sqrt")
    .replace(/sin⁻¹\(/g, isDegree ? "Math.asin(" + "Math.PI/180*" : "Math.asin(")
    .replace(/cos⁻¹\(/g, isDegree ? "Math.acos(" + "Math.PI/180*" : "Math.acos(")
    .replace(/tan⁻¹\(/g, isDegree ? "Math.atan(" + "Math.PI/180*" : "Math.atan(")
    .replace(/sin\(/g, isDegree ? "Math.sin(Math.PI/180*" : "Math.sin(")
    .replace(/cos\(/g, isDegree ? "Math.cos(Math.PI/180*" : "Math.cos(")
    .replace(/tan\(/g, isDegree ? "Math.tan(Math.PI/180*" : "Math.tan(")
    .replace(/log\(/g, "Math.log10(")
    .replace(/10\^/g, "Math.pow(10,")
    .replace(/ln\(/g, "Math.log(")
    .replace(/e\^/g, "Math.exp(")
    .replace(/π/g, "Math.PI")
    .replace(/e/g, "Math.E")
    .replace(/fact\(/g, "factorial(")
    .replace(/EXP/g, "Math.exp");

  return Function("factorial", `return (${expression})`)(factorial);
}