export interface HardwareSpec {
  component: string;
  role: string;
  parameters: { key: string; value: string; note?: string }[];
  description: string;
  datasheetCaution?: string;
}

export const ESP32_SPEC: HardwareSpec = {
  component: 'ESP-WROOM-32 (ESP32 DevKit V1)',
  role: 'Central Processing & IoT Gateway',
  parameters: [
    { key: 'Core Architecture', value: 'Dual-core Tensilica Xtensa 32-bit LX6' },
    { key: 'Clock Frequency', value: 'Up to 240 MHz (80/160/240 MHz selectable)' },
    { key: 'SRAM', value: '520 KB on-chip SRAM' },
    { key: 'Flash Memory', value: '4 MB SPI Flash' },
    { key: 'Wireless Connectivity', value: 'Wi-Fi 802.11 b/g/n (2.4 GHz) & Bluetooth v4.2 BR/EDR/BLE' },
    { key: 'Hardware UARTs', value: '3 Hardware Serial Interfaces (UART0, UART1, UART2)' },
    { key: 'Operating Voltage', value: '3.3V Logic Level (5V Vin via onboard AMS1117 LDO)' },
    { key: 'ADC Resolution', value: '12-bit SAR ADC (up to 18 channels)' },
    { key: 'RTOS Support', value: 'FreeRTOS preemptive multitasking kernel' },
  ],
  description: 'The ESP32 acts as the embedded telemetry master. It queries the three PZEM-004T energy sensors sequentially over UART using Modbus RTU protocol, packages measurements into JSON payloads, and pushes live packets via WebSockets / REST to the web platform.',
  datasheetCaution: 'GPIO pins are NOT 5V tolerant. PZEM-004T logic side must be powered at 5V for optocoupler saturation, but TX output must be level-shifted or verified safe for ESP32 3.3V RX.'
};

export const PZEM_SPEC: HardwareSpec = {
  component: 'PZEM-004T v3.0 (AC Energy Meter Module)',
  role: 'High-Precision AC Parameter Acquisition (3 Modules for R, Y, B)',
  parameters: [
    { key: 'Voltage Range', value: '80 ~ 260 VAC (Line-to-Neutral True RMS)' },
    { key: 'Current Range', value: '0 ~ 100A (via external 100A:50mA Split-core or Solid CT)' },
    { key: 'Active Power Range', value: '0 ~ 23 kW (0.01W resolution up to 10kW)' },
    { key: 'Energy Range', value: '0 ~ 9999.99 kWh (with onboard non-volatile EEPROM storage)' },
    { key: 'Frequency Range', value: '45 ~ 65 Hz (0.1 Hz resolution)' },
    { key: 'Power Factor Range', value: '0.00 ~ 1.00 (0.01 resolution)' },
    { key: 'Measurement Accuracy', value: 'Class 1.0 (±1.0% accuracy on V, I, P)' },
    { key: 'Communication Protocol', value: 'TTL Serial (Modbus RTU format, default 9600 baud, 8-N-1)' },
    { key: 'Galvanic Isolation', value: 'Dual High-Speed Optocouplers separating high-voltage AC from 5V TTL logic' },
  ],
  description: 'PZEM-004T v3.0 features a dedicated energy metering SoC (V9881D or SD3004) calculating True RMS voltage, current, active power, and accumulating energy in internal hardware registers.',
  datasheetCaution: 'High voltage caution: The AC input terminals connect directly to 230VAC grid lines. Ensure correct polarities, never touch AC terminals when powered, and verify CT secondary is never open-circuited while primary carries current.'
};

export interface VivaQuestion {
  id: number;
  question: string;
  category: 'Measurement' | 'Calculations' | 'Hardware' | 'Power Quality' | 'ML & IoT';
  shortAnswer: string;
  detailedExplanation: string;
  formulaOrCode?: string;
  examinerTip: string;
}

