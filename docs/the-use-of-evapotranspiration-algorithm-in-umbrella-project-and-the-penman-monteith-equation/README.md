# The Use of Evapotranspiration Algorithm in Umbrella Project and the Penman-Monteith Equation

[![Research Paper](https://img.shields.io/badge/Research-Paper-blue)](https://nekshadesilva.com/docs/the-use-of-evapotranspiration-algorithm-in-umbrella-project-and-the-penman-monteith-equation/)
[![Author](https://img.shields.io/badge/Author-Neksha%20DeSilva-green)](https://nekshadesilva.com)
[![Date](https://img.shields.io/badge/Date-August%202025-orange)](https://nekshadesilva.com)

## Abstract

Traditional irrigation systems operate on a reactive principle - they respond to soil moisture deficits after plants have already begun experiencing stress. The **Umbrella Project** introduces a fundamentally different approach: **predictive environmental intelligence**. By implementing the Penman-Monteith evapotranspiration (ET) equation, the system anticipates water requirements before stress occurs, delivering precisely the amount of water that will evaporate and transpire within the next operational cycle.

This research explores the theoretical foundations, engineering challenges, and practical implementations that enable autonomous irrigation through environmental parameter sensing and algorithmic prediction.

---

## 🔬 Mathematical Derivation of the Simplified Penman-Monteith Equation

The core innovation of the Umbrella Project lies in the mathematical simplification of the FAO-56 Penman-Monteith equation to enable low-cost implementation without sacrificing scientific rigor.

### 1. Starting Point: The Full FAO-56 Penman-Monteith Equation

```latex
ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma(1 + 0.34 u_2)} \quad \cdots (1)
```

**LaTeX notation:**
```
ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma(1 + 0.34 u_2)}
```

This equation relies on several real-time measured variables:
- **R_n**: Net Radiation
- **G**: Soil Heat Flux
- **T**: Temperature
- **u_2**: Wind Speed at 2m height
- **e_s, e_a**: Saturation and actual vapor pressures (derived from temperature and humidity)

---

### 2. Step 1: Assumption of Negligible Daily Soil Heat Flux (G)

For 24-hour calculations, net soil heat flux is minimal (energy absorbed during day ≈ energy released at night).

**Simplification:**
```latex
G \approx 0
```

**Simplified equation:**
```latex
ET_0 = \frac{0.408 \Delta R_n + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma(1 + 0.34 u_2)} \quad \cdots (2)
```

---

### 3. Step 2: Parameterization of Wind Speed (u₂)

To eliminate expensive anemometers, wind speed is replaced with a historical average constant.

**Substitution:**
```latex
u_2 \rightarrow u_{2,const} = 1.39 \text{ m/s}
```

**Code implementation:**
```cpp
const float windSpeed = 1.39;  // m/s
```

**Resulting equation:**
```latex
ET_0 = \frac{0.408 \Delta R_n + \gamma \frac{900}{T + 273} u_{2,const} (e_s - e_a)}{\Delta + \gamma(1 + 0.34 u_{2,const})} \quad \cdots (3)
```

---

### 4. Step 3: Derivation of Net Radiation from Solar Voltage

Net radiation (R_n) is estimated from solar panel voltage instead of using expensive pyranometers.

**Substitution:**
```latex
R_n \rightarrow f(V_{solar})
```

**Code implementation:**
```cpp
float getRn(float solarVoltage) {
    // Calibrated function mapping voltage to radiation
    return calibratedRadiationEstimate(solarVoltage);
}
```

**Resulting equation:**
```latex
ET_0 = \frac{0.408 \Delta f(V_{solar}) + \gamma \frac{900}{T + 273} u_{2,const} (e_s - e_a)}{\Delta + \gamma(1 + 0.34 u_{2,const})} \quad \cdots (4)
```

---

### 5. Step 4: Parameterization of the Psychrometric Constant (γ)

The psychrometric constant depends on atmospheric pressure (altitude-dependent). Pre-calculated constant eliminates need for barometer.

**Substitution:**
```latex
\gamma \rightarrow \gamma_{const}
```

**Code implementation:**
```cpp
const float gamma = 0.000665 * pressure;  // kPa/°C
```

**Final simplified equation:**
```latex
ET_0 = \frac{0.408 \Delta f(V_{solar}) + \gamma_{const} \frac{900}{T + 273} u_{2,const} (e_s - e_a)}{\Delta + \gamma_{const}(1 + 0.34 u_{2,const})} \quad \cdots (5)
```

---

### 6. Conclusion of Derivation

**Equation (5)** represents the final form implemented in the Umbrella Project:

| Component | Source |
|-----------|--------|
| **T, e_s, e_a, Δ** | Live sensor readings (DHT22/BME280) |
| **G** | Constant = 0 (daily approximation) |
| **u_2** | Constant = u_{2,const} (historical average) |
| **γ** | Constant = γ_{const} (altitude-based) |
| **R_n** | Virtual sensor = f(V_{solar}) (solar panel + TEG) |

**Key Achievement:** ~95% hardware cost reduction while maintaining ±15% ET prediction accuracy.

---

## 🌱 Key Features

- **Predictive Irrigation**: Anticipates water needs before plant stress occurs
- **Low-Cost Implementation**: Sub-$50 system using simplified sensor architecture
- **Virtual Radiation Sensor**: Solar panel + TEG replaces expensive pyranometer
- **Environmental Intelligence**: Real-time adaptation to atmospheric conditions
- **Water Efficiency**: 30-40% water savings vs. traditional timer-based systems

---

## 🔧 Technical Specifications

### Hardware Components
- **Temperature/Humidity Sensor**: DHT22 or BME280
- **Pressure Sensor**: BME280 (integrated)
- **Virtual Radiation Sensor**: Solar panel output + Thermoelectric Generator (TEG)
- **Microcontroller**: Low-power embedded system
- **Power**: Solar-powered with battery backup

### Sensor Accuracy
- Temperature: ±0.5°C
- Humidity: ±2-3% RH
- Pressure: ±1 hPa
- Radiation Estimation: ±15%

### System Performance
- ET Prediction Accuracy: ±10-15%
- Irrigation Precision: Milliliter-level
- Water Savings: 30-40% vs. traditional systems
- Power Consumption: Solar-sustainable

---

## 📊 System Variants

### GI Variant (First Generation)
- Proof-of-concept system
- DHT22 sensors
- Basic ET calculation
- Single-zone irrigation

### Sci+ Variant (Advanced Generation)
- 100+ environmental parameters
- BME280 sensors with pressure sensing
- Machine learning integration
- Multi-zone management
- IoT connectivity
- Adaptive algorithms

---

## 📖 Citation

If you use this research or implementation in your work, please cite:

```bibtex
@article{desilva2025umbrella,
  title={The Use of Evapotranspiration Algorithm in Umbrella Project and the Penman-Monteith Equation},
  author={DeSilva, Neksha},
  journal={Research Documentation},
  year={2025},
  month={August},
  url={https://nekshadesilva.com/docs/the-use-of-evapotranspiration-algorithm-in-umbrella-project-and-the-penman-monteith-equation/},
  note={A comprehensive exploration of environmental intelligence, predictive irrigation, and the engineering challenges of implementing the Penman-Monteith equation in autonomous systems}
}
```

**APA Format:**
```
DeSilva, N. (2025, August). The Use of Evapotranspiration Algorithm in Umbrella Project and the Penman-Monteith Equation. Retrieved from https://nekshadesilva.com/docs/the-use-of-evapotranspiration-algorithm-in-umbrella-project-and-the-penman-monteith-equation/
```

**IEEE Format:**
```
N. DeSilva, "The Use of Evapotranspiration Algorithm in Umbrella Project and the Penman-Monteith Equation," Aug. 2025. [Online]. Available: https://nekshadesilva.com/docs/the-use-of-evapotranspiration-algorithm-in-umbrella-project-and-the-penman-monteith-equation/
```

---

## 🔗 Resources

- **Full Research Paper**: [nekshadesilva.com/docs/...](https://nekshadesilva.com/docs/the-use-of-evapotranspiration-algorithm-in-umbrella-project-and-the-penman-monteith-equation/)
- **Presentation PDF**: [Precision Under Constraint](https://nekshadesilva.com/assets/pdf/Precision-Under-Constraint.pdf)
- **Code on GitHub** (Python/C/C++): [github.com/the-umbrella-project/core](https://github.com/the-umbrella-project/core)
- **Author Website**: [nekshadesilva.com](https://nekshadesilva.com)

---

## 📚 References

1. Allen, R. G., Pereira, L. S., Raes, D., & Smith, M. (1998). *Crop evapotranspiration - Guidelines for computing crop water requirements*. FAO Irrigation and drainage paper 56. Food and Agriculture Organization of the United Nations, Rome.

2. Monteith, J. L. (1965). Evaporation and environment. *Symposia of the Society for Experimental Biology, 19*, 205-234.

3. Penman, H. L. (1948). Natural evaporation from open water, bare soil and grass. *Proceedings of the Royal Society of London. Series A, Mathematical and Physical Sciences, 193*(1032), 120-145.

---

## 📄 License

This research documentation is available for academic and educational purposes. For commercial applications, please contact the author.

---

## 👤 Author

**Neksha DeSilva**
- Website: [nekshadesilva.com](https://nekshadesilva.com)
- Research Focus: Environmental Engineering, Autonomous Systems, Agricultural Technology

---

## 🌟 Acknowledgments

This research represents a bridge between theoretical environmental science and practical agricultural automation, demonstrating that scientific precision can be democratized through creative engineering and mathematical rigor.

---

*For the complete research paper with detailed explanations, technical diagrams, and comprehensive analysis, visit the [full documentation](https://nekshadesilva.com/docs/the-use-of-evapotranspiration-algorithm-in-umbrella-project-and-the-penman-monteith-equation/).*
