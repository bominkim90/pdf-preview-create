import { useCallback } from 'react';

export default function useFormFieldSetter(setData) {
  return useCallback(
    (field) => (e) => {
      const val = e.target ? e.target.value : e;
      setData((prev) => ({ ...prev, [field]: val }));
    },
    [setData]
  );
}