export const VIVA_QUESTIONS: VivaQuestion[] = [
  {
    id: 1,
    question: 'Why cannot we simply calculate the arithmetic average of the three power factors (PFR + PFY + PFB) / 3?',
    category: 'Calculations',
    shortAnswer: 'Because power factor is a weighted ratio of total active work to total apparent capacity, not a scalar average.',
    detailedExplanation: 'In an unbalanced three-phase system, one phase may carry 20 kW at 0.98 PF while another carries only 1 kW at 0.50 PF. Simple arithmetic averaging gives (0.98 + 0.98 + 0.50)/3 = 0.82, which misrepresents the actual system loading. The mathematically correct definition is PF_total = P_total / S_total, where S_total is the scalar sum of phase apparent powers (SR + SY + SB).',
    formulaOrCode: 'PF_total = (P_R + P_Y + P_B) / (V_R*I_R + V_Y*I_Y + V_B*I_B)',
    examinerTip: 'Demonstrate this exact calculation in our Formula Library live during viva to impress the external examiner!'
  },
  {
    id: 2,
    question: 'Does the PZEM-004T directly measure three-phase line-to-line voltage?',
    category: 'Measurement',
    shortAnswer: 'No. Each PZEM-004T measures individual single-phase line-to-neutral (L-N) voltage.',
    detailedExplanation: 'The three modules are connected in a Star (Wye) topology between each phase (R, Y, B) and the common Neutral conductor. Line-to-line voltages (V_RY, V_YB, V_BR) in a balanced system relate by √3 ≈ 1.732 × V_phase, but the PZEM modules strictly acquire Phase voltages. The web platform aggregates these individual measurements.',
    formulaOrCode: 'V_L-L = √3 × V_L-N (for perfectly balanced 120° systems)',
    examinerTip: 'Clarify upfront to the panel that this project avoids fake claims: all three-phase metrics are explicitly calculated in software from 3 single-phase sensor modules.'
  },
  {
    id: 3,
    question: 'What is Voltage Imbalance and why does CEA limit it to 2.0%?',
    category: 'Power Quality',
    shortAnswer: 'It is the maximum deviation of any phase from the average voltage divided by average voltage. Unbalanced voltage creates large negative-sequence currents that overheat motors.',
    detailedExplanation: 'When three-phase voltages are unbalanced, the symmetrical component decomposition reveals a negative-sequence voltage component. Because induction motor negative-sequence impedance is roughly equal to its locked-rotor impedance (very low), even a 2%–3% voltage imbalance can produce 15%–25% negative-sequence current, creating severe rotor overheating and thermal tripping.',
    formulaOrCode: 'V_imb% = (Max |V_phase - V_avg| / V_avg) × 100 <= 2.0% (CEA Standard)',
    examinerTip: 'Use our interactive Fault Injection tool to demonstrate a 5% sag on Phase R, showing the imbalance gauge turn red and health score drop.'
  },
  {
    id: 4,
    question: 'How does the ESP32 communicate with three PZEM-004T modules simultaneously?',
    category: 'Hardware',
    shortAnswer: 'Using Modbus RTU multi-drop addressing over UART, or multiple ESP32 hardware UART channels.',
    detailedExplanation: 'PZEM-004T v3.0 supports Modbus RTU with programmable slave addresses (0x01 to 0xF8). In a bus topology, the modules can share a single UART TX/RX pair with distinct addresses. Alternatively, the ESP32 provides 3 hardware UART peripherals (UART0 for console/boot, UART1 and UART2 with arbitrary GPIO matrix routing) or software serial with FreeRTOS multitasking.',
    formulaOrCode: 'PZEM Address Set Command: 0xF8 0x06 0x00 0x02 0x00 [Addr] [CRC_L] [CRC_H]',
    examinerTip: 'Show our Hardware Architecture section where the Modbus polling pipeline is illustrated.'
  },
  {
    id: 5,
    question: 'How is Neutral Current formed in a 4-wire star distribution system?',
    category: 'Calculations',
    shortAnswer: 'By Kirchhoff\'s Current Law, I_N = -(I_R + I_Y + I_B). In unbalanced systems or systems with triplen harmonics, neutral current is non-zero.',
    detailedExplanation: 'In a balanced 3-phase load with linear currents displaced by 120°, the vector sum equals zero. When single-phase loads (computers, LED drivers, air conditioners) load the phases unequally, the vector sum does not cancel, producing a significant neutral current. Furthermore, 3rd harmonic currents (150 Hz) are in-phase across all three phases and add up directly in the neutral.',
    formulaOrCode: 'I_N = √(I_R² + I_Y² + I_B² - (I_R*I_Y + I_Y*I_B + I_B*I_R))',
    examinerTip: 'Highlight that our platform calculates an estimated neutral current from the three CT measurements without requiring a 4th expensive CT.'
  },
  {
    id: 6,
    question: 'What is the difference between Rule-Based Monitoring and Machine Learning in this project?',
    category: 'ML & IoT',
    shortAnswer: 'Rule-based monitors current limits (e.g. if V < 216V alert). Machine Learning detects subtle progressive drift and forecasts future breaches before they occur.',
    detailedExplanation: 'Rule-based systems are reactive: they fire an alarm only after a threshold is violated. Machine learning (such as time-series regression and moving-window anomaly detection) analyzes multivariate trends—such as creeping contact resistance causing phase voltage to drop as load increases—and warns maintenance personnel hours or days in advance.',
    formulaOrCode: 'Reactive: IF (V < 216) -> ALERT; Predictive: y_pred = β0 + β1*t + ε, P(V < 216 at t+4h) > 0.85',
    examinerTip: 'Emphasize that we clearly label predictive values as simulated forecasts rather than misleadingly claiming live neural networks without hardware TPU support.'
  }
];
