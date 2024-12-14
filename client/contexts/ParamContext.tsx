
import React, { createContext, useContext, useState, useEffect } from 'react';

// This context allows components to set and retrieve a key-value pairs without needing to set query params.
interface ParamContextType {
  setParamKey: (key: string) => void;
  setParamValue: (value: string) => void;
  getParamValue: (key: string) => string | undefined;
  clearParam: (key: string) => void;
}

const ParamContext = createContext<ParamContextType | undefined>(undefined);

export const useParams = () => {
  const context = useContext(ParamContext);
  if (context === undefined) {
    throw new Error('useParams must be used within a ParamsProvider');
  }
  return context;
};

export const ParamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pKey, setPKey] = useState<string | undefined>('');
  const paramMap = new Map<string, string>();

  const setParamKey = (key: string) => {
    console.log('setParamKey:', key);
    console.log('paramMap:', paramMap);
    setPKey(key);
  };

  const setParamValue = (value: string) => {
    console.log('setParamValue:', value);
    console.log('paramMap:', paramMap);
    if (pKey === undefined) {
      return;
    }
    paramMap.set(pKey, value);
  };

  const getParamValue = (key: string) => {
    console.log('getParamValue:', key);
    console.log('paramMap:', paramMap);
    return paramMap.get(key);
  };

  const clearParam = (key: string) => {
    paramMap.delete(key);
  };

  return (
    <ParamContext.Provider value={{ setParamKey, setParamValue, getParamValue, clearParam }}>
      {children}
    </ParamContext.Provider>
  );
};