"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type {
  ValidationWizardState,
  Comprobante,
  AutomaticValidation,
  FormalRequirement,
  SubstantialRequirement,
  InputMethod,
} from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { createSubstantialRequirements } from "@/lib/app-content";

const initialState: ValidationWizardState = {
  step: 1,
  inputMethod: "manual",
  comprobante: {},
};

interface ValidationContextType {
  state: ValidationWizardState;
  setInputMethod: (method: InputMethod) => void;
  setComprobante: (data: Partial<Comprobante>) => void;
  setAutomaticValidation: (data: AutomaticValidation) => void;
  setFormalRequirements: (data: FormalRequirement[]) => void;
  setSubstantialRequirements: (data: SubstantialRequirement[]) => void;
  updateSubstantialAnswer: (id: string, respuesta: SubstantialRequirement["respuesta"]) => void;
  setStep: (step: number) => void;
  resetWizard: () => void;
  validationId: string | null;
  setValidationId: (id: string) => void;
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

export function ValidationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ValidationWizardState>(initialState);
  const [validationId, setValidationId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.wizard);
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.wizard, JSON.stringify(state));
  }, [state]);

  const setInputMethod = useCallback((method: InputMethod) => {
    setState((prev) => ({ ...prev, inputMethod: method }));
  }, []);

  const setComprobante = useCallback((data: Partial<Comprobante>) => {
    setState((prev) => ({
      ...prev,
      comprobante: { ...prev.comprobante, ...data },
    }));
  }, []);

  const setAutomaticValidation = useCallback((data: AutomaticValidation) => {
    setState((prev) => ({ ...prev, automaticValidation: data }));
  }, []);

  const setFormalRequirements = useCallback((data: FormalRequirement[]) => {
    setState((prev) => ({ ...prev, formalRequirements: data }));
  }, []);

  const setSubstantialRequirements = useCallback((data: SubstantialRequirement[]) => {
    setState((prev) => ({ ...prev, substantialRequirements: data }));
  }, []);

  const updateSubstantialAnswer = useCallback((id: string, respuesta: SubstantialRequirement["respuesta"]) => {
    setState((prev) => ({
      ...prev,
      substantialRequirements: (prev.substantialRequirements ?? createSubstantialRequirements()).map((req) =>
        req.id === id ? { ...req, respuesta } : req
      ),
    }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const resetWizard = useCallback(() => {
    setState(initialState);
    setValidationId(null);
    sessionStorage.removeItem(STORAGE_KEYS.wizard);
  }, []);

  return (
    <ValidationContext.Provider
      value={{
        state,
        setInputMethod,
        setComprobante,
        setAutomaticValidation,
        setFormalRequirements,
        setSubstantialRequirements,
        updateSubstantialAnswer,
        setStep,
        resetWizard,
        validationId,
        setValidationId,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidation() {
  const context = useContext(ValidationContext);
  if (!context) throw new Error("useValidation must be used within ValidationProvider");
  return context;
}
