import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

type PaymentFrequency = 'monthly' | 'yearly' | 'daily' | 'weekly' | 'semi-monthly' | 'bi-weekly' | 'semi-annually';

interface CalculatorState {
  presentValue: string;
  futureValue: string;
  interestRate: string;
  numberOfPeriods: string;
  payment: string;
  paymentFrequency: PaymentFrequency;
}

const frequencyMap: Record<PaymentFrequency, number> = {
  monthly: 12,
  yearly: 1,
  daily: 365,
  weekly: 52,
  'semi-monthly': 24,
  'bi-weekly': 26,
  'semi-annually': 2,
};

const initialState: CalculatorState = {
  presentValue: '',
  futureValue: '',
  interestRate: '',
  numberOfPeriods: '',
  payment: '',
  paymentFrequency: 'monthly',
};

function App() {
  const [state, setState] = useState<CalculatorState>(initialState);
  const [lastSolved, setLastSolved] = useState<keyof CalculatorState | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'paymentFrequency') {
      setState((prevState) => ({ ...prevState, [name]: value as PaymentFrequency }));
    } else {
      // Allow numbers, decimal point, and minus sign
      const sanitizedValue = value.replace(/[^0-9.-]/g, '');
      setState((prevState) => ({ ...prevState, [name]: sanitizedValue }));
    }
  };

  const getEffectiveRate = () => {
    return parseFloat(state.interestRate) / 100 / frequencyMap[state.paymentFrequency];
  };

  const calculateInterestRate = (pv: number, fv: number, n: number, pmt: number): number => {
    const tolerance = 1e-6;
    const maxIterations = 100;
    let r = 0.1; // Initial guess

    for (let i = 0; i < maxIterations; i++) {
      const f = pv * (1 + r) ** n + pmt * ((1 + r) ** n - 1) / r + fv;
      const df = n * pv * (1 + r) ** (n - 1) + pmt * (n * (1 + r) ** (n - 1) * r - ((1 + r) ** n - 1)) / r ** 2;
      
      const newR = r - f / df;
      
      if (Math.abs(newR - r) < tolerance) {
        return newR * frequencyMap[state.paymentFrequency] * 100;
      }
      
      r = newR;
    }

    throw new Error('Interest rate calculation did not converge');
  };

  const solveFor = (field: keyof CalculatorState) => {
    const r = getEffectiveRate();
    const n = parseFloat(state.numberOfPeriods);
    const pv = parseFloat(state.presentValue);
    const fv = -parseFloat(state.futureValue);
    const pmt = parseFloat(state.payment);

    let result: number;

    switch (field) {
      case 'presentValue':
        result = (fv - pmt * ((1 + r) ** n - 1) / r) / (1 + r) ** n;
        break;
      case 'futureValue':
        result = -(pv * (1 + r) ** n + pmt * ((1 + r) ** n - 1) / r);
        break;
      case 'interestRate':
        result = calculateInterestRate(pv, -fv, n, pmt);
        break;
      case 'numberOfPeriods':
        result = Math.log((fv + pmt / r) / (pv + pmt / r)) / Math.log(1 + r);
        break;
      case 'payment':
        result = (fv - pv * (1 + r) ** n) * r / ((1 + r) ** n - 1);
        break;
      default:
        return;
    }

    setState((prevState) => ({ 
      ...prevState, 
      [field]: field === 'interestRate' ? result.toFixed(3) : result.toFixed(2)
    }));
    setLastSolved(field);
  };

  useEffect(() => {
    if (lastSolved) {
      const timer = setTimeout(() => setLastSolved(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastSolved]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 flex items-center text-indigo-600">
          <Calculator className="mr-2" /> Financial Calculator
        </h1>
        {Object.entries(state).map(([key, value]) => (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </label>
            {key === 'paymentFrequency' ? (
              <select
                name={key}
                value={value as string}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                {Object.keys(frequencyMap).map((freq) => (
                  <option key={freq} value={freq}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1).replace(/([A-Z])/g, ' $1')}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  name={key}
                  value={value}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                    lastSolved === key ? 'bg-yellow-100' : ''
                  }`}
                />
                <button
                  onClick={() => solveFor(key as keyof CalculatorState)}
                  className="ml-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  Solve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;