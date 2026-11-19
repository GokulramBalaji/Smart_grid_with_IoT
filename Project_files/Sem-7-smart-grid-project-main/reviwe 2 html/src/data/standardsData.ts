import { PowerQualityStandard } from '../types/power';

export const PRESET_STANDARDS: PowerQualityStandard[] = [
  {
    id: 'INDIA_CEA',
    name: 'India Central Electricity Authority (CEA 2019)',
    authority: 'CEA & State Electricity Regulatory Commissions (SERCs)',
    systemType: 'Industrial',
    // Single-Phase Standard
    nominalVoltage: 230,
    voltageToleranceLower: -6.0,
    voltageToleranceUpper: 6.0,
    // Three-Phase Standard
    nominalLineLineVoltage: 415,
    lineLineToleranceLower: -6.0,
    lineLineToleranceUpper: 6.0,
    // Frequency & Grid Limits
    nominalFrequency: 50.0,
    frequencyToleranceLower: -0.5,
    frequencyToleranceUpper: 0.5,
    minimumPowerFactor: 0.90,
    maxVoltageImbalance: 2.0,
    maxCurrentImbalance: 10.0,
    thdVoltageLimit: 5.0,
    thdCurrentLimit: 8.0,
    neutralSizingRule: 'IS 3043:2018 / CEA Safety Regulations 2010 (100% neutral sizing, continuous solid ground)',
    sourceRegulation: 'CEA (Technical Standards for Connectivity to the Grid) Regulations 2019 & Indian Electricity Rules',
    citationUrl: 'https://cea.nic.in/regulations-category/technical-standards-regulations/'
  },
  {
    id: 'IEC_61000',
    name: 'IEC 61000-4-30 / EN 50160 (International / EU)',
    authority: 'International Electrotechnical Commission (IEC) & CENELEC',
    systemType: 'Distribution',
    // Single-Phase Standard
    nominalVoltage: 230,
    voltageToleranceLower: -10.0,
    voltageToleranceUpper: 10.0,
    // Three-Phase Standard
    nominalLineLineVoltage: 400,
    lineLineToleranceLower: -10.0,
    lineLineToleranceUpper: 10.0,
    // Frequency & Grid Limits
    nominalFrequency: 50.0,
    frequencyToleranceLower: -1.0,
    frequencyToleranceUpper: 1.0,
    minimumPowerFactor: 0.92,
    maxVoltageImbalance: 2.0,
    maxCurrentImbalance: 12.0,
    thdVoltageLimit: 8.0,
    thdCurrentLimit: 10.0,
    neutralSizingRule: 'IEC 60364-5-52 (Neutral conductor sized to at least equal line conductors)',
    sourceRegulation: 'IEC 61000-4-30 Class A/S & EN 50160 Voltage Characteristics',
    citationUrl: 'https://www.iec.ch/'
  },
  {
    id: 'IEEE_519',
    name: 'IEEE 519 / IEEE 1159 (North America)',
    authority: 'Institute of Electrical and Electronics Engineers',
    systemType: 'Commercial',
    // Single-Phase Standard
    nominalVoltage: 120,
    voltageToleranceLower: -5.0,
    voltageToleranceUpper: 5.0,
    // Three-Phase Standard
    nominalLineLineVoltage: 480,
    lineLineToleranceLower: -5.0,
    lineLineToleranceUpper: 5.0,
    // Frequency & Grid Limits
    nominalFrequency: 60.0,
    frequencyToleranceLower: -0.5,
    frequencyToleranceUpper: 0.5,
    minimumPowerFactor: 0.95,
    maxVoltageImbalance: 3.0,
    maxCurrentImbalance: 10.0,
    thdVoltageLimit: 5.0,
    thdCurrentLimit: 8.0,
    neutralSizingRule: 'NEC Article 250 (Full capacity neutral for multiwire branch circuits)',
    sourceRegulation: 'IEEE Std 1159 Monitoring Electric Power Quality & IEEE 519 Harmonics',
    citationUrl: 'https://standards.ieee.org/'
  },
  {
    id: 'UK_GRID',
    name: 'UK ESQCR & Engineering Recommendations',
    authority: 'Ofgem / National Grid ESO',
    systemType: 'Industrial',
    // Single-Phase Standard
    nominalVoltage: 230,
    voltageToleranceLower: -6.0,
    voltageToleranceUpper: 10.0,
    // Three-Phase Standard
    nominalLineLineVoltage: 400,
    lineLineToleranceLower: -6.0,
    lineLineToleranceUpper: 10.0,
    // Frequency & Grid Limits
    nominalFrequency: 50.0,
    frequencyToleranceLower: -0.5,
    frequencyToleranceUpper: 0.5,
    minimumPowerFactor: 0.90,
    maxVoltageImbalance: 2.0,
    maxCurrentImbalance: 10.0,
    thdVoltageLimit: 5.0,
    thdCurrentLimit: 8.0,
    neutralSizingRule: 'BS 7671 IET Wiring Regulations (Full cross-section neutral)',
    sourceRegulation: 'Electricity Safety, Quality and Continuity Regulations (ESQCR)',
    citationUrl: 'https://www.nationalgrideso.com/'
  },
  {
    id: 'CUSTOM',
    name: 'Custom User-Configured Standards',
    authority: 'User Custom Profile',
    systemType: 'Custom',
    // Single-Phase Standard
    nominalVoltage: 230,
    voltageToleranceLower: -5.0,
    voltageToleranceUpper: 5.0,
    // Three-Phase Standard
    nominalLineLineVoltage: 400,
    lineLineToleranceLower: -5.0,
    lineLineToleranceUpper: 5.0,
    // Frequency & Grid Limits
    nominalFrequency: 50.0,
    frequencyToleranceLower: -0.2,
    frequencyToleranceUpper: 0.2,
    minimumPowerFactor: 0.95,
    maxVoltageImbalance: 1.5,
    maxCurrentImbalance: 8.0,
    thdVoltageLimit: 4.0,
    thdCurrentLimit: 6.0,
    neutralSizingRule: 'Project Custom Laboratory Sizing',
    sourceRegulation: 'Custom Laboratory / Project Viva Criteria',
    citationUrl: '#',
    isEditable: true
  }
];
